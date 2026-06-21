# spec.

A browser-based planning tool for WordPress designers. Converts brand briefs into structured, importable page templates for Elementor (primary) and Divi (secondary).

**Live:** [specish.com](https://specish.com)  
**Repo:** `sectacularcode/elementor-builder2`  
**Stack:** React 19 + Vite, deployed on Vercel Pro, Upstash Redis for KV storage

---

## Two workflows

### Template Studio
Pre-built industry templates with a full visual editor. Fill in brand details (colors, fonts, copy), pick page sections, and export clean Elementor JSON. Renders a live preview of the site as you edit.

### Brief to Blueprint
Upload a client brand brief (DOCX, PDF, JSON, or TXT) or fill out the intake form. Select pages. Generate a complete multi-page site structure with AI-drafted copy in the brand voice. A/B layout variants are selected based on the brief's industry and any crawled inspo URLs.

---

## Project structure

```
src/
  App.jsx                    — Auth, top nav, tab routing between tools
  main.jsx                   — React root, ErrorBoundary wrapper
  index.css                  — Global resets only
  elementor-builder.jsx      — Template Studio (entire tool)
  CustomBuild.jsx            — Brief to Blueprint (entire tool)
  components/
    ErrorBoundary.jsx        — Catches render errors, shows reload prompt
  constants/
    pages.js                 — Page definitions, form tabs, default colors/tiers
    patterns.js              — Layout pattern library (LAYOUT_PATTERNS)

api/
  auth.js                    — POST /api/auth — login with rate limiting
  me.js                      — GET /api/me — session check
  signout.js                 — POST /api/signout — clear session cookie
  parse-brief.js             — POST /api/parse-brief — extract fields from uploaded file
  crawl-inspo.js             — POST /api/crawl-inspo — crawl a URL for layout patterns
  draft-copy.js              — POST /api/draft-copy — AI-draft empty brief fields
  analyze-inspo.js           — POST /api/analyze-inspo — AI layout recommendations
  storage.js                 — GET/POST /api/storage — Upstash Redis KV proxy
  anthropic.js               — Anthropic API proxy (dev only)
```

---

## Running locally

```bash
npm install
npm run dev
```

Create a `.env.local` file with:

```
VITE_ANTHROPIC_API_KEY=your_key_here
SPEC_PASSWORDS=yourpassword
SPEC_SESSION_SECRET=any_long_random_string
KV_REST_API_URL=your_upstash_url
KV_REST_API_TOKEN=your_upstash_token
```

The dev server proxies `/api/anthropic` to Anthropic's API. All other `/api/*` routes are Vercel serverless functions — use `vercel dev` to run them locally, or the tool will gracefully skip features that depend on them.

---

## Environment variables (Vercel)

| Variable | Purpose |
|----------|---------|
| `SPEC_PASSWORDS` | Comma-separated list of valid passwords e.g. `pass1,pass2,pass3` |
| `SPEC_SESSION_SECRET` | Random 32+ char string used as the session cookie value |
| `KV_REST_API_URL` | Upstash Redis REST URL |
| `KV_REST_API_TOKEN` | Upstash Redis token |
| `KV_REST_API_READ_ONLY_TOKEN` | Upstash read-only token |
| `ANTHROPIC_API_KEY` | Claude API key for brief parsing and AI copy drafting |
| `VITE_ANTHROPIC_API_KEY` | Same key, exposed to Vite dev proxy |

---

## Elementor JSON export format

Exports use Elementor's container/flexbox system (v4.x compatible). The JSON structure is:

```json
{
  "version": "0.4",
  "title": "Page name",
  "type": "page",
  "page_settings": {},
  "content": [ ...container widgets... ]
}
```

Each container widget looks like:
```json
{
  "id": "abc1234",
  "elType": "container",
  "settings": { "background_color": "#1C1A17", "padding": {...} },
  "elements": [ ...child widgets... ]
}
```

Import via: **WordPress → Templates → Saved Templates → Import**  
Header/Footer via: **WordPress → Templates → Theme Builder → Import**

---

## Adding a layout pattern variant

1. Add an entry to `src/constants/patterns.js` under the relevant section key
2. Add a rendering case in `buildPreviewHTML()` inside `CustomBuild.jsx` (find the `sections` object)
3. Add an A/B override in the pattern override block at the top of `buildPreviewHTML()`
4. Optionally add a variant JSON builder in `generatePages()` for the Elementor export

---

## Adding a new page type

1. Add the page definition to `ADDITIONAL_PAGE_TYPES` in `src/constants/pages.js`
2. Add a preview section in the `sections` object inside `buildPreviewHTML()` in `CustomBuild.jsx`
3. Add pattern overrides for A/B if the page should have layout variants
4. If the page needs a custom Elementor JSON structure, add a builder function and wire it in `generatePages()`

---

## Auth

Login is server-side. The password is validated against `SPEC_PASSWORDS` in `api/auth.js`. Sessions use an httpOnly cookie (`spec_sess`). Rate limited to 5 failed attempts per IP per 15 minutes using Upstash Redis.

To add a tester: add their password to `SPEC_PASSWORDS` and redeploy.  
To revoke access: remove their password from `SPEC_PASSWORDS` and redeploy.  
To force all sessions to expire: change `SPEC_SESSION_SECRET` and redeploy.

---

## Deploying

Pushes to `main` auto-deploy to Vercel. Build takes ~60–90 seconds.  
Hard refresh (`Cmd+Shift+R`) required to clear browser cache after deploy.
