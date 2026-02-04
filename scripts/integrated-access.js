import navigationController from "../core/navigation-controller.js";
import localExecutor from "../core/local-executor.js";
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
console.log("🚀 Integrated Access System");
console.log("=".repeat(60));
console.log("\nThis system provides:");
console.log("  ✓ Browser access to your website");
console.log("  ✓ Local computer command execution");
console.log("  ✓ File system access");
console.log("  ✓ Code auditing");
console.log("  ✓ All operations logged and secured\n");

let websiteSessionId = null;

async function main() {
  try {
    // Step 1: Open browser for website access
    console.log("=".repeat(60));
    console.log("Step 1: Opening Browser for Website Access");
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
      console.log("   2. Navigate to your code/admin area");
      console.log("   3. Return here when ready\n");

      await question("Press Enter when you've logged in and are on the code area...");

      const currentUrl = await navigationController.getCurrentUrl(websiteSessionId);
      console.log(`\n✓ Current URL: ${currentUrl}\n`);
    }

    // Main menu loop
    while (true) {
      console.log("\n" + "=".repeat(60));
      console.log("Main Menu");
      console.log("=".repeat(60));
      console.log("\nWebsite Access:");
      console.log("  1. Navigate to URL");
      console.log("  2. Read code from website");
      console.log("  3. Get current page content");
      console.log("  4. Screenshot");
      console.log("\nLocal Computer:");
      console.log("  5. Execute command");
      console.log("  6. Read local file");
      console.log("  7. Write local file (requires approval)");
      console.log("  8. List local directory");
      console.log("\nAudit & Analysis:");
      console.log("  9. Audit website code");
      console.log("  10. Audit local code");
      console.log("  11. View execution history");
      console.log("\nSystem:");
      console.log("  12. Authorize operations");
      console.log("  13. Close website session");
      console.log("  14. Exit");
      console.log("=".repeat(60) + "\n");

      const choice = await question("Choice (1-14): ");

      try {
        switch (choice) {
          case '1': {
            if (!websiteSessionId) {
              console.log("\n⚠️  No website session. Open browser first.\n");
              break;
            }
            const url = await question("Enter URL to navigate to: ");
            await navigationController.navigateTo(websiteSessionId, url);
            console.log(`\n✓ Navigated to: ${url}\n`);
            break;
          }

          case '2': {
            if (!websiteSessionId) {
              console.log("\n⚠️  No website session. Open browser first.\n");
              break;
            }
            const filePath = await question("Enter file path to read: ");
            const content = await navigationController.readCode(websiteSessionId, filePath);
            console.log("\n✓ File read successfully!\n");
            console.log("Content:");
            console.log("-".repeat(60));
            console.log(content.substring(0, 2000));
            if (content.length > 2000) {
              console.log(`\n... (${content.length - 2000} more characters)`);
            }
            console.log("-".repeat(60) + "\n");
            break;
          }

          case '3': {
            if (!websiteSessionId) {
              console.log("\n⚠️  No website session. Open browser first.\n");
              break;
            }
            const content = await navigationController.getCurrentContent(websiteSessionId);
            console.log("\n✓ Page content retrieved!\n");
            console.log("Content preview:");
            console.log("-".repeat(60));
            console.log(content.substring(0, 2000));
            if (content.length > 2000) {
              console.log(`\n... (${content.length - 2000} more characters)`);
            }
            console.log("-".repeat(60) + "\n");
            break;
          }

          case '4': {
            if (!websiteSessionId) {
              console.log("\n⚠️  No website session. Open browser first.\n");
              break;
            }
            const screenshot = await navigationController.screenshot(websiteSessionId);
            console.log("\n✓ Screenshot captured!\n");
            break;
          }

          case '5': {
            const command = await question("Enter command to execute: ");
            console.log(`\n🔧 Executing: ${command}\n`);
            const result = await localExecutor.executeCommand(command, {
              timeout: 30000,
              requireApproval: true
            });
            console.log("✅ Command executed!");
            console.log(`   Exit Code: ${result.exitCode}`);
            if (result.stdout) {
              console.log("\nOutput:");
              console.log(result.stdout);
            }
            if (result.stderr) {
              console.log("\nErrors:");
              console.log(result.stderr);
            }
            console.log();
            break;
          }

          case '6': {
            const filePath = await question("Enter file path to read: ");
            const content = await localExecutor.readFile(filePath);
            console.log("\n✓ File read successfully!\n");
            console.log("Content:");
            console.log("-".repeat(60));
            console.log(content.substring(0, 2000));
            if (content.length > 2000) {
              console.log(`\n... (${content.length - 2000} more characters)`);
            }
            console.log("-".repeat(60) + "\n");
            break;
          }

          case '7': {
            const filePath = await question("Enter file path to write: ");
            const reason = await question("Reason for change: ");
            console.log("\nEnter file content (end with 'END' on a new line):\n");
            let content = '';
            let line;
            while ((line = await question('')) !== 'END') {
              content += line + '\n';
            }
            const result = await localExecutor.writeFile(filePath, content.trim(), reason);
            if (result.status === 'pending_approval') {
              console.log(`\n✅ Change tested in sandbox. Approval required.`);
              console.log(`   Approval ID: ${result.approvalId}`);
              console.log(`   Review with: npm run approve-change\n`);
            } else {
              console.log(`\n✅ File written successfully!\n`);
            }
            break;
          }

          case '8': {
            const dirPath = await question("Enter directory path (or Enter for current): ") || process.cwd();
            const items = await localExecutor.listDirectory(dirPath);
            console.log(`\n✓ Found ${items.length} items:\n`);
            items.forEach(item => {
              const icon = item.type === 'directory' ? '📁' : '📄';
              console.log(`  ${icon} ${item.name}`);
            });
            console.log();
            break;
          }

          case '9': {
            if (!websiteSessionId) {
              console.log("\n⚠️  No website session. Open browser first.\n");
              break;
            }
            codeAuditor.setSession(websiteSessionId);
            const filePath = await question("Enter file path to audit: ");
            const result = await codeAuditor.auditFile(filePath);
            console.log("\n✓ Audit complete!");
            console.log(`   Issues found: ${result.analysis.issues.length}`);
            if (result.analysis.issues.length > 0) {
              result.analysis.issues.forEach(issue => {
                console.log(`   [${issue.severity}] ${issue.description}`);
              });
            }
            console.log();
            break;
          }

          case '10': {
            const filePath = await question("Enter local file path to audit: ");
            const content = await localExecutor.readFile(filePath);
            const analysis = codeAuditor.analyzeCode(content, filePath);
            console.log("\n✓ Audit complete!");
            console.log(`   Language: ${analysis.language}`);
            console.log(`   Issues found: ${analysis.issues.length}`);
            if (analysis.issues.length > 0) {
              analysis.issues.forEach(issue => {
                console.log(`   [${issue.severity}] ${issue.description}`);
              });
            }
            console.log();
            break;
          }

          case '11': {
            const history = localExecutor.getExecutionHistory();
            console.log(`\n📜 Execution History (${history.length} commands):\n`);
            if (history.length === 0) {
              console.log("No commands executed yet.\n");
            } else {
              history.slice(-10).forEach((cmd, index) => {
                const status = cmd.success ? '✅' : '❌';
                console.log(`${index + 1}. ${status} ${cmd.command}`);
                console.log(`   Exit: ${cmd.exitCode} | ${cmd.duration}ms`);
              });
              console.log();
            }
            break;
          }

          case '12': {
            const token = await question("Enter authorization token: ");
            if (token && token.length > 0) {
              const readOnlyMode = (await import('../core/readonly-mode.js')).default;
              readOnlyMode.authorize(token);
              console.log("\n✅ Authorization granted\n");
            }
            break;
          }

          case '13': {
            if (websiteSessionId) {
              await navigationController.closeSession(websiteSessionId);
              console.log("\n✅ Website session closed\n");
              websiteSessionId = null;
            } else {
              console.log("\n⚠️  No active website session\n");
            }
            break;
          }

          case '14':
            console.log("\n👋 Goodbye!\n");
            if (websiteSessionId) {
              await navigationController.closeSession(websiteSessionId);
            }
            await navigationController.closeAllSessions();
            rl.close();
            process.exit(0);
            break;

          default:
            console.log("\n⚠️  Invalid choice\n");
        }
      } catch (error) {
        if (error.message.includes('not authorized')) {
          console.log(`\n⚠️  Operation requires authorization: ${error.message}`);
          console.log("   Use option 12 to authorize.\n");
        } else {
          console.error(`\n✗ Error: ${error.message}\n`);
        }
      }
    }

  } catch (error) {
    console.error(`\n✗ Fatal error: ${error.message}\n`);
    if (websiteSessionId) {
      await navigationController.closeSession(websiteSessionId);
    }
    process.exit(1);
  }
}

// Handle cleanup
process.on('SIGINT', async () => {
  console.log("\n\n⚠️  Cleaning up...");
  if (websiteSessionId) {
    await navigationController.closeSession(websiteSessionId);
  }
  await navigationController.closeAllSessions();
  rl.close();
  process.exit(0);
});

main();

