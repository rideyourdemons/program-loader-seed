/**
 * Centralized API Configuration
 * Manages all API URLs with environment variable support and production fallbacks
 */

(function() {
  'use strict';

  /**
   * Get API base URL with fallback chain
   */
  function getApiBaseUrl() {
    // Priority 1: Next.js environment variable
    if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    
    // Priority 2: Generic API_BASE_URL
    if (typeof process !== 'undefined' && process.env && process.env.API_BASE_URL) {
      return process.env.API_BASE_URL;
    }
    
    // Priority 3: Window config (browser)
    if (typeof window !== 'undefined' && window.RYD_CONFIG && window.RYD_CONFIG.API_BASE_URL) {
      return window.RYD_CONFIG.API_BASE_URL;
    }
    
    // Priority 4: Production fallback - use relative URLs
    return '';
  }

  /**
   * Get data directory path
   */
  function getDataPath() {
    // Check for custom data path
    if (typeof window !== 'undefined' && window.RYD_CONFIG && window.RYD_CONFIG.DATA_PATH) {
      return window.RYD_CONFIG.DATA_PATH;
    }
    
    // Default data path
    return '/data';
  }

  /**
   * Build full URL for data files
   */
  function buildDataUrl(filename) {
    const dataPath = getDataPath();
    const baseUrl = getApiBaseUrl();
    
    // If we have an API base URL, use it
    if (baseUrl && baseUrl !== '#') {
      return `${baseUrl}${dataPath}/${filename}`;
    }
    
    // Otherwise use relative path
    return `${dataPath}/${filename}`;
  }

  const API_CONFIG = {
    where_it_came_from: {
      origin: "internal",
      basis: "built for Ride Your Demons platform",
      source_type: "system-utility",
      verified: true
    },
    // Data endpoints
    GATES_URL: buildDataUrl('gates.json'),
    PAIN_POINTS_URL: buildDataUrl('pain-points.json'),
    TOOLS_URL: buildDataUrl('tools.json'),
    TOOLS_CANONICAL_URL: buildDataUrl('tools-canonical.json'),
    
    // API settings
    BASE_URL: getApiBaseUrl(),
    DATA_PATH: getDataPath(),
    
    // Fetch settings
    DEFAULT_TIMEOUT: 10000, // 10 seconds
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 second base delay
    
    // Retry on these status codes
    RETRY_STATUS_CODES: [408, 429, 500, 502, 503, 504],
    
    // Silent fail on these (don't throw, return empty)
    SILENT_FAIL_STATUSES: [404]
  };

  // Export to window
  if (typeof window !== 'undefined') {
    window.RYD_API_CONFIG = API_CONFIG;
    window.RYD_API_CONFIG.getApiBaseUrl = getApiBaseUrl;
    window.RYD_API_CONFIG.buildDataUrl = buildDataUrl;
  }

  // Export for Node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
  }
})();
