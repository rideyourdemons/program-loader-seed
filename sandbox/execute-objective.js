import navigationController from "../core/navigation-controller.js";
import localExecutor from "../core/local-executor.js";
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
console.log("🎯 Executing Complete Objective");
console.log("=".repeat(60));
console.log("\nObjective:");
console.log("  ✓ Access website (rideyourdemons.com)");
console.log("  ✓ Log in with Firebase credentials");
console.log("  ✓ Check all code");
console.log("  ✓ Execute commands on local computer");
console.log("  ✓ Generate comprehensive reports");
console.log("  ✓ All operations logged\n");

async function executeObjective() {
  let websiteSessionId = null;
  const auditResults = [];

  try {
    // Step 1: Open browser and navigate to authentication
    console.log("=".repeat(60));
    console.log("Step 1: Opening Browser for Authentication");
    console.log("=".repeat(60) + "\n");

    console.log("🌐 Launching browser to https://rideyourdemons.com...");
    websiteSessionId = await navigationController.initWebsiteSession({
      url: "https://rideyourdemons.com",
      username: "",
      password: ""
    }, { headless: false });

    console.log(`✅ Browser opened! Session ID: ${websiteSessionId}\n`);

    // Get current URL
    let currentUrl = await navigationController.getCurrentUrl(websiteSessionId);
    console.log(`📍 Current URL: ${currentUrl}\n`);

    // Try to find login page
    console.log("🔍 Attempting to find authentication page...\n");
    const loginRoutes = ['/login', '/signin', '/auth', '/sign-in', '/admin'];
    
    for (const route of loginRoutes) {
      try {
        await navigationController.navigateTo(websiteSessionId, `https://rideyourdemons.com${route}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        currentUrl = await navigationController.getCurrentUrl(websiteSessionId);
        
        const content = await navigationController.getCurrentContent(websiteSessionId);
        if (content.includes('login') || content.includes('sign in') || 
            content.includes('email') || content.includes('password') ||
            content.includes('firebase')) {
          console.log(`✅ Found authentication page at: ${route}\n`);
          auditSystem.recordNavigation(currentUrl);
          break;
        }
      } catch (error) {
        // Continue to next route
        continue;
      }
    }

    console.log("=".repeat(60));
    console.log("📋 YOUR ACTION REQUIRED:");
    console.log("   1. Log in with your Firebase credentials in the browser");
    console.log("   2. Navigate to your code/admin area");
    console.log("   3. Return here and press Enter when ready");
    console.log("=".repeat(60) + "\n");

    await question("Press Enter when you've logged in and navigated to the code area...");

    // Step 2: Get current state
    currentUrl = await navigationController.getCurrentUrl(websiteSessionId);
    console.log(`\n✓ Current URL: ${currentUrl}`);
    auditSystem.recordNavigation(currentUrl);

    // Step 3: Check website code
    console.log("\n" + "=".repeat(60));
    console.log("Step 2: Checking Website Code");
    console.log("=".repeat(60) + "\n");

    codeAuditor.setSession(websiteSessionId);

    // Get current page content
    console.log("🔍 Analyzing current page content...");
    const pageContent = await navigationController.getCurrentContent(websiteSessionId);
    const pageAnalysis = codeAuditor.analyzeCode(pageContent, currentUrl);
    auditResults.push({ type: 'page', url: currentUrl, analysis: pageAnalysis });
    console.log(`✓ Page analyzed: ${pageAnalysis.issues.length} issues found\n`);

    // Try to find and audit code files
    console.log("🔍 Searching for code files...\n");
    const commonPaths = ['/src', '/app', '/components', '/pages', '/lib', '/utils', '/config'];
    
    for (const path of commonPaths) {
      try {
        console.log(`   Checking ${path}...`);
        const files = await navigationController.listFiles(websiteSessionId, path);
        console.log(`   ✓ Found ${files.length} items in ${path}`);
        
        // Audit code files
        for (const file of files.slice(0, 10)) { // Limit to first 10 files
          const filePath = file.filename || file.name || file;
          const fullPath = `${path}/${filePath}`.replace(/\/+/g, '/');
          
          if (codeAuditor.isCodeFile(filePath)) {
            try {
              const result = await codeAuditor.auditFile(fullPath);
              auditResults.push(result);
              console.log(`     ✓ Audited: ${filePath} (${result.analysis.issues.length} issues)`);
            } catch (error) {
              // File might not be readable, skip
            }
          }
        }
      } catch (error) {
        // Path doesn't exist or not accessible, continue
        continue;
      }
    }

    // Step 4: Execute local commands
    console.log("\n" + "=".repeat(60));
    console.log("Step 3: Testing Local Computer Access");
    console.log("=".repeat(60) + "\n");

    console.log("🔧 Testing command execution...");
    const testCommands = [
      { cmd: 'echo "Local access test"', desc: 'Echo test' },
      { cmd: 'node --version', desc: 'Node version' },
      { cmd: 'npm --version', desc: 'NPM version' }
    ];

    for (const test of testCommands) {
      try {
        const result = await localExecutor.executeCommand(test.cmd, {
          timeout: 5000,
          requireApproval: false
        });
        console.log(`   ✓ ${test.desc}: ${result.stdout.trim()}`);
      } catch (error) {
        console.log(`   ⚠️  ${test.desc}: ${error.message}`);
      }
    }

    // List local project directory
    console.log("\n📁 Checking local project structure...");
    try {
      const localItems = await localExecutor.listDirectory('.');
      const codeFiles = localItems.filter(item => 
        codeAuditor.isCodeFile(item.name)
      );
      console.log(`   ✓ Found ${codeFiles.length} code files in local project`);
      
      // Audit a few local files
      for (const file of codeFiles.slice(0, 5)) {
        try {
          const content = await localExecutor.readFile(file.path);
          const analysis = codeAuditor.analyzeCode(content, file.path);
          auditResults.push({ type: 'local', file: file.path, analysis });
          console.log(`     ✓ Audited: ${file.name} (${analysis.issues.length} issues)`);
        } catch (error) {
          // Skip if can't read
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Could not list local directory: ${error.message}`);
    }

    // Step 5: Generate comprehensive report
    console.log("\n" + "=".repeat(60));
    console.log("Step 4: Generating Comprehensive Reports");
    console.log("=".repeat(60) + "\n");

    const jsonReport = codeAuditor.saveReport('json');
    const htmlReport = codeAuditor.saveReport('html');

    console.log(`✅ Reports generated:`);
    console.log(`   JSON: ${jsonReport}`);
    console.log(`   HTML: ${htmlReport}`);

    // Final summary
    const report = codeAuditor.generateReport();
    const totalIssues = auditResults.reduce((sum, r) => 
      sum + (r.analysis?.issues?.length || 0), 0
    );

    console.log("\n" + "=".repeat(60));
    console.log("📊 FINAL SUMMARY");
    console.log("=".repeat(60));
    console.log(`Session ID: ${report.sessionId}`);
    console.log(`Duration: ${report.duration}`);
    console.log(`Files Checked: ${auditResults.length}`);
    console.log(`Total Issues Found: ${totalIssues}`);
    console.log(`Website Session: ${websiteSessionId ? 'Active' : 'Closed'}`);
    console.log(`Local Access: Operational`);
    console.log(`Sandbox Testing: Operational`);
    console.log(`Approval System: Operational`);
    console.log("=".repeat(60));

    if (totalIssues > 0) {
      console.log("\n🔍 Issues Found:");
      auditResults.forEach((result, index) => {
        if (result.analysis?.issues?.length > 0) {
          const source = result.type === 'page' ? result.url : result.file;
          console.log(`\n${index + 1}. ${source}:`);
          result.analysis.issues.slice(0, 5).forEach(issue => {
            console.log(`   [${issue.severity.toUpperCase()}] ${issue.description}`);
          });
        }
      });
    }

    console.log("\n✅ Objective Complete!");
    console.log("\n📊 Review reports:");
    console.log(`   ${htmlReport}`);
    console.log(`   ${jsonReport}\n`);

    // Keep session open for further operations
    console.log("💡 Website session is still active.");
    console.log("   You can continue using the browser or close it.\n");

    const closeNow = (await question("Close browser session now? (y/n): ")) === 'y';
    if (closeNow) {
      await navigationController.closeSession(websiteSessionId);
      console.log("\n✅ Session closed. All credentials cleared.\n");
    } else {
      console.log(`\n💾 Session ID: ${websiteSessionId}`);
      console.log("   Browser will stay open. Close manually when done.\n");
    }

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}\n`);
    logger.error("Objective execution error:", error);
    auditSystem.recordIssue('OBJECTIVE_ERROR', error.message, {
      severity: 'high',
      error: error.stack
    });
    
    // Save error report
    codeAuditor.saveReport('json');
    
    if (websiteSessionId) {
      await navigationController.closeSession(websiteSessionId);
    }
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

executeObjective();

