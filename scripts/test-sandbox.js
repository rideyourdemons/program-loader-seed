import sandboxTester from "../core/sandbox-tester.js";
import approvalSystem from "../core/approval-system.js";
import { logger } from "../core/logger.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("\n" + "=".repeat(70));
console.log("🧪 SANDBOX TESTING SYSTEM - Comprehensive Tests");
console.log("=".repeat(70) + "\n");

const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function recordTest(name, passed, message = '', warning = false) {
  testResults.tests.push({ name, passed, message, warning });
  if (passed) {
    testResults.passed++;
    console.log(`   ✅ ${name}`);
    if (message) console.log(`      ${message}`);
  } else if (warning) {
    testResults.warnings++;
    console.log(`   ⚠️  ${name} (Warning)`);
    if (message) console.log(`      ${message}`);
  } else {
    testResults.failed++;
    console.log(`   ❌ ${name}`);
    if (message) console.log(`      ${message}`);
  }
}

async function test1_SandboxDirectory() {
  console.log("1. Testing Sandbox Directory Creation...");
  try {
    const sandboxPath = path.join(__dirname, "../sandbox");
    if (fs.existsSync(sandboxPath)) {
      recordTest("Sandbox Directory Exists", true, `Path: ${sandboxPath}`);
    } else {
      recordTest("Sandbox Directory Exists", false, "Directory not found");
    }
  } catch (error) {
    recordTest("Sandbox Directory", false, error.message);
  }
}

async function test2_JavaScriptSyntax() {
  console.log("\n2. Testing JavaScript Syntax Validation...");
  
  // Test valid JavaScript
  try {
    const validJS = `
      function test() {
        return "Hello World";
      }
      module.exports = { test };
    `;
    
    const testFile = path.join(__dirname, "../sandbox/test-valid.js");
    fs.writeFileSync(testFile, validJS, 'utf8');
    
    const result = await sandboxTester.testSyntax(testFile, 'javascript');
    
    if (result.syntaxValid) {
      recordTest("JavaScript - Valid Code", true, "Valid JavaScript passed");
    } else {
      recordTest("JavaScript - Valid Code", false, result.errors.join(', '));
    }
  } catch (error) {
    recordTest("JavaScript - Valid Code", false, error.message);
  }

  // Test invalid JavaScript
  try {
    const invalidJS = `
      function test() {
        return "Hello World"
        // Missing semicolon and closing brace
    `;
    
    const testFile = path.join(__dirname, "../sandbox/test-invalid.js");
    fs.writeFileSync(testFile, invalidJS, 'utf8');
    
    const result = await sandboxTester.testSyntax(testFile, 'javascript');
    
    if (!result.syntaxValid) {
      recordTest("JavaScript - Invalid Code Detection", true, "Invalid code correctly detected");
    } else {
      recordTest("JavaScript - Invalid Code Detection", false, "Should have detected syntax error");
    }
  } catch (error) {
    recordTest("JavaScript - Invalid Code Detection", true, "Error detection working", true);
  }
}

async function test3_JSONSyntax() {
  console.log("\n3. Testing JSON Syntax Validation...");
  
  // Test valid JSON
  try {
    const validJSON = JSON.stringify({ test: "value", number: 123, array: [1, 2, 3] });
    const testFile = path.join(__dirname, "../sandbox/test-valid.json");
    fs.writeFileSync(testFile, validJSON, 'utf8');
    
    const result = await sandboxTester.testSyntax(testFile, 'json');
    
    if (result.syntaxValid) {
      recordTest("JSON - Valid Code", true, "Valid JSON passed");
    } else {
      recordTest("JSON - Valid Code", false, result.errors.join(', '));
    }
  } catch (error) {
    recordTest("JSON - Valid Code", false, error.message);
  }

  // Test invalid JSON
  try {
    const invalidJSON = '{ test: "value", number: 123 }'; // Missing quotes on keys
    const testFile = path.join(__dirname, "../sandbox/test-invalid.json");
    fs.writeFileSync(testFile, invalidJSON, 'utf8');
    
    const result = await sandboxTester.testSyntax(testFile, 'json');
    
    if (!result.syntaxValid) {
      recordTest("JSON - Invalid Code Detection", true, "Invalid JSON correctly detected");
    } else {
      recordTest("JSON - Invalid Code Detection", false, "Should have detected syntax error");
    }
  } catch (error) {
    recordTest("JSON - Invalid Code Detection", true, "Error detection working", true);
  }
}

async function test4_CompleteTest() {
  console.log("\n4. Testing Complete Change Test...");
  
  try {
    const originalPath = "test-file.js";
    const newContent = `
      // Updated test file
      function updatedFunction() {
        console.log("Updated code");
        return true;
      }
      module.exports = { updatedFunction };
    `;
    
    const result = await sandboxTester.testChange(originalPath, newContent, 'javascript');
    
    if (result.overallStatus === 'pass') {
      recordTest("Complete Test - Pass", true, 
        `Syntax: ${result.syntaxTest.syntaxValid}, Validations: ${Object.keys(result.validations).length}`);
    } else {
      recordTest("Complete Test - Pass", false, 
        `Status: ${result.overallStatus}, Errors: ${result.syntaxTest.errors.join(', ')}`);
    }
    
    // Check validations
    if (result.validations.hasContent && result.validations.fileSize > 0) {
      recordTest("Complete Test - Validations", true, "All validations passed");
    } else {
      recordTest("Complete Test - Validations", false, "Some validations failed");
    }
  } catch (error) {
    recordTest("Complete Test", false, error.message);
  }
}

async function test5_ContentComparison() {
  console.log("\n5. Testing Content Comparison...");
  
  try {
    const original = `Line 1
Line 2
Line 3`;

    const modified = `Line 1
Line 2 Modified
Line 3
Line 4 Added`;

    const comparison = sandboxTester.compareContent(original, modified);
    
    if (comparison.modified === 1 && comparison.added === 1) {
      recordTest("Content Comparison", true, 
        `Modified: ${comparison.modified}, Added: ${comparison.added}, Removed: ${comparison.removed}`);
    } else {
      recordTest("Content Comparison", false, 
        `Expected 1 modified, 1 added. Got modified: ${comparison.modified}, added: ${comparison.added}`);
    }
  } catch (error) {
    recordTest("Content Comparison", false, error.message);
  }
}

async function test6_ApprovalSystem() {
  console.log("\n6. Testing Approval System Integration...");
  
  try {
    const filePath = "test-approval.js";
    const originalContent = `function old() { return 1; }`;
    const newContent = `function new() { return 2; }`;
    const reason = "Test approval request";
    
    // Create a test result (matching actual sandbox tester structure)
    const testResult = {
      overallStatus: 'pass',
      syntaxTest: { syntaxValid: true, errors: [], warnings: [] },
      validations: { hasContent: true, fileSize: newContent.length },
      issues: [] // Add issues array
    };
    
    const approval = await approvalSystem.requestApproval(
      filePath,
      originalContent,
      newContent,
      reason,
      testResult
    );
    
    if (approval && approval.id && approval.status === 'pending') {
      recordTest("Approval Request Creation", true, `Approval ID: ${approval.id}`);
    } else {
      recordTest("Approval Request Creation", false, "Approval not created correctly");
    }
    
    // Test getting approval
    const retrieved = approvalSystem.getApproval(approval.id);
    if (retrieved && retrieved.id === approval.id) {
      recordTest("Approval Retrieval", true, "Approval retrieved successfully");
    } else {
      recordTest("Approval Retrieval", false, "Could not retrieve approval");
    }
    
    // Test approval report generation
    try {
      const report = approvalSystem.generateApprovalReport(approval);
      if (report && report.includes(filePath)) {
        recordTest("Approval Report Generation", true, "Report generated successfully");
      } else {
        recordTest("Approval Report Generation", false, "Report generation failed");
      }
    } catch (error) {
      recordTest("Approval Report Generation", false, error.message);
    }
    
  } catch (error) {
    recordTest("Approval System", false, error.message);
  }
}

async function test7_TestSummary() {
  console.log("\n7. Testing Test Summary...");
  
  try {
    const summary = sandboxTester.getTestSummary();
    
    if (summary && typeof summary.totalTests === 'number') {
      recordTest("Test Summary", true, 
        `Total: ${summary.totalTests}, Passed: ${summary.passed}, Failed: ${summary.failed}`);
    } else {
      recordTest("Test Summary", false, "Summary not available");
    }
  } catch (error) {
    recordTest("Test Summary", false, error.message);
  }
}

async function test8_FileOperations() {
  console.log("\n8. Testing Sandbox File Operations...");
  
  try {
    const originalPath = "test-sandbox-file.js";
    const content = `console.log("Sandbox test");`;
    
    const sandboxPath = await sandboxTester.createSandboxFile(originalPath, content);
    
    if (fs.existsSync(sandboxPath)) {
      const fileContent = fs.readFileSync(sandboxPath, 'utf8');
      if (fileContent === content) {
        recordTest("Sandbox File Creation", true, `File created: ${path.basename(sandboxPath)}`);
      } else {
        recordTest("Sandbox File Creation", false, "File content mismatch");
      }
    } else {
      recordTest("Sandbox File Creation", false, "File not created");
    }
  } catch (error) {
    recordTest("Sandbox File Operations", false, error.message);
  }
}

async function runAllTests() {
  await test1_SandboxDirectory();
  await test2_JavaScriptSyntax();
  await test3_JSONSyntax();
  await test4_CompleteTest();
  await test5_ContentComparison();
  await test6_ApprovalSystem();
  await test7_TestSummary();
  await test8_FileOperations();

  // Final Summary
  console.log("\n" + "=".repeat(70));
  console.log("📊 SANDBOX TEST RESULTS SUMMARY");
  console.log("=".repeat(70));
  console.log(`\n✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⚠️  Warnings: ${testResults.warnings}`);
  console.log(`📋 Total Tests: ${testResults.tests.length}\n`);

  if (testResults.failed > 0) {
    console.log("Failed Tests:");
    testResults.tests
      .filter(t => !t.passed && !t.warning)
      .forEach(t => console.log(`   - ${t.name}: ${t.message || 'No details'}`));
    console.log();
  }

  const successRate = ((testResults.passed / testResults.tests.length) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%\n`);

  if (testResults.failed === 0) {
    console.log("=".repeat(70));
    console.log("✅ ALL SANDBOX TESTS PASSED! System is ready for use.");
    console.log("=".repeat(70) + "\n");
  } else {
    console.log("=".repeat(70));
    console.log("⚠️  SOME TESTS FAILED. Review failed tests above.");
    console.log("=".repeat(70) + "\n");
  }

  // Save test results
  try {
    const resultsFile = path.join(__dirname, '../logs/sandbox-test-results.json');
    const resultsDir = path.dirname(resultsFile);
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    fs.writeFileSync(resultsFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        passed: testResults.passed,
        failed: testResults.failed,
        warnings: testResults.warnings,
        total: testResults.tests.length,
        successRate: successRate + '%'
      },
      tests: testResults.tests
    }, null, 2));
    
    console.log(`📄 Test results saved to: ${resultsFile}\n`);
  } catch (error) {
    console.log(`⚠️  Could not save test results: ${error.message}\n`);
  }

  return testResults.failed === 0 ? 0 : 1;
}

runAllTests().then(exitCode => {
  process.exit(exitCode);
}).catch(error => {
  console.error(`\n✗ Fatal test error: ${error.message}\n`);
  process.exit(1);
});

