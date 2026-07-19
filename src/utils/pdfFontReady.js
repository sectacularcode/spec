// Shared by every html2canvas-based export in the app (Brief to
// Blueprint's PDF export and Style Guide's PDF/PNG/JPEG export) for the
// same underlying reason in both: html2canvas 1.4.1 (foreignObjectRendering
// off, the default both callers use) clones the captured element into a
// fresh document before measuring and painting it, and that clone's own
// FontFaceSet starts unloaded regardless of what's already settled in the
// document being captured FROM. document.fonts.ready alone isn't enough --
// with font-display:swap, text first paints in a fallback font and swaps
// to the real one once it downloads, and .ready can resolve at a point in
// that swap where html2canvas's internal text-layout pass has already
// measured with stale/fallback glyph widths, then paints with the real
// font -- a mismatch that shows up as words losing the space between them
// or overlapping at line-wrap points. Confirmed real case, Brief to
// Blueprint PDF export, July 2026.
//
// Iterates and explicitly loads every FontFace already registered in the
// given document, rather than hardcoding a specific family/weight list --
// the first attempt at this fix (July 18) hardcoded Inter's weights, which
// happens to be correct for Brief to Blueprint's fixed preview font but
// would have been silently wrong for Style Guide, whose exportable content
// renders whatever font name the extracted brand style actually specifies
// (Playfair Display, Oswald, Lora, dozens of others -- see the Google
// Fonts <link> in index.html; Inter isn't even in that catalog). A generic
// pass over doc.fonts stays correct for both callers automatically, with
// no duplicated list to keep in sync between them.
//
// Call this twice per export: once on the source document before capture
// (warms the browser's font-file cache so the loads below resolve from
// cache instead of a fresh network fetch), and again inside html2canvas's
// onclone callback, on the actual cloned document that gets measured and
// painted -- that second call is the one that actually closes the race.
export async function waitForDocumentFonts(doc) {
  if (!doc || !doc.fonts) return;
  try {
    const loads = [];
    doc.fonts.forEach((fontFace) => {
      loads.push(fontFace.load().catch(() => {}));
    });
    await Promise.all(loads);
  } catch (e) {
    // Non-fatal -- if a specific face fails to load, capture proceeds
    // with whatever's available rather than failing the whole export
    // over a font glitch.
  }
  if (doc.fonts.ready) {
    try {
      await doc.fonts.ready;
    } catch (e) {
      // Non-fatal, same reasoning as above.
    }
  }
}
