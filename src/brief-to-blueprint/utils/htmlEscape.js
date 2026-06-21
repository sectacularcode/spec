// Escapes HTML special characters before inserting user input into preview HTML.
// Always use this on brief/brand field values — prevents XSS in the preview iframe.
//
// Example: he('<script>') → '&lt;script&gt;'

export function he(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
