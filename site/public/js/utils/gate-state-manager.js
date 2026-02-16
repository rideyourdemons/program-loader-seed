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
    
    // Filter pain points for this gate
    if (Array.isArray(allPainPoints)) {
      filteredPainPoints = allPainPoints.filter(pp => {
        if (!pp) return false;
        return String(pp.gateId || '') === String(gateId);
      });
    } else {
      filteredPainPoints = [];
    }

    console.log('[Gate State] Active gate set:', gateId, `(${filteredPainPoints.length} pain points)`);
    
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
