/**
 * Substrate Core Engine
 * - Builds and holds the hardened million-node substrate
 * - Seats anchors deterministically across the node space
 * - Exposes safe access helpers with optional Review Mode (Purser) timing guards
 *
 * This is extracted from the FINAL_TEST.mjs proof so the Engine can be reused
 * independently of any specific CLI script or web interface.
 */

const TOTAL_NODES = 1_000_000;

// Internal singleton substrate so we only pay the build cost once per process.
let substrate = null;
let buildMetrics = null;

function seatAnchor(index) {
  // Mirrors the original "ANCHOR_SEATED" logic across the 1M nodes.
  return index % 83_333 === 0;
}

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

  const buildTimeSeconds = ((endBuild - startBuild) / 1000);

  // process.memoryUsage is Node-only; guard to keep this engine portable.
  const heapMb = typeof process !== "undefined" && process.memoryUsage
    ? (process.memoryUsage().heapUsed / 1024 / 1024)
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
 * Safe accessor with optional Review Mode (Purser) timing guard.
 *
 * If reviewMode is enabled and a single node access exceeds maxAccessMs,
 * the slowdown is flagged immediately to stderr without throwing.
 */
export function getNode(index, options = {}) {
  const { reviewMode = false, maxAccessMs = 20 } = options;

  if (!Number.isInteger(index) || index < 0 || index >= TOTAL_NODES) {
    throw new RangeError(`Index ${index} is out of bounds for TOTAL_NODES=${TOTAL_NODES}`);
  }

  if (!substrate) {
    buildSubstrate();
  }

  let startAccess = 0;
  if (reviewMode) {
    startAccess = globalThis.performance?.now
      ? globalThis.performance.now()
      : Date.now();
  }

  const node = substrate[index];

  if (reviewMode) {
    const endAccess = globalThis.performance?.now
      ? globalThis.performance.now()
      : Date.now();
    const deltaMs = endAccess - startAccess;

    if (deltaMs > maxAccessMs) {
      const message =
        `⚠️ Purser Review Mode: node access took ${deltaMs.toFixed(3)}ms ` +
        `(threshold ${maxAccessMs}ms). Check recent interface changes.`;
      if (typeof console !== "undefined" && console.error) {
        console.error(message);
      }
    }
  }

  return node;
}

/**
 * Returns a lightweight read-only view of the current metrics
 * (build time and memory footprint) without exposing the raw array.
 */
export function getMetrics() {
  if (!substrate) {
    return null;
  }
  return { ...buildMetrics };
}

export { TOTAL_NODES };

