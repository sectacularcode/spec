// Brands API — Postgres-backed, shared client/brand profiles.
//
// Unlike every other table in this app, rows here are NOT scoped by
// user_id — a client isn't "owned" by whoever created it, it's a team
// resource. Reads and writes are open to any authenticated user with tool
// access (this is the actual day-to-day work: saving a brand's style from
// Brief to Blueprint or Style Guide, and browsing/reusing what's already
// saved). Delete is the one stricter tier (admin/manager), since it's
// destructive and reads/writes aren't. created_by/updated_by are
// audit/display only ("added by X" / "last touched by Y"), never used as
// an access check themselves.
//
// GET    /api/brands                          — list every brand
// GET    /api/brands?id=X                      — one brand's full profile
// GET    /api/brands?name=X                    — case-insensitive lookup by name --
//                                                lets Brief to Blueprint/Style Guide's
//                                                Save button find an existing brand to
//                                                update instead of minting a colliding
//                                                duplicate
// GET    /api/brands?manifest_brand_id=X       — lookup by Manifest's stable brand id
//                                                (for the future auto-link step, not
//                                                wired yet)
// POST   /api/brands                          — { id, name, manifest_brand_id?, colors?,
//                                                fonts?, buttons?, feature_layout?,
//                                                post_closing_layout?,
//                                                skip_services_checklist?, source_url? }
//                                                — upsert by id
// DELETE /api/brands?id=X                     — remove one brand (admin/manager only)

import { requireAuth, getProfile } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";
import { validId, validText, validJsonSize } from "./_lib/validate.js";
import { logError } from "./_lib/errorLog.js";
import {
  sanitizeColors, sanitizeFonts, sanitizeButtons, sanitizeSectionLayout,
} from "./_lib/brandValidation.js";
import { sql } from "@vercel/postgres";

// Browsing the full list (and, for now, single-id lookup -- only reachable
// from that same admin-only grid today) stays the admin management
// surface. Everything else -- saving a brand's style from Brief to
// Blueprint or Style Guide, and the lookups those saves need -- opens to
// anyone with tool access, since those are the people actually doing
// client work day to day. Delete is its own tier: destructive, so it
// stays above staff even though writes don't.
// Browsing is now open to anyone authenticated -- colors/fonts aren't
// sensitive, and restricting reads broke the exact people this table is
// meant to help (Style Guide's Saved Library needs to show the whole
// team's saved styles, not just the caller's own). Delete stays its own,
// stricter tier below.
const DELETE_ROLES = ["admin", "manager"];

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
      updated_by               TEXT,
      created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  // Self-healing for the table as it already exists in production (created
  // before updated_by existed) -- same ADD COLUMN IF NOT EXISTS pattern
  // brand-styles.js used for source_url/buttons. Now that writes are open
  // to staff/manager/admin, not just the person who first created a row,
  // created_by alone ("who added this client") stops being enough to
  // answer "who touched this last" -- updated_by is set on every save,
  // create or update, distinct from created_by which is set once and
  // never changes after insert.
  await sql`ALTER TABLE brands ADD COLUMN IF NOT EXISTS updated_by TEXT`;
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

  // Fetched once, checked per-operation below rather than one blanket
  // gate — GET-by-name/manifest_brand_id and POST are open to any
  // authenticated user; full list, single-id GET, and DELETE are not.
  const profile = await getProfile(userId);

  try {
    await ensureTable();

    if (req.method === "GET") {
      const manifestBrandId = req.query.manifest_brand_id;
      if (manifestBrandId) {
        if (!validText(manifestBrandId, 200)) return res.status(400).json({ error: "Invalid manifest_brand_id" });
        const { rows } = await sql`SELECT * FROM brands WHERE manifest_brand_id = ${manifestBrandId} LIMIT 1`;
        return res.status(200).json({ brand: rows[0] || null });
      }

      const name = req.query.name;
      if (name) {
        if (!validText(name, 200)) return res.status(400).json({ error: "Invalid name" });
        const { rows } = await sql`SELECT * FROM brands WHERE LOWER(name) = LOWER(${name}) LIMIT 1`;
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

      const trimmedName = name.trim();
      const { rows: existingRows } = await sql`SELECT * FROM brands WHERE id = ${id}`;
      const existingRow = existingRows[0] || null;
      const isUpdate = !!existingRow;

      // Partial-update semantics: a field entirely ABSENT from the request
      // body (undefined, checked with !==, not just falsy) means the
      // caller has no opinion on it -- fall back to whatever's already
      // there instead of clearing it. Brief to Blueprint's and Style
      // Guide's Save buttons only ever send colors/fonts/buttons(/
      // source_url) -- never feature_layout, post_closing_layout,
      // skip_services_checklist, notes, or manifest_brand_id -- so
      // treating "not sent" the same as "clear it" meant every save from
      // either tool silently wiped out anything set through Component
      // Library's own form (notes, most concretely, since that's the one
      // actively editable today). A caller that DOES want to explicitly
      // clear a field still can: send it as null/[]/false, a real
      // provided value, not an absent one.
      const colorsProvided = colors !== undefined;
      const fontsProvided = fonts !== undefined;
      const buttonsProvided = buttons !== undefined;
      const featureLayoutProvided = feature_layout !== undefined;
      const postClosingLayoutProvided = post_closing_layout !== undefined;
      const skipChecklistProvided = skip_services_checklist !== undefined;
      const sourceUrlProvided = source_url !== undefined;
      const notesProvided = notes !== undefined;
      const manifestBrandIdProvided = manifest_brand_id !== undefined;

      const { clean: cleanColors, dropped: droppedColorKeys } = colorsProvided
        ? sanitizeColors(colors) : { clean: existingRow?.colors || {}, dropped: [] };
      const { clean: cleanFonts, dropped: droppedFontKeys } = fontsProvided
        ? sanitizeFonts(fonts) : { clean: existingRow?.fonts || {}, dropped: [] };
      const { clean: cleanButtons, droppedCount: droppedButtonCount } = buttonsProvided
        ? sanitizeButtons(buttons) : { clean: existingRow?.buttons || [], droppedCount: 0 };
      const { clean: cleanFeatureLayout, droppedCount: droppedFeatureRowCount } = featureLayoutProvided
        ? sanitizeSectionLayout(feature_layout) : { clean: existingRow?.feature_layout || [], droppedCount: 0 };
      const { clean: cleanPostClosingLayout, droppedCount: droppedPostClosingRowCount } = postClosingLayoutProvided
        ? sanitizeSectionLayout(post_closing_layout) : { clean: existingRow?.post_closing_layout || [], droppedCount: 0 };
      const cleanSkipChecklist = skipChecklistProvided ? !!skip_services_checklist : !!existingRow?.skip_services_checklist;
      const urlCheck = sourceUrlProvided ? validSourceUrl(source_url) : { ok: true, value: existingRow?.source_url ?? null };
      if (!urlCheck.ok) return res.status(400).json({ error: "Invalid source_url" });
      const cleanNotes = notesProvided
        ? (typeof notes === "string" ? notes.trim() : null)
        : (existingRow?.notes ?? null);
      const resolvedManifestBrandId = manifestBrandIdProvided ? (manifest_brand_id || null) : (existingRow?.manifest_brand_id ?? null);

      if (
        !validJsonSize(cleanColors) || !validJsonSize(cleanFonts)
        || !validJsonSize({ b: cleanButtons }) || !validJsonSize({ f: cleanFeatureLayout })
        || !validJsonSize({ p: cleanPostClosingLayout })
      ) {
        return res.status(400).json({ error: "Payload too large" });
      }

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

      if (manifestBrandIdProvided && manifest_brand_id) {
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
            manifest_brand_id = ${resolvedManifestBrandId},
            colors = ${cleanColors},
            fonts = ${cleanFonts},
            buttons = ${JSON.stringify(cleanButtons)},
            feature_layout = ${JSON.stringify(cleanFeatureLayout)},
            post_closing_layout = ${JSON.stringify(cleanPostClosingLayout)},
            skip_services_checklist = ${cleanSkipChecklist},
            source_url = ${urlCheck.value},
            notes = ${cleanNotes},
            updated_by = ${userId},
            updated_at = NOW()
          WHERE id = ${id}
        `;
        // created_by is deliberately untouched — audit trail reflects who
        // added the brand, not who most recently edited it. updated_by
        // (above) is the one that changes on every save, since writes are
        // now open to anyone with tool access, not just the creator.
      } else {
        await sql`
          INSERT INTO brands (
            id, created_by, name, manifest_brand_id, colors, fonts, buttons,
            feature_layout, post_closing_layout, skip_services_checklist, source_url, notes, updated_by
          ) VALUES (
            ${id}, ${userId}, ${trimmedName}, ${resolvedManifestBrandId},
            ${cleanColors}, ${cleanFonts}, ${JSON.stringify(cleanButtons)},
            ${JSON.stringify(cleanFeatureLayout)}, ${JSON.stringify(cleanPostClosingLayout)},
            ${cleanSkipChecklist}, ${urlCheck.value}, ${cleanNotes}, ${userId}
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
      if (!DELETE_ROLES.includes(profile.role)) return res.status(403).json({ error: "Forbidden" });
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
