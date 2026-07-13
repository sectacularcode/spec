// Brand style guide API — Postgres-backed. One saved color/font/button
// profile per (user, brand name), reusable across every future page for
// that brand regardless of upload source (Standard Brief or Manifest
// import).
//
// GET    /api/brand-styles              — list the caller's saved brand styles
// GET    /api/brand-styles?brand_name=X — look up one brand's saved style
// GET    /api/brand-styles?all=true     — admin only, every user's saved
//                                          styles. Reference list for
//                                          picking real brand colors/fonts
//                                          when building a new Template
//                                          Studio template -- same "admin
//                                          sees everything" scoping as
//                                          error-logs.js and template-
//                                          queries.js, not its own new
//                                          pattern. Ignored entirely for
//                                          non-admin callers, who keep
//                                          getting exactly the same
//                                          user-scoped response as before
//                                          -- this is additive only.
// POST   /api/brand-styles              — { brand_name, colors, fonts, buttons } — upsert
// DELETE /api/brand-styles?brand_name=X — remove one saved style

import { requireAuth, getProfile } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";
import { validText, validJsonSize } from "./_lib/validate.js";
import { logError } from "./_lib/errorLog.js";
import { sanitizeColors, sanitizeFonts, sanitizeButtons } from "./_lib/brandValidation.js";
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
      source_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, brand_name)
    )
  `;
  // CREATE TABLE IF NOT EXISTS only runs the column list for a brand-new
  // table -- it does nothing to a table that already exists, which is the
  // real case here (brand_styles has been live since before source_url
  // existed). ADD COLUMN IF NOT EXISTS is the self-healing step for that:
  // cheap on every request once the column is already there, and doesn't
  // require a separate one-off migration to have actually been run.
  await sql`ALTER TABLE brand_styles ADD COLUMN IF NOT EXISTS source_url TEXT`;
  // Buttons is a real array (not a fixed-key object like colors/fonts) --
  // a person picks 1-3 explicit background+text pairs directly, there's
  // no template-role slot system to key them by. Same self-healing
  // pattern as source_url above.
  await sql`ALTER TABLE brand_styles ADD COLUMN IF NOT EXISTS buttons JSONB NOT NULL DEFAULT '[]'::jsonb`;
}

// Colors/fonts/buttons validation (COLOR_KEYS/FONT_KEYS/HEX_RE/
// FONT_NAME_RE, sanitizeColors/sanitizeFonts/sanitizeButtons) now lives in
// ./_lib/brandValidation.js -- moved there so api/brands.js can reuse the
// exact same rules instead of a second copy that could drift out of sync.
// No behavior change here, just where the code lives.

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const userId = await requireAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (!(await rateLimit(userId, "brand-styles", 60))) return tooMany(res);

  try {
    await ensureTable();

    if (req.method === "GET") {
      // Admin-only, cross-user reference list -- checked first since it's
      // a completely separate response shape (every user's styles, plus
      // which user_id each belongs to) from the two existing GET paths
      // below, not a variant of either one.
      if (req.query.all === "true") {
        const profile = await getProfile(userId);
        if (profile.role !== "admin") return res.status(403).json({ error: "Forbidden" });
        if (!(await rateLimit(userId, "brand-styles-admin-all", 30))) return tooMany(res);
        const { rows } = await sql`
          SELECT user_id, brand_name, colors, fonts, buttons, source_url, updated_at FROM brand_styles
          ORDER BY updated_at DESC
        `;
        return res.status(200).json({ styles: rows });
      }

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
          SELECT brand_name, colors, fonts, buttons, source_url, updated_at FROM brand_styles
          WHERE user_id = ${userId} AND LOWER(brand_name) = LOWER(${brandName})
          ORDER BY updated_at DESC
          LIMIT 1
        `;
        return res.status(200).json({ style: rows[0] || null });
      }
      const { rows } = await sql`
        SELECT brand_name, colors, fonts, buttons, source_url, updated_at FROM brand_styles
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC
      `;
      return res.status(200).json({ styles: rows });
    }

    if (req.method === "POST") {
      const { brand_name, colors, fonts, buttons, source_url } = req.body || {};
      if (!validText(brand_name, 200) || brand_name.trim().length === 0) {
        return res.status(400).json({ error: "Invalid brand_name" });
      }
      const { clean: cleanColors, dropped: droppedColorKeys } = sanitizeColors(colors);
      const { clean: cleanFonts, dropped: droppedFontKeys } = sanitizeFonts(fonts);
      const { clean: cleanButtons, droppedCount: droppedButtonCount } = sanitizeButtons(buttons);
      if (!validJsonSize(cleanColors) || !validJsonSize(cleanFonts) || !validJsonSize({ buttons: cleanButtons })) {
        return res.status(400).json({ error: "Invalid colors/fonts/buttons payload" });
      }
      // Optional -- a manually-entered style guide has no source URL at
      // all, which is fine. When present it's validated the same as any
      // other URL Spec accepts from a user (length-bounded, must actually
      // parse as a URL) rather than trusted as-is.
      let cleanSourceUrl = null;
      if (source_url != null) {
        if (typeof source_url !== "string" || source_url.length > 2000) {
          return res.status(400).json({ error: "Invalid source_url" });
        }
        let parsed;
        try {
          parsed = new URL(source_url);
        } catch {
          return res.status(400).json({ error: "Invalid source_url" });
        }
        // Explicit reject, not a silent fallback to null -- a
        // javascript:/data:/ftp: scheme is a syntactically valid URL (so
        // the try/catch above alone doesn't catch it) and this field can
        // end up rendered as a clickable link in the saved-styles list.
        // Silently discarding it and letting the rest of the save succeed
        // would hide exactly the case worth surfacing to the caller.
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          return res.status(400).json({ error: "Invalid source_url" });
        }
        cleanSourceUrl = parsed.href;
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
          SET brand_name = ${trimmedName}, colors = ${cleanColors}, fonts = ${cleanFonts}, buttons = ${JSON.stringify(cleanButtons)},
              source_url = COALESCE(${cleanSourceUrl}, source_url), updated_at = NOW()
          WHERE user_id = ${userId} AND brand_name = ${existing[0].brand_name}
        `;
      } else {
        await sql`
          INSERT INTO brand_styles (user_id, brand_name, colors, fonts, buttons, source_url, updated_at)
          VALUES (${userId}, ${trimmedName}, ${cleanColors}, ${cleanFonts}, ${JSON.stringify(cleanButtons)}, ${cleanSourceUrl}, NOW())
        `;
      }
      return res.status(200).json({
        ok: true, brand_name: trimmedName, colors: cleanColors, fonts: cleanFonts, buttons: cleanButtons,
        droppedColorKeys: droppedColorKeys.length ? droppedColorKeys : undefined,
        droppedFontKeys: droppedFontKeys.length ? droppedFontKeys : undefined,
        droppedButtonCount: droppedButtonCount || undefined,
      });
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
