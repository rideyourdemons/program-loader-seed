# Matrix Engine & One Million Nodes — Guide for BookLM / Notebook

*Drop this into BookLM or a notebook to interact with an AI about the Matrix system, substrate, and million-node testing.*

---

## What Is the Matrix?

The **Matrix** is the data engine at the heart of Ride Your Demons. It has two distinct layers:

### 1. Content Matrix (User-Facing)

The **Self-Resonating SEO Matrix** connects mental health content:

- **Gates** — Categories (Men's Mental Health, Women's Mental Health, Addiction Recovery, Fathers & Sons, Grief & Loss, etc.)
- **Pain Points** — Specific challenges (e.g., "How do I stop feeling numb?", "How do I overcome anxiety?")
- **Tools** — Step-by-step techniques mapped to pain points
- **Research** — Citations and evidence for each tool

**Flow:**
```
User Search (Pain Point)
    → Gate/Anchor (Categorization)
    → Three Self-Help Tools
    → Cited Research
    → Loop Back (Related Pain Points, Tools, Research)
```

This creates a "self-resonating" loop: users move from pain point → tools → research → related content, strengthening SEO and engagement.

### 2. Substrate / One Million Nodes (Backend)

The **substrate** is a **1,000,000-node in-memory data structure** — the engine's core. It is:

- **Pure data** — No HTTP, no UI, no DOM
- **In RAM** — Built once per process
- **Anchor-seated** — Every 83,333rd node is an "anchor" (status: `ANCHOR_SEATED`)
- **Protective** — UI never touches raw substrate memory; all access goes through **SightBridge**

---

## Surgical Decoupling: Why UI Never Touches the Substrate

**Rule:** The Visual Sight (UI/DOM) and the Matrix Substrate are strictly separated.

| Layer | Role | Can Touch |
|-------|------|-----------|
| **MatrixCore** | Holds the 1M-node substrate in RAM | Nothing external |
| **SightBridge** | Clean-pipe interface | MatrixCore (internal only) |
| **UI / Sight** | Renders pages, handles user input | SightBridge only |

**Safety features:**
- **Circuit breaker** — `triggerEmergencyHalt()` severs all Matrix access if a leak is detected
- **No raw references** — SightBridge returns safe copies of nodes, never the substrate array
- **DOM tripwire** — If a leak is detected, the bridge physically severs access

---

## Core Modules

| Module | Purpose |
|--------|---------|
| `core/MatrixCore.mjs` | Builds and holds the 1M-node substrate. Defines `buildSubstrate()`, `getNode()`, `getMetrics()`. |
| `core/SightBridge.mjs` | Clean-pipe interface. `requestNode()`, `requestWindow()`, `initMatrix()`, `triggerEmergencyHalt()`. |
| `core/substrate_core.mjs` | Legacy substrate; can be retired in favor of MatrixCore. |
| `core/meters_runner.mjs` | Instrumented cluster access + progressive stress test. Does NOT materialize full 1M nodes; samples indices per stage. |
| `core/shard_manager.mjs` | When cluster exceeds 1M nodes, archives to shards and re-initializes from seed nodes. |
| `site_controller.mjs` | HTTP server layer; uses SightBridge to expose Matrix to the API. |

---

## One Million Nodes: How It Works

### Node Structure

Each node in the substrate has:
- `id` — Index (0 to 999,999)
- `ref` — Hex reference (e.g., `NODE_0x186A0`)
- `status` — `"ACTIVE"` or `"⚓ ANCHOR_SEATED"` (every 83,333rd node)

### Anchor Seating

```javascript
// Every 83,333rd node is an anchor
function seatAnchor(index) {
  return index % 83_333 === 0;
}
```

Anchors are structural markers in the graph; they help with clustering and traversal.

### Build

- **When:** Once per process (lazy init)
- **What:** Array of 1,000,000 objects
- **Metrics:** Build time (seconds), heap usage (MB)

---

## Testing the One Million Nodes

### Progressive Stress Test

The **meters runner** runs a **progressive stress test** across the substrate:

**Stages:** 10k → 100k → 250k → 500k → **1M nodes**

**Per stage:**
- Duration: ~20 seconds (configurable)
- Target: ~50 ops/sec
- Traversal modes: `anchorOnly`, `anchor+1hop`, `anchor+2hop`
- Metrics: latency (avg, p95), throughput, cache hit rate, nodes touched, heap usage

**Run via:**
1. **Web UI:** Visit `http://localhost:3000/meters` and click "Run Progressive Stress"
2. **API:** `POST /api/meters/run` with body:
   ```json
   {
     "nodeTargets": [10000, 100000, 250000, 500000, 1000000],
     "durationPerStageSec": 20,
     "opsPerSecTarget": 50,
     "traversalMode": "anchor+1hop",
     "useCache": true,
     "bypassCache": false
   }
   ```

### Meters Dashboard

- **URL:** `/meters`
- **Health:** `GET /api/meters/health` — substrate status, heap, node count
- **Run stress:** `POST /api/meters/run` — starts progressive stress
- **Export:** CSV download of latency, throughput, success per stage

---

## Infinite Scaling: Shard Manager

When the active cluster exceeds **1,000,000 nodes**:

1. **Archive** — Current state written to `/shards/shard-{timestamp}.json`
2. **Re-initialize** — New active matrix seeded from core **Seed Nodes** (12 Gates)
3. **Federated queries** — `federatedQuery()` searches across all archived shards

**API:**
- `GET /api/shard/list` — List archived shards
- `GET /api/shard/:shardId` — Load a specific shard

---

## Matrix API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/nodes` | GET | Legacy node access |
| `/api/matrix/node` | GET | Single node by index (with optional metrics, cache) |
| `/api/matrix/window` | GET | Window of nodes (start, size) |
| `/api/matrix/metrics` | GET | Build metrics (totalNodes, buildTimeSeconds, heapMb) |
| `/api/matrix/emergency-halt` | GET | Trigger circuit breaker; sever Matrix access |
| `/api/meters/health` | GET | Substrate health, heap, readiness |
| `/api/meters/run` | POST | Run progressive stress test |

---

## Metrics Collector

The `meters_runner` uses a **MetricsCollector** to record:
- Start/end time per request
- Nodes touched per request
- Cache hit/miss
- Latency (avg, p95)
- Throughput (ops/sec)
- Cluster hit rate

Results are aggregated per stage and written to CSV for analysis.

---

## Comparison: Content Matrix vs. Substrate

| Aspect | Content Matrix (SEO) | Substrate (1M Nodes) |
|--------|----------------------|------------------------|
| **Purpose** | Connect pain points → tools → research | High-scale data engine |
| **Data** | gates.json, pain-points.json, tools.json | In-memory array of 1M nodes |
| **Used by** | insights.html, matrix-expander.js | site_controller, meters_runner |
| **Scaling** | Add more gates/pain points/tools | Shard when > 1M nodes |

---

## Questions to Ask the AI

- "What is the difference between MatrixCore and SightBridge?"
- "How does the progressive stress test work?"
- "What happens when we exceed 1 million nodes?"
- "What are anchor nodes and why do they matter?"
- "How do I run the meters dashboard?"
- "What is surgical decoupling and why is it important?"

---

*This document describes the Matrix engine and million-node testing for the Ride Your Demons platform.*
