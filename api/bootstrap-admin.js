// POST /api/bootstrap-admin — one-time route to set the first admin
// Protected by ADMIN_BOOTSTRAP_SECRET env var, not Clerk auth
// Delete this route after first use or leave it — the secret protects it

const KV_URL   = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const secret = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (!secret) return res.status(500).json({ error: "ADMIN_BOOTSTRAP_SECRET not set" });

  const { bootstrapSecret, userId } = req.body || {};
  if (!bootstrapSecret || bootstrapSecret !== secret) {
    return res.status(401).json({ error: "Invalid bootstrap secret" });
  }
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const value = JSON.stringify({
    role: "admin",
    tools: ["template-studio", "brief-to-blueprint"],
    updatedAt: new Date().toISOString(),
    updatedBy: "bootstrap"
  });

  await fetch(`${KV_URL}/set/${encodeURIComponent("spec:user:" + userId)}/${encodeURIComponent(value)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });

  return res.status(200).json({ ok: true, userId, role: "admin" });
}
