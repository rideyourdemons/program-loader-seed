/**
 * RYD Canonical Boot Module
 * Loads matrix JSON once per page, provides single ready/error signal
 * Never hangs indefinitely - always resolves to { ok: true/false }
 */

(function() {
  'use strict';
  
  console.log('[RYD] boot starting on', location.pathname);
  
  const TIMEOUT_MS = 3500;
  let legacyMatrixWarned = false;
  
  const state = {
    status: 'loading',
    matrix: null,
    tools: [],
    error: null
  };
  
  function warnLegacyMatrix() {
    if (legacyMatrixWarned) return;
    legacyMatrixWarned = true;
    console.warn('Matrix expander active — no static matrix used');
  }
  
  // Deterministic tool selection
  function pickToolOfDay(tools, dateSeed) {
    if (!tools || tools.length === 0) {
      // Fallback tool if none available
      return {
        id: 'grounding-reset',
        title: 'Grounding Reset',
        description: 'A short reset to calm your nervous system and regain focus.',
        duration: '5 minutes',
        difficulty: 'beginner',
        cta: '/tools/grounding-reset'
      };
    }
    
    // Deterministic selection based on date seed
    const seed = dateSeed || new Date().getTime();
    const index = seed % tools.length;
    return tools[index] || tools[0];
  }
  
  // Main boot function
  async function boot() {
    const timeoutId = setTimeout(() => {
      state.status = 'error';
      state.error = new Error('Matrix expander init timed out');
      console.error('[RYD] error', state.error.message);
      window.dispatchEvent(new CustomEvent('ryd:error', {
        detail: { error: state.error.message }
      }));
    }, TIMEOUT_MS);

    try {
      if (!window.MatrixExpander || typeof window.MatrixExpander.init !== 'function') {
        console.warn('[RYD] MatrixExpander not available, using fallback');
        clearTimeout(timeoutId);
        state.tools = [];
        state.status = 'ready';
        window.dispatchEvent(new CustomEvent('ryd:ready', {
          detail: { tools: [] }
        }));
        return;
      }

      await window.MatrixExpander.init();
      clearTimeout(timeoutId);

      const tools = window.MatrixExpander.getBaseTools();
      state.matrix = null;
      state.tools = tools;
      state.status = 'ready';

      console.log('[RYD] ready tools=' + tools.length);

      // Dispatch ready event
      window.dispatchEvent(new CustomEvent('ryd:ready', {
        detail: { tools: tools }
      }));
    } catch (err) {
      clearTimeout(timeoutId);

      state.error = err;
      state.status = 'error';

      const errorMsg = err.message || 'Unknown error';
      console.error('[RYD] error', errorMsg);

      // Dispatch error event
      window.dispatchEvent(new CustomEvent('ryd:error', {
        detail: { error: errorMsg }
      }));
    }
  }
  
  // Expose global API
  window.RYD = {
    where_it_came_from: {
      origin: "internal",
      basis: "built for Ride Your Demons platform",
      source_type: "system-utility",
      verified: true
    },
    matrix: null,
    tools: [],
    status: 'loading',
    error: null,
    
    getTools: function() {
      return state.tools;
    },
    
    pickToolOfDay: function(dateSeed) {
      return pickToolOfDay(state.tools, dateSeed);
    },
    
    getMatrix: function() {
      warnLegacyMatrix();
      return null;
    }
  };
  
  // Update global state when ready
  const updateGlobal = () => {
    window.RYD.matrix = state.matrix;
    window.RYD.tools = state.tools;
    window.RYD.status = state.status;
    window.RYD.error = state.error;
  };
  
  window.addEventListener('ryd:ready', () => {
    updateGlobal();
  });
  
  window.addEventListener('ryd:error', () => {
    updateGlobal();
  });
  
  // Start boot (non-blocking - gates/anchor init happens independently)
  console.debug('[RYD] boot: rotation start');
  boot();
  
  // Legacy compatibility
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
})();

