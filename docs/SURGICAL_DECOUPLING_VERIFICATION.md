# Surgical Decoupling Verification Log

**Date:** 2025-02-11  
**Status:** Complete

---

## 1. Separation Confirmed

### Matrix (IP — Intellectual Property)
- **File:** `core/MatrixCore.mjs`
- **Role:** 1,000,000-node data substrate, anchor seating, memory-managed node access
- **Exports:** `buildSubstrate`, `getNode`, `getMetrics`, `TOTAL_NODES`
- **No HTTP, no UI, no DOM** — pure data engine

### Sight (UI)
- **File:** `public/js/SightLens.js`
- **Role:** Client-side UI interface
- **API:** `requestNode(index)`, `requestWindow(startIndex, size)`, `triggerEmergencyHalt()`
- **Never imports MatrixCore** — all requests via fetch to Engine API

### Bridge
- **File:** `core/SightBridge.mjs`
- **Role:** Clean-pipe interface between Sight and Matrix
- **Features:** Circuit Breaker, Shadow Mode (dev), DOM Tripwire integration
- **Sight never touches raw substrate** — only safe copies returned

### Engine (HTTP Server)
- **File:** `engine.mjs`
- **Role:** Exposes SightBridge over HTTP
- **Endpoints:** `GET /node?index=N`, `GET /emergency-halt`

---

## 2. Architecture

```
SightLens.js (Browser)  →  fetch()  →  engine.mjs  →  SightBridge  →  MatrixCore
                               ↑                         ↑
                        /emergency-halt            Circuit Breaker
```

---

## 3. Performance Targets

| Metric              | Target   | How to Verify                    |
|---------------------|----------|----------------------------------|
| Matrix build time   | < 0.2s   | `node scripts/benchmark-matrix.mjs` |
| Peak RAM            | < 100MB  | Same script                      |
| Node access         | < 50ms   | Purser flag in engine logs       |

---

## 4. Run Verification

```bash
node scripts/benchmark-matrix.mjs
```

Expected output: `ALL BENCHMARKS PASSED`

---

## 5. Harm Reduction

- **Circuit Breaker:** `triggerEmergencyHalt()` in SightBridge severs all future requests
- **DOM Tripwire:** `ui-sanitize.js` calls `/emergency-halt` on leak detection
- **Shadow Mode:** In `NODE_ENV=development`, Bridge returns mock nodes — Matrix not built

---

## 6. File Map

| File                 | Layer    | Purpose                           |
|----------------------|----------|-----------------------------------|
| `core/MatrixCore.mjs`| Matrix   | IP — leasable data engine         |
| `core/SightBridge.mjs`| Bridge  | Clean-pipe, circuit breaker       |
| `engine.mjs`         | Server   | Standalone HTTP API (port 3001)   |
| `server.cjs`         | Server   | Main RYD server; `/api/matrix/*` for rideyourdemons.com |
| `public/js/SightLens.js` | Sight | UI interface (fetch to Engine)    |
| `core/substrate_core.mjs` | Legacy | Can be retired; use MatrixCore   |

---

## 7. Ride Your Demons Production

On **rideyourdemons.com**, the Matrix API is served same-origin (no separate Engine on 3001):

- `GET /api/matrix/node?index=N` — single node (via SightBridge)
- `GET /api/matrix/emergency-halt` — circuit breaker
- `GET /api/matrix/window?start=N&size=M` — virtual window

Client scripts use `/api/matrix/*` by default. Override with `window.RYD_MATRIX_API_BASE = 'http://localhost:3001'` for standalone Engine in dev.

---

## 8. Decoupling Complete

- [x] Matrix (MatrixCore) isolated from Sight
- [x] Bridge (SightBridge) with Circuit Breaker
- [x] Sight (SightLens) uses only fetch — no direct Matrix access
- [x] Engine uses SightBridge, not substrate_core
- [x] Benchmark script and verification log created
- [x] Same-origin Matrix API on rideyourdemons.com (no Engine on 3001 required)
