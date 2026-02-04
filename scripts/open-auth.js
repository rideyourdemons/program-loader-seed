import navigationController from "../core/navigation-controller.js";
import { logger } from "../core/logger.js";

console.log("\n" + "=".repeat(60));
console.log("🌐 Opening Browser for Authentication");
console.log("=".repeat(60) + "\n");

async function main() {
  try {
    console.log("🚀 Launching browser...");
    console.log("   URL: https://rideyourdemons.com\n");

    // Initialize website session with visible browser
    const sessionId = await navigationController.initWebsiteSession({
      url: "https://rideyourdemons.com",
      username: "", // Will be provided in browser
      password: ""  // Will be provided in browser
    }, { 
      headless: false, // Visible browser
      timeout: 60000
    });

    console.log(`✅ Browser opened! Session ID: ${sessionId}\n`);

    // Get current URL
    const currentUrl = await navigationController.getCurrentUrl(sessionId);
    console.log(`📍 Current URL: ${currentUrl}\n`);

    // Wait a moment for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Try to detect Firebase and navigate to login if needed
    console.log("🔍 Checking for authentication page...\n");

    try {
      // Check if we're on a login page or need to navigate
      const pageContent = await navigationController.getCurrentContent(sessionId);
      
      // Look for login indicators
      const hasLoginForm = pageContent.includes('login') || 
                          pageContent.includes('sign in') ||
                          pageContent.includes('authentication') ||
                          pageContent.includes('firebase');

      if (hasLoginForm) {
        console.log("✅ Login form detected on current page\n");
      } else {
        console.log("ℹ️  No login form detected on current page");
        console.log("   You may need to navigate to the login page manually\n");
      }

      // Try common login routes
      const loginRoutes = ['/login', '/signin', '/auth', '/sign-in', '/admin/login'];
      console.log("🔍 Trying to find login page...\n");

      for (const route of loginRoutes) {
        try {
          console.log(`   Trying: ${route}...`);
          await navigationController.navigateTo(sessionId, `https://rideyourdemons.com${route}`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const newContent = await navigationController.getCurrentContent(sessionId);
          if (newContent.includes('login') || newContent.includes('sign in') || 
              newContent.includes('email') || newContent.includes('password')) {
            console.log(`   ✅ Found login page at: ${route}\n`);
            break;
          }
        } catch (error) {
          // Route doesn't exist, try next
          continue;
        }
      }

    } catch (error) {
      console.log(`   ⚠️  Could not auto-detect login page: ${error.message}\n`);
    }

    const finalUrl = await navigationController.getCurrentUrl(sessionId);
    console.log("=".repeat(60));
    console.log("✅ Browser Ready!");
    console.log("=".repeat(60));
    console.log(`\n📍 Current URL: ${finalUrl}`);
    console.log(`🔑 Session ID: ${sessionId}\n`);
    console.log("📋 Next Steps:");
    console.log("   1. Log in with your Firebase credentials in the browser");
    console.log("   2. Navigate to your code/admin area");
    console.log("   3. The browser will stay open for you to use\n");
    console.log("💡 The browser window is now open and ready for you to log in!\n");

    // Keep the process running so browser stays open
    console.log("⏳ Browser will stay open. Press Ctrl+C when done.\n");

    // Export session ID for use
    global.currentSessionId = sessionId;
    console.log(`💾 Session ID saved: ${sessionId}`);
    console.log("   You can use this session ID for audit operations\n");

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}\n`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle cleanup
process.on('SIGINT', async () => {
  console.log("\n\n⚠️  Closing browser...");
  if (global.currentSessionId) {
    await navigationController.closeSession(global.currentSessionId);
  }
  await navigationController.closeAllSessions();
  console.log("✅ Browser closed. Goodbye!\n");
  process.exit(0);
});

main();

