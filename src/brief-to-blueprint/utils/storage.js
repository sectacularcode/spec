// KV Storage helpers — thin wrappers over /api/storage (Upstash Redis proxy)
// All functions are async and fail silently — the tool degrades gracefully
// if storage is unavailable rather than crashing.
// Auth is a Clerk session JWT attached by authHeaders(); the server verifies
// the token and namespaces every key to the signed-in user.

import { authHeaders } from "../../utils/api.js";

export async function kvStorageGet(key) {
  try {
    const res = await fetch("/api/storage?key=" + encodeURIComponent(key), {
      headers: await authHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.value ? { value: data.value } : null;
  } catch (e) { return null; }
}

export async function kvStorageSet(key, value) {
  try {
    const res = await fetch("/api/storage", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ action: "set", key, value }),
    });
    return res.ok;
  } catch (e) { return false; }
}

export async function kvStorageDel(key) {
  try {
    const res = await fetch("/api/storage", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ action: "delete", key }),
    });
    return res.ok;
  } catch (e) { return false; }
}
