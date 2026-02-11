# 🔍 PRODUCTION INCIDENT MAP - PHASE 1 DISCOVERY

**Date:** 2026-02-07  
**Branch:** `fix/tools-registry-routing-content`  
**Status:** Discovery Complete (No Data Dumps)

---

## INCIDENT SUMMARY

**Symptoms:**
1. Homepage shows "No tools available yet"
2. Tool click routes back to homepage (redirect masking errors)
3. 5/15/30 minute tools show generic placeholder content

---

## PHASE 1 DISCOVERY RESULTS

### 1. Empty State Condition

**Location:** `public/js/ryd-tools.hardened.js:182`
```javascript
if (validatedTools.length === 0) {
  empty.textContent = 'No tools available yet.';
}
```

**Root Cause:** `validatedTools.length === 0` triggers when:
- Tools array is empty/null
- All tools fail validation
- Registry not loaded yet

**Condition:** `validatedTools.length === 0` after validation/sanitization

---

### 2. Registry Load Path

**Source of Truth:** `public/js/matrix-expander.js`

**Load Method:**
- **Primary:** `/data/tools-canonical.json` (line 164)
- **Fallback:** `/data/tools.json` (line 167)
- **Path Resolution:**
  - Browser: `fetch('/data/tools-canonical.json')`
  - Node: `public/data/tools-canonical.json` (via fs stream)

**Initialization:**
- `MatrixExpander.init()` called by `ryd-router.js:50`
- Tools extracted: `window.MatrixExpander.getBaseTools()`
- Tools passed to: `window.RYD.getTools()` or direct render

**Dev vs Prod:**
- Same paths (`/data/*.json`)
- Server must serve static files from `public/data/`
- Firebase Hosting SPA rewrites may swallow JSON files

---

### 3. Tool Detail Routing Behavior

**Router:** `public/js/ryd-router.js`

**Route Construction:**
- Tool URL: `/tools/tool.html?slug=${slug}` (line 69)
- Path Rewrite: Lines 20-32 redirect `/tools/:slug` → `/tools/tool.html?slug=:slug`

**Tool Not Found Behavior:**
- **Location:** `public/tools/tool.html:403`
- **Current:** Shows "Tool not found: ${slug}" message
- **Issue:** No redirect found, but tool lookup may fail silently

**Tool Lookup:**
- Uses `toolMap` built from `MatrixExpander.getBaseTools()`
- Key: `tool.slug || tool.id`
- If not found: Shows error message (line 403)

**Potential Redirect:**
- No explicit `window.location = '/'` found in tool.html
- May be in router or bind handlers

---

### 4. Fallback/Placeholder Injection Points

**Found Patterns:**

1. **Generic Description Fallback:**
   - `public/js/gates-renderer.hardened.js:589`
   - Pattern: `description || 'A practical tool for managing this challenge.'`

2. **Empty Tools Array:**
   - `public/js/ryd-tools.hardened.js:182`
   - Shows "No tools available yet" when array empty

3. **Content Generator (New):**
   - `public/js/utils/content-generator.js` exists but may not be used
   - Generic content still in walkthroughs

4. **Tool Description Extraction:**
   - `public/tools/tool.html:440`
   - Pattern: `tool.description || tool.summary || ''`
   - No fallback text, but may be empty

**Generic Content Sources:**
- Walkthroughs in `tools-canonical.json` contain generic steps
- "Take a moment to pause..." boilerplate
- "This practice supports emotional regulation..." generic summaries

---

## INCIDENT MAP SUMMARY

| Component | Location | Issue | Severity |
|-----------|----------|-------|----------|
| Empty State | `ryd-tools.hardened.js:182` | Shows when `validatedTools.length === 0` | HIGH |
| Registry Load | `matrix-expander.js:164` | May fail if file missing or SPA rewrite blocks | HIGH |
| Tool Routing | `ryd-router.js:69` | Route construction OK, lookup may fail | MEDIUM |
| Tool Not Found | `tool.html:403` | Shows message, no redirect (good) | LOW |
| Generic Content | `tools-canonical.json` | Walkthroughs contain boilerplate | HIGH |
| Fallback Logic | `gates-renderer.hardened.js:589` | Silent fallback to generic text | MEDIUM |

---

## NEXT PHASES

**Phase 2:** Fix registry loading (ensure files exist, handle SPA rewrites)  
**Phase 3:** Fix routing (no bounce, proper 404)  
**Phase 4:** Eliminate silent fallbacks  
**Phase 5:** Replace generic content with production-grade  
**Phase 6:** Add content integrity gate

---

**No proprietary content printed. Only file paths, line numbers, and patterns.**
