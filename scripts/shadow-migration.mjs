/**
 * Shadow Migration Script
 * Transforms RYD Matrix JSON files into database-ready format
 * WITHOUT executing database writes (preparation only)
 * 
 * Schema Mapping:
 * - ID: from existing 'id' field
 * - ParentID: from 'cluster' field (gate/anchor reference)
 * - RiskWeight: calculated from resonanceScore + decayScore
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
function prepareMigration() {
  console.log('\n' + '='.repeat(70));
  console.log('🔄 SHADOW MIGRATION PREPARATION');
  console.log('='.repeat(70) + '\n');
  
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
  const nodes = sourceData.nodes || [];
  
  console.log(`\n📊 Transforming ${nodes.length.toLocaleString()} nodes...`);
  
  // 4. Transform nodes
  const transformedNodes = nodes.map(node => {
    const connections = {
      inbound: connectionMap.inbound[node.id] || [],
      outbound: connectionMap.outbound[node.id] || []
    };
    return transformNode(node, connections);
  });
  
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
  
  // 8. Write output
  ensureDir(OUTPUT_DIR);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(migrationPayload, null, 2));
  
  console.log('\n✅ Migration data prepared!');
  console.log(`📁 Output: ${OUTPUT_FILE}`);
  console.log('\n⚠️  NOTE: This is a PREPARATION script only.');
  console.log('   No database writes have been executed.');
  console.log('   Review the output file before proceeding with actual migration.');
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ PREPARATION COMPLETE');
  console.log('='.repeat(70) + '\n');
  
  return migrationPayload;
}

// Execute
try {
  const result = prepareMigration();
  console.log('🎯 Next Steps:');
  console.log('1. Review the migration output file');
  console.log('2. Compare schema with rideryourdemons.com database');
  console.log('3. Create database connection script');
  console.log('4. Test on staging environment');
  console.log('5. Execute migration after validation\n');
} catch (error) {
  console.error('❌ Migration preparation failed:', error);
  process.exit(1);
}
