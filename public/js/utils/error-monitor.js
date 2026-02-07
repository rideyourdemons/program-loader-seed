/**
 * Error Monitoring Service
 * Logs errors without breaking the main thread or user view
 */

(function() {
  'use strict';

  const ERROR_QUEUE = [];
  const MAX_QUEUE_SIZE = 100;

  /**
   * Safe error logging that never throws
   */
  function logError(error, context = {}) {
    try {
      const errorInfo = {
        message: error?.message || String(error),
        stack: error?.stack,
        name: error?.name,
        context: context,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
      };

      // Add to queue
      ERROR_QUEUE.push(errorInfo);
      if (ERROR_QUEUE.length > MAX_QUEUE_SIZE) {
        ERROR_QUEUE.shift(); // Remove oldest
      }

      // Log to console (warn, not error, to avoid breaking)
      console.warn('[RYD Error Monitor]', errorInfo.message, errorInfo.context);

      // Send to monitoring service if configured
      if (typeof window !== 'undefined' && window.RYD_CONFIG && window.RYD_CONFIG.ERROR_ENDPOINT) {
        // Fire and forget - don't wait for response
        fetch(window.RYD_CONFIG.ERROR_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorInfo)
        }).catch(() => {
          // Silently fail - don't break the app
        });
      }

      return errorInfo;
    } catch (loggingError) {
      // Even error logging can't throw
      console.warn('[RYD Error Monitor] Failed to log error:', loggingError);
      return null;
    }
  }

  /**
   * Get error queue (for debugging)
   */
  function getErrorQueue() {
    return [...ERROR_QUEUE];
  }

  /**
   * Clear error queue
   */
  function clearErrorQueue() {
    ERROR_QUEUE.length = 0;
  }

  /**
   * Wrap function with error monitoring
   */
  function monitorFunction(fn, context = {}) {
    return function(...args) {
      try {
        return fn.apply(this, args);
      } catch (error) {
        logError(error, { ...context, function: fn.name || 'anonymous' });
        // Return safe fallback instead of throwing
        return null;
      }
    };
  }

  /**
   * Wrap async function with error monitoring
   */
  function monitorAsyncFunction(fn, context = {}) {
    return async function(...args) {
      try {
        return await fn.apply(this, args);
      } catch (error) {
        logError(error, { ...context, function: fn.name || 'anonymous' });
        // Return safe fallback instead of throwing
        return null;
      }
    };
  }

  // Global error handler (never throws)
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      logError(event.error || event.message, {
        type: 'global',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
      // Don't prevent default - let browser handle it, but we've logged it
    });

    window.addEventListener('unhandledrejection', (event) => {
      logError(event.reason, {
        type: 'unhandledRejection',
        promise: event.promise
      });
      // Don't prevent default
    });
  }

  // Export
  if (typeof window !== 'undefined') {
    window.RYD_ErrorMonitor = {
      where_it_came_from: {
        origin: "internal",
        basis: "built for Ride Your Demons platform",
        source_type: "system-utility",
        verified: true
      },
      logError,
      getErrorQueue,
      clearErrorQueue,
      monitorFunction,
      monitorAsyncFunction
    };
  }
})();
