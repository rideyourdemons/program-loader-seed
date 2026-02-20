/**
 * Tool Registry Loader - Fail-Loud System
 * 
 * PRODUCTION REQUIREMENT: Registry must load reliably in dev + production.
 * Fails loudly with safe telemetry (no content dumps).
 */

(function() {
  'use strict';

  const REGISTRY_PATHS = {
    primary: '/data/tools.pass.json',
    fallback: '/data/tools.json'
  };

  let registryCache = null;
  let loadPromise = null;
  let loadError = null;

  /**
   * Load registry with fail-loud behavior
   */
  async function loadRegistry(options = {}) {
    const { retry = false, useCache = true } = options;

    // Return cached if available and not retrying
    if (useCache && registryCache && !retry) {
      return registryCache;
    }

    // Return existing promise if loading
    if (loadPromise && !retry) {
      return loadPromise;
    }

    loadPromise = (async () => {
      try {
        // Try primary path first
        const response = await fetch(REGISTRY_PATHS.primary, {
          cache: 'no-store',
          headers: {
            'Accept': 'application/json; charset=utf-8'
          }
        });

        // Safe telemetry: log status, not content
        if (!response.ok) {
          console.error('[Registry Loader] Primary fetch failed:', {
            url: REGISTRY_PATHS.primary,
            status: response.status,
            statusText: response.statusText
          });

          // Try fallback
          const fallbackResponse = await fetch(REGISTRY_PATHS.fallback, {
            cache: 'no-store',
            headers: {
              'Accept': 'application/json; charset=utf-8'
            }
          });

          if (!fallbackResponse.ok) {
            throw new Error(`Registry load failed: primary=${response.status}, fallback=${fallbackResponse.status}`);
          }

          const fallbackData = await fallbackResponse.json();
          const tools = Array.isArray(fallbackData) ? fallbackData : (fallbackData.tools || []);
          
          registryCache = {
            source: 'fallback',
            tools,
            count: tools.length,
            loadedAt: new Date().toISOString()
          };

          console.warn('[Registry Loader] Using fallback registry:', {
            source: REGISTRY_PATHS.fallback,
            toolCount: tools.length
          });

          return registryCache;
        }

        const data = await response.json();
        const tools = Array.isArray(data) ? data : (data.tools || []);

        registryCache = {
          source: 'primary',
          tools,
          count: tools.length,
          loadedAt: new Date().toISOString()
        };

        console.log('[Registry Loader] Registry loaded:', {
          source: REGISTRY_PATHS.primary,
          toolCount: tools.length
        });

        loadError = null;
        return registryCache;

      } catch (error) {
        loadError = {
          message: error.message,
          timestamp: new Date().toISOString(),
          url: REGISTRY_PATHS.primary
        };

        console.error('[Registry Loader] Registry load failed:', {
          error: error.message,
          url: REGISTRY_PATHS.primary,
          type: error.constructor.name
        });

        // Fail loudly - don't return empty array
        throw new Error(`Tool registry failed to load: ${error.message}`);
      }
    })();

    return loadPromise;
  }

  /**
   * Get registry status (safe telemetry)
   */
  function getRegistryStatus() {
    return {
      loaded: !!registryCache,
      error: loadError,
      toolCount: registryCache?.count || 0,
      source: registryCache?.source || null,
      loadedAt: registryCache?.loadedAt || null
    };
  }

  /**
   * Get tools from registry
   */
  function getTools() {
    if (!registryCache) {
      throw new Error('[Registry Loader] Registry not loaded. Call loadRegistry() first.');
    }
    return registryCache.tools.slice(); // Return copy
  }

  // Export to global scope
  window.RYD_RegistryLoader = {
    load: loadRegistry,
    getTools,
    getStatus: getRegistryStatus,
    REGISTRY_PATHS
  };

  console.log('[Registry Loader] Tool registry loader initialized');

})();
