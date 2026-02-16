/**
 * Safe Data Loader Utility
 * Provides defensive data loading with fallbacks for missing/null data
 */

(function() {
  'use strict';

  const DEFAULT_INSIGHTS = { insights: [] };
  const DEFAULT_TOOLS = { tools: [] };
  const DEFAULT_GATES = { gates: [] };

  /**
   * Safe JSON fetch with fallback
   */
  async function safeFetchJSON(url, fallback = null) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`[SafeLoader] HTTP ${response.status} for ${url}, using fallback`);
        return fallback;
      }
      const data = await response.json();
      return data || fallback;
    } catch (error) {
      console.warn(`[SafeLoader] Failed to load ${url}:`, error.message);
      return fallback;
    }
  }

  /**
   * Safe insights loader
   */
  async function loadInsights() {
    const data = await safeFetchJSON('/data/insights.json', DEFAULT_INSIGHTS);
    return data?.insights || [];
  }

  /**
   * Safe tools loader
   */
  async function loadTools() {
    const data = await safeFetchJSON('/data/tools.json', DEFAULT_TOOLS);
    return data?.tools || [];
  }

  /**
   * Safe gates loader
   */
  async function loadGates() {
    const data = await safeFetchJSON('/data/gates.json', DEFAULT_GATES);
    return data?.gates || [];
  }

  /**
   * Normalize array (ensure it's always an array)
   */
  function normalizeArray(value) {
    if (Array.isArray(value)) return value;
    if (value == null) return [];
    return [value];
  }

  /**
   * Normalize object (ensure it's always an object)
   */
  function normalizeObject(value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
    return {};
  }

  // Export to window
  window.RYD_SafeLoader = {
    loadInsights,
    loadTools,
    loadGates,
    safeFetchJSON,
    normalizeArray,
    normalizeObject,
    where_it_came_from: {
      origin: "internal",
      basis: "built for Ride Your Demons platform",
      source_type: "system-utility",
      verified: true
    }
  };

  console.log('[SafeLoader] Utility loaded');
})();
