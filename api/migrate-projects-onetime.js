// ONE-TIME MIGRATION — copies existing per-user Redis project arrays
// (spec:data:{userId}:projects) into the new Postgres `projects` table.
//
// DELETE THIS FILE once you've confirmed the migration succeeded and the
// app is running on the Postgres-backed api/projects.js. It has no purpose
// after that point and is one more thing that can access both data stores.
//
// Usage: POST /api/migrate-projects-onetime with a valid Clerk session
// belonging to a Postgres-backed admin (profiles/roles are already stable
// on Postgres from Stage 1, so — unlike that stage's migration script —
// there's no chicken-and-egg problem here; getProfile() is safe to trust).
// Safe to run more than once — every write is an upsert (or a collision-
// safe insert-with-remap, see below).
//
// Does NOT touch the legacy flat "projects" key (pre-namespacing, shared/
// ambiguous, no reliable userId to attribute it to) — that's a separate,
// deferred decision. Only namespaced spec:data:{userId}:projects keys are
// migrated.

import { requireAuth, getProfile } from "./_lib/auth.js";
import { sql } from "@vercel/postgres";

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const MAX_ID_RETRIES = 5;

async function kvGet(key) {
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  const data = await res.json();
  return data.result ? JSON.parse(data.result) : null;
}

function freshId() {
  return Math.random().toString(36).slice(2, 9);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const requesterId = await requireAuth(req);
  if (!requesterId) return res.status(401).json({ error: "Unauthorized" });

  const requesterProfile = await getProfile(requesterId);
  if (requesterProfile.role !== "admin") {
    return res.status(403).json({ error: "Forbidden — admin only" });
  }

  if (!KV_URL || !KV_TOKEN) {
    return res.status(500).json({ error: "KV not configured" });
  }

  try {
    // Scan every spec:data:*:projects key out of Redis
    let cursor = 0;
    let allKeys = [];
    do {
      const scanRes = await fetch(
        `${KV_URL}/scan/${cursor}?match=${encodeURIComponent("spec:data:*:projects")}&count=100`,
        { headers: { Authorization: `Bearer ${KV_TOKEN}` } }
      );
      const scanData = await scanRes.json();
      const result = scanData.result || [];
      cursor = result[0] ?? 0;
      allKeys = allKeys.concat(result[1] || []);
    } while (cursor !== 0 && cursor !== "0");

    let totalProjectsMigrated = 0;
    const collisionsRemapped = [];
    const skipped = [];

    for (const key of allKeys) {
      const userId = key.replace(/^spec:data:/, "").replace(/:projects$/, "");
      const projects = await kvGet(key);
      if (!Array.isArray(projects)) { skipped.push({ userId, reason: "not an array" }); continue; }

      for (const proj of projects) {
        const { id, ...rest } = proj || {};
        if (!id || !Array.isArray(rest.pages)) {
          skipped.push({ userId, id: id || null, reason: "malformed project" });
          continue;
        }

        let insertId = id;
        let inserted = false;
        for (let attempt = 0; attempt < MAX_ID_RETRIES && !inserted; attempt++) {
          const { rows } = await sql`
            INSERT INTO projects (id, user_id, data)
            VALUES (${insertId}, ${userId}, ${rest})
            ON CONFLICT (id) DO NOTHING
            RETURNING id
          `;
          if (rows.length > 0) {
            inserted = true;
          } else {
            const newId = freshId();
            if (insertId !== id) collisionsRemapped.pop(); // drop the previous failed attempt's record
            collisionsRemapped.push({ userId, oldId: id, newId });
            insertId = newId;
          }
        }

        if (inserted) {
          totalProjectsMigrated++;
        } else {
          skipped.push({ userId, id, reason: "exhausted id retries" });
        }
      }
    }

    return res.status(200).json({
      ok: true,
      totalUsersScanned: allKeys.length,
      totalProjectsMigrated,
      collisionsRemapped,
      skipped,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
