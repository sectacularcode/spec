// GET  /api/user-role?userId=xxx  — get a user's role and tools
// POST /api/user-role — { action: "set"|"delete", userId, role?, tools? }
// Admin-only for set/delete. Any authed user can GET their own role.

const KV_URL   = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kvGet(key) {
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  const data = await res.json();
  return data.result ? JSON.parse(data.result) : null;
}

async function kvSet(key, value) {
  await fetch(`${KV_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(value))}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
}

async function kvDel(key) {
  await fetch(`${KV_URL}/del/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
}

async function verifyClerkToken(req) {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) return null;
  const authHeader = req.headers.authorization || "";
  const cookieHeader = req.headers.cookie || "";
  const sessionToken =
    (authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null) ||
    (cookieHeader.match(/(?:^|;\s*)__session=([^;]+)/)?.[1]) ||
    null;
  if (!sessionToken) return null;
  try {
    const verifyRes = await fetch("https://api.clerk.com/v1/tokens/verify", {
      method: "POST",
      headers: { "Authorization": "Bearer " + clerkSecretKey, "Content-Type": "application/json" },
      body: JSON.stringify({ token: sessionToken })
    });
    if (!verifyRes.ok) return null;
    const data = await verifyRes.json();
    return data.sub || null; // returns clerk user ID
  } catch { return null; }
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const requesterId = await verifyClerkToken(req);
  if (!requesterId) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const userId = req.query.userId || requesterId;
    const profile = await kvGet(`spec:user:${userId}`) || { role: "staff", tools: ["template-studio", "brief-to-blueprint"] };
    return res.status(200).json(profile);
  }

  if (req.method === "POST") {
    // Only admin or manager can set/delete roles
    const requesterProfile = await kvGet(`spec:user:${requesterId}`) || { role: "staff" };
    if (!["admin", "manager"].includes(requesterProfile.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { action, userId, role, tools } = req.body || {};
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    if (action === "set") {
      // Managers can only set staff roles, not admin or manager
      if (requesterProfile.role === "manager" && role !== "staff") {
        return res.status(403).json({ error: "Managers can only assign staff roles" });
      }
      const existing = await kvGet(`spec:user:${userId}`) || {};
      await kvSet(`spec:user:${userId}`, {
        role: role || existing.role || "staff",
        tools: tools || existing.tools || ["template-studio", "brief-to-blueprint"],
        updatedBy: requesterId,
        updatedAt: new Date().toISOString(),
      });
      return res.status(200).json({ ok: true });
    }

    if (action === "delete") {
      if (requesterProfile.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      await kvDel(`spec:user:${userId}`);
      return res.status(200).json({ ok: true });
    }

    if (action === "list") {
      // Admin only
      if (requesterProfile.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      // Return list of all user keys
      const listRes = await fetch(`${KV_URL}/keys/spec:user:*`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
      });
      const listData = await listRes.json();
      const keys = listData.result || [];
      const users = await Promise.all(keys.map(async (key) => {
        const profile = await kvGet(key);
        return { userId: key.replace("spec:user:", ""), ...profile };
      }));
      return res.status(200).json({ users });
    }

    return res.status(400).json({ error: "Unknown action" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
