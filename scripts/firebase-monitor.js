import navigationController from "../core/navigation-controller.js";
import firebaseBackend from "../core/firebase-backend.js";
import monitoringLoops from "../core/monitoring-loops.js";
import commandExecutor from "../core/command-executor.js";
import learningMemory from "../core/learning-memory.js";
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
console.log("🔥 Firebase Backend Monitor & Command System");
console.log("=".repeat(60));
console.log("\nThis system provides:");
console.log("  ✓ Firebase backend access");
console.log("  ✓ Continuous monitoring loops");
console.log("  ✓ Command execution following your instructions");
console.log("  ✓ Learning and memory (saved to OS)");
console.log("  ✓ Issue detection and correction\n");

let firebaseSessionId = null;
let websiteSessionId = null;

async function main() {
  try {
    // Step 1: Initialize Firebase backend
    console.log("=".repeat(60));
    console.log("Step 1: Firebase Backend Access");
    console.log("=".repeat(60) + "\n");

    console.log("To access Firebase backend, you need to provide:");
    console.log("  1. Firebase service account JSON (or config)");
    console.log("  2. Or Firebase project configuration\n");

    const useFirebase = (await question("Initialize Firebase backend? (y/n): ")) === 'y';

    if (useFirebase) {
      const configType = await question("Config type (serviceAccount/config, default: serviceAccount): ") || 'serviceAccount';
      
      if (configType === 'serviceAccount') {
        const serviceAccountPath = await question("Path to service account JSON file: ");
        
        try {
          const fs = (await import('fs')).default;
          const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
          
          firebaseSessionId = `firebase_${Date.now()}`;
          await firebaseBackend.initialize(firebaseSessionId, {
            credential: (await import('firebase-admin/app')).cert(serviceAccount)
          });
          
          console.log("\n✅ Firebase backend initialized!\n");
        } catch (error) {
          console.error(`\n✗ Failed to initialize Firebase: ${error.message}\n`);
          console.log("You can continue without Firebase backend access.\n");
        }
      }
    }

    // Step 2: Open browser for website access
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

    // Step 3: Start monitoring loops
    console.log("=".repeat(60));
    console.log("Step 3: Starting Monitoring Loops");
    console.log("=".repeat(60) + "\n");

    if (firebaseSessionId) {
      const firebaseInterval = parseInt(await question("Firebase monitoring interval (ms, default: 60000): ") || '60000');
      monitoringLoops.startFirebaseMonitoring(firebaseSessionId, firebaseInterval);
      console.log("✅ Firebase monitoring loop started\n");
    }

    if (websiteSessionId) {
      const websiteInterval = parseInt(await question("Website monitoring interval (ms, default: 60000): ") || '60000');
      monitoringLoops.startWebsiteMonitoring(websiteSessionId, websiteInterval);
      console.log("✅ Website monitoring loop started\n");
    }

    // Step 4: Command execution loop
    console.log("=".repeat(60));
    console.log("Step 4: Command Execution System");
    console.log("=".repeat(60));
    console.log("\nYou can now give me commands. I will:");
    console.log("  ✓ Execute commands following your instructions");
    console.log("  ✓ Learn from each execution");
    console.log("  ✓ Save patterns to OS memory");
    console.log("  ✓ Apply learned solutions\n");
    console.log("Type 'help' for available commands");
    console.log("Type 'exit' to stop\n");

    while (true) {
      const userCommand = await question("\n> ");

      if (userCommand.toLowerCase() === 'exit') {
        break;
      }

      if (userCommand.toLowerCase() === 'help') {
        console.log("\nAvailable Commands:");
        console.log("  execute <command>     - Execute local command");
        console.log("  read <file>          - Read local file");
        console.log("  write <file> <content> - Write file (requires approval)");
        console.log("  firebase read <path>  - Read Firebase data");
        console.log("  firebase list         - List Firebase users");
        console.log("  website navigate <url> - Navigate website");
        console.log("  website read <path>   - Read code from website");
        console.log("  monitor start <type>   - Start monitoring loop");
        console.log("  monitor stop <id>     - Stop monitoring loop");
        console.log("  monitor list          - List active loops");
        console.log("  memory stats          - Show learning memory stats");
        console.log("  fix <issue>           - Try to fix issue using learned solutions");
        console.log("  exit                  - Exit system\n");
        continue;
      }

      if (userCommand.toLowerCase() === 'memory stats') {
        const stats = learningMemory.getStats();
        console.log("\n📊 Learning Memory Statistics:");
        console.log(`   Learned patterns: ${stats.learnedCount}`);
        console.log(`   Command history: ${stats.commandHistoryCount}`);
        console.log(`   Saved solutions: ${stats.solutionsCount}`);
        console.log(`   Learned patterns: ${stats.patternsCount}`);
        console.log(`   Last updated: ${stats.lastUpdated || 'Never'}\n`);
        continue;
      }

      if (userCommand.trim() === '') {
        continue;
      }

      try {
        const result = await commandExecutor.executeCommand(userCommand, {
          firebaseSessionId,
          websiteSessionId
        });

        console.log("\n✅ Command executed successfully!");
        if (result.result) {
          console.log("Result:");
          console.log(JSON.stringify(result.result, null, 2));
        } else if (result.stdout) {
          console.log("Output:");
          console.log(result.stdout);
        }
        console.log();

      } catch (error) {
        if (error.message.includes('not authorized')) {
          console.log(`\n⚠️  ${error.message}`);
          console.log("   This operation requires authorization.\n");
        } else {
          console.error(`\n✗ Error: ${error.message}\n`);
          
          // Try to fix using learned solutions
          const fixResult = await commandExecutor.fixIssue(error.message);
          if (fixResult.learned && fixResult.success) {
            console.log("✅ Applied learned solution and fixed issue!\n");
          }
        }
      }
    }

    // Cleanup
    console.log("\n⚠️  Stopping monitoring loops...");
    monitoringLoops.stopAllLoops();
    
    if (websiteSessionId) {
      await navigationController.closeSession(websiteSessionId);
    }

    console.log("\n✅ System stopped. All data saved to memory.\n");

  } catch (error) {
    console.error(`\n✗ Fatal error: ${error.message}\n`);
    monitoringLoops.stopAllLoops();
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
  console.log("\n\n⚠️  Stopping system...");
  const monitoringLoops = (await import('../core/monitoring-loops.js')).default;
  monitoringLoops.stopAllLoops();
  await navigationController.closeAllSessions();
  rl.close();
  process.exit(0);
});

main();

