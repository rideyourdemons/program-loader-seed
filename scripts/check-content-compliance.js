#!/usr/bin/env node

/**
 * Content Compliance Checker
 * Check content against compliance requirements before deployment
 */

import ComplianceChecker from '../core/compliance-checker.js';
import { DATA_FILES } from './config/data-files.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkContent() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('\n📋 Content Compliance Checker\n');
    console.log('Usage: node scripts/check-content-compliance.js <content-file> <region-code>\n');
    console.log('Example:');
    console.log('  node scripts/check-content-compliance.js content.json US\n');
    console.log('Region codes: US, UK, CA, DE, FR, JP, etc.\n');
    process.exit(1);
  }

  const contentFile = args[0];
  const regionCode = args[1].toUpperCase();

  console.log('\n' + '='.repeat(70));
  console.log('🔍 Content Compliance Check');
  console.log('='.repeat(70) + '\n');

  // Load content
  let content;
  try {
    const contentPath = path.isAbsolute(contentFile) 
      ? contentFile 
      : path.join(process.cwd(), contentFile);
    
    const contentData = fs.readFileSync(contentPath, 'utf8');
    content = JSON.parse(contentData);
    console.log(`✅ Content loaded: ${contentFile}\n`);
  } catch (error) {
    console.error(`❌ Error loading content: ${error.message}\n`);
    process.exit(1);
  }

  // Check compliance
  console.log(`🌍 Checking compliance for region: ${regionCode}\n`);
  const report = await ComplianceChecker.checkCompliance(content, regionCode);

  // Display results
  console.log('='.repeat(70));
  console.log('COMPLIANCE REPORT');
  console.log('='.repeat(70) + '\n');

  const summary = ComplianceChecker.generateReportSummary(report);
  
  console.log(`Region: ${summary.region}`);
  console.log(`Status: ${summary.status}`);
  console.log(`Can Deploy: ${report.canDeploy ? '✅ YES' : '❌ NO'}\n`);

  // Blockers
  if (report.blockers.length > 0) {
    console.log('❌ BLOCKERS (Must resolve before deployment):\n');
    report.blockers.forEach((blocker, index) => {
      console.log(`${index + 1}. ${blocker.issue}`);
      console.log(`   Required Action: ${blocker.requiredAction || blocker.action || 'N/A'}`);
      if (blocker.disclaimer) {
        console.log(`   Disclaimer Text: ${blocker.disclaimer.text}`);
      }
      console.log('');
    });
  }

  // Warnings
  if (report.warnings.length > 0) {
    console.log('⚠️  WARNINGS (Review recommended):\n');
    report.warnings.forEach((warning, index) => {
      console.log(`${index + 1}. ${warning.issue}`);
      if (warning.suggestion) {
        console.log(`   Suggestion: ${warning.suggestion}`);
      }
      console.log('');
    });
  }

  // Required Changes
  if (report.requiredChanges.length > 0) {
    console.log('📝 REQUIRED CHANGES:\n');
    report.requiredChanges.forEach((change, index) => {
      console.log(`${index + 1}. ${change.issue}`);
      console.log(`   Action: ${change.action || change.requiredAction}`);
      if (change.example) {
        console.log(`   Example: ${change.example}`);
      }
      console.log('');
    });
  }

  // All clear
  if (report.blockers.length === 0 && report.warnings.length === 0) {
    console.log('✅ All compliance checks passed!\n');
  }

  // Save report
  const reportDir = path.join(__dirname, '../logs/compliance-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportFile = path.join(
    reportDir,
    `compliance-report-${regionCode}-${Date.now()}.json`
  );

  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(`💾 Full report saved: ${reportFile}\n`);

  // Exit code
  process.exit(report.canDeploy ? 0 : 1);
}

checkContent().catch(error => {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});


