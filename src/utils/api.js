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
