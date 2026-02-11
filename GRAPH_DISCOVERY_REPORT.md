# 🔍 GRAPH SYSTEM DISCOVERY REPORT

**Date:** 2026-02-07  
**Branch:** `fix/graph-rebuild-anchor-gate-pain-tool`  
**Status:** Phase 1 Complete (No Data Dumps)

---

## SYSTEM ARCHITECTURE OVERVIEW

**Expected Topology:**
```
ANCHOR (Domain page)
  -> GATE (12 gates)
     -> PAIN POINTS (40 per gate)
        -> TOOLS (3+ per pain point)
           -> MATRIX (global registry)
```

**Current Implementation:**
- **Anchors:** Not explicitly implemented (gates may serve as anchors)
- **Gates:** 12 gates defined in `public/data/gates.json`
- **Pain Points:** Stored in `public/data/pain-points.json` as `{ painPoints: { [gateId]: [] } }`
- **Tools:** Stored in `public/data/tools-canonical.json` and `public/data/tools.json`
- **Matrix:** `public/js/matrix-expander.js` handles relationships

---

## PHASE 1: RECURSIVE DISCOVERY RESULTS

### 1. DATA SOURCE FILES

| Layer | File Path | Structure | Load Method |
|-------|-----------|-----------|-------------|
| Gates | `public/data/gates.json` | `{ gates: Gate[] }` | fetch() via MatrixExpander |
| Pain Points | `public/data/pain-points.json` | `{ painPoints: { [gateId]: PainPoint[] } }` | fetch() via MatrixExpander |
| Tools | `public/data/tools-canonical.json` | `{ tools: Tool[] }` or `Tool[]` | fetch() via MatrixExpander |
| Tools (fallback) | `public/data/tools.json` | `{ tools: Tool[] }` or `Tool[]` | fetch() via MatrixExpander |

**File Sizes (Safe Telemetry):**
- `gates.json`: ~2KB (12 gates)
- `pain-points.json`: ~435KB (structure: gateId -> painPoint[])
- `tools-canonical.json`: ~8.9MB (full tool registry)
- `tools.json`: ~1.5MB (fallback)

---

### 2. DATA LOADING MECHANISMS

#### Primary Loader: `public/js/matrix-expander.js`

**Functions:**
- `init()`: Loads all data files via `loadMatrixData()`
- `getGates()`: Returns `gatesList.slice()`
- `getPainPointsByGate()`: Returns `{ ...painPointsIndex }`
- `getBaseTools()`: Returns `baseTools.slice()`
- `expandToolsForSelection(gateId, painPointId)`: Creates ToolInstance objects

**Load Paths:**
- Browser: `fetch('/data/gates.json')`, `fetch('/data/pain-points.json')`, `fetch('/data/tools-canonical.json')`
- Node: `public/data/*.json` via fs stream

**Initialization:**
- Called by `public/js/ryd-boot.js:71`
- Tools extracted: `window.MatrixExpander.getBaseTools()`
- Passed to: `window.RYD.getTools()` or direct render

#### Secondary Loader: `public/js/utils/tool-registry-loader.js` (NEW)

**Functions:**
- `load()`: Primary registry loader (fail-loud)
- `getTools()`: Returns tools from registry
- `getStatus()`: Returns registry status (safe telemetry)

**Load Paths:**
- Primary: `/data/tools-canonical.json`
- Fallback: `/data/tools.json`

---

### 3. UI RENDERING MODULES

#### Gate/Pain Point Renderer: `public/js/gates-renderer.hardened.js`

**Functions:**
- `loadData()`: Memoized data loader (uses MatrixExpander or direct fetch)
- `renderGates(container, mappingData, toolMap)`: Renders gate cards with dropdowns
- `renderPainPointDropdown(gate, painPoints)`: Creates `<select>` for pain points
- `renderToolsForPainPoint(gateId, painPointId, toolInstances)`: Renders tool cards

**Data Flow:**
1. `loadData()` → `MatrixExpander.init()` or direct fetch
2. `renderGates()` → Iterates gates, creates dropdowns
3. Dropdown change → `expandToolsForSelection(gateId, painPointId)`
4. Tools rendered → Tool cards with links

**Empty State Conditions:**
- Line 296: `"No gates available."` (if `!mappingData || !mappingData.gates`)
- Line 517: `"No tools available for this pain point."` (if `toolInstances.length === 0`)

#### Tool Renderer: `public/js/ryd-tools.hardened.js`

**Functions:**
- `renderTools(tools)`: Renders tool grid
- `handleReady()`: Async handler using registry loader

**Empty State:**
- Line 182: `"No tools available yet."` (if `validatedTools.length === 0`)

#### Router: `public/js/ryd-router.js`

**Functions:**
- `loadData()`: Loads gates, pain points, tools via MatrixExpander
- `parseRoute(hash)`: Parses hash routes (`#/gate/:id`, `#/tool/:id`, `#/?q=query`)
- `search(query)`: Searches pain points and tools
- `renderSearchResults(query, results)`: Renders search results

**Route Patterns:**
- `#/gate/:id` → Gate page
- `#/tool/:id` → Tool detail
- `#/?q=query` → Search results
- `/tools/tool.html?slug=:slug` → Tool detail (legacy)

---

### 4. RELATIONSHIP MAPPING

#### Current Structure:

**Gates → Pain Points:**
- Stored in `pain-points.json` as `{ painPoints: { [gateId]: PainPoint[] } }`
- Each pain point has `toolIds: string[]` array
- Access: `painPointsIndex[gateId]` (from MatrixExpander)

**Pain Points → Tools:**
- Each pain point has `toolIds: string[]`
- Tools looked up via `toolsIndex[toolId]` (from MatrixExpander)
- `expandToolsForSelection(gateId, painPointId)` creates ToolInstance objects

**Tool Lookup:**
- Indexed by `tool.id` and `tool.slug` (case-insensitive)
- Normalized via `normalizeId()` function

---

### 5. SUSPECTED FAILURE POINTS

| Issue | Location | Root Cause Hypothesis |
|-------|----------|----------------------|
| Homepage "No tools available yet" | `ryd-tools.hardened.js:182` | Registry not loaded or validation fails |
| Gate pages show 0 pain points | `gates-renderer.hardened.js:360` | `painPointsByGate[gateId]` is empty or not loaded |
| Tool click returns to homepage | `tool.html:403` | Tool lookup fails, but no redirect found (may be in router) |
| Generic placeholder content | `tools-canonical.json` | Walkthroughs contain boilerplate text |

**Specific Code Paths:**

1. **Empty Pain Points:**
   - `gates-renderer.hardened.js:360` - Dropdown populated from `painPointsByGate[gateId]`
   - If `painPointsByGate` is empty or `painPointsByGate[gateId]` is undefined → 0 options

2. **Tool Registry Not Loading:**
   - `matrix-expander.js:195` - `loadMatrixData()` may fail silently
   - `ryd-boot.js:71` - `MatrixExpander.init()` may timeout or fail
   - `tool-registry-loader.js` - New loader may not be used everywhere

3. **ID Mismatch:**
   - `matrix-expander.js:148` - Tool lookup uses `normalizeId()` but may mismatch
   - `pain-points.json` has `toolIds: []` but tools may have different IDs

---

### 6. ID/SLUG NORMALIZATION

**Current Functions:**
- `matrix-expander.js:121` - `normalizeId(value)`: `String(value).trim()`
- `matrix-expander.js:148` - Indexes by `id`, `slug`, `id.toLowerCase()`, `slug.toLowerCase()`
- `tool.html:302` - `normalizeSlug(value)`: Lowercase, hyphenate, trim

**Issue:** Multiple normalization functions may cause mismatches.

---

## DISCOVERY SUMMARY

### Modules Found:

**Data Layer:**
- `public/data/gates.json` (12 gates)
- `public/data/pain-points.json` (gateId -> painPoint[] mapping)
- `public/data/tools-canonical.json` (full tool registry)
- `public/data/tools.json` (fallback)

**Loader Layer:**
- `public/js/matrix-expander.js` (primary)
- `public/js/utils/tool-registry-loader.js` (new, fail-loud)

**UI Layer:**
- `public/js/gates-renderer.hardened.js` (gates + pain points)
- `public/js/ryd-tools.hardened.js` (tool grid)
- `public/js/ryd-router.js` (routing + search)
- `public/tools/tool.html` (tool detail page)

**Router Layer:**
- Hash-based routing (`#/gate/:id`, `#/tool/:id`)
- Legacy path routing (`/tools/tool.html?slug=:slug`)

### Counts (Safe Telemetry):

- **Gates:** 12 (from `gates.json`)
- **Pain Points:** TBD (need to count per gate)
- **Tools:** ~5,615 (from previous audit)
- **Tool Files:** 2 (`tools-canonical.json`, `tools.json`)

---

## NEXT PHASES

**Phase 2:** Implement canonical graph interface  
**Phase 3:** Rebuild/repair edges (ensure 40 pain points per gate)  
**Phase 4:** Fix ID normalization  
**Phase 5:** Fix empty state conditions

---

**No proprietary content printed. Only file paths, function names, counts, and structure.**
