// Strips HTML angle brackets from every string in a parsed object, recursively.
// Client briefs are hostile input: a DOCX/PDF/JSON from a client can carry
// <script> payloads that would execute when a designer opens a generated
// preview (popup or downloaded .html) in the app's origin. Brand copy has no
// legitimate use for < or >, so stripping at ingestion kills the entire
// injection class without double-escaping anything React renders.

export function deepStripHTML(value) {
  if (typeof value === "string") return value.replace(/[<>]/g, "");
  if (Array.isArray(value)) return value.map(deepStripHTML);
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value)) out[k] = deepStripHTML(value[k]);
    return out;
  }
  return value;
}
