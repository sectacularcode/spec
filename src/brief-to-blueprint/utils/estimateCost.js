// Pre-generation cost estimate. Computed entirely client-side (no API call)
// since the only AI cost left at generation time is draft-copy.js, and
// whether/how much it'll spend is fully determined by two things already
// known in the browser: the copyBriefOnly toggle, and how many draftable
// fields in the current brief are blank.
//
// Deliberately a single plain function, not a component — today it backs
// one inline line near the Generate button; if this grows into a fuller
// breakdown panel later (once usage limits are enforced, or batch
// generation ships), that panel calls this same function rather than
// reimplementing the estimate logic.

import { countBlankDraftableFields } from "../../utils/draftableFields.js";

// Rough per-field estimate for draft-copy.js (Haiku 4.5, $1/$5 per MTok).
// Conservative on the high side — real per-field cost is usually lower once
// the shared prompt overhead is amortized across all blank fields in one
// call, but this keeps the estimate from ever under-promising.
const EST_INPUT_TOKENS_PER_FIELD = 150;
const EST_OUTPUT_TOKENS_PER_FIELD = 120;
const HAIKU_INPUT_RATE_PER_TOKEN = 1.0 / 1e6;
const HAIKU_OUTPUT_RATE_PER_TOKEN = 5.0 / 1e6;

export function estimateGenerationCost(brief, copyBriefOnly) {
  if (copyBriefOnly || !brief) {
    return { costDollars: 0, blankFieldCount: 0, willDraft: false };
  }
  const blankFieldCount = countBlankDraftableFields(brief);
  if (blankFieldCount === 0) {
    return { costDollars: 0, blankFieldCount: 0, willDraft: false };
  }
  const inputTokens = blankFieldCount * EST_INPUT_TOKENS_PER_FIELD;
  const outputTokens = blankFieldCount * EST_OUTPUT_TOKENS_PER_FIELD;
  const costDollars = inputTokens * HAIKU_INPUT_RATE_PER_TOKEN + outputTokens * HAIKU_OUTPUT_RATE_PER_TOKEN;
  return { costDollars, blankFieldCount, willDraft: true };
}
