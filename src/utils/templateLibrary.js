// Postgres-backed template library — thin wrappers over
// /api/template-library, mirroring the fail-silent contract of
// kvStorageGet/Set in ./storage.js.

import { authHeaders } from "./api.js";

export async function listTemplateLibrary() {
  try {
    const res = await fetch("/api/template-library", { headers: await authHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.entries) ? data.entries : [];
  } catch { return []; }
}

export async function saveTemplateLibraryEntry(entry) {
  try {
    const res = await fetch("/api/template-library", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ entry }),
    });
    return res.ok;
  } catch { return false; }
}

export async function deleteTemplateLibraryEntry(id) {
  try {
    const res = await fetch("/api/template-library?id=" + encodeURIComponent(id), {
      method: "DELETE",
      headers: await authHeaders(),
    });
    if (res.ok) return { ok: true };
    const body = await res.json().catch(() => null);
    return { ok: false, error: body?.error || "Request failed" };
  } catch { return { ok: false, error: "Request failed" }; }
}
