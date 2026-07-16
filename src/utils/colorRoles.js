// Spec's 8 template color roles <-> the fixed keys brands actually store
// (see api/_lib/brandValidation.js's COLOR_KEYS). This frontend file is a
// separate copy of the same fact rather than a shared import -- Vite's
// frontend bundle and the Vercel API functions aren't the same build
// context -- but the KEY strings themselves must match brandValidation.js
// exactly: they're Manifest's fixed export schema ("field names must match
// exactly", per the integration requirements), not meant to be read by a
// person.
//
// The LABELS are a different story: human-facing display names, generalized
// from one early client's (Mile Marker Films) own evocative color names
// ("Brass", "Ink", "Stone"...) into a universal vocabulary. This used to be
// defined twice -- once in Style Guide, once in Component Library, as two
// separately hardcoded copies of the exact same 8 pairs -- the same failure
// mode as the gold-color-default bug (multiple independent copies of one
// fact that can silently drift out of sync). Now defined once; both tools
// import from here.
//
// "Muted" -> "Secondary text" (July 2026): the old name described the
// color's visual weight, not what it's for. It's the secondary/subdued text
// color -- testimonial titles, FAQ answers, captions -- so the new name says
// that directly instead of requiring someone to already know the system.
export const ROLE_TO_KEY = {
  "Heading": "ink",
  "Accent": "brass",
  "Accent — hover": "brass-deep",
  "Background": "bone",
  "Dark panel": "asphalt",
  "Secondary text": "stone",
  "Text on dark": "warm-white",
  "Body text": "text",
};

export const KEY_TO_ROLE = Object.fromEntries(Object.entries(ROLE_TO_KEY).map(([role, key]) => [key, role]));

// Ordered { key, label } pairs, in the same order as brandValidation.js's
// COLOR_KEYS -- for UI that walks the 8 roles as a list (Component
// Library's color grid) rather than doing a single lookup.
export const COLOR_FIELDS = Object.entries(KEY_TO_ROLE).map(([key, label]) => ({ key, label }));
