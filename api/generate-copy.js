// POST /api/generate-copy — authenticated proxy to Anthropic for Template Studio AI Draft

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const _userId = req.headers["x-spec-user-id"] || (req.body && req.body._userId) || req.query._userId;
  if (!_userId) return res.status(401).json({ error: "Unauthorized" });
  const _kvUrl = process.env.KV_REST_API_URL;
  const _kvToken = process.env.KV_REST_API_TOKEN;
  if (_kvUrl && _kvToken) {
    try {
      const _profileRes = await fetch(`${_kvUrl}/get/${encodeURIComponent("spec:user:" + _userId)}`, {
        headers: { Authorization: "Bearer " + _kvToken }
      });
      const _profileData = await _profileRes.json();
      if (!_profileData.result) return res.status(401).json({ error: "Unauthorized" });
    } catch { return res.status(401).json({ error: "Unauthorized" }); }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  // Strip internal fields not meant for Anthropic
  const { _userId: _u, ...anthropicBody } = req.body || {};

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(anthropicBody),
    });

    const data = await response.json();

    // Surface Anthropic error details for debugging
    if (!response.ok) {
      console.error("Anthropic API error:", response.status, JSON.stringify(data));
      return res.status(response.status).json({
        error: data?.error?.message || "Anthropic API error",
        anthropic_error: data?.error || data,
        status: response.status,
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
