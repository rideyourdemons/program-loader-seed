# Repo Cleanup Plan

## Analysis Summary

### Current State
- **8 HTML files** in `public/` root (3 are experimental/integrated versions)
- **68 scripts** in `scripts/` directory
- **Duplicate scripts** (`.js` and `.cjs` versions)
- **Documentation files** in `public/` (should not be deployed)
- **Experimental HTML files** not referenced in `firebase.json`

---

## Cleanup Plan

### 1. KEEP (Production Files)

**HTML Files:**
- `public/index.html` - **Canonical homepage** (served at `/`)
- `public/insights.html` - **Insights index** (served at `/insights`)
- `public/tools.html` - **Tools index** (served at `/tools`)
- `public/search.html` - **Search page** (served at `/search`)

**Generated Directories:**
- `public/insights/` - Generated insight pages
- `public/gates/` - Gate pages
- `public/tools/` - Tool detail pages
- `public/about/`, `public/disclosures/`, `public/ethics/`, `public/analytics/`, `public/terms/`, `public/store/` - Compliance pages

**Data Files:**
- `public/data/` - All JSON data files
- `public/store/tools.canonical.json` - Canonical tools
- `public/store/tools.filtered.json` - Filtered tools

**Scripts:**
- `scripts/build-*.cjs` - Build scripts (canonical)
- `scripts/validate-*.cjs` - Validation scripts
- `scripts/generate-*.cjs` - Generation scripts
- `scripts/fix-*.cjs` - Fix scripts (canonical)

**Content:**
- `content/insights/` - Source content for insights

---

### 2. ARCHIVE (Move to `_archive/` with date stamp)

**Experimental HTML Files:**
- `public/index-integrated.html` → `_archive/experimental-html/index-integrated.html.2026-02-02`
- `public/index-integrated-ryd.html` → `_archive/experimental-html/index-integrated-ryd.html.2026-02-02`
- `public/platform-integrated.html` → `_archive/experimental-html/platform-integrated.html.2026-02-02`
- `public/live-site-integration.html` → `_archive/experimental-html/live-site-integration.html.2026-02-02`

**Reason:** These are experimental/integrated versions not referenced in `firebase.json`. The canonical `index.html` is the production homepage.

**Documentation in Public:**
- `public/CSS_FIX_COMPLETE.md` → `_archive/docs/CSS_FIX_COMPLETE.md.2026-02-02`
- `public/CSS_FIX_SUMMARY.md` → `_archive/docs/CSS_FIX_SUMMARY.md.2026-02-02`
- `public/DEPLOYMENT_READY.md` → `_archive/docs/DEPLOYMENT_READY.md.2026-02-02`
- `public/FINAL_STATUS.md` → `_archive/docs/FINAL_STATUS.md.2026-02-02`
- `public/VERIFICATION_CHECKLIST.md` → `_archive/docs/VERIFICATION_CHECKLIST.md.2026-02-02`

**Reason:** Documentation files should not be in `public/` (they get deployed). Move to archive.

**Duplicate Scripts (Non-Canonical):**
- `scripts/build-tools-canonical.js` → `_archive/scripts/build-tools-canonical.js.2026-02-02` (`.cjs` is canonical)
- `scripts/fix-ryd-all.js` → `_archive/scripts/fix-ryd-all.js.2026-02-02` (`.cjs` is canonical)

**Reason:** `.cjs` versions are the working ones (CommonJS). `.js` versions fail due to ES module conflict.

**Sandbox Duplicates:**
- `sandbox/` directory contains many duplicate scripts from `scripts/`
- Move entire `sandbox/` to `_archive/sandbox-duplicates.2026-02-02/` (keep only essential build scripts)

**Reason:** `sandbox/` appears to be a duplicate of `scripts/` with experimental versions. Keep only essential build scripts in `scripts/`.

---

### 3. DELETE (Only if Clearly Safe)

**None at this time** - All files will be archived first for safety.

---

### 4. RENAME (Clear Canonical Names)

**No renames needed** - Current canonical files already have clear names:
- `index.html` - Homepage
- `insights.html` - Insights index
- `tools.html` - Tools index
- `search.html` - Search page

---

## Execution Order

1. Create archive directories
2. Archive experimental HTML files
3. Archive documentation from public/
4. Archive duplicate scripts
5. Verify build still works
6. Update any imports/paths if needed

---

## Safety Checks

- ✅ All files moved (not deleted)
- ✅ Date stamps added to archived files
- ✅ Build scripts tested after cleanup
- ✅ Firebase hosting verified
- ✅ No broken imports

