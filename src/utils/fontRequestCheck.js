// Font equivalent of colorRequestCheck.js -- same purpose, checking AI-
// generated font choices against what the person actually asked for, used
// by both isCustom generation paths.
//
// Deliberately more conservative than the color version. Unlike color
// words ("blue", "pink"), which are almost always specifically about
// color when they appear in a description, generic style adjectives like
// "modern", "elegant", "playful", or "bold" describe the BUSINESS or BRAND
// generally as often as they describe typography specifically -- "a bold
// new fitness brand" is not a font instruction. Treating those as a hard
// font requirement would carry a much higher false-positive rate than
// colors ever had, so only two kinds of signal count here: an exact,
// unambiguous font name mention, or a small set of words that are near-
// exclusively about typography (serif, sans-serif, monospace, condensed).

const KNOWN_FONTS = [
  "Manrope", "Inter", "Playfair Display", "Cormorant Garamond",
  "Yeseva One", "Italiana", "Oswald", "Space Mono", "Fraunces",
];

// Maps a genuinely typography-specific word to the fonts (from KNOWN_FONTS)
// that satisfy it. "sans serif" / "sans-serif" is handled separately as a
// phrase check below, since it contains the substring "serif" but means
// the opposite.
const FONT_WORD_CATEGORY = {
  serif: ["Cormorant Garamond", "Playfair Display", "Fraunces", "Italiana"],
  monospace: ["Space Mono"],
  mono: ["Space Mono"],
  typewriter: ["Space Mono"],
  condensed: ["Oswald"],
};

// Returns null if there's nothing to fix, or a short string describing
// what was requested but not honored (either a specific font name or a
// typography word) -- used both for the visible warning and for building
// a targeted retry request. Only ever returns a SINGLE missing item, not
// an array like the color version -- a description naming one explicit
// font or one typography style is the realistic case; if multiple
// conflicting signals somehow appear, this returns the first mismatch
// found rather than trying to reconcile them.
export function detectMissingRequestedFont(rawInput, actualHeadingFont) {
  if (!rawInput || !actualHeadingFont) return null;
  const lower = rawInput.toLowerCase();

  // Explicit font name mentioned -- unambiguous, highest-confidence signal,
  // checked before any word-category inference.
  const namedFonts = KNOWN_FONTS.filter(f => lower.includes(f.toLowerCase()));
  if (namedFonts.length > 0) {
    return namedFonts.includes(actualHeadingFont) ? null : namedFonts[0];
  }

  if (/sans[\s-]?serif/.test(lower)) {
    return ["Manrope", "Inter"].includes(actualHeadingFont) ? null : "sans-serif";
  }

  const words = lower.match(/[a-z]+/g) || [];
  for (const word of words) {
    const acceptable = FONT_WORD_CATEGORY[word];
    if (acceptable && !acceptable.includes(actualHeadingFont)) return word;
  }
  return null;
}

// One automatic correction attempt when the requested font wasn't
// honored -- same reasoning as retryColorPalette: a targeted request
// naming exactly what was missing, not a full regenerate. Only asks for
// headingFont, since that's the only font field either caller currently
// carries an explicit AI-driven request for. Best-effort and non-
// throwing, matching every other degrade-gracefully helper in this
// codebase.
export async function retryFontChoice(authHeadersFn, originalText, missingFontDescriptor) {
  try {
    const retrySystemPrompt = `You are correcting a font choice that failed to match what the user explicitly requested. Return ONLY a valid JSON object -- no preamble, no markdown fences:
{ "headingFont": "one of: ${KNOWN_FONTS.join(", ")}" }
Pick the single best font from that exact list that satisfies the user's request. The value must be an exact match to one of the listed font names, character for character.`;
    const retryUserPrompt = `Original site description: ${originalText}
The person specifically asked for: ${missingFontDescriptor}
Return the corrected JSON now.`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const res = await fetch("/api/generate-copy", {
      method: "POST",
      headers: await authHeadersFn(),
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 100,
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
    if (!corrected || typeof corrected.headingFont !== "string" || !KNOWN_FONTS.includes(corrected.headingFont)) return null;
    return corrected.headingFont;
  } catch {
    return null;
  }
}

// Prefixes a visible warning onto themeReason when the requested font
// wasn't honored -- same "make it visible instead of silent" principle as
// prefixMissingColorsWarning. Composes fine with that function if both are
// called on the same themeReason: each independently prepends, so a
// person who asked for both specific colors and a specific font and got
// neither sees two clear, stacked lines rather than one overwriting the
// other.
export function prefixMissingFontWarning(rawInput, actualHeadingFont, themeReason) {
  const missing = detectMissingRequestedFont(rawInput, actualHeadingFont);
  if (!missing) return themeReason;
  const note = `⚠️ You asked for ${missing} typography, but the generated font doesn't match — try Regenerate for a closer match. `;
  return note + (themeReason || "");
}
