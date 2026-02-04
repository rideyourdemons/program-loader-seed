import navigationController from "../core/navigation-controller.js";
import firebaseBackend from "../core/firebase-backend.js";
import monitoringLoops from "../core/monitoring-loops.js";
import codeAuditor from "../core/code-auditor.js";
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
console.log("🔍 Website Scanning & Code Checking");
console.log("=".repeat(60) + "\n");

async function main() {
  let websiteSessionId = null;
  let firebaseSessionId = null;

  try {
    // Step 1: Navigate to website
    console.log("=".repeat(60));
    console.log("Step 1: Accessing Website");
    console.log("=".repeat(60) + "\n");

    console.log("🌐 Opening browser to rideyourdemons.com...\n");
    
    websiteSessionId = await navigationController.initWebsiteSession({
      url: "https://rideyourdemons.com",
      username: "",
      password: ""
    }, { headless: false });

    console.log(`✅ Browser opened! Session ID: ${websiteSessionId}\n`);
    console.log("📋 Please:");
    console.log("   1. Log in to the website with your Firebase credentials");
    console.log("   2. Navigate to your admin/code area");
    console.log("   3. Return here when ready\n");

    await question("Press Enter when you've logged in and are ready to scan...");

    const currentUrl = await navigationController.getCurrentUrl(websiteSessionId);
    console.log(`\n✓ Current URL: ${currentUrl}\n`);

    // Step 2: Setup Firebase backend (optional)
    console.log("=".repeat(60));
    console.log("Step 2: Firebase Backend Access (Optional)");
    console.log("=".repeat(60) + "\n");

    const setupFirebase = (await question("Set up Firebase backend access? (y/n): ")) === 'y';

    if (setupFirebase) {
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
          console.error(`\n✗ Failed to initialize Firebase: ${error.message}\n`);
        }
      }
    }

    // Step 3: Comprehensive Scan
    console.log("=".repeat(60));
    console.log("Step 3: Scanning Website & Checking Code");
    console.log("=".repeat(60) + "\n");

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
        if (issue.suggestion) {
          console.log(`        Suggestion: ${issue.suggestion}`);
        }
      });
    } else {
      console.log("     ✅ No issues found\n");
    }

    // Check Firebase backend if initialized
    if (firebaseSessionId) {
      console.log("  4. Checking Firebase backend...");
      try {
        const users = await firebaseBackend.listUsers(10);
        console.log(`     ✓ Firebase backend accessible`);
        console.log(`     ✓ Found ${users.length} users\n`);
      } catch (error) {
        console.log(`     ⚠️  Firebase check: ${error.message}\n`);
      }
    }

    // Step 4: Start monitoring
    console.log("=".repeat(60));
    console.log("Step 4: Starting Continuous Monitoring");
    console.log("=".repeat(60) + "\n");

    const startMonitoring = (await question("Start continuous monitoring? (y/n, default: y): ")) !== 'n';

    if (startMonitoring) {
      if (firebaseSessionId) {
        const firebaseLoop = monitoringLoops.startFirebaseMonitoring(firebaseSessionId, 60000);
        console.log(`✅ Firebase monitoring started (loop: ${firebaseLoop})\n`);
      }

      const websiteLoop = monitoringLoops.startWebsiteMonitoring(websiteSessionId, 60000);
      console.log(`✅ Website monitoring started (loop: ${websiteLoop})\n`);

      console.log("✅ All systems operational!\n");
      console.log("Monitoring loops are running continuously.");
      console.log("The system will:");
      console.log("  ✓ Monitor Firebase backend (if configured)");
      console.log("  ✓ Monitor website continuously");
      console.log("  ✓ Detect issues automatically");
      console.log("  ✓ Log everything to audit system");
      console.log("  ✓ Learn from patterns\n");

      // Save initial scan results
      learningMemory.saveSolution(
        `Initial scan of ${currentUrl}`,
        `Found ${analysis.issues.length} issues`,
        analysis.issues.length === 0
      );

      console.log("Press Ctrl+C to stop monitoring...\n");

      // Keep running
      await new Promise(() => {}); // Run indefinitely
    } else {
      console.log("\n✅ Scan complete! Monitoring not started.\n");
    }

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}\n`);
    logger.error(`Scan error: ${error.message}`);
  } finally {
    if (websiteSessionId) {
      await navigationController.closeSession(websiteSessionId);
    }
    monitoringLoops.stopAllLoops();
    learningMemory.saveMemory();
    rl.close();
  }
}

// Handle cleanup
process.on('SIGINT', async () => {
  console.log("\n\n⚠️  Stopping...");
  monitoringLoops.stopAllLoops();
  learningMemory.saveMemory();
  await navigationController.closeAllSessions();
  rl.close();
  process.exit(0);
});

main();

