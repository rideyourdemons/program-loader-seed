# Gates IA Implementation - Test Checklist

## Overview
- **12 gates** on main page
- Each gate has **dropdown for 40 pain points**
- Each pain point links to **3 tools**
- Tools can appear in multiple mappings (reusable)

## Data Schema

### File: `public/data/gates-painpoints-tools.json`

```json
{
  "version": "1.0",
  "generated": "ISO timestamp",
  "requirements": {
    "gates": 12,
    "painPointsPerGate": 40,
    "toolsPerPainPoint": 3
  },
  "gates": [
    {
      "id": "gate-id",
      "title": "Gate Title",
      "description": "Gate description",
      "painPoints": [
        {
          "id": "pain-point-id",
          "title": "Pain Point Title",
          "toolIds": ["tool-id-1", "tool-id-2", "tool-id-3"]
        }
      ]
    }
  ],
  "stats": {
    "totalGates": 12,
    "totalPainPoints": 480,
    "totalToolMappings": 1440,
    "warnings": 0
  }
}
```

**Rationale:**
- Single source of truth for all gate/pain point/tool mappings
- Validates structure (12 gates, 40 pain points per gate, 3 tools per pain point)
- Includes stats for validation
- Tool IDs reference canonical tools list

## UI Changes

### 1. Homepage (`public/index.html`)
- ✅ Added `<section id="gatesContainer">` before "Tool of the Day"
- ✅ Added `<script src="/js/gates-renderer.js" defer></script>`
- ✅ Gates render dynamically from mapping file

### 2. Gates Renderer (`public/js/gates-renderer.js`)
- ✅ Loads mapping and tools data
- ✅ Renders 12 gate cards in grid layout
- ✅ Each gate has dropdown with 40 pain points
- ✅ Selecting pain point shows 3 tool cards
- ✅ Tool cards link to `/tools/{slug}?gate={gateId}&painPoint={painPointId}`

### 3. Tool Pages (`public/tools/tool.html`)
- ✅ Parses `gate` and `painPoint` URL params
- ✅ Displays back link: `← Back to {gate} / {painPoint}`
- ✅ Back link navigates to homepage with context

## Validation

### Script: `scripts/validate-mapping.cjs`

**Validates:**
- ✅ Exactly 12 gates
- ✅ Exactly 40 pain points per gate
- ✅ Exactly 3 tools per pain point
- ✅ All tool IDs exist in canonical tools

**Run:**
```bash
npm run validate:mapping
```

## Commands

### Build Mapping
```bash
npm run build:mapping
```
Generates `public/data/gates-painpoints-tools.json` from:
- `public/data/gates.json`
- `public/data/pain-points.json`
- `public/data/tools-canonical.json`

### Validate Mapping
```bash
npm run validate:mapping
```
Validates structure and tool IDs.

## Test Checklist

### ✅ Data Validation
- [ ] Run `npm run validate:mapping` - should pass
- [ ] Check `public/data/gates-painpoints-tools.json` exists
- [ ] Verify 12 gates in mapping
- [ ] Verify 480 pain points total (40 per gate)
- [ ] Verify 1440 tool mappings total (3 per pain point)

### ✅ Homepage UI
- [ ] Open `http://127.0.0.1:5000/` (or localhost)
- [ ] See "Explore by Gate" section
- [ ] See 12 gate cards in grid layout
- [ ] Each gate card shows:
  - [ ] Gate title
  - [ ] Gate description
  - [ ] Dropdown with "Choose a pain point" placeholder
- [ ] Dropdown has 40 options (pain points)

### ✅ Pain Point Selection
- [ ] Select a pain point from any gate dropdown
- [ ] See "Tools for {pain point title}" heading
- [ ] See 3 tool cards displayed
- [ ] Each tool card shows:
  - [ ] Tool title
  - [ ] Tool description (truncated to 100 chars)
  - [ ] "Open Tool →" link
- [ ] Tool cards are clickable (entire card)

### ✅ Tool Navigation
- [ ] Click a tool card
- [ ] Navigate to `/tools/{slug}?gate={gateId}&painPoint={painPointId}`
- [ ] Tool page loads correctly
- [ ] See back link: `← Back to {gate} / {painPoint}`
- [ ] Click back link
- [ ] Navigate to homepage (or scroll to gate section)

### ✅ Tool Reusability
- [ ] Find a tool that appears in multiple pain points
- [ ] Verify same tool ID appears in different gates/pain points
- [ ] Verify tool links work from all contexts

### ✅ Responsive Design
- [ ] Test on desktop (1200px+)
- [ ] Test on tablet (768px)
- [ ] Test on mobile (375px)
- [ ] Gate cards stack properly on mobile
- [ ] Dropdowns are usable on mobile

### ✅ Error Handling
- [ ] Disconnect network
- [ ] Refresh homepage
- [ ] See error message: "Failed to load gates. Please refresh the page."
- [ ] Reconnect network
- [ ] Refresh page
- [ ] Gates load correctly

### ✅ Console Logs
- [ ] Open DevTools Console
- [ ] See `[RYD Gates] Loading mapping data...`
- [ ] See `[RYD Gates] Loaded: { gates: 12, tools: 2267 }`
- [ ] No errors in console

### ✅ Performance
- [ ] Homepage loads in < 2 seconds
- [ ] Gates render in < 1 second after data loads
- [ ] Tool cards appear instantly on pain point selection
- [ ] No layout shift (CLS)

## Files Modified/Created

### Created
1. `public/data/gates-painpoints-tools.json` - Single source of truth mapping
2. `scripts/build-gates-mapping.cjs` - Build script
3. `scripts/validate-mapping.cjs` - Validation script
4. `public/js/gates-renderer.js` - UI renderer

### Modified
1. `public/index.html` - Added gates container + script
2. `public/tools/tool.html` - Added back links with context
3. `package.json` - Added `build:mapping` and `validate:mapping` scripts

## Next Steps

1. **Test locally:**
   ```bash
   npm run dev
   # Open http://127.0.0.1:5000/
   ```

2. **Validate data:**
   ```bash
   npm run validate:mapping
   ```

3. **Rebuild mapping if needed:**
   ```bash
   npm run build:mapping
   ```

4. **Deploy to Firebase:**
   ```bash
   firebase deploy --only hosting
   ```

## Known Issues / Warnings

- Some gates had 39 or 41 pain points initially - build script pads/truncates to 40
- Some pain points had < 3 tools - build script adds fallback tools
- Validation may show warnings for missing tool IDs (if canonical tools not synced)

## Success Criteria

✅ **All tests pass**
✅ **12 gates render on homepage**
✅ **Each gate has dropdown with 40 pain points**
✅ **Each pain point shows 3 tools**
✅ **Tools link to tool pages with context**
✅ **Tool pages show back links**
✅ **Validation script passes**
✅ **No console errors**

