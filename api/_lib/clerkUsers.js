// Shared Clerk user-details lookup. Extracted from user-role.js (which had
// this inline) so brands.js can resolve created_by/updated_by to real
// names without a second, drifting copy of the same Clerk API call.

const CLERK_SECRET = process.env.CLERK_SECRET_KEY;

// Fetch user details (name, email) from Clerk for a list of user IDs.
// One batched request regardless of how many IDs are passed -- never N
// separate calls. Silently returns {} on any failure (missing key,
// network error, bad response) so callers can treat a lookup miss the
// same as "fall back to the raw id" rather than needing their own
// try/catch around every call site.
export async function clerkGetUsers(userIds) {
  if (!CLERK_SECRET || !userIds.length) return {};
  try {
    const params = userIds.map(id => `user_id[]=${encodeURIComponent(id)}`).join("&");
    const res = await fetch(`https://api.clerk.com/v1/users?${params}&limit=100`, {
      headers: { Authorization: `Bearer ${CLERK_SECRET}` },
    });
    if (!res.ok) return {};
    const data = await res.json();
    const map = {};
    for (const u of data) {
      const primaryEmail = u.email_addresses?.find(e => e.id === u.primary_email_address_id);
      const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || null;
      map[u.id] = { name, email: primaryEmail?.email_address || null };
    }
    return map;
  } catch {
    return {};
  }
}
