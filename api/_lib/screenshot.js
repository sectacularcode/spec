// Wrapper for SnapRender's screenshot API — captures a real screenshot of a
// reference page so its layout can actually be analyzed visually, instead
// of the old approach (extractStructure in crawl-inspo.js) which stripped
// all HTML before analysis and left the model guessing "structure" from
// plain body text with zero real layout signal in it.
//
// Returns null on any failure (missing key, bad URL, API down, oversized
// response) — callers must degrade gracefully, not throw. A screenshot
// capture failing should mean "fall back to text-based analysis for this
// one page," never "break the whole crawl."

const SNAPRENDER_URL = "https://app.snap-render.com/v1/screenshot";
const MAX_DECODED_BYTES = 5 * 1024 * 1024; // ~5MB — a reference page screenshot shouldn't need more

// Captures a full-page screenshot and returns { base64, mediaType } ready
// to drop directly into an Anthropic vision content block, or null.
export async function captureScreenshot(url) {
  const apiKey = process.env.SNAPRENDER_API_KEY;
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      url,
      format: "png",
      full_page: "true",
      block_ads: "true",
      remove_cookie_banners: "true",
      width: "1440",
    });
    const response = await fetch(SNAPRENDER_URL + "?" + params.toString(), {
      headers: { "X-API-Key": apiKey },
    });
    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_DECODED_BYTES) return null;

    return {
      base64: Buffer.from(arrayBuffer).toString("base64"),
      mediaType: "image/png",
    };
  } catch {
    return null;
  }
}
