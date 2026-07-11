// Shared server-side error log. Any API route can call logError() from its
// catch block to record an unexpected (5xx-class) failure for admins to
// review, instead of it only ever existing as a one-off "couldn't save"
// message the person happened to screenshot.
//
// Deliberately scoped to genuine unexpected errors, not routine 400/401
// rejections -- those are expected outcomes (bad input, no auth), not bugs
// to investigate, and logging them would just add noise. Callers should
// only invoke this from a true catch-all handler.
//
// Table is self-healing (CREATE TABLE IF NOT EXISTS on every write) rather
// than depending on a one-off migration script having actually run against
// prod -- see api/brand-styles.js's history for exactly why that's not a
// safe assumption to make.

import { sql } from "@vercel/postgres";

const MAX_MESSAGE_LEN = 2000; // hygiene cap -- a pathological error shouldn't grow this table unbounded

export async function ensureErrorLogTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS error_logs (
      id SERIAL PRIMARY KEY,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      route TEXT NOT NULL,
      method TEXT,
      user_id TEXT,
      status_code INTEGER,
      message TEXT
    )
  `;
}

// Best-effort and non-throwing by design -- a logging failure must never
// mask or replace the real error response the caller was already about to
// send. Only the error's message is stored (same string already returned
// to admins client-side), never the request body, headers, or auth token.
export async function logError(route, method, userId, statusCode, message) {
  try {
    await ensureErrorLogTable();
    const safeMessage = String(message == null ? "" : message).slice(0, MAX_MESSAGE_LEN);
    await sql`
      INSERT INTO error_logs (route, method, user_id, status_code, message)
      VALUES (${route}, ${method || null}, ${userId || null}, ${statusCode || null}, ${safeMessage})
    `;
  } catch (e) {
    // Logging the log failure to Vercel's own function output is the last
    // resort here -- there's nowhere else left to put it.
    console.error("logError itself failed:", e.message);
  }
}
