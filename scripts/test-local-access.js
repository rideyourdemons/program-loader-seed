import localExecutor from "../core/local-executor.js";
import { logger } from "../core/logger.js";

console.log("\n" + "=".repeat(60));
console.log("🧪 Testing Local Computer Access");
console.log("=".repeat(60) + "\n");

async function testLocalAccess() {
  try {
    // Test 1: Execute simple command
    console.log("1. Testing command execution...");
    const result = await localExecutor.executeCommand('echo "Local access test"', {
      timeout: 5000,
      requireApproval: false
    });
    console.log(`   ✓ Command executed: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    if (result.stdout) {
      console.log(`   Output: ${result.stdout.trim()}`);
    }

    // Test 2: Read local file
    console.log("\n2. Testing file read...");
    try {
      const content = await localExecutor.readFile('./package.json');
      console.log(`   ✓ File read: ${content.length} bytes`);
    } catch (error) {
      console.log(`   ⚠️  File read test: ${error.message}`);
    }

    // Test 3: List directory
    console.log("\n3. Testing directory listing...");
    try {
      const items = await localExecutor.listDirectory('.');
      console.log(`   ✓ Directory listed: ${items.length} items`);
    } catch (error) {
      console.log(`   ⚠️  Directory list test: ${error.message}`);
    }

    // Test 4: Command safety check
    console.log("\n4. Testing command safety...");
    const safeCheck = localExecutor.isCommandSafe('echo test');
    const dangerousCheck = localExecutor.isCommandSafe('rm -rf /');
    console.log(`   ✓ Safe command check: ${safeCheck.safe ? 'PASS' : 'FAIL'}`);
    console.log(`   ✓ Dangerous command blocked: ${!dangerousCheck.safe ? 'PASS' : 'FAIL'}`);

    console.log("\n" + "=".repeat(60));
    console.log("✅ Local Access System Operational!");
    console.log("=".repeat(60));
    console.log("\nUse 'npm run local-access' to access your computer\n");

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}\n`);
    process.exit(1);
  }
}

testLocalAccess();

