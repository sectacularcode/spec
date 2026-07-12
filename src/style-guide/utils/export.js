// Export helpers for the Style Guide document. Three real formats:
// - HTML: free, and the only one that's re-importable -- carries its own
//   structured data in a hidden JSON block so a re-upload can read the
//   original colors/fonts back out losslessly, not re-parse rendered
//   markup.
// - PDF: free, via the browser's own print (window.print() + print CSS
//   on the document component itself).
// - PNG/JPEG: free, via html2canvas -- a real npm dependency, not a
//   runtime <script> tag from a CDN, so there's no third-party code
//   loading into the page at request time.
//
// All three capture ONLY the document's own exportable content -- never
// the surrounding tool chrome (buttons, the format-choice callout) -- by
// only ever reading from the DOM node passed in, which callers must scope
// to exactly the exportable region and nothing else.

import html2canvas from "html2canvas";

const DATA_MARKER_ID = "spec-style-data";

function buildStyleTag() {
  return `
  <style>
    body{ font-family:'Inter', sans-serif; max-width:820px; margin:56px auto; padding:0 24px; background:#fff; }
    .doc-eyebrow{ font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:#8a8a8a; margin:0 0 10px; }
    .doc-brandname{ font-size:44px; margin:0 0 8px; line-height:1.05; }
    .doc-url{ font-size:13px; color:#8a8a8a; margin:0 0 44px; }
    .doc-section-label{ font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:#8a8a8a; margin:0 0 18px; padding-top:32px; border-top:1px solid #ececec; }
    .doc-section-label:first-of-type{ border-top:none; padding-top:0; }
    .doc-swatches{ display:grid; grid-template-columns:repeat(4, 1fr); gap:20px; margin-bottom:8px; }
    .doc-swatches.compact{ grid-template-columns:repeat(6, 1fr); gap:14px; }
    .doc-swatch-sq{ width:100%; aspect-ratio:1; border-radius:4px; margin-bottom:10px; }
    .doc-swatches.compact .doc-swatch-sq{ margin-bottom:7px; }
    .doc-swatch-hex{ font-family:'Inter', monospace; font-size:13px; font-weight:600; color:#1a1a1a; margin:0; }
    .doc-swatches.compact .doc-swatch-hex{ font-size:11px; }
    .doc-swatch-role{ font-size:11px; color:#8a8a8a; margin:2px 0 0; }
    .doc-swatches.compact .doc-swatch-role{ font-size:10px; }
    .doc-font-block{ margin-bottom:36px; }
    .doc-font-block:last-child{ margin-bottom:0; }
    .doc-font-meta{ display:flex; align-items:baseline; gap:10px; margin-bottom:16px; }
    .doc-font-role{ font-size:11px; font-weight:600; color:#8a8a8a; text-transform:uppercase; letter-spacing:0.05em; }
    .doc-font-name{ font-size:14px; font-weight:600; color:#1a1a1a; }
    .doc-h1{ margin:0 0 10px; } .doc-h2{ margin:0 0 10px; } .doc-h3{ margin:0 0 10px; } .doc-h4{ margin:0 0 14px; }
    .doc-body-copy{ font-size:15px; line-height:1.65; color:#3a3a3a; margin:0 0 14px; max-width:520px; }
    .doc-title-label{ font-size:12px; letter-spacing:0.12em; text-transform:uppercase; color:#8a8a8a; margin:0 0 14px; }
    .doc-type-row{ display:flex; align-items:baseline; gap:20px; margin-bottom:14px; }
    .doc-type-row:last-child{ margin-bottom:0; }
    .doc-type-label{ flex-shrink:0; width:58px; font-size:11px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; color:#8a8a8a; }
    .doc-type-label small{ display:block; font-size:10px; font-weight:400; text-transform:none; color:#b0b0b0; margin-top:2px; }
    .doc-footer{ margin-top:48px; padding-top:20px; border-top:1px solid #ececec; font-size:11px; color:#b0b0b0; }
  </style>`;
}

function fontLinkTag(fonts) {
  const families = fonts
    .map(f => f.name)
    .filter(Boolean)
    .map(name => name.trim().replace(/\s+/g, "+"))
    .filter((v, i, arr) => arr.indexOf(v) === i);
  if (!families.length) return "";
  const query = families.map(f => "family=" + f + ":wght@400;500;600").join("&");
  return `<link href="https://fonts.googleapis.com/css2?${query}&display=swap" rel="stylesheet">`;
}

function safeFileBase(brandName) {
  return (brandName || "style-guide")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "style-guide";
}

function triggerDownload(href, filename) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = href;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// data: { brandName, sourceUrl, colors: [{role,hex,confidence}], fonts:
// [{role,name,confidence}] } -- the same shape the Style Guide tab already
// holds in state, embedded verbatim so re-upload never has to reconstruct
// it from rendered HTML.
export function downloadStyleGuideHtml(exportElement, data) {
  if (!exportElement) return;
  const base = safeFileBase(data.brandName);
  const dataScript = `<script type="application/json" id="${DATA_MARKER_ID}">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escapeHtml(data.brandName || "Style guide")} — Style guide</title>`
    + fontLinkTag(data.fonts || [])
    + buildStyleTag()
    + `</head><body>`
    + exportElement.innerHTML
    + dataScript
    + `</body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  triggerDownload(URL.createObjectURL(blob), base + "-style-guide.html");
}

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Reads the hidden data block back out of a previously-downloaded Style
// Guide HTML file. Returns null (never throws) for anything that isn't a
// Spec export -- callers fall back to the AI-assisted upload path for
// files that don't carry this marker, rather than treating "not ours" as
// an error.
export function parseStyleGuideHtml(htmlText) {
  const match = htmlText.match(new RegExp(`<script type="application/json" id="${DATA_MARKER_ID}">([\\s\\S]*?)</script>`));
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

// PDF: the browser's own print, using the document component's own print
// CSS to hide everything outside the exportable region. No file is
// produced directly by this call -- window.print() hands control to the
// OS/browser print dialog, same as any other page.
export function printStyleGuide() {
  window.print();
}

export async function exportStyleGuideImage(exportElement, format, data) {
  if (!exportElement) return;
  await document.fonts.ready;
  const canvas = await html2canvas(exportElement, { backgroundColor: "#ffffff", scale: 2 });
  const base = safeFileBase(data.brandName);
  const mime = format === "jpeg" ? "image/jpeg" : "image/png";
  triggerDownload(canvas.toDataURL(mime, 0.95), `${base}-style-guide.${format}`);
}
