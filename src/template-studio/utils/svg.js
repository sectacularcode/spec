// SVG icon definitions for social platform icons
// Each key is a platform name, value is a function(color, size) => SVG string.

export const SVG = {
  instagram: (c, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="${c}"/></svg>`,
  tiktok: (c, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 4a4 4 0 0 0 4 4"/></svg>`,
  youtube: (c, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><polygon points="10,9 15,12 10,15" fill="${c}"/></svg>`,
  linkedin: (c, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="10" x2="8" y2="16"/><circle cx="8" cy="7" r="0.5" fill="${c}"/><path d="M12 16v-4a2 2 0 0 1 4 0v4"/><line x1="12" y1="10" x2="12" y2="16"/></svg>`,
  facebook: (c, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a4 4 0 0 0-4 4v3H8v4h3v8h4v-8h3l1-4h-4V6a1 1 0 0 1 1-1h3z"/></svg>`,
  pinterest: (c, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M10 22l2-8M9 12a3 3 0 1 1 6 0c0 2-1 4-3 4s-3-2-3-4"/></svg>`,
  threads: (c, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 11.5c-.5-3-2.5-5-5-5-3 0-5 2-5 5 0 2.5 1.5 4.5 4 5 2.5.5 4-1 4-2.5 0-2-2-2.5-3-1.5"/><path d="M12 22c5 0 9-3 9-9.5C21 5 17 2.5 12 2.5S3 5 3 12.5C3 19 7 22 12 22z"/></svg>`,
};

// ──────────────────────────────────────────────────────────────────────────────
// BLANK_BRAND — a clean slate for new projects. Keeps the structural defaults
// (theme, layout, fonts, colors) so the project still renders, but clears all
// content fields and replaces them with placeholders the user will overwrite.