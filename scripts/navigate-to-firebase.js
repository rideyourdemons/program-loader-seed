import navigationController from "../core/navigation-controller.js";
import firebaseBackend from "../core/firebase-backend.js";
import monitoringLoops from "../core/monitoring-loops.js";
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

console.log("\n" + "=".repeat(60));
console.log("🔥 Firebase Navigation & Website Scanning");
console.log("=".repeat(60) + "\n");

async function main() {
  let websiteSessionId = null;
  let firebaseSessionId = null;

  try {
    // Step 1: Navigate to Firebase Console
    console.log("=".repeat(60));
    console.log("Step 1: Opening Firebase Console");
    console.log("=".repeat(60) + "\n");

    console.log("🌐 Opening browser to Firebase Console...");
    const firebaseUrl = "https://console.firebase.google.com/u/0/?fb_gclid=CjwKCAiAu67KBhAkEiwAY0jAlSXViQo0WBURe33hN7VkWyZP2gvC29clNwxHJ04f8xXxTD0w5KUkuBoC8wQQAvD_BwE&_gl=1*13k5r90*_up*MQ..*_ga*OTI5MTQzMDYwLjE3NDk3NDIyNzQ.*_ga_CW55HF8NVT*czE3NjY2MTQ0ODAkbzE0OCRnMSR0MTc2NjYxNDQ4MSRqNTkkbDAkaDA.&gclid=CjwKCAiAu67KBhAkEiwAY0jAlSXViQo0WBURe33hN7VkWyZP2gvC29clNwxHJ04f8xXxTD0w5KUkuBoC8wQQAvD_BwE&gclsrc=aw.ds&gbraid=0AAAAADpUDOhX5_Ek9QUWQ6l2uAdHLZrN_";
    console.log("   URL: Firebase Console\n");

    websiteSessionId = await navigationController.initWebsiteSession({
      url: firebaseUrl,
      username: "",
      password: ""
    }, { headless: false });

    console.log(`✅ Browser opened! Session ID: ${websiteSessionId}\n`);
    console.log("📋 Please:");
    console.log("   1. Log in to Firebase Console with your credentials");
    console.log("   2. Select your project (rideyourdemons.com)");
    console.log("   3. Navigate to where you can access:");
    console.log("      - Service Account (for backend access)");
    console.log("      - Authentication settings");
    console.log("      - Firestore/Database");
    console.log("   4. Return here when ready\n");

    await question("Press Enter when you've logged in and selected your project...");

    const currentUrl = await navigationController.getCurrentUrl(websiteSessionId);
    console.log(`\n✓ Current URL: ${currentUrl}\n`);

    // Step 2: Get Firebase credentials
    console.log("=".repeat(60));
    console.log("Step 2: Firebase Backend Access Setup");
    console.log("=".repeat(60) + "\n");

    console.log("To access Firebase backend, you need:");
    console.log("  1. Service Account JSON file (recommended)");
    console.log("  2. Or Firebase project configuration\n");

    const setupFirebase = (await question("Set up Firebase backend access? (y/n): ")) === 'y';

    if (setupFirebase) {
      const serviceAccountPath = await question("Path to Firebase service account JSON file (or press Enter to skip): ");
      
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

    // Step 3: Navigate to website
    console.log("=".repeat(60));
    console.log("Step 3: Navigate to Website");
    console.log("=".repeat(60) + "\n");

    console.log("🌐 Navigating to rideyourdemons.com...\n");
    await navigationController.navigateTo(websiteSessionId, "https://rideyourdemons.com");

    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for page load

    const websiteUrl = await navigationController.getCurrentUrl(websiteSessionId);
    console.log(`✓ Navigated to: ${websiteUrl}\n`);

    console.log("📋 Please:");
    console.log("   1. Log in to the website with your Firebase credentials");
    console.log("   2. Navigate to your admin/code area");
    console.log("   3. Return here when ready\n");

    await question("Press Enter when you've logged in and are ready to scan...");

    const finalUrl = await navigationController.getCurrentUrl(websiteSessionId);
    console.log(`\n✓ Current URL: ${finalUrl}\n`);

    // Step 4: Start scanning
    console.log("=".repeat(60));
    console.log("Step 4: Scanning Website & Checking Code");
    console.log("=".repeat(60) + "\n");

    console.log("🔍 Starting comprehensive scan...\n");

    // Set up code auditor
    codeAuditor.setSession(websiteSessionId);

    // Get page content
    console.log("  1. Reading page content...");
    const content = await navigationController.getCurrentContent(websiteSessionId);
    console.log(`     ✓ Content retrieved (${content.length} characters)\n`);

    // Analyze code
    console.log("  2. Analyzing code...");
    const analysis = codeAuditor.analyzeCode(content, finalUrl);
    console.log(`     ✓ Analysis complete\n`);

    // Check for issues
    console.log("  3. Checking for issues...");
    if (analysis.issues.length > 0) {
      console.log(`     ⚠️  Found ${analysis.issues.length} issues:\n`);
      analysis.issues.forEach((issue, index) => {
        console.log(`     ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
        if (issue.location) {
          console.log(`        Location: ${issue.location}`);
        }
      });
    } else {
      console.log("     ✓ No issues found\n");
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

    // Start monitoring
    console.log("=".repeat(60));
    console.log("Step 5: Starting Continuous Monitoring");
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
      console.log("  ✓ Monitor Firebase backend");
      console.log("  ✓ Monitor website");
      console.log("  ✓ Detect issues");
      console.log("  ✓ Log everything\n");

      console.log("Press Ctrl+C to stop monitoring...\n");

      // Keep running
      await new Promise(() => {}); // Run indefinitely
    } else {
      console.log("\n✅ Scan complete! Monitoring not started.\n");
    }

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}\n`);
    logger.error(`Navigation error: ${error.message}`);
  } finally {
    if (websiteSessionId) {
      await navigationController.closeSession(websiteSessionId);
    }
    monitoringLoops.stopAllLoops();
    rl.close();
  }
}

// Handle cleanup
process.on('SIGINT', async () => {
  console.log("\n\n⚠️  Stopping...");
  monitoringLoops.stopAllLoops();
  await navigationController.closeAllSessions();
  rl.close();
  process.exit(0);
});

main();

