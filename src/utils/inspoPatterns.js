// Postgres-backed inspo patterns — thin wrappers over /api/inspo-patterns,
// mirroring the fail-silent contract of kvStorageGet/Set in ./storage.js.

import { authHeaders } from "./api.js";

export async function getInspoPatterns() {
  try {
    const res = await fetch("/api/inspo-patterns", { headers: await authHeaders() });
    if (!res.ok) return { pool: "" };
    const data = await res.json();
    return { pool: data.pool || "" };
  } catch { return { pool: "" }; }
}

export async function saveInspoPatterns(pool) {
  try {
    const res = await fetch("/api/inspo-patterns", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ pool }),
    });
    return res.ok;
  } catch { return false; }
}
