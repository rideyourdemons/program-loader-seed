/**
 * RYD Canonical Boot Module
 * Loads matrix JSON once per page, provides single ready/error signal
 * Never hangs indefinitely - always resolves to { ok: true/false }
 */

(function() {
  'use strict';

  if (typeof window !== 'undefined' && window.__RYD_BOOTED__) {
    return;
  }
  window.__RYD_BOOTED__ = true;
  
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
  
  // Deterministic tool selection (primary + quality-filtered, avoid repeat)
  function pickToolOfDay(tools, dateSeed) {
    const primaryTools = (typeof window !== 'undefined' && window.RYD_ToolVariant && window.RYD_ToolVariant.filterPrimaryTools)
      ? window.RYD_ToolVariant.filterPrimaryTools(tools || [])
      : (tools || []);
    const basePool = primaryTools.length > 0 ? primaryTools : (tools || []);
    const isProd = typeof window !== 'undefined' && window.location &&
      window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    let pool = (typeof window !== 'undefined' && window.RYD_ToolValidator && window.RYD_ToolValidator.filterToolsForToolOfDay)
      ? window.RYD_ToolValidator.filterToolsForToolOfDay(basePool, isProd)
      : basePool;
    if (typeof window !== 'undefined' && window.RYD_ToolVariant && window.RYD_ToolVariant.isVariant) {
      pool = pool.filter(t => !window.RYD_ToolVariant.isVariant(t));
    }
    
    if (pool.length === 0) {
      return {
        id: 'grounding-reset',
        title: 'Grounding Reset',
        description: 'A short reset to calm your nervous system and regain focus.',
        duration: '5 minutes',
        difficulty: 'beginner',
        cta: '/tools/grounding-reset'
      };
    }
    
    const seed = dateSeed || (new Date().getFullYear() * 10000 + new Date().getMonth() * 100 + new Date().getDate());
    let index = seed % pool.length;
    
    try {
      const lastId = localStorage.getItem('ryd:lastToolOfDay');
      if (lastId && pool.length > 1) {
        const lastIdx = pool.findIndex(t => (t.id || t.slug) === lastId);
        if (lastIdx >= 0 && index === lastIdx) {
          index = (index + 1) % pool.length;
        }
      }
    } catch (_) {}
    
    const tool = pool[index] || pool[0];
    try {
      localStorage.setItem('ryd:lastToolOfDay', tool.id || tool.slug || '');
    } catch (_) {}
    
    return tool;
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
      // Try registry loader first (fail-loud)
      // Wait a bit for registry loader to initialize if it's not immediately available
      if (!window.RYD_RegistryLoader) {
        // Give scripts a moment to load (registry loader is loaded synchronously in head)
        await new Promise(resolve => {
          let attempts = 0;
          const checkInterval = setInterval(() => {
            attempts++;
            if (window.RYD_RegistryLoader || attempts > 10) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 50);
        });
      }
      
      if (window.RYD_RegistryLoader) {
        try {
          const registry = await window.RYD_RegistryLoader.load();
          clearTimeout(timeoutId);
          state.tools = registry.tools;
          state.status = 'ready';
          console.log('[RYD] ready tools=' + registry.tools.length + ' (from registry)');
          window.dispatchEvent(new CustomEvent('ryd:ready', {
            detail: { tools: registry.tools }
          }));
          return;
        } catch (registryError) {
          console.error('[RYD] Registry load failed, trying MatrixExpander:', registryError.message);
          // Fall through to MatrixExpander
        }
      } else {
        console.warn('[RYD] Registry loader not available, trying MatrixExpander fallback');
      }

      // Fallback to MatrixExpander
      if (!window.MatrixExpander || typeof window.MatrixExpander.init !== 'function') {
        console.warn('[RYD] MatrixExpander not available');
        clearTimeout(timeoutId);
        state.tools = [];
        state.status = 'error';
        state.error = new Error('No tool registry available');
        window.dispatchEvent(new CustomEvent('ryd:error', {
          detail: { error: 'No tool registry available' }
        }));
        return;
      }

      await window.MatrixExpander.init();
      clearTimeout(timeoutId);

      const tools = window.MatrixExpander.getBaseTools();
      state.matrix = null;
      state.tools = tools;
      state.status = 'ready';

      console.log('[RYD] ready tools=' + tools.length + ' (from MatrixExpander)');

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

