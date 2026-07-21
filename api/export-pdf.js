// Server-side PDF export for a Brief to Blueprint preview page.
//
// Why this exists / why it replaced the html2canvas path: the previous
// export (src/brief-to-blueprint/utils/exportPdf.js) rasterized each preview
// section with html2canvas in the browser. That has a confirmed, unfixable-
// from-outside failure mode -- html2canvas re-measures text in its own cloned
// document at a pinned windowWidth, and for clamp()-sized headings the inter-
// word advance collapses, gluing words together in the output ("dispatch
// emergency towing" -> "dispatchemergencytowing"). Verified July 2026 by
// reading the live preview's own DOM: the spaces are present and correct in
// the source HTML, so the glue is purely an html2canvas rasterization
// artifact, not a data/text bug.
//
// Browserless renders the exact same HTML in a real headless Chrome and
// prints it to PDF with the browser's own text-layout engine -- the same
// engine that renders the live preview correctly -- so the glue is
// structurally impossible here. It also renders the Google Maps embed as a
// real map (no more cross-origin address-card fallback) and loads webfonts
// properly (no font-swap timing games).
//
// The client (exportPdf.js) still tries this first and silently falls back
// to the old html2canvas path if this errors or times out, so export never
// hard-fails even if Browserless is down or over quota.
//
// Same Browserless account/key/region as computedFontStyle.js's /function
// call -- see that file for the endpoint-region caveat.

import { requireAuth } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";

const BROWSERLESS_PDF_URL = "https://production-sfo.browserless.io/pdf";
const FETCH_TIMEOUT_MS = 25000; // a full page render + print is slower than a screenshot; matches computedFontStyle.js
// The preview HTML is ~30KB in practice. Cap well above that but far below
// Vercel's 4.5MB body ceiling, so an abnormally large or abusive payload is
// rejected cheaply here rather than forwarded to (and billed by) Browserless.
const MAX_HTML_BYTES = 800 * 1024;

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Auth is the hard gate: this endpoint renders caller-supplied HTML in a
  // real browser and spends Browserless units, so it must never be reachable
  // unauthenticated. Client user IDs are never trusted -- requireAuth reads
  // the verified Clerk session only.
  const userId = await requireAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  // Per-user cap so no single account can burn through the shared Browserless
  // unit budget (free tier is ~1,000 units/month, shared with extract-style's
  // /function calls). 30/min is far above any real human export cadence while
  // still bounding a runaway loop or abuse.
  if (!(await rateLimit(userId, "export-pdf", 30))) return tooMany(res);

  const apiKey = process.env.BROWSERLESS_API_KEY;
  if (!apiKey) {
    // Surfaced as a normal error so the client falls back to html2canvas
    // rather than showing the user a hard failure.
    return res.status(503).json({ error: "PDF service not configured" });
  }

  const { html } = req.body || {};
  if (!html || typeof html !== "string") {
    return res.status(400).json({ error: "No HTML provided" });
  }
  // Byte length, not string length -- a multi-byte-heavy payload could be
  // much larger on the wire than .length suggests.
  if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) {
    return res.status(413).json({ error: "Preview too large to export" });
  }

  let bl;
  try {
    bl = await fetch(`${BROWSERLESS_PDF_URL}?token=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        html,
        // gotoOptions.waitUntil "networkidle2" matches computedFontStyle.js --
        // waits for the page (webfonts, the maps iframe) to settle before the
        // print, so headings render in real Inter and the map isn't blank.
        gotoOptions: { waitUntil: "networkidle2", timeout: 20000 },
        options: {
          // Force landscape with an EXPLICIT width+height box (width > height)
          // rather than format+landscape. Two earlier attempts got this wrong:
          // (1) explicit `width` alone (no height) defaulted to a tall page =>
          // portrait; (2) `format:"Letter"+landscape` relies on Browserless
          // passing those through to page.pdf exactly, which wasn't reliable.
          // Setting BOTH width and height makes the page box unambiguous and
          // landscape by construction (1280x720, 16:9, matching the desktop
          // preview's own proportions). printBackground so the section
          // background colors (the gold hero/CTA bands) render instead of
          // white.
          width: "1280px",
          height: "720px",
          printBackground: true,
          preferCSSPageSize: false,
          margin: { top: "0", bottom: "0", left: "0", right: "0" },
        },
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    const reason = err.name === "TimeoutError" ? "timeout" : err.message;
    return res.status(502).json({ error: "PDF render failed", reason });
  }

  if (!bl.ok) {
    // Browserless returns useful text detail on 4xx (bad token, bad HTML) that
    // a bare status would hide -- capture a short snippet, same as
    // computedFontStyle.js does.
    let detail = "";
    try { detail = (await bl.text()).slice(0, 200); } catch { /* keep detail empty, status code alone still returned */ }
    return res.status(502).json({ error: "PDF render failed", reason: `bad_status:${bl.status}${detail ? ":" + detail : ""}` });
  }

  let pdfBuffer;
  try {
    pdfBuffer = Buffer.from(await bl.arrayBuffer());
  } catch (err) {
    return res.status(502).json({ error: "PDF render failed", reason: `read_body:${err.message}` });
  }
  if (!pdfBuffer || pdfBuffer.length === 0) {
    return res.status(502).json({ error: "PDF render failed", reason: "empty_pdf" });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", String(pdfBuffer.length));
  // no-store already set globally for /api/* in vercel.json; the PDF is
  // sent as the raw response body for the client to turn into a blob.
  return res.status(200).send(pdfBuffer);
}
