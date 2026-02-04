import navigationController from "../core/navigation-controller.js";
import codeAuditor from "../core/code-auditor.js";
import auditSystem from "../core/audit-system.js";
import readOnlyMode from "../core/readonly-mode.js";
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

function hideInput(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let input = '';
    process.stdin.on('data', function(char) {
      char = char.toString();
      switch(char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write('\n');
          resolve(input);
          break;
        case '\u0003':
          process.exit();
          break;
        case '\u007f':
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          input += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("Website Code Audit System");
  console.log("=".repeat(60));
  console.log("\n⚠️  READ-ONLY MODE: No changes will be made without authorization");
  console.log("This system will:\n");
  console.log("  ✓ Navigate to your website");
  console.log("  ✓ Read and analyze code");
  console.log("  ✓ Generate comprehensive reports");
  console.log("  ✗ NOT make any changes (read-only)\n");

  // Get website URL
  const websiteUrl = await question("Website URL (default: https://rideyourdemons.com): ") || 
                     "https://rideyourdemons.com";

  console.log("\n📝 You will provide credentials in the browser window.");
  console.log("   The system will wait for you to log in manually.\n");

  const headless = (await question("Headless browser? (y/n, default: n): ")) !== 'y';

  try {
    // Initialize session
    console.log("\n🌐 Launching browser...");
    const sessionId = await navigationController.initWebsiteSession({
      url: websiteUrl,
      username: '', // Will be provided in browser
      password: ''  // Will be provided in browser
    }, { headless });

    auditSystem.log('SESSION_CREATED', { sessionId, websiteUrl });

    console.log(`\n✓ Browser launched. Session ID: ${sessionId}`);
    console.log("\n" + "-".repeat(60));
    console.log("📋 INSTRUCTIONS:");
    console.log("   1. Log in to the website in the browser window");
    console.log("   2. Navigate to the code/admin area you want audited");
    console.log("   3. Press Enter here when ready to start audit");
    console.log("-".repeat(60) + "\n");

    await question("Press Enter when you've logged in and navigated to the code area...");

    auditSystem.log('USER_READY', { sessionId });

    // Get current URL
    const currentUrl = await navigationController.getCurrentUrl(sessionId);
    console.log(`\n✓ Current URL: ${currentUrl}`);
    auditSystem.recordNavigation(currentUrl);

    // Set up code auditor
    codeAuditor.setSession(sessionId);

    // Ask what to audit
    console.log("\n" + "-".repeat(60));
    console.log("What would you like to audit?");
    console.log("  1. Single file");
    console.log("  2. Directory (all code files)");
    console.log("  3. Current page content");
    console.log("-".repeat(60) + "\n");

    const choice = await question("Choice (1-3): ");

    if (choice === '1') {
      const filePath = await question("File path to audit: ");
      console.log(`\n🔍 Auditing file: ${filePath}...`);
      
      const result = await codeAuditor.auditFile(filePath);
      
      console.log("\n✓ Audit complete!");
      console.log(`  File: ${result.filePath}`);
      console.log(`  Size: ${result.size} bytes`);
      console.log(`  Lines: ${result.analysis.lines}`);
      console.log(`  Language: ${result.analysis.language}`);
      console.log(`  Issues found: ${result.analysis.issues.length}`);

      if (result.analysis.issues.length > 0) {
        console.log("\n📋 Issues:");
        result.analysis.issues.forEach(issue => {
          console.log(`  [${issue.severity.toUpperCase()}] ${issue.description}`);
        });
      }

    } else if (choice === '2') {
      const dirPath = await question("Directory path to audit: ");
      console.log(`\n🔍 Auditing directory: ${dirPath}...`);
      
      const results = await codeAuditor.auditDirectory(dirPath);
      
      console.log(`\n✓ Audit complete!`);
      console.log(`  Files audited: ${results.length}`);
      
      const totalIssues = results.reduce((sum, r) => sum + r.analysis.issues.length, 0);
      console.log(`  Total issues found: ${totalIssues}`);

    } else if (choice === '3') {
      console.log("\n🔍 Analyzing current page content...");
      
      const content = await navigationController.getCurrentContent(sessionId);
      const analysis = codeAuditor.analyzeCode(content, currentUrl);
      
      console.log("\n✓ Analysis complete!");
      console.log(`  Content size: ${content.length} bytes`);
      console.log(`  Language: ${analysis.language}`);
      console.log(`  Issues found: ${analysis.issues.length}`);

      if (analysis.issues.length > 0) {
        console.log("\n📋 Issues:");
        analysis.issues.forEach(issue => {
          console.log(`  [${issue.severity.toUpperCase()}] ${issue.description}`);
        });
      }
    }

    // Generate and save reports
    console.log("\n📊 Generating reports...");
    const jsonReport = codeAuditor.saveReport('json');
    const htmlReport = codeAuditor.saveReport('html');
    
    console.log(`\n✓ Reports saved:`);
    console.log(`  JSON: ${jsonReport}`);
    console.log(`  HTML: ${htmlReport}`);

    // Show summary
    const report = codeAuditor.generateReport();
    console.log("\n" + "=".repeat(60));
    console.log("AUDIT SUMMARY");
    console.log("=".repeat(60));
    console.log(`Session ID: ${report.sessionId}`);
    console.log(`Duration: ${report.duration}`);
    console.log(`Total Checks: ${report.summary.totalChecks}`);
    console.log(`Total Issues: ${report.summary.totalIssues}`);
    console.log(`Blocked Writes: ${report.summary.blockedWrites}`);
    console.log("=".repeat(60));

    // Cleanup
    await navigationController.closeSession(sessionId);
    console.log("\n✓ Session closed. All credentials cleared from memory.");

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}`);
    auditSystem.recordIssue('AUDIT_ERROR', error.message, {
      severity: 'high',
      error: error.stack
    });
    
    // Save error report
    codeAuditor.saveReport('json');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Handle cleanup
process.on('SIGINT', async () => {
  console.log("\n\nCleaning up...");
  await navigationController.closeAllSessions();
  codeAuditor.saveReport('json');
  rl.close();
  process.exit(0);
});

main();

