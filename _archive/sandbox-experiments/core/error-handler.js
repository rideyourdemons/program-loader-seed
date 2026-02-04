import errorTracker from "./error-tracker.js";
import { logger } from "./logger.js";

/**
 * Setup global error handlers for unhandled errors
 */
export function setupGlobalErrorHandlers() {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    errorTracker.recordError(error, {
      operation: 'uncaughtException',
      module: 'global',
      function: 'process',
      fatal: true
    });
    
    logger.error('Uncaught Exception:', error);
    
    // Save error report before exiting
    try {
      errorTracker.saveReport('json');
    } catch (reportError) {
      logger.error('Failed to save error report:', reportError);
    }
    
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    const error = reason instanceof Error 
      ? reason 
      : new Error(String(reason));
    
    errorTracker.recordError(error, {
      operation: 'unhandledRejection',
      module: 'global',
      function: 'process',
      promise: promise?.toString?.() || 'unknown',
      fatal: false
    });
    
    logger.error('Unhandled Promise Rejection:', reason);
  });

  // Handle warnings
  process.on('warning', (warning) => {
    logger.warn('Process Warning:', warning.name, warning.message);
    
    // Record warnings as low-severity errors for tracking
    if (warning.code === 'DEPRECATION') {
      errorTracker.recordError(new Error(`Deprecation Warning: ${warning.message}`), {
        operation: 'deprecation',
        module: 'global',
        function: 'process',
        warning: warning.toString(),
        severity: 'low'
      });
    }
  });

  logger.info('Global error handlers initialized');
}

/**
 * Wrap a script's main function with error tracking
 * @param {Function} mainFunction - Main function to wrap
 * @param {Object} context - Execution context
 */
export function wrapMain(mainFunction, context = {}) {
  return async (...args) => {
    try {
      return await mainFunction(...args);
    } catch (error) {
      errorTracker.recordError(error, {
        ...context,
        operation: context.operation || 'main',
        module: context.module || 'script',
        function: 'main'
      });
      
      // Generate and save error report
      try {
        const reportPath = errorTracker.saveReport('json');
        logger.info(`Error report saved: ${reportPath}`);
        
        // Also save HTML report
        const htmlReportPath = errorTracker.saveReport('html');
        logger.info(`HTML error report saved: ${htmlReportPath}`);
      } catch (reportError) {
        logger.error('Failed to save error report:', reportError);
      }
      
      throw error;
    } finally {
      // Save final error report on script completion
      try {
        const stats = errorTracker.getStats();
        if (stats.total > 0) {
          errorTracker.saveReport('json');
        }
      } catch (reportError) {
        logger.warn('Failed to save final error report:', reportError);
      }
    }
  };
}

export default { setupGlobalErrorHandlers, wrapMain };
