/**
 * Central Configuration Manager
 * Pulls from process.env (server-side) or window.ENV_CONFIG (client-side)
 * 
 * This is the "Black Box" - logic is public, secrets stay private
 */

(function() {
  'use strict';

  // Priority: window.ENV_CONFIG > process.env > defaults
  function getConfig() {
    // Client-side: Check window.ENV_CONFIG (injected by server)
    if (typeof window !== 'undefined' && window.ENV_CONFIG) {
      return window.ENV_CONFIG;
    }
    
    // Server-side: Check process.env
    if (typeof process !== 'undefined' && process.env) {
      return {
        GTM_CONTAINER_ID: process.env.GTM_CONTAINER_ID || '',
        GTM_TEST_ID: process.env.GTM_TEST_ID || '',
        GA4_MEASUREMENT_ID: process.env.GA4_MEASUREMENT_ID || '',
        NODE_ENV: process.env.NODE_ENV || 'development',
        PORT: process.env.PORT || 3000
      };
    }
    
    // Fallback: Empty config (analytics disabled)
    return {
      GTM_CONTAINER_ID: '',
      GTM_TEST_ID: '',
      GA4_MEASUREMENT_ID: '',
      NODE_ENV: 'development',
      PORT: 3000
    };
  }

  const config = getConfig();

  // Export to window for client-side use
  if (typeof window !== 'undefined') {
    window.ENV_CONFIG = config;
    window.RYD_CONFIG = config; // Alias for compatibility
  }

  // Export for Node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
  }

  console.log('[Config] Configuration loaded', {
    hasGTM: !!config.GTM_CONTAINER_ID,
    hasGA4: !!config.GA4_MEASUREMENT_ID,
    environment: config.NODE_ENV
  });
})();
