// Shared request-body validation for the per-row Postgres endpoints
// (api/projects.js and Stage 3's library/keyword/draft endpoints).

const MAX_JSON_BYTES = 1024 * 1024; // 1MB, matching api/storage.js's existing per-value cap

export function validId(id, maxLen = 64) {
  return typeof id === "string" && id.length > 0 && id.length <= maxLen;
}

// For free-text scalar columns (client, keywords, client_name, etc.) — these
// are client-controlled strings with no DB-level length constraint since the
// schema is frozen, so the app layer is the only place enforcing a cap.
export function validText(text, maxLen = 500) {
  return typeof text === "string" && text.length <= maxLen;
}

export function validJsonSize(obj, maxBytes = MAX_JSON_BYTES) {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
  return Buffer.byteLength(JSON.stringify(obj), "utf8") <= maxBytes;
}
