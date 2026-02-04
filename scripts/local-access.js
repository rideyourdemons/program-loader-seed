import localExecutor from "../core/local-executor.js";
import readOnlyMode from "../core/readonly-mode.js";
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
console.log("💻 Local Computer Access");
console.log("=".repeat(60));
console.log("\nThis system can:");
console.log("  ✓ Execute commands on your computer");
console.log("  ✓ Read/write local files");
console.log("  ✓ Access your file system");
console.log("  ✓ All operations logged and secured\n");

async function main() {
  while (true) {
    console.log("\n" + "-".repeat(60));
    console.log("Available Commands:");
    console.log("  1. Execute Command");
    console.log("  2. Read File");
    console.log("  3. Write File (requires approval)");
    console.log("  4. List Directory");
    console.log("  5. View Execution History");
    console.log("  6. Authorize Command (for dangerous operations)");
    console.log("  7. Exit");
    console.log("-".repeat(60) + "\n");

    const choice = await question("Choice (1-7): ");

    try {
      switch (choice) {
        case '1': {
          const command = await question("Enter command to execute: ");
          console.log(`\n🔧 Executing: ${command}\n`);
          
          try {
            const result = await localExecutor.executeCommand(command, {
              timeout: 30000,
              requireApproval: true
            });
            
            console.log("✅ Command executed successfully!");
            console.log(`   Exit Code: ${result.exitCode}`);
            console.log(`   Duration: ${result.duration}ms\n`);
            
            if (result.stdout) {
              console.log("📤 Output:");
              console.log(result.stdout);
            }
            
            if (result.stderr) {
              console.log("⚠️  Errors:");
              console.log(result.stderr);
            }
          } catch (error) {
            if (error.message.includes('not authorized')) {
              console.log(`\n⚠️  Command requires authorization: ${error.message}`);
              console.log("   Use option 6 to authorize, or the command may be too dangerous.\n");
            } else {
              console.error(`\n✗ Error: ${error.message}\n`);
            }
          }
          break;
        }

        case '2': {
          const filePath = await question("Enter file path to read: ");
          console.log(`\n📖 Reading: ${filePath}\n`);
          
          try {
            const content = await localExecutor.readFile(filePath);
            console.log("✅ File read successfully!\n");
            console.log("Content:");
            console.log("-".repeat(60));
            console.log(content.substring(0, 2000));
            if (content.length > 2000) {
              console.log(`\n... (${content.length - 2000} more characters)`);
            }
            console.log("-".repeat(60) + "\n");
          } catch (error) {
            console.error(`\n✗ Error: ${error.message}\n`);
          }
          break;
        }

        case '3': {
          const filePath = await question("Enter file path to write: ");
          const reason = await question("Reason for change: ");
          console.log("\nEnter file content (end with 'END' on a new line):\n");
          
          let content = '';
          let line;
          while ((line = await question('')) !== 'END') {
            content += line + '\n';
          }

          try {
            const result = await localExecutor.writeFile(filePath, content.trim(), reason);
            
            if (result.status === 'pending_approval') {
              console.log(`\n✅ Change tested in sandbox. Approval required.`);
              console.log(`   Approval ID: ${result.approvalId}`);
              console.log(`   Review with: npm run approve-change\n`);
            } else {
              console.log(`\n✅ File written successfully!\n`);
            }
          } catch (error) {
            if (error.message.includes('not authorized')) {
              console.log(`\n⚠️  File write requires authorization: ${error.message}`);
              console.log("   Use option 6 to authorize.\n");
            } else {
              console.error(`\n✗ Error: ${error.message}\n`);
            }
          }
          break;
        }

        case '4': {
          const dirPath = await question("Enter directory path (or press Enter for current): ") || process.cwd();
          console.log(`\n📁 Listing: ${dirPath}\n`);
          
          try {
            const items = await localExecutor.listDirectory(dirPath);
            console.log(`Found ${items.length} items:\n`);
            items.forEach(item => {
              const icon = item.type === 'directory' ? '📁' : '📄';
              console.log(`  ${icon} ${item.name} (${item.type})`);
            });
            console.log();
          } catch (error) {
            console.error(`\n✗ Error: ${error.message}\n`);
          }
          break;
        }

        case '5': {
          const history = localExecutor.getExecutionHistory();
          console.log(`\n📜 Execution History (${history.length} commands):\n`);
          
          if (history.length === 0) {
            console.log("No commands executed yet.\n");
          } else {
            history.slice(-10).forEach((cmd, index) => {
              const status = cmd.success ? '✅' : '❌';
              console.log(`${index + 1}. ${status} ${cmd.command}`);
              console.log(`   Exit: ${cmd.exitCode} | Duration: ${cmd.duration}ms | ${cmd.timestamp}`);
            });
            console.log();
          }
          break;
        }

        case '6': {
          const token = await question("Enter authorization token: ");
          if (token && token.length > 0) {
            readOnlyMode.authorize(token);
            console.log("\n✅ Authorization granted for this session\n");
          } else {
            console.log("\n⚠️  Invalid token\n");
          }
          break;
        }

        case '7':
          console.log("\n👋 Goodbye!\n");
          rl.close();
          process.exit(0);
          break;

        default:
          console.log("\n⚠️  Invalid choice\n");
      }
    } catch (error) {
      console.error(`\n✗ Error: ${error.message}\n`);
    }
  }
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log("\n\n👋 Goodbye!\n");
  rl.close();
  process.exit(0);
});

main();

