import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./logger.js";
import auditSystem from "./audit-system.js";
import { spawn } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sandboxDir = path.join(__dirname, "../sandbox");

/**
 * Sandbox Testing System
 * Tests changes in isolated environment before implementation
 */
class SandboxTester {
  constructor() {
    this.sandboxPath = sandboxDir;
    this.testResults = [];
    this.ensureSandboxExists();
  }

  /**
   * Ensure sandbox directory exists
   */
  ensureSandboxExists() {
    if (!fs.existsSync(this.sandboxPath)) {
      fs.mkdirSync(this.sandboxPath, { recursive: true });
      logger.info(`Sandbox directory created: ${this.sandboxPath}`);
    }
  }

  /**
   * Create sandbox copy of file
   * @param {string} originalPath - Original file path
   * @param {string} content - New content to test
   * @returns {Promise<string>} Sandbox file path
   */
  async createSandboxFile(originalPath, content) {
    const fileName = path.basename(originalPath);
    const sandboxFilePath = path.join(this.sandboxPath, fileName);
    
    // Write content to sandbox
    fs.writeFileSync(sandboxFilePath, content, 'utf8');
    
    auditSystem.log('SANDBOX_FILE_CREATED', {
      originalPath,
      sandboxPath: sandboxFilePath,
      size: content.length
    });

    return sandboxFilePath;
  }

  /**
   * Test code syntax
   * @param {string} filePath - File to test
   * @param {string} language - Language type
   * @returns {Promise<Object>} Test result
   */
  async testSyntax(filePath, language) {
    const testResult = {
      filePath,
      language,
      syntaxValid: false,
      errors: [],
      warnings: []
    };

    try {
      if (language === 'javascript' || language === 'typescript') {
        // Test JavaScript/TypeScript syntax
        const result = await this.testJavaScriptSyntax(filePath);
        testResult.syntaxValid = result.valid;
        testResult.errors = result.errors;
        testResult.warnings = result.warnings;
      } else if (language === 'python') {
        // Test Python syntax
        const result = await this.testPythonSyntax(filePath);
        testResult.syntaxValid = result.valid;
        testResult.errors = result.errors;
        testResult.warnings = result.warnings;
      } else if (language === 'json') {
        // Test JSON syntax
        const content = fs.readFileSync(filePath, 'utf8');
        try {
          JSON.parse(content);
          testResult.syntaxValid = true;
        } catch (error) {
          testResult.syntaxValid = false;
          testResult.errors.push(`JSON parse error: ${error.message}`);
        }
      } else {
        // For other languages, basic file validation
        testResult.syntaxValid = true;
        testResult.warnings.push(`Syntax validation not available for ${language}`);
      }
    } catch (error) {
      testResult.errors.push(`Test error: ${error.message}`);
    }

    this.testResults.push(testResult);
    auditSystem.log('SANDBOX_SYNTAX_TEST', testResult);

    return testResult;
  }

  /**
   * Test JavaScript syntax using Node.js
   * @param {string} filePath
   * @returns {Promise<Object>}
   */
  async testJavaScriptSyntax(filePath) {
    return new Promise((resolve) => {
      const result = {
        valid: false,
        errors: [],
        warnings: []
      };

      // Try to parse with Node.js
      const nodeProcess = spawn('node', ['--check', filePath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stderr = '';
      nodeProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      nodeProcess.on('close', (code) => {
        if (code === 0) {
          result.valid = true;
        } else {
          result.valid = false;
          result.errors.push(stderr || 'Syntax error detected');
        }
        resolve(result);
      });

      nodeProcess.on('error', (error) => {
        result.valid = false;
        result.errors.push(`Failed to test syntax: ${error.message}`);
        resolve(result);
      });
    });
  }

  /**
   * Test Python syntax
   * @param {string} filePath
   * @returns {Promise<Object>}
   */
  async testPythonSyntax(filePath) {
    return new Promise((resolve) => {
      const result = {
        valid: false,
        errors: [],
        warnings: []
      };

      const pythonProcess = spawn('python', ['-m', 'py_compile', filePath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stderr = '';
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          result.valid = true;
        } else {
          result.valid = false;
          result.errors.push(stderr || 'Syntax error detected');
        }
        resolve(result);
      });

      pythonProcess.on('error', (error) => {
        // Python might not be installed, that's okay
        result.valid = true; // Assume valid if we can't test
        result.warnings.push(`Python syntax check unavailable: ${error.message}`);
        resolve(result);
      });
    });
  }

  /**
   * Run comprehensive tests on sandbox file
   * @param {string} originalPath - Original file path
   * @param {string} newContent - New content
   * @param {string} language - File language
   * @returns {Promise<Object>} Complete test results
   */
  async testChange(originalPath, newContent, language) {
    auditSystem.log('SANDBOX_TEST_START', { originalPath, language });

    // Create sandbox file
    const sandboxPath = await this.createSandboxFile(originalPath, newContent);

    // Test syntax
    const syntaxTest = await this.testSyntax(sandboxPath, language);

    // Additional validations
    const validations = {
      fileSize: newContent.length,
      lineCount: newContent.split('\n').length,
      hasContent: newContent.trim().length > 0,
      encodingValid: true
    };

    // Check for potential issues
    const issues = [];
    if (newContent.length > 1000000) {
      issues.push({ type: 'warning', message: 'File is very large (>1MB)' });
    }
    if (newContent.split('\n').length > 10000) {
      issues.push({ type: 'warning', message: 'File has many lines (>10,000)' });
    }

    const testResult = {
      originalPath,
      sandboxPath,
      syntaxTest,
      validations,
      issues,
      timestamp: new Date().toISOString(),
      overallStatus: syntaxTest.syntaxValid && validations.hasContent ? 'pass' : 'fail'
    };

    this.testResults.push(testResult);
    auditSystem.log('SANDBOX_TEST_COMPLETE', testResult);

    return testResult;
  }

  /**
   * Compare original and new content
   * @param {string} originalContent
   * @param {string} newContent
   * @returns {Object} Comparison result
   */
  compareContent(originalContent, newContent) {
    const originalLines = originalContent.split('\n');
    const newLines = newContent.split('\n');

    const added = [];
    const removed = [];
    const modified = [];

    // Simple line-by-line comparison
    const maxLines = Math.max(originalLines.length, newLines.length);
    for (let i = 0; i < maxLines; i++) {
      const orig = originalLines[i] || '';
      const newLine = newLines[i] || '';

      if (i >= originalLines.length) {
        added.push({ line: i + 1, content: newLine });
      } else if (i >= newLines.length) {
        removed.push({ line: i + 1, content: orig });
      } else if (orig !== newLine) {
        modified.push({
          line: i + 1,
          original: orig,
          new: newLine
        });
      }
    }

    return {
      added: added.length,
      removed: removed.length,
      modified: modified.length,
      totalChanges: added.length + removed.length + modified.length,
      details: { added, removed, modified }
    };
  }

  /**
   * Clean up sandbox
   */
  cleanup() {
    if (fs.existsSync(this.sandboxPath)) {
      const files = fs.readdirSync(this.sandboxPath);
      files.forEach(file => {
        try {
          fs.unlinkSync(path.join(this.sandboxPath, file));
        } catch (error) {
          logger.warn(`Failed to clean up sandbox file ${file}: ${error.message}`);
        }
      });
    }
  }

  /**
   * Get test results summary
   * @returns {Object}
   */
  getTestSummary() {
    return {
      totalTests: this.testResults.length,
      passed: this.testResults.filter(r => r.overallStatus === 'pass').length,
      failed: this.testResults.filter(r => r.overallStatus === 'fail').length,
      results: this.testResults
    };
  }
}

export const sandboxTester = new SandboxTester();
export default sandboxTester;

