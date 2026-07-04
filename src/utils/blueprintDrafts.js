// Postgres-backed blueprint drafts — thin wrappers over
// /api/blueprint-drafts, mirroring the fail-silent contract of
// kvStorageGet/Set in ./storage.js.

import { authHeaders } from "./api.js";

export async function getSessionDraft() {
  try {
    const res = await fetch("/api/blueprint-drafts?session=1", { headers: await authHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data ?? null;
  } catch { return null; }
}

export async function saveSessionDraft(data) {
  try {
    const res = await fetch("/api/blueprint-drafts", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ session: true, data }),
    });
    return res.ok;
  } catch { return false; }
}

export async function clearSessionDraft() {
  try {
    const res = await fetch("/api/blueprint-drafts?session=1", {
      method: "DELETE",
      headers: await authHeaders(),
    });
    return res.ok;
  } catch { return false; }
}

export async function listDraftSnapshots() {
  try {
    const res = await fetch("/api/blueprint-drafts", { headers: await authHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.drafts) ? data.drafts : [];
  } catch { return []; }
}

export async function saveDraftSnapshot(clientName, data) {
  try {
    const res = await fetch("/api/blueprint-drafts", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ entry: { clientName, data } }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: body?.error || "Request failed" };
    return { ok: true, id: body?.id };
  } catch { return { ok: false, error: "Request failed" }; }
}

export async function deleteDraftSnapshot(id) {
  try {
    const res = await fetch("/api/blueprint-drafts?id=" + encodeURIComponent(id), {
      method: "DELETE",
      headers: await authHeaders(),
    });
    if (res.ok) return { ok: true };
    const body = await res.json().catch(() => null);
    return { ok: false, error: body?.error || "Request failed" };
  } catch { return { ok: false, error: "Request failed" }; }
}
