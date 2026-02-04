import navigationController from "../core/navigation-controller.js";
import firebaseBackend from "../core/firebase-backend.js";
import monitoringLoops from "../core/monitoring-loops.js";
import commandExecutor from "../core/command-executor.js";
import learningMemory from "../core/learning-memory.js";
import codeAuditor from "../core/code-auditor.js";
import localExecutor from "../core/local-executor.js";
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

function printHeader() {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 PROGRAM LOADER SEED - Interactive System");
  console.log("=".repeat(70));
}

function printMenu() {
  console.log("\n📋 MAIN MENU:");
  console.log("  1. 🔥 Access Firebase Console");
  console.log("  2. 🌐 Open Website & Scan Code");
  console.log("  3. 🔍 Start Monitoring (Firebase + Website)");
  console.log("  4. 💻 Execute Command");
  console.log("  5. 📊 View System Status");
  console.log("  6. 🧠 View Learning Memory");
  console.log("  7. 📝 View Audit Logs");
  console.log("  8. 🔧 Complete System (Full Integration)");
  console.log("  9. 🧪 Run System Tests");
  console.log("  0. ❌ Exit");
  console.log();
}

let firebaseSessionId = null;
let websiteSessionId = null;
const activeLoops = [];

async function accessFirebase() {
  console.log("\n" + "=".repeat(70));
  console.log("🔥 Firebase Console Access");
  console.log("=".repeat(70) + "\n");

  const firebaseUrl = "https://console.firebase.google.com/u/0/?fb_gclid=CjwKCAiAu67KBhAkEiwAY0jAlSXViQo0WBURe33hN7VkWyZP2gvC29clNwxHJ04f8xXxTD0w5KUkuBoC8wQQAvD_BwE&_gl=1*13k5r90*_up*MQ..*_ga*OTI5MTQzMDYwLjE3NDk3NDIyNzQ.*_ga_CW55HF8NVT*czE3NjY2MTQ0ODAkbzE0OCRnMSR0MTc2NjYxNDQ4MSRqNTkkbDAkaDA.&gclid=CjwKCAiAu67KBhAkEiwAY0jAlSXViQo0WBURe33hN7VkWyZP2gvC29clNwxHJ04f8xXxTD0w5KUkuBoC8wQQAvD_BwE&gclsrc=aw.ds&gbraid=0AAAAADpUDOhX5_Ek9QUWQ6l2uAdHLZrN_";

  try {
    console.log("🌐 Opening browser to Firebase Console...\n");
    
    if (websiteSessionId) {
      await navigationController.closeSession(websiteSessionId);
    }

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

    await question("Press Enter when you've logged in...");

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
        } catch (error) {
          console.error(`\n✗ Failed: ${error.message}\n`);
        }
      }
    }

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}\n`);
  }
}

async function scanWebsite() {
  console.log("\n" + "=".repeat(70));
  console.log("🌐 Website Scanning & Code Checking");
  console.log("=".repeat(70) + "\n");

  try {
    if (!websiteSessionId) {
      console.log("🌐 Opening browser to rideyourdemons.com...\n");
      websiteSessionId = await navigationController.initWebsiteSession({
        url: "https://rideyourdemons.com",
        username: "",
        password: ""
      }, { headless: false });
    } else {
      console.log("🌐 Navigating to rideyourdemons.com...\n");
      await navigationController.navigateTo(websiteSessionId, "https://rideyourdemons.com");
    }

    console.log(`✅ Browser ready! Session ID: ${websiteSessionId}\n`);
    console.log("📋 Please:");
    console.log("   1. Log in to the website with your Firebase credentials");
    console.log("   2. Navigate to your admin/code area");
    console.log("   3. Return here when ready\n");

    await question("Press Enter when you've logged in and are ready to scan...");

    const currentUrl = await navigationController.getCurrentUrl(websiteSessionId);
    console.log(`\n✓ Current URL: ${currentUrl}\n`);

    console.log("🔍 Starting scan...\n");

    codeAuditor.setSession(websiteSessionId);
    const content = await navigationController.getCurrentContent(websiteSessionId);
    const analysis = codeAuditor.analyzeCode(content, currentUrl);

    console.log(`📊 Scan Results:`);
    console.log(`   Content size: ${content.length} characters`);
    console.log(`   Issues found: ${analysis.issues.length}\n`);

    if (analysis.issues.length > 0) {
      console.log("⚠️  Issues:");
      analysis.issues.forEach((issue, index) => {
        const icon = issue.severity === 'error' ? '❌' : 
                    issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`   ${index + 1}. ${icon} [${issue.severity.toUpperCase()}] ${issue.description}`);
      });
    } else {
      console.log("✅ No issues found!\n");
    }

    learningMemory.saveSolution(
      `Scan of ${currentUrl}`,
      `Found ${analysis.issues.length} issues`,
      analysis.issues.length === 0
    );

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}\n`);
  }
}

async function startMonitoring() {
  console.log("\n" + "=".repeat(70));
  console.log("🔍 Starting Continuous Monitoring");
  console.log("=".repeat(70) + "\n");

  if (!firebaseSessionId && !websiteSessionId) {
    console.log("⚠️  No active sessions. Please access Firebase or Website first.\n");
    return;
  }

  try {
    if (firebaseSessionId) {
      const loopId = monitoringLoops.startFirebaseMonitoring(firebaseSessionId, 60000);
      activeLoops.push(loopId);
      console.log(`✅ Firebase monitoring started (loop: ${loopId})\n`);
    }

    if (websiteSessionId) {
      const loopId = monitoringLoops.startWebsiteMonitoring(websiteSessionId, 60000);
      activeLoops.push(loopId);
      console.log(`✅ Website monitoring started (loop: ${loopId})\n`);
    }

    console.log("✅ Monitoring active! Loops running continuously.\n");
    console.log("Press Enter to return to menu...\n");
    await question("");

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}\n`);
  }
}

async function executeCommand() {
  console.log("\n" + "=".repeat(70));
  console.log("💻 Command Execution");
  console.log("=".repeat(70) + "\n");

  const command = await question("Enter command to execute: ");

  if (!command.trim()) {
    console.log("⚠️  No command provided.\n");
    return;
  }

  try {
    console.log(`\n🔧 Executing: ${command}\n`);
    const result = await commandExecutor.executeCommand(command, {
      firebaseSessionId,
      websiteSessionId
    });

    console.log("✅ Command executed!\n");
    
    if (result.result) {
      if (typeof result.result === 'object') {
        console.log("Result:");
        console.log(JSON.stringify(result.result, null, 2));
      } else {
        console.log(`Result: ${result.result}`);
      }
    } else if (result.stdout) {
      console.log("Output:");
      console.log(result.stdout);
    }
    console.log();

  } catch (error) {
    if (error.message.includes('not authorized')) {
      console.log(`\n⚠️  ${error.message}\n`);
    } else {
      console.error(`\n✗ Error: ${error.message}\n`);
    }
  }
}

async function viewStatus() {
  console.log("\n" + "=".repeat(70));
  console.log("📊 System Status");
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
}

async function viewMemory() {
  console.log("\n" + "=".repeat(70));
  console.log("🧠 Learning Memory");
  console.log("=".repeat(70) + "\n");

  const stats = learningMemory.getStats();
  console.log("📊 Statistics:");
  console.log(`   Learned patterns: ${stats.learnedCount}`);
  console.log(`   Command history: ${stats.commandHistoryCount}`);
  console.log(`   Saved solutions: ${stats.solutionsCount}`);
  console.log(`   Patterns: ${stats.patternsCount}\n`);

  const viewDetails = (await question("View detailed information? (y/n): ")) === 'y';
  
  if (viewDetails) {
    const similarCommands = learningMemory.findSimilarCommands('test');
    if (similarCommands.length > 0) {
      console.log("\n📝 Recent similar commands:");
      similarCommands.slice(0, 5).forEach(cmd => {
        console.log(`   - ${cmd.command} (${cmd.timestamp})`);
      });
    }
  }
  console.log();
}

async function viewAuditLogs() {
  console.log("\n" + "=".repeat(70));
  console.log("📝 Audit Logs");
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
      const recentLines = lines.slice(-20);
      
      console.log("📄 Recent log entries (last 20):\n");
      recentLines.forEach(line => {
        console.log(`   ${line}`);
      });
    } else {
      console.log("⚠️  No log file found.\n");
    }
  } catch (error) {
    console.error(`✗ Error: ${error.message}\n`);
  }
}

async function runCompleteSystem() {
  console.log("\n" + "=".repeat(70));
  console.log("🔧 Complete System Integration");
  console.log("=".repeat(70) + "\n");

  console.log("This will run the full integrated system.");
  console.log("See: npm run complete-system for details.\n");

  const proceed = (await question("Proceed? (y/n): ")) === 'y';
  
  if (proceed) {
    console.log("\n✅ Starting complete system...\n");
    console.log("Run 'npm run complete-system' in a new terminal for full integration.\n");
  }
}

async function runTests() {
  console.log("\n" + "=".repeat(70));
  console.log("🧪 Running System Tests");
  console.log("=".repeat(70) + "\n");

  const { spawn } = await import('child_process');
  
  return new Promise((resolve) => {
    const testProcess = spawn('npm', ['run', 'test-full'], {
      stdio: 'inherit',
      shell: true
    });

    testProcess.on('close', (code) => {
      console.log(`\n✅ Tests completed with exit code: ${code}\n`);
      resolve();
    });
  });
}

async function main() {
  printHeader();

  while (true) {
    printMenu();
    const choice = await question("Select option (0-9): ");

    switch (choice.trim()) {
      case '1':
        await accessFirebase();
        break;
      case '2':
        await scanWebsite();
        break;
      case '3':
        await startMonitoring();
        break;
      case '4':
        await executeCommand();
        break;
      case '5':
        await viewStatus();
        break;
      case '6':
        await viewMemory();
        break;
      case '7':
        await viewAuditLogs();
        break;
      case '8':
        await runCompleteSystem();
        break;
      case '9':
        await runTests();
        break;
      case '0':
        console.log("\n⚠️  Shutting down...\n");
        monitoringLoops.stopAllLoops();
        if (websiteSessionId) {
          await navigationController.closeSession(websiteSessionId);
        }
        learningMemory.saveMemory();
        learningMemory.saveCommandHistory();
        learningMemory.saveSolutions();
        learningMemory.savePatterns();
        console.log("✅ All data saved. Goodbye!\n");
        rl.close();
        process.exit(0);
        break;
      default:
        console.log("\n⚠️  Invalid option. Please select 0-9.\n");
    }
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

