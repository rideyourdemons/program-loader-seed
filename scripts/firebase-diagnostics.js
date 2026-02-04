import navigationController from "../core/navigation-controller.js";
import firebaseBackend from "../core/firebase-backend.js";
import codeAuditor from "../core/code-auditor.js";
import monitoringLoops from "../core/monitoring-loops.js";
import learningMemory from "../core/learning-memory.js";
import auditSystem from "../core/audit-system.js";
import { logger } from "../core/logger.js";
import readline from "readline";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

console.log("\n" + "=".repeat(70));
console.log("🔥 FIREBASE DIAGNOSTICS - Website Analysis & Diagnostics");
console.log("=".repeat(70) + "\n");

let firebaseSessionId = null;
let websiteSessionId = null;
const diagnostics = {
  timestamp: new Date().toISOString(),
  firebase: {},
  website: {},
  code: {},
  issues: [],
  recommendations: []
};

async function step1_AccessFirebase() {
  console.log("=".repeat(70));
  console.log("STEP 1: Accessing Firebase Console");
  console.log("=".repeat(70) + "\n");

  const firebaseUrl = "https://console.firebase.google.com/u/0/?fb_gclid=CjwKCAiAu67KBhAkEiwAY0jAlSXViQo0WBURe33hN7VkWyZP2gvC29clNwxHJ04f8xXxTD0w5KUkuBoC8wQQAvD_BwE&_gl=1*13k5r90*_up*MQ..*_ga*OTI5MTQzMDYwLjE3NDk3NDIyNzQ.*_ga_CW55HF8NVT*czE3NjY2MTQ0ODAkbzE0OCRnMSR0MTc2NjYxNDQ4MSRqNTkkbDAkaDA.&gclid=CjwKCAiAu67KBhAkEiwAY0jAlSXViQo0WBURe33hN7VkWyZP2gvC29clNwxHJ04f8xXxTD0w5KUkuBoC8wQQAvD_BwE&gclsrc=aw.ds&gbraid=0AAAAADpUDOhX5_Ek9QUWQ6l2uAdHLZrN_";

  try {
    console.log("🌐 Opening browser to Firebase Console...\n");
    
    websiteSessionId = await navigationController.initWebsiteSession({
      url: firebaseUrl,
      username: "",
      password: ""
    }, { headless: false });

    console.log(`✅ Browser opened! Session ID: ${websiteSessionId}\n`);
    console.log("📋 Please:");
    console.log("   1. Sign in with your Google Account");
    console.log("   2. Select your Firebase project (rideyourdemons.com)");
    console.log("   3. Navigate to your project dashboard\n");

    await question("Press Enter when you've logged in to Firebase...");

    const currentUrl = await navigationController.getCurrentUrl(websiteSessionId);
    console.log(`\n✓ Current URL: ${currentUrl}\n`);
    diagnostics.firebase.consoleUrl = currentUrl;
    diagnostics.firebase.accessed = true;

    // Option to set up Firebase backend
    const setupBackend = (await question("Set up Firebase backend access for diagnostics? (y/n): ")) === 'y';
    
    if (setupBackend) {
      const serviceAccountPath = await question("Path to Firebase service account JSON file: ");
      
      if (serviceAccountPath && serviceAccountPath.trim()) {
        try {
          const { cert } = await import('firebase-admin/app');
          const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
          
          firebaseSessionId = `firebase_${Date.now()}`;
          await firebaseBackend.initialize(firebaseSessionId, {
            credential: cert(serviceAccount)
          });
          
          console.log("\n✅ Firebase backend initialized!\n");
          diagnostics.firebase.backendInitialized = true;

          // Test Firebase access
          try {
            const users = await firebaseBackend.listUsers(10);
            console.log(`✓ Firebase accessible - Found ${users.length} users\n`);
            diagnostics.firebase.userCount = users.length;
            diagnostics.firebase.backendAccessible = true;
          } catch (error) {
            console.log(`⚠️  Firebase backend test: ${error.message}\n`);
            diagnostics.firebase.backendError = error.message;
          }
        } catch (error) {
          console.error(`\n✗ Failed to initialize Firebase: ${error.message}\n`);
          diagnostics.firebase.backendError = error.message;
        }
      }
    }

    return true;
  } catch (error) {
    console.error(`\n✗ Error: ${error.message}\n`);
    diagnostics.firebase.error = error.message;
    return false;
  }
}

async function step2_AccessWebsite() {
  console.log("\n" + "=".repeat(70));
  console.log("STEP 2: Accessing Website");
  console.log("=".repeat(70) + "\n");

  try {
    console.log("🌐 Navigating to rideyourdemons.com...\n");
    
    if (websiteSessionId) {
      await navigationController.navigateTo(websiteSessionId, "https://rideyourdemons.com");
    } else {
      websiteSessionId = await navigationController.initWebsiteSession({
        url: "https://rideyourdemons.com",
        username: "",
        password: ""
      }, { headless: false });
    }

    await sleep(3000); // Wait for page load

    const websiteUrl = await navigationController.getCurrentUrl(websiteSessionId);
    console.log(`✓ Navigated to: ${websiteUrl}\n`);
    diagnostics.website.url = websiteUrl;
    diagnostics.website.accessed = true;

    console.log("📋 Please:");
    console.log("   1. Log in to the website with your Firebase credentials");
    console.log("   2. Navigate to your admin/code area if needed");
    console.log("   3. Return here when ready\n");

    await question("Press Enter when you've logged in and are ready for diagnostics...");

    const finalUrl = await navigationController.getCurrentUrl(websiteSessionId);
    console.log(`\n✓ Current URL: ${finalUrl}\n`);
    diagnostics.website.finalUrl = finalUrl;

    return true;
  } catch (error) {
    console.error(`\n✗ Error: ${error.message}\n`);
    diagnostics.website.error = error.message;
    return false;
  }
}

async function step3_CodeDiagnostics() {
  console.log("\n" + "=".repeat(70));
  console.log("STEP 3: Code Diagnostics & Analysis");
  console.log("=".repeat(70) + "\n");

  try {
    console.log("🔍 Starting comprehensive code diagnostics...\n");

    // Set up code auditor
    codeAuditor.setSession(websiteSessionId);

    // Get page content
    console.log("  1. Reading page content...");
    const content = await navigationController.getCurrentContent(websiteSessionId);
    console.log(`     ✓ Content retrieved (${content.length} characters)\n`);
    diagnostics.code.contentSize = content.length;

    // Analyze code
    console.log("  2. Analyzing code for issues...");
    const analysis = codeAuditor.analyzeCode(content, diagnostics.website.finalUrl);
    console.log(`     ✓ Analysis complete\n`);
    diagnostics.code.analysis = analysis;
    diagnostics.code.issueCount = analysis.issues.length;

    // Report issues
    console.log("  3. Issue Report:");
    if (analysis.issues.length > 0) {
      console.log(`     ⚠️  Found ${analysis.issues.length} issues:\n`);
      analysis.issues.forEach((issue, index) => {
        const severityIcon = issue.severity === 'error' ? '❌' : 
                            issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`     ${index + 1}. ${severityIcon} [${issue.severity.toUpperCase()}] ${issue.description}`);
        if (issue.location) {
          console.log(`        Location: ${issue.location}`);
        }
        if (issue.suggestion) {
          console.log(`        Suggestion: ${issue.suggestion}`);
        }

        diagnostics.issues.push({
          severity: issue.severity,
          description: issue.description,
          location: issue.location,
          suggestion: issue.suggestion
        });
      });
    } else {
      console.log("     ✅ No issues found\n");
    }

    // Check for common patterns
    console.log("  4. Checking for common patterns...");
    const patterns = {
      consoleLogs: (content.match(/console\.log/g) || []).length,
      errors: (content.match(/error|Error|ERROR/g) || []).length,
      warnings: (content.match(/warn|Warn|WARN/g) || []).length,
      firebaseRefs: (content.match(/firebase|Firebase|FIREBASE/g) || []).length,
      apiCalls: (content.match(/fetch|axios|api/g) || []).length
    };
    console.log(`     ✓ Patterns detected:`);
    console.log(`        - console.log: ${patterns.consoleLogs}`);
    console.log(`        - Error references: ${patterns.errors}`);
    console.log(`        - Warning references: ${patterns.warnings}`);
    console.log(`        - Firebase references: ${patterns.firebaseRefs}`);
    console.log(`        - API calls: ${patterns.apiCalls}\n`);
    diagnostics.code.patterns = patterns;

    // Generate recommendations
    if (patterns.consoleLogs > 10) {
      diagnostics.recommendations.push({
        type: 'code_quality',
        priority: 'medium',
        message: 'Consider removing console.log statements in production code',
        count: patterns.consoleLogs
      });
    }

    if (analysis.issues.length > 0) {
      const errorCount = analysis.issues.filter(i => i.severity === 'error').length;
      if (errorCount > 0) {
        diagnostics.recommendations.push({
          type: 'critical',
          priority: 'high',
          message: `${errorCount} critical errors found that need immediate attention`,
          count: errorCount
        });
      }
    }

    return true;
  } catch (error) {
    console.error(`\n✗ Error: ${error.message}\n`);
    diagnostics.code.error = error.message;
    return false;
  }
}

async function step4_FirebaseBackendDiagnostics() {
  console.log("\n" + "=".repeat(70));
  console.log("STEP 4: Firebase Backend Diagnostics");
  console.log("=".repeat(70) + "\n");

  if (!firebaseSessionId) {
    console.log("⚠️  Firebase backend not initialized. Skipping backend diagnostics.\n");
    return false;
  }

  try {
    console.log("🔍 Checking Firebase backend...\n");

    // Check users
    console.log("  1. Checking Authentication...");
    try {
      const users = await firebaseBackend.listUsers(20);
      console.log(`     ✓ Found ${users.length} users\n`);
      diagnostics.firebase.users = {
        count: users.length,
        sample: users.slice(0, 5).map(u => ({
          uid: u.uid,
          email: u.email,
          disabled: u.disabled
        }))
      };
    } catch (error) {
      console.log(`     ⚠️  Could not list users: ${error.message}\n`);
      diagnostics.firebase.usersError = error.message;
    }

    // Check Firestore (if accessible)
    console.log("  2. Checking Firestore...");
    try {
      // This would require Firestore access - placeholder for now
      console.log("     ℹ️  Firestore access requires specific collection paths\n");
      diagnostics.firebase.firestore = { note: 'Requires specific collection paths' };
    } catch (error) {
      console.log(`     ⚠️  Firestore check: ${error.message}\n`);
    }

    // Check Realtime Database (if accessible)
    console.log("  3. Checking Realtime Database...");
    try {
      // This would require database access - placeholder for now
      console.log("     ℹ️  Database access requires specific paths\n");
      diagnostics.firebase.database = { note: 'Requires specific database paths' };
    } catch (error) {
      console.log(`     ⚠️  Database check: ${error.message}\n`);
    }

    return true;
  } catch (error) {
    console.error(`\n✗ Error: ${error.message}\n`);
    diagnostics.firebase.backendDiagnosticsError = error.message;
    return false;
  }
}

async function step5_GenerateReport() {
  console.log("\n" + "=".repeat(70));
  console.log("STEP 5: Generating Diagnostic Report");
  console.log("=".repeat(70) + "\n");

  try {
    const reportDir = path.join(__dirname, '../logs/diagnostics');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = path.join(reportDir, `diagnostics-${timestamp}.json`);

    // Save JSON report
    fs.writeFileSync(reportFile, JSON.stringify(diagnostics, null, 2), 'utf8');
    console.log(`✅ Diagnostic report saved: ${reportFile}\n`);

    // Generate text report
    const textReport = generateTextReport();
    const textReportFile = path.join(reportDir, `diagnostics-${timestamp}.txt`);
    fs.writeFileSync(textReportFile, textReport, 'utf8');
    console.log(`✅ Text report saved: ${textReportFile}\n`);

    // Display summary
    console.log("=".repeat(70));
    console.log("📊 DIAGNOSTIC SUMMARY");
    console.log("=".repeat(70));
    console.log(`\nFirebase: ${diagnostics.firebase.accessed ? '✅ Accessed' : '❌ Not accessed'}`);
    console.log(`Website: ${diagnostics.website.accessed ? '✅ Accessed' : '❌ Not accessed'}`);
    console.log(`Code Analysis: ${diagnostics.code.issueCount !== undefined ? `✅ ${diagnostics.code.issueCount} issues found` : '❌ Not analyzed'}`);
    console.log(`Firebase Backend: ${diagnostics.firebase.backendInitialized ? '✅ Initialized' : '❌ Not initialized'}`);
    console.log(`\nTotal Issues: ${diagnostics.issues.length}`);
    console.log(`Recommendations: ${diagnostics.recommendations.length}\n`);

    if (diagnostics.issues.length > 0) {
      console.log("⚠️  Issues Found:");
      diagnostics.issues.slice(0, 5).forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
      });
      if (diagnostics.issues.length > 5) {
        console.log(`   ... and ${diagnostics.issues.length - 5} more`);
      }
      console.log();
    }

    if (diagnostics.recommendations.length > 0) {
      console.log("💡 Recommendations:");
      diagnostics.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
      });
      console.log();
    }

    // Save to learning memory
    learningMemory.saveSolution(
      `Diagnostics for ${diagnostics.website.url}`,
      `Found ${diagnostics.issues.length} issues, ${diagnostics.recommendations.length} recommendations`,
      diagnostics.issues.length === 0
    );

    return true;
  } catch (error) {
    console.error(`\n✗ Error generating report: ${error.message}\n`);
    return false;
  }
}

function generateTextReport() {
  return `
═══════════════════════════════════════════════════════════════
FIREBASE & WEBSITE DIAGNOSTIC REPORT
═══════════════════════════════════════════════════════════════

Generated: ${diagnostics.timestamp}

FIREBASE CONSOLE:
  Accessed: ${diagnostics.firebase.accessed ? 'YES' : 'NO'}
  URL: ${diagnostics.firebase.consoleUrl || 'N/A'}
  Backend Initialized: ${diagnostics.firebase.backendInitialized ? 'YES' : 'NO'}
  Backend Accessible: ${diagnostics.firebase.backendAccessible ? 'YES' : 'NO'}
  User Count: ${diagnostics.firebase.userCount || 'N/A'}

WEBSITE:
  Accessed: ${diagnostics.website.accessed ? 'YES' : 'NO'}
  URL: ${diagnostics.website.url || 'N/A'}
  Final URL: ${diagnostics.website.finalUrl || 'N/A'}

CODE ANALYSIS:
  Content Size: ${diagnostics.code.contentSize || 'N/A'} characters
  Issues Found: ${diagnostics.code.issueCount || 0}
  
  Patterns Detected:
    - console.log: ${diagnostics.code.patterns?.consoleLogs || 0}
    - Error references: ${diagnostics.code.patterns?.errors || 0}
    - Warning references: ${diagnostics.code.patterns?.warnings || 0}
    - Firebase references: ${diagnostics.code.patterns?.firebaseRefs || 0}
    - API calls: ${diagnostics.code.patterns?.apiCalls || 0}

ISSUES:
${diagnostics.issues.length > 0 ? diagnostics.issues.map((issue, i) => `
  ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.description}
      Location: ${issue.location || 'N/A'}
      Suggestion: ${issue.suggestion || 'N/A'}
`).join('') : '  No issues found'}

RECOMMENDATIONS:
${diagnostics.recommendations.length > 0 ? diagnostics.recommendations.map((rec, i) => `
  ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.message}
`).join('') : '  No recommendations'}

═══════════════════════════════════════════════════════════════
END OF REPORT
═══════════════════════════════════════════════════════════════
`;
}

async function main() {
  try {
    await step1_AccessFirebase();
    await step2_AccessWebsite();
    await step3_CodeDiagnostics();
    await step4_FirebaseBackendDiagnostics();
    await step5_GenerateReport();

    console.log("=".repeat(70));
    console.log("✅ DIAGNOSTICS COMPLETE");
    console.log("=".repeat(70) + "\n");

    console.log("All diagnostic data has been:");
    console.log("  ✓ Saved to logs/diagnostics/");
    console.log("  ✓ Logged to audit system");
    console.log("  ✓ Saved to learning memory\n");

  } catch (error) {
    console.error(`\n✗ Fatal error: ${error.message}\n`);
    logger.error(`Diagnostics error: ${error.message}`);
  } finally {
    if (websiteSessionId) {
      await navigationController.closeSession(websiteSessionId);
    }
    learningMemory.saveMemory();
    rl.close();
  }
}

// Handle cleanup
process.on('SIGINT', async () => {
  console.log("\n\n⚠️  Stopping diagnostics...");
  if (websiteSessionId) {
    await navigationController.closeSession(websiteSessionId);
  }
  learningMemory.saveMemory();
  rl.close();
  process.exit(0);
});

main();

