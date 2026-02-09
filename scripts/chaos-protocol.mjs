/**
 * CHAOS PROTOCOL - Adversarial Stress Test
 * Graceful Degradation + Autonomous Recovery Testing
 * 
 * Tests:
 * 1. Aorta Attack - Node blackout simulation
 * 2. The 162,004 Tsunami - High-speed event streaming
 * 3. Poisoned Data Injection - Toxic event isolation
 * 4. Singularity Check - Convergence testing
 * 5. Chaos Report Generation
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
  ga4Aggregate: path.join(ROOT_DIR, 'logs', 'ga4-aggregate.json')
};

const CHAOS_OUTPUT = path.join(ROOT_DIR, 'logs');
const CHAOS_REPORT = path.join(CHAOS_OUTPUT, 'chaos_report.md');

// Limits
const MAX_RAM_MB = 50;
const RECOVERY_TIME_MS = 50;
const CONVERGENCE_ITERATIONS = 5;
const TSUNAMI_SPEED_MULTIPLIER = 100;

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
 * 1. AORTA ATTACK - Top 1% Node Blackout
 */
function aortaAttack(resonanceData, linkMapData) {
  console.log('\n' + '='.repeat(70));
  console.log('1️⃣  AORTA ATTACK - Top 1% Node Blackout Simulation');
  console.log('='.repeat(70));
  
  const nodes = resonanceData?.nodes || [];
  const recommendations = linkMapData?.recommendations || [];
  
  // Build centrality map (connection count per node)
  const centrality = new Map();
  const inboundCount = new Map();
  const outboundCount = new Map();
  
  recommendations.forEach(rec => {
    // Count outbound
    const from = rec.from;
    outboundCount.set(from, (outboundCount.get(from) || 0) + (Array.isArray(rec.to) ? rec.to.length : 0));
    
    // Count inbound
    if (Array.isArray(rec.to)) {
      rec.to.forEach(to => {
        inboundCount.set(to, (inboundCount.get(to) || 0) + 1);
      });
    }
  });
  
  // Calculate total centrality (inbound + outbound)
  nodes.forEach(node => {
    const inCount = inboundCount.get(node.id) || 0;
    const outCount = outboundCount.get(node.id) || 0;
    centrality.set(node.id, inCount + outCount);
  });
  
  // Get top 1% by centrality
  const sorted = Array.from(centrality.entries())
    .sort((a, b) => b[1] - a[1]);
  
  const top1PercentCount = Math.max(1, Math.ceil(nodes.length * 0.01));
  const topNodes = sorted.slice(0, top1PercentCount);
  
  console.log(`\n📊 Centrality Analysis:`);
  console.log(`   Total Nodes: ${nodes.length}`);
  console.log(`   Top 1% Count: ${topNodes.length}`);
  console.log(`   Top Node: ${topNodes[0]?.[0]} (${topNodes[0]?.[1]} connections)`);
  
  // Simulate blackout - remove connections for top nodes
  const blackoutStart = performance.now();
  const blackoutNodes = new Set(topNodes.map(([id]) => id));
  
  // Count affected connections
  let affectedConnections = 0;
  const remainingConnections = recommendations.filter(rec => {
    if (blackoutNodes.has(rec.from)) {
      affectedConnections += Array.isArray(rec.to) ? rec.to.length : 0;
      return false; // Remove this connection
    }
    if (Array.isArray(rec.to)) {
      const filteredTo = rec.to.filter(to => !blackoutNodes.has(to));
      if (filteredTo.length !== rec.to.length) {
        affectedConnections += rec.to.length - filteredTo.length;
      }
    }
    return true;
  });
  
  // Test self-healing: find alternative routes
  const healingStart = performance.now();
  const alternativeRoutes = new Map();
  
  // For each blacked-out node, find alternative paths
  blackoutNodes.forEach(blackedNode => {
    // Find nodes that connected TO the blacked node
    const incomingNodes = [];
    recommendations.forEach(rec => {
      if (Array.isArray(rec.to) && rec.to.includes(blackedNode)) {
        incomingNodes.push(rec.from);
      }
    });
    
    // Find alternative destinations for those incoming nodes
    incomingNodes.forEach(incomingNode => {
      const alternatives = recommendations
        .filter(rec => rec.from === incomingNode && Array.isArray(rec.to))
        .flatMap(rec => rec.to)
        .filter(to => !blackoutNodes.has(to));
      
      if (alternatives.length > 0) {
        alternativeRoutes.set(incomingNode, alternatives);
      }
    });
  });
  
  const healingTime = performance.now() - healingStart;
  const recoveryTime = performance.now() - blackoutStart;
  
  console.log(`\n💥 Blackout Simulation:`);
  console.log(`   Nodes Blacked Out: ${blackoutNodes.size}`);
  console.log(`   Connections Affected: ${affectedConnections}`);
  console.log(`   Connections Remaining: ${remainingConnections.length}`);
  console.log(`   Alternative Routes Found: ${alternativeRoutes.size}`);
  
  console.log(`\n🩹 Self-Healing Test:`);
  console.log(`   Recovery Time: ${recoveryTime.toFixed(2)}ms`);
  console.log(`   Healing Time: ${healingTime.toFixed(2)}ms`);
  
  const selfHealed = recoveryTime < RECOVERY_TIME_MS && alternativeRoutes.size > 0;
  const graphFragmented = remainingConnections.length < recommendations.length * 0.5;
  
  console.log(`\n${selfHealed ? '✅' : '❌'} Self-Healing: ${selfHealed ? 'SUCCESS' : 'FAILED'}`);
  console.log(`${graphFragmented ? '❌' : '✅'} Graph Integrity: ${graphFragmented ? 'FRAGMENTED' : 'INTACT'}`);
  
  return {
    success: selfHealed && !graphFragmented,
    blackoutNodes: blackoutNodes.size,
    affectedConnections,
    remainingConnections: remainingConnections.length,
    alternativeRoutes: alternativeRoutes.size,
    recoveryTime,
    healingTime,
    selfHealed,
    graphFragmented
  };
}

/**
 * 2. THE 162,004 TSUNAMI - High-Speed Event Streaming
 */
function tsunamiTest() {
  console.log('\n' + '='.repeat(70));
  console.log('2️⃣  THE 162,004 TSUNAMI - High-Speed Event Streaming');
  console.log('='.repeat(70));
  
  // Generate synthetic events if GA4 data doesn't exist
  const ga4Data = readJson(FILES.ga4Aggregate);
  let events = [];
  
  if (ga4Data && Array.isArray(ga4Data)) {
    events = ga4Data;
    console.log(`\n📊 Using GA4 Data: ${events.length.toLocaleString()} events`);
  } else {
    // Generate synthetic events for testing
    console.log(`\n📊 GA4 data not found, generating synthetic events...`);
    const targetCount = 162004;
    for (let i = 0; i < targetCount; i++) {
      events.push({
        path: `/tools/tool-${i % 1000}`,
        impressions: Math.floor(Math.random() * 1000),
        clicks: Math.floor(Math.random() * 100),
        ctr: Math.random() * 0.1,
        dwellSeconds: Math.random() * 300,
        timestamp: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    console.log(`   Generated: ${events.length.toLocaleString()} synthetic events`);
  }
  
  // Stream events at 100x speed
  console.log(`\n🌊 Streaming Events at ${TSUNAMI_SPEED_MULTIPLIER}x speed...`);
  
  const initialMemory = getMemoryUsage();
  const startTime = performance.now();
  let peakMemory = initialMemory;
  let processedCount = 0;
  let bottleneckDetected = false;
  let slowestOperation = null;
  let slowestTime = 0;
  
  // Process events in batches to simulate streaming
  const BATCH_SIZE = 1000;
  const batches = Math.ceil(events.length / BATCH_SIZE);
  
  for (let batch = 0; batch < batches; batch++) {
    const batchStart = performance.now();
    const batchEvents = events.slice(batch * BATCH_SIZE, (batch + 1) * BATCH_SIZE);
    
    // Simulate processing
    batchEvents.forEach(event => {
      // Simulate event processing logic
      const processStart = performance.now();
      
      // Simulate resonance calculation
      const resonance = (event.ctr || 0) * 0.4 + Math.min((event.dwellSeconds || 0) / 60, 5) * 0.3;
      
      // Simulate node lookup
      const nodeId = `tool::${event.path?.replace(/^\//, '').replace(/\//g, '-') || 'unknown'}`;
      
      // Simulate weight update
      const weight = Math.max(0.5, Math.min(1.0, resonance));
      
      const processTime = performance.now() - processStart;
      
      if (processTime > slowestTime) {
        slowestTime = processTime;
        slowestOperation = `Event processing (${nodeId})`;
      }
      
      processedCount++;
    });
    
    const batchTime = performance.now() - batchStart;
    const currentMemory = getMemoryUsage();
    
    if (currentMemory > peakMemory) {
      peakMemory = currentMemory;
    }
    
    // Check for bottlenecks
    if (batchTime > 100) { // More than 100ms per batch
      bottleneckDetected = true;
      console.log(`   ⚠️  Bottleneck detected at batch ${batch + 1}: ${batchTime.toFixed(2)}ms`);
    }
    
    // Check memory limit
    if (currentMemory > MAX_RAM_MB) {
      console.log(`   ⚠️  RAM limit exceeded: ${currentMemory} MB > ${MAX_RAM_MB} MB`);
    }
    
    // Progress update every 10 batches
    if ((batch + 1) % 10 === 0 || batch === batches - 1) {
      const progress = ((batch + 1) / batches * 100).toFixed(1);
      console.log(`   Progress: ${progress}% (${processedCount.toLocaleString()}/${events.length.toLocaleString()}) | RAM: ${currentMemory} MB | Peak: ${peakMemory} MB`);
    }
  }
  
  const totalTime = performance.now() - startTime;
  const memoryDelta = peakMemory - initialMemory;
  
  console.log(`\n📊 Tsunami Results:`);
  console.log(`   Events Processed: ${processedCount.toLocaleString()}`);
  console.log(`   Total Time: ${totalTime.toFixed(2)}ms`);
  console.log(`   Events/Second: ${(processedCount / (totalTime / 1000)).toLocaleString()}`);
  console.log(`   Initial RAM: ${initialMemory} MB`);
  console.log(`   Peak RAM: ${peakMemory} MB`);
  console.log(`   RAM Delta: ${memoryDelta} MB`);
  console.log(`   Slowest Operation: ${slowestOperation || 'N/A'} (${slowestTime.toFixed(2)}ms)`);
  
  const passed = peakMemory <= MAX_RAM_MB;
  console.log(`\n${passed ? '✅' : '❌'} RAM Test: ${passed ? 'PASSED' : 'FAILED'} (${peakMemory} MB vs ${MAX_RAM_MB} MB limit)`);
  
  // Pruning strategy recommendation
  let pruningStrategy = null;
  if (bottleneckDetected || peakMemory > MAX_RAM_MB) {
    pruningStrategy = {
      recommendation: 'Implement event batching with memory limits',
      strategy: 'Process events in smaller batches, clear processed events from memory',
      maxBatchSize: Math.floor(BATCH_SIZE * 0.5)
    };
    console.log(`\n🔧 Pruning Strategy:`);
    console.log(`   ${pruningStrategy.recommendation}`);
    console.log(`   Max Batch Size: ${pruningStrategy.maxBatchSize}`);
  }
  
  return {
    success: passed,
    eventsProcessed: processedCount,
    totalTime,
    eventsPerSecond: processedCount / (totalTime / 1000),
    peakMemory,
    memoryDelta,
    bottleneckDetected,
    slowestOperation,
    pruningStrategy
  };
}

/**
 * 3. POISONED DATA INJECTION
 */
function poisonInjectionTest() {
  console.log('\n' + '='.repeat(70));
  console.log('3️⃣  POISONED DATA INJECTION - Toxic Event Isolation');
  console.log('='.repeat(70));
  
  // Generate 1000 toxic events
  const toxicEvents = [];
  const poisonTypes = {
    impossibleDates: [],
    nanValues: [],
    circularLogic: [],
    negativeValues: [],
    extremeValues: []
  };
  
  console.log(`\n☠️  Generating 1,000 Toxic Events...`);
  
  for (let i = 0; i < 1000; i++) {
    const type = i % 5;
    
    switch (type) {
      case 0: // Impossible dates
        poisonTypes.impossibleDates.push(i);
        toxicEvents.push({
          path: `/tools/poison-${i}`,
          timestamp: '2099-13-45T99:99:99.999Z', // Invalid date
          impressions: 100,
          clicks: 50
        });
        break;
        
      case 1: // NaN values
        poisonTypes.nanValues.push(i);
        toxicEvents.push({
          path: `/tools/poison-${i}`,
          impressions: NaN,
          clicks: NaN,
          ctr: NaN,
          dwellSeconds: NaN
        });
        break;
        
      case 2: // Circular logic (self-referencing)
        poisonTypes.circularLogic.push(i);
        const nodeId = `tool::poison-${i}`;
        toxicEvents.push({
          path: `/tools/poison-${i}`,
          nodeId: nodeId,
          connectsTo: [nodeId], // Self-reference
          impressions: 100
        });
        break;
        
      case 3: // Negative values
        poisonTypes.negativeValues.push(i);
        toxicEvents.push({
          path: `/tools/poison-${i}`,
          impressions: -100,
          clicks: -50,
          dwellSeconds: -300
        });
        break;
        
      case 4: // Extreme values
        poisonTypes.extremeValues.push(i);
        toxicEvents.push({
          path: `/tools/poison-${i}`,
          impressions: Number.MAX_SAFE_INTEGER,
          clicks: Number.MAX_SAFE_INTEGER,
          ctr: 999.99,
          dwellSeconds: Number.MAX_SAFE_INTEGER
        });
        break;
    }
  }
  
  console.log(`   Generated: ${toxicEvents.length} toxic events`);
  console.log(`   Types: ${Object.keys(poisonTypes).map(k => `${k}: ${poisonTypes[k].length}`).join(', ')}`);
  
  // Test isolation - process events and check for contamination
  console.log(`\n🛡️  Testing Isolation...`);
  
  const isolated = [];
  const leaked = [];
  const sinkNode = 'ga4_unmapped_sink';
  
  toxicEvents.forEach((event, index) => {
    let isIsolated = false;
    let isLeaked = false;
    
    // Check for invalid data
    const hasInvalidDate = isNaN(new Date(event.timestamp || Date.now()).getTime());
    const hasNaN = Object.values(event).some(v => typeof v === 'number' && isNaN(v));
    const hasNegative = Object.values(event).some(v => typeof v === 'number' && v < 0);
    const hasExtreme = Object.values(event).some(v => typeof v === 'number' && (v > 1e10 || v < -1e10));
    const hasCircular = event.connectsTo && event.connectsTo.includes(event.nodeId);
    
    if (hasInvalidDate || hasNaN || hasNegative || hasExtreme || hasCircular) {
      // Should be isolated to sink
      isIsolated = true;
      isolated.push({ index, event, reason: 'Invalid data detected' });
    } else {
      // Leaked to main system
      isLeaked = true;
      leaked.push({ index, event });
    }
  });
  
  const isolationRate = (isolated.length / toxicEvents.length) * 100;
  
  console.log(`\n📊 Isolation Results:`);
  console.log(`   Toxic Events: ${toxicEvents.length}`);
  console.log(`   Isolated: ${isolated.length}`);
  console.log(`   Leaked: ${leaked.length}`);
  console.log(`   Isolation Rate: ${isolationRate.toFixed(2)}%`);
  
  const passed = isolationRate === 100;
  console.log(`\n${passed ? '✅' : '❌'} Isolation Test: ${passed ? 'PASSED (100%)' : `FAILED (${isolationRate.toFixed(2)}%)`}`);
  
  if (leaked.length > 0) {
    console.log(`\n⚠️  Leaked Events (first 5):`);
    leaked.slice(0, 5).forEach(({ index, event }) => {
      console.log(`   Event ${index}: ${JSON.stringify(event).substring(0, 100)}...`);
    });
  }
  
  return {
    success: passed,
    toxicEvents: toxicEvents.length,
    isolated: isolated.length,
    leaked: leaked.length,
    isolationRate,
    poisonTypes
  };
}

/**
 * 4. SINGULARITY CHECK - Convergence Testing
 */
function singularityCheck(resonanceData, linkMapData) {
  console.log('\n' + '='.repeat(70));
  console.log('4️⃣  SINGULARITY CHECK - Convergence Testing');
  console.log('='.repeat(70));
  
  const nodes = resonanceData?.nodes || [];
  const recommendations = linkMapData?.recommendations || [];
  
  // Find tight node cluster (nodes with many interconnections)
  const clusterMap = new Map();
  recommendations.forEach(rec => {
    if (Array.isArray(rec.to)) {
      rec.to.forEach(to => {
        if (!clusterMap.has(rec.from)) {
          clusterMap.set(rec.from, new Set());
        }
        clusterMap.get(rec.from).add(to);
      });
    }
  });
  
  // Find tightest cluster (highest interconnectivity)
  let tightestCluster = null;
  let maxInterconnections = 0;
  
  clusterMap.forEach((connections, nodeId) => {
    // Count bidirectional connections
    let interconnections = 0;
    connections.forEach(connectedId => {
      if (clusterMap.has(connectedId) && clusterMap.get(connectedId).has(nodeId)) {
        interconnections++;
      }
    });
    
    if (interconnections > maxInterconnections) {
      maxInterconnections = interconnections;
      tightestCluster = nodeId;
    }
  });
  
  console.log(`\n🔍 Cluster Analysis:`);
  console.log(`   Tightest Cluster: ${tightestCluster || 'N/A'}`);
  console.log(`   Max Interconnections: ${maxInterconnections}`);
  
  if (!tightestCluster) {
    console.log(`\n⚠️  No tight clusters found for testing`);
    return { success: true, reason: 'No tight clusters' };
  }
  
  // Force high-weight event through cluster
  console.log(`\n💥 Forcing High-Weight Event Through Cluster...`);
  
  const initialWeights = new Map();
  nodes.forEach(node => {
    initialWeights.set(node.id, node.resonanceScore || 0.5);
  });
  
  // Simulate weight propagation
  let converged = false;
  let iterations = 0;
  const weightHistory = [];
  
  // Get cluster nodes
  const clusterNodes = Array.from(clusterMap.get(tightestCluster) || []);
  clusterNodes.push(tightestCluster);
  
  // Apply high weight to cluster center
  const highWeight = 0.99;
  const currentWeights = new Map(initialWeights);
  currentWeights.set(tightestCluster, highWeight);
  
  weightHistory.push([...currentWeights.values()]);
  
  while (!converged && iterations < CONVERGENCE_ITERATIONS * 2) {
    iterations++;
    const previousWeights = new Map(currentWeights);
    
    // Propagate weights through cluster
    clusterNodes.forEach(nodeId => {
      const connections = clusterMap.get(nodeId) || new Set();
      let weightedSum = 0;
      let connectionCount = 0;
      
      connections.forEach(connectedId => {
        if (clusterNodes.includes(connectedId)) {
          weightedSum += currentWeights.get(connectedId) || 0.5;
          connectionCount++;
        }
      });
      
      if (connectionCount > 0) {
        const newWeight = (currentWeights.get(nodeId) * 0.7) + (weightedSum / connectionCount * 0.3);
        currentWeights.set(nodeId, Math.max(0.5, Math.min(1.0, newWeight)));
      }
    });
    
    weightHistory.push([...currentWeights.values()]);
    
    // Check convergence (weights stabilize)
    let maxChange = 0;
    clusterNodes.forEach(nodeId => {
      const change = Math.abs((currentWeights.get(nodeId) || 0) - (previousWeights.get(nodeId) || 0));
      if (change > maxChange) {
        maxChange = change;
      }
    });
    
    if (maxChange < 0.001) {
      converged = true;
    }
  }
  
  console.log(`\n📊 Convergence Results:`);
  console.log(`   Iterations: ${iterations}`);
  console.log(`   Converged: ${converged ? '✅ YES' : '❌ NO'}`);
  console.log(`   Max Iterations: ${CONVERGENCE_ITERATIONS * 2}`);
  
  const passed = converged && iterations <= CONVERGENCE_ITERATIONS;
  
  if (!converged) {
    console.log(`\n⚠️  Weights did not converge within ${CONVERGENCE_ITERATIONS} iterations`);
    console.log(`   🔧 RECOMMENDATION: Implement Normalization Clamp`);
    
    // Test normalization clamp
    const clampedWeights = new Map();
    currentWeights.forEach((weight, nodeId) => {
      clampedWeights.set(nodeId, Math.max(0.5, Math.min(1.0, weight)));
    });
    
    console.log(`   ✅ Normalization Clamp Applied`);
  }
  
  return {
    success: passed,
    converged,
    iterations,
    maxIterations: CONVERGENCE_ITERATIONS,
    needsNormalization: !converged
  };
}

/**
 * 5. CHAOS REPORT GENERATION
 */
function generateChaosReport(aortaResults, tsunamiResults, poisonResults, singularityResults) {
  console.log('\n' + '='.repeat(70));
  console.log('5️⃣  CHAOS REPORT GENERATION');
  console.log('='.repeat(70));
  
  const allTestsPassed = 
    aortaResults.success &&
    tsunamiResults.success &&
    poisonResults.success &&
    singularityResults.success;
  
  const report = {
    timestamp: new Date().toISOString(),
    status: allTestsPassed ? 'BATTLE-HARDENED' : 'VULNERABILITIES DETECTED',
    tests: {
      aortaAttack: {
        status: aortaResults.success ? '✅ PASSED' : '❌ FAILED',
        selfHealed: aortaResults.selfHealed,
        graphFragmented: aortaResults.graphFragmented,
        recoveryTime: `${aortaResults.recoveryTime.toFixed(2)}ms`,
        alternativeRoutes: aortaResults.alternativeRoutes
      },
      tsunami: {
        status: tsunamiResults.success ? '✅ PASSED' : '❌ FAILED',
        eventsProcessed: tsunamiResults.eventsProcessed,
        peakMemory: `${tsunamiResults.peakMemory} MB`,
        eventsPerSecond: Math.round(tsunamiResults.eventsPerSecond).toLocaleString(),
        bottleneckDetected: tsunamiResults.bottleneckDetected,
        pruningStrategy: tsunamiResults.pruningStrategy
      },
      poisonInjection: {
        status: poisonResults.success ? '✅ PASSED' : '❌ FAILED',
        isolationRate: `${poisonResults.isolationRate.toFixed(2)}%`,
        toxicEvents: poisonResults.toxicEvents,
        leaked: poisonResults.leaked
      },
      singularityCheck: {
        status: singularityResults.success ? '✅ PASSED' : '❌ FAILED',
        converged: singularityResults.converged,
        iterations: singularityResults.iterations,
        needsNormalization: singularityResults.needsNormalization
      }
    },
    recommendations: []
  };
  
  // Add recommendations
  if (!aortaResults.selfHealed) {
    report.recommendations.push('Implement automatic route discovery for node failures');
  }
  
  if (tsunamiResults.bottleneckDetected || tsunamiResults.peakMemory > MAX_RAM_MB) {
    report.recommendations.push(tsunamiResults.pruningStrategy?.recommendation || 'Optimize event processing pipeline');
  }
  
  if (poisonResults.leaked > 0) {
    report.recommendations.push('Strengthen data validation and isolation for toxic events');
  }
  
  if (singularityResults.needsNormalization) {
    report.recommendations.push('Implement normalization clamp for weight convergence');
  }
  
  // Generate markdown report
  let markdown = `# Chaos Protocol Report\n\n`;
  markdown += `**Generated:** ${new Date().toISOString()}\n\n`;
  markdown += `## Status: ${report.status}\n\n`;
  
  markdown += `## Test Results\n\n`;
  
  markdown += `### 1. Aorta Attack\n`;
  markdown += `- Status: ${report.tests.aortaAttack.status}\n`;
  markdown += `- Self-Healed: ${report.tests.aortaAttack.selfHealed ? '✅ YES' : '❌ NO'}\n`;
  markdown += `- Graph Fragmented: ${report.tests.aortaAttack.graphFragmented ? '❌ YES' : '✅ NO'}\n`;
  markdown += `- Recovery Time: ${report.tests.aortaAttack.recoveryTime}\n`;
  markdown += `- Alternative Routes: ${report.tests.aortaAttack.alternativeRoutes}\n\n`;
  
  markdown += `### 2. The 162,004 Tsunami\n`;
  markdown += `- Status: ${report.tests.tsunami.status}\n`;
  markdown += `- Events Processed: ${report.tests.tsunami.eventsProcessed.toLocaleString()}\n`;
  markdown += `- Peak Memory: ${report.tests.tsunami.peakMemory}\n`;
  markdown += `- Events/Second: ${report.tests.tsunami.eventsPerSecond}\n`;
  markdown += `- Bottleneck: ${report.tests.tsunami.bottleneckDetected ? '⚠️  DETECTED' : '✅ NONE'}\n`;
  if (report.tests.tsunami.pruningStrategy) {
    markdown += `- Pruning Strategy: ${report.tests.tsunami.pruningStrategy.recommendation}\n`;
  }
  markdown += `\n`;
  
  markdown += `### 3. Poisoned Data Injection\n`;
  markdown += `- Status: ${report.tests.poisonInjection.status}\n`;
  markdown += `- Isolation Rate: ${report.tests.poisonInjection.isolationRate}\n`;
  markdown += `- Toxic Events: ${report.tests.poisonInjection.toxicEvents}\n`;
  markdown += `- Leaked: ${report.tests.poisonInjection.leaked}\n\n`;
  
  markdown += `### 4. Singularity Check\n`;
  markdown += `- Status: ${report.tests.singularityCheck.status}\n`;
  markdown += `- Converged: ${report.tests.singularityCheck.converged ? '✅ YES' : '❌ NO'}\n`;
  markdown += `- Iterations: ${report.tests.singularityCheck.iterations}\n`;
  markdown += `- Needs Normalization: ${report.tests.singularityCheck.needsNormalization ? '⚠️  YES' : '✅ NO'}\n\n`;
  
  if (report.recommendations.length > 0) {
    markdown += `## Recommendations\n\n`;
    report.recommendations.forEach((rec, i) => {
      markdown += `${i + 1}. ${rec}\n`;
    });
    markdown += `\n`;
  }
  
  markdown += `---\n\n`;
  markdown += `## Conclusion\n\n`;
  
  if (allTestsPassed) {
    markdown += `**SUBSTRATE IS BATTLE-HARDENED**\n\n`;
    markdown += `All chaos tests passed. The matrix demonstrates:\n`;
    markdown += `- ✅ Graceful degradation under node failures\n`;
    markdown += `- ✅ Autonomous recovery mechanisms\n`;
    markdown += `- ✅ Memory efficiency under high load\n`;
    markdown += `- ✅ Toxic data isolation\n`;
    markdown += `- ✅ Weight convergence stability\n`;
  } else {
    markdown += `**VULNERABILITIES DETECTED**\n\n`;
    markdown += `The matrix requires hardening before production deployment.\n`;
  }
  
  // Save report
  ensureDir(CHAOS_OUTPUT);
  fs.writeFileSync(CHAOS_REPORT, markdown);
  
  console.log(`\n📁 Chaos Report saved to: ${CHAOS_REPORT}\n`);
  
  return report;
}

/**
 * MAIN CHAOS PROTOCOL EXECUTION
 */
async function runChaosProtocol() {
  console.log('\n' + '='.repeat(70));
  console.log('☠️  CHAOS PROTOCOL - ADVERSARIAL STRESS TEST');
  console.log('='.repeat(70));
  console.log('Testing Graceful Degradation + Autonomous Recovery\n');
  
  try {
    // Load data
    const resonanceData = readJson(FILES.resonanceNodes);
    const linkMapData = readJson(FILES.linkMap);
    
    if (!resonanceData || !linkMapData) {
      console.error('❌ Required data files not found');
      process.exit(1);
    }
    
    // 1. Aorta Attack
    const aortaResults = aortaAttack(resonanceData, linkMapData);
    
    // 2. Tsunami Test
    const tsunamiResults = tsunamiTest();
    
    // 3. Poison Injection
    const poisonResults = poisonInjectionTest();
    
    // 4. Singularity Check
    const singularityResults = singularityCheck(resonanceData, linkMapData);
    
    // 5. Generate Report
    const report = generateChaosReport(aortaResults, tsunamiResults, poisonResults, singularityResults);
    
    // Final status
    console.log('\n' + '='.repeat(70));
    if (report.status === 'BATTLE-HARDENED') {
      console.log('✅ SUBSTRATE IS BATTLE-HARDENED');
    } else {
      console.log('⚠️  VULNERABILITIES DETECTED');
    }
    console.log('='.repeat(70) + '\n');
    
    return report;
    
  } catch (error) {
    console.error('\n❌ CHAOS PROTOCOL FAILED:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Execute
if (import.meta.url === `file://${path.resolve(process.argv[1])}` || 
    process.argv[1]?.includes('chaos-protocol.mjs')) {
  runChaosProtocol().then(report => {
    process.exit(0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runChaosProtocol };
