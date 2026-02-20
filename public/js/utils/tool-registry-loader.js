/**
 * Tool Registry Loader - Fail-Loud System
 * 
 * PRODUCTION REQUIREMENT: Registry must load reliably in dev + production.
 * Fails loudly with safe telemetry (no content dumps).
 * Run-once: safe if script is loaded twice; attaches to window only once.
 */

(function() {
  'use strict';

  // Prevent double execution and global collision (run exactly once)
  if (typeof window !== 'undefined' && window.RYD_RegistryLoader) {
    return;
  }

  // Use registry URL helper if available, otherwise use defaults
  const getRegistryPath = (type) => {
    if (typeof window !== 'undefined' && window.RYD_RegistryURL) {
      return type === 'fallback' ? window.RYD_RegistryURL.getFallback() : window.RYD_RegistryURL.getPrimary();
    }
    return type === 'fallback' ? '/data/tools.json' : '/data/tools.pass.json';
  };

  const REGISTRY_PATHS = {
    primary: getRegistryPath('primary'),
    fallback: getRegistryPath('fallback')
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

    // Determine if running on localhost (declare once at function scope)
    const isLocalhost = typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1');

    loadPromise = (async () => {
      const startTime = performance.now();
      try {
        // Try primary path first
        const currentPath = typeof location !== 'undefined' ? location.pathname : '(unknown)';
        const primaryUrl = REGISTRY_PATHS.primary;
        
        if (isLocalhost) {
          console.log('[Registry Loader] [DEBUG] Loading registry:', {
            url: primaryUrl,
            currentPath: currentPath,
            absoluteUrl: typeof location !== 'undefined' ? location.origin + primaryUrl : primaryUrl
          });
        }
        
        const response = await fetch(primaryUrl, {
          cache: 'no-store',
          headers: {
            'Accept': 'application/json; charset=utf-8'
          }
        });

        // Content-type protection: if expecting JSON but got HTML (SPA fallback), fail with clear error
        const ct = (response.headers.get('Content-Type') || '').toLowerCase();
        if (isLocalhost) {
          console.log('[Registry Loader] [DEBUG] Response received:', {
            url: primaryUrl,
            status: response.status,
            statusText: response.statusText,
            contentType: ct || '(none)',
            ok: response.ok
          });
        }
        // On localhost, be more lenient - if status is 200, try to parse even if content-type is wrong
        if (ct.includes('text/html') && response.status === 200) {
          // On localhost, log warning but try to continue if response looks like JSON
          if (isLocalhost) {
            console.warn('[Registry Loader] LOCALHOST: Got HTML content-type but status 200, checking if it\'s actually JSON...');
          }
          let preview = '';
          try { preview = (await response.clone().text()).substring(0, 120); } catch (_) {}
          // If preview starts with { or [, it might be JSON despite wrong content-type
          const trimmedPreview = preview.trim();
          if (!trimmedPreview.startsWith('{') && !trimmedPreview.startsWith('[')) {
            const err = new Error('Server returned HTML instead of JSON. Check that /data/tools.pass.json exists.');
            err.rydDetails = { url: REGISTRY_PATHS.primary, status: response.status, contentType: ct || '(none)', preview };
            throw err;
          } else if (isLocalhost) {
            console.warn('[Registry Loader] LOCALHOST: Content-type says HTML but content looks like JSON, proceeding...');
          }
        } else if (ct.includes('text/html')) {
          let preview = '';
          try { preview = (await response.clone().text()).substring(0, 120); } catch (_) {}
          const err = new Error('Server returned HTML instead of JSON. Check that /data/tools.pass.json exists.');
          err.rydDetails = { url: REGISTRY_PATHS.primary, status: response.status, contentType: ct || '(none)', preview };
          throw err;
        }

        // Safe telemetry: log status, not content
        if (!response.ok) {
          console.error('[Registry Loader] Primary fetch failed:', {
            url: REGISTRY_PATHS.primary,
            status: response.status,
            statusText: response.statusText
          });

          // Try fallback
          const fallbackUrl = REGISTRY_PATHS.fallback;
          if (isLocalhost) {
            console.log('[Registry Loader] [DEBUG] Trying fallback:', {
              url: fallbackUrl,
              currentPath: currentPath
            });
          }
          const fallbackResponse = await fetch(fallbackUrl, {
            cache: 'no-store',
            headers: {
              'Accept': 'application/json; charset=utf-8'
            }
          });

          const fallbackCt = (fallbackResponse.headers.get('Content-Type') || '').toLowerCase();
          if (fallbackCt.includes('text/html')) {
            let preview = '';
            try { preview = (await fallbackResponse.clone().text()).substring(0, 120); } catch (_) {}
            const err = new Error('Server returned HTML instead of JSON. Check that /data/tools.json exists.');
            err.rydDetails = { url: REGISTRY_PATHS.fallback, status: fallbackResponse.status, contentType: fallbackCt || '(none)', preview };
            throw err;
          }

          if (!fallbackResponse.ok) {
            throw new Error(`Registry load failed: primary=${response.status}, fallback=${fallbackResponse.status}`);
          }

          let fallbackData;
          try {
            const fallbackText = await fallbackResponse.text();
            fallbackData = JSON.parse(fallbackText);
          } catch (parseError) {
            const err = new Error(`Failed to parse JSON from fallback ${fallbackUrl}: ${parseError.message}`);
            err.rydDetails = { url: fallbackUrl, status: fallbackResponse.status, contentType: fallbackCt, parseError: parseError.message };
            throw err;
          }
          const tools = Array.isArray(fallbackData) ? fallbackData : (fallbackData.tools || []);
          
          registryCache = {
            source: 'fallback',
            tools,
            count: tools.length,
            loadedAt: new Date().toISOString()
          };

          const fallbackLoadTime = Math.round(performance.now() - startTime);
          console.warn(`[REGISTRY] Using fallback: ${tools.length} tools from ${REGISTRY_PATHS.fallback} in ${fallbackLoadTime}ms`);

          return registryCache;
        }

        let data;
        try {
          const text = await response.text();
          data = JSON.parse(text);
        } catch (parseError) {
          const err = new Error(`Failed to parse JSON from ${primaryUrl}: ${parseError.message}`);
          err.rydDetails = { url: primaryUrl, status: response.status, contentType: ct, parseError: parseError.message };
          throw err;
        }
        const tools = Array.isArray(data) ? data : (data.tools || []);

        registryCache = {
          source: 'primary',
          tools,
          count: tools.length,
          loadedAt: new Date().toISOString()
        };

        const loadTime = Math.round(performance.now() - startTime);
        const logMsg = isLocalhost 
          ? `[REGISTRY] ✅ loaded ${tools.length} tools from ${REGISTRY_PATHS.primary} in ${loadTime}ms`
          : `[REGISTRY] loaded ${tools.length} tools from ${REGISTRY_PATHS.primary} in ${loadTime}ms`;
        console.log(logMsg);

        loadError = null;
        return registryCache;

      } catch (error) {
        const d = error.rydDetails || {};
        loadError = {
          message: error.message,
          timestamp: new Date().toISOString(),
          url: d.url || REGISTRY_PATHS.primary,
          status: d.status,
          contentType: d.contentType,
          preview: d.preview
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
      url: loadError?.url,
      status: loadError?.status,
      contentType: loadError?.contentType,
      preview: loadError?.preview,
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

  // Export to global scope (attach only once to avoid collision)
  if (typeof window !== 'undefined' && !window.RYD_RegistryLoader) {
    window.RYD_RegistryLoader = {
      load: loadRegistry,
      getTools,
      getStatus: getRegistryStatus,
      REGISTRY_PATHS
    };
    console.log('[Registry Loader] Tool registry loader initialized');
  }

})();
