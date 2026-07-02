// Shared auth for all API routes.
// Verifies a Clerk session JWT from the Authorization header.
// Never trusts client-supplied user IDs.

import { verifyToken } from "@clerk/backend";

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

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

// Reads the user's Spec profile from Redis. Unknown users default to staff,
// matching existing product behavior.
export async function getProfile(userId) {
  const fallback = { role: "staff", tools: ["template-studio", "brief-to-blueprint"] };
  if (!KV_URL || !KV_TOKEN || !userId) return fallback;
  try {
    const res = await fetch(`${KV_URL}/get/${encodeURIComponent("spec:user:" + userId)}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
    });
    const data = await res.json();
    return data.result ? JSON.parse(data.result) : fallback;
  } catch {
    return fallback;
  }
}
