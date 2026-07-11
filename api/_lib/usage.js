// Shared usage logger — called explicitly by each route after a successful
// Anthropic call (not hooked into callAnthropic() itself, so logging stays
// a visible, deliberate step in each route rather than a hidden side effect).
//
// Reporting-only. Nothing here blocks a request — see api/usage-limits.js
// and db/schema.sql for the enforcement note for when that's turned on.

import { sql } from "@vercel/postgres";

// $ per million tokens (input/output). Update here when Anthropic changes
// pricing — cost_cents is computed and stored at write time, so historical
// rows stay accurate even after a price change.
const PRICING = {
  "claude-sonnet-4-6":         { input: 3.00, output: 15.00 },
  "claude-haiku-4-5-20251001": { input: 1.00, output: 5.00 },
};

// Self-healing, matching db/schema.sql's api_usage definition exactly,
// including all three of its indexes. This is the true write-owner of
// api_usage -- api/usage-summary.js reads the table but calls this
// exported function rather than duplicating the CREATE TABLE itself.
export async function ensureApiUsageTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS api_usage (
      id            BIGSERIAL PRIMARY KEY,
      user_id       TEXT NOT NULL,
      client_name   TEXT,
      route         TEXT NOT NULL,
      model         TEXT NOT NULL,
      input_tokens  INTEGER NOT NULL,
      output_tokens INTEGER NOT NULL,
      cost_cents    INTEGER,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_api_usage_client_name ON api_usage(client_name)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at)`;
}

export async function logUsage({ userId, clientName, route, model, inputTokens, outputTokens }) {
  if (!userId || !route || !model) return; // malformed call site — fail quiet, don't break the request over it
  try {
    await ensureApiUsageTable();
    const rate = PRICING[model];
    const costCents = rate
      ? Math.round(((inputTokens || 0) / 1e6) * rate.input * 100 + ((outputTokens || 0) / 1e6) * rate.output * 100)
      : null;
    await sql`
      INSERT INTO api_usage (user_id, client_name, route, model, input_tokens, output_tokens, cost_cents)
      VALUES (${userId}, ${clientName || null}, ${route}, ${model}, ${inputTokens || 0}, ${outputTokens || 0}, ${costCents})
    `;
  } catch (err) {
    // Usage logging must never break the actual user-facing request — a
    // logging failure degrades reporting accuracy, not the feature itself.
    console.error("logUsage failed:", err.message);
  }
}
