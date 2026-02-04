import { logger } from "./logger.js";
import auditSystem from "./audit-system.js";
import navigationController from "./navigation-controller.js";

/**
 * Code Auditor - Read-Only Code Analysis
 */
class CodeAuditor {
  constructor() {
    this.sessionId = null;
  }

  setSession(sessionId) {
    this.sessionId = sessionId;
    auditSystem.log("AUDIT_SESSION_STARTED", { sessionId });
  }

  async auditFile(filePath, method = "auto") {
    if (!this.sessionId) {
      this.sessionId = await navigationController.initLocalSession();
    }

    auditSystem.log("FILE_AUDIT_START", { filePath, method });

    try {
      const content = await navigationController.readCode(this.sessionId, filePath, method);
      const analysis = this.analyzeCode(content, filePath);
      auditSystem.recordCheck(filePath, {
        status: "completed",
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
      auditSystem.recordIssue("READ_ERROR", `Failed to read file: ${filePath}`, {
        file: filePath,
        error: error.message,
        severity: "high"
      });
      throw error;
    }
  }

  analyzeCode(content, filePath) {
    const analysis = {
      language: this.detectLanguage(filePath, content),
      lines: content.split("\n").length,
      size: content.length,
      issues: [],
      metrics: {}
    };

    if (analysis.language === "javascript" || analysis.language === "typescript") {
      analysis.issues.push(...this.analyzeJavaScript(content));
      analysis.metrics = this.calculateJavaScriptMetrics(content);
    } else if (analysis.language === "python") {
      analysis.issues.push(...this.analyzePython(content));
    } else if (analysis.language === "html") {
      analysis.issues.push(...this.analyzeHTML(content));
    } else if (analysis.language === "css") {
      analysis.issues.push(...this.analyzeCSS(content));
    }

    analysis.issues.push(...this.generalChecks(content));

    analysis.issues.forEach(issue => {
      auditSystem.recordIssue(issue.type, issue.description, {
        file: filePath,
        line: issue.line,
        severity: issue.severity
      });
    });

    return analysis;
  }

  detectLanguage(filePath, content) {
    const ext = filePath.split(".").pop()?.toLowerCase();
    const langMap = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      html: "html",
      css: "css",
      json: "json",
      md: "markdown"
    };

    if (langMap[ext]) return langMap[ext];
    if (content.includes("function") && content.includes("const")) return "javascript";
    if (content.includes("def ") && content.includes("import ")) return "python";
    if (content.includes("<!DOCTYPE") || content.includes("<html")) return "html";
    return "unknown";
  }

  analyzeJavaScript(content) {
    const issues = [];
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      if (line.includes("console.log") && !line.includes("//")) {
        issues.push({
          type: "debug_code",
          description: `console.log found on line ${lineNum}`,
          line: lineNum,
          severity: "low"
        });
      }

      if (line.match(/\/\/\s*TODO/i) || line.match(/\/\*\s*TODO/i)) {
        issues.push({
          type: "todo",
          description: `TODO comment on line ${lineNum}`,
          line: lineNum,
          severity: "low"
        });
      }

      if (line.match(/\/\/\s*FIXME/i) || line.match(/\/\*\s*FIXME/i)) {
        issues.push({
          type: "fixme",
          description: `FIXME comment on line ${lineNum}`,
          line: lineNum,
          severity: "medium"
        });
      }
    });

    return issues;
  }

  calculateJavaScriptMetrics(content) {
    return {
      functions: (content.match(/function\s+\w+/g) || []).length +
        (content.match(/\w+\s*[:=]\s*(\([^)]*\)\s*=>|function)/g) || []).length,
      classes: (content.match(/class\s+\w+/g) || []).length,
      imports: (content.match(/import\s+.*from/g) || []).length,
      exports: (content.match(/export\s+/g) || []).length
    };
  }

  analyzePython(content) {
    const issues = [];
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      if (line.includes("print(") && !line.includes("#")) {
        issues.push({
          type: "debug_code",
          description: `print() statement on line ${lineNum}`,
          line: lineNum,
          severity: "low"
        });
      }
    });

    return issues;
  }

  analyzeHTML(content) {
    const issues = [];
    if (content.includes("<script>") && !content.includes("<script src")) {
      issues.push({
        type: "code_quality",
        description: "Inline script tags found (consider external scripts)",
        severity: "medium"
      });
    }
    if (content.match(/style\s*=\s*["'][^"']+["']/g)?.length > 5) {
      issues.push({
        type: "code_quality",
        description: "Multiple inline styles found (consider CSS file)",
        severity: "low"
      });
    }
    return issues;
  }

  analyzeCSS(content) {
    const issues = [];
    const importantCount = (content.match(/!important/g) || []).length;
    if (importantCount > 10) {
      issues.push({
        type: "code_quality",
        description: `Excessive use of !important (${importantCount} instances)`,
        severity: "medium"
      });
    }
    return issues;
  }

  generalChecks(content) {
    const issues = [];
    if (content.length > 100000) {
      issues.push({
        type: "code_quality",
        description: `Large file size (${(content.length / 1024).toFixed(2)}KB)`,
        severity: "medium"
      });
    }

    const lines = content.split("\n");
    lines.forEach((line, index) => {
      if (line.length > 200) {
        issues.push({
          type: "code_quality",
          description: `Long line (${line.length} chars) on line ${index + 1}`,
          line: index + 1,
          severity: "low"
        });
      }
    });

    return issues;
  }

  generateReport() {
    return auditSystem.generateReport();
  }
}

export const codeAuditor = new CodeAuditor();
export default codeAuditor;
