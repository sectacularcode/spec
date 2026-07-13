// Shared logic for checking AI-generated color palettes against what the
// person actually asked for -- used by both isCustom generation paths
// (Template Studio's "describe your site" flow in index.jsx, and the
// separate "Generate from keywords" page tool). Previously lived only in
// index.jsx; extracted here after finding the second entry point had none
// of this -- just the same prompt-level rule that's already been proven
// live not to be reliable enough on its own. One copy means a future fix
// (this logic has already needed 3 real fixes this session: gold/orange,
// rose/orange, the plural-word gap, the idiomatic-language false-positive
// gap) only has to happen once instead of drifting between two copies.
//
// Every function here operates on a plain colors object shaped
// { background, accent, text, card } -- callers are responsible for
// mapping their own JSON schema's field names to/from this shape at the
// boundary (e.g. GenerateFromKeywordsModal's schema uses "primary" where
// this expects "background"). Keeping that mapping at the call site rather
// than baked into this module is deliberate: this module shouldn't need to
// know about either caller's specific JSON shape.

// Buckets a hex color into a broad hue family by actual computed hue, not
// by name -- the only reliable way to check whether a color a person asked
// for is really present, since color NAMES in freeform text and computed
// hue don't always agree (see COLOR_WORD_FAMILY below for the audit that
// proved this).
export function hexHueFamily(hex) {
  if (!hex || typeof hex !== "string") return null;
  const h = hex.replace("#", "");
  if (h.length < 6) return null;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  if ([r, g, b].some(Number.isNaN)) return null;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const delta = max - min;
  if (delta < 0.04) {
    if (l < 0.15) return "black";
    if (l > 0.9) return "white";
    return "gray";
  }
  let hue;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;
  if (hue < 15 || hue >= 345) return "red";
  if (hue < 45) return "orange";
  if (hue < 65) return "yellow";
  if (hue < 170) return "green";
  if (hue < 200) return "teal";
  if (hue < 255) return "blue";
  if (hue < 290) return "purple";
  return "pink";
}

// Used to validate individual color fields returned by retryColorPalette
// before trusting them -- a malformed or missing field in that response
// must never silently overwrite a good original value.
export function isValidHex(s) {
  return typeof s === "string" && /^#[0-9a-f]{6}$/i.test(s);
}

// Each color word maps to the SET of hue families it can legitimately land
// in, not a single family -- a one-word-one-family design was the original,
// wrong version of this. Audited every word here against a canonical real-
// world hex value for that color and its computed hexHueFamily result
// (2026-07-12 audit, 13 of 46 words came back wrong under the old single-
// family design -- including "pink" itself: standard web pink #FFC0CB
// computes to "red", not "pink"). Words with more than one entry genuinely
// span two adjacent hue buckets depending on the specific shade (indigo
// blue-vs-purple, coral orange-vs-red-vs-pink, charcoal black-vs-blue-vs-
// gray, etc.) -- that's real perceptual ambiguity, not something a single
// mapping can resolve correctly either way.
const COLOR_WORD_FAMILY = {
  red: ["red"], crimson: ["red"], scarlet: ["red"], maroon: ["red", "orange"],
  orange: ["orange"], amber: ["orange", "yellow"], rust: ["orange", "red"], coral: ["orange", "red", "pink"], tangerine: ["orange"],
  brown: ["orange"], tan: ["orange"], bronze: ["orange"], copper: ["orange"], terracotta: ["orange", "red"], clay: ["orange"],
  yellow: ["yellow"], gold: ["orange", "yellow"], mustard: ["yellow"],
  green: ["green"], emerald: ["green"], sage: ["green"], olive: ["green", "yellow"], forest: ["green"], mint: ["green"], sewer: ["green"],
  // teal widened to accept blue and green -- audited a broad sample of
  // real pastel shades (2026-07-13, after "blue" alone proved insufficient
  // for a candy/kids palette request): light/pastel versions of blue and
  // teal drift into each other's bucket constantly (sky blue, baby blue,
  // powder blue all compute as "teal" not "blue"), and pastel teal/mint
  // shades occasionally drift into "green". Saturated canonical colors
  // (the original 2026-07-12 audit) don't show this drift nearly as much
  // as their lighter, less saturated real-world variants do -- worth
  // remembering for any future word added here: test the pastel version,
  // not just the saturated one.
  teal: ["teal", "blue", "green"], turquoise: ["teal"], cyan: ["teal"], aqua: ["teal"],
  blue: ["blue", "teal"], navy: ["blue"], cobalt: ["blue"], indigo: ["blue", "purple"],
  purple: ["purple", "pink"], violet: ["purple"], lavender: ["purple", "blue"], plum: ["purple", "pink"], lilac: ["purple", "pink"],
  pink: ["pink", "red"], magenta: ["pink", "purple"], rose: ["orange", "pink", "red"], fuchsia: ["pink", "purple"],
  black: ["black"], charcoal: ["black", "gray", "blue"], onyx: ["black"], ebony: ["black"],
  white: ["white"], ivory: ["white", "yellow"], cream: ["white", "yellow"],
  gray: ["gray"], grey: ["gray"], slate: ["gray", "blue"],
};

// Natural-language color mentions are overwhelmingly plural ("blues",
// "browns", "hues of pink") -- COLOR_WORD_FAMILY only has singular keys, so
// a bare dictionary lookup silently misses every plural form.
export function wordAcceptableFamilies(word) {
  if (COLOR_WORD_FAMILY[word]) return COLOR_WORD_FAMILY[word];
  if (word.endsWith("s") && COLOR_WORD_FAMILY[word.slice(0, -1)]) return COLOR_WORD_FAMILY[word.slice(0, -1)];
  return null;
}

// If themeReason names a color that isn't actually present in the returned
// colors (none of that word's acceptable families match), don't trust the
// freeform claim -- replace it with a plain description generated from the
// real colors instead. Guarantees the displayed reasoning always matches
// the actual swatches, regardless of how well the model followed
// instructions. Returns the (possibly corrected) themeReason string, not a
// wrapper object.
export function verifyThemeReasonAgainstColors(colors, themeReason) {
  if (!colors || !themeReason) return themeReason;
  const actualFamilies = new Set(
    [colors.background, colors.accent, colors.text, colors.card].filter(Boolean).map(hexHueFamily).filter(Boolean)
  );
  const words = themeReason.toLowerCase().match(/[a-z]+/g) || [];
  const hasMismatch = words.some(word => {
    const acceptable = wordAcceptableFamilies(word);
    return acceptable && !acceptable.some(f => actualFamilies.has(f));
  });
  if (!hasMismatch) return themeReason;
  const namedFamilies = [...actualFamilies].filter(f => !["black", "white", "gray"].includes(f));
  return namedFamilies.length
    ? `Colors keyed to ${namedFamilies.join(" and ")} tones, generated for this theme.`
    : "A custom neutral palette generated for this theme.";
}

// Returns the list of color words the person explicitly used that aren't
// actually represented in the returned colors -- pure, no side effects.
// Used both by the visible-warning check below AND by the automatic retry
// (which needs the raw list to build a targeted correction request, not a
// pre-formatted warning string).
//
// Requires at least 2 DISTINCT color words in the raw input before
// treating ANY of them as a genuine palette request. Ordinary business
// descriptions are full of single incidental color words that aren't color
// requests at all -- "we help companies go green", "get clients out of the
// red financially" -- and with only 1 match required, both of those
// trigger a false "missing color" detection, which costs a real wasted API
// call (the automatic retry) and shows a confusing warning for something
// that was never actually broken. Two or more distinct color words
// together is a much stronger, more specific signal that someone is
// actually describing a palette -- matches how people naturally phrase
// color requests anyway ("browns, blues, and hues of pink"). Accepted
// tradeoff: a genuine single-color ask ("make it red") won't trigger the
// check -- that's the pre-existing behavior for that narrower case, not a
// regression.
export function detectMissingRequestedColors(rawInput, colors) {
  if (!colors || !rawInput) return [];
  const actualFamilies = new Set(
    [colors.background, colors.accent, colors.text, colors.card].filter(Boolean).map(hexHueFamily).filter(Boolean)
  );
  const words = rawInput.toLowerCase().match(/[a-z]+/g) || [];
  const allColorWords = [];
  const seen = new Set();
  for (const word of words) {
    if (seen.has(word)) continue;
    const acceptable = wordAcceptableFamilies(word);
    if (!acceptable) continue;
    seen.add(word);
    allColorWords.push(word);
  }
  if (allColorWords.length < 2) return [];
  return allColorWords.filter(word => {
    const acceptable = wordAcceptableFamilies(word);
    return !acceptable.some(f => actualFamilies.has(f));
  });
}

// Prefixes a visible warning onto themeReason when the person named a
// color that genuinely isn't in the output -- a different and stronger
// signal than verifyThemeReasonAgainstColors above, which only checks the
// AI's own reasoning against its own colors. This checks the person's
// original request against the real output. Reaching this (in either
// caller) means retryColorPalette was already attempted and still didn't
// fully succeed -- not that no attempt was made.
export function prefixMissingColorsWarning(rawInput, colors, themeReason) {
  const missingWords = detectMissingRequestedColors(rawInput, colors);
  if (missingWords.length === 0) return themeReason;
  const note = `⚠️ You mentioned ${missingWords.join(" and ")}, but the generated palette doesn't actually include ${missingWords.length > 1 ? "them" : "it"} — try Regenerate for a closer match. `;
  return note + (themeReason || "");
}

// One automatic, targeted correction attempt when the first response
// misses an explicitly-requested color -- prompt-level rules alone weren't
// enough (confirmed live, same input, same missing colors, even with a
// "HARD REQUIREMENT" rule in place). Reacting to a specific, named failure
// ("you used X, that's missing Y") is a materially different and often
// more effective prompt than a general rule stated in advance.
//
// Deliberately narrow: asks for ONLY a corrected colors object + reason,
// not a full regenerate. Keeps whatever the first response already got
// right untouched, and costs far less than re-running the whole
// recommendation. Best-effort and non-throwing -- if the retry itself
// fails for any reason, returns null and the caller falls back to the
// visible warning instead of the person seeing nothing happen. Callers are
// responsible for validating/merging the returned colors field-by-field
// (see isValidHex) rather than trusting it wholesale, and for mapping the
// returned { background, accent, text, card } shape back to their own
// schema if it differs.
export async function retryColorPalette(authHeadersFn, originalText, colors, missingWords) {
  try {
    const retrySystemPrompt = `You are correcting a color palette that failed to include colors the user explicitly requested. Return ONLY a valid JSON object -- no preamble, no markdown fences:
{
  "colors": { "background": "#hex", "accent": "#hex", "text": "#hex", "card": "#hex" },
  "themeReason": "1 short sentence explaining the corrected palette"
}
The new palette MUST include every one of the missing colors listed below as one of the 4 hex values, while staying true to the overall theme/mood already established. Keep whichever of the original 4 colors still make sense; only change what's necessary to actually include the missing colors.`;
    const retryUserPrompt = `Original site description: ${originalText}
Original palette: background=${colors.background || "?"}, accent=${colors.accent || "?"}, text=${colors.text || "?"}, card=${colors.card || "?"}
Missing colors that MUST be included: ${missingWords.join(", ")}
Return the corrected JSON now.`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    const res = await fetch("/api/generate-copy", {
      method: "POST",
      headers: await authHeadersFn(),
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        system: retrySystemPrompt,
        messages: [{ role: "user", content: retryUserPrompt }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json();
    const responseText = data.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
    const clean = responseText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const corrected = JSON.parse(clean);
    if (!corrected || !corrected.colors) return null;
    return corrected;
  } catch {
    return null;
  }
}

// Field-by-field merge, not a wholesale replace -- if retryColorPalette's
// response is missing a field or returns a malformed value for one, that
// must fall back to the original good value, not silently disappear. A
// wholesale replace would lose fields entirely if the retry's response
// happened to only include 2 of the 4, even though the other 2 were
// already fine and didn't need correcting.
export function mergeCorrectedColors(originalColors, correctedColors) {
  const cc = correctedColors || {};
  const orig = originalColors || {};
  return {
    background: isValidHex(cc.background) ? cc.background : orig.background,
    accent: isValidHex(cc.accent) ? cc.accent : orig.accent,
    text: isValidHex(cc.text) ? cc.text : orig.text,
    card: isValidHex(cc.card) ? cc.card : orig.card,
  };
}

// Runs retryColorPalette up to maxAttempts times, stopping as soon as the
// palette genuinely satisfies the request or attempts run out. A single
// retry sometimes wasn't enough for harder requests -- confirmed live: a
// request naming 4 distinct colors at once ("pink, yellow, green and
// blue") is a meaningfully harder case than 1-2 colors, since it leaves
// far less room for the model to miss on the first correction attempt too.
// Keeps looping logic in one shared place rather than duplicated in both
// callers. Bounded and cheap to abandon: each attempt is the same small,
// targeted request as a single retry (colors + reason only, not a full
// regenerate), and this stops immediately once satisfied rather than
// always running the full maxAttempts.
export async function retryColorPaletteUntilSatisfied(authHeadersFn, rawInput, initialColors, initialMissingWords, maxAttempts = 2) {
  let colors = initialColors;
  let themeReason = null;
  let attempts = 0;
  let missing = initialMissingWords;
  while (missing.length > 0 && attempts < maxAttempts) {
    attempts++;
    const corrected = await retryColorPalette(authHeadersFn, rawInput, colors, missing);
    if (!corrected || !corrected.colors) break; // retry itself failed -- no point looping further
    colors = mergeCorrectedColors(colors, corrected.colors);
    themeReason = corrected.themeReason || themeReason;
    missing = detectMissingRequestedColors(rawInput, colors);
  }
  return { colors, themeReason, attempts, succeeded: missing.length === 0 };
}
