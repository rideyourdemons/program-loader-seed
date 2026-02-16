/**
 * SightLens.js — The UI Interface
 *
 * Surgical Decoupling: Sight NEVER touches MatrixCore or raw substrate.
 * - All data requests go through fetch() to the Engine API
 * - DOM Tripwire: On leak detection, calls /emergency-halt to sever Matrix connection
 * - Clean API: requestNode(), requestWindow(), getStatus()
 */

(function () {
  "use strict";

  const NODE_URL = (typeof window !== "undefined" && window.RYD_MATRIX_NODE_URL) || "/api/matrix/node";
  const HALT_URL = (typeof window !== "undefined" && window.RYD_MATRIX_HALT_URL) || "/api/matrix/emergency-halt";

  /**
   * Request a single node from the Matrix. Returns null if Bridge is halted or error.
   */
  async function requestNode(index) {
    try {
      const res = await fetch(`${NODE_URL}${NODE_URL.includes("?") ? "&" : "?"}index=${index}`, {
        method: "GET",
        mode: "cors",
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.node ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Request a window of nodes.
   */
  async function requestWindow(startIndex, size = 3) {
    const nodes = [];
    for (let i = 0; i < size; i++) {
      const n = await requestNode(startIndex + i);
      if (n) nodes.push(n);
    }
    return nodes;
  }

  /**
   * DOM Tripwire: Call when leak detected. Physically severs Matrix connection.
   */
  function triggerEmergencyHalt() {
    fetch(HALT_URL, { method: "GET", mode: "cors" }).catch(
      () => {}
    );
  }

  window.SightLens = {
    requestNode,
    requestWindow,
    triggerEmergencyHalt,
  };

  if (window.RYD_UI && window.RYD_UI.scanForLoginLeaks) {
    const originalScan = window.RYD_UI.scanForLoginLeaks;
    window.RYD_UI.scanForLoginLeaks = function () {
      originalScan.call(window.RYD_UI);
    };
  }
})();
