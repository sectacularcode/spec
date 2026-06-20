// POST /api/auth — validate password against a list, set httpOnly session cookie
// Env vars required:
//   SPEC_SESSION_SECRET — random string used as the session token
//   SPEC_PASSWORDS      — comma-separated list of valid passwords e.g. "pass1,pass2,pass3"

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const password = (req.body || {}).password;
  const secret   = process.env.SPEC_SESSION_SECRET;
  const raw      = process.env.SPEC_PASSWORDS || "";

  if (!secret || !raw) {
    return res.status(500).json({ error: "Auth not configured — set SPEC_PASSWORDS and SPEC_SESSION_SECRET in Vercel env vars." });
  }

  const valid = raw.split(",").map(p => p.trim()).filter(Boolean);

  if (!password || !valid.includes(password)) {
    return res.status(401).json({ error: "Incorrect password" });
  }

  // httpOnly — JS can't read it. Secure — HTTPS only. SameSite=Strict — blocks CSRF.
  res.setHeader(
    "Set-Cookie",
    `spec_sess=${secret}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000`
  );
  return res.status(200).json({ ok: true });
}
