// Shared WCAG-style contrast utilities. Built for the Style Guide's brand
// sheet -- a color extracted from a site's CSS carries no information
// about what background it was originally sitting on, so a "Heading"
// color pulled from a dark hero section (light text, meant for a dark
// background) can come back and get rendered as text directly on this
// document's white background, where it's invisible. Kept generic and
// dependency-free (no imports) so Brief to Blueprint and Template Studio
// can reuse the same functions later for text/background pairing inside
// generated templates -- that's a larger, separate pass, but the contrast
// math itself doesn't need to be built twice.

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Standard WCAG contrast ratio: 1 (no contrast at all) to 21 (black on white).
export function contrastRatio(hexA, hexB) {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  if (lA == null || lB == null) return 0;
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

// WCAG AA thresholds. Large text (headings: >=24px, or bold >=19px) gets
// the more forgiving 3:1; regular body copy needs the stricter 4.5:1.
export const MIN_CONTRAST_LARGE_TEXT = 3;
export const MIN_CONTRAST_BODY_TEXT = 4.5;

// Walks candidates in order (preferred color first, then fallbacks) and
// returns the first one that actually reads against bgHex. Falls back to
// a hardcoded near-black if nothing in the list clears the bar, so a
// role pulled from a dark-background context on the source site never
// silently renders as invisible text.
export function pickReadableColor(bgHex, candidates, minContrast = MIN_CONTRAST_LARGE_TEXT) {
  for (const c of candidates) {
    if (c && contrastRatio(c, bgHex) >= minContrast) return c;
  }
  return "#1a1a1a";
}

// For text sitting ON a color (a button fill, a dark panel) rather than
// text placed next to it -- picks whichever of white or a given dark
// color actually contrasts better against that specific background.
export function bestTextColor(bgHex, darkHex = "#1a1a1a") {
  if (!bgHex) return "#FFFFFF";
  const withWhite = contrastRatio("#FFFFFF", bgHex);
  const withDark = contrastRatio(darkHex, bgHex);
  return withWhite >= withDark ? "#FFFFFF" : darkHex;
}
