// Fire-and-forget logging of what people type into Template Studio's
// "Describe your site" field and "Generate from keywords" modal, so
// aggregate stats can surface which niches keep going isCustom (real
// candidates for new templates) -- unlike keyword_builds, this captures
// every resolved attempt, not just ones the person explicitly saved.
//
// colorRetryFired/colorRetrySucceeded track the automatic color-request
// correction mechanism (colorRequestCheck.js): whether the first response
// missed an explicitly-requested color and needed a retry, and whether
// that retry actually fixed it. fontRetryFired/fontRetrySucceeded are the
// same idea for fontRequestCheck.js's font correction mechanism. Real
// usage data on this beats guessing -- tells us how often color/font
// requests are getting missed on the first try and how often the
// correction actually works, instead of only knowing that from one-off
// manual tests.
//
// Deliberately does not return anything meaningful or throw -- callers
// should invoke this without awaiting, or await it without checking the
// result. A logging failure must never surface to the person or interrupt
// the recommendation flow they're already in.

import { authHeaders } from "./api.js";

export async function logTemplateQuery(source, queryText, isCustom, matchedTemplateId, colorRetryFired, colorRetrySucceeded, fontRetryFired, fontRetrySucceeded) {
  try {
    await fetch("/api/template-queries", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({
        source, queryText, isCustom, matchedTemplateId,
        colorRetryFired: !!colorRetryFired,
        colorRetrySucceeded: !!colorRetrySucceeded,
        fontRetryFired: !!fontRetryFired,
        fontRetrySucceeded: !!fontRetrySucceeded,
      }),
    });
  } catch {
    // best-effort -- nothing to do here
  }
}
