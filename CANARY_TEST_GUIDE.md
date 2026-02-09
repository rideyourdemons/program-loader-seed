# CANARY TEST GUIDE - 1% Migration Validation

**Purpose:** Validate safety valves and hardened logic on MSI hardware before full 164,000-node migration.

---

## Quick Start

### Option 1: Automated Runner (Recommended)
```powershell
cd "C:\Users\Earl Taylor\Documents\program-loader-seed_MATRIX_COMPLETE_2025-12-26\program-loader-seed"; powershell -ExecutionPolicy Bypass -File "scripts\run-canary-test.ps1"
```

### Option 2: Manual Execution
```powershell
node scripts/shadow-migration.mjs --dry-run --limit=1640
```

---

## What the Canary Test Does

1. **Processes 1,640 nodes** (1% of 164,000)
2. **Dry Run Mode:** Validates without writing files
3. **RAM Monitoring:** Checks memory usage every 1,000 nodes
4. **Hard Kill Safety:** Exits gracefully if RAM exceeds 150MB
5. **Heartbeat Logging:** Logs progress to `scripts/migration-output/canary-test-log.jsonl`

---

## What to Watch For

### During Execution

1. **Heartbeat Messages** (every 1,000 nodes)
   ```
   ❤️ Heartbeat: Nodes: 1,000 | RAM: 52MB (Δ+7MB) | Peak: 52MB | Speed: 1250 nodes/sec
   ```
   - **RAM:** Should stay near baseline (~56MB)
   - **Memory Delta:** Should be minimal (+5-15MB)
   - **Speed:** Should be consistent (1,000+ nodes/sec)

2. **Hard Kill Trigger** (if RAM exceeds 150MB)
   ```
   🚨 HARD KILL TRIGGERED:
      RAM: 151 MB > 150 MB
      Last successful node: node-12345
   ```
   - **Action:** Script exits gracefully
   - **Result:** Review why RAM spiked

3. **System Watchdog HUD** (if enabled)
   - **Node.exe RAM:** Monitor for spikes
   - **CPU Temp:** Should stay under 80°C (fans may kick in)
   - **CPU Load:** May spike during processing

---

## Validation Checklist

After the canary test completes, run validation:

```powershell
node scripts/validate-canary-results.mjs
```

### Checks Performed

1. **✅ Row Count**
   - **Expected:** Exactly 1,640 nodes
   - **Check:** `migration-ready.json` statistics

2. **✅ Anchor Alignment**
   - **Expected:** All 12 Gold Standard anchors found
   - **Anchors:** `fathers-sons`, `mothers-daughters`, `the-patriarch`, `the-matriarch`, `young-lions`, `young-women`, `the-professional`, `the-griever`, `the-addict`, `the-protector`, `men-solo`, `women-solo`
   - **Check:** Node IDs, cluster fields, ParentID references

3. **✅ Integrity**
   - **Expected:** No structural corruption
   - **Checks:**
     - All nodes have ID field
     - RiskWeight is valid (0-1)
     - No circular references
     - Required fields present

4. **✅ RAM Safety**
   - **Expected:** Peak RAM under 150MB
   - **Check:** Heartbeat logs in `canary-test-log.jsonl`

---

## Expected Output

### Successful Canary Test
```
======================================================================
🔄 SHADOW MIGRATION PREPARATION
   [DRY RUN MODE - No files will be written]
   [CANARY TEST - Limited to 1,640 nodes]
======================================================================

📊 Initial RAM: 45 MB
   Target Baseline: 56 MB
   Hard Kill Limit: 150 MB

📂 Loading data sources...
🔗 Building connection map...
   Inbound connections: 1,234
   Outbound connections: 5,678

⚠️  CANARY MODE: Processing 1,640 of 9,621 nodes

📊 Transforming 1,640 nodes...

❤️ Heartbeat: Nodes: 1,000 | RAM: 52MB (Δ+7MB) | Peak: 52MB | Speed: 1250 nodes/sec
❤️ Heartbeat: Nodes: 1,640 | RAM: 54MB (Δ+9MB) | Peak: 54MB | Speed: 1180 nodes/sec

📈 Final Statistics:
   Nodes Processed: 1,640
   Total Time: 1.39s
   Nodes/Second: 1,180
   Initial RAM: 45 MB
   Final RAM: 54 MB
   Peak RAM: 54 MB
   Memory Delta: 9 MB

✅ RAM Usage: Within safe limits

✅ Migration data validated (DRY RUN)
   Output file would be: scripts/migration-output/migration-ready.json

======================================================================
✅ PREPARATION COMPLETE
======================================================================
```

### Validation Results
```
======================================================================
🔍 CANARY TEST VALIDATION
======================================================================

1️⃣  Row Count Validation...
   ✅ Row Count: 1,640 nodes (exactly 1,640)

2️⃣  Anchor Alignment Validation...
   ✅ Anchor Alignment: All 12 Gold Standard anchors found
   Found anchors: fathers-sons, mothers-daughters, the-patriarch, ...

3️⃣  Integrity Validation...
   ✅ Integrity: No structural issues detected

4️⃣  RAM Safety Validation...
   ✅ RAM Safety: Peak RAM 54 MB (under 150 MB limit)
   Final RAM: 54 MB

======================================================================
📊 VALIDATION SUMMARY
======================================================================
   Row Count:        ✅ PASS - Correct: 1640 nodes
   Anchor Alignment: ✅ PASS - All 12 anchors found
   Integrity:        ✅ PASS - No issues found
   RAM Safety:       ✅ PASS - Peak: 54 MB
======================================================================

✅ CANARY TEST PASSED - Safe to proceed with full migration
======================================================================
```

---

## Troubleshooting

### Issue: RAM Spikes Above 150MB
**Symptom:** Hard kill triggers before completing 1,640 nodes

**Possible Causes:**
- Memory leak in transformation logic
- Large node data structures
- Insufficient garbage collection

**Actions:**
1. Check heartbeat logs for RAM growth pattern
2. Review node data for unusually large objects
3. Consider reducing batch size or adding explicit GC calls

### Issue: Missing Anchors
**Symptom:** Validation reports missing Gold Standard anchors

**Possible Causes:**
- Anchors not in source data
- ID mismatch (different naming convention)
- Anchors in different collection

**Actions:**
1. Check source JSON files for anchor IDs
2. Verify anchor naming matches `gold-standard-anchors.mjs`
3. Check if anchors are in different node types

### Issue: Integrity Failures
**Symptom:** Validation reports structural issues

**Possible Causes:**
- Missing required fields in source data
- Invalid RiskWeight calculations
- Circular references in node connections

**Actions:**
1. Review integrity error messages
2. Check source data structure
3. Verify transformation logic

---

## Next Steps After Canary Test

### If All Checks Pass ✅
1. **Review Results:** Check `migration-ready.json` sample nodes
2. **Full Migration:** Run without `--limit` flag:
   ```powershell
   node scripts/shadow-migration.mjs --dry-run
   ```
3. **Production:** After final validation, remove `--dry-run` flag

### If Issues Found ⚠️
1. **Fix Issues:** Address validation failures
2. **Re-run Canary:** Test fixes with another 1% run
3. **Iterate:** Continue until all checks pass

---

## Files Created

- `scripts/migration-output/migration-ready.json` - Migration data (if not dry-run)
- `scripts/migration-output/canary-test-log.jsonl` - Heartbeat logs
- `scripts/migration-output/migration-state.json` - Checkpoint state (if enabled)

---

## Safety Notes

- **Dry Run Mode:** No files are written (safe to test)
- **Hard Kill Active:** Script exits at 150MB RAM (no crash)
- **Resume Capability:** Can restart from checkpoint if interrupted
- **Gold Standard Anchors:** 12 anchors pinned in memory

---

**Status:** 🚀 Ready for Canary Test

Execute the command above to begin 1% validation.
