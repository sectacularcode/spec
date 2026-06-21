// Universal storage API — replaces window.storage on the live site
// GET /api/storage?key=xxx — get a value
// POST /api/storage — { action: "set"|"delete", key, value? }

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kvFetch(path) {
  const res = await fetch(KV_URL + path, {
    headers: { Authorization: "Bearer " + KV_TOKEN },
  });
  if (!res.ok) throw new Error("KV " + res.status);
  return res.json();
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  // Auth — verify userId exists in Redis as a known Spec user
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

  if (!KV_URL || !KV_TOKEN) {
    return res.status(500).json({ error: "KV not configured" });
  }

  try {
    if (req.method === "GET") {
      const key = req.query.key;
      if (!key) return res.status(400).json({ error: "Missing key" });
      const data = await kvFetch("/get/" + encodeURIComponent(key));
      return res.status(200).json({ value: data.result || null });
    }

    if (req.method === "POST") {
      const { action, key, value } = req.body || {};
      if (!key) return res.status(400).json({ error: "Missing key" });

      if (action === "set") {
        const encoded = typeof value === "string" ? value : JSON.stringify(value);
        await kvFetch("/set/" + encodeURIComponent(key) + "/" + encodeURIComponent(encoded));
        return res.status(200).json({ ok: true });
      }

      if (action === "delete") {
        await kvFetch("/del/" + encodeURIComponent(key));
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ error: "Unknown action" });
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
