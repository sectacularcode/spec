// GET /api/me — check if the current session cookie is valid
// Returns { authed: true } or { authed: false }

export default function handler(req, res) {
  const secret = process.env.SPEC_SESSION_SECRET;

  if (!secret) return res.status(200).json({ authed: false });

  const cookie = req.headers.cookie || "";
  const match  = cookie.match(/(?:^|;\s*)spec_sess=([^;]+)/);
  const authed  = !!(match && match[1] === secret);

  return res.status(200).json({ authed });
}
