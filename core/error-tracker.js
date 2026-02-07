/**
 * Error Tracker Module
 * Tracks and reports errors during execution
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ErrorTracker {
  constructor() {
    this.errors = [];
    this.sessionId = `session-${Date.now()}`;
    this.startTime = Date.now();
  }

  recordError(error, context = {}) {
    const errorRecord = {
      id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: error.name || 'Error',
      message: error.message || String(error),
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context: context,
      resolved: false,
      suggestedSolutions: []
    };
    
    this.errors.push(errorRecord);
    return errorRecord;
  }

  getErrors() {
    return this.errors;
  }

  getUnresolvedErrors() {
    return this.errors.filter(e => !e.resolved);
  }

  markResolved(errorId, solution) {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      error.resolution = solution;
    }
  }

  getStats() {
    const duration = Date.now() - this.startTime;
    const resolved = this.errors.filter(e => e.resolved).length;
    const unresolved = this.errors.filter(e => !e.resolved).length;
    
    const byType = {};
    this.errors.forEach(e => {
      byType[e.name] = (byType[e.name] || 0) + 1;
    });

    return {
      total: this.errors.length,
      resolved,
      unresolved,
      sessionId: this.sessionId,
      duration: `${Math.round(duration / 1000)}s`,
      byType
    };
  }

  saveReport(format = 'json') {
    const logsDir = path.join(__dirname, '../logs/errors');
    
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `error-report_${timestamp}.${format}`;
    const filePath = path.join(logsDir, filename);
    
    if (format === 'json') {
      fs.writeFileSync(filePath, JSON.stringify({
        sessionId: this.sessionId,
        startTime: new Date(this.startTime).toISOString(),
        endTime: new Date().toISOString(),
        stats: this.getStats(),
        errors: this.errors
      }, null, 2));
    } else if (format === 'html') {
      const html = this.generateHTMLReport();
      fs.writeFileSync(filePath, html);
    }
    
    return filePath;
  }

  generateHTMLReport() {
    const stats = this.getStats();
    return `<!DOCTYPE html>
<html>
<head>
  <title>Error Report - ${this.sessionId}</title>
  <style>
    body { font-family: monospace; padding: 20px; }
    .error { border: 1px solid #ccc; padding: 10px; margin: 10px 0; }
    .resolved { background: #e8f5e9; }
    .unresolved { background: #ffebee; }
  </style>
</head>
<body>
  <h1>Error Report</h1>
  <p>Session: ${stats.sessionId}</p>
  <p>Total: ${stats.total} | Resolved: ${stats.resolved} | Unresolved: ${stats.unresolved}</p>
  <h2>Errors</h2>
  ${this.errors.map(e => `
    <div class="error ${e.resolved ? 'resolved' : 'unresolved'}">
      <h3>${e.name}: ${e.message}</h3>
      <p>Time: ${e.timestamp}</p>
      ${e.stack ? `<pre>${e.stack}</pre>` : ''}
    </div>
  `).join('')}
</body>
</html>`;
  }
}

// Singleton instance
const errorTracker = new ErrorTracker();

export default errorTracker;
