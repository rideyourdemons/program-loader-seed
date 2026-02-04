import navigationController from "../core/navigation-controller.js";
import codeAuditor from "../core/code-auditor.js";
import auditSystem from "../core/audit-system.js";
import { logger } from "../core/logger.js";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

console.log("\n" + "=".repeat(60));
console.log("🔍 Complete Website Audit - Guided Process");
console.log("=".repeat(60));
console.log("\nI'll help you log in and check everything on your website.");
console.log("Your website: https://rideyourdemons.com");
console.log("Running locally in VS Code → Firebase\n");

async function main() {
  try {
    // Step 1: Launch browser
    console.log("📱 Step 1: Launching browser...\n");
    
    const headless = (await question("Launch browser in headless mode? (y/n, default: n): ")) === 'y';
    
    console.log("\n🌐 Launching browser window...");
    const sessionId = await navigationController.initWebsiteSession({
      url: "https://rideyourdemons.com",
      username: "", // Will be provided in browser
      password: ""  // Will be provided in browser
    }, { headless });

    console.log(`✅ Browser launched! Session ID: ${sessionId}`);
    console.log("\n" + "-".repeat(60));
    console.log("📋 YOUR ACTION REQUIRED:");
    console.log("   1. Log in with your Firebase credentials in the browser");
    console.log("   2. Navigate to your code/admin area");
    console.log("   3. Come back here and press Enter when ready");
    console.log("-".repeat(60) + "\n");

    await question("Press Enter when you've logged in and navigated to the code area...");

    // Get current URL
    const currentUrl = await navigationController.getCurrentUrl(sessionId);
    console.log(`\n✓ Current URL: ${currentUrl}`);
    auditSystem.recordNavigation(currentUrl);

    // Set up auditor
    codeAuditor.setSession(sessionId);

    // Step 2: Determine what to audit
    console.log("\n" + "=".repeat(60));
    console.log("🔍 Step 2: What would you like me to check?");
    console.log("=".repeat(60) + "\n");
    console.log("Options:");
    console.log("  1. Current page content");
    console.log("  2. Specific file");
    console.log("  3. Directory (all code files)");
    console.log("  4. Everything (comprehensive audit)\n");

    const choice = await question("Your choice (1-4): ");

    let results = [];

    if (choice === '1') {
      console.log("\n🔍 Analyzing current page content...");
      const content = await navigationController.getCurrentContent(sessionId);
      const analysis = codeAuditor.analyzeCode(content, currentUrl);
      results.push({ type: 'page', url: currentUrl, analysis });
      
    } else if (choice === '2') {
      const filePath = await question("\nEnter file path to check: ");
      console.log(`\n🔍 Auditing file: ${filePath}...`);
      const result = await codeAuditor.auditFile(filePath);
      results.push(result);
      
    } else if (choice === '3') {
      const dirPath = await question("\nEnter directory path to check: ");
      console.log(`\n🔍 Auditing directory: ${dirPath}...`);
      const dirResults = await codeAuditor.auditDirectory(dirPath);
      results.push(...dirResults);
      
    } else if (choice === '4') {
      console.log("\n🔍 Performing comprehensive audit...");
      console.log("This will check:");
      console.log("  - Current page");
      console.log("  - All accessible files");
      console.log("  - Configuration");
      console.log("  - Structure\n");

      // Get current page
      const content = await navigationController.getCurrentContent(sessionId);
      const pageAnalysis = codeAuditor.analyzeCode(content, currentUrl);
      results.push({ type: 'page', url: currentUrl, analysis: pageAnalysis });

      // Try to find and audit common directories
      const commonDirs = ['/src', '/app', '/components', '/pages', '/config', '/public'];
      for (const dir of commonDirs) {
        try {
          console.log(`Checking ${dir}...`);
          const dirResults = await codeAuditor.auditDirectory(dir);
          results.push(...dirResults);
        } catch (error) {
          // Directory might not exist, that's okay
        }
      }
    }

    // Step 3: Generate reports
    console.log("\n" + "=".repeat(60));
    console.log("📊 Step 3: Generating Reports");
    console.log("=".repeat(60) + "\n");

    const jsonReport = codeAuditor.saveReport('json');
    const htmlReport = codeAuditor.saveReport('html');

    console.log(`✅ Reports generated:`);
    console.log(`   JSON: ${jsonReport}`);
    console.log(`   HTML: ${htmlReport}`);

    // Step 4: Summary
    const report = codeAuditor.generateReport();
    console.log("\n" + "=".repeat(60));
    console.log("📋 AUDIT SUMMARY");
    console.log("=".repeat(60));
    console.log(`Session ID: ${report.sessionId}`);
    console.log(`Duration: ${report.duration}`);
    console.log(`Files Checked: ${report.summary.totalChecks}`);
    console.log(`Issues Found: ${report.summary.totalIssues}`);
    console.log(`Blocked Writes: ${report.summary.blockedWrites}`);
    
    if (report.issues.length > 0) {
      console.log("\n🔍 Issues Found:");
      report.issues.slice(0, 10).forEach(issue => {
        console.log(`  [${issue.severity.toUpperCase()}] ${issue.description}`);
        if (issue.file) console.log(`      File: ${issue.file}`);
      });
      if (report.issues.length > 10) {
        console.log(`  ... and ${report.issues.length - 10} more (see full report)`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Audit Complete!");
    console.log("=".repeat(60));
    console.log("\n📊 Review the reports:");
    console.log(`   ${htmlReport}`);
    console.log(`   ${jsonReport}\n`);

    // Cleanup
    await navigationController.closeSession(sessionId);
    console.log("✅ Session closed. All credentials cleared from memory.\n");

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}\n`);
    logger.error("Audit error:", error);
    auditSystem.recordIssue('AUDIT_ERROR', error.message, {
      severity: 'high',
      error: error.stack
    });
    codeAuditor.saveReport('json');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Handle cleanup
process.on('SIGINT', async () => {
  console.log("\n\n⚠️  Interrupted. Saving audit log...");
  codeAuditor.saveReport('json');
  await navigationController.closeAllSessions();
  rl.close();
  process.exit(0);
});

main();

