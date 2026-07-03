// Keyword builds API — Postgres-backed, replaces the Redis
// spec-keyword-builds array blob.
//
// GET  /api/keyword-builds   — list the caller's keyword-generated builds
// POST /api/keyword-builds   — { entry } — atomic server-side dedup
//                               (replaces any existing entry for the same
//                               keywords+date) + insert, capped at 50 rows.
// DELETE /api/keyword-builds?id=xxx — remove one entry

import { requireAuth } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";
import { validId, validText, validJsonSize } from "./_lib/validate.js";
import { sql } from "@vercel/postgres";

const CAP = 50;

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const userId = await requireAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (!(await rateLimit(userId, "keyword-builds", 60))) return tooMany(res);

  try {
    if (req.method === "GET") {
      const { rows } = await sql`
        SELECT id, data FROM keyword_builds
        WHERE user_id = ${userId}
        ORDER BY created_at DESC, id DESC
      `;
      return res.status(200).json({ entries: rows.map(r => ({ id: r.id, ...r.data })) });
    }

    if (req.method === "POST") {
      const { entry } = req.body || {};
      const { id, keywords, date, ...rest } = entry || {};
      if (!validId(id) || !validText(keywords) || !validText(date, 32) || !validJsonSize(rest)) {
        return res.status(400).json({ error: "Invalid entry" });
      }

      // Dedup (replace any existing entry for the same keywords+date) and
      // insert combined into one statement via a data-modifying CTE — see
      // api/template-library.js for the full reasoning on why this is safe.
      const { rows } = await sql`
        WITH dedup AS (
          DELETE FROM keyword_builds
          WHERE user_id = ${userId} AND keywords = ${keywords} AND build_date = ${date}
          RETURNING id
        )
        INSERT INTO keyword_builds (id, user_id, keywords, build_date, data)
        VALUES (${id}, ${userId}, ${keywords}, ${date}, ${rest})
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `;
      if (rows.length === 0) {
        return res.status(409).json({ error: "id_collision" });
      }

      // Cap at 50 most recent rows for this user.
      await sql`
        DELETE FROM keyword_builds
        WHERE user_id = ${userId} AND id NOT IN (
          SELECT id FROM keyword_builds
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
      await sql`DELETE FROM keyword_builds WHERE id = ${id} AND user_id = ${userId}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
