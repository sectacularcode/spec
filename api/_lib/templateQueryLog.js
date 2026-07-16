// Shared server-side log of what people type into Template Studio's
// "Describe your site" field and the "Generate from keywords" modal.
//
// Purpose: keyword_builds (api/keyword-builds.js) only records an entry
// when the person explicitly creates/saves a project or page. This logs
// EVERY resolved attempt regardless of outcome, so aggregate stats
// (which niches keep going isCustom -- i.e. don't match any of the 22
// real templates) actually reflect what people are typing, not just what
// they followed through on. Someone typing "hair salon", seeing the
// recommendation, and clicking Discard previously left zero trace
// anywhere -- that's the specific gap this closes.
//
// Table is self-healing (CREATE TABLE IF NOT EXISTS on every write),
// matching every other table in this codebase -- see api/brand-styles.js's
// history for why that's not a safe assumption to skip. The retry columns
// were added after the table already existed in production, so they go
// through ALTER TABLE ADD COLUMN IF NOT EXISTS rather than only living in
// the CREATE TABLE statement -- same pattern brand-styles.js used for its
// own after-the-fact column (source_url).
//
// Font retry columns (color_retry_fired/succeeded's counterpart) were
// added later than the color ones -- fontRequestCheck.js's
// detectMissingRequestedFont()/retryFontChoice() mechanism was already
// live and firing in template-studio/index.jsx, but its outcome was never
// threaded through to this log, so there was no usage data on how often a
// requested font gets missed on the first try or how often the retry
// actually fixes it -- the exact gap color retry logging was built to
// close, just left unclosed for the font version.

import { sql } from "@vercel/postgres";

const MAX_QUERY_LEN = 500; // matches validText()'s existing default cap elsewhere

export async function ensureTemplateQueryLogTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS template_queries (
      id SERIAL PRIMARY KEY,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      user_id TEXT,
      source TEXT NOT NULL,
      query_text TEXT NOT NULL,
      is_custom BOOLEAN,
      matched_template_id TEXT
    )
  `;
  await sql`ALTER TABLE template_queries ADD COLUMN IF NOT EXISTS color_retry_fired BOOLEAN NOT NULL DEFAULT false`;
  await sql`ALTER TABLE template_queries ADD COLUMN IF NOT EXISTS color_retry_succeeded BOOLEAN NOT NULL DEFAULT false`;
  await sql`ALTER TABLE template_queries ADD COLUMN IF NOT EXISTS font_retry_fired BOOLEAN NOT NULL DEFAULT false`;
  await sql`ALTER TABLE template_queries ADD COLUMN IF NOT EXISTS font_retry_succeeded BOOLEAN NOT NULL DEFAULT false`;
}

// Best-effort and non-throwing by design, same contract as logError() in
// errorLog.js -- a logging failure must never break the actual
// recommendation flow the person is in the middle of.
export async function logTemplateQuery(userId, source, queryText, isCustom, matchedTemplateId, colorRetryFired, colorRetrySucceeded, fontRetryFired, fontRetrySucceeded) {
  try {
    await ensureTemplateQueryLogTable();
    const safeText = String(queryText == null ? "" : queryText).trim().slice(0, MAX_QUERY_LEN);
    if (!safeText) return; // nothing meaningful to log
    await sql`
      INSERT INTO template_queries (user_id, source, query_text, is_custom, matched_template_id, color_retry_fired, color_retry_succeeded, font_retry_fired, font_retry_succeeded)
      VALUES (${userId || null}, ${source}, ${safeText}, ${isCustom == null ? null : isCustom}, ${matchedTemplateId || null}, ${!!colorRetryFired}, ${!!colorRetrySucceeded}, ${!!fontRetryFired}, ${!!fontRetrySucceeded})
    `;
  } catch (e) {
    console.error("logTemplateQuery itself failed:", e.message);
  }
}
