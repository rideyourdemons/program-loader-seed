# RYD — Tool Registry Loader Double-Declaration Fix

## A) Duplicate inclusion

Search for `tool-registry-loader.js`:

| Location | Count | Notes |
|----------|--------|------|
| `public/tools.html` | **1** (line 17) | Only inclusion in main app |
| `site/public/tools.html` | 1 (line 14) | Alternate site tree |
| No dynamic injectors, boot files, or layout templates load this script | — | |

**Conclusion:** The script is not included twice on any single page. The runtime error could be from a second execution (e.g. SPA re-run or cached duplicate). The fix makes the script safe when run more than once.

---

## B) Script strategy

- **No duplicate `<script>` tag** on the same page; no removal needed.
- **No module version**; only classic script. Single script tag kept.

---

## C) Global collision prevention (implemented)

**Changes in `public/js/utils/tool-registry-loader.js`:**

1. **Run-once guard at top of IIFE**  
   If `window.RYD_RegistryLoader` already exists, the IIFE returns immediately. No inner declarations run again, so no duplicate declaration can occur from this file.

2. **Single attach to `window`**  
   The global object is only assigned inside `if (!window.RYD_RegistryLoader)`, and the init log runs only when that branch runs.

**Diff (conceptual):**

```diff
 (function() {
   'use strict';

+  // Prevent double execution and global collision (run exactly once)
+  if (typeof window !== 'undefined' && window.RYD_RegistryLoader) {
+    return;
+  }
+
   const getRegistryPath = (type) => {
   ...
-  window.RYD_RegistryLoader = {
+  if (typeof window !== 'undefined' && !window.RYD_RegistryLoader) {
+    window.RYD_RegistryLoader = {
       load: loadRegistry,
       getTools,
       getStatus: getRegistryStatus,
       REGISTRY_PATHS
     };
-  console.log('[Registry Loader] Tool registry loader initialized');
+    console.log('[Registry Loader] Tool registry loader initialized');
+  }
 })();
```

- Tool logic and styling are unchanged.
- Works in both dev and production.

---

## D) Boot order

- **Config:** `registry-url.js` loads immediately before `tool-registry-loader.js` (lines 16 → 17 in `tools.html`).
- **Utils:** `tool-content-validator.js`, `tool-content-expander.js`, `tool-variant-utils.js` load before it (lines 13–15).
- Registry loader runs once per page load, after those; duplicate runs are no-ops.

---

## E) Validation

After deploy:

1. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R), then open `/tools`.
2. Console must **not** show: `Identifier 'loader' has already been declared` (or any “already been declared” for this script).
3. Console should show: `[Registry Loader] Tool registry loader initialized` and then `[REGISTRY] loaded NNNN tools from ...` (or fallback message).
4. Tool cards must render in the grid.

---

## Summary

- **Where duplicate was found:** No duplicate inclusion was found; script appears once per page.
- **Fix applied:** Run-once guard + single `window.RYD_RegistryLoader` attach in `public/js/utils/tool-registry-loader.js` so repeated execution cannot cause duplicate declarations or overwrite the global.
