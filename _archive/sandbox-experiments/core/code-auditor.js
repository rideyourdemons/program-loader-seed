import { logger } from "./logger.js";
import auditSystem from "./audit-system.js";
import readOnlyMode from "./readonly-mode.js";
import navigationController from "./navigation-controller.js";

/**
 * Code Auditor - Read-Only Code Analysis
 * Performs comprehensive code checks without making changes
 */
class CodeAuditor {
  constructor() {
    this.sessionId = null;
  }

  /**
   * Initialize audit session
   * @param {string} sessionId - Navigation session ID
   */
  setSession(sessionId) {
    this.sessionId = sessionId;
    auditSystem.log('AUDIT_SESSION_STARTED', { sessionId });
  }

  /**
   * Read and analyze code file
   * @param {string} filePath - Path to file
   * @param {string} method - 'ssh' or 'api'
   * @returns {Promise<Object>} Analysis result
   */
  async auditFile(filePath, method = 'auto') {
    if (!this.sessionId) {
      throw new Error('No session set. Call setSession() first.');
    }

    auditSystem.log('FILE_AUDIT_START', { filePath, method });

    try {
      // Read file (read-only operation)
      const content = await navigationController.readCode(this.sessionId, filePath, method);
      auditSystem.recordFileRead(filePath, content.length);

      // Analyze code
      const analysis = this.analyzeCode(content, filePath);

      // Record check
      auditSystem.recordCheck(filePath, {
        status: 'completed',
        size: content.length,
        analysis
      });

      return {
        filePath,
        content,
        analysis,
        size: content.length
      };
    } catch (error) {
      auditSystem.recordIssue('READ_ERROR', `Failed to read file: ${filePath}`, {
        file: filePath,
        error: error.message,
        severity: 'high'
      });
      throw error;
    }
  }

  /**
   * Analyze code content
   * @param {string} content - File content
   * @param {string} filePath - File path
   * @returns {Object} Analysis results
   */
  analyzeCode(content, filePath) {
    const analysis = {
      language: this.detectLanguage(filePath, content),
      lines: content.split('\n').length,
      size: content.length,
      issues: [],
      metrics: {}
    };

    // Detect language-specific issues
    if (analysis.language === 'javascript' || analysis.language === 'typescript') {
      analysis.issues.push(...this.analyzeJavaScript(content, filePath));
      analysis.metrics = this.calculateJavaScriptMetrics(content);
    } else if (analysis.language === 'python') {
      analysis.issues.push(...this.analyzePython(content, filePath));
    } else if (analysis.language === 'html') {
      analysis.issues.push(...this.analyzeHTML(content, filePath));
    } else if (analysis.language === 'css') {
      analysis.issues.push(...this.analyzeCSS(content, filePath));
    }

    // General code quality checks
    analysis.issues.push(...this.generalChecks(content, filePath));

    // Record issues
    analysis.issues.forEach(issue => {
      auditSystem.recordIssue(issue.type, issue.description, {
        file: filePath,
        line: issue.line,
        severity: issue.severity
      });
    });

    return analysis;
  }

  /**
   * Detect programming language
   * @param {string} filePath
   * @param {string} content
   * @returns {string}
   */
  detectLanguage(filePath, content) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const langMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown'
    };

    if (langMap[ext]) {
      return langMap[ext];
    }

    // Fallback to content analysis
    if (content.includes('function') && content.includes('const')) return 'javascript';
    if (content.includes('def ') && content.includes('import ')) return 'python';
    if (content.includes('<!DOCTYPE') || content.includes('<html')) return 'html';

    return 'unknown';
  }

  /**
   * Analyze JavaScript/TypeScript code
   * @param {string} content
   * @param {string} filePath
   * @returns {Array}
   */
  analyzeJavaScript(content, filePath) {
    const issues = [];
    const lines = content.split('\n');

    // Check for common issues
    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // console.log statements (should be removed in production)
      if (line.includes('console.log') && !line.includes('//')) {
        issues.push({
          type: 'debug_code',
          description: `console.log found on line ${lineNum}`,
          line: lineNum,
          severity: 'low'
        });
      }

      // TODO comments
      if (line.match(/\/\/\s*TODO/i) || line.match(/\/\*\s*TODO/i)) {
        issues.push({
          type: 'todo',
          description: `TODO comment on line ${lineNum}`,
          line: lineNum,
          severity: 'low'
        });
      }

      // FIXME comments
      if (line.match(/\/\/\s*FIXME/i) || line.match(/\/\*\s*FIXME/i)) {
        issues.push({
          type: 'fixme',
          description: `FIXME comment on line ${lineNum}`,
          line: lineNum,
          severity: 'medium'
        });
      }

      // Enhanced security vulnerability detection (OWASP Top 10)
      
      // 1. Code Injection
      if (line.includes('eval(') || line.includes('Function(') || line.includes('setTimeout(')) {
        issues.push({
          type: 'security',
          description: `Potential code injection risk: eval()/Function()/setTimeout() on line ${lineNum}`,
          line: lineNum,
          severity: 'high',
          category: 'OWASP-A03-Injection'
        });
      }
      
      // 2. SQL Injection (even in JS, sometimes SQL queries are constructed)
      if (line.match(/\$\{[^}]*\}/) && line.match(/SELECT|INSERT|UPDATE|DELETE/i)) {
        issues.push({
          type: 'security',
          description: `Potential SQL injection risk on line ${lineNum}`,
          line: lineNum,
          severity: 'high',
          category: 'OWASP-A03-Injection'
        });
      }
      
      // 3. XSS vulnerabilities
      if (line.includes('innerHTML') || line.includes('outerHTML') || line.includes('document.write')) {
        issues.push({
          type: 'security',
          description: `Potential XSS risk: innerHTML/outerHTML/document.write on line ${lineNum}`,
          line: lineNum,
          severity: 'medium',
          category: 'OWASP-A03-XSS'
        });
      }
      
      // 4. Hardcoded credentials and secrets
      if (line.match(/password\s*[=:]\s*['"][^'"]+['"]/i) || 
          line.match(/api[_-]?key\s*[=:]\s*['"][^'"]+['"]/i) ||
          line.match(/secret\s*[=:]\s*['"][^'"]+['"]/i) ||
          line.match(/token\s*[=:]\s*['"][^'"]+['"]/i) ||
          line.match(/private[_-]?key\s*[=:]\s*['"][^'"]+['"]/i)) {
        issues.push({
          type: 'security',
          description: `Hardcoded credential/secret detected on line ${lineNum}`,
          line: lineNum,
          severity: 'high',
          category: 'OWASP-A07-SecurityMisconfig'
        });
      }
      
      // 5. Weak crypto usage
      if (line.match(/md5|sha1/i) && !line.includes('//')) {
        issues.push({
          type: 'security',
          description: `Weak cryptographic hash (MD5/SHA1) used on line ${lineNum}`,
          line: lineNum,
          severity: 'medium',
          category: 'OWASP-A02-CryptographicFailures'
        });
      }
      
      // 6. Insecure random number generation
      if (line.match(/Math\.random\(\)/)) {
        issues.push({
          type: 'security',
          description: `Insecure random number generation on line ${lineNum} - use crypto.getRandomValues()`,
          line: lineNum,
          severity: 'medium',
          category: 'OWASP-A02-CryptographicFailures'
        });
      }
      
      // 7. Insecure direct object references
      if (line.match(/localStorage|sessionStorage/) && (line.includes('password') || line.includes('token'))) {
        issues.push({
          type: 'security',
          description: `Sensitive data stored in localStorage/sessionStorage on line ${lineNum}`,
          line: lineNum,
          severity: 'high',
          category: 'OWASP-A01-BrokenAccessControl'
        });
      }
      
      // 8. Missing CSRF protection
      if (line.match(/fetch\(|axios\.|XMLHttpRequest/i) && line.includes('POST') && !line.includes('csrf')) {
        issues.push({
          type: 'security',
          description: `Potential missing CSRF protection on POST request (line ${lineNum})`,
          line: lineNum,
          severity: 'medium',
          category: 'OWASP-A01-BrokenAccessControl'
        });
      }
    });

    return issues;
  }

  /**
   * Calculate JavaScript metrics
   * @param {string} content
   * @returns {Object}
   */
  calculateJavaScriptMetrics(content) {
    return {
      functions: (content.match(/function\s+\w+/g) || []).length + 
                 (content.match(/\w+\s*[:=]\s*(\([^)]*\)\s*=>|function)/g) || []).length,
      classes: (content.match(/class\s+\w+/g) || []).length,
      imports: (content.match(/import\s+.*from/g) || []).length,
      exports: (content.match(/export\s+/g) || []).length
    };
  }

  /**
   * Analyze Python code
   * @param {string} content
   * @param {string} filePath
   * @returns {Array}
   */
  analyzePython(content, filePath) {
    const issues = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      if (line.includes('print(') && !line.includes('#')) {
        issues.push({
          type: 'debug_code',
          description: `print() statement on line ${lineNum}`,
          line: lineNum,
          severity: 'low'
        });
      }

      if (line.match(/#\s*TODO/i) || line.match(/#\s*FIXME/i)) {
        issues.push({
          type: 'todo',
          description: `TODO/FIXME comment on line ${lineNum}`,
          line: lineNum,
          severity: 'low'
        });
      }
    });

    return issues;
  }

  /**
   * Analyze HTML code
   * @param {string} content
   * @param {string} filePath
   * @returns {Array}
   */
  analyzeHTML(content, filePath) {
    const issues = [];

    // Check for inline scripts
    if (content.includes('<script>') && !content.includes('<script src')) {
      issues.push({
        type: 'code_quality',
        description: 'Inline script tags found (consider external scripts)',
        severity: 'medium'
      });
    }

    // Check for inline styles
    if (content.match(/style\s*=\s*["'][^"']+["']/g)?.length > 5) {
      issues.push({
        type: 'code_quality',
        description: 'Multiple inline styles found (consider CSS file)',
        severity: 'low'
      });
    }

    return issues;
  }

  /**
   * Analyze CSS code
   * @param {string} content
   * @param {string} filePath
   * @returns {Array}
   */
  analyzeCSS(content, filePath) {
    const issues = [];

    // Check for !important overuse
    const importantCount = (content.match(/!important/g) || []).length;
    if (importantCount > 10) {
      issues.push({
        type: 'code_quality',
        description: `Excessive use of !important (${importantCount} instances)`,
        severity: 'medium'
      });
    }

    return issues;
  }

  /**
   * General code quality checks
   * @param {string} content
   * @param {string} filePath
   * @returns {Array}
   */
  generalChecks(content, filePath) {
    const issues = [];

    // Check file size
    if (content.length > 100000) {
      issues.push({
        type: 'code_quality',
        description: `Large file size (${(content.length / 1024).toFixed(2)}KB) - consider splitting`,
        severity: 'medium'
      });
    }

    // Check for long lines
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.length > 200) {
        issues.push({
          type: 'code_quality',
          description: `Long line (${line.length} chars) on line ${index + 1}`,
          line: index + 1,
          severity: 'low'
        });
      }
    });

    return issues;
  }

  /**
   * List directory and audit all code files
   * @param {string} dirPath - Directory path
   * @param {string} method - 'ssh' or 'api'
   * @returns {Promise<Array>} Audit results
   */
  async auditDirectory(dirPath, method = 'auto') {
    if (!this.sessionId) {
      throw new Error('No session set. Call setSession() first.');
    }

    auditSystem.log('DIRECTORY_AUDIT_START', { dirPath, method });

    try {
      const files = await navigationController.listFiles(this.sessionId, dirPath, method);
      const results = [];

      for (const file of files) {
        const filePath = file.filename || file.name || file;
        const fullPath = `${dirPath}/${filePath}`.replace(/\/+/g, '/');

        // Only audit code files
        if (this.isCodeFile(filePath)) {
          try {
            const result = await this.auditFile(fullPath, method);
            results.push(result);
          } catch (error) {
            logger.warn(`Failed to audit ${fullPath}: ${error.message}`);
          }
        }
      }

      auditSystem.log('DIRECTORY_AUDIT_COMPLETE', { 
        dirPath, 
        filesAudited: results.length 
      });

      return results;
    } catch (error) {
      auditSystem.recordIssue('DIRECTORY_ERROR', `Failed to audit directory: ${dirPath}`, {
        error: error.message,
        severity: 'high'
      });
      throw error;
    }
  }

  /**
   * Check if file is a code file
   * @param {string} filePath
   * @returns {boolean}
   */
  isCodeFile(filePath) {
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.html', '.css', '.json', '.md'];
    return codeExtensions.some(ext => filePath.toLowerCase().endsWith(ext));
  }

  /**
   * Generate audit report
   * @returns {Object}
   */
  generateReport() {
    return auditSystem.generateReport();
  }

  /**
   * Save audit report
   * @param {string} format - 'json' or 'html'
   * @returns {string} File path
   */
  saveReport(format = 'json') {
    return auditSystem.saveReport(format);
  }
}

export const codeAuditor = new CodeAuditor();
export default codeAuditor;

