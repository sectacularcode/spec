// GET /api/model-health — admin only.
//
// Checks whether the model IDs this app is actually configured to use
// (parse-brief.js, draft-copy.js, generate-copy.js) are still live on the
// Anthropic API, using GET /v1/models — a free metadata call, not a
// generation call, so checking costs zero tokens.
//
// Why this exists: parse-brief.js's fallback chain silently had zero real
// coverage for months because 3 of its 4 models were retired by Anthropic
// between Oct 2025 and Apr 2026, and nothing ever surfaced that. This
// endpoint gives a direct, on-demand answer to "are the models we're
// pointing at still real" instead of finding out only when a real user
// request fails.

import { requireAuth, getProfile } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";

// Every model ID actually referenced anywhere in this app. Kept as a flat
// list with a note on where each is used, so this file stays the one place
// that needs updating when a model reference changes anywhere else.
const CONFIGURED_MODELS = [
  { id: "claude-sonnet-4-6", usedIn: ["api/parse-brief.js (primary)", "api/generate-copy.js (default)"] },
  { id: "claude-haiku-4-5-20251001", usedIn: ["api/parse-brief.js (fallback)", "api/draft-copy.js", "api/generate-copy.js (allowed)"] },
];

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const userId = await requireAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const profile = await getProfile(userId);
  if (!["admin", "manager"].includes(profile.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (!(await rateLimit(userId, "model-health", 10))) return tooMany(res);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/models?limit=100", {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      return res.status(502).json({ error: "Could not reach Anthropic Models API", detail: body?.error?.message });
    }

    const data = await response.json();
    const liveIds = new Set((data.data || []).map(m => m.id));

    const results = CONFIGURED_MODELS.map(m => ({
      id: m.id,
      usedIn: m.usedIn,
      live: liveIds.has(m.id),
    }));

    const anyDown = results.some(r => !r.live);

    return res.status(200).json({
      checkedAt: new Date().toISOString(),
      allLive: !anyDown,
      models: results,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
