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