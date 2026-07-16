// Template Studio projects API — Postgres-backed, replaces the Redis
// `projects` array blob at spec:data:{userId}:projects.
//
// GET  /api/projects   — list all of the caller's projects
// POST /api/projects   — { upserts: [{id, data}], deletes: [id] } — batched
//                         per-row writes (not a whole-array rewrite), so two
//                         tabs editing different projects no longer clobber
//                         each other.
//
// Security model:
// - Auth via verified Clerk JWT (Authorization: Bearer <token>). No
//   client-supplied user IDs.
// - `id` is a bare global PRIMARY KEY (not namespaced per-user like the old
//   Redis key), so a client-generated id collision across two different
//   users is possible, if unlikely. The upsert is scoped with
//   `WHERE user_id = $userId` on the ON CONFLICT arm — a collision with
//   another user's row is reported back as `collisions`, never silently
//   overwritten. Do not remove this guard; it is load-bearing, not
//   defensive dead code.

import { requireAuth } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";
import { logError } from "./_lib/errorLog.js";
import { sql } from "./_lib/db.js";

const MAX_ID_LENGTH = 64;
const MAX_VALUE_BYTES = 1024 * 1024; // 1MB per project, matching api/storage.js

function validId(id) {
  return typeof id === "string" && id.length > 0 && id.length <= MAX_ID_LENGTH;
}

function validData(data) {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return false;
  return Buffer.byteLength(JSON.stringify(data), "utf8") <= MAX_VALUE_BYTES;
}

// Self-healing, matching db/schema.sql's projects definition exactly.
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      data       JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)`;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const userId = await requireAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (!(await rateLimit(userId, "projects", 300))) return tooMany(res);

  try {
    await ensureTable();

    if (req.method === "GET") {
      const { rows } = await sql`
        SELECT id, data, updated_at FROM projects
        WHERE user_id = ${userId}
        ORDER BY created_at ASC
      `;
      const projects = rows.map(r => ({ id: r.id, ...r.data, updatedAt: r.updated_at }));
      return res.status(200).json({ projects });
    }

    if (req.method === "POST") {
      const { upserts, deletes } = req.body || {};
      const upsertList = Array.isArray(upserts) ? upserts : [];
      const deleteList = Array.isArray(deletes) ? deletes : [];

      // Validate everything up front (fail closed before any DB call).
      const ids = [];
      const userIds = [];
      const dataArr = [];
      const seenUpsertIds = new Set();
      for (const item of upsertList) {
        const { id, data } = item || {};
        if (!validId(id) || !validData(data)) {
          return res.status(400).json({ error: "Invalid upsert entry" });
        }
        // A duplicate id within the same batch would otherwise be
        // misreported as a cross-tenant collision below.
        if (seenUpsertIds.has(id)) return res.status(400).json({ error: "Duplicate id in upserts" });
        seenUpsertIds.add(id);
        ids.push(id);
        userIds.push(userId);
        // Pre-stringify rather than relying on the driver's array-of-
        // objects auto-serialization path for the array bind below.
        dataArr.push(JSON.stringify(data));
      }
      for (const id of deleteList) {
        if (!validId(id)) return res.status(400).json({ error: "Invalid delete id" });
      }

      let upserted = [];
      let collisions = [];
      if (ids.length > 0) {
        const { rows } = await sql`
          INSERT INTO projects (id, user_id, data, updated_at)
          SELECT id, user_id, data::jsonb, now()
          FROM unnest(${ids}::text[], ${userIds}::text[], ${dataArr}::text[])
            AS t(id, user_id, data)
          ON CONFLICT (id) DO UPDATE
          SET data = EXCLUDED.data, updated_at = now()
          WHERE projects.user_id = ${userId}
          RETURNING id
        `;
        const upsertedSet = new Set(rows.map(r => r.id));
        upserted = ids.filter(id => upsertedSet.has(id));
        collisions = ids.filter(id => !upsertedSet.has(id)).map(id => ({ id }));
      }

      let deleted = [];
      if (deleteList.length > 0) {
        const { rows } = await sql`
          DELETE FROM projects
          WHERE user_id = ${userId} AND id = ANY(${deleteList}::text[])
          RETURNING id
        `;
        deleted = rows.map(r => r.id);
      }

      return res.status(200).json({ upserted, collisions, deleted });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    await logError("projects", req.method, userId, 500, err.message);
    return res.status(500).json({ error: err.message });
  }
}
