// GET  /api/user-role                — get your own role/profile (JWT-verified)
// GET  /api/user-role?userId=xxx     — admin only: read another user's profile
// POST /api/user-role                — { action: "set"|"delete"|"list", userId, role?, tools? }
//
// Security model:
// - All methods require a verified Clerk JWT. The requester's identity comes
//   from the token, never from the request body or query string, so admin
//   actions cannot be spoofed by passing someone else's user ID.

import { requireAuth, getProfile } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const CLERK_SECRET = process.env.CLERK_SECRET_KEY;

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

// Fetch user details (name, email) from Clerk for a list of user IDs
async function clerkGetUsers(userIds) {
  if (!CLERK_SECRET || !userIds.length) return {};
  try {
    const params = userIds.map(id => `user_id[]=${encodeURIComponent(id)}`).join("&");
    const res = await fetch(`https://api.clerk.com/v1/users?${params}&limit=100`, {
      headers: { Authorization: `Bearer ${CLERK_SECRET}` },
    });
    if (!res.ok) return {};
    const data = await res.json();
    const map = {};
    for (const u of data) {
      const primaryEmail = u.email_addresses?.find(e => e.id === u.primary_email_address_id);
      const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || null;
      map[u.id] = { name, email: primaryEmail?.email_address || null };
    }
    return map;
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!KV_URL || !KV_TOKEN) {
    return res.status(500).json({ error: "KV not configured" });
  }

  const requesterId = await requireAuth(req);
  if (!requesterId) return res.status(401).json({ error: "Unauthorized" });

  if (!(await rateLimit(requesterId, "user-role", 60))) return tooMany(res);

  const requesterProfile = await getProfile(requesterId);
  const requesterRole = requesterProfile.role || "staff";

  if (req.method === "GET") {
    const queried = req.query.userId;
    // Only admins may read someone else's profile.
    if (queried && queried !== requesterId && requesterRole !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const targetId = queried || requesterId;
    const profile = await kvGet(`spec:user:${targetId}`) || { role: "staff", tools: ["template-studio", "brief-to-blueprint"] };
    return res.status(200).json(profile);
  }

  if (req.method === "POST") {
    const { action, userId, role, tools } = req.body || {};

    if (!["admin", "manager"].includes(requesterRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (action === "set") {
      if (!userId || typeof userId !== "string") return res.status(400).json({ error: "Missing userId" });
      if (role && !["admin", "manager", "staff"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      if (requesterRole === "manager" && role !== "staff") {
        return res.status(403).json({ error: "Managers can only assign staff roles" });
      }
      const existing = await kvGet(`spec:user:${userId}`) || {};
      await kvSet(`spec:user:${userId}`, {
        role: role || existing.role || "staff",
        tools: Array.isArray(tools) ? tools : (existing.tools || ["template-studio", "brief-to-blueprint"]),
        updatedBy: requesterId,
        updatedAt: new Date().toISOString(),
      });
      return res.status(200).json({ ok: true });
    }

    if (action === "delete") {
      if (requesterRole !== "admin") return res.status(403).json({ error: "Forbidden" });
      if (!userId || typeof userId !== "string") return res.status(400).json({ error: "Missing userId" });
      if (userId === requesterId) return res.status(400).json({ error: "You cannot remove your own admin account" });
      await kvDel(`spec:user:${userId}`);
      return res.status(200).json({ ok: true });
    }

    if (action === "list") {
      if (requesterRole !== "admin") return res.status(403).json({ error: "Forbidden" });
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

      const profiles = await Promise.all(allKeys.map(async (key) => {
        const profile = await kvGet(key);
        return { userId: key.replace("spec:user:", ""), ...profile };
      }));

      const userIds = profiles.map(p => p.userId);
      const clerkDetails = await clerkGetUsers(userIds);

      const users = profiles.map(p => ({
        ...p,
        name:  clerkDetails[p.userId]?.name  || null,
        email: clerkDetails[p.userId]?.email || null,
      }));

      return res.status(200).json({ users });
    }

    return res.status(400).json({ error: "Unknown action" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
