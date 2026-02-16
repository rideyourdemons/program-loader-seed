// public/js/matrix-boot.js
(async function () {
  const log = (...a) => console.log("[RYD_MATRIX]", ...a);
  const warn = (...a) => console.warn("[RYD_MATRIX]", ...a);

  async function loadMatrix() {
    if (!window.MatrixExpander || typeof window.MatrixExpander.init !== "function") {
      throw new Error("MatrixExpander is not available");
    }

    log("Initializing MatrixExpander");
    await window.MatrixExpander.init();
    log("MatrixExpander ready");

    // Fire a custom event so any page can listen
    window.dispatchEvent(new CustomEvent("ryd:matrix:ready", {
      detail: { tools: window.MatrixExpander.getBaseTools() }
    }));
    return true;
  }

  function boot() {
    // Always run once DOM is ready
    loadMatrix().catch((err) => {
      console.error("[RYD_MATRIX] FATAL:", err);

      // Optional: show a visible message instead of infinite loading
      const el = document.querySelector("[data-matrix-status]");
      if (el) {
        el.textContent = "Tools failed to load. Check console + /data/tools.json";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

