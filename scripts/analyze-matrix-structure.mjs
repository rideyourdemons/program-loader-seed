/**
 * Matrix Structure Analysis
 * Analyzes the 164k-node matrix structure and prepares migration schema
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

function analyzeMatrix() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 MATRIX STRUCTURE ANALYSIS');
  console.log('='.repeat(70) + '\n');

  // 1. Analyze Resonance Nodes
  console.log('📊 STEP 1: Analyzing Resonance Nodes...');
  const resonanceData = readJson(FILES.resonanceNodes);
  if (resonanceData) {
    const nodes = resonanceData.nodes || [];
    console.log(`   Total Nodes: ${nodes.length.toLocaleString()}`);
    
    const nodeTypes = {};
    nodes.forEach(node => {
      nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
    });
    console.log('   Node Types:');
    Object.entries(nodeTypes).forEach(([type, count]) => {
      console.log(`     - ${type}: ${count.toLocaleString()}`);
    });
  }

  // 2. Analyze Link Map (Connections)
  console.log('\n📊 STEP 2: Analyzing Link Map (Connections)...');
  const linkMapData = readJson(FILES.linkMap);
  if (linkMapData) {
    const recommendations = linkMapData.recommendations || [];
    console.log(`   Total Recommendations: ${recommendations.length.toLocaleString()}`);
    
    let totalConnections = 0;
    recommendations.forEach(rec => {
      if (Array.isArray(rec.to)) {
        totalConnections += rec.to.length;
      }
    });
    console.log(`   Total Connections: ${totalConnections.toLocaleString()}`);
    
    // Calculate if this could be the 164k
    console.log(`   Potential 164k Source: ${totalConnections >= 160000 ? '✅ YES' : '❌ NO'}`);
  }

  // 3. Analyze Registry
  console.log('\n📊 STEP 3: Analyzing Registry...');
  const registryData = readJson(FILES.registry);
  if (registryData) {
    const nodes = registryData.nodes || [];
    console.log(`   Total Registry Nodes: ${nodes.length.toLocaleString()}`);
    
    // Check for ID, ParentID, RiskWeight fields
    if (nodes.length > 0) {
      const sampleNode = nodes[0];
      console.log('   Sample Node Schema:');
      console.log(`     - ID: ${sampleNode.id ? '✅' : '❌'}`);
      console.log(`     - ParentID: ${sampleNode.parentId || sampleNode.parentID ? '✅' : '❌'}`);
      console.log(`     - RiskWeight: ${sampleNode.riskWeight || sampleNode.risk_weight ? '✅' : '❌'}`);
      console.log(`     - ResonanceScore: ${sampleNode.resonanceScore ? '✅' : '❌'}`);
      console.log(`     - LinkWeight: ${sampleNode.linkWeight ? '✅' : '❌'}`);
    }
  }

  // 4. Analyze RYD_MATRIX Structure
  console.log('\n📊 STEP 4: Analyzing RYD_MATRIX Structure...');
  if (fs.existsSync(FILES.rydMatrixAnchors)) {
    const anchorFiles = fs.readdirSync(FILES.rydMatrixAnchors).filter(f => f.endsWith('.json'));
    console.log(`   Anchor Files: ${anchorFiles.length}`);
    
    let totalPainPoints = 0;
    anchorFiles.forEach(file => {
      const anchorData = readJson(path.join(FILES.rydMatrixAnchors, file));
      if (anchorData && anchorData.pain_points) {
        totalPainPoints += anchorData.pain_points.length;
      }
    });
    console.log(`   Total Pain Points: ${totalPainPoints}`);
    console.log(`   Expected: 12 anchors × 40 pain points = 480`);
    console.log(`   Tool References: ${totalPainPoints * 3} (3 per pain point)`);
  }

  // 5. Analyze Gates-PainPoints-Tools
  console.log('\n📊 STEP 5: Analyzing Gates-PainPoints-Tools...');
  const gptData = readJson(FILES.gatesPainPointsTools);
  if (gptData) {
    console.log(`   Gates: ${gptData.gates ? gptData.gates.length : 'N/A'}`);
    if (gptData.requirements) {
      console.log(`   Requirements:`);
      console.log(`     - Gates: ${gptData.requirements.gates}`);
      console.log(`     - Pain Points per Gate: ${gptData.requirements.painPointsPerGate}`);
      console.log(`     - Tools per Pain Point: ${gptData.requirements.toolsPerPainPoint}`);
      const expected = gptData.requirements.gates * gptData.requirements.painPointsPerGate * gptData.requirements.toolsPerPainPoint;
      console.log(`     - Expected Tool Mappings: ${expected}`);
    }
  }

  // 6. Schema Analysis
  console.log('\n📊 STEP 6: Schema Analysis for Migration...');
  console.log('   Current Schema Fields:');
  if (registryData && registryData.nodes && registryData.nodes.length > 0) {
    const sample = registryData.nodes[0];
    Object.keys(sample).forEach(key => {
      const type = typeof sample[key];
      const isArray = Array.isArray(sample[key]);
      console.log(`     - ${key}: ${isArray ? 'Array' : type}`);
    });
  }

  // 7. Calculate Total Matrix Size
  console.log('\n📊 STEP 7: Total Matrix Size Calculation...');
  let totalNodes = 0;
  let totalConnections = 0;
  
  if (resonanceData) totalNodes += (resonanceData.nodes || []).length;
  if (registryData) totalNodes += (registryData.nodes || []).length;
  if (linkMapData) {
    const recs = linkMapData.recommendations || [];
    totalConnections = recs.reduce((sum, rec) => sum + (Array.isArray(rec.to) ? rec.to.length : 0), 0);
  }
  
  console.log(`   Total Unique Nodes: ${totalNodes.toLocaleString()}`);
  console.log(`   Total Connections: ${totalConnections.toLocaleString()}`);
  console.log(`   Combined Size: ${(totalNodes + totalConnections).toLocaleString()}`);
  
  if (totalNodes + totalConnections >= 160000) {
    console.log(`   ✅ FOUND: Matrix size is ${(totalNodes + totalConnections).toLocaleString()} (matches ~164k)`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ ANALYSIS COMPLETE');
  console.log('='.repeat(70) + '\n');
}

// Run analysis
try {
  analyzeMatrix();
} catch (error) {
  console.error('❌ Analysis failed:', error);
  process.exit(1);
}
