// Shared low-level helpers for calling the Anthropic Messages API.
// Each endpoint keeps its own model allowlisting, prompt construction, and
// error-response shape — this only centralizes the parts that were
// independently reimplemented (and drifting) across generate-copy.js,
// draft-copy.js, analyze-inspo.js, crawl-inspo.js, and parse-brief.js: the
// actual HTTP call, and pulling parsed JSON back out of Claude's text reply.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

export async function callAnthropic(apiKey, body, extraHeaders = {}) {
  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

// Claude is asked to return raw JSON but sometimes wraps it in markdown
// fences anyway — strip those, then pull out the first {...} block.
// Returns null (never throws) if no valid JSON object can be found.
export function extractJSON(data) {
  const raw = data?.content?.[0]?.text || "";
  const cleaned = raw.replace(/```json\n?/gi, "").replace(/```\n?/gi, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}
