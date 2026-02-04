import navigationController from "../core/navigation-controller.js";
import { logger } from "../core/logger.js";

console.log("\n" + "=".repeat(60));
console.log("🔥 Opening Firebase Console");
console.log("=".repeat(60) + "\n");

const firebaseUrl = "https://console.firebase.google.com/u/0/?fb_gclid=CjwKCAiAu67KBhAkEiwAY0jAlSXViQo0WBURe33hN7VkWyZP2gvC29clNwxHJ04f8xXxTD0w5KUkuBoC8wQQAvD_BwE&_gl=1*13k5r90*_up*MQ..*_ga*OTI5MTQzMDYwLjE3NDk3NDIyNzQ.*_ga_CW55HF8NVT*czE3NjY2MTQ0ODAkbzE0OCRnMSR0MTc2NjYxNDQ4MSRqNTkkbDAkaDA.&gclid=CjwKCAiAu67KBhAkEiwAY0jAlSXViQo0WBURe33hN7VkWyZP2gvC29clNwxHJ04f8xXxTD0w5KUkuBoC8wQQAvD_BwE&gclsrc=aw.ds&gbraid=0AAAAADpUDOhX5_Ek9QUWQ6l2uAdHLZrN_";

async function main() {
  try {
    console.log("🌐 Launching browser to Firebase Console...\n");
    
    const sessionId = await navigationController.initWebsiteSession({
      url: firebaseUrl,
      username: "",
      password: ""
    }, { 
      headless: false,
      timeout: 30000
    });

    console.log(`✅ Browser opened! Session ID: ${sessionId}\n`);
    console.log("📋 Please:");
    console.log("   1. Sign in with your Google Account");
    console.log("   2. Select your Firebase project");
    console.log("   3. Navigate to your project dashboard\n");
    console.log("The browser window should now be open.\n");
    console.log("Once you've logged in, the system will be ready to:");
    console.log("  ✓ Access Firebase backend");
    console.log("  ✓ Scan your website");
    console.log("  ✓ Check code");
    console.log("  ✓ Monitor continuously\n");
    console.log("Press Ctrl+C when you're done, or the system will continue...\n");

    // Keep the browser open
    await new Promise((resolve) => {
      // Keep running until interrupted
      process.on('SIGINT', async () => {
        console.log("\n\n⚠️  Closing browser...");
        await navigationController.closeSession(sessionId);
        resolve();
      });
    });

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}\n`);
    logger.error(`Firebase console error: ${error.message}`);
    process.exit(1);
  }
}

main();

