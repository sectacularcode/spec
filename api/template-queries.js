// POST /api/template-queries — logs one resolved "describe your site" or
// "generate from keywords" attempt. Any authenticated user may log their
// own query. Write-only from the client's perspective and never blocks
// the actual recommendation flow if it fails.
//
// GET /api/template-queries — admin only. Returns aggregated counts
// grouped by normalized query text, so a spike of e.g. "nail art" or
// "hair salon" that never matches a real template surfaces as a candidate
// for a new template, rather than individual rows to scroll through.
// Same admin-only scoping as api/error-logs.js, for the same reason:
// query text is free-form user input and isn't meant for a manager view.

import { requireAuth, getProfile } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";
import { validText, validId } from "./_lib/validate.js";
import { logTemplateQuery, ensureTemplateQueryLogTable } from "./_lib/templateQueryLog.js";
import { logError } from "./_lib/errorLog.js";
import { sql } from "@vercel/postgres";

const VALID_SOURCES = ["describe_site", "describe_site_locked", "keywords_modal"];

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const userId = await requireAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "POST") {
    if (!(await rateLimit(userId, "template-queries-write", 60))) return tooMany(res);

    const { source, queryText, isCustom, matchedTemplateId, colorRetryFired, colorRetrySucceeded, fontRetryFired, fontRetrySucceeded } = req.body || {};
    if (!VALID_SOURCES.includes(source)) return res.status(400).json({ error: "Invalid source" });
    if (!validText(queryText, 500)) return res.status(400).json({ error: "Invalid queryText" });
    if (matchedTemplateId != null && !validId(matchedTemplateId, 64)) {
      return res.status(400).json({ error: "Invalid matchedTemplateId" });
    }

    // logTemplateQuery itself never throws, so this always resolves 200 --
    // awaited (rather than truly fire-and-forget server-side) only so a
    // genuine DB outage shows up in Vercel's function logs instead of
    // vanishing on a response that already returned.
    await logTemplateQuery(
      userId, source, queryText,
      typeof isCustom === "boolean" ? isCustom : null,
      matchedTemplateId || null,
      colorRetryFired === true,
      colorRetrySucceeded === true,
      fontRetryFired === true,
      fontRetrySucceeded === true
    );
    return res.status(200).json({ ok: true });
  }

  if (req.method === "GET") {
    const profile = await getProfile(userId);
    if (profile.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    if (!(await rateLimit(userId, "template-queries-read", 30))) return tooMany(res);

    try {
      await ensureTemplateQueryLogTable();
      const { rows } = await sql`
        SELECT
          LOWER(TRIM(query_text)) AS normalized_query,
          COUNT(*) AS total_count,
          COUNT(*) FILTER (WHERE is_custom = true) AS custom_count,
          COUNT(*) FILTER (WHERE is_custom = false) AS matched_count,
          MODE() WITHIN GROUP (ORDER BY matched_template_id) AS top_matched_template_id,
          COUNT(*) FILTER (WHERE color_retry_fired = true) AS color_retry_fired_count,
          COUNT(*) FILTER (WHERE color_retry_fired = true AND color_retry_succeeded = true) AS color_retry_succeeded_count,
          COUNT(*) FILTER (WHERE font_retry_fired = true) AS font_retry_fired_count,
          COUNT(*) FILTER (WHERE font_retry_fired = true AND font_retry_succeeded = true) AS font_retry_succeeded_count,
          MAX(occurred_at) AS last_seen
        FROM template_queries
        GROUP BY LOWER(TRIM(query_text))
        ORDER BY total_count DESC
        LIMIT 200
      `;
      return res.status(200).json({ queries: rows });
    } catch (err) {
      await logError("template-queries", "GET", userId, 500, err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
