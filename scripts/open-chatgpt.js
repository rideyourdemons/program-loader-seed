import puppeteer from "puppeteer";
import { logger } from "../core/logger.js";

console.log("\n" + "=".repeat(60));
console.log("🤖 Opening ChatGPT in Google Chrome");
console.log("=".repeat(60) + "\n");

const chatGPTUrl = "https://chat.openai.com";

async function main() {
  let browser;
  try {
    console.log("🌐 Launching Google Chrome...\n");
    
    browser = await puppeteer.launch({
      headless: false, // Show the browser window
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--start-maximized',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    const page = await browser.newPage();
    
    console.log(`✅ Chrome opened! Navigating to ChatGPT...\n`);
    
    await page.goto(chatGPTUrl, { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });

    console.log(`✅ Successfully navigated to ChatGPT!\n`);
    console.log("📋 The browser window is now open and ready to use.\n");
    console.log("Press Ctrl+C when you're done to close the browser.\n");

    // Keep the browser open
    await new Promise((resolve) => {
      process.on('SIGINT', async () => {
        console.log("\n\n⚠️  Closing browser...");
        await browser.close();
        console.log("✅ Browser closed.\n");
        resolve();
      });
    });

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}\n`);
    logger.error(`ChatGPT navigation error: ${error.message}`);
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

main();





