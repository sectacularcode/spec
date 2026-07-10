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

export async function logUsage({ userId, clientName, route, model, inputTokens, outputTokens }) {
  if (!userId || !route || !model) return; // malformed call site — fail quiet, don't break the request over it
  try {
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
