// Template library API — Postgres-backed, replaces the Redis
// spec-template-library array blob.
//
// GET  /api/template-library   — list the caller's saved builds
// POST /api/template-library   — { entry } — atomic server-side dedup
//                                 (replaces any existing entry for the
//                                 same client+date+source) + insert,
//                                 capped at 50 rows.
// DELETE /api/template-library?id=xxx — remove one entry
//
// The old client-driven pattern was read-whole-array -> filter -> write-
// whole-array, which is itself a smaller instance of the write-race bug
// family. Doing the dedup as a DELETE immediately followed by an INSERT
// in the same request removes that read-modify-write window entirely.

import { requireAuth } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";
import { validId, validText, validJsonSize } from "./_lib/validate.js";
import { logError } from "./_lib/errorLog.js";
import { sql } from "@vercel/postgres";

const CAP = 50;

// Self-healing, matching db/schema.sql's template_library_entries
// definition exactly.
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS template_library_entries (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      client     TEXT,
      entry_date TEXT,
      source     TEXT,
      data       JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_template_library_user_id ON template_library_entries(user_id)`;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const userId = await requireAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (!(await rateLimit(userId, "template-library", 60))) return tooMany(res);

  try {
    await ensureTable();

    if (req.method === "GET") {
      const { rows } = await sql`
        SELECT id, data FROM template_library_entries
        WHERE user_id = ${userId}
        ORDER BY created_at DESC, id DESC
      `;
      return res.status(200).json({ entries: rows.map(r => ({ id: r.id, ...r.data })) });
    }

    if (req.method === "POST") {
      const { entry } = req.body || {};
      const { id, client, date, source, ...rest } = entry || {};
      if (!validId(id) || !validText(client) || !validText(date, 32) || !validText(source, 32) || !validJsonSize(rest)) {
        return res.status(400).json({ error: "Invalid entry" });
      }

      // Dedup (replace any existing entry for the same client+date+source)
      // and insert are combined into one statement via a data-modifying
      // CTE — the DELETE runs for its side effect only (never referenced),
      // which Postgres never elides, so this is one round trip instead of
      // two. Safe even in the near-impossible case of the deleted and
      // inserted rows sharing an id: either order produces a deterministic
      // outcome already handled below (successful replace, or the existing
      // collision check firing) — never data corruption.
      const { rows } = await sql`
        WITH dedup AS (
          DELETE FROM template_library_entries
          WHERE user_id = ${userId} AND client = ${client} AND entry_date = ${date} AND source = ${source}
          RETURNING id
        )
        INSERT INTO template_library_entries (id, user_id, client, entry_date, source, data)
        VALUES (${id}, ${userId}, ${client}, ${date}, ${source}, ${rest})
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `;
      if (rows.length === 0) {
        return res.status(409).json({ error: "id_collision" });
      }

      // Cap at 50 most recent rows for this user.
      await sql`
        DELETE FROM template_library_entries
        WHERE user_id = ${userId} AND id NOT IN (
          SELECT id FROM template_library_entries
          WHERE user_id = ${userId}
          ORDER BY created_at DESC, id DESC
          LIMIT ${CAP}
        )
      `;

      return res.status(200).json({ ok: true, id });
    }

    if (req.method === "DELETE") {
      const id = req.query.id;
      if (!validId(id)) return res.status(400).json({ error: "Invalid id" });
      await sql`DELETE FROM template_library_entries WHERE id = ${id} AND user_id = ${userId}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    await logError("template-library", req.method, userId, 500, err.message);
    return res.status(500).json({ error: err.message });
  }
}
