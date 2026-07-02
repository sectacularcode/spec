// Per-user, per-route rate limiting via Upstash Redis (fixed window).
// Fails open on Redis errors so a KV hiccup never bricks the app —
// auth remains the hard gate.

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

export async function rateLimit(userId, route, limit, windowSec = 60) {
  if (!KV_URL || !KV_TOKEN) return true;
  const bucket = Math.floor(Date.now() / (windowSec * 1000));
  const key = `spec:rl:${route}:${userId}:${bucket}`;
  try {
    const res = await fetch(`${KV_URL}/incr/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
    });
    const data = await res.json();
    if (data.result === 1) {
      await fetch(`${KV_URL}/expire/${encodeURIComponent(key)}/${windowSec * 2}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
      });
    }
    return typeof data.result === "number" ? data.result <= limit : true;
  } catch {
    return true;
  }
}

export function tooMany(res) {
  return res.status(429).json({ error: "Too many requests. Slow down and try again in a minute." });
}
