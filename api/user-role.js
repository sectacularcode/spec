// GET  /api/user-role?userId=xxx  — get a user role (userId from Clerk client)
// POST /api/user-role — { action: "set"|"delete"|"list", userId, role?, tools? }

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

// For write operations, verify using bootstrap secret or existing admin check
async function getRequesterRole(requesterId) {
  if (!requesterId) return null;
  const profile = await kvGet(`spec:user:${requesterId}`);
  return profile ? profile.role : "staff";
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  // GET — read role for a userId passed from the authenticated Clerk client
  if (req.method === "GET") {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    const profile = await kvGet(`spec:user:${userId}`) || { role: "staff", tools: ["template-studio", "brief-to-blueprint"] };
    return res.status(200).json(profile);
  }

  if (req.method === "POST") {
    const { action, userId, role, tools, requesterId } = req.body || {};

    // list and set/delete require a requesterId to check permissions
    if (!requesterId) return res.status(401).json({ error: "Missing requesterId" });
    const requesterRole = await getRequesterRole(requesterId);

    if (!["admin", "manager"].includes(requesterRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (action === "set") {
      if (!userId) return res.status(400).json({ error: "Missing userId" });
      if (requesterRole === "manager" && role !== "staff") {
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
      if (requesterRole !== "admin") return res.status(403).json({ error: "Forbidden" });
      if (!userId) return res.status(400).json({ error: "Missing userId" });
      await kvDel(`spec:user:${userId}`);
      return res.status(200).json({ ok: true });
    }

    if (action === "list") {
      if (requesterRole !== "admin") return res.status(403).json({ error: "Forbidden" });
      // Use SCAN to find all spec:user:* keys (Upstash REST API)
      let cursor = 0;
      let allKeys = [];
      do {
        const scanRes = await fetch(
          `${KV_URL}/scan/${cursor}?match=${encodeURIComponent("spec:user:*")}&count=100`,
          { headers: { Authorization: `Bearer ${KV_TOKEN}` } }
        );
        const scanData = await scanRes.json();
        const result = scanData.result || [];
        cursor = result[0] ?? 0;
        allKeys = allKeys.concat(result[1] || []);
      } while (cursor !== 0 && cursor !== "0");
      const users = await Promise.all(allKeys.map(async (key) => {
        const profile = await kvGet(key);
        return { userId: key.replace("spec:user:", ""), ...profile };
      }));
      return res.status(200).json({ users });
    }

    return res.status(400).json({ error: "Unknown action" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
