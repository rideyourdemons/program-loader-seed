import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./logger.js";
import readOnlyMode from "./readonly-mode.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const auditLogDir = path.join(__dirname, "../logs/audit");

// Ensure audit log directory exists
if (!fs.existsSync(auditLogDir)) {
  fs.mkdirSync(auditLogDir, { recursive: true });
}

/**
 * Comprehensive Audit System
 * Logs all operations, checks, and analysis
 */
class AuditSystem {
  constructor() {
    this.sessionId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.auditLog = [];
    this.checks = [];
    this.issues = [];
    this.startTime = Date.now();
  }

  /**
   * Log an audit event
   * @param {string} action - Action performed
   * @param {Object} details - Additional details
   */
  log(action, details = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      action,
      ...details
    };

    this.auditLog.push(entry);
    logger.info(`[AUDIT] ${action}`, details);

    // Also write to audit log file
    this.writeToFile(entry);
  }

  /**
   * Record a code check
   * @param {string} filePath - File path checked
   * @param {Object} result - Check result
   */
  recordCheck(filePath, result) {
    const check = {
      timestamp: new Date().toISOString(),
      filePath,
      ...result
    };

    this.checks.push(check);
    this.log('CODE_CHECK', { filePath, result });
  }

  /**
   * Record an issue found
   * @param {string} type - Issue type
   * @param {string} description - Issue description
   * @param {Object} details - Additional details
   */
  recordIssue(type, description, details = {}) {
    const issue = {
      timestamp: new Date().toISOString(),
      type,
      description,
      severity: details.severity || 'medium',
      file: details.file,
      line: details.line,
      ...details
    };

    this.issues.push(issue);
    this.log('ISSUE_FOUND', issue);
  }

  /**
   * Record navigation event
   * @param {string} url - URL navigated to
   * @param {Object} details - Additional details
   */
  recordNavigation(url, details = {}) {
    this.log('NAVIGATION', { url, ...details });
  }

  /**
   * Record file read
   * @param {string} filePath - File path read
   * @param {number} size - File size
   */
  recordFileRead(filePath, size) {
    this.log('FILE_READ', { filePath, size, authorized: true });
  }

  /**
   * Record attempted write (blocked)
   * @param {string} filePath - File path attempted
   * @param {string} reason - Reason for blocking
   */
  recordWriteAttempt(filePath, reason = 'Not authorized') {
    this.log('WRITE_BLOCKED', { 
      filePath, 
      reason,
      authorized: false,
      attemptedWrites: readOnlyMode.getAttemptedWrites().length
    });
  }

  /**
   * Record authorized write
   * @param {string} filePath - File path written
   * @param {number} size - File size
   */
  recordAuthorizedWrite(filePath, size) {
    this.log('WRITE_AUTHORIZED', { filePath, size, authorized: true });
  }

  /**
   * Write audit entry to file
   * @param {Object} entry
   */
  writeToFile(entry) {
    const logFile = path.join(auditLogDir, `${this.sessionId}.jsonl`);
    try {
      fs.appendFileSync(logFile, JSON.stringify(entry) + '\n', 'utf8');
    } catch (error) {
      logger.error(`Failed to write audit log: ${error.message}`);
    }
  }

  /**
   * Generate comprehensive report
   * @returns {Object}
   */
  generateReport() {
    const duration = Date.now() - this.startTime;
    const report = {
      sessionId: this.sessionId,
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date().toISOString(),
      duration: `${(duration / 1000).toFixed(2)}s`,
      summary: {
        totalChecks: this.checks.length,
        totalIssues: this.issues.length,
        totalOperations: this.auditLog.length,
        blockedWrites: readOnlyMode.getAttemptedWrites().length
      },
      checks: this.checks,
      issues: this.issues,
      auditLog: this.auditLog,
      attemptedWrites: readOnlyMode.getAttemptedWrites()
    };

    return report;
  }

  /**
   * Save report to file
   * @param {string} format - 'json' or 'html'
   * @returns {string} File path
   */
  saveReport(format = 'json') {
    const report = this.generateReport();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (format === 'json') {
      const reportPath = path.join(auditLogDir, `report_${timestamp}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
      logger.info(`Audit report saved: ${reportPath}`);
      return reportPath;
    } else if (format === 'html') {
      const htmlReport = this.generateHTMLReport(report);
      const reportPath = path.join(auditLogDir, `report_${timestamp}.html`);
      fs.writeFileSync(reportPath, htmlReport, 'utf8');
      logger.info(`Audit report saved: ${reportPath}`);
      return reportPath;
    }
  }

  /**
   * Generate HTML report
   * @param {Object} report
   * @returns {string}
   */
  generateHTMLReport(report) {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Audit Report - ${report.sessionId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
    h1 { color: #333; }
    .summary { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .summary-item { display: inline-block; margin: 10px 20px; }
    .summary-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
    .summary-label { color: #7f8c8d; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #34495e; color: white; }
    tr:hover { background: #f5f5f5; }
    .issue-high { color: #e74c3c; font-weight: bold; }
    .issue-medium { color: #f39c12; }
    .issue-low { color: #3498db; }
    .blocked { background: #fee; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Audit Report</h1>
    <div class="summary">
      <div class="summary-item">
        <div class="summary-value">${report.summary.totalChecks}</div>
        <div class="summary-label">Code Checks</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${report.summary.totalIssues}</div>
        <div class="summary-label">Issues Found</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${report.summary.blockedWrites}</div>
        <div class="summary-label">Blocked Writes</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${report.duration}</div>
        <div class="summary-label">Duration</div>
      </div>
    </div>

    <h2>Issues Found</h2>
    <table>
      <tr>
        <th>Type</th>
        <th>Description</th>
        <th>Severity</th>
        <th>File</th>
        <th>Timestamp</th>
      </tr>
      ${report.issues.map(issue => `
        <tr class="issue-${issue.severity}">
          <td>${issue.type}</td>
          <td>${issue.description}</td>
          <td>${issue.severity}</td>
          <td>${issue.file || 'N/A'}</td>
          <td>${issue.timestamp}</td>
        </tr>
      `).join('')}
    </table>

    <h2>Code Checks</h2>
    <table>
      <tr>
        <th>File Path</th>
        <th>Status</th>
        <th>Timestamp</th>
      </tr>
      ${report.checks.map(check => `
        <tr>
          <td>${check.filePath}</td>
          <td>${check.status || 'checked'}</td>
          <td>${check.timestamp}</td>
        </tr>
      `).join('')}
    </table>

    <h2>Blocked Write Attempts</h2>
    <table>
      <tr>
        <th>Operation</th>
        <th>Target</th>
        <th>Reason</th>
        <th>Timestamp</th>
      </tr>
      ${report.attemptedWrites.map(write => `
        <tr class="blocked">
          <td>${write.operation}</td>
          <td>${write.target}</td>
          <td>${write.authorized ? 'Authorized' : 'Not Authorized'}</td>
          <td>${write.timestamp}</td>
        </tr>
      `).join('')}
    </table>

    <h2>Full Audit Log</h2>
    <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto;">
${JSON.stringify(report.auditLog, null, 2)}
    </pre>
  </div>
</body>
</html>`;
  }
}

export const auditSystem = new AuditSystem();
export default auditSystem;

