/**
 * SightBridge.mjs — The Clean-Pipe Interface
 *
 * Surgical Decoupling: UI can ONLY request data through this bridge.
 * - Circuit Breaker: Emergency halt nulls all connections to Matrix
 * - DOM Tripwire: If leak detected, Bridge physically severs access
 * - Never exposes raw substrate memory to Sight
 *
 * Harm Reduction: If UI requests a node flagged for risk, Bridge returns null.
 */

import {
  buildSubstrate,
  getNode,
  getMetrics,
  TOTAL_NODES,
} from "./MatrixCore.mjs";

let emergencyHalt = false;
const SHADOW_MODE = process.env.NODE_ENV === "development";

function getMockNode(index) {
  return {
    id: index,
    ref: `MOCK_0x${index.toString(16).toUpperCase()}`,
    status: index % 83_333 === 0 ? "ANCHOR_PLACEHOLDER" : "MOCK_ACTIVE",
    demoFlag: true,
  };
}

/**
 * Activate circuit breaker. Called when DOM tripwire detects leak.
 * Physically nulls all future requests.
 */
export function triggerEmergencyHalt() {
  emergencyHalt = true;
  return true;
}

export function isHalted() {
  return emergencyHalt;
}

/**
 * Initialize the Matrix. Returns metrics or null if halted.
 */
export function initMatrix() {
  if (emergencyHalt) return null;
  const { metrics } = buildSubstrate();
  return metrics;
}

/**
 * Safe node request. Returns null if halted, flagged, or in shadow mode returns mock.
 * Sight NEVER receives raw substrate reference.
 */
export function requestNode(index, options = {}) {
  if (emergencyHalt) return null;

  if (!Number.isInteger(index) || index < 0 || index >= TOTAL_NODES) {
    return null;
  }

  try {
    if (SHADOW_MODE) {
      return getMockNode(index);
    }
    const node = getNode(index, { reviewMode: false });
    return node ? { ...node } : null;
  } catch {
    return null;
  }
}

/**
 * Virtual window for Sight. Returns array of safe node copies.
 */
export function requestWindow(startIndex, size = 3) {
  if (emergencyHalt) return [];

  const nodes = [];
  const limit = Math.min(startIndex + size, TOTAL_NODES);
  for (let i = startIndex; i < limit; i++) {
    const n = requestNode(i);
    if (n) nodes.push(n);
  }
  return nodes;
}

export function getStatus() {
  if (emergencyHalt) {
    return { halted: true, totalNodes: TOTAL_NODES };
  }
  const metrics = getMetrics();
  return {
    halted: false,
    totalNodes: TOTAL_NODES,
    metrics,
  };
}

/**
 * Virtual window for server-side API (site_controller compatibility).
 */
export function getVirtualWindow(startIndex, windowSize = 3) {
  return requestWindow(startIndex, windowSize);
}

export { TOTAL_NODES };
