# RYD Platform Audit Report

**Timestamp:** 2026-02-16  
**Branch:** (run `git branch --show-current`)  
**Commit:** 33efaa18a1b1078ed00f0700f9d7f0f77bbf7414  
**Commands:** `npm run dev` (node server.cjs)

---

## Phase 0 — Baseline Map

### 0.1 Runtime Entrypoints

| Component | Path | Notes |
|-----------|------|-------|
| Server | `server.cjs` | Express app, PORT 3000 |
| Public root | `public/` | Served at `/` |
| Tools data | `public/data/tools-canonical.json`, `public/data/tools.json` | Registry loader primary/fallback |
| Router | Server routes (not SPA client router) | `/`, `/tools`, `/insights`, `/gates`, `/search` explicit |
| Tool-of-Day config | `public/config/tool-of-the-day.json` | Fetched by ryd-bind.hardened.js |

### 0.2 Failure Signatures (File:Line)

| Signature | Location |
|-----------|----------|
| "Loading..." | index.html:78, tools.html:496, ryd-bind.hardened.js:115 |
| initToolOfTheDayNonBlocking | ryd-bind.hardened.js:424 |
| RYD VALIDATOR / requireValidTool | tool-content-validator.js:407 |
| pushState/popstate/navigate | ryd-router.js:704 |
| /js/config/analytics | index.html:22-24, analytics-config.js exists |
| try without catch | ui-stability.js:57-74 — **has catch** (verified OK) |

### 0.3 Known Issues (Symptoms)

1. **Tools page "Loading…"** — RYD_RegistryLoader.load() fetches tools-canonical.json; if fetch fails or returns HTML (SPA fallback), loader throws, tools never render.
2. **Tool-of-Day variants** — isVariantTool in ryd-bind.hardened.js; "standard-practice" is primary; quick-reset/deep-work are variants.
3. **Validator** — requireValidTool now non-throwing (previous fix); validateTool exists.
4. **Static assets** — SPA fallback excludes .js/.json; /config/* served by express.static(publicDir).
5. **Navigation** — Server renders distinct HTML per route; nav uses `<a href="/tools">` etc. No client-side router for page load.

---

## Phases 1–10 — Findings & Fixes

### Phase 1 — Fatal Runtime Errors
- **ui-stability.js**: Already has try/catch (lines 58–74). No change.
- **insights.html**: SafeMapper fallback already includes `sanitizeString` (previous fix). validate-insights-syntax passes.
- **Status**: Zero parse errors expected; validator script passes.

### Phase 2 — Router + Nav
- **Routing model**: Server-side routes. Nav uses `<a href="/tools">` etc. (real links). No SPA client router for page load.
- **Status**: Server serves distinct HTML per route. Navigation works via full page load.

### Phase 3 — Tools Page "Loading…"
- **Fixes**:
  - `tool-registry-loader.js`: Content-type check — if response is `text/html`, throw clear error: "Server returned HTML instead of JSON."
  - Fallback path also checks Content-Type before parsing.
- **Status**: Prevents MIME/SPA-fallback confusion; tools page shows error card instead of hanging.

### Phase 4 — Validation Boundary
- **Status**: Previous fixes applied. `requireValidTool` is non-throwing at runtime; `validateTool` returns `{ ok, errors }`; runtime uses `getContentSafe` / NEEDS CONTENT panel.

### Phase 5 — Tool-of-the-Day
- **Status**: Previous fixes applied. `isVariantTool` excludes quick-reset, deep-work; `pickToolOfDayRotating` uses day hash; empty pool shows "Needs content before rotation can start."

### Phase 6 — Static Assets
- **Fixes**:
  - `server.cjs`: Added `/config` to SPA fallback exclusion so `/config/*.json` is served by static.
  - Content-type protection in registry loader.
- **Status**: /data/*.json and /config/* served before SPA fallback.

### Phase 7 — Insights Page
- **Status**: SafeMapper has `sanitizeString` fallback; no infinite loop observed. If tools dataset missing, page shows error.

### Phase 8 — Gates Readability
- **Fixes**:
  - `gate-styles-loader.js`: Added `--gate-title-color` to style map (default `#1a1a1a`).
  - `integrated.css`: Gate title color changed from `#fff` to `var(--gate-title-color, var(--color-text, #1a1a1a))` for readable contrast.
- **Status**: Gate titles use dark text on light backgrounds when appropriate.

### Phase 9 — GA4/GTM
- **Status**: `analytics-config.js` exists; `analytics-config.local.js` has `onerror` fallback. If no IDs, config shows empty strings; no fatal load.

### Phase 10 — Verification
- **AUDIT_REPORT.md**: This file.
- **TEST_CHECKLIST.md**: Created with step-by-step verification steps.

---

## Files Touched

| File | Change |
|------|--------|
| `server.cjs` | Add `/config` to SPA fallback exclusion |
| `public/js/utils/tool-registry-loader.js` | Content-type check (HTML vs JSON) |
| `public/js/utils/gate-styles-loader.js` | Add `--gate-title-color` to style map |
| `public/css/integrated.css` | Gate title color for readability |
| `AUDIT_REPORT.md` | Created/updated |
| `TEST_CHECKLIST.md` | Created |

