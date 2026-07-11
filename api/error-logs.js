// GET /api/error-logs — admin only.
// Read-only view into the error log written by api/_lib/errorLog.js's
// logError(). Deliberately stricter than usage-summary.js (admin+manager):
// error detail can include internal messages (table/column names, query
// failures) that aren't meant for a manager view, per explicit instruction
// that only admin accounts see raw error detail.

import { requireAuth, getProfile } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";
import { ensureErrorLogTable } from "./_lib/errorLog.js";
import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const userId = await requireAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const profile = await getProfile(userId);
  if (profile.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  if (!(await rateLimit(userId, "error-logs", 30))) return tooMany(res);

  try {
    await ensureErrorLogTable();
    const { rows } = await sql`
      SELECT id, occurred_at, route, method, user_id, status_code, message
      FROM error_logs
      ORDER BY occurred_at DESC
      LIMIT 100
    `;
    return res.status(200).json({ logs: rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
