#!/usr/bin/env node

/**
 * RYD System Deployment Script
 * Comprehensive deployment and analysis script for Ride Your Demons website
 * Handles authentication, code discovery, auditing, Firebase integration, and monitoring
 */

import readline from 'readline';
import navigationController from '../core/navigation-controller.js';
import codeAuditor from '../core/code-auditor.js';
import firebaseBackend from '../core/firebase-backend.js';
import firebaseAuth from '../core/firebase-auth.js';
import webAutomation from '../core/web-automation.js';
import { logger } from '../core/logger.js';
import auditSystem from '../core/audit-system.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

function hideInput(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let input = '';
    process.stdin.on('data', (char) => {
      char = char.toString();
      switch (char) {
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

async function deployRYDSystem() {
  console.log('\n' + '='.repeat(70));
  console.log('RYD SYSTEM DEPLOYMENT & ANALYSIS');
  console.log('='.repeat(70));
  console.log('This script will:');
  console.log('  1. Initialize website session with automated authentication');
  console.log('  2. Discover code files automatically');
  console.log('  3. Perform comprehensive code audits');
  console.log('  4. Access Firebase backend');
  console.log('  5. Set up monitoring');
  console.log('  6. Generate comprehensive reports\n');

  let websiteSessionId = null;
  let firebaseSessionId = null;
  const deploymentResults = {
    timestamp: new Date().toISOString(),
    website: {},
    codeDiscovery: {},
    audits: {},
    firebase: {},
    monitoring: {},
    errors: []
  };

  try {
    // Step 1: Initialize Website Session
    console.log('\n' + '='.repeat(70));
    console.log('STEP 1: Website Session Initialization');
    console.log('='.repeat(70) + '\n');

    const websiteUrl = await question('Website URL (default: https://rideyourdemons.com): ') || 'https://rideyourdemons.com';
    const username = await question('Email/Username: ');
    const password = await hideInput('Password: ');
    const headless = (await question('Headless mode? (y/n, default: n): ')) === 'y';

    console.log('\n🚀 Initializing website session...');
    websiteSessionId = await navigationController.initWebsiteSession({
      url: websiteUrl,
      username,
      password
    }, { headless, timeout: 90000 });

    deploymentResults.website.sessionId = websiteSessionId;
    deploymentResults.website.url = websiteUrl;

    console.log(`✅ Website session created: ${websiteSessionId}\n`);

    // Step 2: Automated Authentication
    console.log('='.repeat(70));
    console.log('STEP 2: Automated Authentication');
    console.log('='.repeat(70) + '\n');

    console.log('🔐 Attempting automated authentication...');
    
    // Auto-detect and use Firebase authentication
    const loginOptions = {
      useFirebase: true // Try Firebase first
    };

    try {
      await navigationController.loginToWebsite(websiteSessionId, loginOptions);
      console.log('✅ Authentication successful!\n');
      deploymentResults.website.authenticated = true;
      
      // Verify authentication
      const isAuth = await firebaseAuth.isAuthenticated(websiteSessionId);
      if (isAuth) {
        const user = await firebaseAuth.getCurrentUser(websiteSessionId);
        console.log(`✅ Authenticated as: ${user?.email || 'Unknown'}\n`);
        deploymentResults.website.user = user?.email;
      }
    } catch (error) {
      console.error(`⚠️  Authentication error: ${error.message}`);
      console.log('Please complete authentication manually in the browser window.\n');
      await question('Press Enter when authentication is complete...');
      deploymentResults.website.authenticated = true;
    }

    // Step 3: Code File Discovery
    console.log('='.repeat(70));
    console.log('STEP 3: Intelligent Code File Discovery');
    console.log('='.repeat(70) + '\n');

    console.log('🔍 Discovering code files...');
    
    try {
      // Wait for SPA to be ready
      await webAutomation.waitForSPAReady(webAutomation.pages.get(websiteSessionId));
      
      // Discover files from page
      const discoveredFiles = await webAutomation.discoverCodeFiles(websiteSessionId);
      
      // Get network requests (additional discovery)
      const networkRequests = await webAutomation.getNetworkRequests(websiteSessionId);
      
      const allFiles = [...discoveredFiles, ...networkRequests.map(req => ({
        type: 'network',
        url: req.url
      }))];

      console.log(`✅ Discovered ${allFiles.length} code files:`);
      allFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.type}: ${file.url || file.path}`);
      });
      
      deploymentResults.codeDiscovery.files = allFiles;
      deploymentResults.codeDiscovery.count = allFiles.length;
      console.log();
    } catch (error) {
      console.error(`⚠️  Code discovery error: ${error.message}`);
      deploymentResults.errors.push({ step: 'codeDiscovery', error: error.message });
    }

    // Step 4: Comprehensive Code Auditing
    console.log('='.repeat(70));
    console.log('STEP 4: Comprehensive Code Audit');
    console.log('='.repeat(70) + '\n');

    const performAudit = (await question('Perform code audit? (y/n, default: y): ')) !== 'n';

    if (performAudit) {
      console.log('📊 Starting comprehensive code audit...\n');
      
      codeAuditor.setSession(websiteSessionId);
      
      // Ask for directory to audit
      const auditPath = await question('Directory path to audit (default: /): ') || '/';
      
      try {
        console.log(`Auditing directory: ${auditPath}...`);
        const auditResults = await codeAuditor.auditDirectory(auditPath, 'auto');
        
        console.log(`✅ Audit completed: ${auditResults.length} files analyzed\n`);
        
        // Generate report
        console.log('📄 Generating audit report...');
        const reportPath = codeAuditor.saveReport('json');
        const htmlReportPath = codeAuditor.saveReport('html');
        
        console.log(`✅ Reports saved:`);
        console.log(`   - JSON: ${reportPath}`);
        console.log(`   - HTML: ${htmlReportPath}\n`);
        
        deploymentResults.audits.filesAudited = auditResults.length;
        deploymentResults.audits.reportPath = reportPath;
        deploymentResults.audits.htmlReportPath = htmlReportPath;
        
        // Display summary
        const report = codeAuditor.generateReport();
        console.log('📊 Audit Summary:');
        console.log(`   Total Issues: ${report.summary?.totalIssues || 0}`);
        console.log(`   High Severity: ${report.summary?.highSeverity || 0}`);
        console.log(`   Medium Severity: ${report.summary?.mediumSeverity || 0}`);
        console.log(`   Low Severity: ${report.summary?.lowSeverity || 0}\n`);
        
        deploymentResults.audits.summary = report.summary;
      } catch (error) {
        console.error(`⚠️  Audit error: ${error.message}`);
        deploymentResults.errors.push({ step: 'audit', error: error.message });
      }
    }

    // Step 5: Firebase Backend Integration
    console.log('='.repeat(70));
    console.log('STEP 5: Firebase Backend Integration');
    console.log('='.repeat(70) + '\n');

    const setupFirebase = (await question('Setup Firebase backend integration? (y/n, default: y): ')) !== 'n';

    if (setupFirebase) {
      console.log('🔥 Initializing Firebase backend...\n');
      
      try {
        // Firebase config would typically come from the website or provided config
        const firebaseConfigPath = await question('Firebase config file path (or press Enter to auto-detect): ');
        
        let firebaseConfig = null;
        if (firebaseConfigPath && fs.existsSync(firebaseConfigPath)) {
          firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
        } else {
          // Try to get from detected Firebase config
          const detectedConfig = await firebaseAuth.detectFirebaseConfig(websiteSessionId);
          if (detectedConfig) {
            firebaseConfig = detectedConfig;
            console.log('✅ Firebase config detected from website\n');
          }
        }

        if (firebaseConfig) {
          firebaseSessionId = websiteSessionId; // Reuse website session
          await firebaseBackend.initialize(firebaseSessionId, firebaseConfig);
          console.log('✅ Firebase backend initialized\n');
          deploymentResults.firebase.initialized = true;
          
          // Test Firebase access
          console.log('Testing Firebase access...');
          
          // List collections (if accessible)
          try {
            const users = await firebaseBackend.listUsers(10);
            console.log(`✅ Firebase Auth: ${users.length} users found\n`);
            deploymentResults.firebase.usersCount = users.length;
          } catch (error) {
            console.log(`⚠️  Could not access users (may require admin privileges): ${error.message}\n`);
          }
          
          // Setup real-time monitoring (optional)
          const setupMonitoring = (await question('Setup real-time Firebase monitoring? (y/n, default: n): ')) === 'y';
          if (setupMonitoring) {
            const collectionPath = await question('Collection path to monitor: ');
            if (collectionPath) {
              console.log(`Setting up real-time listener for: ${collectionPath}...`);
              
              const unsubscribe = await firebaseBackend.watchCollection(
                collectionPath,
                (documents, changes) => {
                  console.log(`\n📡 Firebase change detected in ${collectionPath}:`);
                  changes.forEach(change => {
                    console.log(`   ${change.type}: ${change.doc.id}`);
                  });
                }
              );
              
              console.log(`✅ Real-time monitoring active for: ${collectionPath}`);
              console.log('   (Monitoring will continue until script exits)\n');
              
              deploymentResults.monitoring.firebaseCollection = collectionPath;
              deploymentResults.monitoring.active = true;
            }
          }
        } else {
          console.log('⚠️  Firebase config not found. Skipping Firebase integration.\n');
        }
      } catch (error) {
        console.error(`⚠️  Firebase initialization error: ${error.message}`);
        deploymentResults.errors.push({ step: 'firebase', error: error.message });
      }
    }

    // Step 6: Save Deployment Results
    console.log('='.repeat(70));
    console.log('STEP 6: Saving Deployment Results');
    console.log('='.repeat(70) + '\n');

    const resultsDir = path.join(__dirname, '../logs/deployment');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const resultsFile = path.join(
      resultsDir,
      `deployment-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );

    fs.writeFileSync(resultsFile, JSON.stringify(deploymentResults, null, 2));
    console.log(`✅ Deployment results saved: ${resultsFile}\n`);

    // Final Summary
    console.log('='.repeat(70));
    console.log('DEPLOYMENT SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Website Session: ${websiteSessionId}`);
    console.log(`✅ Authentication: ${deploymentResults.website.authenticated ? 'Success' : 'Failed'}`);
    console.log(`✅ Code Files Discovered: ${deploymentResults.codeDiscovery.count || 0}`);
    console.log(`✅ Files Audited: ${deploymentResults.audits.filesAudited || 0}`);
    console.log(`✅ Firebase: ${deploymentResults.firebase.initialized ? 'Initialized' : 'Not Setup'}`);
    console.log(`✅ Monitoring: ${deploymentResults.monitoring.active ? 'Active' : 'Inactive'}`);
    
    if (deploymentResults.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${deploymentResults.errors.length}`);
      deploymentResults.errors.forEach(err => {
        console.log(`   - ${err.step}: ${err.error}`);
      });
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ RYD SYSTEM DEPLOYMENT COMPLETE');
    console.log('='.repeat(70) + '\n');

    // Keep session alive for monitoring
    if (deploymentResults.monitoring.active) {
      console.log('💡 Monitoring is active. Press Ctrl+C to exit and close sessions.\n');
      process.on('SIGINT', async () => {
        console.log('\n\n🛑 Shutting down...');
        if (websiteSessionId) {
          await navigationController.closeSession(websiteSessionId);
        }
        process.exit(0);
      });
      
      // Keep process running
      await new Promise(() => {});
    }

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.error(error.stack);
    deploymentResults.errors.push({ step: 'general', error: error.message, stack: error.stack });
    
    // Save error results
    const resultsDir = path.join(__dirname, '../logs/deployment');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    const resultsFile = path.join(
      resultsDir,
      `deployment-error-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );
    fs.writeFileSync(resultsFile, JSON.stringify(deploymentResults, null, 2));
    
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run deployment
deployRYDSystem().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

