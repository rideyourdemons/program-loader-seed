#!/usr/bin/env node

/**
 * Content Compliance Audit
 * Scans all existing content for compliance issues (READ-ONLY)
 */

import complianceChecker from '../core/compliance-checker.js';
import firebaseBackend from '../core/firebase-backend.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function auditContent() {
  const args = process.argv.slice(2);
  const targetRegion = args[0] || 'US';
  const outputFile = args[1] || `compliance-audit-${targetRegion}-${Date.now()}.json`;

  console.log('\n' + '='.repeat(70));
  console.log('🔍 Content Compliance Audit');
  console.log('='.repeat(70) + '\n');
  console.log(`Region: ${targetRegion}`);
  console.log(`Mode: READ-ONLY (no changes will be made)\n`);

  const auditReport = {
    timestamp: new Date().toISOString(),
    region: targetRegion,
    summary: {
      totalChecked: 0,
      compliant: 0,
      nonCompliant: 0,
      blockers: 0,
      warnings: 0
    },
    results: []
  };

  try {
    // Initialize Firebase if available
    let firebaseInitialized = false;
    try {
      // Try to initialize (may fail if not configured)
      firebaseInitialized = firebaseBackend.initialized;
    } catch (error) {
      console.log('⚠️  Firebase not available, will check local content only\n');
    }

    // Audit pain points
    console.log('📋 Auditing pain points...');
    if (firebaseInitialized) {
      try {
        const painPoints = await firebaseBackend.readCollection('painPoints', { limit: 100 });
        console.log(`   Found ${painPoints.length} pain points\n`);
        
        for (const painPoint of painPoints) {
          const content = {
            text: painPoint.data.title + ' ' + (painPoint.data.description || ''),
            disclaimers: painPoint.data.disclaimers || [],
            language: painPoint.data.language || 'en',
            ...painPoint.data
          };

          const report = await complianceChecker.checkCompliance(content, targetRegion);
          
          auditReport.results.push({
            type: 'painPoint',
            id: painPoint.id,
            title: painPoint.data.title,
            compliant: report.canDeploy,
            blockers: report.blockers,
            warnings: report.warnings,
            requiredChanges: report.requiredChanges
          });

          auditReport.summary.totalChecked++;
          if (report.canDeploy) {
            auditReport.summary.compliant++;
          } else {
            auditReport.summary.nonCompliant++;
            auditReport.summary.blockers += report.blockers.length;
          }
          auditReport.summary.warnings += report.warnings.length;
        }
      } catch (error) {
        console.log(`   ⚠️  Error reading pain points: ${error.message}\n`);
      }
    }

    // Audit tools
    console.log('🔧 Auditing tools...');
    if (firebaseInitialized) {
      try {
        const tools = await firebaseBackend.readCollection('tools', { limit: 100 });
        console.log(`   Found ${tools.length} tools\n`);
        
        for (const tool of tools) {
          const content = {
            text: tool.data.title + ' ' + (tool.data.description || ''),
            disclaimers: tool.data.disclaimers || [],
            language: tool.data.language || 'en',
            ...tool.data
          };

          const report = await complianceChecker.checkCompliance(content, targetRegion);
          
          auditReport.results.push({
            type: 'tool',
            id: tool.id,
            title: tool.data.title,
            compliant: report.canDeploy,
            blockers: report.blockers,
            warnings: report.warnings,
            requiredChanges: report.requiredChanges
          });

          auditReport.summary.totalChecked++;
          if (report.canDeploy) {
            auditReport.summary.compliant++;
          } else {
            auditReport.summary.nonCompliant++;
            auditReport.summary.blockers += report.blockers.length;
          }
          auditReport.summary.warnings += report.warnings.length;
        }
      } catch (error) {
        console.log(`   ⚠️  Error reading tools: ${error.message}\n`);
      }
    }

    // Generate summary
    console.log('\n' + '='.repeat(70));
    console.log('AUDIT SUMMARY');
    console.log('='.repeat(70) + '\n');
    console.log(`Total Items Checked: ${auditReport.summary.totalChecked}`);
    console.log(`✅ Compliant: ${auditReport.summary.compliant}`);
    console.log(`❌ Non-Compliant: ${auditReport.summary.nonCompliant}`);
    console.log(`🚫 Blockers: ${auditReport.summary.blockers}`);
    console.log(`⚠️  Warnings: ${auditReport.summary.warnings}\n`);

    // Save report
    const reportDir = path.join(__dirname, '../logs/compliance-audits');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, outputFile);
    fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2));

    console.log(`💾 Full audit report saved: ${reportPath}\n`);

    // Show top issues
    if (auditReport.summary.blockers > 0) {
      console.log('🚫 TOP BLOCKERS:\n');
      const blockers = auditReport.results
        .filter(r => r.blockers && r.blockers.length > 0)
        .slice(0, 5);
      
      blockers.forEach((result, index) => {
        console.log(`${index + 1}. ${result.type}: ${result.title}`);
        result.blockers.forEach(blocker => {
          console.log(`   - ${blocker.issue}`);
        });
        console.log('');
      });
    }

    return auditReport;

  } catch (error) {
    console.error('\n❌ Audit error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

auditContent().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});


