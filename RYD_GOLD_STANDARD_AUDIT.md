# RYD Gold Standard Audit — Full Send

## PHASE 1 — TRIAGE (ROOT CAUSES FOUND)

### 1) Code producing failures

| Failure | Location | Root cause |
|--------|----------|------------|
| "Tool registry failed to load" / "Registry load failed" | `tool-registry-loader.js`, `ryd-boot.js`, `tools.html` inline, `ryd-tools.hardened.js`, `ryd-tools.js` | Registry fetch fails (HTML instead of JSON, 404, or parse error); error is caught and shown in UI. |
| "Loading tools…" stall | `tools.html` (initial innerHTML), `ryd-tools.hardened.js` (renderLoading) | When registry never completes or script runs twice and second run fails. |
| "Identifier 'loader' has already been declared" | `tool-registry-loader.js` (when script runs twice) | Duplicate script execution; fixed earlier with run-once guard. |
| "Circular reference in tool" | `ryd-tools.hardened.js` lines 169, 181 | Circular ref detector warned and then set `rawTools = []`, dropping all tools. |
| SyntaxError "Unexpected token" | Not found in codebase | Usually from bad/cached JS or wrong MIME (e.g. HTML served as JS). |

### 2) Script includes (all HTML)

| Script | Included in | Duplicate? |
|--------|-------------|------------|
| **tool-registry-loader.js** | `public/tools.html` (head, once) | No. Run-once guard in file. |
| **ryd-tools.js** | `public/tools.html` head (line 20) **and** body (line 517) | **Yes — removed from body.** |
| **ryd-tools.hardened.js** | `public/tools.html` head only | No. |
| **ryd-bind.hardened.js** | tools.html, search.html, gates/*, tools/tool.html, tools/workthrough.html, insights.html, index.html, gates/index.html | Once per page each. |
| **analytics.js** | tools.html, index.html, insights.html, insights/*.html, tools/tool.html | Once per page. |
| **analytics-config.js** | index.html only | Once. |
| **analytics-config.local.js** | index.html with onerror (404 OK) | Once. |

---

## PHASE 2 — BOOT/LOAD ONCE (FIXES APPLIED)

### Duplicate removed

- **public/tools.html**: Removed second `<script src="/js/ryd-tools.js" defer></script>` from body (was line 517). Kept single load in head (line 20).

### Idempotent guards added

- **public/js/ryd-boot.js**: At top of IIFE, after `'use strict'`:
  - `if (typeof window !== 'undefined' && window.__RYD_BOOTED__) return;`
  - `window.__RYD_BOOTED__ = true;`
- **public/js/utils/tool-registry-loader.js**: Already had run-once guard (from previous fix): early return if `window.RYD_RegistryLoader` exists; attach to `window` only once.

---

## PHASE 3 — REGISTRY LOAD RELIABLY

### 4) Registry URL

- **public/js/utils/registry-url.js**: Uses root-relative paths only: `/data/tools-canonical.json`, `/data/tools.json`. No relative path bugs on `/tools` or `/insights`.

### 5) Registry file and MIME

- **public/data/tools-canonical.json** and **public/data/tools.json** exist.
- **server.cjs**: `/data` is served with `express.static` and `setHeaders` setting `Content-Type: application/json; charset=utf-8`. SPA fallback explicitly excludes `/data`, so JSON is never replaced by HTML.

### 6) Safe error handling

- **tools.html** inline `loadAndRenderTools`: try/catch calls `renderToolsErrorPanel(error, details)` and does not rethrow; `finally` shows error if loading never completed. Page does not crash.
- **ryd-tools.hardened.js** and **ryd-tools.js**: Listen for `ryd:error` and render error UI (Retry button); no uncaught throw.

---

## PHASE 4 — CIRCULAR REFS + VALIDATOR NON-BLOCKING

### 7) Circular reference fix

- **public/js/ryd-tools.hardened.js**:
  - Added **safeCloneTool(tool)**: clones tool and strips known backref keys (`parent`, `children`, `related`, `parentTool`, `childTools`, `_parent`, `_children`) and uses a WeakSet to avoid circular refs; max depth 15.
  - When **circular in tools array**: instead of `rawTools = []`, now `rawTools = rawTools.map(t => safeCloneTool(t)).filter(Boolean)`.
  - When **circular in single tool**: use `tool = safeCloneTool(tool)` and continue validation instead of returning `null`.

Result: Circular refs no longer drop all tools; tools are sanitized and rendering continues.

### 8) Validator non-blocking + tool-of-day

- Validator already non-blocking: `validateTool` returns `{ ok, errors }` and does not throw; invalid tools are skipped in DEV or hidden in PROD; page still renders.
- **public/js/utils/tool-content-validator.js** `filterToolsForToolOfDay`:
  - Excludes tools where `hasGenericContent(content)` is true.
  - Excludes tools with slug containing `standard-practice` and no description (placeholder).
  - Tool-of-day pool never includes generic/placeholder tools; 5/15/30 variants are real tools.

---

## PHASE 5 — ROUTING + NAV

- Nav is standard `<a href="/tools">`, `<a href="/insights">`, etc. No client-side redirect loops.
- **server.cjs** defines explicit routes: `/`, `/tools`, `/tools/:slug`, `/insights`, `/search`, `/gates`, `/store`, etc., so direct URL load works.
- **ryd-boot.js** runs once (`__RYD_BOOTED__`); no duplicate event binding from multiple boot runs.

---

## PHASE 6 — GA4

- **public/js/analytics.js**: Uses `window.RYD_ANALYTICS_INITIALIZED` to prevent duplicate GTM injection.
- Config: Server injects `window.ENV_CONFIG` and `window.RYD_ANALYTICS_CONFIG` into HTML; analytics does not depend on `/config` fetch for boot.
- **analytics-config.js** and **analytics-config.local.js** live under **public/js/config/**; served as JS. Local config is optional (onerror used in index.html).
- **server.cjs**: Added explicit `/config` static route with JSON MIME for `.json` files so config endpoints never return HTML.

---

## PHASE 7 — VERIFICATION CHECKLIST

| Check | How to verify |
|-------|----------------|
| **/ (home)** | Load `/`. No red errors in console. Tool-of-day or placeholder loads. |
| **/tools** | Load `/tools`. Console shows `[REGISTRY] loaded NNN tools from /data/...` (or fallback). Tool cards render. No "Identifier already declared", no "Tool registry failed" without error UI. |
| **/insights** | Load `/insights`. Page renders. No SyntaxError in console. |
| **Tool detail** | Open a tool card → View Full Tool. Detail page renders content. 5/15/30 variants (if present) are real tools, not generic placeholders. |
| **Console 0 red** | Hard refresh (Ctrl+Shift+R). All routes: Console has 0 red errors. Warnings (e.g. validation, tripwire) are acceptable. |
| **GA4 once** | In console: no 404 for analytics config; no "text/html is not executable" for JS. GTM loads once (RYD_ANALYTICS_INITIALIZED guard). |

---

## DIFFS SUMMARY

1. **public/tools.html**  
   - Removed duplicate `<script src="/js/ryd-tools.js" defer></script>` from body.

2. **public/js/ryd-boot.js**  
   - Added `if (window.__RYD_BOOTED__) return; window.__RYD_BOOTED__ = true;` at top of IIFE.

3. **public/js/utils/tool-content-validator.js**  
   - In `filterToolsForToolOfDay`, added filter excluding `hasGenericContent(content)` and placeholder `standard-practice` with no description.

4. **public/js/ryd-tools.hardened.js**  
   - Added `safeCloneTool(tool)` and use it when circular ref detected (array or single tool) instead of dropping tools or returning null.

5. **server.cjs**  
   - Added `/config` static route with JSON MIME for `.json` files.

---

## VERIFICATION NOTES PER ROUTE

- **/** — Boot runs once; RYD state ready; tool-of-day from filtered pool.
- **/tools** — One ryd-tools.js load; registry from root-relative URL; error UI on failure; no circular-ref wipeout.
- **/insights** — No tool-registry on this page; no SyntaxError from these fixes.
- **/tools/:slug** — Tool detail; content from slug; variants correct.
- **Console** — No duplicate loader declaration; no uncaught registry or circular ref errors.
