import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./logger.js";
import auditSystem from "./audit-system.js";
import learningMemory from "./learning-memory.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const errorsDir = path.join(__dirname, "../logs/errors");

// Ensure errors directory exists
if (!fs.existsSync(errorsDir)) {
  fs.mkdirSync(errorsDir, { recursive: true });
}

/**
 * Comprehensive Error Tracker
 * Logs all errors during execution, saves them, and provides solutions
 */
class ErrorTracker {
  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.errors = [];
    this.errorStats = {
      total: 0,
      byType: {},
      byContext: {},
      resolved: 0,
      unresolved: 0
    };
    this.errorLogFile = path.join(errorsDir, `errors_${this.sessionId}.json`);
    this.startTime = Date.now();
    
    // Load existing solutions for pattern matching
    this.solutionPatterns = this.loadSolutionPatterns();
  }

  /**
   * Load solution patterns from memory
   */
  loadSolutionPatterns() {
    try {
      const solutions = learningMemory.solutions;
      const patterns = {};
      
      for (const [key, solutionList] of Object.entries(solutions)) {
        const successful = solutionList.filter(s => s.successful);
        if (successful.length > 0) {
          patterns[key] = successful[successful.length - 1];
        }
      }
      
      return patterns;
    } catch (error) {
      logger.warn(`Failed to load solution patterns: ${error.message}`);
      return {};
    }
  }

  /**
   * Record an error with full context
   * @param {Error|string} error - Error object or message
   * @param {Object} context - Execution context
   * @returns {Object} Error record with solutions
   */
  recordError(error, context = {}) {
    const errorRecord = {
      id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      
      // Error details
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Error',
      code: error?.code,
      
      // Execution context
      context: {
        command: context.command || context.commandString || 'unknown',
        operation: context.operation || 'unknown',
        file: context.file || context.filePath,
        line: context.line,
        function: context.function || context.method,
        module: context.module || context.component,
        ...context
      },
      
      // Status tracking
      resolved: false,
      resolvedAt: null,
      resolution: null,
      
      // Solutions
      suggestedSolutions: [],
      appliedSolutions: []
    };

    // Get severity and store it
    errorRecord.severity = this.getSeverity(errorRecord);

    // Analyze error and suggest solutions
    errorRecord.suggestedSolutions = this.analyzeError(errorRecord);

    // Update statistics
    this.updateStats(errorRecord);

    // Add to errors list
    this.errors.push(errorRecord);

    // Log to standard logger
    logger.error(`[ERROR_TRACKER] ${errorRecord.message}`, {
      id: errorRecord.id,
      context: errorRecord.context,
      solutions: errorRecord.suggestedSolutions.length
    });

    // Log to audit system
    auditSystem.recordIssue(
      'EXECUTION_ERROR',
      errorRecord.message,
      {
        severity: this.getSeverity(errorRecord),
        errorId: errorRecord.id,
        ...errorRecord.context
      }
    );

    // Save to file immediately
    this.saveError(errorRecord);

    // Learn from error
    this.learnFromError(errorRecord);

    return errorRecord;
  }

  /**
   * Analyze error and generate solutions
   * @param {Object} errorRecord - Error record
   * @returns {Array} Suggested solutions
   */
  analyzeError(errorRecord) {
    const solutions = [];
    const message = errorRecord.message.toLowerCase();
    const errorName = errorRecord.name.toLowerCase();
    const context = errorRecord.context;

    // Check for known solutions in learning memory
    const similarSolutions = this.findSimilarSolutions(errorRecord);
    if (similarSolutions.length > 0) {
      solutions.push(...similarSolutions);
    }

    // Pattern-based solutions
    if (message.includes('not found') || message.includes('enoent')) {
      solutions.push({
        type: 'file_not_found',
        description: 'File or path does not exist',
        solution: `Check if the file/path exists: ${context.file || context.command}`,
        commands: [`ls -la "${context.file || context.path || ''}"`, `pwd`],
        priority: 'high'
      });
    }

    if (message.includes('permission denied') || message.includes('eacces')) {
      solutions.push({
        type: 'permission_denied',
        description: 'Insufficient permissions to perform operation',
        solution: 'Check file permissions or run with appropriate privileges',
        commands: [`ls -la "${context.file || ''}"`, `whoami`],
        priority: 'high'
      });
    }

    if (message.includes('connection') || message.includes('timeout') || message.includes('econnrefused')) {
      solutions.push({
        type: 'connection_error',
        description: 'Network connection failed or timed out',
        solution: 'Check network connectivity, firewall, or service availability',
        commands: ['ping -c 3 8.8.8.8', `netstat -an | grep ${context.port || ''}`],
        priority: 'medium'
      });
    }

    if (message.includes('module not found') || message.includes('cannot find module')) {
      solutions.push({
        type: 'module_not_found',
        description: 'Required module or package is missing',
        solution: 'Install missing dependencies',
        commands: ['npm install', 'npm install --save <module-name>'],
        priority: 'high'
      });
    }

    if (message.includes('syntax error') || message.includes('parse error')) {
      solutions.push({
        type: 'syntax_error',
        description: 'Code syntax is incorrect',
        solution: 'Check syntax at the reported line and fix the error',
        commands: [`node --check "${context.file || ''}"`],
        priority: 'high'
      });
    }

    if (message.includes('already in use') || message.includes('eaddrinuse')) {
      solutions.push({
        type: 'port_in_use',
        description: 'Port or resource is already in use',
        solution: 'Stop the process using the port or use a different port',
        commands: [`lsof -i :${context.port || 'PORT'}`],
        priority: 'medium'
      });
    }

    if (message.includes('unauthorized') || message.includes('authentication')) {
      solutions.push({
        type: 'authentication_error',
        description: 'Authentication failed',
        solution: 'Check credentials or authentication tokens',
        commands: [],
        priority: 'high'
      });
    }

    if (message.includes('memory') || message.includes('out of memory')) {
      solutions.push({
        type: 'memory_error',
        description: 'Insufficient memory available',
        solution: 'Free up memory or increase available resources',
        commands: ['free -h', 'ps aux --sort=-%mem | head'],
        priority: 'high'
      });
    }

    if (message.includes('timeout')) {
      solutions.push({
        type: 'timeout_error',
        description: 'Operation timed out',
        solution: 'Increase timeout value or check system performance',
        commands: [],
        priority: 'medium'
      });
    }

    // Firebase-specific errors
    if (message.includes('firebase') || context.module === 'firebase') {
      solutions.push({
        type: 'firebase_error',
        description: 'Firebase operation failed',
        solution: 'Check Firebase configuration, authentication, and network connectivity',
        commands: [],
        priority: 'high'
      });
    }

    // Website/navigation errors
    if (message.includes('navigation') || context.operation === 'navigate') {
      solutions.push({
        type: 'navigation_error',
        description: 'Website navigation failed',
        solution: 'Check URL validity, network connectivity, and browser session',
        commands: [],
        priority: 'medium'
      });
    }

    // Command execution errors
    if (context.operation === 'execute' || context.command) {
      solutions.push({
        type: 'command_execution_error',
        description: 'Command execution failed',
        solution: 'Verify command syntax, permissions, and dependencies',
        commands: [`which ${context.command?.split(' ')[0] || ''}`],
        priority: 'medium'
      });
    }

    // Generic solution if no specific pattern matched
    if (solutions.length === 0) {
      solutions.push({
        type: 'generic',
        description: 'Review error details and context',
        solution: 'Check the error message, stack trace, and execution context for clues',
        commands: [],
        priority: 'low'
      });
    }

    return solutions;
  }

  /**
   * Find similar solutions from learning memory
   * @param {Object} errorRecord - Error record
   * @returns {Array} Similar solutions
   */
  findSimilarSolutions(errorRecord) {
    const solutions = [];
    const message = errorRecord.message.toLowerCase();

    // Search for similar errors in learning memory
    for (const [key, solutionList] of Object.entries(learningMemory.solutions)) {
      const keyLower = key.toLowerCase();
      
      // Check if error message contains key words or vice versa
      if (keyLower.includes(message.substring(0, 30)) || 
          message.includes(keyLower.substring(0, 30))) {
        const successful = solutionList.filter(s => s.successful);
        if (successful.length > 0) {
          solutions.push({
            type: 'learned',
            description: `Previously successful solution for similar error`,
            solution: successful[successful.length - 1].solution,
            commands: [],
            priority: 'high',
            source: 'learning_memory'
          });
        }
      }
    }

    return solutions;
  }

  /**
   * Get error severity
   * @param {Object} errorRecord - Error record
   * @returns {string} Severity level
   */
  getSeverity(errorRecord) {
    const message = errorRecord.message.toLowerCase();
    
    if (message.includes('fatal') || message.includes('critical')) {
      return 'critical';
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'high';
    }
    if (message.includes('timeout') || message.includes('connection')) {
      return 'medium';
    }
    
    return 'medium';
  }

  /**
   * Update error statistics
   * @param {Object} errorRecord - Error record
   */
  updateStats(errorRecord) {
    this.errorStats.total++;
    
    // By type
    const errorType = errorRecord.name || 'Error';
    this.errorStats.byType[errorType] = (this.errorStats.byType[errorType] || 0) + 1;
    
    // By context
    const contextKey = errorRecord.context.operation || errorRecord.context.module || 'unknown';
    this.errorStats.byContext[contextKey] = (this.errorStats.byContext[contextKey] || 0) + 1;
    
    // Resolved/unresolved
    if (errorRecord.resolved) {
      this.errorStats.resolved++;
    } else {
      this.errorStats.unresolved++;
    }
  }

  /**
   * Save error to file
   * @param {Object} errorRecord - Error record
   */
  saveError(errorRecord) {
    try {
      // Append to session log file
      const logLine = JSON.stringify(errorRecord) + '\n';
      fs.appendFileSync(this.errorLogFile, logLine, 'utf8');
      
      // Also append to latest errors file for quick access
      const latestFile = path.join(errorsDir, 'latest-errors.jsonl');
      fs.appendFileSync(latestFile, logLine, 'utf8');
      
    } catch (error) {
      logger.error(`Failed to save error record: ${error.message}`);
    }
  }

  /**
   * Learn from error and save to learning memory
   * @param {Object} errorRecord - Error record
   */
  learnFromError(errorRecord) {
    try {
      const problem = `Error: ${errorRecord.message}`;
      const solution = errorRecord.suggestedSolutions.length > 0
        ? errorRecord.suggestedSolutions[0].solution
        : 'No solution found yet';
      
      learningMemory.saveSolution(problem, solution, false);
    } catch (error) {
      logger.warn(`Failed to learn from error: ${error.message}`);
    }
  }

  /**
   * Mark error as resolved
   * @param {string} errorId - Error ID
   * @param {string} resolution - Resolution description
   */
  markResolved(errorId, resolution) {
    const errorRecord = this.errors.find(e => e.id === errorId);
    if (errorRecord) {
      errorRecord.resolved = true;
      errorRecord.resolvedAt = new Date().toISOString();
      errorRecord.resolution = resolution;
      
      // Update stats
      this.errorStats.resolved++;
      this.errorStats.unresolved--;
      
      // Save updated record
      this.saveError(errorRecord);
      
      // Learn from successful resolution
      learningMemory.saveSolution(
        `Error: ${errorRecord.message}`,
        resolution,
        true
      );
      
      logger.info(`Error ${errorId} marked as resolved: ${resolution}`);
    }
  }

  /**
   * Get all errors for current session
   * @returns {Array} Error records
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Get unresolved errors
   * @returns {Array} Unresolved error records
   */
  getUnresolvedErrors() {
    return this.errors.filter(e => !e.resolved);
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getStats() {
    return {
      ...this.errorStats,
      sessionId: this.sessionId,
      duration: `${((Date.now() - this.startTime) / 1000).toFixed(2)}s`,
      startTime: new Date(this.startTime).toISOString()
    };
  }

  /**
   * Generate comprehensive error report
   * @returns {Object} Error report
   */
  generateReport() {
    const duration = Date.now() - this.startTime;
    
    return {
      sessionId: this.sessionId,
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date().toISOString(),
      duration: `${(duration / 1000).toFixed(2)}s`,
      statistics: this.getStats(),
      errors: this.errors,
      unresolvedErrors: this.getUnresolvedErrors(),
      solutions: this.generateSolutionSummary()
    };
  }

  /**
   * Generate solution summary
   * @returns {Object} Solution summary
   */
  generateSolutionSummary() {
    const summary = {
      totalSolutions: 0,
      byPriority: { high: 0, medium: 0, low: 0 },
      commonSolutions: []
    };

    const solutionCounts = {};

    this.errors.forEach(error => {
      error.suggestedSolutions.forEach(solution => {
        summary.totalSolutions++;
        summary.byPriority[solution.priority || 'medium']++;
        
        const key = solution.type || solution.description;
        solutionCounts[key] = (solutionCounts[key] || 0) + 1;
      });
    });

    // Get top 5 most common solutions
    summary.commonSolutions = Object.entries(solutionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    return summary;
  }

  /**
   * Save error report to file
   * @param {string} format - 'json' or 'html'
   * @returns {string} File path
   */
  saveReport(format = 'json') {
    const report = this.generateReport();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (format === 'json') {
      const reportPath = path.join(errorsDir, `error-report_${timestamp}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
      logger.info(`Error report saved: ${reportPath}`);
      return reportPath;
    } else if (format === 'html') {
      const htmlReport = this.generateHTMLReport(report);
      const reportPath = path.join(errorsDir, `error-report_${timestamp}.html`);
      fs.writeFileSync(reportPath, htmlReport, 'utf8');
      logger.info(`Error report saved: ${reportPath}`);
      return reportPath;
    }
  }

  /**
   * Generate HTML report
   * @param {Object} report - Error report
   * @returns {string} HTML content
   */
  generateHTMLReport(report) {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Error Report - ${report.sessionId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1400px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
    h1 { color: #333; }
    .summary { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .summary-item { display: inline-block; margin: 10px 20px; }
    .summary-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
    .summary-label { color: #7f8c8d; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #34495e; color: white; }
    tr:hover { background: #f5f5f5; }
    .error-unresolved { background: #fee; }
    .error-resolved { background: #efe; opacity: 0.7; }
    .severity-critical { color: #e74c3c; font-weight: bold; }
    .severity-high { color: #e67e22; }
    .severity-medium { color: #f39c12; }
    .severity-low { color: #3498db; }
    .solution { background: #f9f9f9; padding: 10px; margin: 5px 0; border-left: 3px solid #3498db; }
    .solution-high { border-left-color: #e74c3c; }
    .solution-medium { border-left-color: #f39c12; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Error Report - ${report.sessionId}</h1>
    <div class="summary">
      <div class="summary-item">
        <div class="summary-value">${report.statistics.total}</div>
        <div class="summary-label">Total Errors</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${report.statistics.resolved}</div>
        <div class="summary-label">Resolved</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${report.statistics.unresolved}</div>
        <div class="summary-label">Unresolved</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${report.duration}</div>
        <div class="summary-label">Duration</div>
      </div>
    </div>

    <h2>Unresolved Errors</h2>
    ${report.unresolvedErrors.map(error => `
      <div class="error-unresolved" style="margin: 20px 0; padding: 15px; border-radius: 5px;">
        <h3 class="severity-${error.severity || 'medium'}">
          ${error.name}: ${error.message}
        </h3>
        <p><strong>ID:</strong> ${error.id}</p>
        <p><strong>Time:</strong> ${error.timestamp}</p>
        <p><strong>Context:</strong></p>
        <pre>${JSON.stringify(error.context, null, 2)}</pre>
        <p><strong>Suggested Solutions:</strong></p>
        ${error.suggestedSolutions.map(sol => `
          <div class="solution solution-${sol.priority}">
            <strong>${sol.type}</strong> (Priority: ${sol.priority})<br>
            ${sol.description}<br>
            <strong>Solution:</strong> ${sol.solution}
            ${sol.commands && sol.commands.length > 0 ? `<br><strong>Commands:</strong> ${sol.commands.join('; ')}` : ''}
          </div>
        `).join('')}
        ${error.stack ? `<p><strong>Stack Trace:</strong></p><pre>${error.stack}</pre>` : ''}
      </div>
    `).join('')}

    <h2>All Errors</h2>
    <table>
      <tr>
        <th>ID</th>
        <th>Time</th>
        <th>Error</th>
        <th>Context</th>
        <th>Solutions</th>
        <th>Status</th>
      </tr>
      ${report.errors.map(error => `
        <tr class="${error.resolved ? 'error-resolved' : 'error-unresolved'}">
          <td>${error.id}</td>
          <td>${error.timestamp}</td>
          <td class="severity-${error.severity || 'medium'}">${error.message}</td>
          <td>${error.context.operation || error.context.command || 'N/A'}</td>
          <td>${error.suggestedSolutions.length}</td>
          <td>${error.resolved ? '✅ Resolved' : '❌ Unresolved'}</td>
        </tr>
      `).join('')}
    </table>

    <h2>Solution Summary</h2>
    <p><strong>Total Solutions:</strong> ${report.solutions.totalSolutions}</p>
    <p><strong>By Priority:</strong> High: ${report.solutions.byPriority.high}, Medium: ${report.solutions.byPriority.medium}, Low: ${report.solutions.byPriority.low}</p>
    <h3>Most Common Solutions</h3>
    <ul>
      ${report.solutions.commonSolutions.map(sol => `<li>${sol.type}: ${sol.count} occurrences</li>`).join('')}
    </ul>
  </div>
</body>
</html>`;
  }

  /**
   * Wrap async function to catch errors
   * @param {Function} fn - Async function to wrap
   * @param {Object} context - Execution context
   * @returns {Function} Wrapped function
   */
  wrapAsync(fn, context = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.recordError(error, context);
        throw error;
      }
    };
  }

  /**
   * Wrap sync function to catch errors
   * @param {Function} fn - Sync function to wrap
   * @param {Object} context - Execution context
   * @returns {Function} Wrapped function
   */
  wrapSync(fn, context = {}) {
    return (...args) => {
      try {
        return fn(...args);
      } catch (error) {
        this.recordError(error, context);
        throw error;
      }
    };
  }
}

export const errorTracker = new ErrorTracker();
export default errorTracker;
