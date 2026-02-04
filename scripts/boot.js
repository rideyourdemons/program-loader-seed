import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { loadPrograms } from "../core/loader.js";
import { registry } from "../core/registry.js";
import { logger } from "../core/logger.js";
import errorTracker from "../core/error-tracker.js";
import { setupGlobalErrorHandlers } from "../core/error-handler.js";
import { setProgramRunning, addError, getState } from "../core/state.js";
import { validateConfigFiles } from "../core/config-validator.js";
import { logHealthStatus } from "../core/health.js";
import appConfig from "../config/app.config.json" with { type: "json" };
import programsConfig from "../config/programs.config.json" with { type: "json" };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config();

async function boot() {
  try {
    logger.info(`Booting ${appConfig.appName} (Environment: ${appConfig.environment})`);

    // Validate configuration files
    await validateConfigFiles();

    // Load all programs
    await loadPrograms(
      path.join(__dirname, "../programs"),
      programsConfig.enabledPrograms
    );

    // Start all registered programs
    logger.info(`Starting ${registry.size} program(s)`);
    
    const startPromises = [];
    
    for (const [name, entry] of registry.entries()) {
      const { program } = entry;
      
      try {
        logger.info(`Starting program: ${name}`);
        setProgramRunning(name, "starting");
        
        // Execute program - handle both sync and async
        const result = program();
        
        if (result instanceof Promise) {
          // Handle async programs
          startPromises.push(
            result
              .then(() => {
                setProgramRunning(name, "running");
                logger.info(`Program ${name} started successfully`);
              })
              .catch((error) => {
                setProgramRunning(name, "error");
                logger.error(`Program ${name} failed to start:`, error.message);
                addError(error);
                errorTracker.recordError(error, {
                  operation: 'programStart',
                  module: 'boot',
                  function: 'boot',
                  programName: name
                });
              })
          );
        } else {
          // Sync program completed immediately
          setProgramRunning(name, "running");
          logger.info(`Program ${name} started successfully`);
        }
      } catch (error) {
        setProgramRunning(name, "error");
        logger.error(`Failed to start program ${name}:`, error.message);
        addError(error);
        errorTracker.recordError(error, {
          operation: 'programStart',
          module: 'boot',
          function: 'boot',
          programName: name
        });
      }
    }

    // Wait for all async programs to start
    await Promise.allSettled(startPromises);

    // Log final state and health
    const finalState = getState();
    logger.info(`Boot completed. Uptime: ${finalState.uptime}ms`);
    logHealthStatus();
    logger.debug("Final state:", JSON.stringify(finalState, null, 2));

  } catch (error) {
    errorTracker.recordError(error, {
      operation: 'boot',
      module: 'boot',
      function: 'boot',
      fatal: true
    });
    
    logger.error("Fatal error during boot:", error.message);
    logger.error("Stack trace:", error.stack);
    addError(error);
    
    // Save error report
    try {
      errorTracker.saveReport('json');
    } catch (reportError) {
      logger.error('Failed to save error report:', reportError);
    }
    
    process.exit(1);
  }
}

// Setup global error handlers (replaces the basic handlers below)
setupGlobalErrorHandlers();

boot();
