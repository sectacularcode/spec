// KV Storage helpers — thin wrappers over /api/storage (Upstash Redis proxy)
// All functions are async and fail silently — the tool degrades gracefully
// if storage is unavailable rather than crashing.

export async function kvStorageGet(key) {
  try {
    const res = await fetch("/api/storage?key=" + encodeURIComponent(key));
    if (!res.ok) return null;
    const data = await res.json();
    return data.value ? { value: data.value } : null;
  } catch(e) { return null; }
}

export async function kvStorageSet(key, value) {
  try {
    const res = await fetch("/api/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set", key, value }),
    });
    return res.ok;
  } catch(e) { return false; }
}

export async function kvStorageDel(key) {
  try {
    const res = await fetch("/api/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", key }),
    });
    return res.ok;
  } catch(e) { return false; }
}
