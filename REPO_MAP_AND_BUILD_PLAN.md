# RYD Repo Map & Build Plan

**Date:** February 1, 2026  
**Status:** Inspection Complete

---

## 1. REPO MAP

### Top-Level Directories

```
program-loader-seed/
├── public/              # Firebase Hosting root (production files)
├── sandbox/             # Development scripts (tool generation, filtering)
├── scripts/             # Utility scripts (audit, deploy, etc.)
├── docs/                # Documentation
├── logs/                # Log files
├── utils/                # Utility modules
├── _archive/            # Archived files (duplicates, old docs)
└── node_modules/        # Dependencies
```

### Key Configuration Files

**Hosting/Build:**
- `firebase.json` (2,995 bytes) → Firebase Hosting config
  - `public: "public"` (line 3)
  - `cleanUrls: true` (line 4)
  - Rewrites for `/tools/:slug`, `/gates/:gateId`, etc.
- `.firebaserc` → Project: `rideyourdemons`
- `package.json` (2,489 bytes) → Node scripts, no build tool
  - No `vite.config.*`, `next.config.*`, `webpack.config.*`
  - No build script defined
  - Type: `"module"` (ES modules)

**Entry Points:**
- `public/index.html` (20,796 bytes) → **Canonical homepage**
- `public/tools.html` → Tools directory
- `public/insights.html` → Insights page
- `public/tools/tool.html` → Tool detail page (uses pathname parsing)

**Routing:**
- `public/js/ryd-router.js` → Hash-based client-side router
- `public/index.html:314` → Router container: `<div id="routerContent">`
- `public/index.html:537` → Router script: `<script src="/js/ryd-router.js" defer>`

---

## 2. BUILD + DEPLOY FLOW

### Current Flow (Evidence-Based)

**No Build Step:**
- `package.json:7-39` → No `build`, `dev`, or `start:dev` scripts
- No build tool config files found
- Static files served directly from `public/`

**Deploy Process:**
1. Files in `public/` are production-ready
2. `firebase.json` configures hosting
3. Deploy command: `firebase deploy --only hosting`
4. Firebase serves `public/` as static site

**Evidence:**
- `firebase.json:3` → `"public": "public"`
- `firebase.json:10-54` → Rewrites handle routing
- No `dist/`, `build/`, or `out/` directories

---

## 3. NAVIGATION/ROUTING APPROACH

### Hybrid: Firebase Rewrites + Client-Side Hash Router

**Firebase Rewrites (Server-Side):**
- `firebase.json:36-38` → `/tools/:slug` → `/tools/tool.html`
- `firebase.json:28-30` → `/gates/:gateId` → `/gates/gate.html`
- `firebase.json:52-54` → Catch-all `**` → `/index.html`

**Client-Side Hash Router:**
- `public/js/ryd-router.js:707` → `window.addEventListener('hashchange', handleRoute)`
- `public/js/ryd-router.js:86-131` → `parseRoute(hash)` parses `#/?q=query`, `#/gate/:id`, `#/tool/:id`
- `public/index.html:473` → `window.RYD_ROUTER.navigate('#/?q=...')`

**Routing Flow:**
1. Search on homepage → Hash route: `#/?q=anxiety`
2. Router loads → Renders into `#routerContent` div
3. Click tool link → Full page navigation: `window.location.href = '/tools/{slug}'`
4. Firebase rewrite → Serves `/tools/tool.html` with slug from pathname

**Evidence:**
- `public/js/ryd-router.js:311` → `window.location.href = '/tools/${toolSlug}'`
- `public/tools/tool.html:79-81` → Parses slug from `window.location.pathname`

---

## 4. TOOLS CONTENT LOCATION & GENERATION

### Content Sources

**Primary Data Files:**
- `public/data/tools.json` (534 tools, version 3.0)
  - 8 base tools with full structure (walkthroughs, citations)
  - 526 filtered tools (minimal structure, placeholders)
- `public/store/tools.canonical.json` (2,259 tools)
  - Raw crawl from live site
- `public/store/tools.filtered.json` (526 tools)
  - Filtered ethical tools

**Supporting Data:**
- `public/data/gates.json` (12 gates)
- `public/data/pain-points.json` (475 pain points, 49 with tool mappings)
- `public/data/insights.json`

### Generation Pipeline

**Step 1: Crawl Live Site**
- Script: `sandbox/build-tools-from-live.cjs`
- Source: `https://rideyourdemons.com/sitemap.xml`
- Output: `public/store/tools.canonical.json` (2,259 tools)
- Method: HTTP fetch, HTML parsing, rate-limited

**Step 2: Filter Ethical Tools**
- Script: `sandbox/filter-ethical-tools.cjs`
- Input: `tools.canonical.json`
- Output: `public/store/tools.filtered.json` (526 tools)
- Criteria: "How do I..." titles, no clinical language, valid URLs

**Step 3: Merge into Base Tools**
- Script: `sandbox/add-filtered-tools-to-base.cjs`
- Input: `public/data/tools.json` (8 base) + `tools.filtered.json` (526)
- Output: `public/data/tools.json` (534 tools)
- Method: Deduplicates by ID, converts format, adds placeholders

**Step 4: Map Tools to Pain Points**
- Script: `sandbox/map-tools-to-pain-points.cjs`
- Input: `tools.json` + `pain-points.json`
- Output: `pain-points.json` with `"tools": [...]` arrays
- Current: 49/475 pain points have tools (10.3% coverage)

**Evidence:**
- `sandbox/build-tools-from-live.cjs:13-17` → Crawler config
- `sandbox/filter-ethical-tools.cjs:9-11` → Filter I/O paths
- `sandbox/add-filtered-tools-to-base.cjs:10-12` → Merge I/O paths
- `sandbox/map-tools-to-pain-points.cjs:9-11` → Mapping I/O paths

---

## 5. PROPOSED BUILD TASKS (Priority Order)

### Task 1: Add Firebase Emulator Script to package.json
**Why:** Enable local testing without deploying  
**Files:** `package.json`  
**Risk:** Low (add-only change)  
**Size:** S (1 line)

**Change:**
```json
// package.json:7
"scripts": {
  "dev": "firebase emulators:start --only hosting",
  // ... existing scripts
}
```

---

### Task 2: Fix Router Tool Navigation to Use Hash Routes
**Why:** Currently mixes hash router (search) with full page nav (tools). Inconsistent UX.  
**Files:** `public/js/ryd-router.js` (lines 311, 392, 640)  
**Risk:** Medium (routing behavior change)  
**Size:** M (3 locations, ~10 lines each)

**Current:**
```javascript
// ryd-router.js:311
window.location.href = `/tools/${toolSlug}`;
```

**Proposed:**
```javascript
// ryd-router.js:311
window.RYD_ROUTER.navigate(`#/tool/${toolSlug}`);
```

**Impact:** Tools render in `#routerContent` instead of full page reload.

---

### Task 3: Enhance Pain Point → Tool Mapping Coverage
**Why:** Only 10.3% of pain points have tools. Navigation feels incomplete.  
**Files:** `sandbox/map-tools-to-pain-points.cjs`, `public/data/pain-points.json`  
**Risk:** Low (data-only, additive)  
**Size:** M (script enhancement, ~50 lines)

**Enhancement:**
- Improve matching logic (semantic similarity, keyword matching)
- Map tools to pain points based on gateId + category inference
- Target: 30-40% coverage (150-200 pain points)

---

### Task 4: Add Tool Content Enrichment Script
**Why:** 526 filtered tools have placeholder descriptions. Need real content.  
**Files:** `sandbox/enrich-tool-content.cjs` (new), `public/data/tools.json`  
**Risk:** Medium (content quality, truth-locked requirement)  
**Size:** L (new script, ~200 lines)

**Approach:**
- Fetch full HTML from live site URLs (from `tools.filtered.json`)
- Extract: description, howWhyWorks, citations, methodology
- Merge into `tools.json` (preserve base tools, enhance filtered)
- Truth-only: Only extract, never invent

---

### Task 5: Add Build Validation Script
**Why:** Ensure data integrity before deploy (no broken links, missing tools, invalid JSON).  
**Files:** `sandbox/validate-build.cjs` (new), `package.json`  
**Risk:** Low (validation only, no changes)  
**Size:** M (new script, ~150 lines)

**Checks:**
- All tool slugs are valid
- All pain point tool references exist
- All gate IDs referenced in tools exist
- JSON files are valid
- No broken internal links
- Router container exists in HTML

**Add to package.json:**
```json
"validate": "node sandbox/validate-build.cjs"
```

---

## SUMMARY

**Stack:** Firebase Hosting (static), no build tool  
**Entry:** `public/index.html`  
**Routing:** Hybrid (Firebase rewrites + hash router)  
**Content:** JSON files, generated via Node scripts in `sandbox/`  
**Status:** Functional, needs enhancement (tool mappings, content enrichment)

**Next Steps:** Execute tasks 1-5 in priority order.

