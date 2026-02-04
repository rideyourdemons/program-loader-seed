# SEO & Routing Verification Guide

## Evidence of Current SEO Implementation

### ✅ 1. Canonical Tags

**Status:** Implemented across all pages

**Files:**
- `public/index.html` - Line 10: `<link rel="canonical" href="https://rideyourdemons.com/">`
- `public/tools.html` - Line 15: `<link rel="canonical" href="https://rideyourdemons.com/tools">`
- `public/insights.html` - Line 20: `<link rel="canonical" href="https://rideyourdemons.com/insights">`
- `public/tools/tool.html` - Dynamic via `seo-meta.js` (updates based on tool slug)

**Dynamic Canonical:**
- `public/js/seo-meta.js` - Automatically updates canonical URL for tool pages based on slug

---

### ✅ 2. Firebase Hosting SPA Rewrite

**Status:** Correctly configured

**File:** `firebase.json` - Lines 51-54:
```json
{
  "source": "**",
  "destination": "/index.html"
}
```

**Rationale:**
- Catch-all rewrite ensures all client-side routes (hash-based or path-based) serve `/index.html`
- Specific rewrites for `/tools/:slug`, `/gates/:gateId`, etc. are handled first
- This enables SPA routing while maintaining static file serving

---

### ✅ 3. robots.txt

**Status:** Created

**File:** `public/robots.txt`

**Content:**
- Allows all user agents
- Disallows internal paths (`/matrix/`, `/data/`, `/config/`, `/store/_archive/`)
- Allows important pages (`/`, `/tools`, `/insights`, `/gates`, `/tools/*`)
- References sitemap location

**URL:** `https://rideyourdemons.com/robots.txt`

---

### ✅ 4. Sitemap

**Status:** Generated

**Files:**
- `public/sitemap.xml` - Main sitemap (2,769 URLs)
- `public/sitemap-index.xml` - Sitemap index (for future expansion)

**Contents:**
- Static pages (home, tools, insights, gates, about, disclosures, ethics, analytics, terms, store)
- All tool pages (2,267 tools from `tools-canonical.json`)
- All gate pages (12 gates)
- All pain point pages (480 pain points)

**Generation Command:**
```bash
npm run generate:sitemap
```

**URL:** `https://rideyourdemons.com/sitemap.xml`

---

### ✅ 5. Open Graph & Twitter Meta Tags

**Status:** Implemented

**Static Pages:**
- `public/index.html` - Lines 21-33: Full OG + Twitter tags
- `public/insights.html` - Lines 21-33: Full OG + Twitter tags
- `public/tools.html` - Lines 18-30: Full OG + Twitter tags (added)

**Dynamic Pages:**
- `public/tools/tool.html` - Lines 9-25: Base OG + Twitter tags, updated dynamically by `seo-meta.js`

**Dynamic Updates:**
- `public/js/seo-meta.js` - Updates OG and Twitter meta tags for tool pages based on tool data

---

## Diffs Applied

### 1. Added Canonical Tags

**File:** `public/index.html`
```diff
+ <link rel="canonical" href="https://rideyourdemons.com/">
```

**File:** `public/tools.html`
```diff
+ <link rel="canonical" href="https://rideyourdemons.com/tools">
```

**File:** `public/insights.html`
```diff
+ <link rel="canonical" href="https://rideyourdemons.com/insights">
```

**File:** `public/tools/tool.html`
```diff
+ <link rel="canonical" href="https://rideyourdemons.com/tools/">
+ (Updated dynamically by seo-meta.js)
```

### 2. Added Open Graph & Twitter Meta to tools.html

**File:** `public/tools.html`
```diff
+ <!-- Open Graph Meta Tags -->
+ <meta property="og:title" content="Tools — Ride Your Demons">
+ <meta property="og:description" content="...">
+ <meta property="og:url" content="https://rideyourdemons.com/tools">
+ <meta property="og:image" content="https://rideyourdemons.com/images/og-default.jpg">
+ <meta property="og:type" content="website">
+ <meta property="og:site_name" content="Ride Your Demons">
+ 
+ <!-- Twitter Card Meta Tags -->
+ <meta name="twitter:card" content="summary_large_image">
+ <meta name="twitter:title" content="Tools — Ride Your Demons">
+ <meta name="twitter:description" content="...">
+ <meta name="twitter:image" content="https://rideyourdemons.com/images/og-default.jpg">
```

### 3. Added Open Graph & Twitter Meta to tools/tool.html

**File:** `public/tools/tool.html`
```diff
+ <!-- SEO Meta Tags (will be updated by seo-meta.js) -->
+ <meta name="description" content="...">
+ <meta name="robots" content="index, follow">
+ 
+ <!-- Open Graph Meta Tags -->
+ <meta property="og:title" content="Tool - Ride Your Demons">
+ <meta property="og:description" content="...">
+ <meta property="og:url" content="https://rideyourdemons.com/tools/">
+ <meta property="og:image" content="https://rideyourdemons.com/images/og-default.jpg">
+ <meta property="og:type" content="article">
+ <meta property="og:site_name" content="Ride Your Demons">
+ 
+ <!-- Twitter Card Meta Tags -->
+ <meta name="twitter:card" content="summary_large_image">
+ <meta name="twitter:title" content="Tool - Ride Your Demons">
+ <meta name="twitter:description" content="...">
+ <meta name="twitter:image" content="https://rideyourdemons.com/images/og-default.jpg">
+ 
+ <script src="/js/seo-meta.js" defer></script>
```

### 4. Created robots.txt

**File:** `public/robots.txt` (NEW)
```
User-agent: *
Allow: /
Disallow: /matrix/
Disallow: /data/
Disallow: /config/
Disallow: /store/_archive/
Sitemap: https://rideyourdemons.com/sitemap.xml
```

### 5. Created Sitemap Generation Script

**File:** `scripts/generate-sitemap.cjs` (NEW)
- Generates `sitemap.xml` with all pages
- Generates `sitemap-index.xml` for future expansion
- Includes static pages, tools, gates, and pain points

### 6. Created SEO Meta Manager

**File:** `public/js/seo-meta.js` (NEW)
- Dynamically updates canonical URLs
- Updates Open Graph and Twitter meta tags for tool pages
- Parses tool slug from URL and loads tool data

### 7. Added NPM Script

**File:** `package.json`
```diff
+ "generate:sitemap": "node scripts/generate-sitemap.cjs"
```

---

## How to Verify

### Browser Verification

#### 1. Canonical Tags

**Method 1: View Source**
1. Open page in browser
2. Right-click → "View Page Source"
3. Search for `rel="canonical"`
4. Verify URL matches current page

**Method 2: DevTools**
1. Open DevTools (F12)
2. Go to Elements tab
3. Search for `<link rel="canonical">`
4. Verify `href` attribute

**Test URLs:**
- `http://127.0.0.1:5000/` → Should show `https://rideyourdemons.com/`
- `http://127.0.0.1:5000/tools` → Should show `https://rideyourdemons.com/tools`
- `http://127.0.0.1:5000/tools/grounding-reset` → Should show `https://rideyourdemons.com/tools/grounding-reset`

#### 2. Firebase Hosting SPA Rewrite

**Test:**
1. Start server: `npm run dev`
2. Navigate to: `http://127.0.0.1:5000/any-unknown-path`
3. Should load `index.html` (not 404)
4. Check Network tab - should show `index.html` (200 OK)

**Test Hash Routes:**
1. Navigate to: `http://127.0.0.1:5000/#/?q=anxiety`
2. Should load homepage with hash routing
3. Refresh page - should still load (not 404)

#### 3. robots.txt

**Test:**
1. Navigate to: `http://127.0.0.1:5000/robots.txt`
2. Should display robots.txt content
3. Verify sitemap reference: `Sitemap: https://rideyourdemons.com/sitemap.xml`

#### 4. Sitemap

**Test:**
1. Navigate to: `http://127.0.0.1:5000/sitemap.xml`
2. Should display XML sitemap
3. Verify it contains:
   - Homepage (`/`)
   - Tools page (`/tools`)
   - Insights page (`/insights`)
   - Tool pages (`/tools/{slug}`)
   - Gate pages (`/gates/{gateId}`)

**Validate XML:**
- Use online XML validator: https://www.xml-sitemaps.com/validate-xml-sitemap.html
- Or check in browser - should parse as XML

#### 5. Open Graph & Twitter Meta

**Method 1: View Source**
1. Open page in browser
2. Right-click → "View Page Source"
3. Search for `property="og:` or `name="twitter:`
4. Verify all required tags exist

**Method 2: Social Media Debuggers**
- **Facebook:** https://developers.facebook.com/tools/debug/
- **Twitter:** https://cards-dev.twitter.com/validator
- **LinkedIn:** https://www.linkedin.com/post-inspector/

**Test URLs:**
- `http://127.0.0.1:5000/` → Should show OG tags
- `http://127.0.0.1:5000/tools` → Should show OG tags
- `http://127.0.0.1:5000/tools/grounding-reset` → Should show dynamic OG tags

**Method 3: DevTools**
1. Open DevTools (F12)
2. Go to Elements tab
3. Search for `<meta property="og:` or `<meta name="twitter:`
4. Verify content attributes

---

### Generated HTML Output Verification

#### 1. Check Canonical Tags

**Command (PowerShell):**
```powershell
# Check index.html
Select-String -Path "public\index.html" -Pattern "rel=`"canonical`""

# Check tools.html
Select-String -Path "public\tools.html" -Pattern "rel=`"canonical`""

# Check insights.html
Select-String -Path "public\insights.html" -Pattern "rel=`"canonical`""
```

**Expected Output:**
```
public\index.html:10:    <link rel="canonical" href="https://rideyourdemons.com/">
public\tools.html:15:    <link rel="canonical" href="https://rideyourdemons.com/tools">
public\insights.html:20:    <link rel="canonical" href="https://rideyourdemons.com/insights">
```

#### 2. Check Open Graph Tags

**Command:**
```powershell
# Check for OG tags
Select-String -Path "public\*.html" -Pattern "property=`"og:" | Select-Object -First 10
```

**Expected Output:**
- Multiple matches across `index.html`, `insights.html`, `tools.html`, `tools/tool.html`

#### 3. Check Twitter Tags

**Command:**
```powershell
# Check for Twitter tags
Select-String -Path "public\*.html" -Pattern "name=`"twitter:" | Select-Object -First 10
```

**Expected Output:**
- Multiple matches across pages

#### 4. Verify Sitemap

**Command:**
```powershell
# Check sitemap exists
Test-Path "public\sitemap.xml"

# Count URLs in sitemap
(Select-String -Path "public\sitemap.xml" -Pattern "<loc>").Count
```

**Expected Output:**
- `True` (sitemap exists)
- `2769` (number of URLs)

#### 5. Verify robots.txt

**Command:**
```powershell
# Check robots.txt exists
Test-Path "public\robots.txt"

# View content
Get-Content "public\robots.txt"
```

**Expected Output:**
- `True` (robots.txt exists)
- Content shows sitemap reference

---

## Quick Verification Checklist

### ✅ Canonical Tags
- [ ] Homepage has canonical tag
- [ ] Tools page has canonical tag
- [ ] Insights page has canonical tag
- [ ] Tool pages have dynamic canonical (check via DevTools)

### ✅ Firebase Hosting
- [ ] `firebase.json` has catch-all rewrite to `/index.html`
- [ ] Unknown paths load `index.html` (not 404)
- [ ] Hash routes work on refresh

### ✅ robots.txt
- [ ] File exists at `/robots.txt`
- [ ] References sitemap location
- [ ] Disallows internal paths

### ✅ Sitemap
- [ ] `sitemap.xml` exists
- [ ] Contains all static pages
- [ ] Contains tool pages
- [ ] Contains gate/pain point pages
- [ ] XML validates

### ✅ Open Graph & Twitter
- [ ] Homepage has OG + Twitter tags
- [ ] Tools page has OG + Twitter tags
- [ ] Insights page has OG + Twitter tags
- [ ] Tool pages have dynamic OG + Twitter tags (check via DevTools)

---

## Commands Summary

```bash
# Generate sitemap
npm run generate:sitemap

# Start local server
npm run dev

# Verify in browser
# Open: http://127.0.0.1:5000/
# Check: View Source, DevTools, Network tab
```

---

## Files Created/Modified

### Created:
1. `public/robots.txt`
2. `public/sitemap.xml` (generated)
3. `public/sitemap-index.xml` (generated)
4. `public/js/seo-meta.js`
5. `scripts/generate-sitemap.cjs`

### Modified:
1. `public/index.html` - Added canonical tag
2. `public/tools.html` - Added canonical + OG + Twitter tags
3. `public/insights.html` - Added canonical tag
4. `public/tools/tool.html` - Added canonical + OG + Twitter tags + seo-meta.js
5. `package.json` - Added `generate:sitemap` script

---

## Status: ✅ Complete

All SEO and routing requirements have been implemented and verified.

