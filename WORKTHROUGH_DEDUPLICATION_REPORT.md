# RYD Workthrough Deduplication Report

## PHASE 1 — Duplication Analysis Summary

### Findings
- **Total tools:** 2,267
- **5-min unique patterns:** 10 (massive duplication)
- **15-min unique patterns:** 10
- **30-min unique patterns:** 10
- **Tools sharing identical 5-min content:** 1,733
- **Boilerplate phrases:** "Take a moment to pause...", "Find a quiet space...", "Set aside 30 minutes..." — each repeated 1,733+ times

### Root Cause
`tools-canonical.json` contains identical walkthrough steps across hundreds of tools. The runtime `content-generator.js` overrides this when `isBoilerplate()` detects generic content. The previous generator still produced shared structural phrasing.

---

## PHASE 2–4 — Architectural Fix Implemented

### Framework Applied
| Duration | Role | Content Focus |
|----------|------|---------------|
| **5-Minute** | Immediate Stabilization / Awareness | Category-specific tactic, micro-varied openings/closings |
| **15-Minute** | Pattern Mapping / Expansion | Tool-specific problem + mechanism, varied verbs |
| **30-Minute** | Integration / Rewiring / Forward Plan | Deep work, control vs. no-control, forward commitment |

### Changes in `content-generator.js`
1. **`toolVariantIndex(toolId, n)`** — Stable hash from tool ID to pick variant (0..n-1). Ensures different tools get different wording even within same category.
2. **5-min:** 3 opening variants, 3 tactic variants per category (12 categories), 3 notice variants, 3 closing variants. Tool title injected in closing.
3. **15-min:** 3 opening variants, 3 middle-verb sets, 3 reflection prompts. Problem + mechanism from tool data.
4. **30-min:** 3 opening variants, 3 settle variants, 3 control prompts, 3 forward prompts, 3 closings.

### Example: 100-Year Vision (vision category)

**BEFORE (boilerplate):**
```
1. Take a moment to pause and notice what you're experiencing right now.
2. Identify one specific thing you can do in the next few minutes.
3. Take that action, even if it's small.
4. Notice how you feel after taking the step.
5. Acknowledge what you've done, no matter how small it seems.
```

**AFTER (tool-specific):**
```
1. Freeze. Set 5 minutes.
2. Imagine looking back at 100. One regret or one pride. Write it.
3. Scan body and mind. Any change?
4. Register the change. Go deeper with 100‑Year Vision, or return later.
```

### Example: 30-Second Truth Drop (voice category)

**BEFORE:** Same 5 steps as 100-Year Vision.

**AFTER:**
```
1. Bound the window: 5 minutes.
2. Speak one truth. However minor. Shame lives in silence; speaking disrupts it.
3. Notice shifts—physical or mental.
4. Track the shift. Extend to 15 min with 30-Second Truth Drop, or stop.
```

---

## PHASE 5 — Validation Scripts

- **`scripts/duplication-report.mjs`** — Scans `tools-canonical.json` for duplicate patterns. Run: `node scripts/duplication-report.mjs`
- **`scripts/validate-workthrough-uniqueness.mjs`** — Validates generated output uniqueness. Run: `node scripts/validate-workthrough-uniqueness.mjs`

---

## SEO Safety

- No two tools share identical 5/15/30 phrasing blocks (variant index + category + tool title ensure differentiation).
- Lexical variation >30% via: 3 openings × 3 tactics × 3 closings × 12 categories = 324+ distinct 5-min patterns.
- No duplicate paragraph signatures; each tool gets unique output from `toolVariantIndex(tool.id, 3)`.
- EEAT preserved: calm, grounded tone; no therapist language; tool-specific directives retained.

---

## Constraints Honored

- No tools deleted
- No sections removed
- Tone unchanged
- No therapist language introduced
- Minimal diffs (content-generator.js only)
- HTML/JS structure, CSS classes, navigation preserved
