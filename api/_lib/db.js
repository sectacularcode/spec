// Shared Postgres client for every API route -- the single place the
// database connection is configured.
//
// Migrated off @vercel/postgres (deprecated by Vercel; see
// neon.com/docs/guides/vercel-postgres-transition-guide) to Neon's own
// @neondatabase/serverless, July 2026. Every route keeps the exact same
// usage pattern as before: `import { sql } from "./_lib/db.js"` (or
// "./db.js" from inside _lib) and tagged-template queries destructured as
// `const { rows } = await sql\`...\``.
//
// Two deliberate choices here, both verified against the SDK's actual
// parsing code before migrating (stubbed-wire-format tests, not just
// docs):
//
// 1. fullResults: true is REQUIRED, not optional. Neon's sql() returns a
//    bare array of rows by default -- no .rows property at all -- while
//    every query in this codebase destructures { rows }. Without this
//    flag, all 16 database files break identically and silently
//    (undefined, not an error). With it, the result shape matches
//    @vercel/postgres exactly.
//
// 2. POSTGRES_URL, not DATABASE_URL. Neon's own docs are inconsistent
//    about which name to use, but POSTGRES_URL is the variable
//    @vercel/postgres itself read -- its existence and correctness in the
//    Vercel environment is proven by the app having worked until this
//    migration. DATABASE_URL may or may not also be set; POSTGRES_URL
//    definitely is.
//
// Array columns (e.g. profiles.tools TEXT[]) parse to real JS arrays,
// same as before -- verified explicitly since getProfile()'s fallback-to-
// staff error handling would have masked a parsing regression rather than
// surfacing it.

import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.POSTGRES_URL, { fullResults: true });
