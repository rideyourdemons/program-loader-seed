/**
 * Validation Schemas using Zod-like structure
 * Validates API data structure before rendering
 */

(function() {
  'use strict';

  /**
   * Simple validation library (Zod-like API)
   * Since we're in vanilla JS, we'll create a lightweight validator
   */
  class Validator {
    constructor(name, validateFn) {
      this.name = name;
      this.validate = validateFn;
    }

    parse(data) {
      const result = this.validate(data);
      if (!result.success) {
        throw new ValidationError(result.error, this.name);
      }
      return result.data;
    }

    safeParse(data) {
      return this.validate(data);
    }
  }

  class ValidationError extends Error {
    constructor(message, field) {
      super(message);
      this.name = 'ValidationError';
      this.field = field;
    }
  }

  /**
   * String validator
   */
  function string() {
    return new Validator('string', (data) => {
      if (typeof data !== 'string') {
      return { success: false, error: 'Expected string', data: null };
      }
      // Handle null/undefined strings
      if (data === null || data === undefined) {
        return { success: false, error: 'String is null or undefined', data: null };
      }
      // Truncate extremely long strings (prevent UI breakage)
      const maxLength = 10000;
      const truncated = data.length > maxLength ? data.substring(0, maxLength) : data;
      return { success: true, data: truncated };
    });
  }

  /**
   * Array validator
   */
  function array(itemValidator) {
    return new Validator('array', (data) => {
      if (!Array.isArray(data)) {
        return { success: false, error: 'Expected array', data: null };
      }
      // Handle null/undefined
      if (data === null || data === undefined) {
        return { success: true, data: [] }; // Return empty array as fallback
      }
      // Validate each item if validator provided
      if (itemValidator) {
        const validated = [];
        for (let i = 0; i < data.length; i++) {
          const result = itemValidator.safeParse ? itemValidator.safeParse(data[i]) : { success: true, data: data[i] };
          if (result.success) {
            validated.push(result.data);
          } else {
            console.warn(`[Validation] Skipping invalid array item at index ${i}:`, result.error);
          }
        }
        return { success: true, data: validated };
      }
      return { success: true, data: data };
    });
  }

  /**
   * Object validator
   */
  function object(schema) {
    return new Validator('object', (data) => {
      if (data === null || data === undefined) {
        return { success: false, error: 'Object is null or undefined', data: null };
      }
      if (typeof data !== 'object' || Array.isArray(data)) {
        return { success: false, error: 'Expected object', data: null };
      }
      
      const validated = {};
      for (const [key, validator] of Object.entries(schema)) {
        if (validator && typeof validator.safeParse === 'function') {
          const result = validator.safeParse(data[key]);
          if (result.success) {
            validated[key] = result.data;
          } else {
            // Use fallback value if available
            validated[key] = data[key] !== undefined ? data[key] : null;
            console.warn(`[Validation] Field "${key}" validation failed:`, result.error);
          }
        } else {
          validated[key] = data[key] !== undefined ? data[key] : null;
        }
      }
      return { success: true, data: validated };
    });
  }

  /**
   * Optional validator with default value
   */
  function optional(validator, defaultValue = null) {
    return new Validator('optional', (data) => {
      if (data === null || data === undefined) {
        return { success: true, data: defaultValue };
      }
      return validator.safeParse ? validator.safeParse(data) : { success: true, data };
    });
  }

  /**
   * Default value helper for optional fields
   */
  function defaultTo(value) {
    return (validator) => optional(validator, value);
  }

  /**
   * Number validator
   */
  function number() {
    return new Validator('number', (data) => {
      if (typeof data !== 'number' || isNaN(data)) {
        return { success: false, error: 'Expected number', data: null };
      }
      return { success: true, data };
    });
  }

  /**
   * Boolean validator
   */
  function boolean() {
    return new Validator('boolean', (data) => {
      if (typeof data !== 'boolean') {
        return { success: false, error: 'Expected boolean', data: null };
      }
      return { success: true, data };
    });
  }

  /**
   * Predefined schemas for RYD data structures
   */
  const schemas = {
    tool: object({
      id: string(),
      name: optional(string()),
      title: optional(string()),
      slug: optional(string()),
      description: optional(string()),
      summary: optional(string()),
      duration: optional(string()),
      difficulty: optional(string()),
      where_it_came_from: optional(string(), 'production_verified'),
      how_it_works: optional(string()),
      steps: optional(array(string())),
      disclaimer: optional(string())
    }),

    gate: object({
      id: string(),
      title: string(),
      description: optional(string()),
      painPoints: optional(array(object({
        id: string(),
        title: string(),
        toolIds: optional(array(string())),
        tools: optional(array(string()))
      })))
    }),

    painPoint: object({
      id: string(),
      title: string(),
      description: optional(string()),
      toolIds: optional(array(string())),
      tools: optional(array(string()))
    }),

    gatesResponse: object({
      gates: array(object({
        id: string(),
        title: string(),
        description: optional(string())
      }))
    }),

    painPointsResponse: object({
      painPoints: optional(object({})) // Dynamic structure
    }),

    toolsResponse: object({
      tools: array(object({
        id: string(),
        name: optional(string()),
        title: optional(string()),
        slug: optional(string())
      }))
    })
  };

  /**
   * Validate data against schema with graceful fallback
   */
  function validateData(data, schema, fallback = null) {
    try {
      if (!schema || !schema.safeParse) {
        console.warn('[Validation] Invalid schema provided');
        return { success: false, data: fallback };
      }
      
      const result = schema.safeParse(data);
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        console.warn('[Validation] Validation failed:', result.error);
        return { success: false, data: fallback, error: result.error };
      }
    } catch (error) {
      console.error('[Validation] Validation error:', error);
      return { success: false, data: fallback, error: error.message };
    }
  }

  /**
   * Safe accessor for where_it_came_from field
   */
  function safeGetWhereItCameFrom(data) {
    return data?.where_it_came_from ?? 'hardened_stable_fallback';
  }

  window.RYD_Validation = {
    where_it_came_from: {
      origin: "internal",
      basis: "built for Ride Your Demons platform",
      source_type: "system-utility",
      verified: true
    },
    string,
    array,
    object,
    optional,
    number,
    boolean,
    schemas,
    validateData,
    ValidationError,
    safeGetWhereItCameFrom
  };
})();
