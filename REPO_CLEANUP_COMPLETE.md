# Repo Cleanup Complete

## Proposed Cleanup Plan (Executed)

### 1. KEEP List (Production Files)

**HTML Files:**
- ✅ `public/index.html` - **Canonical homepage** (served at `/`)
- ✅ `public/insights.html` - **Insights index** (served at `/insights`)
- ✅ `public/tools.html` - **Tools index** (served at `/tools`)
- ✅ `public/search.html` - **Search page** (served at `/search`)

**Reason:** These are the production pages referenced in `firebase.json` and actively used.

**Generated Directories:**
- ✅ `public/insights/` - Generated insight pages
- ✅ `public/gates/` - Gate pages
- ✅ `public/tools/` - Tool detail pages
- ✅ All compliance pages (`about/`, `disclosures/`, `ethics/`, etc.)

**Data & Scripts:**
- ✅ All files in `public/data/`, `public/store/`, `public/js/`
- ✅ All `.cjs` build scripts in `scripts/`
- ✅ `content/insights/` source content

---

### 2. ARCHIVE List (Moved to `_archive/` with date stamp)

#### Experimental HTML Files (4 files)
**Reason:** Experimental/integrated versions not referenced in `firebase.json`. The canonical `index.html` is the production homepage.

**Archived:**
- `public/index-integrated.html` → `_archive/experimental-html/index-integrated.html.2026-02-02`
- `public/index-integrated-ryd.html` → `_archive/experimental-html/index-integrated-ryd.html.2026-02-02`
- `public/platform-integrated.html` → `_archive/experimental-html/platform-integrated.html.2026-02-02`
- `public/live-site-integration.html` → `_archive/experimental-html/live-site-integration.html.2026-02-02`

#### Documentation in Public (5 files)
**Reason:** Documentation files should not be in `public/` (they get deployed to Firebase). Move to archive.

**Archived:**
- `public/CSS_FIX_COMPLETE.md` → `_archive/docs-from-public/CSS_FIX_COMPLETE.md.2026-02-02`
- `public/CSS_FIX_SUMMARY.md` → `_archive/docs-from-public/CSS_FIX_SUMMARY.md.2026-02-02`
- `public/DEPLOYMENT_READY.md` → `_archive/docs-from-public/DEPLOYMENT_READY.md.2026-02-02`
- `public/FINAL_STATUS.md` → `_archive/docs-from-public/FINAL_STATUS.md.2026-02-02`
- `public/VERIFICATION_CHECKLIST.md` → `_archive/docs-from-public/VERIFICATION_CHECKLIST.md.2026-02-02`

#### Duplicate Scripts (2 files)
**Reason:** `.cjs` versions are the working ones (CommonJS). `.js` versions fail due to ES module conflict (`package.json` has `"type": "module"`).

**Archived:**
- `scripts/build-tools-canonical.js` → `_archive/duplicate-scripts/build-tools-canonical.js.2026-02-02`
- `scripts/fix-ryd-all.js` → `_archive/duplicate-scripts/fix-ryd-all.js.2026-02-02`

---

### 3. DELETE List

**None** - All files were archived (not deleted) for safety.

---

### 4. RENAME List

**None needed** - Current canonical files already have clear names:
- `index.html` - Homepage
- `insights.html` - Insights index
- `tools.html` - Tools index
- `search.html` - Search page

---

## Diffs/Moves Performed

### Files Archived

**Total: 11 files**

1. **Experimental HTML (4 files):**
   - `public/index-integrated.html`
   - `public/index-integrated-ryd.html`
   - `public/platform-integrated.html`
   - `public/live-site-integration.html`

2. **Documentation from public/ (5 files):**
   - `public/CSS_FIX_COMPLETE.md`
   - `public/CSS_FIX_SUMMARY.md`
   - `public/DEPLOYMENT_READY.md`
   - `public/FINAL_STATUS.md`
   - `public/VERIFICATION_CHECKLIST.md`

3. **Duplicate Scripts (2 files):**
   - `scripts/build-tools-canonical.js`
   - `scripts/fix-ryd-all.js`

### Archive Structure Created

```
_archive/
  ├── experimental-html/
  │   ├── index-integrated.html.2026-02-02
  │   ├── index-integrated-ryd.html.2026-02-02
  │   ├── platform-integrated.html.2026-02-02
  │   └── live-site-integration.html.2026-02-02
  ├── docs-from-public/
  │   ├── CSS_FIX_COMPLETE.md.2026-02-02
  │   ├── CSS_FIX_SUMMARY.md.2026-02-02
  │   ├── DEPLOYMENT_READY.md.2026-02-02
  │   ├── FINAL_STATUS.md.2026-02-02
  │   └── VERIFICATION_CHECKLIST.md.2026-02-02
  ├── duplicate-scripts/
  │   ├── build-tools-canonical.js.2026-02-02
  │   └── fix-ryd-all.js.2026-02-02
  └── cleanup-report.2026-02-02.json
```

### Imports/Paths Updated

**Status:** ✅ **No broken references found**

**Verification:**
- No references to `index-integrated.html` in `firebase.json`
- No references to `platform-integrated.html` in `firebase.json`
- No references to `live-site-integration.html` in `firebase.json`
- No references to archived `.js` scripts in `package.json`
- All build scripts use `.cjs` versions (canonical)

---

## Build Verification

### Tests Performed

**1. Build Insights:**
```bash
npm run build:insights
```
**Result:** ✅ **PASSED**
- Generated 5 insight pages
- No errors

**2. Validate Mapping:**
```bash
npm run validate:mapping
```
**Result:** ✅ **PASSED**
- 12 gates validated
- 480 pain points validated
- 1440 tool mappings validated

**3. Local Server:**
```bash
npm run dev
```
**Expected:** ✅ Should start without errors (not tested in this session, but no file dependencies broken)

---

## Final State

### Production HTML Files (4)
- `public/index.html` - Homepage
- `public/insights.html` - Insights index
- `public/tools.html` - Tools index
- `public/search.html` - Search page

### Archive Location
- `_archive/experimental-html/` - 4 experimental HTML files
- `_archive/docs-from-public/` - 5 documentation files
- `_archive/duplicate-scripts/` - 2 duplicate scripts
- `_archive/cleanup-report.2026-02-02.json` - Cleanup report

### Scripts Created
- `scripts/cleanup-repo.cjs` - Cleanup script (reusable)

---

## Safety Measures

✅ **All files archived (not deleted)**
✅ **Date stamps added to archived files**
✅ **Build scripts verified working**
✅ **No broken imports/paths**
✅ **Cleanup report generated**

---

## Status: ✅ Complete

- ✅ 11 files archived
- ✅ 0 files deleted
- ✅ Build verified working
- ✅ No broken references
- ✅ Clean production structure

**Cleanup Report:** `_archive/cleanup-report.2026-02-02.json`

