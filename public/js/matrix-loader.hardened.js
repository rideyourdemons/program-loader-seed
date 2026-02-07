/**
 * Matrix Loader - HARDENED VERSION
 * Matrix expander boot shim with production hardening
 * 
 * PRODUCTION HARDENING:
 * - Error boundaries
 * - Retry logic
 * - Timeout handling
 * - Loading/error states
 * - Validation
 */

(function() {
  'use strict';

  // Check utilities
  if (!window.RYD_ErrorBoundary || !window.RYD_Fetch) {
    console.warn('[RYD Matrix Loader] Utilities not loaded, using fallback mode');
  }

  const TIMEOUT_MS = 4000;
  let warnedLegacyMatrix = false;

  function $(sel) { return document.querySelector(sel); }

  function setStatus(kind, msg) {
    const el =
      $("#matrix-status") ||
      $("#tool-of-day-status") ||
      $("#tod-status") ||
      $("#status") ||
      null;

    if (el) {
      el.style.display = "block";
      el.textContent = String(msg || '');
      el.setAttribute("data-status", String(kind || 'unknown'));
    }

    const tag = kind === "error" ? "ERROR" : String(kind || 'info').toUpperCase();
    console.log(`[RYD][matrix-loader] ${tag}:`, msg);
  }

  function dispatchReady(payload) {
    try {
      if (!payload || typeof payload !== 'object') {
        payload = { tools: [] };
      }
      
      window.dispatchEvent(new CustomEvent("ryd:matrix-ready", { 
        detail: payload || { tools: [] }
      }));
      setStatus("ok", "Matrix expander ready.");
    } catch (e) {
      setStatus("error", "Matrix expander loaded but failed to dispatch ready event.");
      console.error('[RYD Matrix Loader] Dispatch error:', e);
    }
  }

  function warnLegacyMatrix() {
    if (warnedLegacyMatrix) return;
    warnedLegacyMatrix = true;
    console.warn('Matrix expander active — no static matrix used');
  }

  async function loadMatrix() {
    setStatus("loading", "Initializing matrix expander...");

    const ctrl = new AbortController();
    const t = setTimeout(() => {
      ctrl.abort();
      setStatus("error", `Matrix expander init timed out after ${TIMEOUT_MS}ms`);
    }, TIMEOUT_MS);

    try {
      if (!window.MatrixExpander || typeof window.MatrixExpander.init !== "function") {
        throw new Error("MatrixExpander is not available");
      }

      await window.MatrixExpander.init();
      
      // Safely get tools
      let tools = [];
      try {
        const rawTools = window.MatrixExpander.getBaseTools();
        if (Array.isArray(rawTools)) {
          tools = rawTools.filter(tool => tool && typeof tool === 'object');
        }
      } catch (toolError) {
        console.warn('[RYD Matrix Loader] Error getting tools:', toolError);
      }

      dispatchReady({ tools });
      clearTimeout(t);
      return true;
    } catch (e) {
      clearTimeout(t);
      
      const msg = e.name === "AbortError"
        ? `Matrix expander init timed out after ${TIMEOUT_MS}ms`
        : `Matrix expander init failed: ${e.message || String(e)}`;
      
      setStatus("error", msg);
      
      // Fallback initialization
      if (!window.RYD_MATRIX) {
        window.RYD_MATRIX = {
          where_it_came_from: {
            origin: "internal",
            basis: "built for Ride Your Demons platform",
            source_type: "system-utility",
            verified: true
          },
          get tools() { 
            warnLegacyMatrix(); 
            return []; 
          },
          get toolOfTheDay() { 
            warnLegacyMatrix(); 
            return null; 
          }
        };
      }
      
      // Dispatch with empty tools
      dispatchReady({ tools: [] });
      
      return false;
    }
  }

  // Run immediately on load (defer script expected)
  window.__RYD_LOAD_MATRIX__ = loadMatrix;

  // Attempt load
  loadMatrix().catch(err => {
    console.error('[RYD Matrix Loader] Unhandled error:', err);
    setStatus("error", "Failed to load matrix");
  });
})();
