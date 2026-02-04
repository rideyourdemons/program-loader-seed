/**
 * Build Gates-PainPoints-Tools Mapping
 * 
 * Creates a single source of truth mapping file:
 * /data/gates-painpoints-tools.json
 * 
 * Structure:
 * - 12 gates
 * - Each gate has exactly 40 pain points
 * - Each pain point has exactly 3 tools
 * - Tools can be reused across pain points
 */

const fs = require('fs');
const path = require('path');

const GATES_FILE = path.join(__dirname, '..', 'public', 'data', 'gates.json');
const PAIN_POINTS_FILE = path.join(__dirname, '..', 'public', 'data', 'pain-points.json');
const TOOLS_CANONICAL_FILE = path.join(__dirname, '..', 'public', 'data', 'tools-canonical.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'data', 'gates-painpoints-tools.json');

const REQUIRED_GATES = 12;
const REQUIRED_PAIN_POINTS_PER_GATE = 40;
const REQUIRED_TOOLS_PER_PAIN_POINT = 3;

function buildMapping() {
  console.log('[BUILD] Building gates-painpoints-tools mapping...\n');
  
  // Load data
  console.log('[BUILD] Loading data files...');
  const gatesData = JSON.parse(fs.readFileSync(GATES_FILE, 'utf8'));
  const painPointsData = JSON.parse(fs.readFileSync(PAIN_POINTS_FILE, 'utf8'));
  const toolsData = JSON.parse(fs.readFileSync(TOOLS_CANONICAL_FILE, 'utf8'));
  
  const gates = gatesData.gates || [];
  const painPoints = painPointsData.painPoints || {};
  const tools = toolsData.tools || [];
  
  console.log(`[BUILD] Loaded ${gates.length} gates, ${Object.keys(painPoints).length} gate groups, ${tools.length} tools\n`);
  
  // Create tool lookup by id/slug
  const toolMap = new Map();
  tools.forEach(tool => {
    if (tool.id) toolMap.set(tool.id, tool);
    if (tool.slug && tool.slug !== tool.id) toolMap.set(tool.slug, tool);
  });
  
  const mapping = {
    version: '1.0',
    generated: new Date().toISOString(),
    requirements: {
      gates: REQUIRED_GATES,
      painPointsPerGate: REQUIRED_PAIN_POINTS_PER_GATE,
      toolsPerPainPoint: REQUIRED_TOOLS_PER_PAIN_POINT
    },
    gates: []
  };
  
  let totalPainPoints = 0;
  let totalToolMappings = 0;
  const warnings = [];
  
  // Process each gate
  for (const gate of gates) {
    const gateId = gate.id;
    const gatePainPoints = painPoints[gateId] || [];
    
    // Ensure exactly 40 pain points
    let processedPainPoints = [...gatePainPoints];
    
    if (processedPainPoints.length < REQUIRED_PAIN_POINTS_PER_GATE) {
      warnings.push(`Gate "${gateId}" has only ${processedPainPoints.length} pain points (need ${REQUIRED_PAIN_POINTS_PER_GATE})`);
      // Pad with placeholder pain points if needed
      while (processedPainPoints.length < REQUIRED_PAIN_POINTS_PER_GATE) {
        processedPainPoints.push({
          id: `placeholder-${gateId}-${processedPainPoints.length + 1}`,
          title: `Pain Point ${processedPainPoints.length + 1} (Placeholder)`,
          tools: []
        });
      }
    } else if (processedPainPoints.length > REQUIRED_PAIN_POINTS_PER_GATE) {
      warnings.push(`Gate "${gateId}" has ${processedPainPoints.length} pain points (need ${REQUIRED_PAIN_POINTS_PER_GATE})`);
      processedPainPoints = processedPainPoints.slice(0, REQUIRED_PAIN_POINTS_PER_GATE);
    }
    
    const gateMapping = {
      id: gateId,
      title: gate.title || gate.gateName,
      description: gate.description || '',
      painPoints: []
    };
    
    // Process each pain point
    for (const painPoint of processedPainPoints) {
      const painPointId = painPoint.id;
      let toolIds = painPoint.tools || [];
      
      // Ensure exactly 3 tools
      if (toolIds.length < REQUIRED_TOOLS_PER_PAIN_POINT) {
        // Try to find tools from gateIds/painPointIds in tools
        const candidateTools = tools.filter(t => {
          const hasGateId = t.gateIds && t.gateIds.includes(gateId);
          const hasPainPointId = t.painPointIds && t.painPointIds.includes(painPointId);
          return hasGateId || hasPainPointId;
        });
        
        // Add candidate tools that aren't already in the list
        for (const candidate of candidateTools) {
          if (toolIds.length >= REQUIRED_TOOLS_PER_PAIN_POINT) break;
          if (!toolIds.includes(candidate.id) && !toolIds.includes(candidate.slug)) {
            toolIds.push(candidate.id || candidate.slug);
          }
        }
        
        // If still not enough, use fallback tools (first 3 from canonical)
        if (toolIds.length < REQUIRED_TOOLS_PER_PAIN_POINT) {
          const fallbackTools = tools
            .filter(t => !toolIds.includes(t.id) && !toolIds.includes(t.slug))
            .slice(0, REQUIRED_TOOLS_PER_PAIN_POINT - toolIds.length)
            .map(t => t.id || t.slug);
          toolIds = [...toolIds, ...fallbackTools];
        }
        
        if (toolIds.length < REQUIRED_TOOLS_PER_PAIN_POINT) {
          warnings.push(`Pain point "${painPointId}" in gate "${gateId}" has only ${toolIds.length} tools (need ${REQUIRED_TOOLS_PER_PAIN_POINT})`);
        }
      } else if (toolIds.length > REQUIRED_TOOLS_PER_PAIN_POINT) {
        toolIds = toolIds.slice(0, REQUIRED_TOOLS_PER_PAIN_POINT);
      }
      
      // Validate tool IDs exist
      const validToolIds = [];
      for (const toolId of toolIds) {
        if (toolMap.has(toolId)) {
          validToolIds.push(toolId);
        } else {
          warnings.push(`Tool "${toolId}" not found in canonical tools for pain point "${painPointId}"`);
        }
      }
      
      // If we lost tools, pad with fallbacks
      while (validToolIds.length < REQUIRED_TOOLS_PER_PAIN_POINT) {
        const fallback = tools.find(t => !validToolIds.includes(t.id) && !validToolIds.includes(t.slug));
        if (fallback) {
          validToolIds.push(fallback.id || fallback.slug);
        } else {
          break;
        }
      }
      
      gateMapping.painPoints.push({
        id: painPointId,
        title: painPoint.title,
        toolIds: validToolIds.slice(0, REQUIRED_TOOLS_PER_PAIN_POINT)
      });
      
      totalToolMappings += validToolIds.length;
    }
    
    totalPainPoints += gateMapping.painPoints.length;
    mapping.gates.push(gateMapping);
  }
  
  // Add stats
  mapping.stats = {
    totalGates: mapping.gates.length,
    totalPainPoints: totalPainPoints,
    totalToolMappings: totalToolMappings,
    warnings: warnings.length
  };
  
  // Write output
  console.log('[BUILD] Writing mapping to public/data/gates-painpoints-tools.json...');
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mapping, null, 2), 'utf8');
  
  // Print summary
  console.log('\n===== GATES MAPPING BUILD COMPLETE =====');
  console.log(`Gates: ${mapping.stats.totalGates}`);
  console.log(`Pain Points: ${mapping.stats.totalPainPoints}`);
  console.log(`Tool Mappings: ${mapping.stats.totalToolMappings}`);
  console.log(`Warnings: ${mapping.stats.warnings}`);
  
  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.slice(0, 10).forEach(w => console.log(`  - ${w}`));
    if (warnings.length > 10) {
      console.log(`  ... and ${warnings.length - 10} more`);
    }
  }
  
  console.log(`\nOutput: ${OUTPUT_FILE}`);
  console.log('==========================================\n');
  
  return mapping;
}

// Run if called directly
if (require.main === module) {
  try {
    buildMapping();
  } catch (error) {
    console.error('[BUILD] Error building gates mapping:', error);
    process.exit(1);
  }
}

module.exports = { buildMapping };

