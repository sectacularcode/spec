// KV Storage helpers — thin wrappers over /api/storage (Upstash Redis proxy)
// All functions are async and fail silently — the tool degrades gracefully
// if storage is unavailable rather than crashing.
// Pass userId (Clerk user ID) so the API can verify the request is from a known user.

function authHeaders(userId) {
  const h = { "Content-Type": "application/json" };
  if (userId) h["x-spec-user-id"] = userId;
  return h;
}

export async function kvStorageGet(key, userId) {
  try {
    const url = "/api/storage?key=" + encodeURIComponent(key) + (userId ? "&_userId=" + encodeURIComponent(userId) : "");
    const res = await fetch(url, { headers: userId ? { "x-spec-user-id": userId } : {} });
    if (!res.ok) return null;
    const data = await res.json();
    return data.value ? { value: data.value } : null;
  } catch(e) { return null; }
}

export async function kvStorageSet(key, value, userId) {
  try {
    const res = await fetch("/api/storage", {
      method: "POST",
      headers: authHeaders(userId),
      body: JSON.stringify({ action: "set", key, value }),
    });
    return res.ok;
  } catch(e) { return false; }
}

export async function kvStorageDel(key, userId) {
  try {
    const res = await fetch("/api/storage", {
      method: "POST",
      headers: authHeaders(userId),
      body: JSON.stringify({ action: "delete", key }),
    });
    return res.ok;
  } catch(e) { return false; }
}
