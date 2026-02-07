/**
 * Memoization and Caching Utilities
 * Prevents unnecessary re-renders and API calls
 */

(function() {
  'use strict';

  /**
   * Simple memoization cache
   */
  class MemoCache {
    constructor(maxSize = 100, ttl = 300000) { // 5 min default TTL
      this.cache = new Map();
      this.maxSize = maxSize;
      this.ttl = ttl;
    }

    get(key) {
      const entry = this.cache.get(key);
      if (!entry) return null;
      
      // Check if expired
      if (Date.now() - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        return null;
      }
      
      return entry.value;
    }

    set(key, value) {
      // Evict oldest if at max size
      if (this.cache.size >= this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      
      this.cache.set(key, {
        value,
        timestamp: Date.now()
      });
    }

    clear() {
      this.cache.clear();
    }

    has(key) {
      return this.cache.has(key) && this.get(key) !== null;
    }
  }

  /**
   * Memoize a function
   */
  function memoize(fn, options = {}) {
    const cache = new MemoCache(options.maxSize, options.ttl);
    const keyFn = options.keyFn || ((...args) => JSON.stringify(args));
    
    return function(...args) {
      const key = keyFn(...args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = fn.apply(this, args);
      cache.set(key, result);
      return result;
    };
  }

  /**
   * Debounce function calls
   */
  function debounce(fn, delay = 300) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /**
   * Throttle function calls
   */
  function throttle(fn, limit = 1000) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Global cache instances
  const dataCache = new MemoCache(50, 300000); // 5 min TTL
  const renderCache = new MemoCache(100, 60000); // 1 min TTL

  window.RYD_Cache = {
    where_it_came_from: {
      origin: "internal",
      basis: "built for Ride Your Demons platform",
      source_type: "system-utility",
      verified: true
    },
    MemoCache,
    memoize,
    debounce,
    throttle,
    dataCache,
    renderCache
  };
})();
