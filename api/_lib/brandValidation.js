// Shared brand-profile field validation — colors/fonts/buttons logic
// originally lived only in brand-styles.js; extracted here so api/brands.js
// can reuse the exact same rules instead of a second copy that could drift
// out of sync. Behavior is unchanged from the original brand-styles.js
// functions, just relocated.

// Only these keys are meaningful to Spec's color system (see landing.js's
// color fallback chain) — anything else in the submitted object is
// silently dropped rather than stored, so a table using this can't
// accumulate arbitrary junk keys over time.
export const COLOR_KEYS = ["ink", "brass", "brass-deep", "bone", "asphalt", "stone", "warm-white", "text"];
export const FONT_KEYS = ["heading", "body"];
export const HEX_RE = /^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{4}$|^#[0-9A-Fa-f]{6}$|^#[0-9A-Fa-f]{8}$/;

// Real font names are letters, numbers, spaces, and a handful of
// punctuation marks (e.g. "Be Vietnam Pro", "DM Sans", "Helvetica Neue",
// curly-quote contractions like "O'Brien Display"). Restricting to this
// character class closes off font-family as an injection vector before
// it's used in any HTML/CSS context downstream. A comma or a literal quote
// character is still rejected on purpose — either one usually means a
// leftover CSS font-family fallback list slipped through uncleaned.
export const FONT_NAME_RE = /^[A-Za-z0-9 '’‘.–—&-]{1,100}$/;

// Returns { clean, dropped }. A key is only reported in `dropped` if the
// caller actually sent a non-empty value for it that failed validation —
// a key that was never submitted at all isn't a "drop," it's just absent.
export function sanitizeColors(input) {
  const clean = {};
  const dropped = [];
  if (typeof input !== "object" || input === null || Array.isArray(input)) return { clean, dropped };
  for (const key of COLOR_KEYS) {
    const val = input[key];
    if (val == null || val === "") continue;
    if (typeof val === "string" && HEX_RE.test(val.trim())) clean[key] = val.trim();
    else dropped.push(key);
  }
  return { clean, dropped };
}

export function sanitizeFonts(input) {
  const clean = {};
  const dropped = [];
  if (typeof input !== "object" || input === null || Array.isArray(input)) return { clean, dropped };
  for (const key of FONT_KEYS) {
    const val = input[key];
    if (val == null || val === "") continue;
    if (typeof val === "string" && FONT_NAME_RE.test(val.trim())) clean[key] = val.trim();
    else dropped.push(key);
  }
  return { clean, dropped };
}

export const MAX_BUTTONS = 10; // generous ceiling above the realistic "1-3 button styles" use case
export const MAX_BUTTON_NAME_LEN = 60;

// Each entry needs a valid background AND a valid text color to be worth
// storing at all — a button with only one real color isn't renderable, so
// a bad entry is dropped whole rather than saved half-populated.
export function sanitizeButtons(input) {
  if (!Array.isArray(input)) return { clean: [], droppedCount: 0 };
  let droppedCount = 0;
  const clean = [];
  for (const b of input.slice(0, MAX_BUTTONS)) {
    if (!b || typeof b !== "object") { droppedCount++; continue; }
    const background = typeof b.background === "string" && HEX_RE.test(b.background.trim()) ? b.background.trim() : null;
    const textColor = typeof b.textColor === "string" && HEX_RE.test(b.textColor.trim()) ? b.textColor.trim() : null;
    if (!background || !textColor) { droppedCount++; continue; }
    const name = typeof b.name === "string" ? b.name.trim().slice(0, MAX_BUTTON_NAME_LEN) : "";
    clean.push({ name, background, textColor });
  }
  return { clean, droppedCount };
}

// ─── New for brands.js — Section Styles picker fields ──────────────────────
// Matches SECTION_STYLE_LABELS in src/brief-to-blueprint/index.jsx exactly,
// plus "grouped-header" (the synthetic style toggleGroupWithNext() writes
// when two rows are merged under one shared header). Kept as a real enum
// here rather than accepting any string — this table is meant to be a
// long-lived default other people's briefs read from, so a typo'd style
// value silently saved here would quietly break every future page built
// from this brand until someone noticed.
export const VALID_SECTION_STYLES = [
  "split-right", "split-left", "split-cta-right", "split-cta-left",
  "centered-cta", "checklist", "video", "map-beside", "embedded-form",
  "plain", "grouped-header",
];

const MAX_LAYOUT_ROWS = 50; // generous ceiling above any realistic page's feature-row count
const MAX_INDICES_PER_ROW = 20;
const MAX_HEADER_LEN = 200;

// Validates brief.featureLayout / brief.postClosingLayout shape exactly:
// an array of { style, indices: number[], header? }. Silently drops
// individual malformed rows rather than failing the whole save — one bad
// row (e.g. a stale index from a since-shrunk feature list) shouldn't
// block saving the rest of a brand's real layout preferences.
export function sanitizeSectionLayout(input) {
  if (!Array.isArray(input)) return { clean: [], droppedCount: 0 };
  let droppedCount = 0;
  const clean = [];
  for (const row of input.slice(0, MAX_LAYOUT_ROWS)) {
    if (!row || typeof row !== "object") { droppedCount++; continue; }
    if (!VALID_SECTION_STYLES.includes(row.style)) { droppedCount++; continue; }
    const indices = Array.isArray(row.indices)
      ? row.indices.filter(n => typeof n === "number" && Number.isInteger(n) && n >= 0).slice(0, MAX_INDICES_PER_ROW)
      : [];
    if (indices.length === 0) { droppedCount++; continue; }
    const clean_row = { style: row.style, indices };
    if (typeof row.header === "string" && row.header.trim()) {
      clean_row.header = row.header.trim().slice(0, MAX_HEADER_LEN);
    }
    clean.push(clean_row);
  }
  return { clean, droppedCount };
}
