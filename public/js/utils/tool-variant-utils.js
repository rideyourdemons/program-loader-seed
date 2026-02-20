/**
 * Tool Variant Utils — Primary vs Variant Model
 * Derives primaryToolId, variantType, isPrimary from tool id.
 * - standard-practice = primary (15min)
 * - quick-reset = variant (5min)
 * - deep-work = variant (30min)
 */
(function() {
  'use strict';

  const SUFFIXES = {
    'quick-reset': { variantType: '5min', isPrimary: false },
    'standard-practice': { variantType: '15min', isPrimary: true },
    'deep-work': { variantType: '30min', isPrimary: false }
  };

  function getVariantInfo(id) {
    if (!id || typeof id !== 'string') return { primaryToolId: '', variantType: undefined, isPrimary: true };
    const s = id.toLowerCase().trim();
    for (const [suffix, info] of Object.entries(SUFFIXES)) {
      if (s.endsWith('-' + suffix)) {
        const primaryToolId = s.slice(0, -1 - suffix.length);
        return {
          primaryToolId,
          variantType: info.variantType,
          isPrimary: info.isPrimary
        };
      }
    }
    return { primaryToolId: s, variantType: undefined, isPrimary: true };
  }

  function getPrimaryToolId(tool) {
    const id = tool && (tool.id || tool.slug || '');
    return getVariantInfo(id).primaryToolId;
  }

  function getVariantType(tool) {
    const id = tool && (tool.id || tool.slug || '');
    return getVariantInfo(id).variantType;
  }

  function isVariant(tool) {
    if (!tool) return false;
    if (tool.variantType && tool.variantType !== '15min') return true;
    if (tool.parentToolId) return true;
    const id = (tool.id || tool.slug || '').toLowerCase();
    const info = getVariantInfo(id);
    return !info.isPrimary;
  }

  function isPrimaryTool(tool) {
    return !isVariant(tool);
  }

  function filterPrimaryTools(tools) {
    if (!Array.isArray(tools)) return [];
    return tools.filter(isPrimaryTool);
  }

  function getVariantsByPrimaryId(tools, primaryToolId) {
    if (!Array.isArray(tools) || !primaryToolId) return [];
    const base = primaryToolId.toLowerCase();
    const variants = { '5min': null, '15min': null, '30min': null };
    tools.forEach(tool => {
      const id = (tool.id || tool.slug || '').toLowerCase();
      const info = getVariantInfo(id);
      if (info.primaryToolId === base && info.variantType) {
        variants[info.variantType] = tool;
      }
    });
    return variants;
  }

  window.RYD_ToolVariant = {
    getPrimaryToolId,
    getVariantType,
    isPrimaryTool,
    isVariant,
    isPrimary: isPrimaryTool,
    filterPrimaryTools,
    getVariantsByPrimaryId,
    getVariantInfo
  };
})();
