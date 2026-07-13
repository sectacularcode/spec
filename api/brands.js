// Brands API — Postgres-backed, shared client/brand profiles.
//
// Unlike every other table in this app, rows here are NOT scoped by
// user_id — a client isn't "owned" by whoever created it, it's a team
// resource. Access is gated by role instead (admin only for now; manager
// is the planned next tier — see ALLOWED_ROLES below). created_by is kept
// purely for audit/display ("added by X"), never used as an access check.
//
// GET    /api/brands                        — list every brand (admin/manager only)
// GET    /api/brands?id=X                    — one brand's full profile
// GET    /api/brands?manifest_brand_id=X      — lookup by Manifest's stable brand id
//                                                (for the future auto-link step in
//                                                Brief to Blueprint — not wired yet)
// POST   /api/brands                          — { id, name, manifest_brand_id?, colors?,
//                                                fonts?, buttons?, feature_layout?,
//                                                post_closing_layout?,
//                                                skip_services_checklist?, source_url? }
//                                                — upsert by id
// DELETE /api/brands?id=X                     — remove one brand

import { requireAuth, getProfile } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";
import { validId, validText, validJsonSize } from "./_lib/validate.js";
import { logError } from "./_lib/errorLog.js";
import {
  sanitizeColors, sanitizeFonts, sanitizeButtons, sanitizeSectionLayout,
} from "./_lib/brandValidation.js";
import { sql } from "@vercel/postgres";

// Admin only today. Add "manager" here when that tier is ready — the rest
// of this file already reads from this list rather than a hardcoded
// "admin" check, so that's a one-line change when the time comes.
const ALLOWED_ROLES = ["admin"];

const MAX_NAME_LEN = 200;
const MAX_NOTES_LEN = 5000;

// Self-healing, matching db/schema.sql's brands definition exactly.
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS brands (
      id                       TEXT PRIMARY KEY,
      created_by               TEXT NOT NULL,
      name                     TEXT NOT NULL,
      manifest_brand_id        TEXT,
      colors                   JSONB NOT NULL DEFAULT '{}'::jsonb,
      fonts                    JSONB NOT NULL DEFAULT '{}'::jsonb,
      buttons                  JSONB NOT NULL DEFAULT '[]'::jsonb,
      feature_layout           JSONB NOT NULL DEFAULT '[]'::jsonb,
      post_closing_layout      JSONB NOT NULL DEFAULT '[]'::jsonb,
      skip_services_checklist  BOOLEAN NOT NULL DEFAULT false,
      source_url               TEXT,
      notes                    TEXT,
      created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_manifest_brand_id ON brands(manifest_brand_id) WHERE manifest_brand_id IS NOT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS idx_brands_name_lower ON brands(LOWER(name))`;
}

function validSourceUrl(source_url) {
  if (source_url == null) return { ok: true, value: null };
  if (typeof source_url !== "string" || source_url.length > 2000) return { ok: false };
  let parsed;
  try {
    parsed = new URL(source_url);
  } catch {
    return { ok: false };
  }
  // Explicit reject, not a silent fallback — same reasoning as
  // brand-styles.js: a javascript:/data:/ftp: scheme parses fine as a URL
  // but shouldn't be storable as a clickable source link.
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return { ok: false };
  return { ok: true, value: parsed.href };
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const userId = await requireAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (!(await rateLimit(userId, "brands", 60))) return tooMany(res);

  const profile = await getProfile(userId);
  if (!ALLOWED_ROLES.includes(profile.role)) return res.status(403).json({ error: "Forbidden" });

  try {
    await ensureTable();

    if (req.method === "GET") {
      const manifestBrandId = req.query.manifest_brand_id;
      if (manifestBrandId) {
        if (!validText(manifestBrandId, 200)) return res.status(400).json({ error: "Invalid manifest_brand_id" });
        const { rows } = await sql`SELECT * FROM brands WHERE manifest_brand_id = ${manifestBrandId} LIMIT 1`;
        return res.status(200).json({ brand: rows[0] || null });
      }

      const id = req.query.id;
      if (id) {
        if (!validId(id)) return res.status(400).json({ error: "Invalid id" });
        const { rows } = await sql`SELECT * FROM brands WHERE id = ${id} LIMIT 1`;
        return res.status(200).json({ brand: rows[0] || null });
      }

      const { rows } = await sql`SELECT * FROM brands ORDER BY updated_at DESC`;
      return res.status(200).json({ brands: rows });
    }

    if (req.method === "POST") {
      const {
        id, name, manifest_brand_id, colors, fonts, buttons,
        feature_layout, post_closing_layout, skip_services_checklist, source_url, notes,
      } = req.body || {};

      if (!validId(id)) return res.status(400).json({ error: "Invalid id" });
      if (!validText(name, MAX_NAME_LEN) || name.trim().length === 0) {
        return res.status(400).json({ error: "Invalid name" });
      }
      if (manifest_brand_id != null && !validText(manifest_brand_id, 200)) {
        return res.status(400).json({ error: "Invalid manifest_brand_id" });
      }
      if (notes != null && !validText(notes, MAX_NOTES_LEN)) {
        return res.status(400).json({ error: "Invalid notes" });
      }
      const cleanNotes = typeof notes === "string" ? notes.trim() : null;

      const trimmedName = name.trim();
      const { clean: cleanColors, dropped: droppedColorKeys } = sanitizeColors(colors);
      const { clean: cleanFonts, dropped: droppedFontKeys } = sanitizeFonts(fonts);
      const { clean: cleanButtons, droppedCount: droppedButtonCount } = sanitizeButtons(buttons);
      const { clean: cleanFeatureLayout, droppedCount: droppedFeatureRowCount } = sanitizeSectionLayout(feature_layout);
      const { clean: cleanPostClosingLayout, droppedCount: droppedPostClosingRowCount } = sanitizeSectionLayout(post_closing_layout);
      const cleanSkipChecklist = !!skip_services_checklist;
      const urlCheck = validSourceUrl(source_url);
      if (!urlCheck.ok) return res.status(400).json({ error: "Invalid source_url" });
      if (
        !validJsonSize(cleanColors) || !validJsonSize(cleanFonts)
        || !validJsonSize({ b: cleanButtons }) || !validJsonSize({ f: cleanFeatureLayout })
        || !validJsonSize({ p: cleanPostClosingLayout })
      ) {
        return res.status(400).json({ error: "Payload too large" });
      }

      const { rows: existingById } = await sql`SELECT id FROM brands WHERE id = ${id}`;
      const isUpdate = existingById.length > 0;

      // Name collision check — excludes this row's own id so renaming a
      // brand to its own current name (a no-op save) doesn't false-positive.
      const { rows: nameCollisions } = await sql`
        SELECT id, name FROM brands WHERE LOWER(name) = LOWER(${trimmedName}) AND id != ${id}
      `;
      if (nameCollisions.length > 0) {
        return res.status(409).json({
          error: "name_collision",
          message: `A brand named "${nameCollisions[0].name}" already exists.`,
          existingId: nameCollisions[0].id,
        });
      }

      if (manifest_brand_id) {
        const { rows: manifestCollisions } = await sql`
          SELECT id FROM brands WHERE manifest_brand_id = ${manifest_brand_id} AND id != ${id}
        `;
        if (manifestCollisions.length > 0) {
          return res.status(409).json({
            error: "manifest_id_collision",
            message: "Another brand is already linked to this Manifest brand id.",
            existingId: manifestCollisions[0].id,
          });
        }
      }

      if (isUpdate) {
        await sql`
          UPDATE brands SET
            name = ${trimmedName},
            manifest_brand_id = ${manifest_brand_id || null},
            colors = ${cleanColors},
            fonts = ${cleanFonts},
            buttons = ${JSON.stringify(cleanButtons)},
            feature_layout = ${JSON.stringify(cleanFeatureLayout)},
            post_closing_layout = ${JSON.stringify(cleanPostClosingLayout)},
            skip_services_checklist = ${cleanSkipChecklist},
            source_url = ${urlCheck.value},
            notes = ${cleanNotes},
            updated_at = NOW()
          WHERE id = ${id}
        `;
        // created_by is deliberately untouched — audit trail reflects who
        // added the brand, not who most recently edited it.
      } else {
        await sql`
          INSERT INTO brands (
            id, created_by, name, manifest_brand_id, colors, fonts, buttons,
            feature_layout, post_closing_layout, skip_services_checklist, source_url, notes
          ) VALUES (
            ${id}, ${userId}, ${trimmedName}, ${manifest_brand_id || null},
            ${cleanColors}, ${cleanFonts}, ${JSON.stringify(cleanButtons)},
            ${JSON.stringify(cleanFeatureLayout)}, ${JSON.stringify(cleanPostClosingLayout)},
            ${cleanSkipChecklist}, ${urlCheck.value}, ${cleanNotes}
          )
        `;
      }

      const { rows: saved } = await sql`SELECT * FROM brands WHERE id = ${id}`;
      return res.status(200).json({
        ok: true,
        brand: saved[0],
        droppedColorKeys: droppedColorKeys.length ? droppedColorKeys : undefined,
        droppedFontKeys: droppedFontKeys.length ? droppedFontKeys : undefined,
        droppedButtonCount: droppedButtonCount || undefined,
        droppedFeatureRowCount: droppedFeatureRowCount || undefined,
        droppedPostClosingRowCount: droppedPostClosingRowCount || undefined,
      });
    }

    if (req.method === "DELETE") {
      const id = req.query.id;
      if (!validId(id)) return res.status(400).json({ error: "Invalid id" });
      await sql`DELETE FROM brands WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    await logError("brands", req.method, userId, 500, err.message);
    return res.status(500).json({ error: err.message });
  }
}
