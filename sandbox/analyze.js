import CodeSandbox from "./sandbox.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "../core/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

/**
 * Comprehensive code analysis and testing tool
 */
class CodeAnalyzer {
  constructor() {
    this.sandbox = new CodeSandbox();
    this.issues = [];
    this.errors = [];
    this.warnings = [];
    this.analysisReport = {
      timestamp: new Date().toISOString(),
      staticAnalysis: {},
      runtimeAnalysis: {},
      dependencies: {},
      configuration: {},
      recommendations: []
    };
  }

  /**
   * Run static code analysis
   */
  async runStaticAnalysis() {
    console.log("\n=== Static Code Analysis ===\n");

    // Check for syntax errors
    const files = [
      "scripts/boot.js",
      "core/loader.js",
      "core/registry.js",
      "core/state.js",
      "core/logger.js",
      "core/health.js",
      "core/config-validator.js",
      "programs/website-monitor/index.js",
      "programs/example-program/index.js",
      "scripts/check-website.js"
    ];

    for (const file of files) {
      const filePath = path.join(projectRoot, file);
      if (fs.existsSync(filePath)) {
        try {
          // Try to parse as JSON if it's a JSON file
          if (file.endsWith(".json")) {
            const content = fs.readFileSync(filePath, "utf-8");
            JSON.parse(content);
            console.log(`✓ ${file} - Valid JSON`);
          } else {
            // For JS files, we'll check during runtime
            console.log(`✓ ${file} - File exists`);
          }
        } catch (error) {
          this.errors.push({
            file,
            type: "syntax_error",
            message: error.message
          });
          console.log(`✗ ${file} - ${error.message}`);
        }
      } else {
        this.warnings.push({
          file,
          type: "file_not_found",
          message: "File not found"
        });
        console.log(`⚠ ${file} - Not found`);
      }
    }

    this.analysisReport.staticAnalysis = {
      filesChecked: files.length,
      errors: this.errors.length,
      warnings: this.warnings.length
    };
  }

  /**
   * Check dependencies
   */
  async checkDependencies() {
    console.log("\n=== Dependency Check ===\n");

    const packageJsonPath = path.join(projectRoot, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const nodeModulesPath = path.join(projectRoot, "node_modules");

    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    const missing = [];
    const installed = [];

    for (const [dep, version] of Object.entries(dependencies)) {
      const depPath = path.join(nodeModulesPath, dep);
      if (fs.existsSync(depPath)) {
        installed.push(dep);
        console.log(`✓ ${dep}@${version} - Installed`);
      } else {
        missing.push(dep);
        this.errors.push({
          type: "missing_dependency",
          dependency: dep,
          version,
          message: `Missing dependency: ${dep}@${version}`
        });
        console.log(`✗ ${dep}@${version} - Missing`);
      }
    }

    this.analysisReport.dependencies = {
      total: Object.keys(dependencies).length,
      installed: installed.length,
      missing: missing.length,
      missingList: missing
    };

    if (missing.length > 0) {
      this.analysisReport.recommendations.push({
        priority: "high",
        action: "Install missing dependencies",
        command: "npm install"
      });
    }
  }

  /**
   * Check configuration files
   */
  async checkConfiguration() {
    console.log("\n=== Configuration Check ===\n");

    const configFiles = [
      "config/app.config.json",
      "config/programs.config.json"
    ];

    const configIssues = [];

    for (const configFile of configFiles) {
      const filePath = path.join(projectRoot, configFile);
      if (fs.existsSync(filePath)) {
        try {
          const config = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          
          if (configFile === "config/app.config.json") {
            // Check required fields
            if (!config.appName) {
              configIssues.push("app.config.json missing 'appName'");
            }
            if (!config.environment) {
              configIssues.push("app.config.json missing 'environment'");
            }
            if (config.website && !config.website.url) {
              this.warnings.push({
                type: "configuration",
                message: "Website URL not configured in app.config.json"
              });
            }
          }

          if (configFile === "config/programs.config.json") {
            if (!config.enabledPrograms || !Array.isArray(config.enabledPrograms)) {
              configIssues.push("programs.config.json missing or invalid 'enabledPrograms'");
            }
          }

          console.log(`✓ ${configFile} - Valid`);
        } catch (error) {
          configIssues.push(`${configFile}: ${error.message}`);
          console.log(`✗ ${configFile} - ${error.message}`);
        }
      } else {
        configIssues.push(`${configFile} not found`);
        console.log(`✗ ${configFile} - Not found`);
      }
    }

    this.analysisReport.configuration = {
      filesChecked: configFiles.length,
      issues: configIssues
    };
  }

  /**
   * Run the application in sandbox and capture output
   */
  async runApplication(timeoutMs = 10000) {
    console.log("\n=== Runtime Analysis ===\n");
    console.log("Starting application in sandbox...\n");

    const output = [];
    const errors = [];

    const result = await this.sandbox.execute(
      "node",
      ["scripts/boot.js"],
      {
        cwd: projectRoot,
        timeout: timeoutMs,
        onOutput: (data) => {
          output.push(data);
          process.stdout.write(data);
        },
        onError: (data) => {
          errors.push(data);
          process.stderr.write(data);
        }
      }
    );

    this.analysisReport.runtimeAnalysis = {
      exitCode: result.exitCode,
      stdoutLines: result.stdout.length,
      stderrLines: result.stderr.length,
      errors: result.errors,
      detectedIssues: result.analysis.detectedIssues,
      output: result.stdout.map(e => e.data).join(""),
      stderr: result.stderr.map(e => e.data).join("")
    };

    // Collect all errors
    result.errors.forEach(err => {
      this.errors.push({
        type: "runtime_error",
        ...err
      });
    });

    result.analysis.detectedIssues.forEach(issue => {
      if (issue.severity === "error") {
        this.errors.push(issue);
      } else {
        this.warnings.push(issue);
      }
    });

    return result;
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log("\n=== Analysis Report ===\n");

    const report = {
      ...this.analysisReport,
      summary: {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length,
        status: this.errors.length > 0 ? "FAILED" : this.warnings.length > 0 ? "WARNINGS" : "PASSED"
      },
      errors: this.errors,
      warnings: this.warnings,
      recommendations: this.analysisReport.recommendations
    };

    // Add recommendations based on findings
    if (this.errors.some(e => e.type === "missing_dependency")) {
      report.recommendations.push({
        priority: "high",
        action: "Run 'npm install' to install missing dependencies"
      });
    }

    if (this.warnings.some(w => w.type === "configuration" && w.message.includes("Website URL"))) {
      report.recommendations.push({
        priority: "medium",
        action: "Configure WEBSITE_URL environment variable or set website.url in app.config.json"
      });
    }

    if (this.errors.some(e => e.type === "runtime_error")) {
      report.recommendations.push({
        priority: "high",
        action: "Review runtime errors and fix code issues"
      });
    }

    return report;
  }

  /**
   * Save report to file
   */
  saveReport() {
    const report = this.generateReport();
    const reportPath = path.join(projectRoot, "logs", "analysis-report.json");
    
    // Ensure logs directory exists
    const logsDir = path.join(projectRoot, "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nReport saved to: ${reportPath}\n`);
    return reportPath;
  }

  /**
   * Print summary
   */
  printSummary() {
    const report = this.generateReport();
    
    console.log("=".repeat(60));
    console.log("ANALYSIS SUMMARY");
    console.log("=".repeat(60));
    console.log(`Status: ${report.summary.status}`);
    console.log(`Errors: ${report.summary.totalErrors}`);
    console.log(`Warnings: ${report.summary.totalWarnings}`);
    console.log("\nRecommendations:");
    report.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. [${rec.priority.toUpperCase()}] ${rec.action}`);
    });
    console.log("=".repeat(60));
  }
}

// Main execution
async function main() {
  const analyzer = new CodeAnalyzer();

  try {
    // Run all analyses
    await analyzer.runStaticAnalysis();
    await analyzer.checkDependencies();
    await analyzer.checkConfiguration();
    
    // Only run application if dependencies are installed
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(projectRoot, "package.json"), "utf-8")
    );
    const nodeModulesPath = path.join(projectRoot, "node_modules");
    const hasDeps = fs.existsSync(nodeModulesPath) && 
      fs.existsSync(path.join(nodeModulesPath, "dotenv"));

    if (hasDeps) {
      await analyzer.runApplication(15000); // 15 second timeout
    } else {
      console.log("\n⚠ Skipping runtime analysis - dependencies not installed");
      analyzer.analysisReport.runtimeAnalysis = {
        skipped: true,
        reason: "Dependencies not installed"
      };
    }

    // Generate and save report
    analyzer.printSummary();
    analyzer.saveReport();

  } catch (error) {
    console.error("Analysis failed:", error);
    process.exit(1);
  }
}

main();

