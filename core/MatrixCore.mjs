/**
 * MatrixCore.mjs — THE IP (Intellectual Property)
 *
 * Surgical Decoupling: This module contains ONLY the data engine.
 * - 1,000,000-node substrate in RAM
 * - Anchor seating logic
 * - Memory-managed node access
 * - NO HTTP, NO UI, NO DOM — pure data substrate
 *
 * Leasable asset. Sight/UI must never import this directly.
 * All access goes through SightBridge.
 */

const TOTAL_NODES = 1_000_000;

let substrate = null;
let buildMetrics = null;

function seatAnchor(index) {
  return index % 83_333 === 0;
}

/**
 * Build the physical substrate. Called once per process.
 */
export function buildSubstrate() {
  if (substrate) {
    return { substrate, metrics: buildMetrics };
  }

  const startBuild = globalThis.performance?.now
    ? globalThis.performance.now()
    : Date.now();

  const localSubstrate = new Array(TOTAL_NODES);
  for (let i = 0; i < TOTAL_NODES; i++) {
    localSubstrate[i] = {
      id: i,
      ref: `NODE_0x${i.toString(16).toUpperCase()}`,
      status: seatAnchor(i) ? "⚓ ANCHOR_SEATED" : "ACTIVE",
    };
  }

  const endBuild = globalThis.performance?.now
    ? globalThis.performance.now()
    : Date.now();

  const buildTimeSeconds = (endBuild - startBuild) / 1000;
  const heapMb =
    typeof process !== "undefined" && process.memoryUsage
      ? process.memoryUsage().heapUsed / 1024 / 1024
      : null;

  substrate = localSubstrate;
  buildMetrics = {
    totalNodes: TOTAL_NODES,
    buildTimeSeconds,
    heapMb,
  };

  return { substrate, metrics: buildMetrics };
}

/**
 * Safe node accessor. Internal use only; SightBridge wraps this.
 */
export function getNode(index, options = {}) {
  const { reviewMode = false, maxAccessMs = 20 } = options;

  if (!Number.isInteger(index) || index < 0 || index >= TOTAL_NODES) {
    throw new RangeError(
      `Index ${index} is out of bounds for TOTAL_NODES=${TOTAL_NODES}`
    );
  }

  if (!substrate) {
    buildSubstrate();
  }

  const node = substrate[index];

  if (reviewMode) {
    const endAccess = globalThis.performance?.now
      ? globalThis.performance.now()
      : Date.now();
    // Timing guard would run here
  }

  return node;
}

export function getMetrics() {
  if (!substrate) return null;
  return { ...buildMetrics };
}

export { TOTAL_NODES };
