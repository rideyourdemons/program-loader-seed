import { logger } from "./logger.js";
import auditSystem from "./audit-system.js";
import learningMemory from "./learning-memory.js";
import firebaseBackend from "./firebase-backend.js";
import navigationController from "./navigation-controller.js";
import codeAuditor from "./code-auditor.js";
import localExecutor from "./local-executor.js";

/**
 * Operational Monitoring Loops
 * Continuous monitoring with learning and adaptation
 */
class MonitoringLoops {
  constructor() {
    this.loops = new Map(); // loopId -> { interval, callback, running }
    this.monitoringData = new Map(); // loopId -> data
  }

  /**
   * Start monitoring loop
   * @param {string} loopId - Unique loop identifier
   * @param {Function} callback - Function to execute
   * @param {number} intervalMs - Interval in milliseconds
   * @param {Object} options - Additional options
   * @returns {string} loopId
   */
  startLoop(loopId, callback, intervalMs, options = {}) {
    if (this.loops.has(loopId)) {
      logger.warn(`Loop ${loopId} already exists. Stopping previous instance.`);
      this.stopLoop(loopId);
    }

    const loop = {
      interval: intervalMs,
      callback,
      running: true,
      lastRun: null,
      runCount: 0,
      errorCount: 0,
      options
    };

    const executeLoop = async () => {
      if (!loop.running) return;

      try {
        loop.lastRun = new Date().toISOString();
        loop.runCount++;

        auditSystem.log('MONITORING_LOOP_EXECUTE', { loopId, runCount: loop.runCount });

        const result = await callback();
        
        // Store monitoring data
        this.monitoringData.set(loopId, {
          ...this.monitoringData.get(loopId),
          lastResult: result,
          lastSuccess: true,
          lastRun: loop.lastRun
        });

        // Learn from successful execution
        if (result && typeof result === 'object') {
          learningMemory.learnPattern(`monitoring_${loopId}`, {
            result,
            success: true
          });
        }

      } catch (error) {
        loop.errorCount++;
        logger.error(`Monitoring loop ${loopId} error: ${error.message}`);
        
        this.monitoringData.set(loopId, {
          ...this.monitoringData.get(loopId),
          lastError: error.message,
          lastSuccess: false,
          lastRun: loop.lastRun
        });

        // Learn from error
        learningMemory.saveSolution(
          `Monitoring loop ${loopId} error`,
          error.message,
          false
        );

        auditSystem.recordIssue('MONITORING_LOOP_ERROR', 
          `Loop ${loopId} error: ${error.message}`, {
          loopId,
          error: error.message,
          severity: 'medium'
        });
      }

      // Schedule next execution
      if (loop.running) {
        setTimeout(executeLoop, intervalMs);
      }
    };

    this.loops.set(loopId, loop);
    
    // Start immediately
    executeLoop();
    
    logger.info(`Monitoring loop started: ${loopId} (interval: ${intervalMs}ms)`);
    auditSystem.log('MONITORING_LOOP_STARTED', { loopId, interval: intervalMs });

    return loopId;
  }

  /**
   * Stop monitoring loop
   * @param {string} loopId
   */
  stopLoop(loopId) {
    const loop = this.loops.get(loopId);
    if (loop) {
      loop.running = false;
      this.loops.delete(loopId);
      logger.info(`Monitoring loop stopped: ${loopId}`);
      auditSystem.log('MONITORING_LOOP_STOPPED', { loopId });
    }
  }

  /**
   * Stop all loops
   */
  stopAllLoops() {
    for (const loopId of this.loops.keys()) {
      this.stopLoop(loopId);
    }
  }

  /**
   * Get loop status
   * @param {string} loopId
   * @returns {Object|null}
   */
  getLoopStatus(loopId) {
    const loop = this.loops.get(loopId);
    if (!loop) return null;

    return {
      loopId,
      running: loop.running,
      interval: loop.interval,
      runCount: loop.runCount,
      errorCount: loop.errorCount,
      lastRun: loop.lastRun,
      data: this.monitoringData.get(loopId)
    };
  }

  /**
   * List all active loops
   * @returns {Array}
   */
  listLoops() {
    return Array.from(this.loops.entries()).map(([loopId, loop]) => ({
      loopId,
      running: loop.running,
      interval: loop.interval,
      runCount: loop.runCount,
      errorCount: loop.errorCount,
      lastRun: loop.lastRun
    }));
  }

  /**
   * Start Firebase backend monitoring loop
   * @param {string} sessionId - Firebase session ID
   * @param {number} intervalMs - Interval in milliseconds
   * @returns {string} loopId
   */
  startFirebaseMonitoring(sessionId, intervalMs = 60000) {
    return this.startLoop('firebase_backend', async () => {
      try {
        // Monitor Firestore collections
        const collections = ['users', 'data', 'config'];
        const results = {};

        for (const collection of collections) {
          try {
            const docs = await firebaseBackend.readCollection(collection, { limit: 10 });
            results[collection] = {
              count: docs.length,
              status: 'accessible'
            };
          } catch (error) {
            results[collection] = {
              status: 'error',
              error: error.message
            };
          }
        }

        // Monitor auth users
        try {
          const users = await firebaseBackend.listUsers(10);
          results.auth = {
            userCount: users.length,
            status: 'accessible'
          };
        } catch (error) {
          results.auth = {
            status: 'error',
            error: error.message
          };
        }

        return results;
      } catch (error) {
        throw new Error(`Firebase monitoring error: ${error.message}`);
      }
    }, intervalMs);
  }

  /**
   * Start website monitoring loop
   * @param {string} sessionId - Website session ID
   * @param {number} intervalMs - Interval in milliseconds
   * @returns {string} loopId
   */
  startWebsiteMonitoring(sessionId, intervalMs = 60000) {
    return this.startLoop('website', async () => {
      try {
        const url = await navigationController.getCurrentUrl(sessionId);
        const content = await navigationController.getCurrentContent(sessionId);
        
        // Analyze content for changes
        const analysis = codeAuditor.analyzeCode(content, url);
        
        return {
          url,
          contentSize: content.length,
          issues: analysis.issues.length,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        throw new Error(`Website monitoring error: ${error.message}`);
      }
    }, intervalMs);
  }

  /**
   * Start code monitoring loop
   * @param {string} sessionId - Session ID
   * @param {Array} filePaths - Files to monitor
   * @param {number} intervalMs - Interval in milliseconds
   * @returns {string} loopId
   */
  startCodeMonitoring(sessionId, filePaths, intervalMs = 300000) {
    return this.startLoop('code_monitoring', async () => {
      try {
        codeAuditor.setSession(sessionId);
        const results = [];

        for (const filePath of filePaths) {
          try {
            const result = await codeAuditor.auditFile(filePath);
            results.push({
              file: filePath,
              issues: result.analysis.issues.length,
              status: 'checked'
            });
          } catch (error) {
            results.push({
              file: filePath,
              status: 'error',
              error: error.message
            });
          }
        }

        return results;
      } catch (error) {
        throw new Error(`Code monitoring error: ${error.message}`);
      }
    }, intervalMs);
  }
}

export const monitoringLoops = new MonitoringLoops();
export default monitoringLoops;

