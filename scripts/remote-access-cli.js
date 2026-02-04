import readline from "readline";
import navigationController from "../core/navigation-controller.js";
import credentialManager from "../core/credential-manager.js";
import { logger } from "../core/logger.js";

/**
 * Interactive CLI for remote access
 * Allows you to provide credentials and navigate systems
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function hideInput(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let input = '';
    process.stdin.on('data', function(char) {
      char = char.toString();
      switch(char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write('\n');
          resolve(input);
          break;
        case '\u0003':
          process.exit();
          break;
        case '\u007f': // backspace
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          input += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

async function initWebsiteSession() {
  console.log("\n=== Initialize Website Session ===\n");
  
  const url = await question("Website URL: ");
  const username = await question("Username: ");
  const password = await hideInput("Password: ");
  const headless = (await question("Headless mode? (y/n, default: y): ")) !== 'n';

  try {
    const sessionId = await navigationController.initWebsiteSession({
      url,
      username,
      password
    }, { headless });

    console.log(`\n✓ Website session created: ${sessionId}`);
    console.log(`Navigate to login page and provide selectors if needed.`);
    
    const needsLogin = (await question("\nDo you need to login? (y/n): ")) === 'y';
    if (needsLogin) {
      const useFirebase = (await question("Use Firebase authentication? (y/n, default: auto-detect): "));
      let loginOptions = {};
      
      if (useFirebase === 'y') {
        loginOptions.useFirebase = true;
      } else if (useFirebase === 'n') {
        loginOptions.useFirebase = false;
        const usernameSelector = await question("Username field selector (or press Enter for default): ") || undefined;
        const passwordSelector = await question("Password field selector (or press Enter for default): ") || undefined;
        const submitSelector = await question("Submit button selector (or press Enter for default): ") || undefined;
        loginOptions.usernameSelector = usernameSelector;
        loginOptions.passwordSelector = passwordSelector;
        loginOptions.submitSelector = submitSelector;
      }
      // If 'auto-detect' (Enter), loginOptions remains empty and system will auto-detect

      console.log("\nLogging in...");
      await navigationController.loginToWebsite(sessionId, loginOptions);
      console.log("✓ Logged in successfully");
    }

    return sessionId;
  } catch (error) {
    console.error(`✗ Failed to initialize session: ${error.message}`);
    throw error;
  }
}

async function initAPISession() {
  console.log("\n=== Initialize API/Backend Session ===\n");
  
  const endpoint = await question("API Endpoint/Base URL: ");
  const authType = await question("Authentication type (token/apiKey/basic, default: basic): ") || 'basic';
  
  let credentials = { endpoint };

  if (authType === 'token') {
    credentials.token = await hideInput("Token: ");
  } else if (authType === 'apiKey') {
    credentials.apiKey = await hideInput("API Key: ");
  } else {
    credentials.username = await question("Username: ");
    credentials.password = await hideInput("Password: ");
  }

  try {
    const sessionId = await navigationController.initAPISession(credentials);
    console.log(`\n✓ API session created: ${sessionId}`);
    return sessionId;
  } catch (error) {
    console.error(`✗ Failed to initialize session: ${error.message}`);
    throw error;
  }
}

async function initSSHSession() {
  console.log("\n=== Initialize SSH Session ===\n");
  
  const host = await question("Host: ");
  const port = await question("Port (default: 22): ") || '22';
  const username = await question("Username: ");
  const password = await hideInput("Password: ");

  try {
    const sessionId = await navigationController.initSSHSession({
      host,
      port: parseInt(port),
      username,
      password
    });
    console.log(`\n✓ SSH session created: ${sessionId}`);
    return sessionId;
  } catch (error) {
    console.error(`✗ Failed to initialize session: ${error.message}`);
    throw error;
  }
}

async function readCode(sessionId) {
  const filePath = await question("File path to read: ");
  try {
    const content = await navigationController.readCode(sessionId, filePath);
    console.log("\n=== File Content ===\n");
    console.log(content);
    return content;
  } catch (error) {
    console.error(`✗ Failed to read file: ${error.message}`);
  }
}

async function writeCode(sessionId) {
  const filePath = await question("File path to write: ");
  console.log("Enter file content (end with 'END' on a new line):");
  
  let content = '';
  let line;
  while ((line = await question('')) !== 'END') {
    content += line + '\n';
  }

  try {
    await navigationController.writeCode(sessionId, filePath, content.trim());
    console.log(`✓ File written: ${filePath}`);
  } catch (error) {
    console.error(`✗ Failed to write file: ${error.message}`);
  }
}

async function navigate(sessionId) {
  const url = await question("URL/Route to navigate to: ");
  try {
    await navigationController.navigateTo(sessionId, url);
    console.log(`✓ Navigated to: ${url}`);
  } catch (error) {
    console.error(`✗ Navigation failed: ${error.message}`);
  }
}

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("Remote Access CLI");
  console.log("=".repeat(60));
  console.log("\nThis tool allows you to securely access websites and backends.");
  console.log("Credentials are stored in memory only and never saved to disk.\n");

  let currentSessionId = null;

  while (true) {
    console.log("\n" + "-".repeat(60));
    console.log("Available Commands:");
    console.log("  1. Init Website Session");
    console.log("  2. Init API Session");
    console.log("  3. Init SSH Session");
    console.log("  4. List Sessions");
    console.log("  5. Select Session");
    console.log("  6. Read Code/File");
    console.log("  7. Write Code/File");
    console.log("  8. Navigate");
    console.log("  9. Get Current Content");
    console.log(" 10. Screenshot (web only)");
    console.log(" 11. Close Session");
    console.log(" 12. Close All Sessions & Exit");
    console.log("-".repeat(60));

    const command = await question("\nCommand (1-12): ");

    try {
      switch (command) {
        case '1':
          currentSessionId = await initWebsiteSession();
          break;
        case '2':
          currentSessionId = await initAPISession();
          break;
        case '3':
          currentSessionId = await initSSHSession();
          break;
        case '4':
          const sessions = navigationController.listSessions();
          if (sessions.length === 0) {
            console.log("No active sessions");
          } else {
            console.log("\nActive Sessions:");
            sessions.forEach(s => {
              console.log(`  ${s.sessionId}: ${s.type} - ${s.url || s.endpoint || s.host || 'N/A'}`);
            });
          }
          break;
        case '5':
          const sessionId = await question("Session ID: ");
          if (navigationController.getSessionInfo(sessionId)) {
            currentSessionId = sessionId;
            console.log(`✓ Session selected: ${sessionId}`);
          } else {
            console.log("✗ Session not found");
          }
          break;
        case '6':
          if (!currentSessionId) {
            console.log("✗ No session selected. Use command 5 to select a session.");
            break;
          }
          await readCode(currentSessionId);
          break;
        case '7':
          if (!currentSessionId) {
            console.log("✗ No session selected. Use command 5 to select a session.");
            break;
          }
          await writeCode(currentSessionId);
          break;
        case '8':
          if (!currentSessionId) {
            console.log("✗ No session selected. Use command 5 to select a session.");
            break;
          }
          await navigate(currentSessionId);
          break;
        case '9':
          if (!currentSessionId) {
            console.log("✗ No session selected. Use command 5 to select a session.");
            break;
          }
          const content = await navigationController.getCurrentContent(currentSessionId);
          console.log("\n=== Current Content ===\n");
          console.log(content.substring(0, 2000) + (content.length > 2000 ? '...' : ''));
          break;
        case '10':
          if (!currentSessionId) {
            console.log("✗ No session selected. Use command 5 to select a session.");
            break;
          }
          const path = await question("Screenshot path (or press Enter for base64): ") || null;
          const screenshot = await navigationController.screenshot(currentSessionId, path);
          if (!path) {
            console.log("\nScreenshot (base64): " + screenshot.substring(0, 100) + "...");
          } else {
            console.log(`✓ Screenshot saved: ${path}`);
          }
          break;
        case '11':
          if (!currentSessionId) {
            console.log("✗ No session selected.");
            break;
          }
          await navigationController.closeSession(currentSessionId);
          console.log(`✓ Session closed: ${currentSessionId}`);
          currentSessionId = null;
          break;
        case '12':
          await navigationController.closeAllSessions();
          console.log("✓ All sessions closed. Goodbye!");
          rl.close();
          process.exit(0);
          break;
        default:
          console.log("Invalid command");
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
  console.log("\n\nCleaning up...");
  await navigationController.closeAllSessions();
  rl.close();
  process.exit(0);
});

main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});

