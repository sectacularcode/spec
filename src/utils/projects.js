// Postgres-backed Template Studio projects — thin wrappers over
// /api/projects, mirroring the fail-silent contract of kvStorageGet/Set in
// ./storage.js so call sites don't need new error-handling patterns.

import { authHeaders } from "./api.js";

export async function listProjects() {
  try {
    const res = await fetch("/api/projects", { headers: await authHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.projects) ? data.projects : [];
  } catch { return []; }
}

export async function saveProjectsBatch({ upserts = [], deletes = [] } = {}) {
  if (upserts.length === 0 && deletes.length === 0) return { upserted: [], collisions: [], deleted: [] };
  try {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ upserts, deletes }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}
