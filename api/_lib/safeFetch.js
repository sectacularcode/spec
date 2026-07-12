// Shared SSRF-safe URL fetching. Originally lived only in crawl-inspo.js;
// pulled out here because the Style Guide extraction route needs the exact
// same protection for the exact same class of request (fetch an arbitrary
// user-supplied URL server-side) -- two independent copies of this logic
// is exactly the kind of thing that quietly drifts apart over time (see
// the buildPreviewHTML.js / landingPreview.js note elsewhere in this repo
// for a real case of that happening). One implementation, two callers.
//
// Security model:
// - Only http/https. Hostname must not resolve to a private, loopback,
//   link-local, or cloud-metadata IP range.
// - Redirects are followed manually (redirect: "manual") and every hop is
//   re-validated against the same rules -- a public URL that redirects to
//   an internal address is blocked at the redirect, not just the entry
//   point.
// - Response bodies are size-capped and type-checked before being read in
//   full.

import dns from "node:dns/promises";
import net from "node:net";

export const DEFAULT_MAX_REDIRECTS = 3;
export const DEFAULT_MAX_BODY_BYTES = 2 * 1024 * 1024; // 2MB
export const DEFAULT_FETCH_TIMEOUT_MS = 8000;

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
export async function isSafeUrl(urlString) {
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

// Fetches a resource with manual redirect handling. Every redirect target
// is re-validated against isSafeUrl() before following. expectedType is
// "html" or "css"; anything else is treated as a generic text fetch.
// opts lets a caller override the defaults (e.g. a route that only ever
// wants the first response, not redirect-following) without touching the
// shared defaults every other caller relies on.
export async function fetchResource(url, expectedType, opts = {}) {
  const maxRedirects = opts.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const maxBodyBytes = opts.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;
  const acceptHeader = expectedType === "css" ? "text/css,*/*;q=0.1" : expectedType === "html" ? "text/html" : "*/*";

  let current = url;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (!(await isSafeUrl(current))) return null;
    let res;
    try {
      res = await fetch(current, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; SpecCrawler/1.0)",
          "Accept": acceptHeader,
        },
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
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
    const typeOk = expectedType === "css"
      ? (contentType.includes("text/css") || contentType.includes("octet-stream") || contentType === "")
      : expectedType === "html"
      ? contentType.includes("text/html")
      : true;
    if (!typeOk) return null;

    const declared = parseInt(res.headers.get("content-length") || "0", 10);
    if (declared > maxBodyBytes) return null;

    try {
      const text = await res.text();
      return text.length > maxBodyBytes ? text.slice(0, maxBodyBytes) : text;
    } catch {
      return null;
    }
  }
  return null;
}

export async function fetchPage(url, opts = {}) {
  return fetchResource(url, "html", opts);
}

export async function fetchCss(url, opts = {}) {
  return fetchResource(url, "css", opts);
}
