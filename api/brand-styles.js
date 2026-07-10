// Brand style guide API — Postgres-backed. One saved color/font profile
// per (user, brand name), reusable across every future page for that
// brand regardless of upload source (Standard Brief or Manifest import).
//
// GET    /api/brand-styles              — list the caller's saved brand styles
// GET    /api/brand-styles?brand_name=X — look up one brand's saved style
// POST   /api/brand-styles              — { brand_name, colors, fonts } — upsert
// DELETE /api/brand-styles?brand_name=X — remove one saved style

import { requireAuth } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";
import { validText, validJsonSize } from "./_lib/validate.js";
import { sql } from "@vercel/postgres";

// Only these keys are meaningful to Spec's color system (see landing.js's
// color fallback chain) — anything else in the submitted object is
// silently dropped rather than stored, so this table can't accumulate
// arbitrary junk keys over time.
const COLOR_KEYS = ["ink", "brass", "brass-deep", "bone", "asphalt", "stone", "warm-white", "text"];
const FONT_KEYS = ["heading", "body"];
const HEX_RE = /^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{4}$|^#[0-9A-Fa-f]{6}$|^#[0-9A-Fa-f]{8}$/;

function sanitizeColors(input) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return {};
  const out = {};
  for (const key of COLOR_KEYS) {
    const val = input[key];
    if (typeof val === "string" && HEX_RE.test(val.trim())) out[key] = val.trim();
  }
  return out;
}

function sanitizeFonts(input) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return {};
  const out = {};
  for (const key of FONT_KEYS) {
    const val = input[key];
    if (typeof val === "string" && val.trim().length > 0 && val.trim().length <= 100) out[key] = val.trim();
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const userId = await requireAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (!(await rateLimit(userId, "brand-styles", 60))) return tooMany(res);

  try {
    if (req.method === "GET") {
      const brandName = req.query.brand_name;
      if (brandName) {
        if (!validText(brandName, 200)) return res.status(400).json({ error: "Invalid brand_name" });
        const { rows } = await sql`
          SELECT brand_name, colors, fonts, updated_at FROM brand_styles
          WHERE user_id = ${userId} AND brand_name = ${brandName}
          LIMIT 1
        `;
        return res.status(200).json({ style: rows[0] || null });
      }
      const { rows } = await sql`
        SELECT brand_name, colors, fonts, updated_at FROM brand_styles
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC
      `;
      return res.status(200).json({ styles: rows });
    }

    if (req.method === "POST") {
      const { brand_name, colors, fonts } = req.body || {};
      if (!validText(brand_name, 200) || brand_name.trim().length === 0) {
        return res.status(400).json({ error: "Invalid brand_name" });
      }
      const cleanColors = sanitizeColors(colors);
      const cleanFonts = sanitizeFonts(fonts);
      if (!validJsonSize(cleanColors) || !validJsonSize(cleanFonts)) {
        return res.status(400).json({ error: "Invalid colors/fonts payload" });
      }

      await sql`
        INSERT INTO brand_styles (user_id, brand_name, colors, fonts, updated_at)
        VALUES (${userId}, ${brand_name.trim()}, ${cleanColors}, ${cleanFonts}, NOW())
        ON CONFLICT (user_id, brand_name)
        DO UPDATE SET colors = ${cleanColors}, fonts = ${cleanFonts}, updated_at = NOW()
      `;
      return res.status(200).json({ ok: true, brand_name: brand_name.trim(), colors: cleanColors, fonts: cleanFonts });
    }

    if (req.method === "DELETE") {
      const brandName = req.query.brand_name;
      if (!validText(brandName, 200)) return res.status(400).json({ error: "Invalid brand_name" });
      await sql`DELETE FROM brand_styles WHERE user_id = ${userId} AND brand_name = ${brandName}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
