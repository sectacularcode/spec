// Export helpers for the Style Guide document. Three real formats:
// - HTML: free, and the only one that's re-importable -- carries its own
//   structured data in a hidden JSON block so a re-upload can read the
//   original colors/fonts back out losslessly, not re-parse rendered
//   markup.
// - PDF: free, via html2canvas + jsPDF, sliced across letter-size pages.
//   Deliberately NOT window.print(): that handed control to the OS/browser
//   print dialog, which defaults to whatever printer was last used
//   (routinely a physical, sometimes monochrome one) rather than "Save as
//   PDF" -- so a button labeled "Download PDF" could silently turn into
//   an actual print job, or come out grayscale because that's genuinely
//   what a monochrome print driver renders in its own preview. Generating
//   the PDF directly means it always downloads as a file, always in the
//   real extracted colors, with no dialog and no printer in the loop.
// - PNG/JPEG: free, via html2canvas -- a real npm dependency, not a
//   runtime <script> tag from a CDN, so there's no third-party code
//   loading into the page at request time.
//
// All three capture ONLY the document's own exportable content -- never
// the surrounding tool chrome (buttons, the format-choice callout) -- by
// only ever reading from the DOM node passed in, which callers must scope
// to exactly the exportable region and nothing else.

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const DATA_MARKER_ID = "spec-style-data";

// StyleDocument.jsx renders every element with inline styles -- none of
// it ever applies a className -- so the only thing this needs to recreate
// is the page-level layout that the captured innerHTML doesn't carry with
// it: exportElement is the INNER #style-doc-exportable node, not its
// outer wrapper (which supplies the 820px max-width/padding/background in
// the live app), so that has to be re-created here on <body> itself or
// the downloaded file has no framing at all.
function buildStyleTag() {
  return `
  <style>
    body{ font-family:'Inter', sans-serif; max-width:820px; margin:56px auto; padding:0 24px; background:#fff; }
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

// Shared by both export formats below so the html2canvas call config
// (background, font-readiness wait) only lives in one place.
async function captureCanvas(exportElement, scale) {
  await document.fonts.ready;
  return html2canvas(exportElement, { backgroundColor: "#ffffff", scale });
}

// PDF: renders the document to a canvas, then slices that canvas across
// letter-size pages at 0.5in margins (matching the page size/margins the
// old print-CSS @page rule used) and embeds each slice as an image in a
// real jsPDF document. No OS print dialog, no printer driver involved --
// what you see in the document is exactly what downloads.
export async function downloadStyleGuidePdf(exportElement, data) {
  if (!exportElement) return;
  // Higher scale than the PNG/JPEG default -- this is meant for print/PDF
  // viewing, not a quick look at 100% zoom, so sharper text is worth it.
  const canvas = await captureCanvas(exportElement, 2);
  if (!canvas.width || !canvas.height) return;

  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const marginPt = 36; // 0.5in
  const usableWidthPt = pdf.internal.pageSize.getWidth() - marginPt * 2;
  const usableHeightPt = pdf.internal.pageSize.getHeight() - marginPt * 2;

  // How many source canvas pixels fit in one page's usable height, once
  // the canvas is scaled down to fit the page's usable width.
  const pxPerPt = canvas.width / usableWidthPt;
  const pageHeightPx = Math.max(1, Math.floor(usableHeightPt * pxPerPt));

  let renderedPx = 0;
  let firstPage = true;
  // canvas.height / pageHeightPx is the real page count; the +2 cushion
  // covers rounding, not a real scenario -- this is purely a guard
  // against a future math error turning into a hung, unresponsive tab
  // instead of a fast, visible failure.
  const maxIterations = Math.ceil(canvas.height / pageHeightPx) + 2;
  for (let i = 0; i < maxIterations && renderedPx < canvas.height; i++) {
    const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceHeightPx;
    slice.getContext("2d").drawImage(
      canvas, 0, renderedPx, canvas.width, sliceHeightPx,
      0, 0, canvas.width, sliceHeightPx
    );

    if (!firstPage) pdf.addPage();
    pdf.addImage(slice.toDataURL("image/png"), "PNG", marginPt, marginPt, usableWidthPt, sliceHeightPx / pxPerPt);
    firstPage = false;
    renderedPx += sliceHeightPx;
  }

  pdf.save(`${safeFileBase(data.brandName)}-style-guide.pdf`);
}

export async function exportStyleGuideImage(exportElement, format, data) {
  if (!exportElement) return;
  // scale:2 (retina) made the default PNG/JPEG taller than a typical
  // laptop screen at 100% zoom -- fine for print, but the first thing
  // most people do is just open the file to look at it. 1.5x is still
  // sharp enough to read hex codes clearly, at roughly 3/4 the pixel
  // dimensions of the old default.
  const canvas = await captureCanvas(exportElement, 1.5);
  const base = safeFileBase(data.brandName);
  const mime = format === "jpeg" ? "image/jpeg" : "image/png";
  triggerDownload(canvas.toDataURL(mime, 0.95), `${base}-style-guide.${format}`);
}
