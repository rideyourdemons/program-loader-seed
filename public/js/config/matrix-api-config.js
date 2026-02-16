/**
 * Matrix API configuration for Ride Your Demons
 *
 * Uses same-origin /api/matrix on rideyourdemons.com (and dev).
 * Set window.RYD_MATRIX_API_BASE to override (e.g. 'http://localhost:3001' for standalone Engine).
 */
(function () {
  'use strict';
  var base = typeof window !== 'undefined' && window.RYD_MATRIX_API_BASE != null
    ? String(window.RYD_MATRIX_API_BASE).replace(/\/$/, '')
    : '';
  window.RYD_MATRIX_API_BASE = base;
  window.RYD_MATRIX_NODE_URL = base ? base + '/node' : '/api/matrix/node';
  window.RYD_MATRIX_HALT_URL = base ? base + '/emergency-halt' : '/api/matrix/emergency-halt';
})();
