// Shared auth for all API routes.
// Verifies a Clerk session JWT from the Authorization header.
// Never trusts client-supplied user IDs.

import { verifyToken } from "@clerk/backend";
import { sql } from "./db.js";
import { logError } from "./errorLog.js";

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

// Self-healing, matching db/schema.sql's profiles definition exactly.
// profiles is the app's whole permission-check backbone -- every getProfile()
// call below depends on it existing, so it gets the same CREATE TABLE IF NOT
// EXISTS treatment as every other table in the sweep, rather than trusting
// that a migration script actually ran against prod.
export async function ensureProfilesTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS profiles (
      user_id    TEXT PRIMARY KEY,
      role       TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'manager', 'admin')),
      tools      TEXT[] NOT NULL DEFAULT ARRAY['template-studio', 'brief-to-blueprint'],
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

// Reads the user's Spec profile from Postgres. Unknown users default to
// staff, matching existing product behavior -- a missing profile row is not
// an error, it just means no admin has ever set this user's role yet.
//
// A real thrown error (missing table, connection failure, bad query) is a
// different case. It still falls back to staff so an auth check never
// hard-blocks a request, but it's now logged via logError() instead of
// vanishing silently. Before this fix, both cases were indistinguishable --
// a DB outage would silently degrade every admin/manager permission check
// app-wide with zero visibility.
export async function getProfile(userId) {
  const fallback = { role: "staff", tools: ["template-studio", "brief-to-blueprint"] };
  if (!userId) return fallback;
  try {
    await ensureProfilesTable();
    const { rows } = await sql`SELECT role, tools FROM profiles WHERE user_id = ${userId}`;
    if (rows.length === 0) return fallback;
    return { role: rows[0].role, tools: rows[0].tools };
  } catch (err) {
    await logError("auth.getProfile", null, userId, 500, err.message);
    return fallback;
  }
}
