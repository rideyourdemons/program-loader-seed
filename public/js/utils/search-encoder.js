/**
 * Search Encoder - UTF-8 Encoding Fix for Search Bar
 * Prevents Mojibake (corrupted characters) in search results
 */

(function() {
  'use strict';

  /**
   * Force UTF-8 encoding on search query
   */
  function encodeSearchQuery(query) {
    if (typeof query !== 'string') {
      query = String(query || '');
    }
    
    // Remove BOM and zero-width characters
    query = query.replace(/^\uFEFF/, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
    
    // Use TextDecoder for proper UTF-8 handling
    try {
      // If query is already a string, ensure it's properly encoded
      const encoder = new TextEncoder();
      const decoder = new TextDecoder('utf-8');
      const encoded = encoder.encode(query);
      return decoder.decode(encoded);
    } catch (e) {
      // Fallback: manual UTF-8 fix
      return decodeURIComponent(escape(query));
    }
  }

  /**
   * Decode search result text (handles Buffer/Uint8Array)
   */
  function decodeSearchResult(data) {
    if (!data) return '';
    
    // If it's already a string, sanitize it
    if (typeof data === 'string') {
      return sanitizeSearchText(data);
    }
    
    // If it's a Buffer or Uint8Array, decode it
    if (data instanceof Uint8Array || (data.buffer && data.buffer instanceof ArrayBuffer)) {
      try {
        const decoder = new TextDecoder('utf-8');
        return sanitizeSearchText(decoder.decode(data));
      } catch (e) {
        console.warn('[Search Encoder] Failed to decode Uint8Array:', e);
        return '';
      }
    }
    
    // If it's an object with string properties, sanitize them
    if (typeof data === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = decodeSearchResult(value);
      }
      return sanitized;
    }
    
    return String(data || '');
  }

  /**
   * Sanitize search text - fix Mojibake and remove non-printable ASCII
   */
  function sanitizeSearchText(text) {
    if (typeof text !== 'string') {
      text = String(text || '');
    }
    
    // Remove non-printable ASCII characters (Pre-Search Filter)
    text = text.replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '');
    
    // Fix common Mojibake patterns
    text = text
      .replace(/ÃƒÂ°/g, '°')
      .replace(/Ã—/g, '×')
      .replace(/â€™/g, "'")
      .replace(/â€œ/g, '"')
      .replace(/â€/g, '"')
      .replace(/â€"/g, '—')
      .replace(/â€"/g, '–')
      .replace(/â†'/g, '→')
      .replace(/â†'/g, '←')
      .replace(/â±ï¸Â±/g, '⏱️')
      .replace(/ðŸ"Š/g, '📊')
      .replace(/ðŸ"/g, '🏠');
    
    return text.trim();
  }

  /**
   * Pre-Search Filter: Strip non-printable ASCII from node data
   */
  function preSearchFilter(node) {
    if (!node || typeof node !== 'object') {
      return null;
    }
    
    const filtered = {};
    
    // Filter title
    if (node.title != null) {
      filtered.title = sanitizeSearchText(String(node.title));
      if (!filtered.title) return null; // Prune if title is empty after filtering
    }
    
    // Filter description
    if (node.description != null) {
      filtered.description = sanitizeSearchText(String(node.description));
    } else {
      filtered.description = '';
    }
    
    // Preserve other fields
    filtered.id = node.id;
    filtered.ref = node.ref;
    filtered.status = node.status;
    
    return filtered;
  }

  // Export to window
  window.SearchEncoder = {
    encodeSearchQuery,
    decodeSearchResult,
    sanitizeSearchText,
    preSearchFilter
  };

  console.log('[Search Encoder] UTF-8 encoding utilities loaded');
})();
