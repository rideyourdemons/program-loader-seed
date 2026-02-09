/**
 * CHAOS PROTOCOL v2.0 - Verification of Hardening Fixes
 * Double-Blind Test: Proving the fixes actually work
 * 
 * Tests:
 * 1. Aorta Re-Attack with Shadow Routes (<50ms target)
 * 2. Tsunami Re-Stress with BatchProcessor (<45MB target)
 * 3. Pressure Chamber - 50-node Singularity Test (5 iterations)
 * 4. Comparative Report (Before vs After)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';
import os from 'os';

// Import hardened engines
import { RouteDiscoveryEngine, EventBatchingEngine, ConvergenceTester } from './matrix-hardening.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

const FILES = {
  resonanceNodes: path.join(ROOT_DIR, 'public', 'matrix', 'resonance-nodes.json'),
  linkMap: path.join(ROOT_DIR, 'public', 'data', 'matrix', 'link-map.json')
};

const CHAOS_OUTPUT = path.join(ROOT_DIR, 'logs');
const CHAOS_REPORT_V2 = path.join(CHAOS_OUTPUT, 'chaos_report_v2.md');
const COMPARATIVE_REPORT = path.join(CHAOS_OUTPUT, 'comparative_report.json');

// Previous results (from v1.0)
const PREVIOUS_RESULTS = {
  aortaRecoveryTime: 150.84,
  aortaAlternativeRoutes: 0,
  tsunamiPeakRAM: 57,
  singularityConverged: false,
  singularityIterations: 0
};

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return null;
  }
}

function getMemoryUsage() {
  const usage = process.memoryUsage();
  return Math.round(usage.heapUsed / 1024 / 1024); // MB
}

/**
 * 1. AORTA RE-ATTACK - Using Shadow Routes
 */
function aortaReAttack(nodes, recommendations) {
  console.log('\n' + '='.repeat(70));
  console.log('1️⃣  AORTA RE-ATTACK - Shadow Route Verification');
  console.log('='.repeat(70));
  
  // Build centrality map
  const centrality = new Map();
  recommendations.forEach(rec => {
    centrality.set(rec.from, (centrality.get(rec.from) || 0) + (Array.isArray(rec.to) ? rec.to.length : 0));
  });
  
  // Get top 1% nodes (same as before)
  const sorted = Array.from(centrality.entries())
    .sort((a, b) => b[1] - a[1]);
  
  const top1PercentCount = Math.max(1, Math.ceil(nodes.length * 0.01));
  const topNodes = sorted.slice(0, top1PercentCount);
  const topNodeIds = topNodes.map(([id]) => id);
  
  console.log(`\n📊 Target Nodes (Top 1%):`);
  console.log(`   Count: ${topNodeIds.length}`);
  console.log(`   Top Node: ${topNodeIds[0]} (${topNodes[0]?.[1]} connections)`);
  
  // Use hardened Route Discovery Engine
  console.log(`\n🛡️  Using Hardened Route Discovery Engine...`);
  const routeEngine = new RouteDiscoveryEngine(nodes, recommendations);
  
  const attackStart = performance.now();
  const healResult = routeEngine.selfHeal(topNodeIds, 50);
  const recoveryTime = performance.now() - attackStart;
  
  console.log(`\n💥 Attack Results:`);
  console.log(`   Nodes Blacked Out: ${topNodeIds.length}`);
  console.log(`   Recovery Time: ${recoveryTime.toFixed(2)}ms`);
  console.log(`   Target: <50ms`);
  console.log(`   Routes Rerouted: ${healResult.rerouted}`);
  console.log(`   Alternative Routes Found: ${healResult.rerouted > 0 ? '✅ YES' : '⚠️  LIMITED'}`);
  
  const success = recoveryTime < 50;
  console.log(`\n${success ? '✅' : '❌'} SUCCESS CRITERIA: ${success ? 'PASSED' : 'FAILED'}`);
  console.log(`   Recovery Time: ${recoveryTime.toFixed(2)}ms ${success ? '✅' : '❌'} (target: <50ms)`);
  
  return {
    success,
    recoveryTime,
    targetTime: 50,
    nodesBlackedOut: topNodeIds.length,
    routesRerouted: healResult.rerouted,
    alternativeRoutes: healResult.rerouted > 0
  };
}

/**
 * 2. TSUNAMI RE-STRESS - Using BatchProcessor
 */
async function tsunamiReStress() {
  console.log('\n' + '='.repeat(70));
  console.log('2️⃣  TSUNAMI RE-STRESS - BatchProcessor Verification');
  console.log('='.repeat(70));
  
  // Generate 162,004 events
  const events = [];
  for (let i = 0; i < 162004; i++) {
    events.push({
      path: `/tools/tool-${i % 1000}`,
      impressions: Math.floor(Math.random() * 1000),
      clicks: Math.floor(Math.random() * 100),
      ctr: Math.random() * 0.1,
      dwellSeconds: Math.random() * 300,
      timestamp: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  console.log(`\n🌊 Streaming ${events.length.toLocaleString()} events through BatchProcessor...`);
  
  // Use hardened Event Batching Engine
  const batchEngine = new EventBatchingEngine(45, 500); // 45MB limit, 500 batch size
  const initialMemory = getMemoryUsage();
  
  let batchCount = 0;
  let peakMemory = initialMemory;
  let totalProcessed = 0;
  
  const startTime = performance.now();
  
  for await (const batchResult of batchEngine.processEvents(events)) {
    batchCount++;
    
    if (batchResult.memoryUsage > peakMemory) {
      peakMemory = batchResult.memoryUsage;
    }
    
    totalProcessed = batchResult.eventsProcessed;
    
    // Progress updates
    if (batchCount % 10 === 0 || batchCount === batchResult.totalBatches) {
      const progress = (batchCount / batchResult.totalBatches * 100).toFixed(1);
      console.log(`   Progress: ${progress}% | RAM: ${batchResult.memoryUsage} MB | Peak: ${peakMemory} MB`);
    }
  }
  
  const totalTime = performance.now() - startTime;
  const batchStats = batchEngine.getStats();
  
  console.log(`\n📊 Tsunami Results:`);
  console.log(`   Events Processed: ${totalProcessed.toLocaleString()}`);
  console.log(`   Total Time: ${totalTime.toFixed(2)}ms`);
  console.log(`   Events/Second: ${(totalProcessed / (totalTime / 1000)).toLocaleString()}`);
  console.log(`   Initial RAM: ${initialMemory} MB`);
  console.log(`   Peak RAM: ${peakMemory} MB`);
  console.log(`   Target: <45 MB`);
  
  const success = peakMemory < 45;
  console.log(`\n${success ? '✅' : '❌'} SUCCESS CRITERIA: ${success ? 'PASSED' : 'FAILED'}`);
  console.log(`   Peak RAM: ${peakMemory} MB ${success ? '✅' : '❌'} (target: <45 MB)`);
  
  return {
    success,
    peakMemory,
    targetMemory: 45,
    eventsProcessed: totalProcessed,
    totalTime,
    eventsPerSecond: totalProcessed / (totalTime / 1000)
  };
}

/**
 * 3. PRESSURE CHAMBER - 50-Node Singularity Test
 */
function pressureChamber(nodes, recommendations) {
  console.log('\n' + '='.repeat(70));
  console.log('3️⃣  PRESSURE CHAMBER - 50-Node Singularity Test');
  console.log('='.repeat(70));
  
  // Use hardened Convergence Tester
  const convergenceTester = new ConvergenceTester(nodes, recommendations);
  
  // Create 50-node cluster
  console.log(`\n🔬 Creating 50-Node Test Cluster...`);
  const testCluster = convergenceTester.createTestCluster(50);
  
  console.log(`   Cluster Size: ${testCluster.length} nodes`);
  console.log(`   Cluster Nodes: ${testCluster.slice(0, 5).join(', ')}...`);
  
  // Test convergence with normalization clamp
  console.log(`\n💥 Injecting Maximum Resonance...`);
  const convergenceResult = convergenceTester.testConvergence(testCluster, 5);
  
  console.log(`\n📊 Convergence Results:`);
  console.log(`   Converged: ${convergenceResult.converged ? '✅ YES' : '❌ NO'}`);
  console.log(`   Iterations: ${convergenceResult.iterations}`);
  console.log(`   Target: ≤5 iterations`);
  console.log(`   Normalization: ${convergenceResult.converged ? '✅ Working' : '⚠️  Needed'}`);
  
  const success = convergenceResult.converged && convergenceResult.iterations <= 5;
  console.log(`\n${success ? '✅' : '❌'} SUCCESS CRITERIA: ${success ? 'PASSED' : 'FAILED'}`);
  console.log(`   Converged: ${convergenceResult.converged ? '✅' : '❌'}`);
  console.log(`   Iterations: ${convergenceResult.iterations} ${success ? '✅' : '❌'} (target: ≤5)`);
  
  return {
    success,
    converged: convergenceResult.converged,
    iterations: convergenceResult.iterations,
    targetIterations: 5,
    clusterSize: testCluster.length
  };
}

/**
 * 4. COMPARATIVE REPORT
 */
function generateComparativeReport(aortaResults, tsunamiResults, singularityResults) {
  console.log('\n' + '='.repeat(70));
  console.log('4️⃣  COMPARATIVE REPORT - Before vs After');
  console.log('='.repeat(70));
  
  const comparison = {
    timestamp: new Date().toISOString(),
    aortaAttack: {
      before: {
        recoveryTime: PREVIOUS_RESULTS.aortaRecoveryTime,
        alternativeRoutes: PREVIOUS_RESULTS.aortaAlternativeRoutes,
        status: '❌ FAILED'
      },
      after: {
        recoveryTime: aortaResults.recoveryTime,
        alternativeRoutes: aortaResults.rerouted,
        status: aortaResults.success ? '✅ PASSED' : '❌ FAILED'
      },
      improvement: {
        timeReduction: `${((PREVIOUS_RESULTS.aortaRecoveryTime - aortaResults.recoveryTime) / PREVIOUS_RESULTS.aortaRecoveryTime * 100).toFixed(1)}%`,
        timeDelta: `${(PREVIOUS_RESULTS.aortaRecoveryTime - aortaResults.recoveryTime).toFixed(2)}ms faster`
      }
    },
    tsunami: {
      before: {
        peakRAM: PREVIOUS_RESULTS.tsunamiPeakRAM,
        status: '❌ FAILED'
      },
      after: {
        peakRAM: tsunamiResults.peakMemory,
        status: tsunamiResults.success ? '✅ PASSED' : '❌ FAILED'
      },
      improvement: {
        ramReduction: `${(PREVIOUS_RESULTS.tsunamiPeakRAM - tsunamiResults.peakMemory).toFixed(1)} MB`,
        percentageReduction: `${((PREVIOUS_RESULTS.tsunamiPeakRAM - tsunamiResults.peakMemory) / PREVIOUS_RESULTS.tsunamiPeakRAM * 100).toFixed(1)}%`
      }
    },
    singularity: {
      before: {
        converged: PREVIOUS_RESULTS.singularityConverged,
        iterations: PREVIOUS_RESULTS.singularityIterations,
        status: '⚠️  NOT TESTED'
      },
      after: {
        converged: singularityResults.converged,
        iterations: singularityResults.iterations,
        status: singularityResults.success ? '✅ PASSED' : '❌ FAILED'
      },
      improvement: {
        tested: true,
        converged: singularityResults.converged
      }
    },
    overall: {
      allTestsPassed: aortaResults.success && tsunamiResults.success && singularityResults.success,
      status: (aortaResults.success && tsunamiResults.success && singularityResults.success) 
        ? 'BATTLE-HARDENED AND READY FOR SWAP' 
        : 'VULNERABILITIES REMAIN'
    }
  };
  
  // Display comparison
  console.log(`\n📊 AORTA ATTACK COMPARISON:`);
  console.log(`   Before: ${PREVIOUS_RESULTS.aortaRecoveryTime.toFixed(2)}ms recovery, ${PREVIOUS_RESULTS.aortaAlternativeRoutes} routes`);
  console.log(`   After:  ${aortaResults.recoveryTime.toFixed(2)}ms recovery, ${aortaResults.rerouted} routes`);
  console.log(`   Improvement: ${comparison.aortaAttack.improvement.timeReduction} faster (${comparison.aortaAttack.improvement.timeDelta})`);
  
  console.log(`\n📊 TSUNAMI COMPARISON:`);
  console.log(`   Before: ${PREVIOUS_RESULTS.tsunamiPeakRAM} MB peak RAM`);
  console.log(`   After:  ${tsunamiResults.peakMemory} MB peak RAM`);
  console.log(`   Improvement: ${comparison.tsunami.improvement.ramReduction} reduction (${comparison.tsunami.improvement.percentageReduction})`);
  
  console.log(`\n📊 SINGULARITY COMPARISON:`);
  console.log(`   Before: ${PREVIOUS_RESULTS.singularityConverged ? 'Converged' : 'Not Tested'}`);
  console.log(`   After:  ${singularityResults.converged ? 'Converged' : 'Failed'} in ${singularityResults.iterations} iterations`);
  console.log(`   Improvement: ${singularityResults.converged ? '✅ Validated' : '❌ Failed'}`);
  
  // Generate markdown report
  let markdown = `# Chaos Protocol v2.0 - Verification Report\n\n`;
  markdown += `**Generated:** ${new Date().toISOString()}\n\n`;
  markdown += `## Status: ${comparison.overall.status}\n\n`;
  
  markdown += `## Comparative Analysis\n\n`;
  
  markdown += `### 1. Aorta Attack - Recovery Time\n\n`;
  markdown += `| Metric | Before (Vulnerable) | After (Hardened) | Improvement |\n`;
  markdown += `|--------|---------------------|------------------|-------------|\n`;
  markdown += `| Recovery Time | ${PREVIOUS_RESULTS.aortaRecoveryTime.toFixed(2)}ms | ${aortaResults.recoveryTime.toFixed(2)}ms | ${comparison.aortaAttack.improvement.timeReduction} faster |\n`;
  markdown += `| Alternative Routes | ${PREVIOUS_RESULTS.aortaAlternativeRoutes} | ${aortaResults.rerouted} | ${aortaResults.rerouted > 0 ? '✅ Implemented' : '⚠️  Limited'} |\n`;
  markdown += `| Status | ❌ FAILED | ${aortaResults.success ? '✅ PASSED' : '❌ FAILED'} | |\n\n`;
  
  markdown += `### 2. Tsunami - Peak RAM\n\n`;
  markdown += `| Metric | Before (Vulnerable) | After (Hardened) | Improvement |\n`;
  markdown += `|--------|---------------------|------------------|-------------|\n`;
  markdown += `| Peak RAM | ${PREVIOUS_RESULTS.tsunamiPeakRAM} MB | ${tsunamiResults.peakMemory} MB | ${comparison.tsunami.improvement.ramReduction} reduction |\n`;
  markdown += `| Status | ❌ FAILED | ${tsunamiResults.success ? '✅ PASSED' : '❌ FAILED'} | |\n\n`;
  
  markdown += `### 3. Singularity - Weight Convergence\n\n`;
  markdown += `| Metric | Before (Vulnerable) | After (Hardened) | Improvement |\n`;
  markdown += `|--------|---------------------|------------------|-------------|\n`;
  markdown += `| Converged | ${PREVIOUS_RESULTS.singularityConverged ? '✅' : '⚠️  Not Tested'} | ${singularityResults.converged ? '✅' : '❌'} | ${singularityResults.converged ? '✅ Validated' : '❌ Failed'} |\n`;
  markdown += `| Iterations | ${PREVIOUS_RESULTS.singularityIterations} | ${singularityResults.iterations} | ${singularityResults.iterations <= 5 ? '✅ Within Limit' : '❌ Exceeded'} |\n`;
  markdown += `| Status | ⚠️  NOT TESTED | ${singularityResults.success ? '✅ PASSED' : '❌ FAILED'} | |\n\n`;
  
  markdown += `## Summary\n\n`;
  markdown += `### Success Criteria\n\n`;
  markdown += `- ✅ Aorta Recovery: ${aortaResults.recoveryTime.toFixed(2)}ms ${aortaResults.success ? '✅' : '❌'} (target: <50ms)\n`;
  markdown += `- ✅ Tsunami RAM: ${tsunamiResults.peakMemory} MB ${tsunamiResults.success ? '✅' : '❌'} (target: <45 MB)\n`;
  markdown += `- ✅ Singularity Convergence: ${singularityResults.iterations} iterations ${singularityResults.success ? '✅' : '❌'} (target: ≤5)\n\n`;
  
  markdown += `## Conclusion\n\n`;
  
  if (comparison.overall.allTestsPassed) {
    markdown += `**SYSTEM IS BATTLE-HARDENED AND READY FOR SWAP**\n\n`;
    markdown += `All hardening fixes verified:\n`;
    markdown += `- ✅ Route discovery working (<50ms recovery)\n`;
    markdown += `- ✅ Event batching controlling RAM (<45 MB)\n`;
    markdown += `- ✅ Weight convergence stable (≤5 iterations)\n`;
    markdown += `- ✅ System demonstrates antifragility (faster and leaner after fixes)\n`;
  } else {
    markdown += `**VULNERABILITIES REMAIN**\n\n`;
    markdown += `Some tests did not meet success criteria. Review results above.\n`;
  }
  
  // Save reports
  ensureDir(CHAOS_OUTPUT);
  fs.writeFileSync(CHAOS_REPORT_V2, markdown);
  fs.writeFileSync(COMPARATIVE_REPORT, JSON.stringify(comparison, null, 2));
  
  console.log(`\n📁 Reports saved:`);
  console.log(`   - ${CHAOS_REPORT_V2}`);
  console.log(`   - ${COMPARATIVE_REPORT}\n`);
  
  return comparison;
}

/**
 * MAIN EXECUTION
 */
async function runChaosProtocolV2() {
  console.log('\n' + '='.repeat(70));
  console.log('☠️  CHAOS PROTOCOL v2.0 - VERIFICATION OF HARDENING FIXES');
  console.log('='.repeat(70));
  console.log('Double-Blind Test: Proving the fixes actually work\n');
  
  try {
    // Load data
    const resonanceData = readJson(FILES.resonanceNodes);
    const linkMapData = readJson(FILES.linkMap);
    
    if (!resonanceData || !linkMapData) {
      console.error('❌ Required data files not found');
      process.exit(1);
    }
    
    const nodes = resonanceData.nodes || [];
    const recommendations = linkMapData.recommendations || [];
    
    // 1. Aorta Re-Attack
    const aortaResults = aortaReAttack(nodes, recommendations);
    
    // 2. Tsunami Re-Stress
    const tsunamiResults = await tsunamiReStress();
    
    // 3. Pressure Chamber
    const singularityResults = pressureChamber(nodes, recommendations);
    
    // 4. Comparative Report
    const comparison = generateComparativeReport(aortaResults, tsunamiResults, singularityResults);
    
    // Final status
    console.log('\n' + '='.repeat(70));
    if (comparison.overall.allTestsPassed) {
      console.log('✅ SYSTEM IS BATTLE-HARDENED AND READY FOR SWAP');
    } else {
      console.log('⚠️  VULNERABILITIES REMAIN');
    }
    console.log('='.repeat(70) + '\n');
    
    return comparison;
    
  } catch (error) {
    console.error('\n❌ CHAOS PROTOCOL v2.0 FAILED:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Execute
if (import.meta.url === `file://${path.resolve(process.argv[1])}` || 
    process.argv[1]?.includes('chaos-protocol-v2.mjs')) {
  runChaosProtocolV2().then(comparison => {
    process.exit(0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runChaosProtocolV2 };
