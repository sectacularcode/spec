// One-time migration: brand_styles (per-user) -> brands (shared).
//
// Dry-run by default -- prints exactly what it would do and writes
// nothing. Pass --commit to actually perform the inserts.
//
// brand_styles is user_id-scoped, so it's possible two different staff
// members each saved a brand_styles row with the same (case-insensitive)
// brand name for two ACTUALLY DIFFERENT real clients. This script does not
// guess which case that is -- any name shared across more than one
// user_id is reported under "COLLISIONS — NOT MIGRATED" and skipped
// entirely, left for manual review. Only names unique to a single user_id
// (the common case: one person, possibly several old case-variant rows
// for the same real client) are migrated automatically.
//
// brand_styles itself is never modified or dropped by this script.
//
// Usage:
//   node db/migrate-brand-styles-to-brands.mjs             # dry run
//   node db/migrate-brand-styles-to-brands.mjs --commit     # actually writes
//
// Requires POSTGRES_URL (or whatever @vercel/postgres reads locally) to
// point at the real Neon database -- same env var Vercel already injects
// in production, pulled locally via `vercel env pull` or set by hand.

import { sql } from "@vercel/postgres";

const COMMIT = process.argv.includes("--commit");

async function main() {
  const { rows: brandStyles } = await sql`
    SELECT user_id, brand_name, colors, fonts, buttons, source_url, updated_at
    FROM brand_styles
    ORDER BY updated_at DESC
  `;

  if (brandStyles.length === 0) {
    console.log("No brand_styles rows found -- nothing to migrate.");
    return;
  }

  // Group by lowercased name.
  const groups = new Map();
  for (const row of brandStyles) {
    const key = row.brand_name.trim().toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const clean = [];
  const collisions = [];

  for (const [key, rows] of groups) {
    const distinctUsers = new Set(rows.map(r => r.user_id));
    if (distinctUsers.size > 1) {
      collisions.push({ key, rows });
    } else {
      // rows is already ordered by updated_at DESC from the query above,
      // so rows[0] is the most recently updated -- same "latest save wins
      // for display casing" rule brand-styles.js's own upsert already
      // used, applied here to pick which duplicate row survives.
      clean.push(rows[0]);
    }
  }

  console.log(`\n${brandStyles.length} brand_styles rows -> ${groups.size} distinct names`);
  console.log(`  ${clean.length} will migrate cleanly (single owner each)`);
  console.log(`  ${collisions.length} name(s) shared across multiple users -- NOT migrated\n`);

  if (collisions.length > 0) {
    console.log("=== COLLISIONS — NOT MIGRATED, NEEDS MANUAL REVIEW ===");
    for (const c of collisions) {
      console.log(`\n  "${c.rows[0].brand_name}" saved by ${c.rows.length} different users:`);
      for (const r of c.rows) {
        console.log(`    user_id=${r.user_id}  updated_at=${new Date(r.updated_at).toISOString()}`);
      }
    }
    console.log("\n  Resolve these by hand (rename one, or confirm they're really the same\n  client) and re-run -- they will not be touched by this script.\n");
  }

  console.log("=== WILL MIGRATE ===");
  for (const row of clean) {
    console.log(`  "${row.brand_name}"  (user_id=${row.user_id}, updated_at=${new Date(row.updated_at).toISOString()})`);
  }

  if (!COMMIT) {
    console.log("\nDry run only -- no rows written. Re-run with --commit to apply.");
    return;
  }

  console.log("\nCommitting...");
  let inserted = 0;
  for (const row of clean) {
    const id = "brand-" + Date.now() + "-" + inserted;
    await sql`
      INSERT INTO brands (
        id, created_by, name, colors, fonts, buttons, source_url
      ) VALUES (
        ${id}, ${row.user_id}, ${row.brand_name.trim()},
        ${row.colors || {}}, ${row.fonts || {}}, ${JSON.stringify(row.buttons || [])},
        ${row.source_url || null}
      )
    `;
    inserted++;
  }
  console.log(`Done -- ${inserted} brand(s) inserted into brands.`);
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
