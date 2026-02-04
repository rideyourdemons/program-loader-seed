/**
 * Validate Gates-PainPoints-Tools Mapping
 * 
 * Validates:
 * - Exactly 12 gates
 * - Exactly 40 pain points per gate
 * - Exactly 3 tools per pain point
 * - All tool IDs exist in canonical tools
 */

const fs = require('fs');
const path = require('path');

const MAPPING_FILE = path.join(__dirname, '..', 'public', 'data', 'gates-painpoints-tools.json');
const TOOLS_CANONICAL_FILE = path.join(__dirname, '..', 'public', 'data', 'tools-canonical.json');

const REQUIRED_GATES = 12;
const REQUIRED_PAIN_POINTS_PER_GATE = 40;
const REQUIRED_TOOLS_PER_PAIN_POINT = 3;

function validateMapping() {
  console.log('[VALIDATE] Validating gates-painpoints-tools mapping...\n');
  
  let errors = [];
  let warnings = [];
  
  // Load mapping
  if (!fs.existsSync(MAPPING_FILE)) {
    console.error(`[VALIDATE] ERROR: Mapping file not found: ${MAPPING_FILE}`);
    process.exit(1);
  }
  
  const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
  
  // Load tools for validation
  let toolMap = new Map();
  if (fs.existsSync(TOOLS_CANONICAL_FILE)) {
    const toolsData = JSON.parse(fs.readFileSync(TOOLS_CANONICAL_FILE, 'utf8'));
    const tools = toolsData.tools || [];
    tools.forEach(tool => {
      if (tool.id) toolMap.set(tool.id, tool);
      if (tool.slug && tool.slug !== tool.id) toolMap.set(tool.slug, tool);
    });
  } else {
    warnings.push('Tools canonical file not found, skipping tool ID validation');
  }
  
  // Validate gate count
  const gates = mapping.gates || [];
  if (gates.length !== REQUIRED_GATES) {
    errors.push(`Expected ${REQUIRED_GATES} gates, found ${gates.length}`);
  }
  
  // Validate each gate
  gates.forEach((gate, gateIndex) => {
    const gateId = gate.id;
    const painPoints = gate.painPoints || [];
    
    // Validate pain point count
    if (painPoints.length !== REQUIRED_PAIN_POINTS_PER_GATE) {
      errors.push(`Gate "${gateId}" (index ${gateIndex}): Expected ${REQUIRED_PAIN_POINTS_PER_GATE} pain points, found ${painPoints.length}`);
    }
    
    // Validate each pain point
    painPoints.forEach((painPoint, painPointIndex) => {
      const painPointId = painPoint.id;
      const toolIds = painPoint.toolIds || [];
      
      // Validate tool count
      if (toolIds.length !== REQUIRED_TOOLS_PER_PAIN_POINT) {
        errors.push(`Gate "${gateId}", Pain Point "${painPointId}" (index ${painPointIndex}): Expected ${REQUIRED_TOOLS_PER_PAIN_POINT} tools, found ${toolIds.length}`);
      }
      
      // Validate tool IDs exist
      if (toolMap.size > 0) {
        toolIds.forEach(toolId => {
          if (!toolMap.has(toolId)) {
            errors.push(`Gate "${gateId}", Pain Point "${painPointId}": Tool "${toolId}" not found in canonical tools`);
          }
        });
      }
      
      // Check for duplicate tools in same pain point
      const uniqueToolIds = new Set(toolIds);
      if (uniqueToolIds.size !== toolIds.length) {
        warnings.push(`Gate "${gateId}", Pain Point "${painPointId}": Has duplicate tools`);
      }
    });
  });
  
  // Print results
  console.log('===== VALIDATION RESULTS =====');
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ VALIDATION PASSED');
    console.log(`   Gates: ${gates.length}`);
    console.log(`   Pain Points: ${gates.reduce((sum, g) => sum + (g.painPoints || []).length, 0)}`);
    console.log(`   Tool Mappings: ${gates.reduce((sum, g) => sum + (g.painPoints || []).reduce((s, pp) => s + (pp.toolIds || []).length, 0), 0)}`);
    console.log('================================\n');
    return true;
  } else {
    if (errors.length > 0) {
      console.error('❌ VALIDATION FAILED');
      console.error(`   Errors: ${errors.length}`);
      errors.slice(0, 20).forEach(err => console.error(`   - ${err}`));
      if (errors.length > 20) {
        console.error(`   ... and ${errors.length - 20} more errors`);
      }
    }
    
    if (warnings.length > 0) {
      console.warn(`\n⚠️  Warnings: ${warnings.length}`);
      warnings.slice(0, 10).forEach(warn => console.warn(`   - ${warn}`));
      if (warnings.length > 10) {
        console.warn(`   ... and ${warnings.length - 10} more warnings`);
      }
    }
    
    console.log('================================\n');
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  try {
    const isValid = validateMapping();
    process.exit(isValid ? 0 : 1);
  } catch (error) {
    console.error('[VALIDATE] Error validating mapping:', error);
    process.exit(1);
  }
}

module.exports = { validateMapping };

