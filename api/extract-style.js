// POST /api/extract-style — pull real colors and fonts from a live
// website's own CSS. Backs the Style Guide tool's "paste a URL" flow.
//
// Deliberately lighter than crawl-inspo.js: no screenshots, no Anthropic
// call, no multi-page crawl -- just the homepage and its stylesheets, pure
// CSS parsing. Same $0 marginal cost as page generation elsewhere in Spec.
//
// Security model matches crawl-inspo.js exactly (see api/_lib/safeFetch.js
// for the shared implementation): SSRF-protected fetch, redirect
// re-validation, size-capped responses, verified-auth + rate-limited.

import { requireAuth } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";
import { logError } from "./_lib/errorLog.js";
import { isSafeUrl, fetchPage, fetchCss } from "./_lib/safeFetch.js";
import { extractComputedFonts } from "./_lib/computedFontStyle.js";

const MAX_CSS_FETCHES = 10;

// General stylesheet discovery -- every <link rel="stylesheet">, not just
// Elementor-tagged ones (this route has to work on any site builder, not
// just Elementor). But naive DOM-order-first-N is a real bug on a typical
// WordPress site: confirmed against a real 39-stylesheet page where the
// one file that actually carries brand colors (Elementor's per-post Kit
// CSS, post-N.css) sat at position 15 -- past any reasonable cutoff --
// while the first 10 were dashicons, admin-bar, cookie-consent, and other
// plugin CSS that never carries color data. Prioritizing post-N.css
// first, then other Elementor-tagged files, then everything else (same
// ordering crawl-inspo.js already uses and already proved out) fixes
// that without needing to raise the fetch cap for every site.
function extractStylesheetUrls(html, origin) {
  const linkRe = /<link[^>]+rel=["']stylesheet["'][^>]*>/gi;
  const hrefRe = /href=["']([^"']+)["']/i;
  const links = html.match(linkRe) || [];
  const postCssUrls = [];
  const elementorUrls = [];
  const otherUrls = [];
  for (const tag of links) {
    const m = tag.match(hrefRe);
    if (!m) continue;
    let resolved;
    try {
      resolved = new URL(m[1], origin).href;
    } catch {
      continue; // malformed href -- skip, don't fail the whole extraction over it
    }
    if (/post-\d+\.css/i.test(resolved)) postCssUrls.push(resolved);
    else if (/elementor/i.test(resolved)) elementorUrls.push(resolved);
    else otherUrls.push(resolved);
  }
  const ordered = [...new Set([...postCssUrls, ...elementorUrls, ...otherUrls])];
  return ordered.slice(0, MAX_CSS_FETCHES);
}

async function fetchAllCss(html, origin) {
  const urls = extractStylesheetUrls(html, origin);
  if (!urls.length) return "";
  const bodies = await Promise.all(urls.map(u => fetchCss(u)));
  return bodies.filter(Boolean).join("\n");
}

// ---- Color extraction --------------------------------------------------

// Elementor sites expose Global Colors as CSS custom properties directly
// (confirmed convention, see api/crawl-inspo.js). Checked first since it's
// the single most reliable signal available on any site that has it.
// Elementor's 4 stock slots use readable ids (primary/secondary/text/
// accent); anything a site owner adds beyond those gets an opaque
// hash-style id instead, returned separately as "custom" rather than
// discarded -- confirmed against a real site (AFS) that keeps 5 named
// brand colors, including its actual yellow accent, entirely in custom
// slots the stock 4 never surface.
const ELEMENTOR_STOCK_SLOTS = ["primary", "secondary", "text", "accent"];
function extractElementorGlobalColors(css) {
  const stock = {};
  const custom = {};
  const re = /--e-global-color-([a-z0-9]+)\s*:\s*(#[0-9a-fA-F]{3,8})/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const id = m[1].toLowerCase();
    const hex = expandHex(m[2]);
    if (ELEMENTOR_STOCK_SLOTS.includes(id)) stock[id] = hex;
    else custom[id] = hex;
  }
  return { stock, custom };
}

// General fallback: CSS custom properties declared at :root/html/body.
// The strongest non-Elementor signal -- most modern site builders (Webflow,
// WordPress FSE themes, hand-built design-token setups) still define brand
// colors this way, just under their own property names.
function extractRootCustomProperties(css) {
  const found = {};
  const blockRe = /(?::root|html|body)\s*\{([^}]*)\}/gi;
  let blockMatch;
  while ((blockMatch = blockRe.exec(css)) !== null) {
    const propRe = /--([a-zA-Z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})/g;
    let m;
    while ((m = propRe.exec(blockMatch[1])) !== null) {
      found[m[1].toLowerCase()] = expandHex(m[2]);
    }
  }
  return found;
}

// Last-resort fallback: frequency-rank colors used in high-signal
// selectors only -- never every color in the whole stylesheet, which
// returns dozens of shadow/border/disabled-state colors that aren't brand
// colors at all. Deliberately narrow rather than clever; a prior pass on
// a similar problem (see crawl-inspo.js's note on a dropped
// .elementor-button heuristic) confirmed that a cleverer-looking signal
// isn't necessarily a more reliable one.
const HIGH_SIGNAL_BLOCKS = [
  /\bbody\s*\{([^}]*)\}/gi,
  /\bh1\s*\{([^}]*)\}/gi,
  /\ba(?::hover)?\s*\{([^}]*)\}/gi,
  /\bbutton\s*\{([^}]*)\}/gi,
  /\.btn[^{,]*\{([^}]*)\}/gi,
  /\bheader\s*\{([^}]*)\}/gi,
  /\bnav\s*\{([^}]*)\}/gi,
];

function extractHighSignalColors(css) {
  const counts = {};
  for (const re of HIGH_SIGNAL_BLOCKS) {
    let m;
    while ((m = re.exec(css)) !== null) {
      const colorRe = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g;
      let c;
      while ((c = colorRe.exec(m[1])) !== null) {
        const hex = expandHex(c[0]);
        counts[hex] = (counts[hex] || 0) + 1;
      }
    }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([hex]) => hex);
}

// "#000" is valid CSS but reads as broken sitting next to seven 6-digit
// hex codes in an exported document -- confirmed against a real site
// (jpmorganchase.com) where the frequency heuristic picked up shorthand
// hex used directly in the site's own CSS. Normalizing at the point of
// extraction means every downstream consumer (buildColorSet, darkenHex,
// the UI, the exported document) sees only 6-digit values, rather than
// needing the same fix repeated at every display site.
function expandHex(hex) {
  const h = hex.replace("#", "");
  if (h.length === 3) return "#" + h.split("").map(c => c + c).join("").toUpperCase();
  return hex.toUpperCase();
}

function darkenHex(hex, amount) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const num = parseInt(h, 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
  return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("").toUpperCase();
}

// Relative luminance -- used only to guess "is this dark or light" for
// role assignment, not as any accessibility-contrast claim.
function luminance(hex) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return 0.5;
  const num = parseInt(h, 16);
  const r = ((num >> 16) & 0xff) / 255;
  const g = ((num >> 8) & 0xff) / 255;
  const b = (num & 0xff) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Builds Spec's 8-role color set from whatever was actually found, trying
// each signal in priority order: Elementor's own convention first, then
// :root custom properties, then the frequency heuristic as a last resort.
// Confidence is honest about which path produced each value -- "confirmed"
// only for something actually read off the site, "derived" for anything
// computed from a confirmed value, "estimated" for the frequency-heuristic
// guesses, and a slot is left out entirely rather than invented when
// there's genuinely no signal for it.
// Real sites name their custom properties every possible way
// (--heading-color, --text-primary, --clr-heading, ...) -- an exact-match
// lookup on one fixed key ("heading") missed nearly every real-world case
// during testing against synthetic fixtures modeled on common conventions.
// Substring matching against a short, ordered keyword list is far more
// forgiving. Order matters: earlier keywords in each list win when a
// property name could plausibly match more than one role's list.
function findRootProp(rootProps, keywords) {
  for (const kw of keywords) {
    const hit = Object.entries(rootProps).find(([key]) => key.includes(kw));
    if (hit) return hit[1];
  }
  return null;
}

export function buildColorSet(css) {
  const elementor = extractElementorGlobalColors(css);
  const stock = elementor.stock;
  const rootProps = extractRootCustomProperties(css);
  const ranked = extractHighSignalColors(css);

  const result = [];
  const used = new Set(); // Every hex assigned to any role, from any
                           // signal source, goes in here -- confirmed
                           // against a real site (jpmorganchase.com) that
                           // the previous version only deduped WITHIN the
                           // ranked-list fallback, so two independent
                           // "confirmed" matches (e.g. a :root property
                           // that happens to match both the heading and
                           // background keyword lists) could still claim
                           // the same hex for two different roles with no
                           // cross-check between them at all.
  function add(role, hex, confidence) {
    if (!hex || used.has(hex)) return false;
    result.push({ role, hex, confidence, custom: false });
    used.add(hex);
    return true;
  }
  function nextRanked() {
    return ranked.find(hex => !used.has(hex)) || null;
  }
  // Tries each CONFIRMED candidate for a role, in priority order.
  // Deliberately does not fall through to the ranked/estimated guess
  // here -- that happens in a second pass below, only after every role
  // has had a chance to claim its own real signal first. Without that
  // split, whichever role happens to run first (Heading, in source
  // order) could grab a value through the weak fallback before a later
  // role's much stronger confirmed match ever got a turn -- confirmed
  // against a real site (jpmorganchase.com) where exactly that happened:
  // Heading's fallback guess claimed the one color Accent's real :root
  // property was about to confirm, leaving Accent with nothing at all.
  function tryConfirmed(role, candidates) {
    for (const hex of candidates) {
      if (hex && add(role, hex, "confirmed")) return true;
    }
    return false;
  }

  // Elementor's own 4 stock slots: "Primary" is the dominant/heading color
  // in real-world use (confirmed against a real site, see crawl-inspo.js's
  // note on this), "Text" is specifically body copy -- an earlier version
  // of this function had these backwards, mapping "Text" to Heading and
  // never producing a Body text role at all.
  const headingProp = findRootProp(rootProps, ["heading", "headline", "title", "text-dark", "-dark"]);
  const headingOk = tryConfirmed("Heading", [stock.primary, stock.text, headingProp]);

  const bodyTextProp = findRootProp(rootProps, ["body-text", "text-body", "body-color", "paragraph"]);
  const bodyOk = tryConfirmed("Body text", [stock.text, bodyTextProp]);

  // "primary" is deliberately also checked here as a fallback for accent
  // (not just heading above) -- in general CSS convention (Bootstrap,
  // Material, Tailwind) "--primary" more often names the brand/accent
  // color than heading text, so a non-Elementor site's :root variable
  // named "primary" is checked against the accent list too.
  const accentProp = findRootProp(rootProps, ["accent", "brand", "primary", "cta", "action"]);
  const accentOk = tryConfirmed("Accent", [stock.accent, accentProp]);

  const bgProp = findRootProp(rootProps, ["background", "bg", "surface", "canvas"]);
  const bgOk = tryConfirmed("Background", [stock.secondary, bgProp]);

  const mutedProp = findRootProp(rootProps, ["muted", "stone", "secondary-text", "gray", "grey"]);
  const mutedOk = tryConfirmed("Muted", [mutedProp]);

  // Second pass -- only now does anything reach for the frequency-ranked
  // guess, and only for roles that came up empty above.
  if (!headingOk) { const c = nextRanked(); if (c) add("Heading", c, "estimated"); }
  if (!bodyOk) { const c = nextRanked(); if (c) add("Body text", c, "estimated"); }
  if (!accentOk) { const c = nextRanked(); if (c) add("Accent", c, "estimated"); }
  if (!bgOk) {
    // White is a safe structural default even if it collides with
    // something already assigned via a confirmed signal -- an unfilled
    // Background is worse than a possibly-duplicate white, so this is
    // the one role that intentionally skips the used-check on the way
    // in. It still gets registered in `used` afterward, though -- a real
    // site (jpmorganchase.com) confirmed the gap: without this, a later
    // role's ranked-fallback could independently rediscover white too
    // (a bank site has plenty of it) and produce the exact same
    // accidental duplicate this whole pass structure was built to catch.
    result.push({ role: "Background", hex: "#FFFFFF", confidence: "derived", custom: false });
    used.add("#FFFFFF");
  }
  if (!mutedOk) { const c = nextRanked(); if (c) add("Muted", c, "estimated"); }

  // Derived roles, computed only after Accent and Heading have their
  // final values from both passes above.
  const accentEntry = result.find(r => r.role === "Accent");
  if (accentEntry) add("Accent — hover", darkenHex(accentEntry.hex, 0.15), "derived");

  const headingEntry = result.find(r => r.role === "Heading");
  if (headingEntry && luminance(headingEntry.hex) < 0.3) {
    result.push({ role: "Dark panel", hex: headingEntry.hex, confidence: "derived", custom: false });
  } else {
    result.push({ role: "Dark panel", hex: "#1A1A1A", confidence: "derived", custom: false });
  }

  result.push({ role: "Text on dark", hex: "#FAFAF8", confidence: "derived", custom: false });

  // Elementor global colors beyond the 4 stock slots are real, deliberate,
  // site-owner-named brand colors -- confirmed against a real site (AFS)
  // that keeps its actual yellow accent entirely in one of these. Previously
  // discarded outright; now surfaced as "Additional colors" (the same
  // free-form custom-color shape the UI already supports for manually
  // added colors), skipping anything that duplicates a hex already used
  // for one of the 8 template roles above. Capped at 6 so a site with a
  // large custom palette doesn't flood the results.
  // Filtering once up front against `used` and THEN looping isn't enough --
  // two custom-color ids can share the same hex (confirmed in the real AFS
  // data: two differently-named custom slots both resolve to #2B2826), so
  // the used-check has to happen per-iteration, not just before the loop,
  // or duplicates among the custom entries themselves slip through.
  let addedCustom = 0;
  for (const [id, hex] of Object.entries(elementor.custom)) {
    if (addedCustom >= 6) break;
    if (used.has(hex)) continue;
    result.push({ custom: true, hex, name: "", usage: "", confidence: "confirmed" });
    used.add(hex);
    addedCustom++;
  }

  return result;
}

// ---- Font extraction ----------------------------------------------------

// Icon fonts (rendering icons AS letters via font glyphs -- an arrow, a
// hamburger menu, a star) are structurally identical to real typography
// once declared: a font-family name plus a font file, via the exact same
// @font-face or Google Fonts mechanisms a real heading/body font uses.
// Nothing in that structure distinguishes "this is meant to be read" from
// "this is meant to be an icon." Nearly every icon font system puts
// "icon" directly in its family name -- swiper-icons, elementor's own
// eicons, WordPress's bundled dashicons and genericons, material-icons /
// material-symbols, bootstrap-icons, ionicons, glyphicons, octicons,
// remixicon, themify-icons, simple-line-icons, linearicons, typicons --
// so a single substring check catches the large majority of real-world
// cases, including the two most likely to show up on Spec's own client
// sites: WordPress and Elementor both load their icon fonts by default,
// not as an opt-in. Font Awesome is the one common exception with no
// literal "icon" in its name, so it gets an explicit check too.
function isLikelyIconFont(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("icon")) return true;
  if (n.includes("fontawesome") || n.includes("font awesome")) return true;
  if (n.includes("material symbol")) return true; // Google's newer icon system -- "Material Symbols Outlined/Rounded/Sharp" has no literal "icon" in the name
  return false;
}

function extractGoogleFontLinks(html) {
  const names = [];
  const re = /fonts\.googleapis\.com\/css2?\?family=([^"'&]+)/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const family = decodeURIComponent(m[1].split(":")[0]).replace(/\+/g, " ");
    if (family && !isLikelyIconFont(family)) names.push(family);
  }
  return [...new Set(names)];
}

function extractFontFaceNames(css) {
  const names = [];
  const re = /@font-face\s*\{[^}]*font-family\s*:\s*["']?([^;"'}]+)["']?/gi;
  let m;
  while ((m = re.exec(css)) !== null) {
    const name = m[1].trim();
    if (name && !isLikelyIconFont(name)) names.push(name);
  }
  return [...new Set(names)];
}

const GENERIC_FONT_FAMILIES = ["sans-serif", "serif", "monospace", "system-ui", "-apple-system", "cursive", "fantasy", "ui-sans-serif", "ui-serif"];

function extractSelectorFontFamily(css, selector) {
  const re = new RegExp(selector + "\\s*\\{([^}]*)\\}", "i");
  const m = css.match(re);
  if (!m) return null;
  const fontMatch = m[1].match(/font-family\s*:\s*([^;]+);/i);
  if (!fontMatch) return null;
  const first = fontMatch[1].split(",")[0].trim().replace(/^["']|["']$/g, "");
  if (GENERIC_FONT_FAMILIES.includes(first.toLowerCase())) return null;
  // Belt-and-suspenders: even if an h1/body selector's own font-family
  // rule genuinely resolves to an icon font (a misconfigured site, or a
  // decorative icon-as-heading trick), it's still not something to
  // report as the brand's real heading/body typeface.
  if (isLikelyIconFont(first)) return null;
  return first;
}

// Mirrors buildColorSet's confidence honesty: "confirmed" when the font
// is also independently named via a @font-face or Google Fonts link (an
// explicit, intentional declaration), "estimated" when it's only inferred
// from a CSS selector's font-family value.
export function buildFontSet(html, css) {
  const googleFonts = extractGoogleFontLinks(html);
  const fontFaceNames = extractFontFaceNames(css);
  const knownNames = [...new Set([...googleFonts, ...fontFaceNames])];

  const headingFamily = extractSelectorFontFamily(css, "h1");
  const bodyFamily = extractSelectorFontFamily(css, "body");

  function confidenceFor(name) {
    return name && knownNames.some(k => k.toLowerCase() === name.toLowerCase()) ? "confirmed" : "estimated";
  }

  const result = [];
  if (headingFamily) result.push({ role: "Heading", name: headingFamily, confidence: confidenceFor(headingFamily) });
  if (bodyFamily && bodyFamily.toLowerCase() !== (headingFamily || "").toLowerCase()) {
    result.push({ role: "Body", name: bodyFamily, confidence: confidenceFor(bodyFamily) });
  }

  // A font declared via @font-face or a Google Fonts link but never
  // matched to body/h1 specifically still gets surfaced, rather than
  // silently dropping a real signal just because it wasn't tied to one of
  // the two selectors this checks directly.
  for (const name of knownNames) {
    if (!result.some(r => r.name.toLowerCase() === name.toLowerCase())) {
      result.push({ role: "Other", name, confidence: "confirmed" });
    }
  }

  return result;
}

export function guessBrandName(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  if (!m) return "";
  // Strip common title-tag suffixes ("Brand Name | Tagline", "Brand Name -
  // Home") down to just the leading segment. A starting guess, not a
  // confident final answer -- always shown editable in the UI before save.
  return m[1].split(/[|\u2013\u2014-]/)[0].trim();
}

// ---- Handler --------------------------------------------------------------

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const userId = await requireAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  // Lighter than crawl-inspo's cap (which does up to ~14 fetches per call
  // across a multi-page crawl plus screenshots) -- this only ever needs
  // the homepage plus its own stylesheets, so a more generous per-user
  // limit is still safe without meaningfully raising server load.
  if (!(await rateLimit(userId, "extract-style", 20))) return tooMany(res);

  const { url } = req.body || {};
  if (!url || typeof url !== "string" || url.length > 2000) {
    return res.status(400).json({ error: "No URL provided" });
  }

  try {
    const base = new URL(url.startsWith("http") ? url : "https://" + url);
    const origin = base.origin;

    if (!(await isSafeUrl(base.href))) {
      return res.status(400).json({ error: "That URL cannot be analyzed. Use a public website address." });
    }

    const html = await fetchPage(base.href);
    if (!html) return res.status(400).json({ error: "Could not fetch " + base.href });

    const css = await fetchAllCss(html, origin);
    // Elementor writes some of its custom properties directly into the
    // page's own inline <style>/attributes, not only into linked
    // stylesheets (confirmed in crawl-inspo.js against a real site) --
    // so the color pass reads html + css together, not css alone.
    const colors = buildColorSet(html + "\n" + css);
    const fonts = buildFontSet(html, css);

    // Regex extraction hits a real structural ceiling on sites where fonts
    // never appear as a literal "font-family: X" string in source CSS (Wix's
    // proprietary rendering, Tailwind utility classes, CSS-variable font
    // stacks) -- confirmed against real sites, not theoretical. Only spend a
    // Browserless call when the cheap path didn't already confidently
    // resolve both roles; a "confirmed" regex match (an explicit @font-face
    // or Google Fonts declaration) is already trustworthy on its own.
    const headingConfirmed = fonts.some(f => f.role === "Heading" && f.confidence === "confirmed");
    const bodyConfirmed = fonts.some(f => f.role === "Body" && f.confidence === "confirmed");
    // Diagnostic surfaced in the response itself (prefixed _ to signal it's
    // not a stable field) -- lets this be checked directly in the browser's
    // Network tab instead of needing server logs pulled for every "why no
    // computed badge" question. attempted:false means the regex pass already
    // confidently resolved both roles, so Browserless was never called --
    // not a failure, just unnecessary.
    let fontExtractionDebug = { attempted: false };
    if (!headingConfirmed || !bodyConfirmed) {
      const computed = await extractComputedFonts(base.href);
      fontExtractionDebug = { attempted: true, ok: computed.ok, reason: computed.ok ? undefined : computed.reason };
      if (!computed.ok) {
        // Not an errorLog.js entry -- that table is explicitly scoped to
        // genuine unexpected errors an admin needs to review, not routine
        // "the enhancement path degraded gracefully" outcomes. Plain
        // console.error for Vercel's function logs is the right channel;
        // _fontExtractionDebug above is the primary diagnostic surface.
        console.error("extract-style: computed font extraction failed:", computed.reason);
      } else {
        // Once the Browserless call has already fired (because at least one
        // role wasn't confirmed), upgrading the OTHER role too costs
        // nothing extra and "computed" is strictly more trustworthy than
        // "confirmed" anyway -- a regex match assumes the declared rule is
        // what's actually applied, computed style is what the browser
        // actually resolved. Not gated per-field on purpose.
        if (computed.heading) {
          const idx = fonts.findIndex(f => f.role === "Heading");
          const entry = { role: "Heading", name: computed.heading, confidence: "computed" };
          if (idx >= 0) fonts[idx] = entry; else fonts.unshift(entry);
        }
        if (computed.body && computed.body.toLowerCase() !== (computed.heading || "").toLowerCase()) {
          const idx = fonts.findIndex(f => f.role === "Body");
          const entry = { role: "Body", name: computed.body, confidence: "computed" };
          if (idx >= 0) fonts[idx] = entry; else fonts.splice(1, 0, entry);
        }
      }
    }

    const brandNameGuess = guessBrandName(html);

    return res.status(200).json({ origin, brandNameGuess, colors, fonts, _fontExtractionDebug: fontExtractionDebug });
  } catch (err) {
    await logError("extract-style", req.method, userId, 500, err.message);
    return res.status(500).json({ error: err.message });
  }
}
