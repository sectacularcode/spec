// GET  /api/usage-limits             — admin/manager only: list all configured limits
// POST /api/usage-limits              — admin/manager only: { scope: "user"|"client", scopeId, monthlyLimitCents }
// DELETE /api/usage-limits?scope=&scopeId=  — admin/manager only: remove a limit
//
// Reporting-only for now — nothing currently reads these limits to block a
// request. See db/schema.sql and project memory for the enforcement plan.

import { requireAuth, getProfile } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";
import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const requesterId = await requireAuth(req);
  if (!requesterId) return res.status(401).json({ error: "Unauthorized" });

  const profile = await getProfile(requesterId);
  if (!["admin", "manager"].includes(profile.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (!(await rateLimit(requesterId, "usage-limits", 30))) return tooMany(res);

  try {
    if (req.method === "GET") {
      const { rows } = await sql`
        SELECT scope, scope_id, monthly_limit_cents, updated_by, updated_at
        FROM usage_limits ORDER BY scope, scope_id
      `;
      return res.status(200).json({
        limits: rows.map(r => ({
          scope: r.scope,
          scopeId: r.scope_id,
          monthlyLimitCents: r.monthly_limit_cents,
          updatedBy: r.updated_by,
          updatedAt: r.updated_at,
        })),
      });
    }

    if (req.method === "POST") {
      const { scope, scopeId, monthlyLimitCents } = req.body || {};
      if (!["user", "client"].includes(scope)) return res.status(400).json({ error: "scope must be 'user' or 'client'" });
      if (!scopeId || typeof scopeId !== "string") return res.status(400).json({ error: "Missing scopeId" });
      const limit = parseInt(monthlyLimitCents, 10);
      if (!Number.isFinite(limit) || limit < 0) return res.status(400).json({ error: "monthlyLimitCents must be a non-negative integer" });

      await sql`
        INSERT INTO usage_limits (scope, scope_id, monthly_limit_cents, updated_by, updated_at)
        VALUES (${scope}, ${scopeId}, ${limit}, ${requesterId}, now())
        ON CONFLICT (scope, scope_id) DO UPDATE
        SET monthly_limit_cents = EXCLUDED.monthly_limit_cents, updated_by = EXCLUDED.updated_by, updated_at = now()
      `;
      return res.status(200).json({ ok: true });
    }

    if (req.method === "DELETE") {
      const { scope, scopeId } = req.query;
      if (!["user", "client"].includes(scope) || !scopeId) return res.status(400).json({ error: "Missing or invalid scope/scopeId" });
      await sql`DELETE FROM usage_limits WHERE scope = ${scope} AND scope_id = ${scopeId}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
