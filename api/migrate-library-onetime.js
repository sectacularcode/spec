// ONE-TIME MIGRATION — copies existing per-user Redis library/keyword-build
// arrays (spec:data:{userId}:spec-template-library,
// spec:data:{userId}:spec-section-library,
// spec:data:{userId}:spec-keyword-builds) into their Postgres tables.
//
// DELETE THIS FILE once you've confirmed the migration succeeded and the
// app is running on the Postgres-backed api/template-library.js,
// api/section-library.js, api/keyword-builds.js.
//
// Usage: POST /api/migrate-library-onetime with a valid Clerk session
// belonging to a Postgres-backed admin (getProfile() is safe to trust,
// profiles have been stable on Postgres since Stage 1). Safe to run more
// than once — every insert is collision-guarded and idempotent per source
// entry.

import { requireAuth, getProfile } from "./_lib/auth.js";
import { sql } from "@vercel/postgres";

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const MAX_ID_RETRIES = 5;

async function kvGet(key) {
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  const data = await res.json();
  return data.result ? JSON.parse(data.result) : null;
}

async function scanKeys(pattern) {
  let cursor = 0;
  let allKeys = [];
  do {
    const res = await fetch(
      `${KV_URL}/scan/${cursor}?match=${encodeURIComponent(pattern)}&count=100`,
      { headers: { Authorization: `Bearer ${KV_TOKEN}` } }
    );
    const data = await res.json();
    const result = data.result || [];
    cursor = result[0] ?? 0;
    allKeys = allKeys.concat(result[1] || []);
  } while (cursor !== 0 && cursor !== "0");
  return allKeys;
}

function userIdFromKey(key, suffix) {
  return key.slice("spec:data:".length, key.length - (":" + suffix).length);
}

function freshId(prefix) {
  return prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
}

async function migrateTemplateLibrary() {
  const keys = await scanKeys("spec:data:*:spec-template-library");
  let migrated = 0;
  const collisionsRemapped = [];
  const skipped = [];

  for (const key of keys) {
    const userId = userIdFromKey(key, "spec-template-library");
    const arr = await kvGet(key);
    if (!Array.isArray(arr)) { skipped.push({ userId, reason: "not an array" }); continue; }

    for (const entry of arr) {
      const { id, client, date, source, ...rest } = entry || {};
      if (!id || !client || !date || !source) {
        skipped.push({ userId, id: id || null, reason: "malformed entry" });
        continue;
      }
      let insertId = id;
      let inserted = false;
      for (let attempt = 0; attempt < MAX_ID_RETRIES && !inserted; attempt++) {
        const { rows } = await sql`
          INSERT INTO template_library_entries (id, user_id, client, entry_date, source, data)
          VALUES (${insertId}, ${userId}, ${client}, ${date}, ${source}, ${rest})
          ON CONFLICT (id) DO NOTHING
          RETURNING id
        `;
        if (rows.length > 0) { inserted = true; }
        else {
          const newId = freshId("build");
          if (insertId !== id) collisionsRemapped.pop();
          collisionsRemapped.push({ userId, oldId: id, newId });
          insertId = newId;
        }
      }
      if (inserted) migrated++;
      else skipped.push({ userId, id, reason: "exhausted id retries" });
    }

    await sql`
      DELETE FROM template_library_entries
      WHERE user_id = ${userId} AND id NOT IN (
        SELECT id FROM template_library_entries WHERE user_id = ${userId}
        ORDER BY created_at DESC, id DESC LIMIT 50
      )
    `;
  }

  return { keysScanned: keys.length, migrated, collisionsRemapped, skipped };
}

async function migrateSectionLibrary() {
  const keys = await scanKeys("spec:data:*:spec-section-library");
  let migrated = 0;
  const collisionsRemapped = [];
  const skipped = [];

  for (const key of keys) {
    const userId = userIdFromKey(key, "spec-section-library");
    const arr = await kvGet(key);
    if (!Array.isArray(arr)) { skipped.push({ userId, reason: "not an array" }); continue; }

    for (const entry of arr) {
      const { id, ...rest } = entry || {};
      if (!id) { skipped.push({ userId, id: null, reason: "malformed entry" }); continue; }
      let insertId = id;
      let inserted = false;
      for (let attempt = 0; attempt < MAX_ID_RETRIES && !inserted; attempt++) {
        const { rows } = await sql`
          INSERT INTO section_library_entries (id, user_id, data)
          VALUES (${insertId}, ${userId}, ${rest})
          ON CONFLICT (id) DO NOTHING
          RETURNING id
        `;
        if (rows.length > 0) { inserted = true; }
        else {
          const newId = freshId("section");
          if (insertId !== id) collisionsRemapped.pop();
          collisionsRemapped.push({ userId, oldId: id, newId });
          insertId = newId;
        }
      }
      if (inserted) migrated++;
      else skipped.push({ userId, id, reason: "exhausted id retries" });
    }

    await sql`
      DELETE FROM section_library_entries
      WHERE user_id = ${userId} AND id NOT IN (
        SELECT id FROM section_library_entries WHERE user_id = ${userId}
        ORDER BY created_at DESC, id DESC LIMIT 300
      )
    `;
  }

  return { keysScanned: keys.length, migrated, collisionsRemapped, skipped };
}

async function migrateKeywordBuilds() {
  const keys = await scanKeys("spec:data:*:spec-keyword-builds");
  let migrated = 0;
  const collisionsRemapped = [];
  const skipped = [];

  for (const key of keys) {
    const userId = userIdFromKey(key, "spec-keyword-builds");
    const arr = await kvGet(key);
    if (!Array.isArray(arr)) { skipped.push({ userId, reason: "not an array" }); continue; }

    for (const entry of arr) {
      const { id, keywords, date, ...rest } = entry || {};
      if (!id || typeof keywords !== "string" || !date) {
        skipped.push({ userId, id: id || null, reason: "malformed entry" });
        continue;
      }
      let insertId = id;
      let inserted = false;
      for (let attempt = 0; attempt < MAX_ID_RETRIES && !inserted; attempt++) {
        const { rows } = await sql`
          INSERT INTO keyword_builds (id, user_id, keywords, build_date, data)
          VALUES (${insertId}, ${userId}, ${keywords}, ${date}, ${rest})
          ON CONFLICT (id) DO NOTHING
          RETURNING id
        `;
        if (rows.length > 0) { inserted = true; }
        else {
          const newId = freshId("kb");
          if (insertId !== id) collisionsRemapped.pop();
          collisionsRemapped.push({ userId, oldId: id, newId });
          insertId = newId;
        }
      }
      if (inserted) migrated++;
      else skipped.push({ userId, id, reason: "exhausted id retries" });
    }

    await sql`
      DELETE FROM keyword_builds
      WHERE user_id = ${userId} AND id NOT IN (
        SELECT id FROM keyword_builds WHERE user_id = ${userId}
        ORDER BY created_at DESC, id DESC LIMIT 50
      )
    `;
  }

  return { keysScanned: keys.length, migrated, collisionsRemapped, skipped };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const requesterId = await requireAuth(req);
  if (!requesterId) return res.status(401).json({ error: "Unauthorized" });

  const requesterProfile = await getProfile(requesterId);
  if (requesterProfile.role !== "admin") {
    return res.status(403).json({ error: "Forbidden — admin only" });
  }

  if (!KV_URL || !KV_TOKEN) {
    return res.status(500).json({ error: "KV not configured" });
  }

  try {
    const [templateLibrary, sectionLibrary, keywordBuilds] = await Promise.all([
      migrateTemplateLibrary(),
      migrateSectionLibrary(),
      migrateKeywordBuilds(),
    ]);

    return res.status(200).json({ ok: true, templateLibrary, sectionLibrary, keywordBuilds });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
