// Blueprint drafts API — Postgres-backed, replaces two Redis keys:
// spec-blueprint-draft (singular, current in-progress session) and
// spec-blueprint-drafts (plural, explicitly-saved snapshots).
//
// Both live in the same `blueprint_drafts` table, disambiguated by id
// scheme: the session row uses a deterministic id ("session:{userId}"),
// collision-proof by construction since it embeds the tenant boundary.
// Saved snapshots use client-generated "draft-{timestamp}" ids and get
// the same cross-tenant collision guard as api/projects.js.
//
// GET  /api/blueprint-drafts?session=1  — fetch the current session row
// GET  /api/blueprint-drafts            — list saved snapshots (session row excluded)
// POST /api/blueprint-drafts            — { session: true, data } upserts the
//                                          session row, OR { entry: {clientName, data} }
//                                          upserts a saved snapshot (update-in-place
//                                          if same client+day, else insert new)
// DELETE /api/blueprint-drafts?session=1     — clear the session row
// DELETE /api/blueprint-drafts?id=xxx        — remove one saved snapshot

import { requireAuth } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";
import { validId, validText, validJsonSize } from "./_lib/validate.js";
import { logError } from "./_lib/errorLog.js";
import { sql } from "./_lib/db.js";

const SNAPSHOT_CAP = 20;

function sessionDraftId(userId) {
  return "session:" + userId;
}

// Self-healing, matching db/schema.sql's blueprint_drafts definition
// exactly, including its user_id index — see api/brand-styles.js's history
// for why this can't depend on a one-off migration having actually run.
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS blueprint_drafts (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      client_name TEXT,
      data        JSONB NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_blueprint_drafts_user_id ON blueprint_drafts(user_id)`;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const userId = await requireAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const isSession = req.method === "GET" || req.method === "DELETE"
    ? req.query.session === "1"
    : req.body?.session === true;

  // Separate rate-limit buckets — the session path is an 800ms-debounced
  // autosave (frequent), the snapshot path is a rare discrete "Generate"
  // action. Sharing one bucket would let either starve the other.
  const bucket = isSession ? "blueprint-drafts-session" : "blueprint-drafts-snapshot";
  const limit = isSession ? 200 : 30;
  if (!(await rateLimit(userId, bucket, limit))) return tooMany(res);

  try {
    await ensureTable();

    if (req.method === "GET") {
      if (isSession) {
        const { rows } = await sql`
          SELECT data FROM blueprint_drafts WHERE id = ${sessionDraftId(userId)} AND user_id = ${userId}
        `;
        return res.status(200).json({ data: rows[0]?.data ?? null });
      }
      const { rows } = await sql`
        SELECT id, client_name, data, updated_at FROM blueprint_drafts
        WHERE user_id = ${userId} AND id <> ${sessionDraftId(userId)}
        ORDER BY created_at DESC, id DESC
        LIMIT ${SNAPSHOT_CAP}
      `;
      return res.status(200).json({
        drafts: rows.map(r => ({ id: r.id, clientName: r.client_name, ...r.data, updatedAt: r.updated_at })),
      });
    }

    if (req.method === "POST") {
      if (isSession) {
        const { data } = req.body || {};
        if (!validJsonSize(data)) return res.status(400).json({ error: "Invalid data" });
        const id = sessionDraftId(userId);
        const { rows } = await sql`
          INSERT INTO blueprint_drafts (id, user_id, data, updated_at)
          VALUES (${id}, ${userId}, ${data}, now())
          ON CONFLICT (id) DO UPDATE
          SET data = EXCLUDED.data, updated_at = now()
          WHERE blueprint_drafts.user_id = ${userId}
          RETURNING id
        `;
        if (rows.length === 0) return res.status(500).json({ error: "session_id_scheme_violation" });
        return res.status(200).json({ ok: true });
      }

      const { entry } = req.body || {};
      const { clientName, data } = entry || {};
      if (!validText(clientName) || !validJsonSize(data)) {
        return res.status(400).json({ error: "Invalid entry" });
      }

      // Same client, same calendar day, not the session row -> update in place.
      const { rows: existingRows } = await sql`
        SELECT id FROM blueprint_drafts
        WHERE user_id = ${userId} AND client_name = ${clientName}
          AND created_at::date = current_date AND id <> ${sessionDraftId(userId)}
        LIMIT 1
      `;

      if (existingRows.length > 0) {
        await sql`
          UPDATE blueprint_drafts SET data = ${data}, updated_at = now()
          WHERE id = ${existingRows[0].id} AND user_id = ${userId}
        `;
        return res.status(200).json({ ok: true, id: existingRows[0].id });
      }

      const id = "draft-" + Date.now();
      if (!validId(id)) return res.status(500).json({ error: "id_generation_failed" });
      const { rows } = await sql`
        INSERT INTO blueprint_drafts (id, user_id, client_name, data)
        VALUES (${id}, ${userId}, ${clientName}, ${data})
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `;
      if (rows.length === 0) return res.status(409).json({ error: "id_collision" });

      // Cap saved snapshots at 20 most recent, excluding the session row.
      await sql`
        DELETE FROM blueprint_drafts
        WHERE user_id = ${userId} AND id <> ${sessionDraftId(userId)} AND id NOT IN (
          SELECT id FROM blueprint_drafts
          WHERE user_id = ${userId} AND id <> ${sessionDraftId(userId)}
          ORDER BY created_at DESC, id DESC
          LIMIT ${SNAPSHOT_CAP}
        )
      `;

      return res.status(200).json({ ok: true, id });
    }

    if (req.method === "DELETE") {
      if (isSession) {
        await sql`DELETE FROM blueprint_drafts WHERE id = ${sessionDraftId(userId)} AND user_id = ${userId}`;
        return res.status(200).json({ ok: true });
      }
      const id = req.query.id;
      if (!validId(id)) return res.status(400).json({ error: "Invalid id" });
      await sql`DELETE FROM blueprint_drafts WHERE id = ${id} AND user_id = ${userId}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    await logError("blueprint-drafts", req.method, userId, 500, err.message);
    return res.status(500).json({ error: err.message });
  }
}
