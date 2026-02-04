# RYD File Organization Complete

**Date:** February 1, 2026  
**Status:** ✅ Production files organized, duplicates archived

---

## 📁 Production Structure (Clean)

### Firebase Hosting Root: `public/`

#### **HTML Pages (Canonical)**
- `index.html` - Main homepage
- `tools.html` - Tools directory
- `insights.html` - Insights page
- `search.html` - Search results
- `live-site-integration.html` - Integration preview
- `platform-integrated.html` - Platform preview
- `index-integrated.html` - Integrated preview variant
- `index-integrated-ryd.html` - RYD integrated variant

#### **Subdirectories**
- `public/gates/` - Gate pages (index, gate detail, pain point)
- `public/tools/` - Tool pages (tool detail, workthrough)
- `public/about/` - About page
- `public/disclosures/` - Disclosures page
- `public/ethics/` - Ethics page
- `public/analytics/` - Analytics & Privacy page
- `public/terms/` - Terms page
- `public/store/` - Store page + canonical tools

#### **Core JavaScript** (`public/js/`)
- `matrix-loader.js` - Matrix data loader
- `ryd-boot.js` - RYD bootstrapper
- `ryd-bind.js` - UI binding
- `ryd-navigation.js` - Navigation system
- `ryd-router.js` - Hash-based routing
- `matrix-expander.js` - Matrix expansion logic
- `matrix-engine.js` - Matrix engine
- `matrix-boot.js` - Matrix bootstrapper
- `ethics-guard.js` - Ethics guard
- `numerology-engine.js` - Numerology (symbolic only)
- `tool-rotation.js` - Tool rotation
- `compliance-state.js` - Compliance state
- `encoding-guard.js` - UTF-8 encoding guard

#### **Data Files** (`public/data/`)
- `tools.json` - Base tools (8 tools)
- `gates.json` - 12 gates
- `pain-points.json` - 480 pain points (40 per gate)
- `insights.json` - Insights data

#### **Configuration** (`public/config/`)
- `region-profiles.json` - Regional adaptation
- `weight-table.json` - Matrix weights
- `state-registry.json` - State registry
- `numerology-map.json` - Numerology mappings

#### **Store** (`public/store/`)
- `tools.canonical.json` - 2,259 tools from live site crawl
- `tools.filtered.json` - 526 filtered ethical tools
- `_archive/` - Archived legacy files

#### **CSS** (`public/css/`)
- `main.css` - Main stylesheet
- `integrated.css` - Integrated styles
- `matrix-status.css` - Matrix status styles

---

## 🗄️ Archived Files (`_archive/`)

### **Root HTML Duplicates** (`_archive/root-html-duplicates/`)
- `platform-integrated.html` (moved from root)
- `sandbox-preview.html`
- `sandbox-preview-complete.html`
- `sandbox-preview-search.html`

### **Backups** (`_archive/backups/`)
- `index.html.bak_2026-02-01T08-38-28-914Z`
- `insights.html.bak_2026-02-01T08-38-28-914Z`
- `tools.html.bak_2026-02-01T08-38-28-914Z`
- `matrix-loader.js.bak_2026-02-01T08-38-28-914Z`
- `firebase.json.bak_2026-02-01T08-38-28-914Z`

### **Old Documentation** (`_archive/old-docs/`)
- 60+ status/implementation markdown files archived
- Kept only: `README.md`, `RYD_MASTER_DIRECTIVE.md`, `.cursorrules`

### **Sandbox Experiments** (`_archive/sandbox-experiments/`)
- `sandbox-preview/` - Old sandbox preview
- `integrated-sandbox/` - Old integrated sandbox
- `production/` - Old production directory (superseded by `public/`)
- `core/` - Old core directory (superseded by `public/js/`)
- `components/` - Example components only
- `programs/` - Old programs
- `memory/` - Old memory
- `compliance-data/` - Old compliance (superseded by `public/config/`)
- `config/` - Old config (superseded by `public/config/`)

---

## ✅ What Remains (Production-Ready)

### **Root Level**
- `firebase.json` - Firebase hosting config
- `package.json` - Node dependencies
- `README.md` - Main readme
- `RYD_MASTER_DIRECTIVE.md` - Master directive
- `.cursorrules` - Cursor rules

### **Active Directories**
- `public/` - **Firebase hosting root (production)**
- `sandbox/` - Development scripts and tools
- `scripts/` - Utility scripts
- `docs/` - Documentation
- `logs/` - Log files
- `_archive/` - Archived files (not deployed)

---

## 📊 Organization Stats

- **Files Archived:** 80
- **Directories Archived:** 9
- **Production Files:** Clean and organized in `public/`
- **Archive Location:** `_archive/`

---

## 🎯 Canonical Entry Points

1. **Homepage:** `public/index.html`
2. **Tools:** `public/tools.html`
3. **Insights:** `public/insights.html`
4. **Search:** `public/search.html`

---

## 🔧 Development Tools

- **Sandbox Scripts:** `sandbox/` (filter tools, organize files, etc.)
- **Utility Scripts:** `scripts/` (fixes, validations, etc.)
- **Documentation:** `docs/` (guides, reports)

---

## 📝 Notes

- All production files are in `public/` (Firebase hosting root)
- Duplicate HTML files archived
- Old documentation archived
- Test/experimental directories archived
- Backup files preserved in archive
- Clean, deploy-ready structure

---

**Organization complete. Production files are clean and ready for deployment.**

