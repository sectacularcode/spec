// POST /api/crawl-inspo — fetch a public inspiration site and extract structure.
//
// Security model:
// - Auth via verified Clerk JWT.
// - SSRF protection: only http/https, hostname must not resolve to private,
//   loopback, link-local, or cloud-metadata IP ranges. Redirects are followed
//   manually and every hop is re-validated. Response bodies are size-capped.
//   (See api/_lib/safeFetch.js -- shared with api/extract-style.js, which
//   needs the exact same protection for the exact same class of request.)
// - Per-user rate limit — crawling is expensive (up to 8 page fetches, plus
//   up to 6 CSS fetches for color extraction, plus one Anthropic call per
//   request — roughly 14 fetches worst case, still bounded by the same
//   per-user rate limit below).

import { requireAuth } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";
import { callAnthropic, extractJSON } from "./_lib/anthropic.js";
import { logUsage } from "./_lib/usage.js";
import { captureScreenshot } from "./_lib/screenshot.js";
import { LAYOUT_PATTERNS } from "../src/constants/patterns.js";
import { isSafeUrl, fetchResource, fetchPage } from "./_lib/safeFetch.js";

// Elementor's Kit-level Global Colors are almost never inline in the HTML
// response — they live in linked stylesheets. Pull the handful of
// Elementor-related <link rel="stylesheet"> URLs out of the page and fetch
// them too (same SSRF-checked fetch as everything else), capped to a
// small number so this stays cheap. Non-Elementor sites simply won't
// match any of these links, and the caller falls back to whatever (if
// anything) is inline.
const MAX_CSS_FETCHES = 6;

function extractElementorStylesheetUrls(html, origin) {
  const linkRe = /<link[^>]+rel=["']stylesheet["'][^>]*>/gi;
  const hrefRe = /href=["']([^"']+)["']/i;
  const links = html.match(linkRe) || [];
  const postCssUrls = [];
  const otherUrls = [];
  for (const tag of links) {
    const hrefMatch = tag.match(hrefRe);
    if (!hrefMatch) continue;
    const href = hrefMatch[1];
    if (!/elementor/i.test(href)) continue;
    let resolved;
    try { resolved = new URL(href, origin).href; } catch { continue; }
    // Elementor's Kit-level Global Colors live in a small per-post CSS
    // file named like post-857.css — confirmed by testing against a real
    // site, where this file was the only one (out of 15 elementor-tagged
    // stylesheets) containing --e-global-color definitions. Prioritize
    // these over large generic framework files (frontend.min.css, etc.).
    if (/post-\d+\.css/i.test(href)) postCssUrls.push(resolved);
    else otherUrls.push(resolved);
  }
  const ordered = [...new Set([...postCssUrls, ...otherUrls])];
  return ordered.slice(0, MAX_CSS_FETCHES);
}

async function fetchElementorCss(html, origin) {
  const urls = extractElementorStylesheetUrls(html, origin);
  if (!urls.length) return "";
  const bodies = await Promise.all(urls.map(u => fetchResource(u, "css")));
  return bodies.filter(Boolean).join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const userId = await requireAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (!(await rateLimit(userId, "crawl-inspo", 5))) return tooMany(res);

  const { url } = req.body || {};
  if (!url || typeof url !== "string" || url.length > 2000) {
    return res.status(400).json({ error: "No URL provided" });
  }

  try {
    const base = new URL(url.startsWith("http") ? url : "https://" + url);
    const origin = base.origin;

    if (!(await isSafeUrl(base.href))) {
      return res.status(400).json({ error: "That URL cannot be crawled. Use a public website address." });
    }

    const rootHtml = await fetchPage(base.href);
    if (!rootHtml) return res.status(400).json({ error: "Could not fetch " + base.href });

    const elementorCss = await fetchElementorCss(rootHtml, origin);
    const colorExtraction = buildColorsFromExtraction(rootHtml + "\n" + elementorCss);

    const navLinks = extractNavLinks(rootHtml, origin);
    const allUrls = [base.href, ...navLinks].filter((u, i, arr) => arr.indexOf(u) === i).slice(0, 8);

    // Fetch HTML (for page-type inference and the text-fallback path) and
    // attempt a screenshot capture in parallel for every discovered page.
    const pages = await Promise.all(
      allUrls.map(async (pageUrl) => {
        const html = await fetchPage(pageUrl);
        if (!html) return null;
        const path = new URL(pageUrl).pathname;
        const pageType = inferPageType(path);
        const structure = extractStructure(html);
        const screenshot = await captureScreenshot(pageUrl);
        return { url: pageUrl, path, pageType, structure, screenshot };
      })
    );

    const discovered = pages.filter(Boolean);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        origin,
        pages: discovered.map(p => ({ url: p.url, path: p.path, pageType: p.pageType })),
        colors: colorExtraction?.colors || null,
        colorConfidence: colorExtraction?.confidence || null,
      });
    }

    const anyScreenshotSucceeded = discovered.some(p => p.screenshot);

    let patternBoosts = {};
    let pagesSummaryText = {};
    let siteNotes = "";
    let visionAnalysisUsed = false;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    if (anyScreenshotSucceeded) {
      visionAnalysisUsed = true;
      // Classify every page that got a real screenshot. Pages where the
      // capture failed (site blocked it, timed out, etc.) are simply
      // skipped rather than falling back per-page — a partial-vision crawl
      // is still far more reliable than a full-text-only one.
      const results = await Promise.all(
        discovered.map(async (p) => {
          if (!p.screenshot) return { page: p, result: null };
          const result = await classifyPageLayout(apiKey, p.screenshot, p.pageType);
          return { page: p, result };
        })
      );

      for (const { page, result } of results) {
        if (!result) continue;
        totalInputTokens += result.usage?.input_tokens || 0;
        totalOutputTokens += result.usage?.output_tokens || 0;

        const classification = result.classification || {};
        const labelParts = [];
        Object.keys(classification).forEach((sectionType) => {
          const patternId = classification[sectionType];
          // Real visual confirmation is a much stronger signal than the old
          // text-keyword regex match, so it's weighted higher (15 vs the
          // regex path's 8) in selectPatterns()'s scoring.
          patternBoosts[patternId] = (patternBoosts[patternId] || 0) + 15;
          const matchedPattern = (LAYOUT_PATTERNS[sectionType] || []).find(p => p.id === patternId);
          if (matchedPattern) labelParts.push(matchedPattern.label);
        });
        if (labelParts.length) {
          pagesSummaryText[page.pageType] = labelParts.join("; ");
        }
      }

      if (Object.keys(pagesSummaryText).length) {
        siteNotes = "Layout patterns identified from real screenshots of " + origin + ".";
      }

      if (totalInputTokens || totalOutputTokens) {
        await logUsage({
          userId,
          clientName: null,
          route: "crawl-inspo-vision",
          model: "claude-haiku-4-5-20251001",
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
        });
      }
    }

    // Full fallback to the old text-only analysis — only when screenshot
    // capture failed for every single page (SNAPRENDER_API_KEY missing,
    // the API down, or every target blocked automated capture). This keeps
    // the feature working, just without the visual-accuracy improvement,
    // instead of failing the whole crawl over one missing dependency.
    if (!anyScreenshotSucceeded) {
      const summary = await summarizeWithClaude(apiKey, origin, discovered);
      if (summary) {
        siteNotes = summary.siteNotes || "";
        pagesSummaryText = summary.pages || {};
      }
    }

    return res.status(200).json({
      origin,
      pageCount: discovered.length,
      pages: discovered.map(p => ({ url: p.url, path: p.path, pageType: p.pageType, hadScreenshot: !!p.screenshot })),
      patterns: { siteNotes, pages: pagesSummaryText },
      patternBoosts,
      visionAnalysisUsed,
      colors: colorExtraction?.colors || null,
      colorConfidence: colorExtraction?.confidence || null,
    });

  } catch (err) {
    console.error("crawl-inspo error:", err);
    return res.status(500).json({ error: err.message });
  }
}

function extractNavLinks(html, origin) {
  const links = [];
  const navMatch = html.match(/<(nav|header)[^>]*>([\s\S]*?)<\/(nav|header)>/gi) || [];
  const searchArea = navMatch.length > 0 ? navMatch.join(" ") : html;

  const hrefRegex = /href=["']([^"'#?]+)["']/gi;
  let match;
  while ((match = hrefRegex.exec(searchArea)) !== null) {
    const href = match[1];
    try {
      const resolved = new URL(href, origin).href;
      if (resolved.startsWith(origin) && resolved !== origin && resolved !== origin + "/") {
        const path = new URL(resolved).pathname;
        if (!path.match(/\.(jpg|png|gif|svg|css|js|pdf|ico|woff|ttf)$/i) &&
            !path.includes("/wp-") && !path.includes("/feed") &&
            !path.includes("/cdn-") && !path.includes("/assets")) {
          links.push(resolved.replace(/\/$/, "") || resolved);
        }
      }
    } catch {}
  }
  return [...new Set(links)];
}

// Elementor writes its Kit's Global Colors directly into the page as CSS
// custom properties — confirmed live (--e-global-color-text on a real
// production nav menu) rather than guessed. The 4 stock slots
// (primary/secondary/text/accent) use readable names; any additional
// custom-added swatches (e.g. a brand's own "Button Color") get an
// opaque hash-style id instead, since only the human-readable label for
// those lives in Elementor's admin UI, not in the rendered CSS.
const STOCK_SLOTS = ["primary", "secondary", "text", "accent"];

function extractElementorGlobalColors(html) {
  const found = {};
  const custom = {};
  const re = /--e-global-color-([a-z0-9]+)\s*:\s*(#[0-9a-fA-F]{3,8})/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const id = m[1].toLowerCase();
    const hex = m[2].toUpperCase();
    if (STOCK_SLOTS.includes(id)) found[id] = hex;
    else custom[id] = hex;
  }
  return { stock: found, custom };
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

// Builds a brief-schema colors object (ink/brass/brass-deep/bone/asphalt/
// stone/warm-white/text) from what was actually found on the page.
// Mapping is grounded in a real confirmed case (Penn Jersey): Elementor's
// "Primary" slot was the actual hero/dark-panel color, and a single custom
// global color beyond the 4 stock slots was the real accent (labeled
// "Button Color" in that site's own Elementor UI) — not an assumption
// made in the abstract. Fields with no real signal are left blank rather
// than guessed, same rule the brief parser already follows.
//
// NOTE: an earlier version tried to confirm the accent by finding which
// color a .elementor-button CSS rule actually uses — tested against a real
// site and it returned a generic Elementor-core default, not the site's
// real accent. Dropped rather than ship an unreliable "confirmed" value.
function buildColorsFromExtraction(html) {
  const { stock, custom } = extractElementorGlobalColors(html);
  if (!Object.keys(stock).length && !Object.keys(custom).length) return null;

  const colors = { ink: "", brass: "", "brass-deep": "", bone: "", asphalt: "", stone: "", "warm-white": "", text: "" };
  const confidence = {};

  if (stock.text) { colors.ink = stock.text; colors.text = stock.text; confidence.ink = confidence.text = "confirmed"; }
  if (stock.secondary) { colors["warm-white"] = stock.secondary; confidence["warm-white"] = "confirmed"; }
  if (stock.primary) { colors.asphalt = stock.primary; confidence.asphalt = "confirmed"; }

  const customIds = Object.keys(custom);
  if (customIds.length === 1) {
    colors.brass = custom[customIds[0]];
    confidence.brass = "confirmed (single custom global color — reliable accent signal)";
  } else if (stock.accent) {
    colors.brass = stock.accent;
    confidence.brass = customIds.length > 1
      ? "uncertain (multiple custom colors found, defaulted to stock accent slot — review)"
      : "confirmed (Elementor accent slot)";
  }
  if (colors.brass) {
    colors["brass-deep"] = darkenHex(colors.brass, 0.15);
    confidence["brass-deep"] = "derived (darkened brass)";
  }

  return { colors, confidence, rawFound: { ...stock, ...custom } };
}

function inferPageType(path) {
  const p = path.toLowerCase().replace(/\//g, "");
  if (!p || p === "home" || p === "index") return "home";
  if (p.match(/work|portfolio|project|film|case|show/)) return "work";
  if (p.match(/service|pricing|package|offer|cost|rate/)) return "services";
  if (p.match(/about|story|team|maker|founder|us/)) return "about";
  if (p.match(/process|how|approach|method/)) return "process";
  if (p.match(/contact|reach|connect|hire|start/)) return "contact";
  return "other";
}

// Which LAYOUT_PATTERNS section keys are worth checking for a given crawled
// page type. A "home" page can show multiple section types (hero, services
// preview, cta); other page types map to one or two relevant sections.
const PAGE_TYPE_SECTIONS = {
  home: ["hero", "cta"],
  work: ["portfolio"],
  services: ["services", "pricing"],
  about: ["about"],
  process: ["process"],
  contact: ["contact"],
  other: [],
};

function extractStructure(html) {
  const clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3000);
  return clean;
}

// Looks at a real screenshot of a page and classifies which layout pattern
// actually appears for each relevant section type — grounded against
// Spec's real pattern catalog (LAYOUT_PATTERNS), not a freeform text guess.
// This is the fix for the old approach (extractStructure + a text-only
// Claude summary): stripping all HTML before analysis discarded every real
// visual signal, so "structural" recommendations were necessarily generic
// and rarely matched the specific keywords the old regex scorer looked
// for. A screenshot is the one signal that's genuinely framework-agnostic
// — it looks the same regardless of what the reference site is built with.
//
// Returns null if the screenshot capture failed (missing API key, target
// site blocked the capture, etc.) — callers must fall back gracefully.
async function classifyPageLayout(apiKey, screenshot, pageType) {
  const sectionKeys = PAGE_TYPE_SECTIONS[pageType] || [];
  if (!screenshot || sectionKeys.length === 0) return null;

  const catalogText = sectionKeys
    .map(key => key + ": " + (LAYOUT_PATTERNS[key] || []).map(p => p.id + " — " + p.label).join(" | "))
    .join("\n");

  const prompt = `This is a real screenshot of a ${pageType} page from a reference website.

For each section type below, look at what is ACTUALLY visible in the screenshot and pick the pattern id that best matches the real layout you see. Only classify a section type if you can actually see it in the screenshot — never guess or assume a section exists if it isn't visible.

${catalogText}

Return ONLY valid JSON, one key per section type you could actually identify:
{ "sectionType": "pattern-id" }

If you cannot confidently identify any of the listed section types in this screenshot, return {}.`;

  try {
    const { ok, data } = await callAnthropic(apiKey, {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: "You are a visual design analyst looking at a real screenshot. Return ONLY valid JSON with no markdown, no explanation. Never classify a section you cannot actually see.",
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: screenshot.mediaType, data: screenshot.base64 } },
          { type: "text", text: prompt },
        ],
      }],
    });
    if (!ok) return null;
    const parsed = extractJSON(data);
    return parsed ? { classification: parsed, usage: data.usage } : null;
  } catch {
    return null;
  }
}

async function summarizeWithClaude(apiKey, origin, pages) {
  const pageDescriptions = pages.map(p =>
    "PAGE: " + p.pageType + " (" + p.path + ")\n" + p.structure.slice(0, 600)
  ).join("\n\n---\n\n");

  const prompt = `You are analyzing a reference website (${origin}) to extract structural and design patterns that can inform a new website build.

Here is the text content extracted from each page:

${pageDescriptions}

Return ONLY a valid JSON object with this structure:
{
  "siteNotes": "2-3 sentence summary of the overall site style and tone",
  "pages": {
    "home": "what the home page hero and sections look like structurally",
    "work": "how the portfolio/work page is structured",
    "services": "how services or pricing is presented",
    "about": "how the about page tells the story",
    "process": "how the process page is laid out",
    "contact": "how the contact page is structured"
  }
}

Only include page keys that were found on the site. Keep each value to 1-2 sentences focused on layout and structure, not copying any copy verbatim.`;

  try {
    const { ok, data } = await callAnthropic(apiKey, {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      system: "You are a structural design analyst. Return ONLY valid JSON with no markdown, no code fences, no explanation.",
      messages: [{ role: "user", content: prompt }],
    });

    if (!ok) return null;
    return extractJSON(data);
  } catch {
    return null;
  }
}
