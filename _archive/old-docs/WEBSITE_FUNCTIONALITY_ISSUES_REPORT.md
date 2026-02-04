# Website Functionality Issues Report

**Date:** 2025-12-26  
**Scope:** Complete codebase audit for functionality issues

## 🔴 Critical Issues (Will Break Functionality)

### 1. Missing CSS Classes for Badge Elements
**Location:** `platform-integrated.html` (root directory)  
**Issue:** The file references `.badge`, `.badge-beginner`, and `.badge-intermediate` CSS classes but they are NOT defined in the stylesheet.

**Impact:**
- Badge elements will not display correctly
- Tool difficulty indicators will be unstyled
- Visual inconsistency in tool cards

**References:**
- Line 706: `<span class="badge badge-beginner" id="toolDifficulty">`
- Line 842: `difficultyEl.className = `badge badge-${tool.difficulty}`;`
- Line 922: `<span class="badge badge-${tool.difficulty}">`

**Fix Required:** Add badge CSS classes to the root `platform-integrated.html` file. The classes are correctly defined in `sandbox-preview/platform-integrated.html` (lines 310-328) and should be copied.

### 2. Missing Firebase Configuration File
**Location:** `config/firebase-config.json`  
**Issue:** The file `config/firebase-config.json` does not exist, only `firebase-config.json.example` exists.

**Impact:**
- Firebase backend initialization will fail if scripts try to load this file
- Firebase-related features may not work
- Scripts that reference this file will error

**Files Affected:**
- `scripts/firebase-local-noninteractive.js` (line 46)
- `scripts/rotate-api-keys.js` (line 193)

**Fix Required:** 
- Either create `config/firebase-config.json` from the example file
- Or ensure all scripts handle the missing file gracefully (they appear to have fallbacks)

**Note:** The `firebase-backend.js` core module appears to handle missing config gracefully by requiring credentials via session, so this may not break core functionality.

## ⚠️ Potential Issues (May Affect Functionality)

### 3. Duplicate `platform-integrated.html` Files
**Location:** 
- `program-loader-seed/platform-integrated.html` (root)
- `program-loader-seed/sandbox-preview/platform-integrated.html`

**Issue:** Two versions of the same file exist with different content.

**Impact:**
- Confusion about which file is the "source of truth"
- Firebase hosting configuration points to `sandbox-preview/platform-integrated.html` (correct)
- Root file may be outdated or incomplete (missing badge CSS - now fixed)

**Status:** ✅ **RESOLVED**
- **Authoritative file:** `sandbox-preview/platform-integrated.html` is the source of truth
- Firebase hosting correctly uses `sandbox-preview/` directory
- Root file has been updated with missing badge CSS classes
- Root file may be kept as a backup or removed if not needed

**Recommendation:** 
- Keep root file as backup (now synchronized with badge CSS)
- Or remove root file to avoid confusion
- All deployments should use `sandbox-preview/platform-integrated.html`

### 4. Hardcoded User Paths in Server Files
**Location:** Multiple server files in `sandbox-preview/`

**Issue:** Hardcoded Windows user paths that may not exist on other systems:
- `server-live-preview.js`: `C:\\Users\\Earl Taylor\\Documents\\Site`
- `server-all-engines.js`: Similar hardcoded path
- `server-integrated-ryd.js`: Similar hardcoded path

**Impact:**
- Scripts will fail on systems with different user names
- Not portable across different development environments
- May cause errors when trying to access RYD site files

**Files Affected:**
- `sandbox-preview/server-live-preview.js` (line 20)
- `sandbox-preview/server-all-engines.js` (line 59)
- `sandbox-preview/server-integrated-ryd.js` (line 26)

**Fix Required:** Use environment variables or configuration files instead of hardcoded paths.

### 5. Missing `.env` File
**Location:** Root directory  
**Issue:** No `.env` file exists, but the codebase uses `dotenv` and references environment variables.

**Impact:**
- Environment-specific configuration may not load
- Default values will be used (which may be acceptable)
- Compliance middleware settings may not be configurable

**Files Using Environment Variables:**
- `core/compliance-middleware.js` (lines 18-21)
- `scripts/boot.js` (line 18: `dotenv.config()`)

**Fix Required:** 
- Create `.env` file with necessary variables, OR
- Document that environment variables are optional and defaults are used

## 📋 Minor Issues (Cosmetic/Non-Critical)

### 6. Example Component Files Not Used
**Location:** `components/` directory  
**Issue:** All component files have `.example` extension and are not actively used:
- `CitationBadge.jsx.example`
- `CitationBadge.css.example`
- `PainPointPage.jsx.example`
- `SearchBar.jsx.example`
- `TourOverlay.jsx.example`
- `TourOverlay.css.example`

**Impact:** None - these appear to be templates/reference files.

**Fix Required:** None - these are likely intentional examples.

### 7. Firebase Debug Log File Present
**Location:** `firebase-debug.log`  
**Issue:** Debug log file is present in repository (should typically be in `.gitignore`).

**Impact:** None functionally, but may clutter repository.

**Fix Required:** Add to `.gitignore` if not already present.

## ✅ What's Working Correctly

1. **Core Module Imports:** All core modules have proper ES6 import statements
2. **Configuration Files:** `app.config.json` and `programs.config.json` are valid JSON
3. **Firebase Hosting Config:** `firebase.json` correctly points to `sandbox-preview` directory
4. **Package Dependencies:** All required dependencies are listed in `package.json`
5. **Server Files:** Sandbox preview servers are properly structured
6. **Badge CSS in Sandbox:** The `sandbox-preview/platform-integrated.html` has correct badge CSS definitions

## 🔧 Recommended Fixes Priority

### High Priority (Fix Immediately)
1. ✅ **Add missing badge CSS classes** to root `platform-integrated.html` - **FIXED**
2. ✅ **Resolve duplicate `platform-integrated.html` files** - **RESOLVED** (documented authoritative file)

### Medium Priority (Fix Soon)
3. ✅ **Replace hardcoded paths** with environment variables or config - **FIXED**
4. ✅ **Create `.env` file** or document that it's optional - **FIXED** (created `env.example`)

### Low Priority (Nice to Have)
5. Clean up example files or document their purpose
6. Add `firebase-debug.log` to `.gitignore`

## ✅ Fixes Applied

1. **Badge CSS Classes** - Added missing `.badge`, `.badge-beginner`, `.badge-intermediate`, and `.badge-advanced` CSS classes to root `platform-integrated.html`

2. **Hardcoded Paths** - Replaced hardcoded user paths in:
   - `sandbox-preview/server-live-preview.js`
   - `sandbox-preview/server-all-engines.js`
   - `sandbox-preview/server-integrated-ryd.js`
   - `scripts/integrate-platform-overlay.js`
   
   All now use `process.env.RYD_SITE_PATH` environment variable with fallbacks.

3. **Environment Configuration** - Created `env.example` file with:
   - RYD_SITE_PATH configuration
   - Compliance settings
   - Firebase configuration options
   - Logging level settings

4. **Firebase Config** - Documented as optional. Scripts handle missing config gracefully with fallbacks.

5. **Duplicate HTML Files** - Documented that `sandbox-preview/platform-integrated.html` is the authoritative version. Root file has been synchronized with badge CSS fixes.

## 📝 Notes

- The codebase appears to be well-structured overall
- Most issues are configuration-related rather than code bugs
- The badge CSS issue is the most critical as it directly affects visual functionality
- Firebase configuration appears to have graceful fallbacks, so missing config file may not break core functionality
- The duplicate HTML files suggest the root file may be outdated - the sandbox-preview version appears more complete

## 🎯 Testing Recommendations

1. Test badge display in root `platform-integrated.html` after adding CSS
2. Test Firebase features to confirm missing config file doesn't break functionality
3. Test server scripts on a system with different user path
4. Verify which `platform-integrated.html` file is actually being served by Firebase hosting

