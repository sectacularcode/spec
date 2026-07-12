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

const MAX_CSS_FETCHES = 10;

// General stylesheet discovery -- every <link rel="stylesheet">, not just
// Elementor-tagged ones (crawl-inspo.js only needs Elementor's Kit CSS;
// this route has to work on any site builder, so it can't filter to one
// vendor's naming convention up front).
function extractStylesheetUrls(html, origin) {
  const linkRe = /<link[^>]+rel=["']stylesheet["'][^>]*>/gi;
  const hrefRe = /href=["']([^"']+)["']/i;
  const links = html.match(linkRe) || [];
  const urls = [];
  for (const tag of links) {
    const m = tag.match(hrefRe);
    if (!m) continue;
    try {
      urls.push(new URL(m[1], origin).href);
    } catch {
      // malformed href -- skip, don't fail the whole extraction over it
    }
  }
  return [...new Set(urls)].slice(0, MAX_CSS_FETCHES);
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
const ELEMENTOR_STOCK_SLOTS = ["primary", "secondary", "text", "accent"];
function extractElementorGlobalColors(css) {
  const found = {};
  const re = /--e-global-color-([a-z0-9]+)\s*:\s*(#[0-9a-fA-F]{3,8})/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const id = m[1].toLowerCase();
    if (ELEMENTOR_STOCK_SLOTS.includes(id)) found[id] = m[2].toUpperCase();
  }
  return found;
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
      found[m[1].toLowerCase()] = m[2].toUpperCase();
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
        const hex = c[0].toUpperCase();
        counts[hex] = (counts[hex] || 0) + 1;
      }
    }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([hex]) => hex);
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
  const rootProps = extractRootCustomProperties(css);
  const ranked = extractHighSignalColors(css);

  const result = [];
  const used = new Set(); // hex values already assigned to a role, so the
                           // same color doesn't get reused as both Heading
                           // and Accent just because it topped two lists
  function add(role, hex, confidence) {
    if (!hex) return;
    result.push({ role, hex, confidence });
    used.add(hex);
  }
  function nextRanked() {
    return ranked.find(hex => !used.has(hex)) || null;
  }

  const headingProp = findRootProp(rootProps, ["heading", "headline", "title", "text-dark", "-dark"]);
  if (elementor.text) add("Heading", elementor.text, "confirmed");
  else if (headingProp) add("Heading", headingProp, "confirmed");
  else { const c = nextRanked(); if (c) add("Heading", c, "estimated"); }

  // "primary" is deliberately in the accent list, not the heading list --
  // in real-world CSS convention (Bootstrap, Material, Tailwind, and most
  // hand-rolled design-token setups) "--primary" almost always names the
  // brand/accent color, not body or heading text.
  const accentProp = findRootProp(rootProps, ["accent", "brand", "primary", "cta", "action"]);
  let accentHex = null;
  if (elementor.accent) { accentHex = elementor.accent; add("Accent", accentHex, "confirmed"); }
  else if (accentProp) { accentHex = accentProp; add("Accent", accentHex, "confirmed"); }
  else { const c = nextRanked(); if (c) { accentHex = c; add("Accent", c, "estimated"); } }

  if (accentHex) add("Accent — hover", darkenHex(accentHex, 0.15), "derived");

  const bgProp = findRootProp(rootProps, ["background", "bg", "surface", "canvas"]);
  if (elementor.secondary) add("Background", elementor.secondary, "confirmed");
  else if (bgProp) add("Background", bgProp, "confirmed");
  else add("Background", "#FFFFFF", "derived");

  const headingEntry = result.find(r => r.role === "Heading");
  if (headingEntry && luminance(headingEntry.hex) < 0.3) add("Dark panel", headingEntry.hex, "derived");
  else add("Dark panel", "#1A1A1A", "derived");

  const mutedProp = findRootProp(rootProps, ["muted", "stone", "secondary-text", "gray", "grey"]);
  if (elementor.primary && elementor.primary !== accentHex) add("Muted", elementor.primary, "estimated");
  else if (mutedProp) add("Muted", mutedProp, "estimated");
  else { const c = nextRanked(); if (c) add("Muted", c, "estimated"); }

  add("Text on dark", "#FAFAF8", "derived");

  return result;
}

// ---- Font extraction ----------------------------------------------------

function extractGoogleFontLinks(html) {
  const names = [];
  const re = /fonts\.googleapis\.com\/css2?\?family=([^"'&]+)/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const family = decodeURIComponent(m[1].split(":")[0]).replace(/\+/g, " ");
    if (family) names.push(family);
  }
  return [...new Set(names)];
}

function extractFontFaceNames(css) {
  const names = [];
  const re = /@font-face\s*\{[^}]*font-family\s*:\s*["']?([^;"'}]+)["']?/gi;
  let m;
  while ((m = re.exec(css)) !== null) names.push(m[1].trim());
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
  return GENERIC_FONT_FAMILIES.includes(first.toLowerCase()) ? null : first;
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
    const brandNameGuess = guessBrandName(html);

    return res.status(200).json({ origin, brandNameGuess, colors, fonts });
  } catch (err) {
    await logError("extract-style", req.method, userId, 500, err.message);
    return res.status(500).json({ error: err.message });
  }
}
