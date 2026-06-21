// POST /api/generate-copy — authenticated proxy to Anthropic for Template Studio AI Draft
// Replaces the deleted /api/anthropic route with proper session verification

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Session auth
  const _secret = process.env.SPEC_SESSION_SECRET;
  const _cookie = req.headers.cookie || "";
  const _sess   = _cookie.match(/(?:^|;\s*)spec_sess=([^;]+)/);
  if (!_secret || !_sess || _sess[1] !== _secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
