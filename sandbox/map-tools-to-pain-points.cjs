/**
 * Map Tools to Pain Points
 * Creates tool mappings in pain-points.json based on tool gateIds and painPointIds
 */

const fs = require('fs');
const path = require('path');

const TOOLS_FILE = path.join(__dirname, '..', 'public', 'data', 'tools.json');
const PAIN_POINTS_FILE = path.join(__dirname, '..', 'public', 'data', 'pain-points.json');
const GATES_FILE = path.join(__dirname, '..', 'public', 'data', 'gates.json');

function mapToolsToPainPoints() {
  console.log('[MAP] Loading data files...');
  
  // Load tools
  const toolsData = JSON.parse(fs.readFileSync(TOOLS_FILE, 'utf8'));
  const tools = toolsData.tools || [];
  console.log(`[MAP] Loaded ${tools.length} tools`);
  
  // Load gates
  const gatesData = JSON.parse(fs.readFileSync(GATES_FILE, 'utf8'));
  const gates = gatesData.gates || [];
  const gateIds = gates.map(g => g.id);
  console.log(`[MAP] Loaded ${gates.length} gates`);
  
  // Load pain points
  const painPointsData = JSON.parse(fs.readFileSync(PAIN_POINTS_FILE, 'utf8'));
  const painPoints = painPointsData.painPoints || {};
  console.log(`[MAP] Loaded pain points for ${Object.keys(painPoints).length} gates`);
  
  // Create mapping: gateId -> painPointId -> tools[]
  const mappings = {};
  let totalMappings = 0;
  
  // Initialize structure
  Object.keys(painPoints).forEach(gateId => {
    mappings[gateId] = {};
    painPoints[gateId].forEach(pp => {
      mappings[gateId][pp.id] = [];
    });
  });
  
  // Map each tool to its pain points
  tools.forEach(tool => {
    const toolId = tool.id || tool.slug;
    const toolSlug = tool.slug || tool.id;
    
    if (!toolId) {
      console.warn(`[MAP] Tool missing id/slug:`, tool);
      return;
    }
    
    const gateIds = tool.gateIds || [];
    const painPointIds = tool.painPointIds || [];
    
    if (gateIds.length === 0 && painPointIds.length === 0) {
      console.warn(`[MAP] Tool ${toolId} has no gateIds or painPointIds`);
      return;
    }
    
    // If tool has explicit painPointIds, use those
    if (painPointIds.length > 0) {
      painPointIds.forEach(ppId => {
        // Find which gate this pain point belongs to
        let found = false;
        for (const gateId of gateIds.length > 0 ? gateIds : Object.keys(painPoints)) {
          if (painPoints[gateId]) {
            const pp = painPoints[gateId].find(p => p.id === ppId);
            if (pp) {
              if (!mappings[gateId][ppId]) {
                mappings[gateId][ppId] = [];
              }
              if (!mappings[gateId][ppId].includes(toolSlug)) {
                mappings[gateId][ppId].push(toolSlug);
                totalMappings++;
                found = true;
              }
            }
          }
        }
        if (!found) {
          console.warn(`[MAP] Pain point ${ppId} not found in any gate for tool ${toolId}`);
        }
      });
    } else if (gateIds.length > 0) {
      // If tool only has gateIds, add to all pain points in those gates
      gateIds.forEach(gateId => {
        if (painPoints[gateId]) {
          painPoints[gateId].forEach(pp => {
            if (!mappings[gateId][pp.id]) {
              mappings[gateId][pp.id] = [];
            }
            if (!mappings[gateId][pp.id].includes(toolSlug)) {
              mappings[gateId][pp.id].push(toolSlug);
              totalMappings++;
            }
          });
        }
      });
    }
  });
  
  // Update pain points with tool mappings
  Object.keys(painPoints).forEach(gateId => {
    painPoints[gateId].forEach(pp => {
      const toolSlugs = mappings[gateId][pp.id] || [];
      if (toolSlugs.length > 0) {
        pp.tools = toolSlugs;
      }
    });
  });
  
  // Write updated pain points
  const updatedData = {
    ...painPointsData,
    painPoints: painPoints,
    version: "2.0",
    generated: new Date().toISOString(),
    note: "40 pain points per gate with tool mappings"
  };
  
  fs.writeFileSync(
    PAIN_POINTS_FILE,
    JSON.stringify(updatedData, null, 2),
    'utf8'
  );
  
  console.log('\n[MAP] ===== MAPPING SUMMARY =====');
  console.log(`Tools processed: ${tools.length}`);
  console.log(`Total tool mappings created: ${totalMappings}`);
  console.log(`Gates with mappings: ${Object.keys(mappings).length}`);
  
  // Count pain points with tools
  let painPointsWithTools = 0;
  Object.keys(painPoints).forEach(gateId => {
    painPoints[gateId].forEach(pp => {
      if (pp.tools && pp.tools.length > 0) {
        painPointsWithTools++;
      }
    });
  });
  
  console.log(`Pain points with tools: ${painPointsWithTools}`);
  console.log(`Pain points without tools: ${480 - painPointsWithTools}`);
  
  // Show sample mappings
  console.log('\n[MAP] Sample mappings:');
  let samplesShown = 0;
  for (const gateId of Object.keys(painPoints)) {
    if (samplesShown >= 5) break;
    const ppWithTools = painPoints[gateId].find(pp => pp.tools && pp.tools.length > 0);
    if (ppWithTools) {
      console.log(`  ${gateId}/${ppWithTools.id}: ${ppWithTools.tools.length} tools`);
      console.log(`    Tools: ${ppWithTools.tools.join(', ')}`);
      samplesShown++;
    }
  }
  
  console.log('\n[MAP] Updated pain-points.json with tool mappings');
  console.log('==========================================\n');
}

// Run if called directly
if (require.main === module) {
  mapToolsToPainPoints();
}

module.exports = { mapToolsToPainPoints };

