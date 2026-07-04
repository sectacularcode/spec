// Postgres-backed keyword builds — thin wrappers over /api/keyword-builds,
// mirroring the fail-silent contract of kvStorageGet/Set in ./storage.js.

import { authHeaders } from "./api.js";

export async function listKeywordBuilds() {
  try {
    const res = await fetch("/api/keyword-builds", { headers: await authHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.entries) ? data.entries : [];
  } catch { return []; }
}

export async function saveKeywordBuildEntry(entry) {
  try {
    const res = await fetch("/api/keyword-builds", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ entry }),
    });
    if (res.ok) return { ok: true };
    const body = await res.json().catch(() => null);
    return { ok: false, error: body?.error || "Request failed" };
  } catch { return { ok: false, error: "Request failed" }; }
}

export async function deleteKeywordBuildEntry(id) {
  try {
    const res = await fetch("/api/keyword-builds?id=" + encodeURIComponent(id), {
      method: "DELETE",
      headers: await authHeaders(),
    });
    if (res.ok) return { ok: true };
    const body = await res.json().catch(() => null);
    return { ok: false, error: body?.error || "Request failed" };
  } catch { return { ok: false, error: "Request failed" }; }
}
