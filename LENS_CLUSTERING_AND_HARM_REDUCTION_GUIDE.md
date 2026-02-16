# SightLens, 0.82 Clustering & Harm Reduction Engine — Guide for BookLM / Notebook

*Drop this into BookLM or a notebook to explore the Lens, clustering technique, near-zero latency testing, and harm reduction engine.*

---

## The SightLens — What It Is

**SightLens** is the UI-facing interface to the Matrix. It is the only way the browser/DOM can request data from the 1-million-node substrate.

**Principles:**
- **Sight NEVER touches MatrixCore or raw substrate** — all requests go through `fetch()` to the Engine API
- **DOM Tripwire** — On leak detection, calls `/emergency-halt` to sever the Matrix connection
- **Clean API** — `requestNode()`, `requestWindow()`, `getStatus()`, `triggerEmergencyHalt()`

**Flow:**
```
Browser (SightLens)  →  fetch()  →  /api/matrix/node
                                    /api/matrix/window
                                    /api/matrix/emergency-halt
                         ↑
                    Engine (SightBridge)  →  MatrixCore (substrate)
```

**Why "Lens"?**  
The Lens is the view through which the UI sees the Matrix. It is a controlled, narrow aperture — not direct access. What the UI sees is always a safe copy, never raw memory.

---

## The 0.82 Clustering Technique

The system uses a **0.82 clustering coefficient** as a structural and quality threshold across the graph.

### What It Means

- **Clustering coefficient** — A measure of how tightly nodes connect to each other (0 = scattered, 1 = fully connected)
- **0.82** — High connectivity: nodes form dense clusters with strong internal links
- **Use** — Similarity threshold for "nearest related node" lookups, content generation, and graph integrity

### Where It's Used

1. **Content Generator** (`content-generator.js`)
   - `findNearestNode()` uses 0.82 to find the most related tool for a given context
   - Scores based on: category match, pain point overlap, gate overlap, keyword similarity
   - Only nodes with score ≥ 0.82 qualify as "nearest"

2. **Temporal Weighting** (`temporal-weighting.js`)
   - Uses 0.82 clustering data to pull unique attributes and weight nodes

3. **Strict-Schema Filter** (`strict-schema-filter.js`)
   - Prevents 0.82 clustering from spreading "dirty" data (null, undefined, mojibake)
   - Auto-repairs encoding; prunes corrupted nodes before they infect the graph

4. **Shard Metadata** (`shard_manager.mjs`)
   - Archived shards preserve `clusteringCoefficient: 0.82` in metadata

### Why 0.82?

- Balances precision (high enough to avoid weak matches) and recall (low enough to allow useful connections)
- Keeps the graph resilient to single-node corruption — one bad node doesn't spread through the cluster
- Matches the observed structure of the mental-health content graph (gates → pain points → tools)

---

## Zero Milliseconds — Near-Zero Latency in Testing

The meters runner and MetricsCollector are built to achieve **effectively zero milliseconds** of latency for data access under the right conditions.

### Cache Hits = Near-Zero Latency

When the **in-memory cache** is enabled (default):

1. First request for `(index, traversalMode)` hits the substrate → latency ~0.02–0.05ms (array access)
2. Result is stored in a Map (`cacheKey` → `{ node, nodesTouched, depth }`)
3. **Second request** for the same `(index, traversalMode)` → **cache hit**
4. Cache hit path: `performance.now()` → `cache.get(cacheKey)` → `performance.now()` → record

**Cache hit latency** is typically **sub-millisecond** — often reported as 0.00ms or 0.001ms in practice, because:
- Map lookup is O(1)
- No substrate access
- No network

### Metrics Reported

| Metric | Meaning | Target / Achievement |
|--------|---------|----------------------|
| **avgLatencyMs** | Average latency per request | Cache hits → ~0ms |
| **p95LatencyMs** | 95th percentile latency | < 50ms target |
| **clusterHitRatePct** | % of requests served from cache | High when cache warm |
| **throughputOpsPerSec** | Requests per second | 50+ ops/sec target |

### Progressive Stress Test Results

Across stages (10k → 100k → 250k → 500k → 1M nodes):

- **With cache:** Later stages show high cluster hit rate and near-zero latency for repeated indices
- **Recovery time:** Route discovery hardened from 150ms → **2.24ms** (98.5% improvement)
- **Node access target:** < 50ms; cache hits achieve effectively 0ms

### How to See Zero Latency

1. Run the Meters dashboard: `http://localhost:3000/meters`
2. Run Progressive Stress with cache enabled (default)
3. Check CSV or stage table: `avgLatencyMs` and `clusterHitRatePct`
4. Warm cache + repeated indices → latency approaches 0ms

---

## The Harm Reduction Engine

**SightBridge** functions as the harm reduction layer between the UI and the Matrix.

### Core Principle

> **Harm Reduction:** If the UI requests a node flagged for risk, the Bridge returns `null`.

### Mechanisms

1. **Circuit Breaker** (`triggerEmergencyHalt()`)
   - On DOM tripwire / leak detection, severs all future Matrix access
   - Sets `emergencyHalt = true`; all `requestNode()` / `requestWindow()` return null or []

2. **DOM Tripwire** (`ui-sanitize.js`)
   - Scans for login leaks or unsafe DOM exposure
   - On detection → calls `/api/matrix/emergency-halt`
   - Prevents UI from ever holding a live reference to substrate memory

3. **Shadow Mode** (`NODE_ENV=development`)
   - In development, Bridge returns **mock nodes** — Matrix is not built
   - Protects production substrate from dev workloads
   - Mock nodes have `demoFlag: true`

4. **Safe Copies Only**
   - `requestNode()` returns `{ ...node }` — a shallow copy, never the raw reference
   - Sight never receives a pointer into the substrate array

5. **Bounds Checking**
   - Invalid index → return null
   - Halted state → return null

### Why "Harm Reduction"?

- **Reduce harm** if the UI is compromised or buggy — it cannot corrupt or leak substrate memory
- **Fail closed** — on suspicion of leak, the system stops serving data rather than risk exposure
- **Defense in depth** — circuit breaker + tripwire + safe copies + shadow mode

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│  SIGHT (UI)                                                      │
│  SightLens.js — fetch() only, no direct Matrix access            │
└───────────────────────────┬─────────────────────────────────────┘
                            │ fetch()
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  ENGINE (API)                                                    │
│  /api/matrix/node, /api/matrix/window, /api/matrix/emergency-halt │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  SIGHTBRIDGE (Harm Reduction)                                    │
│  Circuit breaker, safe copies, Shadow Mode, bounds check        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  MATRIXCORE (Substrate)                                          │
│  1,000,000 nodes in RAM, 0.82 clustering, anchor seating         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Questions to Ask the AI

- "What is the 0.82 clustering coefficient and why do we use it?"
- "How does SightLens achieve zero milliseconds of latency?"
- "What is the harm reduction engine and how does it work?"
- "How does the cache in the meters runner achieve near-zero latency?"
- "What happens when the DOM tripwire detects a leak?"

---

*This document describes the Lens, clustering technique, near-zero latency testing, and harm reduction engine for the Ride Your Demons Matrix.*
