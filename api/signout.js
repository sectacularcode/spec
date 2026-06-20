// POST /api/signout — clear the session cookie

export default function handler(req, res) {
  // Expire the cookie immediately
  res.setHeader(
    "Set-Cookie",
    "spec_sess=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
  );
  return res.status(200).json({ ok: true });
}
