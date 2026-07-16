// Cross-checks a color's assigned role (Heading, Accent, Background, etc.)
// against what a real screenshot actually shows. Extraction assigns roles
// by matching CSS variable/class naming patterns, which doesn't always
// reflect true visual usage -- a color whose CSS variable happened to be
// named something body-ish can end up labeled "Body text" while actually
// being a button/accent fill on the real page. This is a second, cheap
// opinion grounded in what's genuinely visible, not a replacement for the
// person's own judgment: every result is a suggestion to review and accept
// or dismiss individually, never applied automatically.
//
// Opt-in and manual on purpose (a button, not part of Analyze site) --
// this is a real per-use AI vision call, same cost category as Brief to
// Blueprint's AI Draft, not something that should fire on every extraction.

import { requireAuth } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";
import { logError } from "./_lib/errorLog.js";
import { callAnthropic, extractJSON } from "./_lib/anthropic.js";

const TEMPLATE_ROLES = ["Heading", "Body text", "Accent", "Accent — hover", "Background", "Dark panel", "Secondary text", "Text on dark"];
const HEX_RE = /^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$/;
const MAX_IMAGE_B64_CHARS = 6 * 1024 * 1024; // ~4.5MB decoded, safely under Vercel's request body limit
const MAX_COLORS = 20; // matches the practical ceiling on the Colors grid -- a sanity cap, not a real constraint

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const userId = await requireAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (!(await rateLimit(userId, "check-color-roles", 15))) return tooMany(res);

  const { colors, image } = req.body || {};

  if (typeof image !== "string" || !image.startsWith("data:image/")) {
    return res.status(400).json({ error: "No image provided" });
  }
  if (image.length > MAX_IMAGE_B64_CHARS) {
    return res.status(400).json({ error: "Image too large" });
  }
  const imageMatch = image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!imageMatch) return res.status(400).json({ error: "Invalid image data" });
  const [, mediaType, base64Data] = imageMatch;

  // Only hex + role travel to the model -- name/usage/confidence aren't
  // relevant here, and custom colors (no template role) have nothing to
  // check a role against.
  const cleanColors = Array.isArray(colors)
    ? colors
        .filter(c => c && typeof c.hex === "string" && HEX_RE.test(c.hex.trim()) && TEMPLATE_ROLES.includes(c.role))
        .slice(0, MAX_COLORS)
        .map(c => ({ hex: c.hex.trim().toUpperCase(), role: c.role }))
    : [];

  if (cleanColors.length === 0) {
    return res.status(400).json({ error: "No template-role colors to check" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });

  const colorList = cleanColors.map(c => `${c.hex} — currently labeled "${c.role}"`).join("\n");

  const prompt = `This is a real screenshot of a website. Below is a list of colors extracted from that site's CSS, each with the role it's currently labeled as in a brand style guide.

${colorList}

The 8 valid roles are: ${TEMPLATE_ROLES.join(", ")}.

Look at how each color is ACTUALLY used in the screenshot -- is it a page background, a heading/text color, a button/accent fill, a dark section background, etc. -- and flag any color whose current label doesn't match what you can genuinely see. Only include a color if you're confident it's mislabeled based on real, visible evidence (e.g. "this hex fills the CTA button, not body copy text"). If a color's label looks right, or the screenshot doesn't clearly show where it's used, leave it out entirely.

Return ONLY valid JSON:
{ "corrections": [ { "hex": "#XXXXXX", "suggestedRole": "one of the 8 roles listed above", "reason": "one short sentence citing what you actually see in the screenshot" } ] }

If nothing looks mislabeled, return { "corrections": [] }.`;

  try {
    const { ok, data } = await callAnthropic(apiKey, {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: "You are a visual design analyst looking at a real screenshot. Return ONLY valid JSON with no markdown, no explanation. Only flag a mismatch you can genuinely point to evidence for in the image -- never guess.",
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } },
          { type: "text", text: prompt },
        ],
      }],
    });

    if (!ok) {
      await logError("check-color-roles", req.method, userId, data?.error?.status || 502, JSON.stringify(data?.error || data).slice(0, 500));
      return res.status(502).json({ error: "Couldn't reach the model — try again." });
    }

    const parsed = extractJSON(data);
    const rawCorrections = Array.isArray(parsed?.corrections) ? parsed.corrections : [];

    // The model's own output gets the same validation as any other
    // untrusted input before it reaches the UI -- a hex it invents or a
    // role outside the fixed 8 is dropped, not passed through.
    const validHexes = new Set(cleanColors.map(c => c.hex));
    const corrections = rawCorrections
      .filter(c => c && typeof c.hex === "string" && validHexes.has(c.hex.trim().toUpperCase()) && TEMPLATE_ROLES.includes(c.suggestedRole))
      .map(c => ({
        hex: c.hex.trim().toUpperCase(),
        suggestedRole: c.suggestedRole,
        reason: typeof c.reason === "string" ? c.reason.slice(0, 300) : "",
      }));

    return res.status(200).json({ corrections });
  } catch (err) {
    await logError("check-color-roles", req.method, userId, 500, err.message);
    return res.status(500).json({ error: err.message });
  }
}
