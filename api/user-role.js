// GET  /api/user-role                — get your own role/profile (JWT-verified)
// GET  /api/user-role?userId=xxx     — admin only: read another user's profile
// POST /api/user-role                — { action: "set"|"delete"|"list", userId, role?, tools? }
//
// Security model:
// - All methods require a verified Clerk JWT. The requester's identity comes
//   from the token, never from the request body or query string, so admin
//   actions cannot be spoofed by passing someone else's user ID.

import { requireAuth, getProfile, ensureProfilesTable } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";
import { logError } from "./_lib/errorLog.js";
import { sql } from "@vercel/postgres";

const CLERK_SECRET = process.env.CLERK_SECRET_KEY;

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

  const requesterId = await requireAuth(req);
  if (!requesterId) return res.status(401).json({ error: "Unauthorized" });

  if (!(await rateLimit(requesterId, "user-role", 60))) return tooMany(res);

  const requesterProfile = await getProfile(requesterId);
  const requesterRole = requesterProfile.role || "staff";

  try {
    // getProfile() above already self-heals the table on the read path;
    // called again here so the write path below (INSERT/DELETE) doesn't
    // implicitly depend on that ordering staying true.
    await ensureProfilesTable();

    if (req.method === "GET") {
      const queried = req.query.userId;
      // Only admins may read someone else's profile.
      if (queried && queried !== requesterId && requesterRole !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const targetId = queried || requesterId;
      const profile = await getProfile(targetId);
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
        const { rows: existingRows } = await sql`SELECT role, tools FROM profiles WHERE user_id = ${userId}`;
        const existing = existingRows[0] || {};
        const finalRole = role || existing.role || "staff";
        const finalTools = Array.isArray(tools) ? tools : (existing.tools || ["template-studio", "brief-to-blueprint"]);
        await sql`
          INSERT INTO profiles (user_id, role, tools, updated_at)
          VALUES (${userId}, ${finalRole}, ${finalTools}, now())
          ON CONFLICT (user_id) DO UPDATE
          SET role = EXCLUDED.role, tools = EXCLUDED.tools, updated_at = now()
        `;
        return res.status(200).json({ ok: true });
      }

      if (action === "delete") {
        if (requesterRole !== "admin") return res.status(403).json({ error: "Forbidden" });
        if (!userId || typeof userId !== "string") return res.status(400).json({ error: "Missing userId" });
        if (userId === requesterId) return res.status(400).json({ error: "You cannot remove your own admin account" });
        await sql`DELETE FROM profiles WHERE user_id = ${userId}`;
        return res.status(200).json({ ok: true });
      }

      if (action === "list") {
        if (requesterRole !== "admin") return res.status(403).json({ error: "Forbidden" });
        const { rows } = await sql`SELECT user_id, role, tools, updated_at FROM profiles ORDER BY user_id`;
        const userIds = rows.map(r => r.user_id);
        const clerkDetails = await clerkGetUsers(userIds);

        const users = rows.map(r => ({
          userId: r.user_id,
          role: r.role,
          tools: r.tools,
          updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null,
          name:  clerkDetails[r.user_id]?.name  || null,
          email: clerkDetails[r.user_id]?.email || null,
        }));

        return res.status(200).json({ users });
      }

      return res.status(400).json({ error: "Unknown action" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    await logError("user-role", req.method, requesterId, 500, err.message);
    return res.status(500).json({ error: err.message });
  }
}
