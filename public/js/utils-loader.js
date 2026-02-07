/**
 * Utilities Loader
 * Ensures all hardening utilities are loaded in correct order
 * Must be loaded before any dynamic content modules
 */

(function() {
  'use strict';

  const UTILITIES = [
    '/js/config/api-config.js',
    '/js/utils/error-monitor.js',
    '/js/utils/error-boundary.js',
    '/js/utils/resilient-fetch.js',
    '/js/utils/fetch-with-retry.js', // Keep for backward compatibility
    '/js/utils/data-sanitizer.js',
    '/js/utils/validation-schemas.js',
    '/js/utils/memo-cache.js',
    '/js/utils/ui-stability.js',
    '/js/utils/safe-data-loader.js'
  ];

  let loadedCount = 0;
  const total = UTILITIES.length;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = false; // Load in order
      script.onload = () => {
        loadedCount++;
        resolve();
      };
      script.onerror = () => {
        reject(new Error(`Failed to load ${src}`));
      };
      document.head.appendChild(script);
    });
  }

  async function loadUtilities() {
    try {
      for (const src of UTILITIES) {
        await loadScript(src);
      }
      
      // Verify critical utilities are available
      if (!window.RYD_ErrorBoundary || !window.RYD_ResilientFetch || !window.RYD_Validation) {
        console.warn('[RYD Utils] Some utilities failed to initialize, using fallback mode');
      }
      
      console.log('[RYD Utils] All utilities loaded successfully');
      window.dispatchEvent(new CustomEvent('ryd:utils-ready'));
      return true;
    } catch (error) {
      console.error('[RYD Utils] Failed to load utilities:', error);
      window.dispatchEvent(new CustomEvent('ryd:utils-error', { detail: error }));
      return false;
    }
  }

  // Auto-load on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadUtilities);
  } else {
    loadUtilities();
  }

  window.RYD_UtilsLoader = {
    where_it_came_from: {
      origin: "internal",
      basis: "built for Ride Your Demons platform",
      source_type: "system-utility",
      verified: true
    },
    loadUtilities,
    isReady: () => {
      return !!(
        window.RYD_ErrorBoundary &&
        window.RYD_Fetch &&
        window.RYD_Validation &&
        window.RYD_Cache
      );
    }
  };
})();
