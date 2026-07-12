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
import { logError } from "./_lib/errorLog.js";
import { sql } from "@vercel/postgres";

// The table was supposed to already exist in production (created in a
// prior chat session per that session's own notes) but didn't -- every
// save hit "relation brand_styles does not exist." Rather than depend on
// a one-off script having actually run against prod, which is exactly
// what silently failed here, the handler creates the table itself if it's
// missing. IF NOT EXISTS makes this cheap to run on every request rather
// than needing a separate migration step or a "did this already run"
// flag.
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS brand_styles (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      brand_name TEXT NOT NULL,
      colors JSONB NOT NULL DEFAULT '{}'::jsonb,
      fonts JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, brand_name)
    )
  `;
}

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

// Real font names are letters, numbers, spaces, and a handful of
// punctuation marks (e.g. "Be Vietnam Pro", "DM Sans", "Helvetica Neue").
// Restricting to that character class closes off font-family as an
// injection vector before it's used in any HTML/CSS context downstream --
// not currently rendered anywhere in the preview, but this is exactly the
// kind of stored value that becomes exploitable the moment some future
// feature does render it, and validating at the point of storage is
// cheaper than tracking down every future consumer.
const FONT_NAME_RE = /^[A-Za-z0-9 '.-]{1,100}$/;

function sanitizeFonts(input) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return {};
  const out = {};
  for (const key of FONT_KEYS) {
    const val = input[key];
    if (typeof val === "string" && FONT_NAME_RE.test(val.trim())) out[key] = val.trim();
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const userId = await requireAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (!(await rateLimit(userId, "brand-styles", 60))) return tooMany(res);

  try {
    await ensureTable();

    if (req.method === "GET") {
      const brandName = req.query.brand_name;
      if (brandName) {
        if (!validText(brandName, 200)) return res.status(400).json({ error: "Invalid brand_name" });
        // Case-insensitive: "Northbound Supply Co." and "northbound supply
        // co." are the same saved style. A Manifest import or a Style
        // Guide URL-scrape supplies brand.name however the source cased
        // it, which won't reliably match whatever casing a human typed by
        // hand in Brief to Blueprint -- so an exact match here silently
        // missed real matches. ORDER BY + LIMIT 1 is a deliberate
        // safety net: if any case-only duplicate rows exist from before
        // this fix, this deterministically returns the most recently
        // updated one rather than an arbitrary row.
        const { rows } = await sql`
          SELECT brand_name, colors, fonts, updated_at FROM brand_styles
          WHERE user_id = ${userId} AND LOWER(brand_name) = LOWER(${brandName})
          ORDER BY updated_at DESC
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

      const trimmedName = brand_name.trim();

      // Case-insensitive upsert, done at the application layer rather than
      // a DB-level case-insensitive unique constraint. A constraint-based
      // fix would require a migration that fails outright if any
      // case-only duplicate rows already exist in production -- and there
      // was no way to confirm the live table is clean before writing this.
      // A plain SELECT-then-update-or-insert sidesteps that risk entirely:
      // it works correctly regardless of what's already in the table, and
      // any pre-existing duplicates self-heal naturally the next time
      // either one gets saved again, rather than needing a one-time
      // cleanup pass run against prod.
      const { rows: existing } = await sql`
        SELECT brand_name FROM brand_styles
        WHERE user_id = ${userId} AND LOWER(brand_name) = LOWER(${trimmedName})
        ORDER BY updated_at DESC
        LIMIT 1
      `;

      if (existing.length > 0) {
        // Latest save wins for the display casing too, same as it already
        // does for colors/fonts -- consistent with the rest of this
        // handler rather than a special "keep the old casing" carve-out.
        await sql`
          UPDATE brand_styles
          SET brand_name = ${trimmedName}, colors = ${cleanColors}, fonts = ${cleanFonts}, updated_at = NOW()
          WHERE user_id = ${userId} AND brand_name = ${existing[0].brand_name}
        `;
      } else {
        await sql`
          INSERT INTO brand_styles (user_id, brand_name, colors, fonts, updated_at)
          VALUES (${userId}, ${trimmedName}, ${cleanColors}, ${cleanFonts}, NOW())
        `;
      }
      return res.status(200).json({ ok: true, brand_name: trimmedName, colors: cleanColors, fonts: cleanFonts });
    }

    if (req.method === "DELETE") {
      const brandName = req.query.brand_name;
      if (!validText(brandName, 200)) return res.status(400).json({ error: "Invalid brand_name" });
      // Same case-insensitive matching as GET/POST -- an exact-match
      // delete against a case-mismatched name would silently no-op and
      // leave the row behind, looking like the delete succeeded when it
      // did nothing.
      await sql`DELETE FROM brand_styles WHERE user_id = ${userId} AND LOWER(brand_name) = LOWER(${brandName})`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    await logError("brand-styles", req.method, userId, 500, err.message);
    return res.status(500).json({ error: err.message });
  }
}
