// POST /api/signout — no-op, Clerk handles sign out on the frontend
export default function handler(req, res) {
  return res.status(200).json({ ok: true });
}
