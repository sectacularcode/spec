// Per-user, per-route rate limiting via Upstash Redis (fixed window).
// Falls back to an in-process limiter (below) on Redis errors so a KV
// hiccup degrades cost control instead of removing it entirely — auth
// remains the hard gate either way.

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

// In-process fallback — used only when Redis is unconfigured or
// unreachable. NOT a substitute for the Redis-backed limiter: it's scoped
// to a single warm serverless instance (resets on cold start, isn't shared
// across concurrent instances), but it's a real safety net instead of the
// previous fully-open fallback during a genuine Upstash outage.
const memoryBuckets = new Map();
const MEMORY_BUCKET_MAX_ENTRIES = 5000; // hard cap so a prolonged outage can't leak memory indefinitely

function memoryRateLimit(userId, route, limit, windowSec) {
  const bucket = Math.floor(Date.now() / (windowSec * 1000));
  const key = `${route}:${userId}:${bucket}`;
  const count = (memoryBuckets.get(key) || 0) + 1;
  memoryBuckets.set(key, count);
  if (memoryBuckets.size > MEMORY_BUCKET_MAX_ENTRIES) {
    // Map preserves insertion order, so the first half is approximately
    // the oldest entries — evict them rather than growing unbounded.
    const keys = [...memoryBuckets.keys()];
    for (let i = 0; i < keys.length / 2; i++) memoryBuckets.delete(keys[i]);
  }
  return count <= limit;
}

export async function rateLimit(userId, route, limit, windowSec = 60) {
  if (!KV_URL || !KV_TOKEN) return memoryRateLimit(userId, route, limit, windowSec);
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
    // Redis unreachable — fall back to the in-process limiter rather than
    // opening the gate entirely.
    return memoryRateLimit(userId, route, limit, windowSec);
  }
}

export function tooMany(res) {
  return res.status(429).json({ error: "Too many requests. Slow down and try again in a minute." });
}
