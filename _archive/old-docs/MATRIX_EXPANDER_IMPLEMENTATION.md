# Matrix Expander Implementation Summary

## Overview
Implemented a Matrix Expander system that expands base tools (~8) into contextual tool instances based on gate + pain point selections (12 gates × 40 pain points = 480 potential combinations).

## Files Modified

### 1. `public/js/matrix-expander.js` (NEW)
- **Purpose**: Core matrix expansion logic
- **Functions Added**:
  - `indexBaseTools(baseTools)` - Creates fast lookup index for base tools
  - `getToolsForSelection(gateId, painPointId)` - Returns contextual tool instances for a selection
  - `getPainPointsForGate(gateId)` - Returns all pain points for a gate
  - `init(data)` - Initializes expander with gates, pain points, and base tools
- **Features**:
  - Supports multiple pain point schema formats: `tools`, `toolIds`, or `links.tools`
  - Creates unique instance IDs: `${gateId}__${painPointId}__${toolId}`
  - Graceful fallback if tool mappings don't exist
  - Debug logging via `window.DEBUG_RYD` flag

### 2. `public/js/ryd-router.js` (MODIFIED)
- **Changes**:
  - Added matrix expander initialization in `loadData()`
  - Added `renderGateView(gateId)` - Renders gate page with pain points list
  - Added `renderPainPointView(gateId, painPointId)` - Renders pain point page with expanded tool instances
  - Enhanced `parseRoute()` to handle `/gate/:id` and `/pain/:gateId/:painPointId` routes
  - Updated `handleRoute()` to call gate and pain point renderers
- **Tool Instance Rendering**:
  - Tool cards show: title, description (always), duration, difficulty, CTA button
  - Uses matrix expander to get contextual instances
  - Falls back to base tools if expander unavailable

### 3. `public/js/ryd-bind.js` (MODIFIED)
- **Changes**:
  - Enhanced `hydrateInsights()` to check for `insights-container` ID
  - Added console safety: logs warning once, exits silently if container missing
  - Prevents "no insights container found" spam

### 4. `public/index.html` (MODIFIED)
- **Changes**:
  - Added `<script src="/js/matrix-expander.js" defer></script>` before router script
  - Ensures expander loads before router initializes

## Tool Instance Object Shape

```javascript
{
  instanceId: "gateId__painPointId__toolId",
  toolId: "base-tool-id",
  gateId: "anxiety-stress",
  painPointId: "panic-attacks",
  title: "Grounding Reset",
  description: "A short reset to calm...",
  duration: "5 minutes",
  difficulty: "beginner",
  slug: "grounding-reset",
  cta: "/tools/grounding-reset",
  base: { /* full base tool object */ },
  context: {
    gateId: "anxiety-stress",
    painPointId: "panic-attacks",
    painPointTitle: "Panic Attacks"
  }
}
```

## Pain Point Schema Support

The expander supports three schema formats for tool mappings:

1. **`painPoint.tools`** (array of tool IDs)
   ```json
   {"id": "depression", "title": "Depression", "tools": ["grounding-reset", "thought-unhook", "energy-check"]}
   ```

2. **`painPoint.toolIds`** (array of tool IDs)
   ```json
   {"id": "depression", "title": "Depression", "toolIds": ["grounding-reset", "thought-unhook", "energy-check"]}
   ```

3. **`painPoint.links.tools`** (nested array)
   ```json
   {"id": "depression", "title": "Depression", "links": {"tools": ["grounding-reset", "thought-unhook", "energy-check"]}}
   ```

If no mapping exists, returns empty array and logs warning once per pain point.

## Routes Added

- `#/gate/:gateId` - Shows gate page with list of pain points
- `#/pain/:gateId/:painPointId` - Shows pain point page with expanded tool instances

## Testing

### Local Testing Steps

1. **Start Firebase emulator**:
   ```bash
   firebase emulators:start --only hosting
   ```

2. **Open browser**:
   - Navigate to `http://127.0.0.1:5000/`

3. **Test Matrix Expansion**:
   - Open browser console
   - Set `window.DEBUG_RYD = true` for verbose logging
   - Navigate to a gate: `#/gate/anxiety-stress`
   - Click a pain point link
   - Verify tool instances render (should show 0-3 tools depending on mapping)

4. **Verify Console Logs**:
   - Should see: `[RYD] router: matrix expander initialized`
   - Should see: `[RYD] matrix-expander: created N tool instances for {gateId, painPointId}`
   - No errors about missing containers

### Expected Behavior

- **With tool mappings**: Shows 3 tool cards per pain point
- **Without tool mappings**: Shows "No tools available" message (logs warning once)
- **Base tools**: Reused across multiple pain points (no duplication)
- **Tool cards**: Always show description (never blank)

## Next Steps

To populate tool mappings in `pain-points.json`:

1. Add `tools` array to each pain point:
   ```json
   {
     "id": "depression",
     "title": "Depression",
     "tools": ["grounding-reset", "thought-unhook", "energy-check"]
   }
   ```

2. Target: 3 tools per pain point × 40 pain points × 12 gates = 1,440 tool instances
3. Base tools: Reuse the ~8 base tools from `tools.json`

## Debug Mode

Enable verbose logging:
```javascript
window.DEBUG_RYD = true;
```

This will log:
- Base tools indexed count
- Tool instances created per selection
- Gate/pain point counts
- Missing tool warnings

## Files Changed Summary

- ✅ `public/js/matrix-expander.js` (NEW - 200+ lines)
- ✅ `public/js/ryd-router.js` (MODIFIED - added gate/pain views, expander init)
- ✅ `public/js/ryd-bind.js` (MODIFIED - fixed insights container warning)
- ✅ `public/index.html` (MODIFIED - added matrix-expander.js script)

## Functions Added

1. `RYD_MATRIX_EXPANDER.indexBaseTools(baseTools)`
2. `RYD_MATRIX_EXPANDER.getToolsForSelection(gateId, painPointId)`
3. `RYD_MATRIX_EXPANDER.getPainPointsForGate(gateId)`
4. `RYD_MATRIX_EXPANDER.init(data)`
5. `RYD_ROUTER.renderGateView(gateId)`
6. `RYD_ROUTER.renderPainPointView(gateId, painPointId)`

## Status

✅ **Implementation Complete**
- Matrix expander module created
- Router wired to use expander
- Gate and pain point views implemented
- Console safety added
- Debug logging available

⚠️ **Pending**: Add tool mappings to `pain-points.json` to enable full expansion (currently returns empty arrays until mappings are added)

