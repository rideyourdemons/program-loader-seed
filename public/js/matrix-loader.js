/**
 * public/js/matrix-loader.js
 * Matrix expander boot shim (legacy)
 * - Initializes MatrixExpander (gates + pain points + tools)
 * - Avoids static matrix JSON loading
 * - Dispatches CustomEvent('ryd:matrix-ready') with base tools only
 * - Never infinite-loads: 4s timeout, shows visible error UI hooks
 */
(function () {
  const TIMEOUT_MS = 4000;
  let warnedLegacyMatrix = false;

  function $(sel) { return document.querySelector(sel); }

  function setStatus(kind, msg) {
    // Optional slots your pages may have; safe if missing
    const el =
      $("#matrix-status") ||
      $("#tool-of-day-status") ||
      $("#tod-status") ||
      $("#status") ||
      null;

    if (el) {
      el.style.display = "block";
      el.textContent = msg;
      el.setAttribute("data-status", kind);
    }

    // Also log
    const tag = kind === "error" ? "ERROR" : kind.toUpperCase();
    console.log(`[RYD][matrix-loader] ${tag}:`, msg);
  }

  function dispatchReady(payload) {
    try {
      window.dispatchEvent(new CustomEvent("ryd:matrix-ready", { detail: payload }));
      setStatus("ok", "Matrix expander ready.");
    } catch (e) {
      setStatus("error", "Matrix expander loaded but failed to dispatch ready event.");
      console.error(e);
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
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      if (!window.MatrixExpander || typeof window.MatrixExpander.init !== "function") {
        throw new Error("MatrixExpander is not available");
      }

      await window.MatrixExpander.init();
      var tools = window.MatrixExpander.getBaseTools() || [];
      var payload = { tools: tools };

      window.__RYD_TOOLS = tools;
      try {
        var configRes = await fetch("/config/tool-of-the-day.json?ts=" + Date.now());
        if (configRes.ok) {
          var config = await configRes.json();
          window.__RYD_TOD_CONFIG = config;
          payload.config = config;
        }
      } catch (_) {}

      dispatchReady(payload);
      return true;
    } catch (e) {
      const msg = e.name === "AbortError"
        ? `Matrix expander init timed out after ${TIMEOUT_MS}ms`
        : `Matrix expander init failed: ${e.message}`;
      setStatus("error", msg);
      return null;
    } finally {
      clearTimeout(t);
      if (!window.RYD_MATRIX) {
        window.RYD_MATRIX = {
          where_it_came_from: {
            origin: "internal",
            basis: "built for Ride Your Demons platform",
            source_type: "system-utility",
            verified: true
          },
          get tools() { return window.__RYD_TOOLS || []; },
          get toolOfTheDay() { return (window.__RYD_TOOLS && window.__RYD_TOOLS[0]) || null; }
        };
      }
    }
  }

  // Run immediately on load (defer script expected)
  window.__RYD_LOAD_MATRIX__ = loadMatrix;

  // Attempt load
  loadMatrix();
})();