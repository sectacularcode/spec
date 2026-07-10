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

// Repairs the two known ways the model produces near-valid JSON while
// reproducing long, real-world prose (e.g. an "About story" pulled from a
// Word doc) inside a JSON string value — a character-scan state machine,
// not a regex, because correctly tracking "inside a string" while handling
// both issues isn't reliably expressible as one regex:
//
// 1. Literal control characters (raw newlines/tabs/CR) instead of the
//    escaped \n/\t/\r — straightforward to fix, any raw control character
//    found while inside a string gets escaped.
//
// 2. Unescaped internal quotes — e.g. the source text uses smart/curly
//    quotes around a word ("community"), and while reproducing it verbatim
//    the model normalizes them to straight ASCII quotes but doesn't escape
//    them, so what should be one string value becomes "...every ",
//    followed by content, followed by another unescaped ",... — which
//    JSON.parse reads as the string ending early. Whether a given `"` is a
//    real closing quote or unescaped content isn't determinable from that
//    character alone, so this uses a lookahead heuristic: skip whitespace
//    after the quote and check what comes next. A comma, colon, or closing
//    brace/bracket means it's a real string boundary. A letter or other
//    content character means it wasn't meant to close the string — escape
//    it and keep treating subsequent text as still inside the string.
//
// Both issues can appear in the same response, so this handles them in one
// pass rather than as two separate repair attempts.
function repairJsonText(text) {
  let result = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (!inString) {
      result += ch;
      if (ch === '"') inString = true;
      continue;
    }
    if (escaped) { result += ch; escaped = false; continue; }
    if (ch === "\\") { result += ch; escaped = true; continue; }
    if (ch === "\n") { result += "\\n"; continue; }
    if (ch === "\r") { result += "\\r"; continue; }
    if (ch === "\t") { result += "\\t"; continue; }
    if (ch === '"') {
      let j = i + 1;
      while (j < text.length && /\s/.test(text[j])) j++;
      const next = text[j];
      const closesString = next === undefined || next === "," || next === "}" || next === "]" || next === ":";
      if (closesString) {
        result += ch;
        inString = false;
      } else {
        result += '\\"';
      }
      continue;
    }
    result += ch;
  }
  return result;
}

// Same as extractJSON, but on failure returns real diagnostics instead of
// just null: both parse attempts' actual error messages, the character
// position JSON.parse choked on (parsed out of V8's error message, e.g.
// "Unexpected token h in JSON at position 1234"), and a text window
// centered on that exact position — not just the first 500 characters of
// what can be a much longer response, which may not even reach the actual
// problem spot. Use this at the one call site that needs to show a human
// (admin/manager) what actually went wrong; extractJSON stays the simple
// object-or-null contract for callers that don't.
export function extractJSONWithDiagnostics(data) {
  const raw = data?.content?.[0]?.text || "";
  const cleaned = raw.replace(/```json\n?/gi, "").replace(/```\n?/gi, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    return { parsed: null, error: "No JSON object found in response", rawLength: raw.length, snippet: raw.slice(0, 500) };
  }

  try {
    return { parsed: JSON.parse(match[0]), error: null };
  } catch (err1) {
    try {
      const repaired = repairJsonText(match[0]);
      return { parsed: JSON.parse(repaired), error: null, repaired: true };
    } catch (err2) {
      const posMatch = /position (\d+)/.exec(err2.message);
      const pos = posMatch ? parseInt(posMatch[1], 10) : null;
      const snippet = pos != null
        ? match[0].slice(Math.max(0, pos - 250), pos + 250)
        : match[0].slice(0, 500);
      return {
        parsed: null,
        error: err2.message,
        firstAttemptError: err1.message,
        position: pos,
        snippet,
        rawLength: raw.length,
      };
    }
  }
}

// Claude is asked to return raw JSON but sometimes wraps it in markdown
// fences anyway — strip those, then pull out the first {...} block. Tries a
// straight parse first; if that fails, retries once against a repaired
// version (see repairJsonText) before giving up. Returns null (never
// throws) if no valid JSON object can be recovered either way.
export function extractJSON(data) {
  return extractJSONWithDiagnostics(data).parsed;
}
