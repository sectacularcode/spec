// Wrapper for Browserless's Function API — loads a page in a real headless
// Chrome browser and reads ACTUAL rendered fonts and colors via
// getComputedStyle(), rather than regex-matching raw CSS text.
//
// Why this exists: extract-style.js's regex-based extraction has a
// structural ceiling confirmed on real sites (Wix's proprietary rendering,
// Tailwind utility classes, CSS-variable font/color stacks) — there's no
// literal "font-family: X" or named --accent-style string anywhere in the
// source for a regex to find, no matter how the selector coverage is
// tuned. getComputedStyle() sidesteps this entirely: it returns whatever
// the browser actually resolved, regardless of how the site's CSS/JS
// framework arrived at that value.
//
// SnapRender (already used elsewhere in this codebase for screenshots) was
// evaluated and ruled out for this — it only ever returns pixels, no
// getComputedStyle/DOM access. Browserless's Function API runs arbitrary
// Puppeteer code against a remotely-hosted browser, so a Vercel function
// just makes one HTTP call -- no headless Chrome binary to bundle here.
//
// Returns { ok: false, reason } on any failure -- callers must degrade
// gracefully to the existing regex-based extraction, never throw.

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

    // Colors come back as raw rgb()/rgba() strings here -- hex conversion
    // happens Node-side after the response comes back, keeping this
    // in-browser code focused purely on DOM reads, not string formatting.
    function parseRgb(str) {
      const m = (str || "").match(/rgba?\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*(?:,\\s*([\\d.]+))?\\)/);
      if (!m) return null;
      return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? parseFloat(m[4]) : 1 };
    }
    function colorOf(el) { return el ? (getComputedStyle(el).color || null) : null; }

    const bodyEl = document.body;
    const h1El = document.querySelector("h1");
    const bodyColorRaw = colorOf(bodyEl);
    const bodyParsed = parseRgb(bodyColorRaw);

    // Background: body first, walk up to <html> if body's own background
    // is transparent (some sites set the real background higher up, with
    // body itself left transparent to show it through).
    function bgOf(el) {
      if (!el) return null;
      const bg = getComputedStyle(el).backgroundColor;
      const p = parseRgb(bg);
      if (!p || p.a === 0) return null;
      return bg;
    }
    const backgroundColorRaw = bgOf(bodyEl) || bgOf(document.documentElement);

    // Accent: first visible, non-empty link whose color meaningfully
    // differs from body text and isn't just another shade of gray/black --
    // links are one of the oldest, most universal CSS conventions for
    // signaling "this is an action," which is functionally the same idea
    // as a brand accent color. Not a certainty the way h1/body are for
    // fonts, but a real signal, not a blind guess.
    let accentColorRaw = null;
    const links = Array.from(document.querySelectorAll("a"));
    for (const a of links) {
      const text = (a.textContent || "").trim();
      if (!text) continue;
      const rect = a.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const c = colorOf(a);
      const p = parseRgb(c);
      if (!p) continue;
      if (p.r === p.g && p.g === p.b) continue; // grayscale -- not a deliberate brand color
      if (bodyParsed && p.r === bodyParsed.r && p.g === bodyParsed.g && p.b === bodyParsed.b) continue; // link isn't styled distinctly on this site
      accentColorRaw = c;
      break;
    }

    // Muted: first <footer>'s text color, same identical-to-body filter.
    // Weaker convention than links -- not every site follows it -- but
    // still a real signal worth attempting rather than skipping outright.
    let mutedColorRaw = null;
    const footerEl = document.querySelector("footer");
    if (footerEl) {
      const c = colorOf(footerEl);
      const p = parseRgb(c);
      if (p && !(bodyParsed && p.r === bodyParsed.r && p.g === bodyParsed.g && p.b === bodyParsed.b)) {
        mutedColorRaw = c;
      }
    }

    return {
      heading: computedFont("h1"),
      body: computedFont("body"),
      headingColor: colorOf(h1El),
      bodyColor: bodyColorRaw,
      backgroundColor: backgroundColorRaw,
      accentColor: accentColorRaw,
      mutedColor: mutedColorRaw,
    };
  });
  return { data: result, type: "application/json" };
};`;
}

// Site builders and font-optimization pipelines (Wix's hosted-font system,
// Next.js's next/font loader, and others) rewrite font-family to an internal
// generated identifier rather than the human-readable name -- e.g. Wix
// serves "wfont_0ee50d_1213e03b80024d3c839c9fdf0fca0931" for a custom
// premium font, not the actual typeface name. getComputedStyle() faithfully
// returns exactly that string; there is no human-readable name reachable
// from the rendered DOM in this case -- the real name simply isn't present
// anywhere client-side to extract. Filtering it out (rather than displaying
// it as if it were a real font name) is a full fix, not a partial one --
// there is nothing better to fall back to from computed styles alone once a
// site's font pipeline has already discarded the display name.
function looksAutoGenerated(name) {
  if (!name) return false;
  // Long hex-like run after an underscore -- catches Wix's
  // "wfont_<6-hex>_<32-hex>" and Next.js's "__fontname_<6-hex>" patterns.
  if (/_[0-9a-f]{6,}/i.test(name)) return true;
  // No real font name is this long.
  if (name.length > 40) return true;
  // Real font names are letters/digits/spaces/hyphens; an identifier with
  // underscores and no spaces at all is a strong tell either way.
  if (name.includes("_") && !name.includes(" ")) return true;
  return false;
}

// Converts a computed-style "rgb(r, g, b)" or "rgba(r, g, b, a)" string
// into a hex color -- the rest of this app is entirely hex-based, and
// getComputedStyle() never returns hex directly, even when the source CSS
// declared one.
function rgbStringToHex(rgbString) {
  if (!rgbString) return null;
  const m = rgbString.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return null;
  const toHex = (n) => Math.max(0, Math.min(255, Number(n))).toString(16).padStart(2, "0");
  return ("#" + toHex(m[1]) + toHex(m[2]) + toHex(m[3])).toUpperCase();
}

// Returns { ok: true, heading, body, headingColor, bodyColor,
// backgroundColor, accentColor, mutedColor } on success (any individual
// field may be null if that selector wasn't found or didn't pass its
// filter), or { ok: false, reason } on any failure -- missing key, bad
// response, timeout, exception. Never throws. Callers decide whether/how
// to log a failure; this function stays pure so it's easy to test in
// isolation.
export async function extractComputedStyles(safeUrl) {
  const apiKey = process.env.BROWSERLESS_API_KEY;
  if (!apiKey) return { ok: false, reason: "no_api_key" };

  let response;
  try {
    response = await fetch(`${BROWSERLESS_FUNCTION_URL}?token=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/javascript" },
      body: buildFunctionCode(safeUrl),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    return { ok: false, reason: `fetch_exception:${err.name === "TimeoutError" ? "timeout" : err.message}` };
  }

  if (!response.ok) {
    // Capture a short body snippet -- Browserless returns useful detail on
    // 4xx (bad token, bad code) that a bare status code alone would hide.
    let detail = "";
    try { detail = (await response.text()).slice(0, 200); } catch { /* keep detail empty, status code alone still returned */ }
    return { ok: false, reason: `bad_status:${response.status}${detail ? ":" + detail : ""}` };
  }

  let json;
  try {
    json = await response.json();
  } catch (err) {
    return { ok: false, reason: `bad_json:${err.message}` };
  }
  if (!json || typeof json !== "object") return { ok: false, reason: "empty_response" };

  // The Puppeteer function returns { data: result, type: "application/json" }
  // per Browserless's documented /function contract ("data" becomes the
  // response body, "type" controls Content-Type) -- but their docs are
  // ambiguous about whether "data" gets unwrapped into the literal response
  // body or the whole { data, type } envelope comes back verbatim. Live
  // testing confirmed the unwrapped shape (json.data.{heading,body}), so
  // this checks both rather than assuming, in case Browserless ever changes
  // that behavior.
  const payload = (json.data && typeof json.data === "object") ? json.data : json;
  const hasAnyField = payload.heading || payload.body || payload.headingColor || payload.bodyColor || payload.backgroundColor || payload.accentColor || payload.mutedColor;
  if (!hasAnyField) {
    // Nothing resolved after checking both possible shapes -- surface the
    // raw response so a genuinely empty page (vs. a still-wrong shape
    // assumption) is distinguishable without another blind round trip.
    return { ok: false, reason: `empty_result:${JSON.stringify(json).slice(0, 300)}` };
  }
  return {
    ok: true,
    heading: looksAutoGenerated(payload.heading) ? null : (payload.heading || null),
    body: looksAutoGenerated(payload.body) ? null : (payload.body || null),
    headingColor: rgbStringToHex(payload.headingColor),
    bodyColor: rgbStringToHex(payload.bodyColor),
    backgroundColor: rgbStringToHex(payload.backgroundColor),
    accentColor: rgbStringToHex(payload.accentColor),
    mutedColor: rgbStringToHex(payload.mutedColor),
  };
}
