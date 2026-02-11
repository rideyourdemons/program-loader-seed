/**
 * Performance Debounce Utilities
 * Prevents performance issues during high-node-density navigation
 */

(function() {
  'use strict';

  /**
   * Debounce function - delays execution until after wait time
   */
  function debounce(func, wait = 250) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function - limits execution frequency
   */
  function throttle(func, limit = 250) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Debounced matrix recalculation
   */
  function debounceMatrixRecalc(calcFunction, wait = 250) {
    return debounce(calcFunction, wait);
  }

  /**
   * Performance monitor for matrix operations
   */
  function monitorMatrixPerformance(operationName, operation) {
    const start = performance.now();
    try {
      const result = operation();
      const duration = performance.now() - start;
      
      if (duration > 100) {
        console.warn(`[Performance] ${operationName} took ${duration.toFixed(2)}ms`);
        
        // Report to GA4 if available
        if (typeof window.gtag === 'function') {
          try {
            window.gtag('event', 'matrix_performance_warning', {
              operation: operationName,
              duration_ms: Math.round(duration),
              page_path: window.location.pathname
            });
          } catch (e) {
            // Ignore GA4 errors
          }
        }
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`[Performance] ${operationName} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  // Export to window
  window.PerformanceUtils = {
    debounce,
    throttle,
    debounceMatrixRecalc,
    monitorMatrixPerformance
  };

  console.log('[Performance Utils] Debounce and performance monitoring loaded');
})();
