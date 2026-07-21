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
import { authHeaders } from "../../utils/api.js";

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
        // NOTE: this html2canvas path is now the FALLBACK only -- the primary
        // export renders server-side via Browserless (/api/export-pdf), which
        // doesn't have html2canvas's word-gluing failure mode at all. Earlier
        // attempts to fix the gluing here by preloading individual font
        // weights were removed: the glue was never a font-timing problem (the
        // live preview's own DOM has correct spacing), so those patches did
        // nothing. This path is kept intact as a graceful fallback for when
        // Browserless is unavailable, accepting its known limitations.
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
        // The live preview's FAQ accordion is checkbox-driven and only
        // shows the first answer expanded by default (real user
        // interaction opens the rest) -- meaningless for a static PDF,
        // where nothing can be clicked. Expand every answer and check
        // every toggle so the "−" icon matches the now-expanded state
        // instead of showing "+" on everything but the first.
        doc.querySelectorAll(".faq-answer").forEach((el) => { el.style.display = "block"; });
        doc.querySelectorAll(".faq-toggle").forEach((el) => { el.checked = true; });
        // Google Maps embeds are cross-origin iframes -- html2canvas
        // cannot read into another origin's document at all (a browser
        // security boundary, not a library limitation it can work
        // around), so these were rasterizing as blank space in the PDF.
        // Swaps each one for a styled address/directions card instead --
        // not a real map image (that would need a Static Maps API key,
        // a new credential/cost this doesn't have), but real, useful
        // content instead of an empty hole. The address is pulled
        // straight out of the iframe's own src (?q=<address>), which
        // landingPreview.js already encodes there -- no new data plumbing
        // needed, and this only touches the offscreen PDF-capture clone,
        // never the live preview iframe.
        doc.querySelectorAll('iframe[src*="maps.google.com"], iframe[src*="google.com/maps"]').forEach((el) => {
          var address = "";
          try {
            var srcUrl = new URL(el.getAttribute("src"), "https://maps.google.com");
            address = srcUrl.searchParams.get("q") || "";
          } catch { /* leave address blank, card still shows */ }
          var card = doc.createElement("div");
          card.setAttribute("style", "width:100%;height:100%;min-height:320px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:#eef0f3;border:1px solid #d7dbe1;box-sizing:border-box;padding:24px;text-align:center;font-family:inherit;");
          card.innerHTML =
            '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5b6472" stroke-width="1.6"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
            '<div style="font-size:14px;font-weight:700;color:#2b3038;">' + (address ? address.replace(/&/g, "&amp;").replace(/</g, "&lt;") : "View on Google Maps") + '</div>' +
            '<div style="font-size:12px;color:#5b6472;">Map view not available in PDF export -- see the live preview or exported page for the interactive map.</div>';
          el.replaceWith(card);
        });
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
    // JPEG, not PNG -- confirmed real case, a single-page PDF export came
    // out at 82MB with PNG. No transparency is in play (backgroundColor
    // above is already opaque white), so JPEG loses nothing visually here,
    // only file size. 0.85 quality: solid balance for this kind of
    // flat-color/text/gradient design content, no visible artifacting at
    // normal zoom, meaningfully smaller than PNG regardless of quality
    // setting chosen (confirmed empirically, though the exact real-world
    // ratio couldn't be measured end-to-end here -- this sandbox has no
    // network route to the real webfont, so a real comparison against the
    // actual 82MB file wasn't possible; PNG vs JPEG at any matched quality
    // was consistently smaller even under that degraded fallback-font
    // rendering, and real photographic/gradient content typically
    // compresses better under JPEG than this test could show).
    captures.push({ dataUrl: canvas.toDataURL("image/jpeg", 0.85), heightPt: PAGE_WIDTH_PT * (canvas.height / canvas.width) });
  }
  if (!captures.length) return null;

  const pdf = new jsPDF({ unit: "pt", format: [PAGE_WIDTH_PT, captures[0].heightPt], orientation: "landscape" });
  captures.forEach((c, i) => {
    if (i > 0) pdf.addPage([PAGE_WIDTH_PT, c.heightPt], "landscape");
    pdf.addImage(c.dataUrl, "JPEG", 0, 0, PAGE_WIDTH_PT, c.heightPt);
  });
  return pdf;
}

// Triggers a browser download of a PDF blob under the given filename.
function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the download has already started.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// PRIMARY export path: render the preview HTML to PDF server-side via
// Browserless (a real headless Chrome), which does NOT have html2canvas's
// word-gluing failure mode -- it prints with the browser's own text-layout
// engine, the same one that renders the live preview correctly. Also renders
// the Google Maps embed as a real map and loads webfonts properly. Throws on
// any failure so the caller (downloadPreviewPdf) can fall back to the local
// html2canvas path -- this function deliberately does NOT swallow errors.
async function downloadPreviewPdfServer(html, fileNameParts) {
  const res = await fetch("/api/export-pdf", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ html }),
  });
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json()).error || ""; } catch {}
    throw new Error(`export-pdf ${res.status}${detail ? ": " + detail : ""}`);
  }
  const blob = await res.blob();
  if (!blob || blob.size === 0) throw new Error("export-pdf returned empty PDF");
  const base = fileNameParts.filter(Boolean).map(safeFileBase).join("-") || "page";
  saveBlob(blob, `${base}.pdf`);
}

// Public entry point. Tries the server (Browserless) path first; on any
// failure -- service down, over quota, timeout, network error -- silently
// falls back to the local html2canvas capture so export never hard-fails.
// The fallback has known limitations (see renderOffscreen's note) but always
// produces *a* PDF.
export async function downloadPreviewPdf(html, fileNameParts) {
  if (!html) return;
  try {
    await downloadPreviewPdfServer(html, fileNameParts);
    return;
  } catch (serverErr) {
    console.warn("Server PDF export failed, falling back to local capture:", serverErr.message);
  }
  await downloadPreviewPdfLocal(html, fileNameParts);
}

// FALLBACK export path: the original in-browser html2canvas + jsPDF capture.
// Kept intact for when the server path is unavailable. Same signature/
// behavior as before; only renamed from the old public downloadPreviewPdf.
async function downloadPreviewPdfLocal(html, fileNameParts) {
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
