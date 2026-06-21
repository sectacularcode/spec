// GET /api/me — lightweight health check (Clerk handles auth state on the frontend)
export default function handler(req, res) {
  return res.status(200).json({ ok: true });
}
