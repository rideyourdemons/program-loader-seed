import navigationController from "../core/navigation-controller.js";
import firebaseBackend from "../core/firebase-backend.js";
import monitoringLoops from "../core/monitoring-loops.js";
import commandExecutor from "../core/command-executor.js";
import learningMemory from "../core/learning-memory.js";
import codeAuditor from "../core/code-auditor.js";
import errorTracker from "../core/error-tracker.js";
import { setupGlobalErrorHandlers, wrapMain } from "../core/error-handler.js";
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
console.log("🚀 Complete System - Firebase Backend + Monitoring + Learning");
console.log("=".repeat(60));
console.log("\nThis system provides:");
console.log("  ✓ Firebase backend access");
console.log("  ✓ Continuous monitoring loops");
console.log("  ✓ Command execution following your instructions");
console.log("  ✓ Learning and memory (saved to OS)");
console.log("  ✓ Issue detection and automatic correction");
console.log("  ✓ All operations logged\n");

let firebaseSessionId = null;
let websiteSessionId = null;
const activeLoops = [];

async function main() {
  try {
    // Step 1: Initialize Firebase
    console.log("=".repeat(60));
    console.log("Step 1: Firebase Backend Initialization");
    console.log("=".repeat(60) + "\n");

    const initFirebase = (await question("Initialize Firebase backend? (y/n): ")) === 'y';
    
    if (initFirebase) {
      const serviceAccountPath = await question("Path to Firebase service account JSON (or press Enter to skip): ");
      
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
            console.log(`⚠️  Firebase initialized but access test failed: ${error.message}\n`);
          }
        } catch (error) {
          console.error(`\n✗ Failed to initialize Firebase: ${error.message}\n`);
          console.log("Continuing without Firebase backend access...\n");
        }
      }
    }

    // Step 2: Open browser
    console.log("=".repeat(60));
    console.log("Step 2: Website Access");
    console.log("=".repeat(60) + "\n");

    const openBrowser = (await question("Open browser to website? (y/n, default: y): ")) !== 'n';

    if (openBrowser) {
      console.log("\n🌐 Launching browser...");
      websiteSessionId = await navigationController.initWebsiteSession({
        url: "https://rideyourdemons.com",
        username: "",
        password: ""
      }, { headless: false });

      console.log(`✅ Browser opened! Session ID: ${websiteSessionId}\n`);
      console.log("📋 Please:");
      console.log("   1. Log in with your Firebase credentials");
      console.log("   2. Navigate to your admin/backend area");
      console.log("   3. Return here when ready\n");

      await question("Press Enter when you've logged in and are on the backend area...");

      const currentUrl = await navigationController.getCurrentUrl(websiteSessionId);
      console.log(`\n✓ Current URL: ${currentUrl}\n`);
    }

    // Step 3: Start monitoring
    console.log("=".repeat(60));
    console.log("Step 3: Starting Monitoring Loops");
    console.log("=".repeat(60) + "\n");

    if (firebaseSessionId) {
      const firebaseInterval = parseInt(await question("Firebase monitoring interval (ms, default: 60000): ") || '60000');
      const loopId = monitoringLoops.startFirebaseMonitoring(firebaseSessionId, firebaseInterval);
      activeLoops.push(loopId);
      console.log(`✅ Firebase monitoring started (loop: ${loopId})\n`);
    }

    if (websiteSessionId) {
      const websiteInterval = parseInt(await question("Website monitoring interval (ms, default: 60000): ") || '60000');
      const loopId = monitoringLoops.startWebsiteMonitoring(websiteSessionId, websiteInterval);
      activeLoops.push(loopId);
      console.log(`✅ Website monitoring started (loop: ${loopId})\n`);
    }

    // Step 4: Initial code check
    console.log("=".repeat(60));
    console.log("Step 4: Initial Code Check");
    console.log("=".repeat(60) + "\n");

    if (websiteSessionId) {
      codeAuditor.setSession(websiteSessionId);
      console.log("🔍 Performing initial code audit...\n");

      try {
        const content = await navigationController.getCurrentContent(websiteSessionId);
        const analysis = codeAuditor.analyzeCode(content, await navigationController.getCurrentUrl(websiteSessionId));
        console.log(`✓ Initial audit complete: ${analysis.issues.length} issues found\n`);
      } catch (error) {
        console.log(`⚠️  Initial audit: ${error.message}\n`);
      }
    }

    // Step 5: Command interface
    console.log("=".repeat(60));
    console.log("Step 5: Command Execution System");
    console.log("=".repeat(60));
    console.log("\n✅ System Ready!");
    console.log("\nI'm now ready to:");
    console.log("  ✓ Execute commands following your instructions");
    console.log("  ✓ Access Firebase backend");
    console.log("  ✓ Monitor continuously");
    console.log("  ✓ Learn from each operation");
    console.log("  ✓ Save patterns to OS memory");
    console.log("  ✓ Apply learned solutions automatically\n");
    console.log("Type 'help' for commands, 'status' for system status, 'exit' to stop\n");

    while (true) {
      const userCommand = await question("\n> ");

      if (userCommand.toLowerCase() === 'exit') {
        break;
      }

      if (userCommand.toLowerCase() === 'help') {
        console.log("\n📋 Available Commands:");
        console.log("\nLocal Operations:");
        console.log("  execute <command>           - Execute command on your computer");
        console.log("  read <file>                 - Read local file");
        console.log("  write <file> <content>      - Write file (requires approval)");
        console.log("\nFirebase Operations:");
        console.log("  firebase read <path>         - Read Firestore document/collection");
        console.log("  firebase list                - List Firebase users");
        console.log("  firebase db <path>           - Read Realtime Database");
        console.log("\nWebsite Operations:");
        console.log("  website navigate <url>       - Navigate to URL");
        console.log("  website read <path>          - Read code from website");
        console.log("  website content              - Get current page content");
        console.log("\nMonitoring:");
        console.log("  monitor start <type> <id> <interval>  - Start monitoring");
        console.log("  monitor stop <loopId>                - Stop monitoring");
        console.log("  monitor list                           - List active loops");
        console.log("  monitor status <loopId>                - Get loop status");
        console.log("\nLearning & Memory:");
        console.log("  memory stats                 - Show learning statistics");
        console.log("  memory solutions <problem>   - Get solutions for problem");
        console.log("  fix <issue>                  - Try to fix using learned solutions");
        console.log("\nSystem:");
        console.log("  status                       - System status");
        console.log("  audit <path>                 - Audit code file");
        console.log("  exit                         - Stop system\n");
        continue;
      }

      if (userCommand.toLowerCase() === 'status') {
        console.log("\n📊 System Status:");
        console.log(`   Firebase: ${firebaseSessionId ? '✅ Initialized' : '❌ Not initialized'}`);
        console.log(`   Website: ${websiteSessionId ? '✅ Active' : '❌ Not active'}`);
        console.log(`   Active Loops: ${activeLoops.length}`);
        
        const memoryStats = learningMemory.getStats();
        console.log(`   Learned Patterns: ${memoryStats.learnedCount}`);
        console.log(`   Command History: ${memoryStats.commandHistoryCount}`);
        console.log(`   Saved Solutions: ${memoryStats.solutionsCount}`);
        
        if (activeLoops.length > 0) {
          console.log("\n   Active Monitoring Loops:");
          activeLoops.forEach(loopId => {
            const status = monitoringLoops.getLoopStatus(loopId);
            if (status) {
              console.log(`     - ${loopId}: ${status.runCount} executions, ${status.errorCount} errors`);
            }
          });
        }
        console.log();
        continue;
      }

      if (userCommand.toLowerCase().startsWith('memory solutions')) {
        const problem = userCommand.substring('memory solutions'.length).trim();
        const solutions = learningMemory.getSolutions(problem);
        console.log(`\n📚 Solutions for: ${problem}`);
        if (solutions.length === 0) {
          console.log("   No solutions found.\n");
        } else {
          solutions.forEach((sol, index) => {
            const icon = sol.successful ? '✅' : '❌';
            console.log(`   ${index + 1}. ${icon} ${sol.solution} (${sol.timestamp})`);
          });
          console.log();
        }
        continue;
      }

      if (userCommand.toLowerCase().startsWith('audit ')) {
        const filePath = userCommand.substring(6).trim();
        if (websiteSessionId) {
          try {
            codeAuditor.setSession(websiteSessionId);
            const result = await codeAuditor.auditFile(filePath);
            console.log(`\n✅ Audit complete: ${filePath}`);
            console.log(`   Issues: ${result.analysis.issues.length}`);
            if (result.analysis.issues.length > 0) {
              result.analysis.issues.forEach(issue => {
                console.log(`   [${issue.severity}] ${issue.description}`);
              });
            }
            console.log();
          } catch (error) {
            console.error(`\n✗ Audit failed: ${error.message}\n`);
          }
        } else {
          console.log("\n⚠️  No website session. Open browser first.\n");
        }
        continue;
      }

      if (userCommand.trim() === '') {
        continue;
      }

      // Execute command
      try {
        const result = await commandExecutor.executeCommand(userCommand, {
          firebaseSessionId,
          websiteSessionId
        });

        console.log("\n✅ Command executed successfully!");
        
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
        // Record error with context
        const errorRecord = errorTracker.recordError(error, {
          command: userCommand,
          operation: 'commandExecution',
          module: 'complete-system',
          function: 'main'
        });

        if (error.message.includes('not authorized')) {
          console.log(`\n⚠️  ${error.message}`);
          console.log("   This operation requires authorization.\n");
        } else {
          console.error(`\n✗ Error: ${error.message}\n`);
          
          // Display suggested solutions
          if (errorRecord.suggestedSolutions.length > 0) {
            console.log("💡 Suggested Solutions:");
            errorRecord.suggestedSolutions.slice(0, 3).forEach((sol, idx) => {
              console.log(`   ${idx + 1}. [${sol.priority}] ${sol.description}`);
              console.log(`      ${sol.solution}`);
              if (sol.commands && sol.commands.length > 0) {
                console.log(`      Commands: ${sol.commands.join('; ')}`);
              }
            });
            console.log();
          }
          
          // Try to fix using learned solutions
          try {
            const fixResult = await commandExecutor.fixIssue(error.message);
            if (fixResult.learned && fixResult.success) {
              console.log("✅ Applied learned solution and fixed issue!\n");
              errorTracker.markResolved(errorRecord.id, fixResult.solution);
            } else {
              console.log("💡 No learned solution available. This will be saved for future reference.\n");
            }
          } catch (fixError) {
            // Fix attempt failed, that's okay
          }
        }
      }
    }

    // Cleanup
    console.log("\n⚠️  Stopping all monitoring loops...");
    monitoringLoops.stopAllLoops();
    
    if (websiteSessionId) {
      await navigationController.closeSession(websiteSessionId);
    }

    // Save final memory state
    learningMemory.saveMemory();
    learningMemory.saveCommandHistory();
    learningMemory.saveSolutions();
    learningMemory.savePatterns();

    console.log("\n✅ System stopped. All learning data saved to memory/");
    console.log(`   - Learned patterns: ${learningMemory.getStats().learnedCount}`);
    console.log(`   - Command history: ${learningMemory.getStats().commandHistoryCount}`);
    console.log(`   - Solutions: ${learningMemory.getStats().solutionsCount}\n`);

  } catch (error) {
    // Record fatal error
    const errorRecord = errorTracker.recordError(error, {
      operation: 'fatalError',
      module: 'complete-system',
      function: 'main',
      fatal: true
    });

    console.error(`\n✗ Fatal error: ${error.message}\n`);
    
    // Display error report location
    try {
      const reportPath = errorTracker.saveReport('json');
      const htmlReportPath = errorTracker.saveReport('html');
      console.log(`\n📊 Error reports saved:`);
      console.log(`   JSON: ${reportPath}`);
      console.log(`   HTML: ${htmlReportPath}\n`);
    } catch (reportError) {
      logger.error('Failed to save error report:', reportError);
    }

    monitoringLoops.stopAllLoops();
    if (websiteSessionId) {
      await navigationController.closeSession(websiteSessionId);
    }
    process.exit(1);
  } finally {
    // Save error report on exit
    try {
      const stats = errorTracker.getStats();
      if (stats.total > 0) {
        errorTracker.saveReport('json');
      }
    } catch (reportError) {
      logger.warn('Failed to save final error report:', reportError);
    }
    
    rl.close();
  }
}

// Setup global error handlers
setupGlobalErrorHandlers();

// Handle cleanup
process.on('SIGINT', async () => {
  console.log("\n\n⚠️  Stopping system...");
  
  // Save error report before exit
  try {
    const stats = errorTracker.getStats();
    if (stats.total > 0) {
      const reportPath = errorTracker.saveReport('json');
      const htmlReportPath = errorTracker.saveReport('html');
      console.log(`\n📊 Error reports saved:`);
      console.log(`   JSON: ${reportPath}`);
      console.log(`   HTML: ${htmlReportPath}\n`);
    }
  } catch (reportError) {
    logger.warn('Failed to save error report:', reportError);
  }
  
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

