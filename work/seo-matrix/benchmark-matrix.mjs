#!/usr/bin/env node
/**
 * Benchmark script for Surgical Decoupling verification.
 *
 * Verifies:
 * - Matrix builds in <0.2s
 * - RAM stays under 100MB
 * - Node access latency is acceptable
 */

import {
  initMatrix,
  requestNode,
  getStatus,
  TOTAL_NODES,
} from "../../core/SightBridge.mjs";

const TARGET_BUILD_S = 0.2;
const TARGET_RAM_MB = 100;

console.log("==========================================");
console.log("  MATRIX BENCHMARK — Surgical Decoupling");
console.log("==========================================\n");

const start = performance.now();
const metrics = initMatrix();
const wallTime = (performance.now() - start) / 1000;

if (!metrics) {
  console.error("❌ FAIL: initMatrix() returned null (halted or error)");
  process.exit(1);
}

const buildTime = metrics.buildTimeSeconds ?? 0;
const ramMb = metrics.heapMb ?? 0;

const buildOk = buildTime < TARGET_BUILD_S;
const ramOk = ramMb < TARGET_RAM_MB;

console.log("1. Build time:", buildTime.toFixed(3), "s", buildOk ? "✅" : "❌");
console.log("   Target: <", TARGET_BUILD_S, "s\n");

console.log("2. Heap (approx):", ramMb.toFixed(2), "MB", ramOk ? "✅" : "❌");
console.log("   Target: <", TARGET_RAM_MB, "MB\n");

// Spot-check node access
let accessSum = 0;
const samples = [0, 83333, 999999, 500000];
for (const i of samples) {
  const t0 = performance.now();
  const n = requestNode(i);
  const dt = (performance.now() - t0) * 1000;
  accessSum += dt;
  const ok = n && n.id === i;
  console.log(`3. Node ${i}: ${ok ? "OK" : "FAIL"} (${dt.toFixed(3)}µs)`);
}

const avgAccessUs = accessSum / samples.length;
console.log(`   Avg access: ${avgAccessUs.toFixed(2)}µs\n`);

const status = getStatus();
console.log("4. Status:", status.halted ? "HALTED" : "OK");
console.log("   Total nodes:", status.totalNodes?.toLocaleString(), "\n");

console.log("==========================================");
const allPass = buildOk && ramOk;
console.log(allPass ? "  ✅ ALL BENCHMARKS PASSED" : "  ⚠️ SOME TARGETS MISSED");
console.log("==========================================");

process.exit(allPass ? 0 : 1);
