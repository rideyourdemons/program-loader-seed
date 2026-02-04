import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { logger } from "./logger.js";
import auditSystem from "./audit-system.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sandboxDir = path.join(__dirname, "../sandbox");

class SandboxTester {
  constructor() {
    this.sandboxPath = sandboxDir;
    this.testResults = [];
    this.ensureSandboxExists();
  }

  ensureSandboxExists() {
    if (!fs.existsSync(this.sandboxPath)) {
      fs.mkdirSync(this.sandboxPath, { recursive: true });
      logger.info(`Sandbox directory created: ${this.sandboxPath}`);
    }
  }

  async createSandboxFile(originalPath, content) {
    const fileName = path.basename(originalPath);
    const sandboxFilePath = path.join(this.sandboxPath, fileName);
    fs.writeFileSync(sandboxFilePath, content, "utf8");
    auditSystem.log("SANDBOX_FILE_CREATED", {
      originalPath,
      sandboxPath: sandboxFilePath,
      size: content.length
    });
    return sandboxFilePath;
  }

  async testSyntax(filePath, language) {
    const testResult = {
      filePath,
      language,
      syntaxValid: false,
      errors: [],
      warnings: []
    };

    try {
      if (language === "javascript" || language === "typescript") {
        const result = await this.testJavaScriptSyntax(filePath);
        testResult.syntaxValid = result.valid;
        testResult.errors = result.errors;
        testResult.warnings = result.warnings;
      } else if (language === "python") {
        const result = await this.testPythonSyntax(filePath);
        testResult.syntaxValid = result.valid;
        testResult.errors = result.errors;
        testResult.warnings = result.warnings;
      } else if (language === "json") {
        const content = fs.readFileSync(filePath, "utf8");
        try {
          JSON.parse(content);
          testResult.syntaxValid = true;
        } catch (error) {
          testResult.syntaxValid = false;
          testResult.errors.push(`JSON parse error: ${error.message}`);
        }
      } else {
        testResult.syntaxValid = true;
        testResult.warnings.push(`Syntax validation not available for ${language}`);
      }
    } catch (error) {
      testResult.errors.push(`Test error: ${error.message}`);
    }

    this.testResults.push(testResult);
    auditSystem.log("SANDBOX_SYNTAX_TEST", testResult);
    return testResult;
  }

  async testJavaScriptSyntax(filePath) {
    return new Promise((resolve) => {
      const result = {
        valid: false,
        errors: [],
        warnings: []
      };

      const nodeProcess = spawn("node", ["--check", filePath], {
        stdio: ["pipe", "pipe", "pipe"]
      });

      let stderr = "";
      nodeProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      nodeProcess.on("close", (code) => {
        if (code === 0) {
          result.valid = true;
        } else {
          result.valid = false;
          result.errors.push(stderr || "Syntax error detected");
        }
        resolve(result);
      });

      nodeProcess.on("error", (error) => {
        result.valid = false;
        result.errors.push(`Failed to test syntax: ${error.message}`);
        resolve(result);
      });
    });
  }

  async testPythonSyntax(filePath) {
    return new Promise((resolve) => {
      const result = {
        valid: false,
        errors: [],
        warnings: []
      };

      const pythonProcess = spawn("python", ["-m", "py_compile", filePath], {
        stdio: ["pipe", "pipe", "pipe"]
      });

      let stderr = "";
      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code === 0) {
          result.valid = true;
        } else {
          result.valid = false;
          result.errors.push(stderr || "Syntax error detected");
        }
        resolve(result);
      });

      pythonProcess.on("error", (error) => {
        result.valid = true;
        result.warnings.push(`Python syntax check unavailable: ${error.message}`);
        resolve(result);
      });
    });
  }

  async testChange(originalPath, newContent, language) {
    auditSystem.log("SANDBOX_TEST_START", { originalPath, language });
    const sandboxPath = await this.createSandboxFile(originalPath, newContent);
    const syntaxTest = await this.testSyntax(sandboxPath, language);

    const validations = {
      fileSize: newContent.length,
      lineCount: newContent.split("\n").length,
      hasContent: newContent.trim().length > 0,
      encodingValid: true
    };

    const issues = [];
    if (newContent.length > 1000000) {
      issues.push({ type: "warning", message: "File is very large (>1MB)" });
    }
    if (newContent.split("\n").length > 10000) {
      issues.push({ type: "warning", message: "File has many lines (>10,000)" });
    }

    const testResult = {
      originalPath,
      sandboxPath,
      syntaxTest,
      validations,
      issues,
      timestamp: new Date().toISOString(),
      overallStatus: syntaxTest.syntaxValid && validations.hasContent ? "pass" : "fail"
    };

    this.testResults.push(testResult);
    auditSystem.log("SANDBOX_TEST_COMPLETE", testResult);
    return testResult;
  }

  compareContent(originalContent, newContent) {
    const originalLines = originalContent.split("\n");
    const newLines = newContent.split("\n");

    const added = [];
    const removed = [];
    const modified = [];

    const maxLines = Math.max(originalLines.length, newLines.length);
    for (let i = 0; i < maxLines; i++) {
      const orig = originalLines[i] || "";
      const newLine = newLines[i] || "";

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

  getTestSummary() {
    return {
      totalTests: this.testResults.length,
      passed: this.testResults.filter(r => r.overallStatus === "pass").length,
      failed: this.testResults.filter(r => r.overallStatus === "fail").length,
      results: this.testResults
    };
  }
}

export const sandboxTester = new SandboxTester();
export default sandboxTester;
