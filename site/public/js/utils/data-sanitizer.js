/**
 * Data Sanitization Utilities
 * Provides safe defaults and cleaning for dynamic content
 */

(function() {
  'use strict';

  /**
   * Default data structures for safe fallbacks
   */
  const DEFAULT_STRUCTURES = {
    tool: {
      id: '',
      name: '',
      title: '',
      slug: '',
      description: '',
      summary: '',
      duration: '',
      difficulty: '',
      where_it_came_from: 'production_verified',
      how_it_works: '',
      steps: [],
      disclaimer: 'This is a practical tool, not a replacement for professional support. This is here if you want it. Use what helps. Ignore what doesn\'t.'
    },
    gate: {
      id: '',
      title: '',
      description: '',
      painPoints: []
    },
    painPoint: {
      id: '',
      title: '',
      description: '',
      toolIds: [],
      tools: []
    },
    toolsResponse: {
      tools: []
    },
    gatesResponse: {
      gates: []
    },
    painPointsResponse: {
      painPoints: {}
    }
  };

  /**
   * Clean data with default structure
   */
  function cleanData(data, type = 'tool') {
    const defaultStructure = DEFAULT_STRUCTURES[type] || DEFAULT_STRUCTURES.tool;
    
    if (!data || typeof data !== 'object') {
      return { ...defaultStructure };
    }

    // Deep merge with defaults
    const cleaned = { ...defaultStructure };
    
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = data[key];
        
        // Handle null/undefined
        if (value === null || value === undefined) {
          cleaned[key] = defaultStructure[key] ?? null;
          continue;
        }
        
        // Handle arrays
        if (Array.isArray(defaultStructure[key])) {
          cleaned[key] = Array.isArray(value) ? value.filter(Boolean) : [];
          continue;
        }
        
        // Handle objects
        if (typeof defaultStructure[key] === 'object' && defaultStructure[key] !== null && !Array.isArray(defaultStructure[key])) {
          cleaned[key] = typeof value === 'object' && value !== null ? { ...defaultStructure[key], ...value } : defaultStructure[key];
          continue;
        }
        
        // Handle strings - truncate if too long
        if (typeof defaultStructure[key] === 'string') {
          const maxLength = key === 'description' || key === 'how_it_works' ? 10000 : 500;
          cleaned[key] = typeof value === 'string' 
            ? (value.length > maxLength ? value.substring(0, maxLength - 3) + '...' : value)
            : String(value || defaultStructure[key] || '');
          continue;
        }
        
        // Default: use value if it matches expected type
        cleaned[key] = value;
      }
    }
    
    return cleaned;
  }

  /**
   * Clean array of data
   */
  function cleanDataArray(dataArray, type = 'tool') {
    if (!Array.isArray(dataArray)) {
      return [];
    }
    
    return dataArray
      .filter(item => item && typeof item === 'object')
      .map(item => cleanData(item, type));
  }

  /**
   * Safe field accessor with default
   */
  function safeGet(data, field, defaultValue = '') {
    if (!data || typeof data !== 'object') {
      return defaultValue;
    }
    
    const value = data[field];
    return value !== null && value !== undefined ? value : defaultValue;
  }

  /**
   * Ensure where_it_came_from is always present
   */
  function ensureWhereItCameFrom(data) {
    if (!data || typeof data !== 'object') {
      return { where_it_came_from: 'production_verified' };
    }
    
    return {
      ...data,
      where_it_came_from: data.where_it_came_from ?? 'production_verified'
    };
  }

  // Export
  if (typeof window !== 'undefined') {
    window.RYD_DataSanitizer = {
      where_it_came_from: {
        origin: "internal",
        basis: "built for Ride Your Demons platform",
        source_type: "system-utility",
        verified: true
      },
      cleanData,
      cleanDataArray,
      safeGet,
      ensureWhereItCameFrom,
      DEFAULT_STRUCTURES
    };
  }
})();
