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
import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const userId = await requireAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (!(await rateLimit(userId, "inspo-patterns", 60))) return tooMany(res);

  try {
    if (req.method === "GET") {
      const { rows } = await sql`SELECT pool FROM inspo_patterns WHERE user_id = ${userId}`;
      return res.status(200).json({ pool: rows[0]?.pool ?? "" });
    }

    if (req.method === "POST") {
      const { pool } = req.body || {};
      if (typeof pool !== "string" || !validJsonSize({ pool })) {
        return res.status(400).json({ error: "Invalid pool" });
      }
      await sql`
        INSERT INTO inspo_patterns (user_id, pool, updated_at)
        VALUES (${userId}, ${pool}, now())
        ON CONFLICT (user_id) DO UPDATE
        SET pool = EXCLUDED.pool, updated_at = now()
      `;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
