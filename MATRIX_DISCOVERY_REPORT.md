# 🔍 RYD Matrix Discovery Report

## Executive Summary

**Status:** ✅ Matrix structure located and analyzed  
**Date:** 2026-02-04  
**Matrix Size:** ~18,963 items (2,764 nodes + 13,435 connections)  
**Note:** Current matrix is ~19k items, not 164k. The 164k may refer to theoretical maximum or future expansion target.

---

## 📍 Matrix Location

### Primary Data Files Found:

1. **`public/matrix/resonance-nodes.json`**
   - **Size:** 2,764 nodes
   - **Structure:** Node registry with resonance scores
   - **Types:** 12 gates, 480 pain points, 2,267 tools, 5 insights

2. **`public/data/matrix/link-map.json`**
   - **Size:** 13,435 connections
   - **Structure:** Recommendations with `from` → `to[]` relationships
   - **Purpose:** Defines internal linking structure

3. **`public/data/matrix/registry.json`**
   - **Size:** 2,764 nodes (duplicate of resonance-nodes)
   - **Schema:** Complete node metadata with paths, tags, links

4. **`RYD_MATRIX/anchors/*.json`** (12 files)
   - **Structure:** 12 anchors × 40 pain points = 480 pain points
   - **Tool References:** 1,440 tool mappings (3 tools per pain point)
   - **Source:** `RYD_MATRIX/armory/global_mechanics.json`

---

## 📊 Current Schema Analysis

### Registry Node Schema (Current):
```javascript
{
  id: string,              // ✅ EXISTS - Node identifier
  path: string,            // ✅ EXISTS - URL path
  title: string,           // ✅ EXISTS - Display title
  tags: Array,            // ✅ EXISTS - Keywords/categories
  cluster: string,        // ✅ EXISTS - Gate/anchor reference (acts as ParentID)
  inboundLinks: Array,    // ✅ EXISTS - Incoming connections
  outboundLinks: Array,   // ✅ EXISTS - Outgoing connections
  resonanceScore: number, // ✅ EXISTS - Resonance value (0-1)
  decayScore: number,     // ✅ EXISTS - Decay factor (0-1)
  lastUpdated: object     // ✅ EXISTS - Timestamp
}
```

### Target Schema (Requested):
```javascript
{
  ID: string,        // ✅ MAPPED from 'id'
  ParentID: string,  // ✅ MAPPED from 'cluster' (gate/anchor reference)
  RiskWeight: number // ✅ CALCULATED from resonanceScore + decayScore
}
```

---

## 🔄 Schema Mapping

| Current Field | Target Field | Transformation |
|--------------|--------------|----------------|
| `id` | `ID` | Direct mapping |
| `cluster` | `ParentID` | Gate/anchor reference |
| `resonanceScore` + `decayScore` | `RiskWeight` | `(resonanceScore × (1 - decayScore)) × 100` |

**RiskWeight Calculation:**
- Higher resonance + lower decay = higher risk weight
- Range: 0-1 (normalized)
- Example: resonanceScore=0.95, decayScore=0.05 → RiskWeight=0.90

---

## 📈 Statistics

### Node Counts:
- **Total Nodes:** 2,764
- **Gates:** 12
- **Pain Points:** 480
- **Tools:** 2,267
- **Insights:** 5

### Connection Counts:
- **Total Recommendations:** 2,687
- **Total Connections:** 13,435
- **Inbound Links:** 70 unique sources
- **Outbound Links:** 2,687 unique targets

### RiskWeight Statistics:
- **Average:** 0.90
- **Range:** 0.90 - 0.90 (current data has consistent values)
- **Nodes with ParentID:** 2,764 (100%)

---

## 🎯 Migration Status

### ✅ Completed:
1. **Matrix Location:** All data files identified
2. **Schema Analysis:** Current vs. target schema mapped
3. **Data Transformation:** Migration script created
4. **Shadow Migration:** Preparation script executed (no database writes)

### 📁 Migration Output:
- **File:** `scripts/migration-output/migration-ready.json`
- **Status:** Ready for review
- **Size:** 2,764 transformed nodes with ID, ParentID, RiskWeight

### ⚠️ Next Steps Required:
1. **Database Connection:** Identify rideryourdemons.com database type (Firestore/SQL/other)
2. **Schema Validation:** Compare migration output with existing database schema
3. **Staging Test:** Run migration on test environment first
4. **Front-End Compatibility:** Verify existing front-end settings won't be overwritten
5. **Production Migration:** Execute after validation

---

## 🔍 About the 164,000 Nodes

**Current Reality:** ~18,963 items (nodes + connections)

**Possible Interpretations of "164k":**
1. **Theoretical Maximum:** 12 gates × 40 pain points × 3 tools × ~114 avg connections = ~164k
2. **Future Expansion Target:** Planned matrix size for full deployment
3. **All Combinations:** If counting all possible node-to-node relationship permutations
4. **Search Query Coverage:** Number of search queries the matrix can handle

**Conclusion:** The actual current matrix is ~19k items. The 164k likely refers to a target size or theoretical maximum, not the current state.

---

## 📋 Files Created

1. **`scripts/analyze-matrix-structure.mjs`** - Analysis script
2. **`scripts/shadow-migration.mjs`** - Migration preparation script
3. **`scripts/shadow-migration-plan.md`** - Detailed migration plan
4. **`scripts/migration-output/migration-ready.json`** - Transformed data ready for database

---

## 🚀 Ready for "Kill Move"

The matrix has been located, analyzed, and prepared for migration. The shadow migration script has created a database-ready payload with:
- ✅ ID field (from existing `id`)
- ✅ ParentID field (from `cluster`)
- ✅ RiskWeight field (calculated from resonance + decay)

**Next:** Provide the "Kill Move" script to inject this data into rideryourdemons.com database.
