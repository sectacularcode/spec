# spec.

A browser-based planning tool for WordPress designers. Converts brand briefs into structured, importable page templates for Elementor (primary) and Divi (secondary).

**Live:** [specish.com](https://specish.com)
**Repo:** `sectacularcode/elementor-builder2`
**Stack:** React 19 + Vite v8, deployed on Vercel Pro, Postgres (Neon) for data storage, Upstash Redis for rate limiting

---

## Two tools

### Template Studio
Pre-built industry templates with a full visual editor. Fill in brand details (colors, fonts, copy), pick page sections, and export clean Elementor JSON. Renders a live preview as you edit.

### Brief to Blueprint
Upload a client brand brief (DOCX, PDF, JSON, or TXT) or fill out the intake form. Select pages. Generate a complete multi-page site structure with AI-drafted copy in the brand voice. A/B layout variants are selected based on the brief and any crawled inspo URLs.

---

## Project structure

```
src/
  App.jsx                        — Auth, top nav, tab routing between tools
  main.jsx                       — React root, ErrorBoundary wrapper
  index.css                      — Global resets only
  components/
    ErrorBoundary.jsx
  constants/
    pages.js                     — Shared page type definitions (B2B)
    patterns.js                  — Shared layout pattern data (B2B)
  utils/
    htmlEscape.js                — Shared HTML escape utility
    projects.js, templateLibrary.js, sectionLibrary.js, keywordBuilds.js,
    blueprintDrafts.js, inspoPatterns.js
                                  — Thin fetch wrappers over the Postgres-backed
                                    api/*.js endpoints, one per data type

  template-studio/
    index.jsx                    — State, handlers, layout shell, ctx object
    styles.js                    — I style tokens (inputs, labels, buttons)
    builders/
      helpers.js                 — Elementor JSON primitives
      buildPageJSON.js           — Page template builder
      buildHeaderJSON.js         — Header template builder
      buildFooterJSON.js         — Footer template builder
      buildDiviPage.js           — Divi page builder
      buildDiviFooter.js         — Divi footer builder
    components/
      Icon.jsx                   — SVG icon component
      Section.jsx                — Collapsible section wrapper
      tabs/
        DiscoveryTab.jsx         — Discovery tab UI
        PositioningTab.jsx       — Positioning tab UI
        BrandTab.jsx             — Visual/brand tab UI
        ContentTab.jsx           — Content tab UI
        SocialTab.jsx            — Social tab UI
        HeaderFooterTab.jsx      — Header & Footer tab UI
        ExportTab.jsx            — Export & Import tab UI
    constants/
      ui.js                      — Page types, section options, tones, fonts
      themes.js                  — Color themes
      layouts.js                 — Layout definitions
      templates.js               — Website and page templates
    preview/
      previewHTML.js             — Live preview HTML renderer
    utils/
      colors.js                  — Contrast and color utilities
      images.js                  — Image library and helpers
      svg.js                     — Social SVG icons
      audit.js                   — Brand audit logic
      htmlEscape.js              — Re-exports from src/utils/htmlEscape.js

  brief-to-blueprint/
    index.jsx                    — State, handlers, layout shell
    styles.js                    — T style tokens (inputs, buttons, surfaces)
    builders/
      generatePages.js           — Orchestrates all page builders
      helpers.js                 — Elementor JSON primitives
      headerFooter.js            — Header and footer builders
      home.js / about.js / work.js / services.js / process.js / contact.js / generic.js
    components/
      IntakeForm.jsx             — Manual brand intake form
      BriefReview.jsx            — Parsed brief review/edit UI
    preview/
      buildPreviewHTML.js        — Live preview HTML renderer
    utils/
      extractBrief.js            — Extract fields from raw brief data
      inspo.js                   — Inspo URL pattern builder
      library.js                 — Section/template library save/load (Postgres)
      patterns.js                — Layout pattern selection
      htmlEscape.js              — Re-exports from src/utils/htmlEscape.js

api/
  auth.js                        — Password auth, httpOnly cookie, rate limiting
  me.js                          — Session check
  signout.js                     — Clear session cookie
  parse-brief.js                 — DOCX/PDF/TXT brief extraction via Claude
  draft-copy.js                  — AI copy drafting for blank fields
  analyze-inspo.js               — AI layout variant recommendations from inspo
  crawl-inspo.js                 — Crawl inspo URLs, extract structure via Claude
  projects.js, template-library.js, section-library.js, keyword-builds.js,
  blueprint-drafts.js, inspo-patterns.js
                                  — Postgres-backed CRUD for each data type
                                    (see db/schema.sql for the table shapes)
  _lib/ratelimit.js               — Upstash Redis-backed rate limiting (the
                                    only remaining use of Redis in this app)
```

---

## Auth

Password-based. Passwords stored in `SPEC_PASSWORDS` Vercel env var (comma-separated for multiple users). Session stored as an httpOnly cookie keyed to `SPEC_SESSION_SECRET`. Rate limited: 5 failed attempts per IP locks out for 15 minutes via Upstash Redis.

All API routes (except `auth.js`, `me.js`, `signout.js`) verify the session cookie before processing.

---

## Environment variables (Vercel)

| Variable | Purpose |
|---|---|
| `SPEC_PASSWORDS` | Comma-separated login passwords |
| `SPEC_SESSION_SECRET` | Session cookie value (treat as a secret) |
| `KV_REST_API_URL` | Upstash Redis endpoint — rate limiting only, not data storage |
| `KV_REST_API_TOKEN` | Upstash Redis auth token |
| `KV_REST_API_READ_ONLY_TOKEN` | Upstash read-only token |
| `POSTGRES_URL` (and related `POSTGRES_*` vars) | Neon Postgres connection, via Vercel's native storage integration — primary data store, see `db/schema.sql` |
| `ANTHROPIC_API_KEY` | Claude API key for server-side AI routes |

---

## Key rules for contributors

- **Always fetch fresh file SHA via GET before any PUT to GitHub** — reusing cached SHAs causes silent failures.
- **Validate JSX with `@babel/parser` before pushing** — Vite v8/rolldown gives cryptic errors on bad JSX.
- **Never do global hex replacements** — the same hex values appear in both UI styles and generated Elementor JSON template strings.
- **All fonts load from `index.html` globally** — never use component-level `@import`.
- **State lives in `index.jsx`** for each tool. Tab components receive a `ctx` prop containing all state and handlers they need. Add new state to `index.jsx`, add it to the `ctx` object, then consume it in the relevant tab.
- **New API routes must include the session auth check** — see any existing protected route for the pattern.
- **Auto-deploys from `main` in ~60–90 seconds.** Hard refresh (`Cmd+Shift+R`) required after deploy.

---

## Design system

| Token | Value |
|---|---|
| Primary accent | `#b45309` (amber) |
| Accent wash | `rgba(180, 83, 9, 0.1)` |
| Secondary buttons | `#6b635c` (warm stone) |
| Border | `#dde0e6` |
| Canvas background | `#eeedf1` |
| Cards | `#ffffff` |
| UI font | Be Vietnam Pro |
| Logo / headings | Outfit 800 |
| Top nav | system Inter |
| Top nav height | 48px fixed |
