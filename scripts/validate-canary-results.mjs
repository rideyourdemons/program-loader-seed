/**
 * CANARY TEST VALIDATION
 * Validates results from 1% canary test (1,640 nodes)
 * 
 * Checks:
 * 1. Row Count: Exactly 1,640 nodes processed
 * 2. Anchor Alignment: Gold Standard anchors match
 * 3. Integrity: No structural corruption
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

const OUTPUT_FILE = path.join(ROOT_DIR, 'scripts', 'migration-output', 'migration-ready.json');
const CANARY_LOG_FILE = path.join(ROOT_DIR, 'scripts', 'migration-output', 'canary-test-log.jsonl');
const GOLD_STANDARD_FILE = path.join(ROOT_DIR, 'scripts', 'gold-standard-anchors.mjs');

// Gold Standard Anchors (must match)
const GOLD_STANDARD_ANCHORS = [
  'fathers-sons', 'mothers-daughters', 'the-patriarch', 'the-matriarch',
  'young-lions', 'young-women', 'the-professional', 'the-griever',
  'the-addict', 'the-protector', 'men-solo', 'women-solo'
];

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return null;
  }
}

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.trim().split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
  } catch (error) {
    return [];
  }
}

function validateCanaryResults() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 CANARY TEST VALIDATION');
  console.log('='.repeat(70) + '\n');
  
  const results = {
    rowCount: { passed: false, message: '' },
    anchorAlignment: { passed: false, message: '' },
    integrity: { passed: false, message: '' },
    ramSafety: { passed: false, message: '' },
    overall: false
  };
  
  // 1. Check Row Count (exactly 1,640 nodes)
  console.log('1️⃣  Row Count Validation...');
  const migrationData = readJson(OUTPUT_FILE);
  
  if (!migrationData) {
    console.error('❌ Migration output file not found:', OUTPUT_FILE);
    results.rowCount.message = 'Output file missing';
    return results;
  }
  
  const totalNodes = migrationData.statistics?.totalNodes || 0;
  const expectedCount = 1640;
  
  if (totalNodes === expectedCount) {
    console.log(`   ✅ Row Count: ${totalNodes.toLocaleString()} nodes (exactly ${expectedCount.toLocaleString()})`);
    results.rowCount.passed = true;
    results.rowCount.message = `Correct: ${totalNodes} nodes`;
  } else {
    console.log(`   ❌ Row Count: ${totalNodes.toLocaleString()} nodes (expected ${expectedCount.toLocaleString()})`);
    results.rowCount.message = `Mismatch: ${totalNodes} vs ${expectedCount}`;
  }
  
  // 2. Anchor Alignment (check Gold Standard anchors)
  console.log('\n2️⃣  Anchor Alignment Validation...');
  const allNodes = [
    ...(migrationData.collections?.gates || []),
    ...(migrationData.collections?.painPoints || []),
    ...(migrationData.collections?.tools || []),
    ...(migrationData.collections?.insights || []),
    ...(migrationData.collections?.other || [])
  ];
  
  const foundAnchors = new Set();
  const missingAnchors = [];
  
  // Check if anchor IDs exist in nodes
  GOLD_STANDARD_ANCHORS.forEach(anchorId => {
    const found = allNodes.some(node => 
      node.ID === anchorId || 
      node.id === anchorId || 
      node.cluster === anchorId ||
      node.ParentID === anchorId
    );
    
    if (found) {
      foundAnchors.add(anchorId);
    } else {
      missingAnchors.push(anchorId);
    }
  });
  
  if (missingAnchors.length === 0) {
    console.log(`   ✅ Anchor Alignment: All ${GOLD_STANDARD_ANCHORS.length} Gold Standard anchors found`);
    results.anchorAlignment.passed = true;
    results.anchorAlignment.message = `All ${GOLD_STANDARD_ANCHORS.length} anchors found`;
  } else {
    console.log(`   ⚠️  Anchor Alignment: ${missingAnchors.length} anchors missing:`);
    missingAnchors.forEach(anchor => {
      console.log(`      - ${anchor}`);
    });
    results.anchorAlignment.message = `${missingAnchors.length} anchors missing: ${missingAnchors.join(', ')}`;
  }
  
  // Show found anchors
  if (foundAnchors.size > 0) {
    console.log(`   Found anchors: ${Array.from(foundAnchors).join(', ')}`);
  }
  
  // 3. Integrity Check (structural validation)
  console.log('\n3️⃣  Integrity Validation...');
  const integrityIssues = [];
  
  // Check for required fields
  allNodes.forEach((node, index) => {
    if (!node.ID && !node.id) {
      integrityIssues.push(`Node ${index}: Missing ID field`);
    }
    if (typeof node.RiskWeight !== 'number' || node.RiskWeight < 0 || node.RiskWeight > 1) {
      integrityIssues.push(`Node ${node.ID || index}: Invalid RiskWeight (${node.RiskWeight})`);
    }
  });
  
  // Check for circular references (basic check)
  const nodeIds = new Set(allNodes.map(n => n.ID || n.id).filter(Boolean));
  let circularRefs = 0;
  allNodes.forEach(node => {
    const parentId = node.ParentID || node.parentID;
    if (parentId && nodeIds.has(parentId)) {
      // Check if parent points back to this node
      const parent = allNodes.find(n => (n.ID || n.id) === parentId);
      if (parent && (parent.ParentID || parent.parentID) === (node.ID || node.id)) {
        circularRefs++;
      }
    }
  });
  
  if (integrityIssues.length === 0 && circularRefs === 0) {
    console.log(`   ✅ Integrity: No structural issues detected`);
    results.integrity.passed = true;
    results.integrity.message = 'No issues found';
  } else {
    if (integrityIssues.length > 0) {
      console.log(`   ⚠️  Integrity Issues: ${integrityIssues.length} problems found`);
      integrityIssues.slice(0, 5).forEach(issue => {
        console.log(`      - ${issue}`);
      });
      if (integrityIssues.length > 5) {
        console.log(`      ... and ${integrityIssues.length - 5} more`);
      }
    }
    if (circularRefs > 0) {
      console.log(`   ⚠️  Circular References: ${circularRefs} detected`);
    }
    results.integrity.message = `${integrityIssues.length} issues, ${circularRefs} circular refs`;
  }
  
  // 4. RAM Safety Check (from heartbeat logs)
  console.log('\n4️⃣  RAM Safety Validation...');
  const heartbeatLogs = readJsonl(CANARY_LOG_FILE);
  
  if (heartbeatLogs.length > 0) {
    const peakRam = Math.max(...heartbeatLogs.map(log => log.peakRamMB || 0));
    const finalRam = heartbeatLogs[heartbeatLogs.length - 1]?.ramMB || 0;
    const ramHardKill = 150;
    
    if (peakRam <= ramHardKill) {
      console.log(`   ✅ RAM Safety: Peak RAM ${peakRam} MB (under ${ramHardKill} MB limit)`);
      results.ramSafety.passed = true;
      results.ramSafety.message = `Peak: ${peakRam} MB`;
    } else {
      console.log(`   ⚠️  RAM Safety: Peak RAM ${peakRam} MB (exceeded ${ramHardKill} MB limit)`);
      results.ramSafety.message = `Peak: ${peakRam} MB (exceeded limit)`;
    }
    
    console.log(`   Final RAM: ${finalRam} MB`);
  } else {
    console.log(`   ⚠️  RAM Safety: No heartbeat logs found`);
    results.ramSafety.message = 'No logs available';
  }
  
  // Overall result
  results.overall = results.rowCount.passed && 
                    results.anchorAlignment.passed && 
                    results.integrity.passed && 
                    results.ramSafety.passed;
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`   Row Count:        ${results.rowCount.passed ? '✅ PASS' : '❌ FAIL'} - ${results.rowCount.message}`);
  console.log(`   Anchor Alignment: ${results.anchorAlignment.passed ? '✅ PASS' : '⚠️  WARN'} - ${results.anchorAlignment.message}`);
  console.log(`   Integrity:        ${results.integrity.passed ? '✅ PASS' : '❌ FAIL'} - ${results.integrity.message}`);
  console.log(`   RAM Safety:       ${results.ramSafety.passed ? '✅ PASS' : '⚠️  WARN'} - ${results.ramSafety.message}`);
  console.log('='.repeat(70));
  
  if (results.overall) {
    console.log('\n✅ CANARY TEST PASSED - Safe to proceed with full migration');
  } else {
    console.log('\n⚠️  CANARY TEST HAS ISSUES - Review before full migration');
  }
  
  console.log('='.repeat(70) + '\n');
  
  return results;
}

// Execute
try {
  const results = validateCanaryResults();
  process.exit(results.overall ? 0 : 1);
} catch (error) {
  console.error('❌ Validation failed:', error);
  process.exit(1);
}
