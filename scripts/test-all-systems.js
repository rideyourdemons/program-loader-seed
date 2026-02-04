import navigationController from "../core/navigation-controller.js";
import codeAuditor from "../core/code-auditor.js";
import auditSystem from "../core/audit-system.js";
import sandboxTester from "../core/sandbox-tester.js";
import approvalSystem from "../core/approval-system.js";
import readOnlyMode from "../core/readonly-mode.js";
import { logger } from "../core/logger.js";

console.log("\n" + "=".repeat(60));
console.log("🧪 Testing All Systems");
console.log("=".repeat(60) + "\n");

let allTestsPassed = true;

// Test 1: Read-only mode
console.log("1. Testing Read-Only Mode...");
try {
  const authorized = readOnlyMode.isAuthorized('test', 'test');
  if (!authorized) {
    console.log("   ✓ Read-only mode active (writes blocked)");
  } else {
    console.log("   ✗ Read-only mode not working");
    allTestsPassed = false;
  }
} catch (error) {
  console.log(`   ✗ Error: ${error.message}`);
  allTestsPassed = false;
}

// Test 2: Audit system
console.log("\n2. Testing Audit System...");
try {
  auditSystem.log('TEST', { message: 'Test log entry' });
  const report = auditSystem.generateReport();
  if (report.sessionId) {
    console.log("   ✓ Audit system working");
  } else {
    console.log("   ✗ Audit system not working");
    allTestsPassed = false;
  }
} catch (error) {
  console.log(`   ✗ Error: ${error.message}`);
  allTestsPassed = false;
}

// Test 3: Sandbox tester
console.log("\n3. Testing Sandbox Tester...");
try {
  const testResult = await sandboxTester.testChange(
    'test.js',
    'console.log("test");',
    'javascript'
  );
  if (testResult.overallStatus) {
    console.log("   ✓ Sandbox tester working");
    console.log(`   ✓ Test result: ${testResult.overallStatus}`);
  } else {
    console.log("   ✗ Sandbox tester not working");
    allTestsPassed = false;
  }
} catch (error) {
  console.log(`   ✗ Error: ${error.message}`);
  allTestsPassed = false;
}

// Test 4: Approval system
console.log("\n4. Testing Approval System...");
try {
  const approval = await approvalSystem.requestApproval(
    'test.js',
    'old code',
    'new code',
    'Test approval',
    { overallStatus: 'pass', syntaxTest: { syntaxValid: true, errors: [], warnings: [] }, issues: [] }
  );
  if (approval.id) {
    console.log("   ✓ Approval system working");
    console.log(`   ✓ Approval ID: ${approval.id}`);
  } else {
    console.log("   ✗ Approval system not working");
    allTestsPassed = false;
  }
} catch (error) {
  console.log(`   ✗ Error: ${error.message}`);
  allTestsPassed = false;
}

// Test 5: Website connectivity
console.log("\n5. Testing Website Connectivity...");
try {
  const axios = (await import('axios')).default;
  const response = await axios.get('https://rideyourdemons.com', {
    timeout: 5000,
    validateStatus: () => true
  });
  if (response.status === 200) {
    console.log("   ✓ Website accessible");
    console.log(`   ✓ Status: ${response.status}`);
  } else {
    console.log(`   ⚠ Website returned status: ${response.status}`);
  }
} catch (error) {
  console.log(`   ✗ Error: ${error.message}`);
  allTestsPassed = false;
}

// Test 6: Code auditor
console.log("\n6. Testing Code Auditor...");
try {
  const analysis = codeAuditor.analyzeCode('console.log("test");', 'test.js');
  if (analysis.language && analysis.issues) {
    console.log("   ✓ Code auditor working");
    console.log(`   ✓ Language detected: ${analysis.language}`);
  } else {
    console.log("   ✗ Code auditor not working");
    allTestsPassed = false;
  }
} catch (error) {
  console.log(`   ✗ Error: ${error.message}`);
  allTestsPassed = false;
}

// Summary
console.log("\n" + "=".repeat(60));
if (allTestsPassed) {
  console.log("✅ All Systems Operational!");
  console.log("\nReady to run audit. Use: npm run guided-audit");
} else {
  console.log("⚠️  Some tests failed. Please review above.");
}
console.log("=".repeat(60) + "\n");

process.exit(allTestsPassed ? 0 : 1);

