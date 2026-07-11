// Shared API auth helper.
// Every /api/* request must carry a Clerk session JWT in the Authorization
// header. The backend verifies the token signature — client-supplied user IDs
// are no longer trusted anywhere.
//
// window.Clerk is set by @clerk/clerk-react once the app loads, and
// getToken() transparently refreshes short-lived session tokens, so this is
// safe to call from non-component code (storage utils, event handlers).

export async function getAuthToken() {
  try {
    if (window.Clerk && window.Clerk.session) {
      return await window.Clerk.session.getToken();
    }
  } catch {
    // fall through
  }
  return null;
}

// Returns headers for a JSON API request with auth attached.
export async function authHeaders(extra = {}) {
  const token = await getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

// Admin accounts see real error detail (status + server message) since
// that's what's actually useful for diagnosing a problem; Manager/Staff
// see a generic message instead -- internal detail like table/column
// names or query failures isn't meaningful to them and isn't something
// non-admins should see surfaced in the UI. Server-side detail (Postgres
// messages etc.) is still the same string either way; this only changes
// what's *displayed*, not what's logged (see api/_lib/errorLog.js for the
// admin-visible log of the raw detail regardless of who triggered it).
export function formatErrorMessage(role, status, serverMsg, fallback) {
  if (role === "admin") {
    return "Error" + (status ? " (" + status + ")" : "") + (serverMsg ? ": " + serverMsg : "");
  }
  return fallback || "Something went wrong — try again in a moment.";
}
