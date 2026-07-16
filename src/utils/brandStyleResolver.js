// Turns a saved brand_styles record (colors: {ink, brass, brass-deep,
// bone, asphalt, stone, warm-white, text}, fonts: {heading, body},
// buttons: [{name, background, textColor}]) into ready-to-use,
// contrast-checked answers for building a page section -- so every tool
// that reads a saved style guide (Style Guide's own brand sheet, Brief to
// Blueprint Standard, Brief to Blueprint via Manifest, eventually
// Template Studio) answers "what should this text/button look like" the
// same way, using the same real contrast math, instead of three separate
// guesses that can quietly disagree with each other.
//
// Deliberately just a resolver: it reads a style and answers questions
// about it. It doesn't fetch data, save anything, or know about any
// specific tool's UI or generation format -- each tool wires its own
// brand_styles-shaped object in and gets plain hex/string answers back.
//
// Phase 1 of the shared color/accessibility work discussed for Template
// Studio, B2B Standard, and B2B Manifest -- built and tested standalone
// on purpose. Nothing calls this yet, so it can't affect anything already
// working; wiring it into the actual page builders is a deliberately
// separate, later pass.

import { pickReadableColor, bestTextColor, MIN_CONTRAST_LARGE_TEXT, MIN_CONTRAST_BODY_TEXT } from "./contrast.js";

const FALLBACK_DARK = "#1a1a1a";
const FALLBACK_WHITE = "#FFFFFF";

// colors/fonts/buttons all default to safe empty shapes so a brand with
// no saved style yet (or a partially-filled one) still returns usable,
// readable fallbacks instead of throwing or returning undefined.
export function resolveBrandStyle({ colors = {}, fonts = {}, buttons = [] } = {}) {
  const ink = colors.ink;                 // Heading
  const text = colors.text;               // Body text
  const brass = colors.brass;             // Accent
  const brassDeep = colors["brass-deep"]; // Accent -- hover
  const bone = colors.bone;               // Background
  const asphalt = colors.asphalt;         // Dark panel
  const stone = colors.stone;             // Secondary text
  const warmWhite = colors["warm-white"]; // Text on dark

  // Readable heading-weight text for a GIVEN background -- the caller
  // decides what the background is (a hero section, a dark panel,
  // whatever); this only answers what should sit on top of it. Large
  // text gets the more forgiving WCAG threshold, same as the brand sheet.
  function headingOn(bgHex) {
    return pickReadableColor(
      bgHex || FALLBACK_WHITE,
      [ink, text, warmWhite, FALLBACK_DARK, FALLBACK_WHITE],
      MIN_CONTRAST_LARGE_TEXT
    );
  }

  // Same idea for body-weight copy -- stricter contrast threshold since
  // body text is smaller and read for longer.
  function bodyOn(bgHex) {
    return pickReadableColor(
      bgHex || FALLBACK_WHITE,
      [text, ink, warmWhite, stone, FALLBACK_DARK, FALLBACK_WHITE],
      MIN_CONTRAST_BODY_TEXT
    );
  }

  // General-purpose version of the above two for callers that don't need
  // the heading/body distinction -- just "make this readable."
  function textOn(bgHex, { large = false } = {}) {
    return large ? headingOn(bgHex) : bodyOn(bgHex);
  }

  // The button to use. A real, explicitly-defined button (from the Style
  // Guide's Buttons section) always wins -- that's a person's direct
  // choice, not a guess, so it's never second-guessed here. `which`
  // selects by index for brands with more than one defined (0 = primary,
  // matching Saved Library's own "use the first button" precedent
  // elsewhere). Falls back to Accent + computed contrast -- the same
  // pairing the brand sheet has always used -- only when no button was
  // ever explicitly defined for this brand.
  function button(which = 0) {
    const real = buttons[which];
    if (real && real.background && real.textColor) {
      return { name: real.name || "", background: real.background, textColor: real.textColor, source: "defined" };
    }
    const background = brass || FALLBACK_DARK;
    const textColor = bestTextColor(background, text || FALLBACK_DARK);
    return { name: "", background, textColor, source: "computed" };
  }

  // Suggested light/dark section backgrounds from the brand's own
  // palette -- for a builder that needs to pick a section background,
  // not just react to one already chosen.
  function lightBg() { return bone || FALLBACK_WHITE; }
  function darkBg() { return asphalt || ink || FALLBACK_DARK; }

  return {
    colors: { ink, text, brass, brassDeep, bone, asphalt, stone, warmWhite },
    fonts: { heading: fonts.heading || "", body: fonts.body || "" },
    buttons,
    headingOn,
    bodyOn,
    textOn,
    button,
    lightBg,
    darkBg,
  };
}
