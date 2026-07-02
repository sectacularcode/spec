// Universal storage API — Upstash Redis proxy.
// GET  /api/storage?key=xxx        — get a value (own namespace only)
// POST /api/storage                — { action: "set"|"delete", key, value? }
//
// Security model:
// - Auth via verified Clerk JWT (Authorization: Bearer <token>). No client-supplied IDs.
// - Every key is namespaced server-side as spec:data:{userId}:{key}, so no user
//   can read, write, or delete another user's data or any internal key
//   (spec:user:*, spec:rl:*) regardless of what key string they send.
// - Legacy flat keys from before namespacing are readable as a one-way fallback
//   (allowlisted, read-only) so existing saved work still loads. All writes go
//   to the namespaced key.

import { requireAuth } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

const MAX_KEY_LENGTH = 200;
const MAX_VALUE_BYTES = 1024 * 1024; // 1MB per value

// Pre-namespacing keys that may still hold data. Read-only fallback.
const LEGACY_KEYS = new Set([
  "projects",
  "spec-template-library",
  "spec-keyword-builds",
  "spec-blueprint-draft",
  "spec-blueprint-drafts",
  "spec-inspo-patterns",
  "spec-section-library",
]);

async function kvFetch(path, body) {
  const res = await fetch(KV_URL + path, {
    method: body !== undefined ? "POST" : "GET",
    headers: { Authorization: "Bearer " + KV_TOKEN },
    ...(body !== undefined ? { body } : {}),
  });
  if (!res.ok) throw new Error("KV " + res.status);
  return res.json();
}

function validKey(key) {
  return typeof key === "string" && key.length > 0 && key.length <= MAX_KEY_LENGTH;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!KV_URL || !KV_TOKEN) {
    return res.status(500).json({ error: "KV not configured" });
  }

  const userId = await requireAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (!(await rateLimit(userId, "storage", 120))) return tooMany(res);

  const ns = (key) => "spec:data:" + userId + ":" + key;

  try {
    if (req.method === "GET") {
      const key = req.query.key;
      if (!validKey(key)) return res.status(400).json({ error: "Missing or invalid key" });

      const data = await kvFetch("/get/" + encodeURIComponent(ns(key)));
      if (data.result !== null && data.result !== undefined) {
        return res.status(200).json({ value: data.result });
      }

      // Legacy fallback: read old flat key so pre-migration data still loads.
      if (LEGACY_KEYS.has(key)) {
        const legacy = await kvFetch("/get/" + encodeURIComponent(key));
        return res.status(200).json({ value: legacy.result || null });
      }

      return res.status(200).json({ value: null });
    }

    if (req.method === "POST") {
      const { action, key, value } = req.body || {};
      if (!validKey(key)) return res.status(400).json({ error: "Missing or invalid key" });

      if (action === "set") {
        const encoded = typeof value === "string" ? value : JSON.stringify(value);
        if (Buffer.byteLength(encoded || "", "utf8") > MAX_VALUE_BYTES) {
          return res.status(413).json({ error: "Value too large (1MB max)" });
        }
        // Value goes in the POST body — URL-path values hit length limits on
        // large payloads like the template library.
        await kvFetch("/set/" + encodeURIComponent(ns(key)), encoded);
        return res.status(200).json({ ok: true });
      }

      if (action === "delete") {
        await kvFetch("/del/" + encodeURIComponent(ns(key)));
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ error: "Unknown action" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
