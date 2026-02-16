/**
 * Numerology Router - Internal tool ordering only.
 * NOT visible to users. Uses numerological resonance to reorder which tools
 * appear first for a given pain point. No numerology text is ever displayed.
 */
(function() {
  'use strict';

  let engine = null;

  function ensureReady() {
    if (engine) return true;
    if (!window.NumerologyEngine) return false;
    try {
      engine = new window.NumerologyEngine();
      return true;
    } catch (e) {
      return false;
    }
  }

  function reduceToSingleDigit(n) {
    if (n === 11 || n === 22 || n === 33) return n;
    while (n > 9) {
      n = String(n).split('').reduce((a, d) => a + parseInt(d, 10), 0);
    }
    return n;
  }

  function resonanceScore(painValue, toolValue) {
    if (!painValue || !toolValue) return 0;
    const pReduced = reduceToSingleDigit(painValue);
    const tReduced = reduceToSingleDigit(toolValue);
    if (painValue === toolValue) return 2;      // exact match
    if (pReduced === tReduced) return 1;        // same reduced
    const diff = Math.abs(pReduced - tReduced);
    if (diff <= 1) return 0.5;                  // adjacent
    return 0;
  }

  /**
   * Reorder tool instances so tools that resonate with the pain point appear first.
   * Does not filter - same tools, different order. No numerology shown to user.
   * @param {Array} toolInstances - Array of { baseTool, ... }
   * @param {Object} painPoint - { title, id }
   * @returns {Promise<Array>} Same tools, reordered by resonance
   */
  function reorderByResonance(toolInstances, painPoint) {
    if (!toolInstances || toolInstances.length <= 1) return Promise.resolve(toolInstances);
    if (!ensureReady() || !engine) return Promise.resolve(toolInstances);

    const painTitle = (painPoint && (painPoint.title || painPoint.id)) || '';
    const painValue = engine.calculateValue(painTitle);
    if (!painValue) return Promise.resolve(toolInstances);

    const scored = toolInstances.map(inst => {
      const tool = inst && inst.baseTool ? inst.baseTool : inst;
      const toolTitle = (tool && (tool.title || tool.name || tool.id)) || '';
      const toolValue = engine.calculateValue(toolTitle);
      const score = resonanceScore(painValue, toolValue);
      return { inst, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return Promise.resolve(scored.map(s => s.inst));
  }

  window.NumerologyRouter = {
    reorderByResonance
  };
})();
