// Shared auth for all API routes.
// Verifies a Clerk session JWT from the Authorization header.
// Never trusts client-supplied user IDs.

import { verifyToken } from "@clerk/backend";
import { sql } from "@vercel/postgres";

// Returns the verified Clerk user ID, or null if the request is not authenticated.
export async function requireAuth(req) {
  const header = req.headers["authorization"] || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    return payload && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}

// Reads the user's Spec profile from Postgres. Unknown users default to
// staff, matching existing product behavior — a missing profile row is not
// an error, it just means no admin has ever set this user's role yet.
export async function getProfile(userId) {
  const fallback = { role: "staff", tools: ["template-studio", "brief-to-blueprint"] };
  if (!userId) return fallback;
  try {
    const { rows } = await sql`SELECT role, tools FROM profiles WHERE user_id = ${userId}`;
    if (rows.length === 0) return fallback;
    return { role: rows[0].role, tools: rows[0].tools };
  } catch {
    return fallback;
  }
}
