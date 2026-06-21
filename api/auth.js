// POST /api/auth — validate password, set httpOnly session cookie
// Rate limited: 5 failed attempts per IP locks out for 15 minutes
// Env vars: SPEC_PASSWORDS, SPEC_SESSION_SECRET, KV_REST_API_URL, KV_REST_API_TOKEN

const KV_URL   = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kvGet(key) {
  if (!KV_URL || !KV_TOKEN) return null;
  try {
    const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
    });
    const data = await res.json();
    return data.result || null;
  } catch { return null; }
}

async function kvSet(key, value, exSeconds) {
  if (!KV_URL || !KV_TOKEN) return;
  try {
    await fetch(`${KV_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}/ex/${exSeconds}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
    });
  } catch {}
}

async function kvIncr(key) {
  if (!KV_URL || !KV_TOKEN) return 1;
  try {
    const res = await fetch(`${KV_URL}/incr/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
    });
    const data = await res.json();
    return data.result || 1;
  } catch { return 1; }
}

async function kvDel(key) {
  if (!KV_URL || !KV_TOKEN) return;
  try {
    await fetch(`${KV_URL}/del/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
    });
  } catch {}
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const secret = process.env.SPEC_SESSION_SECRET;
  const raw    = process.env.SPEC_PASSWORDS || "";

  if (!secret || !raw) {
    return res.status(500).json({ error: "Auth not configured." });
  }

  // Get client IP for rate limiting
  const ip = (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown"
  ).trim();

  const rateLimitKey = `spec:auth:fail:${ip}`;
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_SECONDS = 15 * 60; // 15 minutes

  // Check if IP is locked out
  const attempts = parseInt(await kvGet(rateLimitKey) || "0", 10);
  if (attempts >= MAX_ATTEMPTS) {
    return res.status(429).json({
      error: "Too many failed attempts. Try again in 15 minutes.",
    });
  }

  const password = (req.body || {}).password;
  const valid = raw.split(",").map(p => p.trim()).filter(Boolean);

  if (!password || !valid.includes(password)) {
    // Increment failure counter, set/extend 15-min expiry
    const newCount = await kvIncr(rateLimitKey);
    // Set expiry on first failure; subsequent incrs extend via re-set
    await kvSet(rateLimitKey, String(newCount), LOCKOUT_SECONDS);

    const remaining = MAX_ATTEMPTS - newCount;
    return res.status(401).json({
      error: remaining > 0
        ? `Incorrect password. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
        : "Too many failed attempts. Try again in 15 minutes.",
    });
  }

  // Correct password — clear the failure counter
  await kvDel(rateLimitKey);

  res.setHeader(
    "Set-Cookie",
    `spec_sess=${secret}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000`
  );
  return res.status(200).json({ ok: true });
}
