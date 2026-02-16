/**
 * Safe Data Mapper - Anti-Null Logic & Encoding Sanitization
 * Prevents data leakage and encoding errors in the Million-Node Matrix
 */

(function() {
  'use strict';

  /**
   * Sanitize string to remove mojibake and non-standard characters
   */
  function sanitizeString(str) {
    if (str == null) return '';
    if (typeof str !== 'string') str = String(str);
    
    // Remove BOM and other hidden characters
    str = str.replace(/^\uFEFF/, ''); // BOM
    str = str.replace(/[\u200B-\u200D\uFEFF]/g, ''); // Zero-width characters
    
    // Fix common mojibake patterns
    str = str.replace(/ÃƒÂ°/g, '🔍');
    str = str.replace(/Ã—/g, '×');
    str = str.replace(/â€º/g, '›');
    str = str.replace(/â†'/g, '→');
    str = str.replace(/â†'/g, '←');
    str = str.replace(/âš ï¸/g, '⚠️');
    str = str.replace(/ðŸ"/g, '🏠');
    str = str.replace(/ðŸ"Š/g, '📊');
    str = str.replace(/ðŸ"–/g, '📖');
    str = str.replace(/â±ï¸Â±/g, '⏱️');
    str = str.replace(/â±ï¸Â±/g, '⏱️');
    str = str.replace(/âœ…/g, '✅');
    str = str.replace(/â€"/g, '—');
    
    // Remove any remaining non-printable characters except newlines and tabs
    str = str.replace(/[^\x20-\x7E\n\t\u00A0-\uFFFF]/g, '');
    
    return str.trim();
  }

  /**
   * Check if value is null, undefined, or literal 'null' string
   */
  function isNullish(value) {
    if (value == null) return true;
    if (typeof value === 'string' && value.trim().toLowerCase() === 'null') return true;
    if (typeof value === 'string' && value.trim() === '') return false; // Empty string is valid
    return false;
  }

  /**
   * Safe getter with fallback
   */
  function safeGet(obj, path, fallback = '') {
    if (!obj || typeof obj !== 'object') return fallback;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current == null || typeof current !== 'object') return fallback;
      current = current[key];
      if (isNullish(current)) return fallback;
    }
    
    return sanitizeString(current);
  }

  /**
   * Safe map with null filtering
   */
  function safeMap(array, mapper, options = {}) {
    if (!Array.isArray(array)) return [];
    
    const { skipNull = true, sanitize = true } = options;
    const results = [];
    
    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      if (skipNull && isNullish(item)) continue;
      
      try {
        const mapped = mapper(item, i, array);
        if (skipNull && isNullish(mapped)) continue;
        
        if (sanitize && typeof mapped === 'object' && mapped !== null) {
          // Recursively sanitize object properties
          const sanitized = {};
          for (const key in mapped) {
            if (mapped.hasOwnProperty(key)) {
              const value = mapped[key];
              if (typeof value === 'string') {
                sanitized[key] = sanitizeString(value);
              } else {
                sanitized[key] = value;
              }
            }
          }
          results.push(sanitized);
        } else {
          results.push(mapped);
        }
      } catch (error) {
        console.warn('[SafeMapper] Error mapping item at index', i, error);
        continue;
      }
    }
    
    return results;
  }

  /**
   * Safe find with null checking
   */
  function safeFind(array, predicate) {
    if (!Array.isArray(array)) return null;
    
    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      if (isNullish(item)) continue;
      
      try {
        if (predicate(item, i, array)) {
          return sanitizeObject(item);
        }
      } catch (error) {
        console.warn('[SafeMapper] Error in find predicate at index', i, error);
        continue;
      }
    }
    
    return null;
  }

  /**
   * Safe filter with null checking
   */
  function safeFilter(array, predicate) {
    if (!Array.isArray(array)) return [];
    
    return safeMap(array, (item, index) => {
      try {
        return predicate(item, index, array) ? item : null;
      } catch (error) {
        console.warn('[SafeMapper] Error in filter predicate at index', index, error);
        return null;
      }
    }, { skipNull: true });
  }

  /**
   * Sanitize object recursively
   */
  function sanitizeObject(obj) {
    if (obj == null) return null;
    if (typeof obj !== 'object') return sanitizeString(obj);
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }
    
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (isNullish(value)) {
          continue; // Skip null values
        } else if (typeof value === 'string') {
          sanitized[key] = sanitizeString(value);
        } else if (typeof value === 'object') {
          sanitized[key] = sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
    }
    return sanitized;
  }

  /**
   * Safe fetch with UTF-8 encoding enforcement
   */
  async function safeFetch(url, options = {}) {
    let encodingError = false;
    let nullValueError = false;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json; charset=utf-8',
          ...options.headers
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Get text first to ensure UTF-8 decoding
      const text = await response.text();
      
      // Check for encoding issues
      if (/[^\x20-\x7E\n\t\u00A0-\uFFFF]/.test(text) || /Ã|â€|ðŸ|â±/.test(text)) {
        encodingError = true;
      }
      
      // Parse JSON with error handling
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('[SafeMapper] JSON parse error for', url, parseError);
        encodingError = true;
        // Try to fix common encoding issues before parsing
        const fixedText = text
          .replace(/â€™/g, "'")
          .replace(/â€œ/g, '"')
          .replace(/â€/g, '"')
          .replace(/â€"/g, '—')
          .replace(/â€"/g, '–');
        try {
          data = JSON.parse(fixedText);
        } catch (e) {
          // Report to GA4 if available
          reportDataIntegrityError('json_parse_failed', { url, error: parseError.message });
          throw e;
        }
      }
      
      // Check for null values in critical fields
      if (data && typeof data === 'object') {
        const hasNullValues = checkForNullValues(data);
        if (hasNullValues) {
          nullValueError = true;
        }
      }
      
      // Apply Strict-Schema filter if available (auto-repair)
      let sanitized = sanitizeObject(data);
      
      if (window.StrictSchemaFilter) {
        if (Array.isArray(sanitized)) {
          sanitized = window.StrictSchemaFilter.filterNodeArray(sanitized);
        } else if (typeof sanitized === 'object' && sanitized !== null) {
          // Apply strict schema to object
          sanitized = window.StrictSchemaFilter.strictSchemaFilter(sanitized) || sanitized;
        }
      }
      
      // Report errors to GA4
      if (encodingError || nullValueError) {
        reportDataIntegrityError('data_integrity_issue', {
          url,
          encodingError,
          nullValueError,
          dataType: Array.isArray(data) ? 'array' : typeof data
        });
      }
      
      return sanitized;
    } catch (error) {
      console.error('[SafeMapper] Fetch error for', url, error);
      reportDataIntegrityError('fetch_failed', { url, error: error.message });
      throw error;
    }
  }

  /**
   * Check for null values in data structure
   */
  function checkForNullValues(obj, path = '') {
    if (obj == null) return true;
    if (typeof obj !== 'object') return false;
    if (Array.isArray(obj)) {
      return obj.some((item, index) => checkForNullValues(item, `${path}[${index}]`));
    }
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      if (isNullish(value)) {
        console.warn('[SafeMapper] Null value detected at:', currentPath);
        return true;
      }
      if (typeof value === 'object' && value !== null) {
        if (checkForNullValues(value, currentPath)) return true;
      }
    }
    return false;
  }

  /**
   * Report data integrity errors to GA4
   * Professional GA4 Integration: matrix_exception event
   */
  function reportDataIntegrityError(errorType, errorData) {
    if (typeof window === 'undefined') return;
    
    // Sanitize error data for GA4
    const sanitizedData = {};
    if (errorData) {
      for (const [key, value] of Object.entries(errorData)) {
        // Only allow safe parameter names
        if (/^[a-z_][a-z0-9_]*$/i.test(key) && key.length < 50) {
          // Sanitize value
          let sanitizedValue = value;
          if (typeof value === 'string') {
            sanitizedValue = value
              .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '')
              .substring(0, 100);
          } else if (typeof value === 'object') {
            sanitizedValue = JSON.stringify(value).substring(0, 100);
          }
          sanitizedData[key] = sanitizedValue;
        }
      }
    }
    
    // Try GA4 gtag first - matrix_exception event
    if (typeof window.gtag === 'function') {
      try {
        window.gtag('event', 'matrix_exception', {
          exception_type: errorType,
          exception_category: 'data_integrity',
          ...sanitizedData,
          page_path: window.location.pathname,
          page_title: document.title.substring(0, 100)
        });
      } catch (e) {
        console.warn('[SafeMapper] GA4 gtag error:', e);
      }
    }
    
    // Fallback to RYD_ANALYTICS if available
    if (window.RYD_ANALYTICS && typeof window.RYD_ANALYTICS.pushEvent === 'function') {
      try {
        window.RYD_ANALYTICS.pushEvent('matrix_exception', {
          exception_type: errorType,
          exception_category: 'data_integrity',
          ...sanitizedData,
          page_path: window.location.pathname
        });
      } catch (e) {
        console.warn('[SafeMapper] RYD_ANALYTICS error:', e);
      }
    }
  }

  /**
   * Safe-Render wrapper - prevents null/undefined/corrupted strings from rendering
   */
  function safeRender(value, fallback = '') {
    if (isNullish(value)) {
      reportDataIntegrityError('null_value_rendered', { value, fallback });
      return fallback;
    }
    
    const sanitized = sanitizeString(value);
    if (sanitized !== value) {
      reportDataIntegrityError('encoding_corruption_detected', { 
        original: value.substring(0, 50),
        sanitized: sanitized.substring(0, 50)
      });
    }
    
    return sanitized;
  }

  // Export to window
  window.SafeMapper = {
    sanitizeString,
    isNullish,
    safeGet,
    safeMap,
    safeFind,
    safeFilter,
    sanitizeObject,
    safeFetch,
    safeRender,
    reportDataIntegrityError,
    checkForNullValues
  };

  console.log('[SafeMapper] Safe data mapping utilities loaded with GA4 integration');
})();
