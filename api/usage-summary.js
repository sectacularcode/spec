// GET /api/usage-summary — admin/manager only.
// Returns current-month usage totals, grouped by user account and
// separately by client/brand, plus any configured limits for comparison.
// Reporting-only — this endpoint doesn't enforce anything, just reads.

import { requireAuth, getProfile } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";
import { sql } from "@vercel/postgres";

const CLERK_SECRET = process.env.CLERK_SECRET_KEY;

async function clerkGetUsers(userIds) {
  if (!CLERK_SECRET || !userIds.length) return {};
  try {
    const params = userIds.map(id => `user_id[]=${encodeURIComponent(id)}`).join("&");
    const res = await fetch(`https://api.clerk.com/v1/users?${params}&limit=100`, {
      headers: { Authorization: `Bearer ${CLERK_SECRET}` },
    });
    if (!res.ok) return {};
    const data = await res.json();
    const map = {};
    for (const u of data) {
      const primaryEmail = u.email_addresses?.find(e => e.id === u.primary_email_address_id);
      const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || null;
      map[u.id] = { name, email: primaryEmail?.email_address || null };
    }
    return map;
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const requesterId = await requireAuth(req);
  if (!requesterId) return res.status(401).json({ error: "Unauthorized" });

  const profile = await getProfile(requesterId);
  if (!["admin", "manager"].includes(profile.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (!(await rateLimit(requesterId, "usage-summary", 30))) return tooMany(res);

  try {
    // Current calendar month, in UTC — matches created_at's TIMESTAMPTZ storage.
    const { rows: byUser } = await sql`
      SELECT user_id,
             COUNT(*)::int AS call_count,
             COALESCE(SUM(input_tokens), 0)::int AS input_tokens,
             COALESCE(SUM(output_tokens), 0)::int AS output_tokens,
             COALESCE(SUM(cost_cents), 0)::int AS cost_cents
      FROM api_usage
      WHERE created_at >= date_trunc('month', now())
      GROUP BY user_id
      ORDER BY cost_cents DESC
    `;

    const { rows: byClient } = await sql`
      SELECT client_name,
             COUNT(*)::int AS call_count,
             COALESCE(SUM(input_tokens), 0)::int AS input_tokens,
             COALESCE(SUM(output_tokens), 0)::int AS output_tokens,
             COALESCE(SUM(cost_cents), 0)::int AS cost_cents
      FROM api_usage
      WHERE created_at >= date_trunc('month', now()) AND client_name IS NOT NULL
      GROUP BY client_name
      ORDER BY cost_cents DESC
    `;

    const { rows: limitRows } = await sql`SELECT scope, scope_id, monthly_limit_cents FROM usage_limits`;
    const limits = {};
    for (const l of limitRows) limits[`${l.scope}:${l.scope_id}`] = l.monthly_limit_cents;

    const userIds = byUser.map(r => r.user_id);
    const clerkDetails = await clerkGetUsers(userIds);

    return res.status(200).json({
      periodStart: null, // computed server-side via date_trunc; not meaningful to echo back precisely
      byUser: byUser.map(r => ({
        userId: r.user_id,
        name: clerkDetails[r.user_id]?.name || null,
        email: clerkDetails[r.user_id]?.email || null,
        callCount: r.call_count,
        inputTokens: r.input_tokens,
        outputTokens: r.output_tokens,
        costCents: r.cost_cents,
        limitCents: limits[`user:${r.user_id}`] ?? null,
      })),
      byClient: byClient.map(r => ({
        clientName: r.client_name,
        callCount: r.call_count,
        inputTokens: r.input_tokens,
        outputTokens: r.output_tokens,
        costCents: r.cost_cents,
        limitCents: limits[`client:${r.client_name}`] ?? null,
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
