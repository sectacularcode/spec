// Wrapper for Browserless's Function API — loads a page in a real headless
// Chrome browser and reads the ACTUAL rendered font-family via
// getComputedStyle(), rather than regex-matching raw CSS text.
//
// Why this exists: extract-style.js's regex-based buildFontSet() has a
// structural ceiling confirmed on real sites (Wix's proprietary rendering,
// Tailwind utility classes, CSS-variable font stacks) — there's no literal
// "font-family: X" string anywhere in the source for a regex to find, no
// matter how the selector coverage is tuned. getComputedStyle() sidesteps
// this entirely: it returns whatever the browser actually resolved,
// regardless of how the site's CSS/JS framework arrived at that value.
//
// SnapRender (already used elsewhere in this codebase for screenshots) was
// evaluated and ruled out for this — it only ever returns pixels, no
// getComputedStyle/DOM access. Browserless's Function API runs arbitrary
// Puppeteer code against a remotely-hosted browser, so a Vercel function
// just makes one HTTP call -- no headless Chrome binary to bundle here.
//
// Returns null on any failure (missing key, bad URL, navigation timeout,
// API error) -- callers must degrade gracefully to the existing regex-based
// extraction, never throw. Matches the same failure contract as
// captureScreenshot() in screenshot.js.

// NOTE: confirm this against the actual dashboard once the Browserless
// account exists -- their docs show region-specific hosts (SFO, London,
// Amsterdam) and the free-tier account may be assigned a specific one.
const BROWSERLESS_FUNCTION_URL = "https://production-sfo.browserless.io/function";
const FETCH_TIMEOUT_MS = 25000; // headless page loads are slower and less predictable than a screenshot capture

// The target URL is embedded directly into the generated function body via
// JSON.stringify rather than passed as a separate "context" field -- this
// sidesteps needing to trust an unconfirmed context-passing convention from
// the docs, and JSON.stringify's escaping is safe to embed in a JS string
// literal position (a stricter grammar than JSON's, so a valid JSON string
// escape is always a valid JS one too). safeUrl is expected to have already
// passed isSafeUrl() at the call site, same as every other extraction path.
function buildFunctionCode(safeUrl) {
  const urlLiteral = JSON.stringify(safeUrl);
  return `export default async ({ page }) => {
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    // getComputedStyle().fontFamily reflects the CSS-resolved font stack,
    // not whether the font file itself downloaded -- so blocking
    // images/media/fonts speeds up the load (and reduces load on the
    // target site) without affecting the value this actually reads.
    if (["image", "media", "font"].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });
  await page.goto(${urlLiteral}, { waitUntil: "networkidle2", timeout: 20000 });
  const result = await page.evaluate(() => {
    function computedFont(selector) {
      const el = document.querySelector(selector);
      if (!el) return null;
      const family = getComputedStyle(el).fontFamily;
      // Take just the first font in the stack (the one actually requested,
      // not its fallbacks) and strip surrounding quotes for a clean name.
      return family ? family.split(",")[0].trim().replace(/^["']|["']$/g, "") : null;
    }
    return {
      heading: computedFont("h1"),
      body: computedFont("body"),
    };
  });
  return { data: result, type: "application/json" };
};`;
}

// Returns { heading, body } (either may be null if the selector wasn't
// found or had no resolvable font) or null on any failure.
export async function extractComputedFonts(safeUrl) {
  const apiKey = process.env.BROWSERLESS_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(`${BROWSERLESS_FUNCTION_URL}?token=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/javascript" },
      body: buildFunctionCode(safeUrl),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const json = await response.json();
    if (!json || typeof json !== "object") return null;
    return { heading: json.heading || null, body: json.body || null };
  } catch {
    return null;
  }
}
