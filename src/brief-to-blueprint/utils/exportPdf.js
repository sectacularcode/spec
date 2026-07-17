// PDF export for a Brief to Blueprint preview page. Same real approach as
// Style Guide's downloadStyleGuidePdf() (src/style-guide/utils/export.js):
// html2canvas + jsPDF, sliced across letter-size pages -- deliberately NOT
// window.print(), for the same reason documented there (the OS print
// dialog can silently swap in a physical/monochrome printer instead of
// "Save as PDF"). Generating the PDF directly means it always downloads as
// a file, in the real rendered colors, no dialog and no printer involved.
//
// One real difference from the Style Guide version: that one captures a
// live DOM node directly. Brief to Blueprint's preview lives inside
// <iframe sandbox="allow-scripts" srcDoc={...}> (index.jsx) -- no
// allow-same-origin, so its content sits in an opaque cross-origin
// context and html2canvas cannot read into it from the parent page.
// Loosening that sandbox just to enable PDF export isn't a trade worth
// making for a preview that can carry brief/AI-drafted content. Instead,
// this renders the exact same HTML string already being shown (the
// buildPreviewHTML() output passed to srcDoc) into a second, temporary,
// off-screen iframe created solely for the export -- same-origin by
// default since it's not sandboxed, captured, then removed immediately.
// The person never sees this second iframe; visually nothing changes.

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const EXPORT_CAPTURE_WIDTH_PX = 1280;

function safeFileBase(name) {
  return (name || "page")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "page";
}

// Renders `html` (a full standalone document string, exactly what's
// already passed to the visible preview's srcDoc) into a temporary,
// off-screen iframe and resolves with that iframe's <body> element once
// loaded and fonts are ready. Caller is responsible for removing the
// iframe from the DOM when done (try/finally at the call site) -- kept
// separate from cleanup so a capture error still leaves nothing behind.
function renderOffscreen(html) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.top = "0";
    iframe.style.left = "-99999px";
    iframe.style.width = `${EXPORT_CAPTURE_WIDTH_PX}px`;
    // Height grows with content via onload below -- start tall enough to
    // avoid a mid-load layout shift affecting the capture, corrected once
    // the real content is in.
    iframe.style.height = "2000px";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    iframe.srcdoc = html;
    iframe.onload = async () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc || !doc.body) {
          reject(new Error("PDF export: offscreen preview failed to load"));
          return;
        }
        // Match the iframe's own height to its real rendered content so
        // html2canvas captures the full page, not just the initial guess
        // above -- scrollHeight only reports the true value once fonts/
        // images inside this document have settled.
        if (doc.fonts && doc.fonts.ready) await doc.fonts.ready;
        iframe.style.height = `${doc.documentElement.scrollHeight}px`;
        resolve({ iframe, body: doc.body });
      } catch (err) {
        reject(err);
      }
    };
    document.body.appendChild(iframe);
  });
}

// Slices a captured canvas across letter-size pages at 0.5in margins and
// embeds each slice into a real jsPDF document -- identical math to
// downloadStyleGuidePdf(), duplicated rather than shared across the
// style-guide/brief-to-blueprint module boundary (same reasoning as every
// other small utility duplicated across this codebase: keeps each feature
// area free of a cross-cutting dependency on the other's file).
function canvasToPdf(canvas) {
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const marginPt = 36; // 0.5in
  const usableWidthPt = pdf.internal.pageSize.getWidth() - marginPt * 2;
  const usableHeightPt = pdf.internal.pageSize.getHeight() - marginPt * 2;

  const pxPerPt = canvas.width / usableWidthPt;
  const pageHeightPx = Math.max(1, Math.floor(usableHeightPt * pxPerPt));

  let renderedPx = 0;
  let firstPage = true;
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
  return pdf;
}

// html: the full standalone HTML string already generated for the visible
// preview (buildPreviewHTML() output) -- callers pass the exact same
// string, not a re-derived one, so the PDF always matches what's on
// screen. fileNameParts: array of strings to join into the download
// filename (e.g. [brandName, pageLabel, variant]).
export async function downloadPreviewPdf(html, fileNameParts) {
  if (!html) return;
  let rendered;
  try {
    rendered = await renderOffscreen(html);
    const canvas = await html2canvas(rendered.body, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
    if (!canvas.width || !canvas.height) return;
    const pdf = canvasToPdf(canvas);
    const base = fileNameParts.filter(Boolean).map(safeFileBase).join("-") || "page";
    pdf.save(`${base}.pdf`);
  } finally {
    if (rendered && rendered.iframe && rendered.iframe.parentNode) {
      rendered.iframe.parentNode.removeChild(rendered.iframe);
    }
  }
}
