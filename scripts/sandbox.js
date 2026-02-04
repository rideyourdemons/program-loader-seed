import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Sandbox tool for safely executing and analyzing code
 * Captures all output, errors, and provides detailed analysis
 */
class CodeSandbox {
  constructor() {
    this.results = {
      stdout: [],
      stderr: [],
      exitCode: null,
      errors: [],
      warnings: [],
      analysis: {},
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Execute a command in a sandboxed environment
   */
  async execute(command, args = [], options = {}) {
    return new Promise((resolve) => {
      const env = { ...(typeof process !== "undefined" ? process.env : {}), ...options.env };
      const childProcess = spawn(command, args, {
        cwd: options.cwd || path.join(__dirname, ".."),
        env: env,
        shell: true,
        stdio: ["pipe", "pipe", "pipe"]
      });

      childProcess.stdout.on("data", (data) => {
        const output = data.toString();
        this.results.stdout.push({
          timestamp: new Date().toISOString(),
          data: output
        });
        if (options.onOutput) options.onOutput(output);
      });

      childProcess.stderr.on("data", (data) => {
        const output = data.toString();
        this.results.stderr.push({
          timestamp: new Date().toISOString(),
          data: output
        });
        if (options.onError) options.onError(output);
      });

      childProcess.on("error", (error) => {
        this.results.errors.push({
          type: "process_error",
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
      });

      childProcess.on("close", (code) => {
        this.results.exitCode = code;
        this.analyzeResults();
        resolve(this.results);
      });

      // Timeout handling
      if (options.timeout) {
        setTimeout(() => {
          if (!childProcess.killed) {
            childProcess.kill();
            this.results.errors.push({
              type: "timeout",
              message: `Process timed out after ${options.timeout}ms`,
              timestamp: new Date().toISOString()
            });
          }
        }, options.timeout);
      }
    });
  }

  /**
   * Analyze the execution results
   */
  analyzeResults() {
    const analysis = {
      hasErrors: this.results.exitCode !== 0,
      errorCount: this.results.errors.length,
      stderrCount: this.results.stderr.length,
      stdoutLines: this.results.stdout.length,
      detectedIssues: []
    };

    // Analyze stderr for common error patterns
    const allStderr = this.results.stderr.map(e => e.data).join("\n");
    
    if (allStderr.includes("Cannot find module")) {
      analysis.detectedIssues.push({
        type: "missing_dependency",
        severity: "error",
        message: "Missing npm dependency detected"
      });
    }

    if (allStderr.includes("SyntaxError") || allStderr.includes("ReferenceError")) {
      analysis.detectedIssues.push({
        type: "syntax_error",
        severity: "error",
        message: "JavaScript syntax or reference error detected"
      });
    }

    if (allStderr.includes("ENOENT") || allStderr.includes("not found")) {
      analysis.detectedIssues.push({
        type: "file_not_found",
        severity: "error",
        message: "Required file or directory not found"
      });
    }

    if (allStderr.includes("ECONNREFUSED") || allStderr.includes("timeout")) {
      analysis.detectedIssues.push({
        type: "network_error",
        severity: "warning",
        message: "Network connection issue detected"
      });
    }

    // Check for warnings
    const allOutput = [...this.results.stdout, ...this.results.stderr]
      .map(e => e.data).join("\n");
    
    if (allOutput.includes("WARN") || allOutput.includes("warning")) {
      analysis.detectedIssues.push({
        type: "warning",
        severity: "warning",
        message: "Warnings detected in output"
      });
    }

    this.results.analysis = analysis;
  }

  /**
   * Get formatted report
   */
  getReport() {
    return {
      summary: {
        exitCode: this.results.exitCode,
        success: this.results.exitCode === 0,
        errorCount: this.results.errors.length,
        issuesFound: this.results.analysis.detectedIssues.length
      },
      output: {
        stdout: this.results.stdout.map(e => e.data).join(""),
        stderr: this.results.stderr.map(e => e.data).join("")
      },
      errors: this.results.errors,
      issues: this.results.analysis.detectedIssues,
      analysis: this.results.analysis
    };
  }

  /**
   * Save report to file
   */
  saveReport(filePath) {
    const report = this.getReport();
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
    return filePath;
  }
}

export default CodeSandbox;

