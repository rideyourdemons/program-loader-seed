import navigationController from "../core/navigation-controller.js";
import firebaseBackend from "../core/firebase-backend.js";
import monitoringLoops from "../core/monitoring-loops.js";
import commandExecutor from "../core/command-executor.js";
import learningMemory from "../core/learning-memory.js";
import codeAuditor from "../core/code-auditor.js";
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

console.log("\n" + "=".repeat(70));
console.log("🚀 COMPLETE SYSTEM - Running All Operations in Order");
console.log("=".repeat(70) + "\n");

let firebaseSessionId = null;
let websiteSessionId = null;
const activeLoops = [];

async function step1_AccessFirebase() {
  console.log("\n" + "=".repeat(70));
  console.log("STEP 1: 🔥 Access Firebase Console");
  console.log("=".repeat(70) + "\n");

  const firebaseUrl = "https://console.firebase.google.com/u/0/?fb_gclid=CjwKCAiAu67KBhAkEiwAY0jAlSXViQo0WBURe33hN7VkWyZP2gvC29clNwxHJ04f8xXxTD0w5KUkuBoC8wQQAvD_BwE&_gl=1*13k5r90*_up*MQ..*_ga*OTI5MTQzMDYwLjE3NDk3NDIyNzQ.*_ga_CW55HF8NVT*czE3NjY2MTQ0ODAkbzE0OCRnMSR0MTc2NjYxNDQ4MSRqNTkkbDAkaDA.&gclid=CjwKCAiAu67KBhAkEiwAY0jAlSXViQo0WBURe33hN7VkWyZP2gvC29clNwxHJ04f8xXxTD0w5KUkuBoC8wQQAvD_BwE&gclsrc=aw.ds&gbraid=0AAAAADpUDOhX5_Ek9QUWQ6l2uAdHLZrN_";

  try {
    console.log("🌐 Opening browser to Firebase Console...\n");
    
    websiteSessionId = await navigationController.initWebsiteSession({
      url: firebaseUrl,
      username: "",
      password: ""
    }, { headless: false });

    console.log(`✅ Browser opened! Session ID: ${websiteSessionId}\n`);
    console.log("📋 Please:");
    console.log("   1. Sign in with your Google Account");
    console.log("   2. Select your Firebase project");
    console.log("   3. Navigate to your project dashboard\n");

    await question("Press Enter when you've logged in to Firebase...");

    const currentUrl = await navigationController.getCurrentUrl(websiteSessionId);
    console.log(`\n✓ Current URL: ${currentUrl}\n`);

    // Option to set up Firebase backend
    const setupBackend = (await question("Set up Firebase backend access? (y/n): ")) === 'y';
    
    if (setupBackend) {
      const serviceAccountPath = await question("Path to Firebase service account JSON file: ");
      
      if (serviceAccountPath && serviceAccountPath.trim()) {
        try {
          const fs = (await import('fs')).default;
          const { cert } = await import('firebase-admin/app');
          const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
          
          firebaseSessionId = `firebase_${Date.now()}`;
          await firebaseBackend.initialize(firebaseSessionId, {
            credential: cert(serviceAccount)
          });
          
          console.log("\n✅ Firebase backend initialized!\n");
          
          // Test Firebase access
          try {
            const users = await firebaseBackend.listUsers(5);
            console.log(`✓ Firebase accessible - Found ${users.length} users\n`);
          } catch (error) {
            console.log(`⚠️  Firebase initialized but access test: ${error.message}\n`);
          }
        } catch (error) {
          console.error(`\n✗ Failed to initialize Firebase: ${error.message}\n`);
        }
      }
    }

    return true;
  } catch (error) {
    console.error(`\n✗ Error: ${error.message}\n`);
    return false;
  }
}

async function step2_ScanWebsite() {
  console.log("\n" + "=".repeat(70));
  console.log("STEP 2: 🌐 Open Website & Scan Code");
  console.log("=".repeat(70) + "\n");

  try {
    console.log("🌐 Navigating to rideyourdemons.com...\n");
    
    if (websiteSessionId) {
      await navigationController.navigateTo(websiteSessionId, "https://rideyourdemons.com");
    } else {
      websiteSessionId = await navigationController.initWebsiteSession({
        url: "https://rideyourdemons.com",
        username: "",
        password: ""
      }, { headless: false });
    }

    await sleep(2000); // Wait for page load

    const websiteUrl = await navigationController.getCurrentUrl(websiteSessionId);
    console.log(`✓ Navigated to: ${websiteUrl}\n`);

    console.log("📋 Please:");
    console.log("   1. Log in to the website with your Firebase credentials");
    console.log("   2. Navigate to your admin/code area");
    console.log("   3. Return here when ready\n");

    await question("Press Enter when you've logged in and are ready to scan...");

    const currentUrl = await navigationController.getCurrentUrl(websiteSessionId);
    console.log(`\n✓ Current URL: ${currentUrl}\n`);

    console.log("🔍 Starting comprehensive scan...\n");

    // Set up code auditor
    codeAuditor.setSession(websiteSessionId);

    // Get page content
    console.log("  1. Reading page content...");
    const content = await navigationController.getCurrentContent(websiteSessionId);
    console.log(`     ✓ Content retrieved (${content.length} characters)\n`);

    // Analyze code
    console.log("  2. Analyzing code for issues...");
    const analysis = codeAuditor.analyzeCode(content, currentUrl);
    console.log(`     ✓ Analysis complete\n`);

    // Report issues
    console.log("  3. Issue Report:");
    if (analysis.issues.length > 0) {
      console.log(`     ⚠️  Found ${analysis.issues.length} issues:\n`);
      analysis.issues.forEach((issue, index) => {
        const severityIcon = issue.severity === 'error' ? '❌' : 
                            issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`     ${index + 1}. ${severityIcon} [${issue.severity.toUpperCase()}] ${issue.description}`);
        if (issue.location) {
          console.log(`        Location: ${issue.location}`);
        }
      });
    } else {
      console.log("     ✅ No issues found\n");
    }

    // Save scan results
    learningMemory.saveSolution(
      `Scan of ${currentUrl}`,
      `Found ${analysis.issues.length} issues`,
      analysis.issues.length === 0
    );

    return true;
  } catch (error) {
    console.error(`\n✗ Error: ${error.message}\n`);
    return false;
  }
}

async function step3_StartMonitoring() {
  console.log("\n" + "=".repeat(70));
  console.log("STEP 3: 🔍 Start Continuous Monitoring");
  console.log("=".repeat(70) + "\n");

  try {
    if (firebaseSessionId) {
      const loopId = monitoringLoops.startFirebaseMonitoring(firebaseSessionId, 60000);
      activeLoops.push(loopId);
      console.log(`✅ Firebase monitoring started (loop: ${loopId})\n`);
    } else {
      console.log("⚠️  Firebase backend not initialized, skipping Firebase monitoring\n");
    }

    if (websiteSessionId) {
      const loopId = monitoringLoops.startWebsiteMonitoring(websiteSessionId, 60000);
      activeLoops.push(loopId);
      console.log(`✅ Website monitoring started (loop: ${loopId})\n`);
    } else {
      console.log("⚠️  Website session not active, skipping website monitoring\n");
    }

    if (activeLoops.length > 0) {
      console.log("✅ Monitoring active! Loops running continuously.\n");
    } else {
      console.log("⚠️  No monitoring loops started.\n");
    }

    return true;
  } catch (error) {
    console.error(`\n✗ Error: ${error.message}\n`);
    return false;
  }
}

async function step4_ExecuteTestCommand() {
  console.log("\n" + "=".repeat(70));
  console.log("STEP 4: 💻 Execute Test Command");
  console.log("=".repeat(70) + "\n");

  try {
    const testCommand = 'echo "System test command"';
    console.log(`🔧 Executing: ${testCommand}\n`);
    
    const result = await commandExecutor.executeCommand(testCommand, {
      firebaseSessionId,
      websiteSessionId
    });

    console.log("✅ Command executed!\n");
    
    if (result.stdout) {
      console.log("Output:");
      console.log(result.stdout);
    }
    console.log();

    return true;
  } catch (error) {
    console.log(`⚠️  Command execution: ${error.message}\n`);
    return true; // Don't fail on command execution errors
  }
}

async function step5_ViewStatus() {
  console.log("\n" + "=".repeat(70));
  console.log("STEP 5: 📊 View System Status");
  console.log("=".repeat(70) + "\n");

  console.log("🔌 Active Sessions:");
  console.log(`   Firebase: ${firebaseSessionId ? '✅ ' + firebaseSessionId : '❌ Not initialized'}`);
  console.log(`   Website: ${websiteSessionId ? '✅ ' + websiteSessionId : '❌ Not active'}\n`);

  console.log("🔄 Monitoring Loops:");
  if (activeLoops.length > 0) {
    activeLoops.forEach(loopId => {
      const status = monitoringLoops.getLoopStatus(loopId);
      if (status) {
        console.log(`   ${loopId}: ${status.runCount} executions, ${status.errorCount} errors`);
      }
    });
  } else {
    console.log("   No active loops\n");
  }

  const memoryStats = learningMemory.getStats();
  console.log("🧠 Learning Memory:");
  console.log(`   Learned patterns: ${memoryStats.learnedCount}`);
  console.log(`   Command history: ${memoryStats.commandHistoryCount}`);
  console.log(`   Saved solutions: ${memoryStats.solutionsCount}`);
  console.log(`   Patterns: ${memoryStats.patternsCount}`);
  console.log(`   Last updated: ${memoryStats.lastUpdated || 'Never'}\n`);

  return true;
}

async function step6_ViewMemory() {
  console.log("\n" + "=".repeat(70));
  console.log("STEP 6: 🧠 View Learning Memory");
  console.log("=".repeat(70) + "\n");

  const stats = learningMemory.getStats();
  console.log("📊 Statistics:");
  console.log(`   Learned patterns: ${stats.learnedCount}`);
  console.log(`   Command history: ${stats.commandHistoryCount}`);
  console.log(`   Saved solutions: ${stats.solutionsCount}`);
  console.log(`   Patterns: ${stats.patternsCount}\n`);

  const similarCommands = learningMemory.findSimilarCommands('test');
  if (similarCommands.length > 0) {
    console.log("📝 Recent similar commands:");
    similarCommands.slice(0, 5).forEach(cmd => {
      console.log(`   - ${cmd.command} (${cmd.timestamp})`);
    });
    console.log();
  }

  return true;
}

async function step7_ViewAuditLogs() {
  console.log("\n" + "=".repeat(70));
  console.log("STEP 7: 📝 View Audit Logs");
  console.log("=".repeat(70) + "\n");

  try {
    const fs = (await import('fs')).default;
    const path = (await import('path')).default;
    const { fileURLToPath } = await import('url');
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    
    const logFile = path.join(__dirname, '../logs/app.log');
    
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.split('\n').filter(l => l.trim());
      const recentLines = lines.slice(-10);
      
      console.log("📄 Recent log entries (last 10):\n");
      recentLines.forEach(line => {
        console.log(`   ${line}`);
      });
    } else {
      console.log("⚠️  No log file found.\n");
    }
  } catch (error) {
    console.error(`✗ Error: ${error.message}\n`);
  }

  return true;
}

async function main() {
  const results = {
    step1: false,
    step2: false,
    step3: false,
    step4: false,
    step5: false,
    step6: false,
    step7: false
  };

  try {
    // Step 1: Access Firebase
    results.step1 = await step1_AccessFirebase();
    await sleep(1000);

    // Step 2: Scan Website
    results.step2 = await step2_ScanWebsite();
    await sleep(1000);

    // Step 3: Start Monitoring
    results.step3 = await step3_StartMonitoring();
    await sleep(1000);

    // Step 4: Execute Test Command
    results.step4 = await step4_ExecuteTestCommand();
    await sleep(1000);

    // Step 5: View Status
    results.step5 = await step5_ViewStatus();
    await sleep(1000);

    // Step 6: View Memory
    results.step6 = await step6_ViewMemory();
    await sleep(1000);

    // Step 7: View Audit Logs
    results.step7 = await step7_ViewAuditLogs();

    // Final Summary
    console.log("\n" + "=".repeat(70));
    console.log("📊 COMPLETE - All Steps Executed");
    console.log("=".repeat(70) + "\n");

    console.log("✅ Steps Completed:");
    Object.entries(results).forEach(([step, success]) => {
      const icon = success ? '✅' : '❌';
      console.log(`   ${icon} ${step}`);
    });

    const allPassed = Object.values(results).every(r => r);
    console.log(`\n${allPassed ? '✅ All steps completed successfully!' : '⚠️  Some steps had issues.'}\n`);

    console.log("🔄 Monitoring loops are running continuously.");
    console.log("Press Ctrl+C to stop monitoring and exit.\n");

    // Keep running for monitoring
    await new Promise(() => {}); // Run indefinitely

  } catch (error) {
    console.error(`\n✗ Fatal error: ${error.message}\n`);
  } finally {
    // Cleanup on exit
    monitoringLoops.stopAllLoops();
    if (websiteSessionId) {
      await navigationController.closeSession(websiteSessionId);
    }
    learningMemory.saveMemory();
    learningMemory.saveCommandHistory();
    learningMemory.saveSolutions();
    learningMemory.savePatterns();
    rl.close();
  }
}

// Handle cleanup
process.on('SIGINT', async () => {
  console.log("\n\n⚠️  Shutting down...");
  monitoringLoops.stopAllLoops();
  learningMemory.saveMemory();
  learningMemory.saveCommandHistory();
  learningMemory.saveSolutions();
  learningMemory.savePatterns();
  await navigationController.closeAllSessions();
  rl.close();
  process.exit(0);
});

main();

