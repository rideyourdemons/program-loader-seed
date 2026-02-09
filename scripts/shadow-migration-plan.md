# Shadow Migration Plan: RYD Matrix → rideryourdemons.com

## 🔍 DISCOVERY REPORT

### Matrix Location Found
**Primary Data Sources:**
1. **`public/matrix/resonance-nodes.json`** - 2,764 nodes
   - 12 gates
   - 480 pain points
   - 2,267 tools
   - 5 insights

2. **`public/data/matrix/link-map.json`** - 13,435 connections
   - Recommendations structure: `{ from, to[], cluster, reason, status }`

3. **`public/data/matrix/registry.json`** - 2,764 nodes (duplicate of resonance-nodes)
   - Schema: `{ id, path, title, tags[], cluster, inboundLinks[], outboundLinks[], resonanceScore, lastUpdated, decayScore }`

4. **`RYD_MATRIX/anchors/*.json`** - 12 anchor files
   - Each contains 40 pain points
   - Each pain point references 3 tools from `global_mechanics.json`

### Current Schema Analysis

**Registry Node Schema:**
```javascript
{
  id: string,              // ✅ EXISTS (e.g., "gate::mens-mental-health")
  path: string,            // ✅ EXISTS (e.g., "/gates/mens-mental-health")
  title: string,           // ✅ EXISTS
  tags: Array,             // ✅ EXISTS
  cluster: string,         // ✅ EXISTS (gate/anchor identifier)
  inboundLinks: Array,     // ✅ EXISTS (but empty in current data)
  outboundLinks: Array,    // ✅ EXISTS (but empty in current data)
  resonanceScore: number,  // ✅ EXISTS (0-1 range)
  lastUpdated: object,     // ✅ EXISTS
  decayScore: number       // ✅ EXISTS (0-1 range)
}
```

**Missing Fields (Requested):**
- ❌ `ParentID` - NOT PRESENT (but `cluster` serves similar purpose)
- ❌ `RiskWeight` - NOT PRESENT (but `resonanceScore` + `decayScore` could be combined)

### Delta Analysis: Current vs. Target Schema

**Current State:**
- Nodes: 2,764 unique nodes
- Connections: 13,435 recommendations
- Structure: Flat JSON files
- Storage: Static files in `public/` directory

**Target State (rideryourdemons.com):**
- Database: Likely Firestore (based on `scripts/create-matrix-structure.js`)
- Collections: `gates`, `painPoints`, `tools`, `matrixConnections`
- Schema: Needs `ID`, `ParentID`, `RiskWeight` fields

**Schema Mapping:**
```
Current Field          →  Target Field
─────────────────────────────────────────
id                     →  ID (same)
cluster                →  ParentID (gate/anchor reference)
resonanceScore         →  RiskWeight (or calculate from resonanceScore + decayScore)
path                   →  slug (URL path)
title                  →  title (same)
tags                   →  keywords (same)
inboundLinks           →  relatedNodes[] (populate from link-map)
outboundLinks         →  relatedNodes[] (populate from link-map)
```

### 164,000 Node Calculation

**Current Count:** ~18,963 total items (nodes + connections)

**Possible 164k Sources:**
1. **Theoretical Maximum:** 12 gates × 40 pain points × 3 tools × ~114 connections per node = ~164k
2. **Future Expansion:** Target size for full matrix deployment
3. **All Combinations:** If counting all possible node-to-node relationships

**Note:** The actual current matrix is ~19k items, not 164k. The 164k may refer to:
- A target/planned size
- A calculation of all possible relationships
- A different metric (e.g., search queries, content pages)

## 🎯 MIGRATION STRATEGY

### Phase 1: Schema Transformation
Transform current JSON structure to database-ready format with:
- `ID`: Use existing `id` field
- `ParentID`: Derive from `cluster` field (gate/anchor reference)
- `RiskWeight`: Calculate from `resonanceScore` and `decayScore`

### Phase 2: Data Extraction
1. Read all JSON files
2. Normalize node IDs
3. Build connection graph from `link-map.json`
4. Calculate `RiskWeight` for each node

### Phase 3: Shadow Migration (Non-Destructive)
1. Create new collections in Firestore (or target database)
2. Insert transformed data
3. Validate against existing front-end settings
4. Do NOT overwrite existing data

### Phase 4: Validation
1. Compare node counts
2. Verify connection integrity
3. Test front-end compatibility
4. Check for data loss

## 📋 NEXT STEPS

1. **Confirm Database Type:** Check rideryourdemons.com database structure
2. **Create Migration Script:** Python/Node.js script to transform and inject
3. **Test on Staging:** Run migration on test environment first
4. **Validate Schema:** Ensure compatibility with existing front-end
5. **Execute Migration:** Deploy to production after validation
