// Postgres-backed section library — thin wrappers over
// /api/section-library, mirroring the fail-silent contract of
// kvStorageGet/Set in ./storage.js.

import { authHeaders } from "./api.js";

export async function listSectionLibrary() {
  try {
    const res = await fetch("/api/section-library", { headers: await authHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.entries) ? data.entries : [];
  } catch { return []; }
}

export async function saveSectionLibraryEntries(entries) {
  if (!entries || entries.length === 0) return true;
  try {
    const res = await fetch("/api/section-library", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ entries }),
    });
    return res.ok;
  } catch { return false; }
}
