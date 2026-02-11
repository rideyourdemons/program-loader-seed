/**
 * Analytics Configuration
 * 
 * This file is loaded from environment variables at build time or server-side.
 * For client-side, we use a config file that can be gitignored.
 * 
 * IMPORTANT: This file should NOT contain hardcoded IDs.
 * Use analytics-config.local.js (gitignored) for actual values.
 */

(function() {
  'use strict';

  // Try to load local config first (gitignored, contains actual secrets)
  let config = null;
  
  // Check if we're in a Node.js environment (server-side)
  if (typeof process !== 'undefined' && process.env) {
    config = {
      GTM_CONTAINER_ID: process.env.GTM_CONTAINER_ID || '',
      GTM_TEST_ID: process.env.GTM_TEST_ID || '',
      GA4_MEASUREMENT_ID: process.env.GA4_MEASUREMENT_ID || ''
    };
  } else {
    // Client-side: Try to load from window (injected by server)
    if (window.RYD_ANALYTICS_CONFIG) {
      config = window.RYD_ANALYTICS_CONFIG;
    } else {
      // Fallback: Check for local config file (gitignored)
      // This will be loaded via a separate script tag if it exists
      config = {
        GTM_CONTAINER_ID: '',
        GTM_TEST_ID: '',
        GA4_MEASUREMENT_ID: ''
      };
    }
  }

  // Export to window for use by analytics.js
  window.RYD_ANALYTICS_CONFIG = config;

  console.log('[Analytics Config] Configuration loaded', {
    hasGTM: !!config.GTM_CONTAINER_ID,
    hasGA4: !!config.GA4_MEASUREMENT_ID,
    environment: typeof process !== 'undefined' ? 'server' : 'client'
  });
})();
