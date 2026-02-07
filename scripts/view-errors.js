import errorTracker from "../core/error-tracker.js";
import { logger } from "../core/logger.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const errorsDir = path.join(__dirname, "../logs/errors");

/**
 * View error reports and solutions
 */
async function viewErrors() {
  console.log("\n" + "=".repeat(60));
  console.log("📊 Error Tracker - View Errors & Solutions");
  console.log("=".repeat(60) + "\n");

  // Get current session errors
  const errors = errorTracker.getErrors();
  const unresolved = errorTracker.getUnresolvedErrors();
  const stats = errorTracker.getStats();

  console.log("Current Session Statistics:");
  console.log(`  Total Errors: ${stats.total}`);
  console.log(`  Resolved: ${stats.resolved}`);
  console.log(`  Unresolved: ${stats.unresolved}`);
  console.log(`  Session ID: ${stats.sessionId}`);
  console.log(`  Duration: ${stats.duration}\n`);

  if (errors.length === 0) {
    console.log("✅ No errors recorded in current session.\n");
    return;
  }

  // Show unresolved errors
  if (unresolved.length > 0) {
    console.log(`\n❌ Unresolved Errors (${unresolved.length}):\n`);
    unresolved.forEach((error, idx) => {
      console.log(`${idx + 1}. [${error.id}] ${error.name}: ${error.message}`);
      console.log(`   Time: ${error.timestamp}`);
      console.log(`   Context: ${error.context.operation || error.context.command || 'unknown'}`);
      
      if (error.suggestedSolutions.length > 0) {
        console.log(`   💡 Solutions (${error.suggestedSolutions.length}):`);
        error.suggestedSolutions.slice(0, 3).forEach((sol, solIdx) => {
          console.log(`      ${solIdx + 1}. [${sol.priority}] ${sol.description}`);
          console.log(`         ${sol.solution}`);
        });
      }
      console.log();
    });
  }

  // Show error types
  if (stats.byType && Object.keys(stats.byType).length > 0) {
    console.log("\n📈 Errors by Type:");
    Object.entries(stats.byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    console.log();
  }

  // List available error report files
  try {
    if (fs.existsSync(errorsDir)) {
      const files = fs.readdirSync(errorsDir)
        .filter(f => f.startsWith('error-report_') && f.endsWith('.json'))
        .sort()
        .reverse()
        .slice(0, 5);

      if (files.length > 0) {
        console.log("\n📁 Recent Error Reports:");
        files.forEach(file => {
          const filePath = path.join(errorsDir, file);
          const stats = fs.statSync(filePath);
          console.log(`  ${file}`);
          console.log(`    Created: ${stats.mtime.toISOString()}`);
          console.log(`    Size: ${(stats.size / 1024).toFixed(2)} KB`);
        });
        console.log();
      }
    }
  } catch (error) {
    logger.warn('Failed to list error reports:', error.message);
  }

  // Generate and save current report
  console.log("\n💾 Generating error report...");
  try {
    const jsonPath = errorTracker.saveReport('json');
    const htmlPath = errorTracker.saveReport('html');
    console.log(`✅ Reports saved:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   HTML: ${htmlPath}\n`);
  } catch (error) {
    console.error(`❌ Failed to generate report: ${error.message}\n`);
  }
}

// Run if executed directly
if (import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/')) || 
    import.meta.url.includes('view-errors.js')) {
  viewErrors().catch(error => {
    console.error('Error viewing errors:', error);
    process.exit(1);
  });
}

export default viewErrors;
