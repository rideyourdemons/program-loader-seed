/**
 * Gate State Manager
 * Prevents page reloads when Gates are selected
 * Maintains state and filters pain points by active Gate
 */

(function() {
  'use strict';

  // Internal state
  let activeGate = null;
  let filteredPainPoints = [];
  let allPainPoints = [];

  // Normalization helper so different sources can still match
  function normalizeGateId(value) {
    if (value == null) return '';
    return String(value)
      .toLowerCase()
      .trim()
      .replace(/['’]/g, '')        // remove apostrophes
      .replace(/\s+/g, '-')        // spaces → hyphens
      .replace(/[^a-z0-9\-]/g, ''); // strip other punctuation
  }

  /**
   * Set active gate (without page reload)
   */
  function setActiveGate(gateId) {
    if (!gateId) {
      activeGate = null;
      filteredPainPoints = allPainPoints;
      return;
    }

    activeGate = gateId;
    const targetNorm = normalizeGateId(gateId);

    // Filter pain points for this gate (normalized comparison)
    if (Array.isArray(allPainPoints)) {
      filteredPainPoints = allPainPoints.filter(pp => {
        if (!pp) return false;
        const sourceGate =
          pp.gateId ||
          pp.gate ||
          pp.gateSlug ||
          pp.gate_id ||
          '';
        return normalizeGateId(sourceGate) === targetNorm;
      });
    } else {
      filteredPainPoints = [];
    }

    // Debug: compare against Matrix / tools gate mapping if available
    let uniqueToolGates = [];
    try {
      if (window.MatrixExpander && typeof window.MatrixExpander.getBaseTools === 'function') {
        const tools = window.MatrixExpander.getBaseTools() || [];
        const set = new Set();
        tools.forEach(t => {
          const g = t && (t.gateId || t.gate || t.gateSlug || t.gate_id);
          if (g) set.add(normalizeGateId(g));
        });
        uniqueToolGates = Array.from(set).sort();
      }
    } catch (e) {
      console.warn('[Gate State] Debug gate/tool mapping error:', e);
    }

    console.log('[Gate State] Active gate set:', gateId, `(${filteredPainPoints.length} pain points)`, {
      normalizedGate: targetNorm,
      uniqueGateTagsFromTools: uniqueToolGates
    });
    
    // Trigger state change event
    window.dispatchEvent(new CustomEvent('gateStateChanged', {
      detail: { gateId, painPoints: filteredPainPoints }
    }));
  }

  /**
   * Get active gate
   */
  function getActiveGate() {
    return activeGate;
  }

  /**
   * Get filtered pain points for active gate
   */
  function getFilteredPainPoints() {
    return activeGate ? filteredPainPoints : allPainPoints;
  }

  /**
   * Initialize with pain points data
   */
  function init(painPoints) {
    if (Array.isArray(painPoints)) {
      allPainPoints = painPoints;
      filteredPainPoints = painPoints;
    }
  }

  /**
   * Clear active gate (show all pain points)
   */
  function clearActiveGate() {
    activeGate = null;
    filteredPainPoints = allPainPoints;
    window.dispatchEvent(new CustomEvent('gateStateChanged', {
      detail: { gateId: null, painPoints: allPainPoints }
    }));
  }

  // Export to window
  window.GateStateManager = {
    setActiveGate,
    getActiveGate,
    getFilteredPainPoints,
    init,
    clearActiveGate
  };

  console.log('[Gate State Manager] State management utilities loaded');
})();
