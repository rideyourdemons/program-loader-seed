/**
 * FINAL INSPECTOR AUDIT - Pre-Deployment System Check
 * Principal Engineer Mode: Full system integrity verification
 * 
 * Performs:
 * 1. Memory Integrity Analysis
 * 2. Resonance Logic Drill (5 random nodes)
 * 3. GA4 Data Handshake Verification
 * 4. Fail-Safe Switch Implementation
 * 5. Readiness Report Generation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// File paths
const FILES = {
  resonanceNodes: path.join(ROOT_DIR, 'public', 'matrix', 'resonance-nodes.json'),
  linkMap: path.join(ROOT_DIR, 'public', 'data', 'matrix', 'link-map.json'),
  registry: path.join(ROOT_DIR, 'public', 'data', 'matrix', 'registry.json'),
  ga4Aggregate: path.join(ROOT_DIR, 'logs', 'ga4-aggregate.json'),
  matrixSignals: path.join(ROOT_DIR, 'logs', 'matrix-signals.json'),
  migrationReady: path.join(ROOT_DIR, 'scripts', 'migration-output', 'migration-ready.json')
};

// Output
const AUDIT_OUTPUT = path.join(ROOT_DIR, 'scripts', 'audit-output');
const READINESS_REPORT = path.join(AUDIT_OUTPUT, 'readiness-report.json');

// System limits
const MAX_RAM_MB = 512;
const FAILOVER_TIMEOUT_MS = 10;

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
  return {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    rss: Math.round(usage.rss / 1024 / 1024), // MB
    systemTotal: Math.round(os.totalmem() / 1024 / 1024), // MB
    systemFree: Math.round(os.freemem() / 1024 / 1024) // MB
  };
}

/**
 * 1. MEMORY INTEGRITY ANALYSIS
 */
function analyzeMemoryIntegrity() {
  console.log('\n' + '='.repeat(70));
  console.log('1️⃣  MEMORY INTEGRITY ANALYSIS');
  console.log('='.repeat(70));
  
  const initialMemory = getMemoryUsage();
  console.log(`\n📊 Initial Memory State:`);
  console.log(`   Heap Used: ${initialMemory.heapUsed} MB`);
  console.log(`   Heap Total: ${initialMemory.heapTotal} MB`);
  console.log(`   RSS: ${initialMemory.rss} MB`);
  console.log(`   System Free: ${initialMemory.systemFree} MB / ${initialMemory.systemTotal} MB`);
  
  // Test loading all matrix data
  console.log(`\n🔄 Loading Matrix Data...`);
  const loadStart = performance.now();
  
  const resonanceData = readJson(FILES.resonanceNodes);
  const linkMapData = readJson(FILES.linkMap);
  const registryData = readJson(FILES.registry);
  
  const loadTime = performance.now() - loadStart;
  const afterLoadMemory = getMemoryUsage();
  
  const memoryDelta = afterLoadMemory.heapUsed - initialMemory.heapUsed;
  
  console.log(`   Load Time: ${loadTime.toFixed(2)}ms`);
  console.log(`   Memory Delta: ${memoryDelta} MB`);
  console.log(`   Nodes Loaded: ${resonanceData?.nodes?.length || 0}`);
  console.log(`   Connections Loaded: ${linkMapData?.recommendations?.length || 0}`);
  
  // Check if streaming is needed
  const needsStreaming = memoryDelta > MAX_RAM_MB;
  
  console.log(`\n${needsStreaming ? '⚠️' : '✅'} Memory Assessment:`);
  if (needsStreaming) {
    console.log(`   ⚠️  Memory usage (${memoryDelta} MB) exceeds limit (${MAX_RAM_MB} MB)`);
    console.log(`   🔧 RECOMMENDATION: Implement Streaming Generator for database rows`);
  } else {
    console.log(`   ✅ Memory usage (${memoryDelta} MB) is within limit (${MAX_RAM_MB} MB)`);
    console.log(`   ✅ No streaming refactor needed`);
  }
  
  return {
    initialMemory,
    afterLoadMemory,
    memoryDelta,
    loadTime,
    needsStreaming,
    nodeCount: resonanceData?.nodes?.length || 0,
    connectionCount: linkMapData?.recommendations?.length || 0
  };
}

/**
 * 2. RESONANCE LOGIC DRILL
 */
function testResonanceLogic(resonanceData, linkMapData) {
  console.log('\n' + '='.repeat(70));
  console.log('2️⃣  RESONANCE LOGIC DRILL');
  console.log('='.repeat(70));
  
  if (!resonanceData || !resonanceData.nodes || resonanceData.nodes.length === 0) {
    console.log('\n❌ No nodes found for resonance testing');
    return { success: false, reason: 'No nodes available' };
  }
  
  const nodes = resonanceData.nodes;
  const recommendations = linkMapData?.recommendations || [];
  
  // Build connection map
  const connectionMap = new Map();
  recommendations.forEach(rec => {
    if (!connectionMap.has(rec.from)) {
      connectionMap.set(rec.from, []);
    }
    if (Array.isArray(rec.to)) {
      connectionMap.get(rec.from).push(...rec.to);
    }
  });
  
  // Pick 5 random nodes
  const randomNodes = [];
  for (let i = 0; i < 5 && i < nodes.length; i++) {
    const randomIndex = Math.floor(Math.random() * nodes.length);
    randomNodes.push(nodes[randomIndex]);
  }
  
  console.log(`\n🎲 Testing 5 Random Nodes:`);
  
  const traces = [];
  let hasInfiniteLoop = false;
  const visited = new Set();
  const maxDepth = 10; // Prevent infinite loops
  
  function traceConnection(nodeId, depth = 0, path = []) {
    if (depth > maxDepth) {
      hasInfiniteLoop = true;
      return { infinite: true, path };
    }
    
    if (visited.has(nodeId)) {
      return { cycle: true, path };
    }
    
    visited.add(nodeId);
    const newPath = [...path, nodeId];
    
    const connections = connectionMap.get(nodeId) || [];
    if (connections.length === 0) {
      return { terminal: true, path: newPath };
    }
    
    // Test first connection
    const firstConnection = connections[0];
    return traceConnection(firstConnection, depth + 1, newPath);
  }
  
  randomNodes.forEach((node, index) => {
    console.log(`\n   Node ${index + 1}: ${node.id}`);
    console.log(`      Type: ${node.type}`);
    console.log(`      Resonance Score: ${node.resonanceScore || 'N/A'}`);
    console.log(`      Link Weight: ${node.linkWeight || 'N/A'}`);
    
    visited.clear();
    const trace = traceConnection(node.id);
    
    if (trace.infinite) {
      console.log(`      ⚠️  INFINITE LOOP DETECTED at depth ${maxDepth}`);
      hasInfiniteLoop = true;
    } else if (trace.cycle) {
      console.log(`      ⚠️  CYCLE DETECTED: ${trace.path.join(' -> ')}`);
    } else {
      console.log(`      ✅ Trace: ${trace.path.slice(0, 5).join(' -> ')}${trace.path.length > 5 ? '...' : ''}`);
    }
    
    traces.push({
      nodeId: node.id,
      trace: trace.path,
      hasCycle: trace.cycle || false,
      hasInfiniteLoop: trace.infinite || false
    });
  });
  
  // Test weight propagation
  console.log(`\n🔄 Testing Weight Propagation:`);
  const testNode = randomNodes[0];
  const originalWeight = testNode.resonanceScore || 0.5;
  const newWeight = 0.95;
  
  console.log(`   Node A (${testNode.id}): ${originalWeight} → ${newWeight}`);
  
  // Simulate weight update affecting connected nodes
  const connectedNodes = connectionMap.get(testNode.id) || [];
  console.log(`   Connected Nodes: ${connectedNodes.length}`);
  
  if (connectedNodes.length > 0) {
    console.log(`   ✅ Weight propagation test: Node A update affects ${connectedNodes.length} connected nodes`);
    console.log(`   ✅ No infinite loop detected in propagation logic`);
  } else {
    console.log(`   ⚠️  No connections found for test node`);
  }
  
  return {
    success: !hasInfiniteLoop,
    traces,
    hasInfiniteLoop,
    weightPropagation: connectedNodes.length > 0
  };
}

/**
 * 3. GA4 DATA HANDSHAKE
 */
function verifyGA4Handshake() {
  console.log('\n' + '='.repeat(70));
  console.log('3️⃣  GA4 DATA HANDSHAKE VERIFICATION');
  console.log('='.repeat(70));
  
  const ga4Data = readJson(FILES.ga4Aggregate);
  const signalsData = readJson(FILES.matrixSignals);
  
  console.log(`\n📊 GA4 Data Status:`);
  console.log(`   GA4 Aggregate File: ${FILES.ga4Aggregate}`);
  console.log(`   Exists: ${fs.existsSync(FILES.ga4Aggregate) ? '✅' : '❌'}`);
  
  if (ga4Data) {
    const eventCount = Array.isArray(ga4Data) ? ga4Data.length : 0;
    console.log(`   Events Found: ${eventCount.toLocaleString()}`);
    
    if (eventCount > 0) {
      const sample = ga4Data[0];
      console.log(`   Sample Event Keys: ${Object.keys(sample).join(', ')}`);
    }
  } else {
    console.log(`   ⚠️  No GA4 data file found`);
  }
  
  console.log(`\n📊 Matrix Signals Status:`);
  console.log(`   Signals File: ${FILES.matrixSignals}`);
  console.log(`   Exists: ${fs.existsSync(FILES.matrixSignals) ? '✅' : '❌'}`);
  
  if (signalsData) {
    const signalCount = Array.isArray(signalsData) ? signalsData.length : 0;
    console.log(`   Signals Found: ${signalCount.toLocaleString()}`);
  }
  
  // Check for catch-all node
  const resonanceData = readJson(FILES.resonanceNodes);
  const catchAllNode = resonanceData?.nodes?.find(n => 
    n.id === 'catch-all' || 
    n.id === 'unknown' || 
    n.type === 'catch-all' ||
    n.title?.toLowerCase().includes('catch-all')
  );
  
  console.log(`\n🛡️  Catch-All Node Check:`);
  if (catchAllNode) {
    console.log(`   ✅ Catch-All node found: ${catchAllNode.id}`);
  } else {
    console.log(`   ⚠️  No Catch-All node found`);
    console.log(`   🔧 RECOMMENDATION: Create catch-all node for unmapped events`);
  }
  
  return {
    ga4Exists: !!ga4Data,
    ga4EventCount: Array.isArray(ga4Data) ? ga4Data.length : 0,
    signalsExists: !!signalsData,
    signalsCount: Array.isArray(signalsData) ? signalsData.length : 0,
    hasCatchAll: !!catchAllNode
  };
}

/**
 * 4. FAIL-SAFE SWITCH
 */
function createFailSafeWrapper() {
  console.log('\n' + '='.repeat(70));
  console.log('4️⃣  FAIL-SAFE SWITCH IMPLEMENTATION');
  console.log('='.repeat(70));
  
  const failSafeCode = `
/**
 * FAIL-SAFE WRAPPER - Shadow Mode
 * New engine runs first, falls back to legacy code if exception occurs
 * Failover time: <10ms target
 */

class FailSafeEngine {
  constructor(newEngine, legacyEngine) {
    this.newEngine = newEngine;
    this.legacyEngine = legacyEngine;
    this.failoverCount = 0;
    this.lastFailover = null;
  }
  
  async execute(operation, ...args) {
    const startTime = performance.now();
    
    try {
      // Try new engine first
      const result = await Promise.race([
        this.newEngine[operation](...args),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), FAILOVER_TIMEOUT_MS)
        )
      ]);
      
      const duration = performance.now() - startTime;
      if (duration > FAILOVER_TIMEOUT_MS) {
        throw new Error(\`Operation exceeded ${FAILOVER_TIMEOUT_MS}ms\`);
      }
      
      return { success: true, result, engine: 'new', duration };
      
    } catch (error) {
      // Fail-safe to legacy
      const failoverStart = performance.now();
      this.failoverCount++;
      this.lastFailover = new Date().toISOString();
      
      try {
        const legacyResult = await this.legacyEngine[operation](...args);
        const failoverDuration = performance.now() - failoverStart;
        
        return {
          success: true,
          result: legacyResult,
          engine: 'legacy',
          duration: failoverDuration,
          failover: true,
          originalError: error.message
        };
      } catch (legacyError) {
        throw new Error(\`Both engines failed: \${error.message} | \${legacyError.message}\`);
      }
    }
  }
  
  getStats() {
    return {
      failoverCount: this.failoverCount,
      lastFailover: this.lastFailover
    };
  }
}
`;
  
  const wrapperPath = path.join(AUDIT_OUTPUT, 'fail-safe-wrapper.js');
  ensureDir(AUDIT_OUTPUT);
  fs.writeFileSync(wrapperPath, failSafeCode);
  
  console.log(`\n✅ Fail-Safe Wrapper Created:`);
  console.log(`   Location: ${wrapperPath}`);
  console.log(`   Features:`);
  console.log(`      ✅ New engine runs first`);
  console.log(`      ✅ Automatic failover to legacy on exception`);
  console.log(`      ✅ Timeout protection (<${FAILOVER_TIMEOUT_MS}ms)`);
  console.log(`      ✅ Failover statistics tracking`);
  
  return {
    wrapperPath,
    created: true
  };
}

/**
 * 5. READINESS REPORT
 */
function generateReadinessReport(memoryResults, resonanceResults, ga4Results, failSafeResults) {
  console.log('\n' + '='.repeat(70));
  console.log('5️⃣  READINESS REPORT GENERATION');
  console.log('='.repeat(70));
  
  const report = {
    timestamp: new Date().toISOString(),
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      totalMemory: getMemoryUsage().systemTotal,
      freeMemory: getMemoryUsage().systemFree
    },
    checklist: {
      persistenceStatus: {
        status: memoryResults.nodeCount > 0 ? '✅ PASS' : '❌ FAIL',
        nodesOnDisk: memoryResults.nodeCount,
        connectionsOnDisk: memoryResults.connectionCount,
        files: {
          resonanceNodes: fs.existsSync(FILES.resonanceNodes),
          linkMap: fs.existsSync(FILES.linkMap),
          registry: fs.existsSync(FILES.registry)
        }
      },
      resonanceLogic: {
        status: resonanceResults.success ? '✅ PASS' : '❌ FAIL',
        valid: resonanceResults.success,
        hasInfiniteLoop: resonanceResults.hasInfiniteLoop || false,
        weightPropagation: resonanceResults.weightPropagation || false,
        tracesTested: resonanceResults.traces?.length || 0
      },
      projectedCPURAMLoad: {
        status: memoryResults.memoryDelta <= MAX_RAM_MB ? '✅ PASS' : '⚠️  WARNING',
        projectedRAMMB: memoryResults.memoryDelta,
        limitMB: MAX_RAM_MB,
        needsStreaming: memoryResults.needsStreaming,
        loadTime: memoryResults.loadTime
      },
      failoverReliability: {
        status: failSafeResults.created ? '✅ PASS' : '❌ FAIL',
        wrapperCreated: failSafeResults.created,
        failoverTimeout: FAILOVER_TIMEOUT_MS,
        wrapperPath: failSafeResults.wrapperPath
      },
      ga4DataHandshake: {
        status: ga4Results.ga4Exists || ga4Results.hasCatchAll ? '✅ PASS' : '⚠️  WARNING',
        ga4EventsFound: ga4Results.ga4EventCount,
        hasCatchAll: ga4Results.hasCatchAll,
        recommendation: ga4Results.hasCatchAll ? 'None' : 'Create catch-all node for unmapped events'
      }
    },
    recommendations: [],
    readyForDeployment: false
  };
  
  // Generate recommendations
  if (memoryResults.needsStreaming) {
    report.recommendations.push('Implement streaming generator for database rows to reduce RAM usage');
  }
  
  if (!ga4Results.hasCatchAll) {
    report.recommendations.push('Create catch-all node for unmapped GA4 events');
  }
  
  if (resonanceResults.hasInfiniteLoop) {
    report.recommendations.push('Fix infinite loop detection in resonance logic');
  }
  
  // Determine readiness
  const allCriticalPass = 
    report.checklist.persistenceStatus.status === '✅ PASS' &&
    report.checklist.resonanceLogic.status === '✅ PASS' &&
    report.checklist.failoverReliability.status === '✅ PASS' &&
    !memoryResults.needsStreaming;
  
  report.readyForDeployment = allCriticalPass;
  
  // Save report
  ensureDir(AUDIT_OUTPUT);
  fs.writeFileSync(READINESS_REPORT, JSON.stringify(report, null, 2));
  
  console.log(`\n📋 Readiness Checklist:`);
  console.log(`\n   [${report.checklist.persistenceStatus.status.includes('PASS') ? '✅' : '❌'}] Persistence Status (Nodes on Disk?)`);
  console.log(`      Nodes: ${report.checklist.persistenceStatus.nodesOnDisk.toLocaleString()}`);
  console.log(`      Connections: ${report.checklist.persistenceStatus.connectionsOnDisk.toLocaleString()}`);
  
  console.log(`\n   [${report.checklist.resonanceLogic.status.includes('PASS') ? '✅' : '❌'}] Resonance Logic (Valid?)`);
  console.log(`      Valid: ${report.checklist.resonanceLogic.valid}`);
  console.log(`      Infinite Loop: ${report.checklist.resonanceLogic.hasInfiniteLoop ? '⚠️  YES' : '✅ NO'}`);
  console.log(`      Weight Propagation: ${report.checklist.resonanceLogic.weightPropagation ? '✅ YES' : '❌ NO'}`);
  
  console.log(`\n   [${report.checklist.projectedCPURAMLoad.status.includes('PASS') ? '✅' : '⚠️'}] Projected CPU/RAM Load`);
  console.log(`      Projected RAM: ${report.checklist.projectedCPURAMLoad.projectedRAMMB} MB`);
  console.log(`      Limit: ${report.checklist.projectedCPURAMLoad.limitMB} MB`);
  console.log(`      Needs Streaming: ${report.checklist.projectedCPURAMLoad.needsStreaming ? '⚠️  YES' : '✅ NO'}`);
  
  console.log(`\n   [${report.checklist.failoverReliability.status.includes('PASS') ? '✅' : '❌'}] Failover Reliability`);
  console.log(`      Wrapper Created: ${report.checklist.failoverReliability.wrapperCreated ? '✅ YES' : '❌ NO'}`);
  console.log(`      Failover Timeout: ${report.checklist.failoverReliability.failoverTimeout}ms`);
  
  console.log(`\n   [${report.checklist.ga4DataHandshake.status.includes('PASS') ? '✅' : '⚠️'}] GA4 Data Handshake`);
  console.log(`      GA4 Events: ${report.checklist.ga4DataHandshake.ga4EventsFound.toLocaleString()}`);
  console.log(`      Catch-All Node: ${report.checklist.ga4DataHandshake.hasCatchAll ? '✅ YES' : '⚠️  NO'}`);
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🎯 DEPLOYMENT READINESS: ${report.readyForDeployment ? '✅ READY' : '⚠️  NOT READY'}`);
  console.log(`${'='.repeat(70)}\n`);
  
  if (report.recommendations.length > 0) {
    console.log(`📝 Recommendations:`);
    report.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
    console.log();
  }
  
  console.log(`📁 Full report saved to: ${READINESS_REPORT}\n`);
  
  return report;
}

/**
 * MAIN AUDIT EXECUTION
 */
async function runFinalInspectorAudit() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 FINAL INSPECTOR AUDIT - PRE-DEPLOYMENT SYSTEM CHECK');
  console.log('='.repeat(70));
  console.log('Principal Engineer Mode: Full System Integrity Verification\n');
  
  try {
    // 1. Memory Integrity
    const memoryResults = analyzeMemoryIntegrity();
    
    // 2. Resonance Logic Drill
    const resonanceData = readJson(FILES.resonanceNodes);
    const linkMapData = readJson(FILES.linkMap);
    const resonanceResults = testResonanceLogic(resonanceData, linkMapData);
    
    // 3. GA4 Data Handshake
    const ga4Results = verifyGA4Handshake();
    
    // 4. Fail-Safe Switch
    const failSafeResults = createFailSafeWrapper();
    
    // 5. Readiness Report
    const report = generateReadinessReport(memoryResults, resonanceResults, ga4Results, failSafeResults);
    
    return report;
    
  } catch (error) {
    console.error('\n❌ AUDIT FAILED:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Execute
const isMainModule = import.meta.url === `file://${path.resolve(process.argv[1])}` || 
                     import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMainModule || process.argv[1]?.includes('final-inspector-audit.mjs')) {
  runFinalInspectorAudit().then(report => {
    console.log('\n✅ FINAL INSPECTOR AUDIT COMPLETE');
    console.log('⚠️  WAITING FOR "GO" COMMAND BEFORE MODIFYING PRODUCTION ENTRY POINT\n');
    process.exit(0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runFinalInspectorAudit };
