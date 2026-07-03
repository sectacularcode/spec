-- Spec: Postgres schema (Neon), replacing Upstash Redis storage.
--
-- Run this once via the Neon SQL Editor (or any Postgres client connected
-- with a superuser/owner role on the database) before any application code
-- is switched over to read/write these tables.
--
-- Design notes:
-- - No foreign keys from data tables to `profiles`. In the current Redis
--   model, a brand-new user can save a project before any admin has ever
--   set their role (spec:user:{userId} may never exist for a given user).
--   A hard FK would make every first-time save fail with a constraint
--   violation. Plain indexed user_id columns preserve today's behavior.
-- - Every array-of-blobs Redis key (spec-template-library,
--   spec-section-library, spec-keyword-builds, spec-blueprint-drafts)
--   becomes a real table with one row per entry. This is the actual fix
--   for the write-race bug the audit found (two tabs both read-modify-
--   write the whole blob) — saves become row-level INSERT/UPDATE/DELETE
--   instead of whole-array rewrites.
-- - IDs stay TEXT, matching the app's existing client-generated string IDs
--   (via uid()/nid() helpers) — no change needed to how the frontend
--   generates IDs.
-- - Each entry's full existing JS object is preserved as-is in a `data`
--   JSONB column. A few fields used for filtering/dedup today are also
--   promoted to real columns, but nothing is dropped or reshaped.

-- profiles: one row per user, replaces spec:user:{userId}
CREATE TABLE profiles (
  user_id    TEXT PRIMARY KEY,
  role       TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'manager', 'admin')),
  tools      TEXT[] NOT NULL DEFAULT ARRAY['template-studio', 'brief-to-blueprint'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- projects: one row per Template Studio project, replaces the `projects` array blob
CREATE TABLE projects (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  data       JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- template_library_entries: replaces the spec-template-library array blob
CREATE TABLE template_library_entries (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  client     TEXT,
  entry_date TEXT,   -- kept as the app's own date string (e.g. "2026-07-03"), not a real DATE type, to match existing string-equality dedup logic
  source     TEXT,
  data       JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_template_library_user_id ON template_library_entries(user_id);

-- section_library_entries: replaces the spec-section-library array blob
CREATE TABLE section_library_entries (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  data       JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_section_library_user_id ON section_library_entries(user_id);

-- keyword_builds: replaces the spec-keyword-builds array blob
CREATE TABLE keyword_builds (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  keywords   TEXT,
  build_date TEXT,
  data       JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_keyword_builds_user_id ON keyword_builds(user_id);

-- blueprint_drafts: replaces spec-blueprint-draft / spec-blueprint-drafts
CREATE TABLE blueprint_drafts (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  client_name TEXT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_blueprint_drafts_user_id ON blueprint_drafts(user_id);

-- inspo_patterns: one row per user, replaces spec-inspo-patterns
CREATE TABLE inspo_patterns (
  user_id    TEXT PRIMARY KEY,
  pool       JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
