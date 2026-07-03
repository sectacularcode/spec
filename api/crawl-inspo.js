// POST /api/crawl-inspo — fetch a public inspiration site and extract structure.
//
// Security model:
// - Auth via verified Clerk JWT.
// - SSRF protection: only http/https, hostname must not resolve to private,
//   loopback, link-local, or cloud-metadata IP ranges. Redirects are followed
//   manually and every hop is re-validated. Response bodies are size-capped.
// - Per-user rate limit — crawling is expensive (up to 8 page fetches + one
//   Anthropic call per request).

import dns from "node:dns/promises";
import net from "node:net";
import { requireAuth } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";
import { callAnthropic, extractJSON } from "./_lib/anthropic.js";

const MAX_REDIRECTS = 3;
const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2MB per page
const FETCH_TIMEOUT_MS = 8000;

function isPrivateIPv4(ip) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(n => Number.isNaN(n))) return true;
  const [a, b] = parts;
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIp(ip) {
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower.startsWith("::ffff:")) {
      const mapped = lower.slice(7);
      return net.isIPv4(mapped) ? isPrivateIPv4(mapped) : true;
    }
    return (
      lower === "::" || lower === "::1" ||
      lower.startsWith("fc") || lower.startsWith("fd") ||
      lower.startsWith("fe80")
    );
  }
  return isPrivateIPv4(ip);
}

// Validates protocol and resolves the hostname to confirm it points at a
// public address. Returns true only when every resolved address is public.
async function isSafeUrl(urlString) {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

  const host = parsed.hostname.replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
  if (net.isIP(host)) return !isPrivateIp(host);

  try {
    const addrs = await dns.lookup(host, { all: true, verbatim: true });
    if (!addrs.length) return false;
    return addrs.every(a => !isPrivateIp(a.address));
  } catch {
    return false;
  }
}

// Fetches a page with manual redirect handling. Every redirect target is
// re-validated against the SSRF rules before following.
async function fetchPage(url) {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!(await isSafeUrl(current))) return null;
    let res;
    try {
      res = await fetch(current, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; SpecCrawler/1.0)",
          "Accept": "text/html",
        },
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch {
      return null;
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return null;
      try {
        current = new URL(location, current).href;
      } catch {
        return null;
      }
      continue;
    }

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return null;

    const declared = parseInt(res.headers.get("content-length") || "0", 10);
    if (declared > MAX_BODY_BYTES) return null;

    try {
      const text = await res.text();
      return text.length > MAX_BODY_BYTES ? text.slice(0, MAX_BODY_BYTES) : text;
    } catch {
      return null;
    }
  }
  return null;
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

    const navLinks = extractNavLinks(rootHtml, origin);
    const allUrls = [base.href, ...navLinks].filter((u, i, arr) => arr.indexOf(u) === i).slice(0, 8);

    const pages = await Promise.all(
      allUrls.map(async (pageUrl) => {
        const html = await fetchPage(pageUrl);
        if (!html) return null;
        const path = new URL(pageUrl).pathname;
        const pageType = inferPageType(path);
        const structure = extractStructure(html);
        return { url: pageUrl, path, pageType, structure };
      })
    );

    const discovered = pages.filter(Boolean);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ origin, pages: discovered });
    }

    const summary = await summarizeWithClaude(apiKey, origin, discovered);

    return res.status(200).json({
      origin,
      pageCount: discovered.length,
      pages: discovered.map(p => ({ url: p.url, path: p.path, pageType: p.pageType })),
      patterns: summary,
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
