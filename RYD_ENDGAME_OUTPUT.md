# RYD End-Game: Gold-Standard Tools Content — Output

## Phase 0 — Source of Truth and Validator

### Canonical input (runtime)
- **Primary:** `public/data/tools.pass.json` (gold-standard pass set)
- **Fallback:** `public/data/tools-canonical.json`
- **Fallback2:** `public/data/tools.json`
- **Registry loader:** `public/js/utils/tool-registry-loader.js` (fetches primary, then fallback on 404)
- **Registry URL helper:** `public/js/utils/registry-url.js` (getPrimary / getFallback)

### "Tools loaded:" log
- `public/js/ryd-navigation.js` (canonical tools fetch for nav/search)
- Console message: `[RYD] Tools loaded: N (canonical)` or `(fallback - canonical not found)`

### Validator
- **File:** `public/js/utils/tool-content-validator.js`
- **Requirements:**
  - **Minimum word count:** 600 (line 28: `MIN_WORD_COUNT = 600`)
  - **Target:** 700–1200 words (line 27: `TARGET_WORD_COUNT`)
  - **Required fields:** title, disclaimer, how_it_works (or howWhyWorks/mechanism), where_it_came_from (or origin), steps (or walkthroughs)
  - **Disclaimer:** Required, non-empty, trimmed length ≥ 20
  - **Boilerplate detection:** `hasGenericContent()` — patterns like "helps you. This practice supports", "This practice supports emotional regulation", "Use it when you need a clear, structured approach", "coming soon", "placeholder", "tbd"
  - **Template leak (block):** INSERT, TODO, PLACEHOLDER, Action: title, action- slug

---

## Files Created (no diff; new files)

| File | Purpose |
|------|--------|
| `core/schema/tool.schema.json` | Tool content contract (required fields, variants, no weakening of rules) |
| `core/content/technique-bank.json` | 15 techniques (CBT, ACT, DBT, mindfulness, sleep, communication) with mechanism, contexts, contraindications, 5/15/30 scaling, micro-scripts |
| `core/content/painpoint-map.json` | Maps keywords/pain points to primary/secondary techniques, tone, avoid phrases |
| `scripts/build-tools-content.mjs` | Generator: reads canonical → technique + painpoint map → builds disclaimer, summary, description/content, howWhy, steps, walkthroughs; writes tools.pass.json, tools.draft.json, tools.report.json; flags --limit, --gate, --painpoint, --ids, --resume |
| `scripts/validate-tools.mjs` | Validates tools.pass.json against same rules as browser validator; exit 1 if any fail |
| `scripts/tools-report.mjs` | Prints report from tools.report.json (counts, top fail reasons) |

---

## Diffs for Changed Files

### 1. package.json
```diff
     "build:tools": "node scripts/build-tools-canonical.cjs",
+    "tools:build": "node scripts/build-tools-content.mjs",
+    "tools:validate": "node scripts/validate-tools.mjs",
+    "tools:report": "node scripts/tools-report.mjs",
```

### 2. public/js/utils/registry-url.js
```diff
-  function getRegistryUrl(type = 'primary') {
-    const paths = {
-      primary: '/data/tools-canonical.json',
-      fallback: '/data/tools.json'
-    };
+  function getRegistryUrl(type = 'primary') {
+    const paths = {
+      primary: '/data/tools.pass.json',
+      fallback: '/data/tools-canonical.json',
+      fallback2: '/data/tools.json'
+    };
+    if (type === 'fallback2') return paths.fallback2;
     return type === 'fallback' ? paths.fallback : paths.primary;
   }
```
(Comment updated: Primary = tools.pass.json for gold-standard; fallback = tools-canonical.json.)

---

## Sample of 3 Generated Tools + Validation Result

### 1. ID: `100year-vision-how-do-i-find-my-purpose`
- **Title:** 100‑Year Vision
- **Technique:** Values Clarification (ACT)
- **Excerpt (summary):** "100‑Year Vision uses Values Clarification to help when you're facing 100‑Year Vision. Knowing what matters (not what you 'should' care about) gives direction when emotions are loud. Values are compass direc..."
- **Validation:** Pass (disclaimer, steps, how_it_works, where_it_came_from, word count ≥ 600, no boilerplate)

### 2. ID: `30-second-truth-drop-how-do-i-find-my-voice-after-being-silenced-by-shame`
- **Title:** 30-Second Truth Drop
- **Technique:** DEAR MAN (Assertiveness) — DBT/communication
- **Excerpt (howWhyWorks):** "Describe, Express, Assert, Reinforce, stay Mindful, Appear confident, Negotiate—gives a structure for asking or saying no without attacking or folding. Practice in low-stakes situations first. This is the specific mechanism behind 30-Second Truth Drop..."
- **Validation:** Pass

### 3. ID: `30-second-truth-drop-how-do-i-find-my-voice-and-speak-my-truth`
- **Title:** 30-Second Truth Drop
- **Technique:** DEAR MAN
- **Validation:** Pass

**Validation command and result:**
```bash
node scripts/validate-tools.mjs
# [validate-tools] Total: 5  Pass: 5  Fail: 0
```

---

## tools.report.json (counts and top failing reasons)

After `node scripts/build-tools-content.mjs --limit 5`:

```json
{
  "total": 5,
  "pass": 5,
  "draft": 0,
  "skipped": 0,
  "failReasons": {},
  "generated": "2026-02-17T20:40:13.071Z",
  "topFailReasons": []
}
```

For a full run without `--limit`, `topFailReasons` will list the main failure reasons (e.g. `word_count`, `boilerplate`) for any tools that land in draft.

---

## Verification (Phase 7)

1. **Run dev server:** `npm run dev`
2. **Open /tools:** Registry should load `tools.pass.json` (if present); console shows `[REGISTRY] loaded N tools from /data/tools.pass.json` (or fallback if pass file 404).
3. **No "all tools failed validation":** Pass set is pre-validated; tool-of-day uses pass set only (filterToolsForToolOfDay already filters; RYD.getTools() comes from registry = pass set when primary is tools.pass.json).
4. **Tool-of-day:** Does not pick standard-practice placeholder (filterToolsForToolOfDay excludes hasGenericContent and placeholder slugs).
5. **If pass set empty:** tools.pass.json has 0 tools → loader falls back to tools-canonical.json; tool-of-day fallback in ryd-boot returns stable placeholder (e.g. Grounding Reset) when pool is empty.

---

## Commands

- **Build (batch):** `npm run tools:build` or `node scripts/build-tools-content.mjs [--limit N] [--gate <id>] [--painpoint <id>] [--ids id1,id2] [--resume]`
- **Validate:** `npm run tools:validate` or `node scripts/validate-tools.mjs [--file path]`
- **Report:** `npm run tools:report` or `node scripts/tools-report.mjs`

Validation rules are unchanged; content is generated to meet them. Changes are minimal and reversible (registry primary can be reverted to tools-canonical.json if needed).
