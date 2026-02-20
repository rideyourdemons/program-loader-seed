/**
 * Registry URL Helper - Single Source of Truth
 * Ensures absolute paths regardless of current route.
 */
(function() {
  'use strict';

  /**
   * Get the absolute URL for the registry file
   * Always returns root-relative paths (starts with /)
   * Primary: tools.structured.json; fallback: tools.pass.json then tools.json
   */
  function getRegistryUrl(type = 'primary') {
    const paths = {
      primary: '/data/tools.structured.json',
      fallback: '/data/tools.pass.json',
      fallback2: '/data/tools.json'
    };
    if (type === 'fallback2') return paths.fallback2;
    return type === 'fallback' ? paths.fallback : paths.primary;
  }

  /**
   * Get base URL (protocol + hostname + port)
   * Returns empty string for relative paths (which is what we want)
   */
  function getBaseUrl() {
    if (typeof location === 'undefined') {
      return '';
    }
    // Return empty string to use relative paths (works on any route)
    return '';
  }

  // Export to global scope
  window.RYD_RegistryURL = {
    getPrimary: () => getRegistryUrl('primary'),
    getFallback: () => getRegistryUrl('fallback'),
    getBaseUrl
  };

  if (typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    console.log('[Registry URL] Helper initialized - Primary:', getRegistryUrl('primary'), 'Fallback:', getRegistryUrl('fallback'));
  }
})();
