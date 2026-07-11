// Inspo patterns API — Postgres-backed, replaces the Redis
// spec-inspo-patterns key. One row per user (PK is user_id itself),
// mirrors api/user-role.js's getProfile()/profiles pattern — no
// collision risk, simple upsert.
//
// The stored value is a single pre-merged string (pipe-delimited scraped-
// site pattern notes built by buildInspoContext()), not an array, despite
// the column's `DEFAULT '[]'::jsonb`. The client contract is
// { pool: "the string" } — preserve that shape in the response.
//
// GET  /api/inspo-patterns  — { pool: string }
// POST /api/inspo-patterns  — { pool: string }

import { requireAuth } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";
import { validJsonSize } from "./_lib/validate.js";
import { logError } from "./_lib/errorLog.js";
import { sql } from "@vercel/postgres";

// Self-healing, matching db/schema.sql's inspo_patterns definition exactly.
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS inspo_patterns (
      user_id    TEXT PRIMARY KEY,
      pool       JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const userId = await requireAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (!(await rateLimit(userId, "inspo-patterns", 60))) return tooMany(res);

  try {
    await ensureTable();

    if (req.method === "GET") {
      const { rows } = await sql`SELECT pool FROM inspo_patterns WHERE user_id = ${userId}`;
      return res.status(200).json({ pool: rows[0]?.pool ?? "" });
    }

    if (req.method === "POST") {
      const { pool } = req.body || {};
      if (typeof pool !== "string" || !validJsonSize({ pool })) {
        return res.status(400).json({ error: "Invalid pool" });
      }
      // `pool` is a plain string, not an object — @vercel/postgres only
      // auto-JSON-encodes objects for JSONB columns (confirmed in the
      // installed driver source: strings take a raw .toString() path, not
      // the JSON.stringify path), so a bare string here would fail
      // Postgres's jsonb cast for any value that isn't already valid JSON
      // syntax. Explicitly encode it so it round-trips as a JSON string
      // scalar — the driver still auto-parses it back to a plain JS string
      // on read, so the GET path needs no corresponding change.
      await sql`
        INSERT INTO inspo_patterns (user_id, pool, updated_at)
        VALUES (${userId}, ${JSON.stringify(pool)}::jsonb, now())
        ON CONFLICT (user_id) DO UPDATE
        SET pool = EXCLUDED.pool, updated_at = now()
      `;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    await logError("inspo-patterns", req.method, userId, 500, err.message);
    return res.status(500).json({ error: err.message });
  }
}
