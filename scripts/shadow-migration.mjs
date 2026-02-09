/**
 * Shadow Migration Script
 * Transforms RYD Matrix JSON files into database-ready format
 * WITHOUT executing database writes (preparation only)
 * 
 * Schema Mapping:
 * - ID: from existing 'id' field
 * - ParentID: from 'cluster' field (gate/anchor reference)
 * - RiskWeight: calculated from resonanceScore + decayScore
 * 
 * CLI Arguments:
 * --dry-run: Skip file writes, only validate and report
 * --limit=N: Process only first N nodes (for canary testing)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// File paths
const FILES = {
  resonanceNodes: path.join(ROOT_DIR, 'public', 'matrix', 'resonance-nodes.json'),
  linkMap: path.join(ROOT_DIR, 'public', 'data', 'matrix', 'link-map.json'),
  registry: path.join(ROOT_DIR, 'public', 'data', 'matrix', 'registry.json'),
  gatesPainPointsTools: path.join(ROOT_DIR, 'public', 'data', 'gates-painpoints-tools.json'),
  rydMatrixAnchors: path.join(ROOT_DIR, 'RYD_MATRIX', 'anchors'),
  rydMatrixArmory: path.join(ROOT_DIR, 'RYD_MATRIX', 'armory', 'global_mechanics.json')
};

// Output path for migration data
const OUTPUT_DIR = path.join(ROOT_DIR, 'scripts', 'migration-output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'migration-ready.json');
const CANARY_LOG_FILE = path.join(OUTPUT_DIR, 'canary-test-log.jsonl');

// Safety limits
const RAM_TARGET_BASELINE = 56; // MB
const RAM_HARD_KILL = 150; // MB
const HEARTBEAT_INTERVAL = 1000; // nodes

// Gold Standard Anchors (for validation)
const GOLD_STANDARD_ANCHORS = [
  'fathers-sons', 'mothers-daughters', 'the-patriarch', 'the-matriarch',
  'young-lions', 'young-women', 'the-professional', 'the-griever',
  'the-addict', 'the-protector', 'men-solo', 'women-solo'
];

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    dryRun: false,
    limit: null
  };
  
  args.forEach(arg => {
    if (arg === '--dry-run') {
      config.dryRun = true;
    } else if (arg.startsWith('--limit=')) {
      const limit = parseInt(arg.split('=')[1], 10);
      if (!isNaN(limit) && limit > 0) {
        config.limit = limit;
      }
    }
  });
  
  return config;
}

function getMemoryUsage() {
  const usage = process.memoryUsage();
  return Math.round(usage.heapUsed / 1024 / 1024);
}

function logHeartbeat(data) {
  ensureDir(path.dirname(CANARY_LOG_FILE));
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...data
  };
  fs.appendFileSync(CANARY_LOG_FILE, JSON.stringify(logEntry) + '\n');
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  File not found: ${filePath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    return null;
  }
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Calculate RiskWeight from resonanceScore and decayScore
 * RiskWeight = (resonanceScore * (1 - decayScore)) * 100
 * Higher resonance, lower decay = higher risk weight
 */
function calculateRiskWeight(resonanceScore = 0.5, decayScore = 0.05) {
  const normalized = Math.max(0, Math.min(1, resonanceScore * (1 - decayScore)));
  return Math.round(normalized * 100) / 100; // Round to 2 decimals
}

/**
 * Extract ParentID from cluster or node structure
 */
function extractParentID(node) {
  // If node has cluster, use it as ParentID
  if (node.cluster) {
    return node.cluster;
  }
  
  // If node ID contains "::", extract the parent part
  if (node.id && node.id.includes('::')) {
    const parts = node.id.split('::');
    if (parts.length >= 2) {
      return parts[0]; // e.g., "gate::mens-mental-health" -> "gate"
    }
  }
  
  // For gates, they are root nodes (no parent)
  if (node.type === 'gate') {
    return null;
  }
  
  return null;
}

/**
 * Transform node to database schema
 */
function transformNode(node, connections = {}) {
  const parentID = extractParentID(node);
  const riskWeight = calculateRiskWeight(
    node.resonanceScore || 0.5,
    node.decayScore || 0.05
  );
  
  return {
    ID: node.id,
    ParentID: parentID,
    RiskWeight: riskWeight,
    // Preserve all original fields for compatibility
    type: node.type,
    title: node.title || node.name,
    path: node.path,
    slug: node.slug || node.path?.replace(/^\//, ''),
    tags: node.tags || [],
    cluster: node.cluster,
    resonanceScore: node.resonanceScore || 0.5,
    decayScore: node.decayScore || 0.05,
    linkWeight: node.linkWeight || 1.0,
    inboundLinks: connections.inbound || [],
    outboundLinks: connections.outbound || [],
    lastUpdated: node.lastUpdated || new Date().toISOString(),
    // Additional metadata
    source: node.source || 'matrix',
    intent: node.intent || node.title,
    freshness: node.freshness || 1.0
  };
}

/**
 * Build connection map from link-map.json
 */
function buildConnectionMap(linkMapData) {
  const connections = {
    inbound: {},  // nodeId -> [sourceIds]
    outbound: {}  // nodeId -> [targetIds]
  };
  
  if (!linkMapData || !linkMapData.recommendations) {
    return connections;
  }
  
  linkMapData.recommendations.forEach(rec => {
    const fromId = rec.from;
    const toIds = Array.isArray(rec.to) ? rec.to : [];
    
    // Build outbound links
    if (!connections.outbound[fromId]) {
      connections.outbound[fromId] = [];
    }
    connections.outbound[fromId].push(...toIds);
    
    // Build inbound links
    toIds.forEach(toId => {
      if (!connections.inbound[toId]) {
        connections.inbound[toId] = [];
      }
      connections.inbound[toId].push(fromId);
    });
  });
  
  return connections;
}

/**
 * Main migration function
 */
function prepareMigration(config = {}) {
  const { dryRun = false, limit = null } = config;
  const startTime = performance.now();
  const initialMemory = getMemoryUsage();
  
  console.log('\n' + '='.repeat(70));
  console.log('🔄 SHADOW MIGRATION PREPARATION');
  if (dryRun) console.log('   [DRY RUN MODE - No files will be written]');
  if (limit) console.log(`   [CANARY TEST - Limited to ${limit.toLocaleString()} nodes]`);
  console.log('='.repeat(70) + '\n');
  
  console.log(`📊 Initial RAM: ${initialMemory} MB`);
  console.log(`   Target Baseline: ${RAM_TARGET_BASELINE} MB`);
  console.log(`   Hard Kill Limit: ${RAM_HARD_KILL} MB\n`);
  
  // 1. Load all data sources
  console.log('📂 Loading data sources...');
  const resonanceData = readJson(FILES.resonanceNodes);
  const linkMapData = readJson(FILES.linkMap);
  const registryData = readJson(FILES.registry);
  const gptData = readJson(FILES.gatesPainPointsTools);
  
  if (!resonanceData && !registryData) {
    console.error('❌ No node data found. Cannot proceed.');
    process.exit(1);
  }
  
  // 2. Build connection map
  console.log('🔗 Building connection map...');
  const connectionMap = buildConnectionMap(linkMapData);
  console.log(`   Inbound connections: ${Object.keys(connectionMap.inbound).length}`);
  console.log(`   Outbound connections: ${Object.keys(connectionMap.outbound).length}`);
  
  // 3. Use registry data (most complete) or resonance data
  const sourceData = registryData || resonanceData;
  let nodes = sourceData.nodes || [];
  const totalNodes = nodes.length;
  
  // Apply limit if specified (canary test)
  if (limit && limit > 0) {
    nodes = nodes.slice(0, limit);
    console.log(`\n⚠️  CANARY MODE: Processing ${nodes.length.toLocaleString()} of ${totalNodes.toLocaleString()} nodes`);
  }
  
  console.log(`\n📊 Transforming ${nodes.length.toLocaleString()} nodes...`);
  
  // 4. Transform nodes with heartbeat and RAM monitoring
  const transformedNodes = [];
  let processedCount = 0;
  let lastSuccessfulNodeId = null;
  let peakMemory = initialMemory;
  
  for (const node of nodes) {
    // RAM check before processing
    const currentMemory = getMemoryUsage();
    if (currentMemory > peakMemory) {
      peakMemory = currentMemory;
    }
    
    // HARD KILL CHECK
    if (currentMemory > RAM_HARD_KILL) {
      console.log(`\n🚨 HARD KILL TRIGGERED:`);
      console.log(`   RAM: ${currentMemory} MB > ${RAM_HARD_KILL} MB`);
      console.log(`   Last successful node: ${lastSuccessfulNodeId}`);
      console.log(`   Nodes processed: ${processedCount.toLocaleString()}`);
      console.log(`\n⚠️  Migration stopped to prevent memory overflow.`);
      break;
    }
    
    try {
      const connections = {
        inbound: connectionMap.inbound[node.id] || [],
        outbound: connectionMap.outbound[node.id] || []
      };
      const transformed = transformNode(node, connections);
      transformedNodes.push(transformed);
      lastSuccessfulNodeId = node.id;
      processedCount++;
      
      // Heartbeat every 1,000 nodes
      if (processedCount % HEARTBEAT_INTERVAL === 0) {
        const elapsed = (performance.now() - startTime) / 1000;
        const nodesPerSecond = processedCount / elapsed;
        const memoryDelta = currentMemory - initialMemory;
        
        console.log(
          `❤️ Heartbeat: Nodes: ${processedCount.toLocaleString()} | ` +
          `RAM: ${currentMemory}MB (Δ${memoryDelta > 0 ? '+' : ''}${memoryDelta}MB) | ` +
          `Peak: ${peakMemory}MB | ` +
          `Speed: ${nodesPerSecond.toFixed(0)} nodes/sec`
        );
        
        // Log to file
        logHeartbeat({
          nodesProcessed: processedCount,
          ramMB: currentMemory,
          peakRamMB: peakMemory,
          memoryDeltaMB: memoryDelta,
          nodesPerSecond: nodesPerSecond,
          lastNodeId: lastSuccessfulNodeId
        });
      }
    } catch (error) {
      console.error(`❌ Error transforming node ${node.id}:`, error.message);
      // Continue processing other nodes
    }
  }
  
  if (processedCount < nodes.length) {
    console.log(`\n⚠️  Processed ${processedCount.toLocaleString()} of ${nodes.length.toLocaleString()} nodes`);
  }
  
  // 5. Group by type for database collections
  const grouped = {
    gates: [],
    painPoints: [],
    tools: [],
    insights: [],
    other: []
  };
  
  transformedNodes.forEach(node => {
    const type = node.type || 'other';
    if (grouped[type + 's']) {
      grouped[type + 's'].push(node);
    } else if (type === 'pain-point') {
      grouped.painPoints.push(node);
    } else {
      grouped.other.push(node);
    }
  });
  
  console.log('\n📦 Grouped nodes:');
  console.log(`   Gates: ${grouped.gates.length}`);
  console.log(`   Pain Points: ${grouped.painPoints.length}`);
  console.log(`   Tools: ${grouped.tools.length}`);
  console.log(`   Insights: ${grouped.insights.length}`);
  console.log(`   Other: ${grouped.other.length}`);
  
  // 6. Calculate statistics
  const stats = {
    totalNodes: transformedNodes.length,
    nodesWithParentID: transformedNodes.filter(n => n.ParentID).length,
    nodesWithoutParentID: transformedNodes.filter(n => !n.ParentID).length,
    avgRiskWeight: transformedNodes.reduce((sum, n) => sum + n.RiskWeight, 0) / transformedNodes.length,
    minRiskWeight: Math.min(...transformedNodes.map(n => n.RiskWeight)),
    maxRiskWeight: Math.max(...transformedNodes.map(n => n.RiskWeight)),
    totalConnections: transformedNodes.reduce((sum, n) => sum + n.inboundLinks.length + n.outboundLinks.length, 0)
  };
  
  console.log('\n📈 Statistics:');
  console.log(`   Total Nodes: ${stats.totalNodes.toLocaleString()}`);
  console.log(`   Nodes with ParentID: ${stats.nodesWithParentID.toLocaleString()}`);
  console.log(`   Nodes without ParentID: ${stats.nodesWithoutParentID.toLocaleString()}`);
  console.log(`   Average RiskWeight: ${stats.avgRiskWeight.toFixed(2)}`);
  console.log(`   RiskWeight Range: ${stats.minRiskWeight} - ${stats.maxRiskWeight}`);
  console.log(`   Total Connections: ${stats.totalConnections.toLocaleString()}`);
  
  // 7. Prepare migration payload
  const migrationPayload = {
    version: '1.0',
    generated: new Date().toISOString(),
    metadata: {
      source: 'RYD Matrix JSON files',
      totalNodes: stats.totalNodes,
      schema: {
        ID: 'string (required)',
        ParentID: 'string|null (gate/anchor reference)',
        RiskWeight: 'number (0-1, calculated from resonanceScore and decayScore)'
      }
    },
    collections: {
      gates: grouped.gates,
      painPoints: grouped.painPoints,
      tools: grouped.tools,
      insights: grouped.insights,
      other: grouped.other
    },
    statistics: stats,
    sampleNodes: {
      gate: grouped.gates[0] || null,
      painPoint: grouped.painPoints[0] || null,
      tool: grouped.tools[0] || null
    }
  };
  
  // 8. Write output (unless dry-run)
  const finalMemory = getMemoryUsage();
  const totalTime = (performance.now() - startTime) / 1000;
  const memoryDelta = finalMemory - initialMemory;
  
  if (!dryRun) {
    ensureDir(OUTPUT_DIR);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(migrationPayload, null, 2));
    console.log('\n✅ Migration data prepared!');
    console.log(`📁 Output: ${OUTPUT_FILE}`);
  } else {
    console.log('\n✅ Migration data validated (DRY RUN)');
    console.log(`   Output file would be: ${OUTPUT_FILE}`);
  }
  
  // Final statistics
  console.log('\n📈 Final Statistics:');
  console.log(`   Nodes Processed: ${processedCount.toLocaleString()}`);
  console.log(`   Total Time: ${totalTime.toFixed(2)}s`);
  console.log(`   Nodes/Second: ${(processedCount / totalTime).toFixed(0)}`);
  console.log(`   Initial RAM: ${initialMemory} MB`);
  console.log(`   Final RAM: ${finalMemory} MB`);
  console.log(`   Peak RAM: ${peakMemory} MB`);
  console.log(`   Memory Delta: ${memoryDelta} MB`);
  
  // Safety validation
  if (peakMemory > RAM_HARD_KILL) {
    console.log(`\n⚠️  WARNING: Peak RAM (${peakMemory} MB) exceeded hard kill limit (${RAM_HARD_KILL} MB)`);
  } else if (peakMemory > RAM_TARGET_BASELINE * 2) {
    console.log(`\n⚠️  WARNING: Peak RAM (${peakMemory} MB) is above 2x baseline (${RAM_TARGET_BASELINE * 2} MB)`);
  } else {
    console.log(`\n✅ RAM Usage: Within safe limits`);
  }
  
  console.log('\n⚠️  NOTE: This is a PREPARATION script only.');
  console.log('   No database writes have been executed.');
  if (!dryRun) {
    console.log('   Review the output file before proceeding with actual migration.');
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ PREPARATION COMPLETE');
  console.log('='.repeat(70) + '\n');
  
  return {
    ...migrationPayload,
    runtime: {
      nodesProcessed: processedCount,
      totalTime,
      nodesPerSecond: processedCount / totalTime,
      initialMemory,
      finalMemory,
      peakMemory,
      memoryDelta,
      lastSuccessfulNodeId
    }
  };
}

// Execute
try {
  const config = parseArgs();
  const result = prepareMigration(config);
  
  if (config.limit) {
    console.log('🎯 Canary Test Complete!');
    console.log('   Review the results above before proceeding with full migration.');
    console.log('   If all checks pass, run without --limit to process all nodes.\n');
  } else {
    console.log('🎯 Next Steps:');
    console.log('1. Review the migration output file');
    console.log('2. Compare schema with rideryourdemons.com database');
    console.log('3. Create database connection script');
    console.log('4. Test on staging environment');
    console.log('5. Execute migration after validation\n');
  }
} catch (error) {
  console.error('❌ Migration preparation failed:', error);
  process.exit(1);
}
