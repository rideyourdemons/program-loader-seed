/**
 * Site Controller
 *
 * Bridge layer between the hardened substrate engine and any web/frontend code.
 * - Ensures the million-node substrate is built once per process
 * - Exposes safe, read-only accessors for the frontend
 * - Preserves Purser / Review Mode constraints on node access latency
 */

import { buildSubstrate, getNode, getMetrics, TOTAL_NODES } from "./core/substrate_core.mjs";

/**
 * Initialize the substrate engine.
 * Call this during server startup or before wiring the controller into routes.
 */
export function initSubstrateEngine() {
  const { metrics } = buildSubstrate();

  if (metrics && typeof console !== "undefined" && console.log) {
    const timeStr = metrics.buildTimeSeconds?.toFixed
      ? metrics.buildTimeSeconds.toFixed(3)
      : String(metrics.buildTimeSeconds);
    const memStr = typeof metrics.heapMb === "number"
      ? metrics.heapMb.toFixed(2)
      : "n/a";

    console.log("🚀 Substrate Engine Initialized");
    console.log(`   Nodes       : ${metrics.totalNodes.toLocaleString()}`);
    console.log(`   Build Time  : ${timeStr}s (target ~0.279s)`);
    console.log(`   Peak RAM    : ${memStr} MB (target ~210MB)`);
  }

  return metrics;
}

/**
 * Basic controller-level accessor that always uses Review Mode / Purser
 * to ensure the interface never silently drifts beyond the 0.02s target.
 */
export function getNodeForInterface(index, options = {}) {
  const {
    // Force Review Mode on by default at the controller boundary.
    reviewMode = true,
    maxAccessMs = 20,
  } = options;

  return getNode(index, { reviewMode, maxAccessMs });
}

/**
 * Example helper to feed a small “virtual window” of nodes to a frontend.
 * This mirrors the original FINAL_TEST.mjs virtual window behavior.
 */
export function getVirtualWindow(startIndex, windowSize = 3, options = {}) {
  if (!Number.isInteger(startIndex) || startIndex < 0 || startIndex >= TOTAL_NODES) {
    throw new RangeError(`startIndex ${startIndex} is out of bounds for TOTAL_NODES=${TOTAL_NODES}`);
  }

  const nodes = [];
  const limit = Math.min(startIndex + windowSize, TOTAL_NODES);
  for (let i = startIndex; i < limit; i++) {
    nodes.push(getNodeForInterface(i, options));
  }
  return nodes;
}

/**
 * Lightweight metrics passthrough for status endpoints or admin UIs.
 */
export function getSubstrateStatus() {
  return {
    totalNodes: TOTAL_NODES,
    metrics: getMetrics(),
  };
}

