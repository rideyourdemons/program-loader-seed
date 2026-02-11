#!/usr/bin/env node
/**
 * Graph Topology Validator
 * 
 * Validates:
 * - 1+ anchors
 * - Gates exist
 * - Each gate has 40 pain points
 * - Each pain point has >=3 tools
 * - All IDs resolve
 * 
 * IP RULE: Only outputs failing IDs and file paths, no content dumps.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'public', 'data');

const EXPECTED_PAINPOINTS_PER_GATE = 40;
const MIN_TOOLS_PER_PAINPOINT = 3;

function canonicalSlug(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function loadJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

console.log('\n' + '='.repeat(80));
console.log('🔍 GRAPH TOPOLOGY VALIDATION');
console.log('='.repeat(80) + '\n');

const errors = [];
const warnings = [];

// Load data files
const anchorsData = loadJsonFile(path.join(DATA_DIR, 'anchors.json'));
const gatesData = loadJsonFile(path.join(DATA_DIR, 'gates.json'));
const painPointsData = loadJsonFile(path.join(DATA_DIR, 'pain-points.json'));
const toolsData = loadJsonFile(path.join(DATA_DIR, 'tools.json'));
const registryData = loadJsonFile(path.join(DATA_DIR, 'registry.json'));

// Validate anchors
if (!anchorsData || !Array.isArray(anchorsData.anchors) || anchorsData.anchors.length === 0) {
  errors.push('Missing or empty anchors.json');
} else {
  console.log(`✅ Anchors: ${anchorsData.anchors.length}`);
  anchorsData.anchors.forEach(anchor => {
    if (!anchor.id || !anchor.slug) {
      errors.push(`Anchor missing id or slug: ${JSON.stringify(anchor).substring(0, 50)}`);
    }
  });
}

// Validate gates
if (!gatesData || !Array.isArray(gatesData.gates) || gatesData.gates.length === 0) {
  errors.push('Missing or empty gates.json');
} else {
  console.log(`✅ Gates: ${gatesData.gates.length}`);
  gatesData.gates.forEach(gate => {
    if (!gate.id || !gate.slug) {
      errors.push(`Gate missing id or slug: ${gate.id || 'unknown'}`);
    }
  });
}

// Validate pain points
if (!painPointsData || !painPointsData.painPoints || typeof painPointsData.painPoints !== 'object') {
  errors.push('Missing or invalid pain-points.json');
} else {
  const painPointsByGate = painPointsData.painPoints;
  const gateIds = Object.keys(painPointsByGate);
  
  console.log(`✅ Pain Point Gates: ${gateIds.length}`);
  
  gateIds.forEach(gateId => {
    const painPoints = painPointsByGate[gateId] || [];
    if (painPoints.length !== EXPECTED_PAINPOINTS_PER_GATE) {
      errors.push(`Gate "${gateId}" has ${painPoints.length} pain points, expected ${EXPECTED_PAINPOINTS_PER_GATE}`);
    }
    
    painPoints.forEach(pp => {
      if (!pp.id || !pp.slug) {
        errors.push(`Pain point missing id or slug in gate "${gateId}": ${pp.id || 'unknown'}`);
      }
    });
  });
}

// Validate tools
if (!toolsData || !Array.isArray(toolsData.tools) || toolsData.tools.length === 0) {
  errors.push('Missing or empty tools.json');
} else {
  console.log(`✅ Tools: ${toolsData.tools.length}`);
  
  // Build tool index
  const toolIndex = new Map();
  toolsData.tools.forEach(tool => {
    if (!tool.id || !tool.slug) {
      errors.push(`Tool missing id or slug: ${tool.id || 'unknown'}`);
    } else {
      toolIndex.set(tool.id, tool);
      toolIndex.set(tool.slug, tool);
    }
  });
  
  // Validate pain point -> tools mapping
  if (painPointsData && painPointsData.painPoints) {
    const painPointsByGate = painPointsData.painPoints;
    Object.keys(painPointsByGate).forEach(gateId => {
      const painPoints = painPointsByGate[gateId] || [];
      painPoints.forEach(pp => {
        const toolIds = pp.toolIds || pp.tools || [];
        if (toolIds.length < MIN_TOOLS_PER_PAINPOINT) {
          errors.push(`Pain point "${pp.id}" has ${toolIds.length} tools, minimum is ${MIN_TOOLS_PER_PAINPOINT}`);
        }
        
        // Verify all tool IDs resolve
        toolIds.forEach(toolId => {
          if (!toolIndex.has(toolId) && !toolIndex.has(canonicalSlug(toolId))) {
            errors.push(`Pain point "${pp.id}" references non-existent tool: ${toolId}`);
          }
        });
      });
    });
  }
}

// Validate registry (if exists)
if (registryData && registryData.registry) {
  const registry = registryData.registry;
  console.log(`✅ Registry: Present`);
  
  // Verify edges
  if (registry.edges) {
    if (registry.edges.anchorToGates) {
      const anchorIds = Object.keys(registry.edges.anchorToGates);
      anchorIds.forEach(anchorId => {
        const gateIds = registry.edges.anchorToGates[anchorId] || [];
        gateIds.forEach(gateId => {
          const gate = gatesData?.gates?.find(g => g.id === gateId);
          if (!gate) {
            errors.push(`Registry edge: anchor "${anchorId}" references non-existent gate: ${gateId}`);
          }
        });
      });
    }
    
    if (registry.edges.painPointToTools) {
      const painPointIds = Object.keys(registry.edges.painPointToTools);
      painPointIds.forEach(ppId => {
        const toolIds = registry.edges.painPointToTools[ppId] || [];
        toolIds.forEach(toolId => {
          const tool = toolsData?.tools?.find(t => t.id === toolId);
          if (!tool) {
            errors.push(`Registry edge: pain point "${ppId}" references non-existent tool: ${toolId}`);
          }
        });
      });
    }
  }
}

// Report
console.log('\n' + '='.repeat(80));
if (errors.length === 0) {
  console.log('✅ VALIDATION PASSED: Graph topology is valid');
  console.log('='.repeat(80) + '\n');
  process.exit(0);
} else {
  console.log('❌ VALIDATION FAILED:');
  console.log('='.repeat(80) + '\n');
  errors.slice(0, 20).forEach(error => {
    console.log(`  - ${error}`);
  });
  if (errors.length > 20) {
    console.log(`  ... and ${errors.length - 20} more errors\n`);
  }
  console.log('='.repeat(80) + '\n');
  process.exit(1);
}
