// PDF export for a Brief to Blueprint preview page. Real jsPDF document,
// same reasoning as Style Guide's downloadStyleGuidePdf() (src/style-guide
// /utils/export.js) for why this is html2canvas + jsPDF and deliberately
// NOT window.print(): the OS print dialog can silently swap in a
// physical/monochrome printer instead of "Save as PDF". Generating the
// PDF directly means it always downloads as a file, in the real rendered
// colors, no dialog and no printer involved.
//
// Pagination: one page per section (nav, each content section, footer),
// each page sized to that section's own aspect ratio -- not the fixed
// pixel-height slicing Style Guide's version uses, which doesn't fit this
// document type. A style guide is one continuous flowing document; a
// landing page is a sequence of distinct rectangular sections, and
// slicing at blind pixel intervals cut straight through the middle of
// whatever happened to sit at each boundary (confirmed real case: a
// button split across two pages). Every page here is exactly one real
// section, so a page break only ever falls between two sections, never
// inside one.
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
//
// EXPORT_CAPTURE_HEIGHT_PX matters more than it looks: several sections
// (the hero's min-height:70vh, its padding's clamp(48px,8vh,80px), etc.)
// size themselves off the viewport HEIGHT via vh units, which resolve
// against whatever height this iframe reports -- not the real content
// height. Confirmed real bug, July 2026: an earlier version resized the
// iframe's height to match doc.documentElement.scrollHeight right after
// load, meant to make sure nothing below "the fold" got clipped. But
// that created a feedback loop -- resizing the iframe changes what vh
// means, which changes vh-sized elements' heights, which changes
// scrollHeight, compounding into a hero section rendering nearly 2x too
// tall with its content only filling part of the resulting canvas width
// (the visible symptom: a hero section that only occupied roughly the
// left half of its own page, blank on the right). Since sections are
// captured individually now (not the whole scrollable page at once), the
// iframe never actually needs to match real content height at all -- CSS
// layout happens for every element regardless of whether it's within the
// visible viewport. A realistic, FIXED desktop-viewport height (never
// resized after set) is both simpler and correct: vh-based sections size
// themselves the way they would on an actual laptop screen, matching
// what the live preview iframe would show on one (there, height is
// calc(100vh - 100px) of the real browser window).
const EXPORT_CAPTURE_HEIGHT_PX = 900;

function renderOffscreen(html) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.top = "0";
    iframe.style.left = "-99999px";
    iframe.style.width = `${EXPORT_CAPTURE_WIDTH_PX}px`;
    iframe.style.height = `${EXPORT_CAPTURE_HEIGHT_PX}px`;
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
        if (doc.fonts && doc.fonts.ready) await doc.fonts.ready;
        // PDF pages don't scroll, so position:sticky/fixed (the real
        // nav, e.g.) serve no purpose in this capture and are a known
        // html2canvas rendering hazard -- html2canvas can misjudge a
        // sticky element's real bounding box when cloning/rendering the
        // page outside its normal scroll container. Flattening every
        // sticky/fixed element to static removes the hazard entirely
        // since there's no scrolling for it to matter.
        doc.querySelectorAll("*").forEach((el) => {
          const pos = doc.defaultView.getComputedStyle(el).position;
          if (pos === "sticky" || pos === "fixed") el.style.position = "static";
        });
        // The mobile-nav drawer is meant to be reachable only via the
        // hamburger toggle on a real mobile screen -- its hidden-by-
        // default state depends on a CSS media query matching the
        // viewport width, which isn't guaranteed to evaluate the same
        // way inside a programmatically-sized offscreen iframe as it
        // does in the visible preview. Force-hiding it directly removes
        // that dependency rather than trusting the media query here.
        const mobileNav = doc.getElementById("mobile-nav");
        if (mobileNav) mobileNav.style.display = "none";
        resolve({ iframe, body: doc.body });
      } catch (err) {
        reject(err);
      }
    };
    document.body.appendChild(iframe);
  });
}

// Captures each top-level element in the rendered page separately (nav,
// each content section, footer) and gives each one its own PDF page,
// sized to that element's own aspect ratio -- confirmed real bug, July
// 2026: the previous approach captured the WHOLE page as one tall canvas
// and sliced it at fixed pixel-height intervals with zero awareness of
// where any section actually started or ended, so a page break could
// land mid-button or mid-paragraph. Every element gets a page exactly its
// own size instead: no cropping, no wasted whitespace, and a page break
// only ever falls between two real sections, never inside one.
// pageWidthPt is fixed across every page (matches the previous landscape
// letter width, 792pt, so the file still opens at a normal print size);
// each page's height is computed from that element's own captured aspect
// ratio, so a short section (e.g. a compact CTA) gets a short page and a
// tall one (e.g. a long feature row) gets a tall page -- neither one
// forces the other to its size.
const PAGE_WIDTH_PT = 792;

async function elementsToPdf(elements) {
  // Capture every element's canvas first, before constructing the PDF at
  // all -- jsPDF sets page 1's size from the constructor's own `format`
  // option, so the first section's real dimensions have to be known
  // before that call, not patched in after.
  const captures = [];
  for (const el of elements) {
    // Zero-height elements (e.g. the hidden mobile-nav drawer, only shown
    // via JS on a real mobile viewport) capture as an empty page --
    // skipped rather than shipping a blank page in the PDF.
    if (!el.offsetHeight) continue;
    // windowWidth/width pinned explicitly to the offscreen iframe's own
    // known width -- confirmed real html2canvas bug (well-documented
    // upstream, e.g. niklasvh/html2canvas#837, #1572): left unset, it
    // falls back to reading document.defaultView.innerWidth, which isn't
    // reliably correct for an element inside a detached/offscreen
    // document, and the mismatch causes it to lay out and capture the
    // clone at the WRONG width -- content renders into only part of the
    // canvas (roughly the left half, in the case actually seen), with
    // the rest left blank. Setting both explicitly to the same known
    // value removes the ambiguity the bug depends on.
    const canvas = await html2canvas(el, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      width: EXPORT_CAPTURE_WIDTH_PX,
      windowWidth: EXPORT_CAPTURE_WIDTH_PX,
    });
    if (!canvas.width || !canvas.height) continue;
    captures.push({ dataUrl: canvas.toDataURL("image/png"), heightPt: PAGE_WIDTH_PT * (canvas.height / canvas.width) });
  }
  if (!captures.length) return null;

  const pdf = new jsPDF({ unit: "pt", format: [PAGE_WIDTH_PT, captures[0].heightPt], orientation: "landscape" });
  captures.forEach((c, i) => {
    if (i > 0) pdf.addPage([PAGE_WIDTH_PT, c.heightPt], "landscape");
    pdf.addImage(c.dataUrl, "PNG", 0, 0, PAGE_WIDTH_PT, c.heightPt);
  });
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
    // Every direct child of <body> -- nav, each content section, footer
    // -- matching how buildPreviewHTML.js actually assembles the page
    // (one flat sequence of sibling elements, no wrapping container
    // around the section content). The hidden mobile-nav drawer and the
    // trailing <script> tag get filtered out naturally by the
    // offsetHeight/canvas-dimension checks in elementsToPdf, not
    // special-cased here, since that's the same "no real content, don't
    // include it" check every element goes through.
    const elements = Array.from(rendered.body.children).filter(el => el.tagName !== "SCRIPT");
    if (!elements.length) return;
    const pdf = await elementsToPdf(elements);
    if (!pdf) return;
    const base = fileNameParts.filter(Boolean).map(safeFileBase).join("-") || "page";
    pdf.save(`${base}.pdf`);
  } finally {
    if (rendered && rendered.iframe && rendered.iframe.parentNode) {
      rendered.iframe.parentNode.removeChild(rendered.iframe);
    }
  }
}
