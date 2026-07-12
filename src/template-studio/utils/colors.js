// Color utility functions
// All functions take hex strings and return hex strings or rgba values.
// Used by builders and previewHTML to ensure accessible contrast.

export const luminance = (hex) => {
  if (!hex || typeof hex !== "string") return 0.5;
  const h = hex.replace("#", "");
  if (h.length < 6) return 0.5;
  const [r, g, b] = [0, 2, 4].map(i => {
    const c = parseInt(h.substr(i, 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrastRatio = (hex1, hex2) => {
  const l1 = Math.max(luminance(hex1), luminance(hex2));
  const l2 = Math.min(luminance(hex1), luminance(hex2));
  return (l1 + 0.05) / (l2 + 0.05);
};
export const isLight = (hex) => luminance(hex) > 0.179;
export const textOn = (bg) => isLight(bg) ? "#0a0a0a" : "#ffffff";
export const mutedTextOn = (bg) => isLight(bg) ? "rgba(10,10,10,0.65)" : "rgba(255,255,255,0.75)";

// Returns a sensible button color pair that works on any section background
export const buttonOn = (sectionBg, accent) => {
  // If accent has enough contrast with section bg, use it.
  // Otherwise fall back to textOn (black or white) for guaranteed readability.
  const accentLum = luminance(accent);
  const sectionLum = luminance(sectionBg);
  const ratio = (Math.max(accentLum, sectionLum) + 0.05) / (Math.min(accentLum, sectionLum) + 0.05);
  const hasContrast = ratio >= 3;
  const btnBg = hasContrast ? accent : textOn(sectionBg);
  const btnText = textOn(btnBg);
  return { btnBg, btnText };
};

// A small, auto-generated button hierarchy -- Primary (solid), Secondary
// (outline), Ghost (text-only) -- all derived from the brand's own
// accent/primary colors and contrast-checked against sectionBg, never
// manually entered. This is the "variations you can apply to a template"
// set: one deterministic, always-legible option per style, not a picker
// of arbitrary color combinations someone has to vet themselves.
export const buttonVariations = (sectionBg, accent) => {
  const solid = buttonOn(sectionBg, accent);
  // Outline/Ghost have no fill of their own, so what matters is whether
  // the accent itself reads directly against sectionBg -- a different
  // question than buttonOn's "does accent read as a FILL" check, which
  // also considers what text color would sit ON that fill.
  const accentReadableDirectly = contrastRatio(accent, sectionBg) >= 3;
  const lineColor = accentReadableDirectly ? accent : textOn(sectionBg);
  return {
    primary: { bg: solid.btnBg, text: solid.btnText },
    secondary: { border: lineColor, text: lineColor },
    ghost: { text: lineColor },
  };
};

// Resolves the safe heading color for a given background. Prefers an explicit
// theme-provided heading color (themes can deliberately pick a warm off-white
// or off-black for aesthetic reasons, not just pure #fff/#000) but only if it
// still reads legibly against the CURRENT background -- otherwise falls back
// to the guaranteed-safe textOn(bg). Same "trust it if it's safe, otherwise
// fall back" pattern as buttonOn(), applied to heading text. Exists because a
// stored theme.headingColor can go stale the moment a background color is
// overridden without also changing the associated theme (e.g. a manual
// Primary BG color-picker edit after a preset theme was applied).
export const headingColorOn = (bg, themeHeadingColor) => {
  if (themeHeadingColor && contrastRatio(themeHeadingColor, bg) >= 4.5) return themeHeadingColor;
  return textOn(bg);
};