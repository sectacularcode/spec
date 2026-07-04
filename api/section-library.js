// Section library API — Postgres-backed, replaces the Redis
// spec-section-library array blob.
//
// GET  /api/section-library    — list the caller's saved sections
// POST /api/section-library    — { entries: [...] } — batch insert (one
//                                 "Generate" click produces several section
//                                 rows at once), capped at 300 rows.
//
// No delete surface — matches existing behavior, sections are never
// removed individually today, only capped from the tail.
//
// Ids are minted client-side in bulk within a single JS tick
// ("section-" + Date.now() + "-" + index), which is actually a *higher*
// cross-tenant collision surface than one-at-a-time ids elsewhere — same
// ON CONFLICT ... RETURNING collision guard as api/projects.js applies
// per row.

import { requireAuth } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";
import { validId, validJsonSize } from "./_lib/validate.js";
import { sql } from "@vercel/postgres";

const CAP = 300;
// One "Generate" click can produce a section per content block across every
// page of a site — generous enough to never reject a real save, still a
// hard ceiling against an abusive request.
const MAX_ENTRIES_PER_REQUEST = 500;

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const userId = await requireAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (!(await rateLimit(userId, "section-library", 60))) return tooMany(res);

  try {
    if (req.method === "GET") {
      const { rows } = await sql`
        SELECT id, data FROM section_library_entries
        WHERE user_id = ${userId}
        ORDER BY created_at DESC, id DESC
      `;
      return res.status(200).json({ entries: rows.map(r => ({ id: r.id, ...r.data })) });
    }

    if (req.method === "POST") {
      const { entries } = req.body || {};
      const list = Array.isArray(entries) ? entries : [];
      if (list.length === 0 || list.length > MAX_ENTRIES_PER_REQUEST) {
        return res.status(400).json({ error: "Invalid entries" });
      }

      // Validate everything up front (fail closed before any DB call,
      // unlike a mid-loop check which could let earlier valid rows insert
      // before hitting a later invalid one).
      const ids = [];
      const userIds = [];
      const dataArr = [];
      const seen = new Set();
      for (const entry of list) {
        const { id, ...rest } = entry || {};
        if (!validId(id) || !validJsonSize(rest)) {
          return res.status(400).json({ error: "Invalid entry" });
        }
        // A duplicate id within the same batch would otherwise be
        // misreported as a cross-tenant collision below — ON CONFLICT DO
        // NOTHING skips the second occurrence as if it collided with
        // another user's row, not because it's a dupe of the first.
        if (seen.has(id)) return res.status(400).json({ error: "Duplicate id in request" });
        seen.add(id);
        ids.push(id);
        userIds.push(userId);
        // Pre-stringify rather than relying on the driver's array-of-
        // objects auto-serialization path for the jsonb[] bind below.
        dataArr.push(JSON.stringify(rest));
      }

      const { rows } = await sql`
        INSERT INTO section_library_entries (id, user_id, data)
        SELECT * FROM unnest(${ids}::text[], ${userIds}::text[], ${dataArr}::jsonb[])
          AS t(id, user_id, data)
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `;
      const insertedSet = new Set(rows.map(r => r.id));
      const inserted = ids.filter(id => insertedSet.has(id));
      const collisions = ids.filter(id => !insertedSet.has(id)).map(id => ({ id }));

      // Cap at 300 most recent rows for this user.
      await sql`
        DELETE FROM section_library_entries
        WHERE user_id = ${userId} AND id NOT IN (
          SELECT id FROM section_library_entries
          WHERE user_id = ${userId}
          ORDER BY created_at DESC, id DESC
          LIMIT ${CAP}
        )
      `;

      return res.status(200).json({ inserted, collisions });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
