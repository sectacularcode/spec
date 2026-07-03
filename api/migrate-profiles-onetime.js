// ONE-TIME MIGRATION — copies existing Redis role/profile data
// (spec:user:*) into the new Postgres `profiles` table.
//
// DELETE THIS FILE once you've confirmed the migration succeeded and the
// app is running on the Postgres-backed api/user-role.js. It has no
// purpose after that point and is one more thing that can access both
// data stores.
//
// Usage: POST /api/migrate-profiles-onetime with a valid Clerk session belonging
// to a user who is currently an admin *in Redis* — checked directly here
// rather than via getProfile(), since the Postgres profiles table is
// empty until this endpoint runs (a chicken-and-egg problem otherwise).
// Safe to run more than once — every write is an upsert.

import { requireAuth } from "./_lib/auth.js";
import { sql } from "@vercel/postgres";

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kvGet(key) {
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  const data = await res.json();
  return data.result ? JSON.parse(data.result) : null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const requesterId = await requireAuth(req);
  if (!requesterId) return res.status(401).json({ error: "Unauthorized" });

  if (!KV_URL || !KV_TOKEN) {
    return res.status(500).json({ error: "KV not configured" });
  }

  const requesterProfile = await kvGet(`spec:user:${requesterId}`);
  if (!requesterProfile || requesterProfile.role !== "admin") {
    return res.status(403).json({ error: "Forbidden — must be an admin in the current Redis role store" });
  }

  try {
    // Scan every spec:user:* key out of Redis
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

    const migrated = [];
    const skipped = [];
    for (const key of allKeys) {
      const userId = key.replace("spec:user:", "");
      const profile = await kvGet(key);
      if (!profile || !profile.role) { skipped.push(userId); continue; }
      const role = ["admin", "manager", "staff"].includes(profile.role) ? profile.role : "staff";
      const tools = Array.isArray(profile.tools) ? profile.tools : ["template-studio", "brief-to-blueprint"];
      const updatedAt = profile.updatedAt || new Date().toISOString();
      await sql`
        INSERT INTO profiles (user_id, role, tools, updated_at)
        VALUES (${userId}, ${role}, ${tools}, ${updatedAt})
        ON CONFLICT (user_id) DO UPDATE
        SET role = EXCLUDED.role, tools = EXCLUDED.tools, updated_at = EXCLUDED.updated_at
      `;
      migrated.push(userId);
    }

    return res.status(200).json({
      ok: true,
      totalRedisKeys: allKeys.length,
      migrated: migrated.length,
      migratedUserIds: migrated,
      skipped: skipped.length,
      skippedUserIds: skipped,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
