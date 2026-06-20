// POST /api/auth — validate password, set httpOnly session cookie
// Requires env vars: SPEC_PASSWORD, SPEC_SESSION_SECRET

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const password = (req.body || {}).password;
  const expected = process.env.SPEC_PASSWORD;
  const secret   = process.env.SPEC_SESSION_SECRET;

  if (!expected || !secret) {
    return res.status(500).json({ error: "Auth not configured — set SPEC_PASSWORD and SPEC_SESSION_SECRET in Vercel env vars." });
  }

  if (!password || password !== expected) {
    return res.status(401).json({ error: "Incorrect password" });
  }

  // httpOnly — JS can't read or steal it. Secure — HTTPS only. SameSite=Strict — blocks CSRF.
  res.setHeader(
    "Set-Cookie",
    `spec_sess=${secret}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000`
  );
  return res.status(200).json({ ok: true });
}
