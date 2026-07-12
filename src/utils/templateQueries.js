// Fire-and-forget logging of what people type into Template Studio's
// "Describe your site" field and "Generate from keywords" modal, so
// aggregate stats can surface which niches keep going isCustom (real
// candidates for new templates) -- unlike keyword_builds, this captures
// every resolved attempt, not just ones the person explicitly saved.
//
// Deliberately does not return anything meaningful or throw -- callers
// should invoke this without awaiting, or await it without checking the
// result. A logging failure must never surface to the person or interrupt
// the recommendation flow they're already in.

import { authHeaders } from "./api.js";

export async function logTemplateQuery(source, queryText, isCustom, matchedTemplateId) {
  try {
    await fetch("/api/template-queries", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ source, queryText, isCustom, matchedTemplateId }),
    });
  } catch {
    // best-effort -- nothing to do here
  }
}
