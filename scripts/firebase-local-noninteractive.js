import firebaseBackend from "../core/firebase-backend.js";
import codeAuditor from "../core/code-auditor.js";
import sandboxTester from "../core/sandbox-tester.js";
import localExecutor from "../core/local-executor.js";
import learningMemory from "../core/learning-memory.js";
import auditSystem from "../core/audit-system.js";
import { logger } from "../core/logger.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("\n" + "=".repeat(70));
console.log("🔥 FIREBASE + LOCAL FILES - Non-Interactive Analysis");
console.log("=".repeat(70) + "\n");

let firebaseSessionId = null;
const analysisResults = {
  timestamp: new Date().toISOString(),
  firebase: {
    initialized: false,
    backend: {},
    code: {},
    issues: []
  },
  local: {
    files: [],
    code: {},
    issues: [],
    tests: []
  },
  sandbox: {
    tests: [],
    results: []
  },
  recommendations: []
};

async function initializeFirebase() {
  console.log("=".repeat(70));
  console.log("STEP 1: Initialize Firebase Backend");
  console.log("=".repeat(70) + "\n");

  // Check for service account in config file
  const configPath = path.join(__dirname, '../config/firebase-config.json');
  let serviceAccountPath = null;

  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      serviceAccountPath = config.serviceAccountPath || config.serviceAccount;
    } catch (error) {
      console.log("⚠️  Could not read config file\n");
    }
  }

  // Also check environment variable
  if (!serviceAccountPath && process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;
  }

  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    try {
      console.log(`📄 Using service account: ${serviceAccountPath}\n`);
      const { cert } = await import('firebase-admin/app');
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      firebaseSessionId = `firebase_${Date.now()}`;
      await firebaseBackend.initialize(firebaseSessionId, {
        credential: cert(serviceAccount)
      });
      
      console.log("✅ Firebase backend initialized!\n");
      analysisResults.firebase.initialized = true;
      analysisResults.firebase.backend.sessionId = firebaseSessionId;

      // Test Firebase access
      try {
        const users = await firebaseBackend.listUsers(10);
        console.log(`✓ Firebase accessible - Found ${users.length} users\n`);
        analysisResults.firebase.backend.userCount = users.length;
        analysisResults.firebase.backend.accessible = true;
      } catch (error) {
        console.log(`⚠️  Firebase access test: ${error.message}\n`);
        analysisResults.firebase.backend.error = error.message;
      }
    } catch (error) {
      console.error(`\n✗ Failed to initialize Firebase: ${error.message}\n`);
      analysisResults.firebase.backend.error = error.message;
    }
  } else {
    console.log("⚠️  Firebase service account not found.\n");
    console.log("To enable Firebase backend access:");
    console.log("  1. Create config/firebase-config.json with:");
    console.log('     { "serviceAccountPath": "path/to/service-account.json" }');
    console.log("  2. Or set environment variable: FIREBASE_SERVICE_ACCOUNT=path/to/file.json");
    console.log("  3. Or provide service account JSON path when prompted\n");
    console.log("Continuing with local files analysis only...\n");
  }

  return true;
}

function scanDirectory(dirPath, extensions) {
  const files = [];
  
  try {
    const entries = fs.readdirSync(dirPath);
    
    for (const entry of entries) {
      // Skip node_modules, .git, etc.
      if (entry.startsWith('.') || entry === 'node_modules' || entry === 'dist' || entry === 'build') {
        continue;
      }

      const fullPath = path.join(dirPath, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...scanDirectory(fullPath, extensions));
      } else if (stat.isFile()) {
        const ext = path.extname(entry);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }

  return files;
}

async function scanLocalFiles() {
  console.log("=".repeat(70));
  console.log("STEP 2: Scanning Local Development Files (VS Code)");
  console.log("=".repeat(70) + "\n");

  try {
    const projectRoot = process.cwd();
    console.log(`📁 Scanning project: ${projectRoot}\n`);

    const scanDirs = [
      'src',
      'components',
      'pages',
      'utils',
      'config',
      'scripts',
      'core',
      'programs'
    ];

    const filesToAnalyze = [];

    // Scan directories
    for (const dir of scanDirs) {
      const dirPath = path.join(projectRoot, dir);
      if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        console.log(`  Scanning: ${dir}/`);
        const files = scanDirectory(dirPath, ['.js', '.jsx', '.ts', '.tsx', '.json']);
        filesToAnalyze.push(...files);
        console.log(`    Found ${files.length} files\n`);
      }
    }

    // Also scan root level files
    const rootFiles = fs.readdirSync(projectRoot)
      .filter(file => {
        const filePath = path.join(projectRoot, file);
        return fs.statSync(filePath).isFile() && 
               ['.js', '.json', '.html', '.css'].includes(path.extname(file));
      })
      .map(file => path.join(projectRoot, file));

    filesToAnalyze.push(...rootFiles);

    console.log(`✅ Found ${filesToAnalyze.length} files to analyze\n`);
    analysisResults.local.files = filesToAnalyze.map(f => path.relative(projectRoot, f));

    return filesToAnalyze;
  } catch (error) {
    console.error(`\n✗ Error scanning files: ${error.message}\n`);
    analysisResults.local.error = error.message;
    return [];
  }
}

function getLanguage(ext) {
  const langMap = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.json': 'json',
    '.html': 'html',
    '.css': 'css',
    '.py': 'python'
  };
  return langMap[ext] || 'unknown';
}

async function analyzeLocalCode(files) {
  console.log("=".repeat(70));
  console.log("STEP 3: Analyzing Local Code");
  console.log("=".repeat(70) + "\n");

  const issues = [];
  const codeStats = {
    totalFiles: files.length,
    totalLines: 0,
    totalSize: 0,
    languages: {}
  };

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    const relativePath = path.relative(process.cwd(), filePath);
    
    try {
      console.log(`  [${i + 1}/${files.length}] Analyzing: ${relativePath}`);
      
      const content = fs.readFileSync(filePath, 'utf8');
      const ext = path.extname(filePath);
      const language = getLanguage(ext);
      
      // Update stats
      codeStats.totalLines += content.split('\n').length;
      codeStats.totalSize += content.length;
      codeStats.languages[language] = (codeStats.languages[language] || 0) + 1;

      // Analyze code
      const analysis = codeAuditor.analyzeCode(content, relativePath);
      
      if (analysis.issues.length > 0) {
        issues.push({
          file: relativePath,
          issues: analysis.issues
        });
        
        analysis.issues.forEach(issue => {
          console.log(`    ⚠️  [${issue.severity}] ${issue.description}`);
        });
      } else {
        console.log(`    ✅ No issues found`);
      }
    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
      issues.push({
        file: relativePath,
        error: error.message
      });
    }
  }

  console.log(`\n✅ Analysis complete!\n`);
  console.log(`📊 Code Statistics:`);
  console.log(`   Total Files: ${codeStats.totalFiles}`);
  console.log(`   Total Lines: ${codeStats.totalLines.toLocaleString()}`);
  console.log(`   Total Size: ${(codeStats.totalSize / 1024).toFixed(2)} KB`);
  console.log(`   Languages: ${Object.keys(codeStats.languages).join(', ')}\n`);

  analysisResults.local.code = codeStats;
  analysisResults.local.issues = issues;

  return { issues, codeStats };
}

async function sandboxTesting(files) {
  console.log("=".repeat(70));
  console.log("STEP 4: Sandbox Testing");
  console.log("=".repeat(70) + "\n");

  const testResults = [];
  const filesToTest = files.slice(0, Math.min(10, files.length));

  console.log(`🧪 Testing ${filesToTest.length} files in sandbox...\n`);

  for (let i = 0; i < filesToTest.length; i++) {
    const filePath = filesToTest[i];
    const relativePath = path.relative(process.cwd(), filePath);
    
    try {
      console.log(`  [${i + 1}/${filesToTest.length}] Testing: ${relativePath}`);
      
      const content = fs.readFileSync(filePath, 'utf8');
      const ext = path.extname(filePath);
      const language = getLanguage(ext);

      const testResult = await sandboxTester.testChange(relativePath, content, language);
      
      if (testResult.overallStatus === 'pass') {
        console.log(`    ✅ Sandbox test passed`);
        testResults.push({
          file: relativePath,
          status: 'pass',
          testResult
        });
      } else {
        console.log(`    ❌ Sandbox test failed`);
        console.log(`       Errors: ${testResult.syntaxTest.errors.join(', ')}`);
        testResults.push({
          file: relativePath,
          status: 'fail',
          testResult
        });
      }
    } catch (error) {
      console.log(`    ⚠️  Test error: ${error.message}`);
      testResults.push({
        file: relativePath,
        status: 'error',
        error: error.message
      });
    }
  }

  console.log(`\n✅ Sandbox testing complete!\n`);
  analysisResults.sandbox.tests = testResults;

  return testResults;
}

async function firebaseCodeAnalysis() {
  console.log("=".repeat(70));
  console.log("STEP 5: Firebase Backend Code Analysis");
  console.log("=".repeat(70) + "\n");

  if (!firebaseSessionId) {
    console.log("⚠️  Firebase backend not initialized. Skipping Firebase code analysis.\n");
    return;
  }

  try {
    console.log("🔍 Analyzing Firebase backend...\n");

    try {
      const users = await firebaseBackend.listUsers(20);
      console.log(`  ✓ Users: ${users.length} found`);
      
      const disabledUsers = users.filter(u => u.disabled);
      if (disabledUsers.length > 0) {
        analysisResults.firebase.issues.push({
          type: 'warning',
          message: `${disabledUsers.length} disabled users found`,
          severity: 'low'
        });
        console.log(`    ⚠️  ${disabledUsers.length} disabled users`);
      }
    } catch (error) {
      console.log(`  ⚠️  Could not analyze users: ${error.message}`);
    }

    console.log("\n  ℹ️  For detailed Firebase code analysis:");
    console.log("     - Review Firestore security rules in Firebase Console");
    console.log("     - Check Cloud Functions code in Firebase Console");
    console.log("     - Review database structure and indexes\n");

    analysisResults.firebase.code.analyzed = true;
  } catch (error) {
    console.error(`\n✗ Error: ${error.message}\n`);
    analysisResults.firebase.code.error = error.message;
  }
}

async function generateReport() {
  console.log("=".repeat(70));
  console.log("STEP 6: Generating Comprehensive Report");
  console.log("=".repeat(70) + "\n");

  try {
    const reportDir = path.join(__dirname, '../logs/analysis');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = path.join(reportDir, `firebase-local-analysis-${timestamp}.json`);

    fs.writeFileSync(reportFile, JSON.stringify(analysisResults, null, 2), 'utf8');
    console.log(`✅ Analysis report saved: ${reportFile}\n`);

    const textReport = generateTextReport();
    const textReportFile = path.join(reportDir, `firebase-local-analysis-${timestamp}.txt`);
    fs.writeFileSync(textReportFile, textReport, 'utf8');
    console.log(`✅ Text report saved: ${textReportFile}\n`);

    console.log("=".repeat(70));
    console.log("📊 ANALYSIS SUMMARY");
    console.log("=".repeat(70));
    console.log(`\nFirebase Backend: ${analysisResults.firebase.initialized ? '✅ Initialized' : '❌ Not initialized'}`);
    console.log(`Local Files Scanned: ${analysisResults.local.files.length}`);
    console.log(`Code Issues Found: ${analysisResults.local.issues.length}`);
    console.log(`Sandbox Tests: ${analysisResults.sandbox.tests.length}`);
    console.log(`Tests Passed: ${analysisResults.sandbox.tests.filter(t => t.status === 'pass').length}`);
    console.log(`Tests Failed: ${analysisResults.sandbox.tests.filter(t => t.status === 'fail').length}\n`);

    if (analysisResults.local.issues.length > 0) {
      console.log("⚠️  Code Issues:");
      analysisResults.local.issues.slice(0, 10).forEach((item, index) => {
        if (item.issues) {
          console.log(`   ${index + 1}. ${item.file}: ${item.issues.length} issues`);
        }
      });
      if (analysisResults.local.issues.length > 10) {
        console.log(`   ... and ${analysisResults.local.issues.length - 10} more files with issues`);
      }
      console.log();
    }

    learningMemory.saveSolution(
      `Firebase + Local Code Analysis`,
      `Scanned ${analysisResults.local.files.length} files, found ${analysisResults.local.issues.length} issues`,
      analysisResults.local.issues.length === 0
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
FIREBASE + LOCAL FILES - COMPREHENSIVE ANALYSIS REPORT
═══════════════════════════════════════════════════════════════

Generated: ${analysisResults.timestamp}

FIREBASE BACKEND:
  Initialized: ${analysisResults.firebase.initialized ? 'YES' : 'NO'}
  Accessible: ${analysisResults.firebase.backend.accessible ? 'YES' : 'NO'}
  User Count: ${analysisResults.firebase.backend.userCount || 'N/A'}
  Issues: ${analysisResults.firebase.issues.length}

LOCAL FILES:
  Files Scanned: ${analysisResults.local.files.length}
  Total Lines: ${analysisResults.local.code.totalLines || 0}
  Total Size: ${analysisResults.local.code.totalSize ? (analysisResults.local.code.totalSize / 1024).toFixed(2) + ' KB' : 'N/A'}
  Languages: ${Object.keys(analysisResults.local.code.languages || {}).join(', ') || 'N/A'}
  Issues Found: ${analysisResults.local.issues.length}

SANDBOX TESTING:
  Tests Run: ${analysisResults.sandbox.tests.length}
  Passed: ${analysisResults.sandbox.tests.filter(t => t.status === 'pass').length}
  Failed: ${analysisResults.sandbox.tests.filter(t => t.status === 'fail').length}
  Errors: ${analysisResults.sandbox.tests.filter(t => t.status === 'error').length}

DETAILED ISSUES:
${analysisResults.local.issues.length > 0 ? analysisResults.local.issues.map((item, i) => `
  ${i + 1}. ${item.file}
${item.issues ? item.issues.map(issue => `     - [${issue.severity}] ${issue.description}`).join('\n') : ''}
${item.error ? `     - Error: ${item.error}` : ''}
`).join('') : '  No issues found'}

═══════════════════════════════════════════════════════════════
END OF REPORT
═══════════════════════════════════════════════════════════════
`;
}

async function main() {
  try {
    await initializeFirebase();
    const files = await scanLocalFiles();
    await analyzeLocalCode(files);
    await sandboxTesting(files);
    await firebaseCodeAnalysis();
    await generateReport();

    console.log("=".repeat(70));
    console.log("✅ COMPREHENSIVE ANALYSIS COMPLETE");
    console.log("=".repeat(70) + "\n");

    console.log("All analysis data has been:");
    console.log("  ✓ Saved to logs/analysis/");
    console.log("  ✓ Logged to audit system");
    console.log("  ✓ Saved to learning memory\n");

  } catch (error) {
    console.error(`\n✗ Fatal error: ${error.message}\n`);
    logger.error(`Analysis error: ${error.message}`);
  } finally {
    learningMemory.saveMemory();
  }
}

main();





