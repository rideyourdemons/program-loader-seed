/**
 * meters_runner.mjs — Instrumented cluster access + progressive stress test.
 * Uses MetricsCollector and optional in-memory cache. Does NOT materialize
 * full million nodes in memory; samples indices per stage.
 */

import { createMetricsCollector } from "./MetricsCollector.mjs";

const TOTAL_NODES = 1_000_000;
const CACHE_MAX = 5000;
const TRAVERSAL_MODES = {
  anchorOnly: { nodes: 1, depth: 1 },
  "anchor+1hop": { nodes: 3, depth: 2 },
  "anchor+2hop": { nodes: 5, depth: 3 },
};

const collector = createMetricsCollector(10_000);
const cache = new Map();
const cacheKeys = [];

function evictCache() {
  if (cacheKeys.length < CACHE_MAX) return;
  const key = cacheKeys.shift();
  cache.delete(key);
}

function seededRandom(seed) {
  return function next() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

/**
 * Run one instrumented request. Records to collector; uses cache when useCache and !bypassCache.
 */
export function withMetrics(mod, index, traversalMode, useCache, bypassCache) {
  const mode = TRAVERSAL_MODES[traversalMode] || TRAVERSAL_MODES.anchorOnly;
  const nodesTouched = mode.nodes;
  const depth = mode.depth;
  const cacheKey = bypassCache ? null : `${index}-${traversalMode}`;

  const startTime = performance.now();

  if (useCache && !bypassCache && cacheKey && cache.has(cacheKey)) {
    const endTime = performance.now();
    const cached = cache.get(cacheKey);
    collector.record({
      startTime,
      endTime,
      nodesTouched: cached.nodesTouched,
      depth: cached.depth,
      cacheHit: true,
    });
    return { node: cached.node, nodesTouched: cached.nodesTouched, depth: cached.depth, cacheHit: true };
  }

  let node = null;
  const getNode = typeof mod.getNodeForInterface === "function" ? mod.getNodeForInterface : null;
  const getWindow = typeof mod.getVirtualWindow === "function" ? mod.getVirtualWindow : null;

  if (traversalMode === "anchorOnly" && getNode) {
    node = getNode(index);
  } else if ((traversalMode === "anchor+1hop" || traversalMode === "anchor+2hop") && getWindow) {
    const start = Math.max(0, index - (mode.nodes - 1) / 2);
    const windowNodes = getWindow(Math.floor(start), mode.nodes);
    node = windowNodes && windowNodes[0] ? windowNodes[0] : getNode ? getNode(index) : null;
  } else if (getNode) {
    node = getNode(index);
  }

  const endTime = performance.now();
  collector.record({
    startTime,
    endTime,
    nodesTouched,
    depth,
    cacheHit: false,
  });

  if (useCache && !bypassCache && cacheKey && node) {
    cache.set(cacheKey, { node, nodesTouched, depth });
    cacheKeys.push(cacheKey);
    evictCache();
  }

  return { node, nodesTouched, depth, cacheHit: false };
}

/**
 * Run progressive stress: 10k → 100k → 250k → 500k → 1M.
 * Each stage runs for durationPerStageSec at opsPerSecTarget.
 */
export async function runProgressiveStress(config, getMod) {
  const nodeTargets = config.nodeTargets ?? [10_000, 100_000, 250_000, 500_000, 1_000_000];
  const durationPerStageSec = config.durationPerStageSec ?? 20;
  const opsPerSecTarget = config.opsPerSecTarget ?? 50;
  const traversalMode = config.traversalMode ?? "anchor+1hop";
  const useCache = config.useCache !== false;
  const bypassCache = config.bypassCache === true;

  const mod = await getMod();
  if (!mod || typeof mod.getNodeForInterface !== "function") {
    throw new Error("Matrix engine unavailable");
  }

  collector.reset();
  cache.clear();
  cacheKeys.length = 0;

  const stages = [];
  const csvRows = ["stage,nodeTarget,durationSec,opsTotal,avgLatencyMs,p95LatencyMs,throughputOpsPerSec,clusterHitRatePct,avgNodesTouched,avgDepth,memHeapMbStart,memHeapMbEnd,success"];
  const opsPerStage = Math.max(1, Math.floor(opsPerSecTarget * durationPerStageSec));
  const intervalMs = 1000 / opsPerSecTarget;

  const memStart = typeof process !== "undefined" && process.memoryUsage ? process.memoryUsage().heapUsed / 1024 / 1024 : 0;

  for (let s = 0; s < nodeTargets.length; s++) {
    const nodeTarget = Math.min(nodeTargets[s], TOTAL_NODES);
    const rng = seededRandom(42 + s);
    const stageStart = performance.now();
    const stageStartCount = collector.totalRequests;

    for (let i = 0; i < opsPerStage; i++) {
      const index = Math.floor(rng() * nodeTarget);
      withMetrics(mod, index, traversalMode, useCache, bypassCache);
      if (intervalMs > 0 && i < opsPerStage - 1) {
        await new Promise((r) => setTimeout(r, intervalMs));
      }
    }

    const stageEnd = performance.now();
    const stageDurationSec = (stageEnd - stageStart) / 1000;
    const stageCount = collector.totalRequests - stageStartCount;
    const agg = collector.getAggregates(stageStart);
    const memEnd = typeof process !== "undefined" && process.memoryUsage ? process.memoryUsage().heapUsed / 1024 / 1024 : 0;

    const stageResult = {
      stage: s + 1,
      nodeTarget,
      durationSec: stageDurationSec,
      opsTotal: stageCount,
      avgLatencyMs: agg.avgLatencyMs,
      p95LatencyMs: agg.p95LatencyMs,
      throughputOpsPerSec: agg.throughputOpsPerSec,
      clusterHitRatePct: agg.clusterHitRatePct,
      avgNodesTouched: agg.avgNodesTouched,
      avgDepth: agg.avgDepth,
      memHeapMbStart: s === 0 ? memStart : (stages[s - 1]?.memHeapMbEnd ?? memStart),
      memHeapMbEnd: memEnd,
      success: stageCount > 0,
    };
    stages.push(stageResult);
    csvRows.push(
      [s + 1, nodeTarget, stageDurationSec.toFixed(2), stageCount, agg.avgLatencyMs.toFixed(3), agg.p95LatencyMs.toFixed(3), agg.throughputOpsPerSec.toFixed(2), agg.clusterHitRatePct.toFixed(2), agg.avgNodesTouched.toFixed(2), agg.avgDepth.toFixed(2), stageResult.memHeapMbStart.toFixed(2), memEnd.toFixed(2), stageResult.success].join(",")
    );
  }

  return { stages, csvRows, collector };
}

export function getCollector() {
  return collector;
}

export function getCache() {
  return { size: cache.size, max: CACHE_MAX };
}

export function clearCache() {
  cache.clear();
  cacheKeys.length = 0;
}

export function setBypassCache(bypass) {
  // Caller passes bypassCache to withMetrics each time; no global state needed.
}
