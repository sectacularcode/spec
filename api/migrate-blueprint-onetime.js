// ONE-TIME MIGRATION — copies existing per-user Redis blueprint-draft
// session state, saved-draft snapshots, and inspo pattern pools
// (spec:data:{userId}:spec-blueprint-draft, spec:data:{userId}:spec-
// blueprint-drafts, spec:data:{userId}:spec-inspo-patterns) into their
// Postgres tables.
//
// DELETE THIS FILE once you've confirmed the migration succeeded and the
// app is running on the Postgres-backed api/blueprint-drafts.js and
// api/inspo-patterns.js.
//
// Usage: POST /api/migrate-blueprint-onetime with a valid Clerk session
// belonging to a Postgres-backed admin. Safe to run more than once —
// every write is collision-guarded and idempotent per source entry.

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

async function scanKeys(pattern) {
  let cursor = 0;
  let allKeys = [];
  do {
    const res = await fetch(
      `${KV_URL}/scan/${cursor}?match=${encodeURIComponent(pattern)}&count=100`,
      { headers: { Authorization: `Bearer ${KV_TOKEN}` } }
    );
    const data = await res.json();
    const result = data.result || [];
    cursor = result[0] ?? 0;
    allKeys = allKeys.concat(result[1] || []);
  } while (cursor !== 0 && cursor !== "0");
  return allKeys;
}

function userIdFromKey(key, suffix) {
  return key.slice("spec:data:".length, key.length - (":" + suffix).length);
}

function freshId(prefix) {
  return prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
}

function sessionDraftId(userId) {
  return "session:" + userId;
}

async function migrateSessionDrafts() {
  const keys = await scanKeys("spec:data:*:spec-blueprint-draft");
  let migrated = 0;
  const skipped = [];

  for (const key of keys) {
    const userId = userIdFromKey(key, "spec-blueprint-draft");
    const draft = await kvGet(key);
    if (!draft || typeof draft !== "object") { skipped.push({ userId, reason: "not an object" }); continue; }

    await sql`
      INSERT INTO blueprint_drafts (id, user_id, data, updated_at)
      VALUES (${sessionDraftId(userId)}, ${userId}, ${draft}, now())
      ON CONFLICT (id) DO UPDATE
      SET data = EXCLUDED.data, updated_at = now()
      WHERE blueprint_drafts.user_id = ${userId}
    `;
    migrated++;
  }

  return { keysScanned: keys.length, migrated, skipped };
}

async function migrateDraftSnapshots() {
  const keys = await scanKeys("spec:data:*:spec-blueprint-drafts");
  let migrated = 0;
  const collisionsRemapped = [];
  const skipped = [];

  for (const key of keys) {
    const userId = userIdFromKey(key, "spec-blueprint-drafts");
    const arr = await kvGet(key);
    if (!Array.isArray(arr)) { skipped.push({ userId, reason: "not an array" }); continue; }

    for (const entry of arr) {
      const { id, clientName, ...rest } = entry || {};
      if (!id || !clientName) { skipped.push({ userId, id: id || null, reason: "malformed entry" }); continue; }
      let insertId = id;
      let inserted = false;
      for (let attempt = 0; attempt < MAX_ID_RETRIES && !inserted; attempt++) {
        if (insertId === sessionDraftId(userId)) insertId = freshId("draft"); // avoid colliding with the session sentinel
        const { rows } = await sql`
          INSERT INTO blueprint_drafts (id, user_id, client_name, data)
          VALUES (${insertId}, ${userId}, ${clientName}, ${rest})
          ON CONFLICT (id) DO NOTHING
          RETURNING id
        `;
        if (rows.length > 0) { inserted = true; }
        else {
          const newId = freshId("draft");
          if (insertId !== id) collisionsRemapped.pop();
          collisionsRemapped.push({ userId, oldId: id, newId });
          insertId = newId;
        }
      }
      if (inserted) migrated++;
      else skipped.push({ userId, id, reason: "exhausted id retries" });
    }

    await sql`
      DELETE FROM blueprint_drafts
      WHERE user_id = ${userId} AND id <> ${sessionDraftId(userId)} AND id NOT IN (
        SELECT id FROM blueprint_drafts
        WHERE user_id = ${userId} AND id <> ${sessionDraftId(userId)}
        ORDER BY created_at DESC, id DESC LIMIT 20
      )
    `;
  }

  return { keysScanned: keys.length, migrated, collisionsRemapped, skipped };
}

async function migrateInspoPatterns() {
  const keys = await scanKeys("spec:data:*:spec-inspo-patterns");
  let migrated = 0;
  const skipped = [];

  for (const key of keys) {
    const userId = userIdFromKey(key, "spec-inspo-patterns");
    const parsed = await kvGet(key);
    const pool = parsed && typeof parsed.pool === "string" ? parsed.pool : null;
    if (pool === null) { skipped.push({ userId, reason: "no pool string" }); continue; }

    await sql`
      INSERT INTO inspo_patterns (user_id, pool, updated_at)
      VALUES (${userId}, ${pool}, now())
      ON CONFLICT (user_id) DO UPDATE
      SET pool = EXCLUDED.pool, updated_at = now()
    `;
    migrated++;
  }

  return { keysScanned: keys.length, migrated, skipped };
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
    const [sessionDrafts, draftSnapshots, inspoPatterns] = await Promise.all([
      migrateSessionDrafts(),
      migrateDraftSnapshots(),
      migrateInspoPatterns(),
    ]);

    return res.status(200).json({ ok: true, sessionDrafts, draftSnapshots, inspoPatterns });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
