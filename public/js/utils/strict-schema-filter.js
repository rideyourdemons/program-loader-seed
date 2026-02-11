/**
 * Strict-Schema Filter - Auto-repair for null/undefined/invalid encoding
 * Prevents 0.82 clustering coefficient from spreading 'dirty' data
 */

(function() {
  'use strict';

  /**
   * Check if string has invalid encoding (Mojibake patterns)
   */
  function hasInvalidEncoding(str) {
    if (typeof str !== 'string') return false;
    
    // Common Mojibake patterns
    const mojibakePatterns = [
      /Ã[ƒÂ°]/g,
      /â€"/g,
      /â€"/g,
      /â€™/g,
      /â€œ/g,
      /â€/g,
      /[^\x20-\x7E\u00A0-\uFFFF]/g // Non-printable characters
    ];
    
    return mojibakePatterns.some(pattern => pattern.test(str));
  }

  /**
   * Repair invalid encoding
   */
  function repairEncoding(str) {
    if (typeof str !== 'string') return '';
    
    return str
      .replace(/ÃƒÂ°/g, '°')
      .replace(/â€™/g, "'")
      .replace(/â€œ/g, '"')
      .replace(/â€/g, '"')
      .replace(/â€"/g, '—')
      .replace(/â€"/g, '–')
      .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '') // Remove non-printable
      .trim();
  }

  /**
   * Strict schema validation and auto-repair
   */
  function strictSchemaFilter(node) {
    if (!node || typeof node !== 'object') {
      return null; // Prune invalid nodes
    }
    
    const filtered = {};
    
    // Required fields with fallbacks
    filtered.id = node.id != null ? String(node.id) : '';
    filtered.ref = node.ref != null ? String(node.ref) : '';
    filtered.status = node.status != null ? String(node.status) : 'ACTIVE';
    
    // Optional fields with encoding repair
    if (node.title != null) {
      const title = String(node.title);
      filtered.title = hasInvalidEncoding(title) ? repairEncoding(title) : title;
    } else {
      filtered.title = '';
    }
    
    if (node.description != null) {
      const desc = String(node.description);
      filtered.description = hasInvalidEncoding(desc) ? repairEncoding(desc) : desc;
    } else {
      filtered.description = '';
    }
    
    if (node.duration != null) {
      const duration = String(node.duration);
      filtered.duration = hasInvalidEncoding(duration) ? repairEncoding(duration) : duration;
    }
    
    if (node.difficulty != null) {
      const difficulty = String(node.difficulty);
      filtered.difficulty = hasInvalidEncoding(difficulty) ? repairEncoding(difficulty) : difficulty;
    }
    
    // Prune if critical fields are empty after filtering
    if (!filtered.id && !filtered.ref) {
      return null; // Prune node
    }
    
    return filtered;
  }

  /**
   * Filter array of nodes with strict schema
   */
  function filterNodeArray(nodes) {
    if (!Array.isArray(nodes)) return [];
    
    return nodes
      .map(node => strictSchemaFilter(node))
      .filter(node => node !== null); // Remove pruned nodes
  }

  /**
   * Check if data structure is clean (no null/undefined/invalid encoding)
   */
  function isClean(data) {
    if (data == null) return false;
    
    if (Array.isArray(data)) {
      return data.every(item => isClean(item));
    }
    
    if (typeof data === 'object') {
      return Object.values(data).every(value => {
        if (value == null) return false;
        if (typeof value === 'string' && hasInvalidEncoding(value)) return false;
        if (typeof value === 'object') return isClean(value);
        return true;
      });
    }
    
    if (typeof data === 'string') {
      return !hasInvalidEncoding(data);
    }
    
    return true;
  }

  // Export to window
  window.StrictSchemaFilter = {
    strictSchemaFilter,
    filterNodeArray,
    hasInvalidEncoding,
    repairEncoding,
    isClean
  };

  console.log('[Strict Schema Filter] Auto-repair utilities loaded');
})();
