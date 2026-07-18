// Fidelity approvals API — stores a lightweight fingerprint of a Manifest
// page's content once it's been reviewed and approved, NOT the raw
// Manifest JSON itself (deliberate: this is a pattern-matching reference
// for future imports, not an archive of Megan's source content). See
// checkFidelity.js / manifestImport.js's findUnknownFields for the report
// this fingerprint is built from.
//
// GET    /api/fidelity-approvals?brand=X   — list approvals (optionally
//                                             filtered to one brand), newest
//                                             first, for the history view
//                                             and the pattern-match check
//                                             a new import runs against.
// POST   /api/fidelity-approvals           — { entry } — save one approval.
// DELETE /api/fidelity-approvals?id=X      — remove one approval.
// DELETE /api/fidelity-approvals?all=true[&brand=X] — clear everything (or
//                                             everything for one brand) —
//                                             the "clear at any time" control.

import { requireAuth } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";
import { validId, validText, validJsonSize } from "./_lib/validate.js";
import { logError } from "./_lib/errorLog.js";
import { sql } from "./_lib/db.js";

const CAP = 500; // total rows per user -- generous, but a real ceiling so this can never grow unbounded even if "clear" is never used

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS fidelity_approvals (
      id             TEXT PRIMARY KEY,
      user_id        TEXT NOT NULL,
      brand_name     TEXT,
      page_slug      TEXT,
      section_types  JSONB NOT NULL,
      field_summary  JSONB NOT NULL,
      report_summary JSONB NOT NULL,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_fidelity_approvals_user_id ON fidelity_approvals(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_fidelity_approvals_brand ON fidelity_approvals(user_id, brand_name)`;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const userId = await requireAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (!(await rateLimit(userId, "fidelity-approvals", 60))) return tooMany(res);

  try {
    await ensureTable();

    if (req.method === "GET") {
      const brand = typeof req.query.brand === "string" ? req.query.brand : null;
      const { rows } = brand
        ? await sql`
            SELECT id, brand_name, page_slug, section_types, field_summary, report_summary, created_at
            FROM fidelity_approvals
            WHERE user_id = ${userId} AND brand_name = ${brand}
            ORDER BY created_at DESC
          `
        : await sql`
            SELECT id, brand_name, page_slug, section_types, field_summary, report_summary, created_at
            FROM fidelity_approvals
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
          `;
      return res.status(200).json({
        approvals: rows.map(r => ({
          id: r.id,
          brandName: r.brand_name,
          pageSlug: r.page_slug,
          sectionTypes: r.section_types,
          fieldSummary: r.field_summary,
          reportSummary: r.report_summary,
          createdAt: r.created_at,
        })),
      });
    }

    if (req.method === "POST") {
      const { entry } = req.body || {};
      const { id, brandName, pageSlug, sectionTypes, fieldSummary, reportSummary } = entry || {};
      const rest = { sectionTypes, fieldSummary, reportSummary };
      if (!validId(id) || !validText(brandName, 200) || !validText(pageSlug, 200) || !validJsonSize(rest)) {
        return res.status(400).json({ error: "Invalid entry" });
      }
      if (!Array.isArray(sectionTypes)) {
        return res.status(400).json({ error: "sectionTypes must be an array" });
      }

      // Re-approving the same page (same brand+slug) replaces the previous
      // fingerprint rather than accumulating duplicates -- only the latest
      // approved state is useful as a pattern-match reference.
      await sql`
        DELETE FROM fidelity_approvals
        WHERE user_id = ${userId} AND brand_name = ${brandName} AND page_slug = ${pageSlug}
      `;
      await sql`
        INSERT INTO fidelity_approvals (id, user_id, brand_name, page_slug, section_types, field_summary, report_summary)
        VALUES (${id}, ${userId}, ${brandName}, ${pageSlug}, ${JSON.stringify(sectionTypes)}, ${JSON.stringify(fieldSummary || {})}, ${JSON.stringify(reportSummary || {})})
        ON CONFLICT (id) DO NOTHING
      `;

      // Cap at CAP most recent rows for this user -- a real ceiling even
      // if "clear" is never used, matching keyword_builds' own pattern.
      await sql`
        DELETE FROM fidelity_approvals
        WHERE user_id = ${userId} AND id NOT IN (
          SELECT id FROM fidelity_approvals
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
          LIMIT ${CAP}
        )
      `;

      return res.status(200).json({ ok: true, id });
    }

    if (req.method === "DELETE") {
      if (req.query.all === "true") {
        const brand = typeof req.query.brand === "string" ? req.query.brand : null;
        if (brand) {
          await sql`DELETE FROM fidelity_approvals WHERE user_id = ${userId} AND brand_name = ${brand}`;
        } else {
          await sql`DELETE FROM fidelity_approvals WHERE user_id = ${userId}`;
        }
        return res.status(200).json({ ok: true });
      }
      const id = req.query.id;
      if (!validId(id)) return res.status(400).json({ error: "Invalid id" });
      await sql`DELETE FROM fidelity_approvals WHERE id = ${id} AND user_id = ${userId}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    await logError("fidelity-approvals", req.method, userId, 500, err.message);
    return res.status(500).json({ error: err.message });
  }
}
