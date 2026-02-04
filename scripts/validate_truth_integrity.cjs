#!/usr/bin/env node
/**
 * scripts/validate_truth_integrity.cjs
 * 
 * Validates that all content is truth-based and no invention occurred.
 * FAILS build if violations found.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const TOOLS_FILE = path.join(DATA_DIR, 'tools.truth.json');

let errors = [];
let warnings = [];

function error(msg) {
  errors.push(msg);
  console.error(`❌ ${msg}`);
}

function warn(msg) {
  warnings.push(msg);
  console.log(`⚠️  ${msg}`);
}

function log(msg) {
  console.log(`✅ ${msg}`);
}

function validateTools() {
  if (!fs.existsSync(TOOLS_FILE)) {
    error('tools.truth.json not found. Run import_live_ryd_content.cjs first.');
    return;
  }
  
  const data = JSON.parse(fs.readFileSync(TOOLS_FILE, 'utf8'));
  const tools = data.tools || [];
  
  log(`Validating ${tools.length} tools...`);
  
  tools.forEach((tool, index) => {
    const prefix = `Tool ${index + 1} (${tool.slug || 'unknown'}):`;
    
    // Required fields
    if (!tool.title || tool.title.startsWith('[MISSING') || tool.title.startsWith('[EXTRACTION')) {
      error(`${prefix} Missing or invalid title`);
    }
    
    if (!tool.description) {
      error(`${prefix} Missing description`);
    }
    
    if (!tool.howWhyWorks) {
      error(`${prefix} Missing howWhyWorks section`);
    }
    
    // Methodology validation
    if (!tool.methodologyType || !['research', 'lived-experience', 'adapted-framework'].includes(tool.methodologyType)) {
      error(`${prefix} Invalid or missing methodologyType`);
    }
    
    // Citation requirements
    if (tool.methodologyType === 'research' && (!tool.citations || tool.citations.length === 0)) {
      error(`${prefix} Research-based tool missing citations`);
    }
    
    if (tool.methodologyType === 'lived-experience' && !tool.whereItCameFrom) {
      warn(`${prefix} Lived-experience tool should have whereItCameFrom`);
    }
    
    // Flag check
    if (tool.flags && tool.flags.length > 0) {
      tool.flags.forEach(flag => {
        if (flag === 'extraction-failed') {
          error(`${prefix} Extraction failed - content not available`);
        } else if (flag === 'missing-description') {
          error(`${prefix} Missing description`);
        } else if (flag === 'missing-how-why-works') {
          error(`${prefix} Missing howWhyWorks`);
        } else {
          warn(`${prefix} Flag: ${flag}`);
        }
      });
    }
    
    // Check for placeholder/invented content
    const placeholderPatterns = [
      /lorem ipsum/i,
      /placeholder/i,
      /example/i,
      /\[TODO\]/i,
      /\[FILL IN\]/i,
      /coming soon/i
    ];
    
    [tool.description, tool.howWhyWorks, tool.whereItCameFrom].forEach((text, i) => {
      if (text && placeholderPatterns.some(pattern => pattern.test(text))) {
        error(`${prefix} Contains placeholder text in ${['description', 'howWhyWorks', 'whereItCameFrom'][i]}`);
      }
    });
  });
  
  return tools.length;
}

function validateGates() {
  const gatesFile = path.join(DATA_DIR, 'gates.json');
  if (!fs.existsSync(gatesFile)) {
    error('gates.json not found');
    return 0;
  }
  
  const data = JSON.parse(fs.readFileSync(gatesFile, 'utf8'));
  const gates = data.gates || [];
  
  if (gates.length !== 12) {
    error(`Expected 12 gates, found ${gates.length}`);
  }
  
  gates.forEach((gate, index) => {
    if (!gate.id || !gate.title) {
      error(`Gate ${index + 1}: Missing id or title`);
    }
    
    // Ensure no descriptions (prevent invention)
    if (gate.description) {
      error(`Gate ${index + 1} (${gate.id}): Should not have description - titles only`);
    }
  });
  
  return gates.length;
}

function validatePainPoints() {
  const painPointsFile = path.join(DATA_DIR, 'pain-points.json');
  if (!fs.existsSync(painPointsFile)) {
    error('pain-points.json not found');
    return 0;
  }
  
  const data = JSON.parse(fs.readFileSync(painPointsFile, 'utf8'));
  const painPoints = data.painPoints || {};
  
  let total = 0;
  Object.keys(painPoints).forEach(gateId => {
    const points = painPoints[gateId] || [];
    total += points.length;
    
    if (points.length !== 40) {
      warn(`Gate ${gateId}: Expected 40 pain points, found ${points.length}`);
    }
    
    points.forEach((point, index) => {
      if (!point.id || !point.title) {
        error(`Gate ${gateId}, Pain Point ${index + 1}: Missing id or title`);
      }
      
      // Ensure no descriptions (prevent invention)
      if (point.description) {
        error(`Gate ${gateId}, Pain Point ${point.id}: Should not have description - titles only`);
      }
    });
  });
  
  return total;
}

function main() {
  console.log('\n🔍 Validating Truth Integrity...\n');
  
  const toolCount = validateTools();
  const gateCount = validateGates();
  const painPointCount = validatePainPoints();
  
  console.log('\n📊 Summary:');
  log(`Tools: ${toolCount}`);
  log(`Gates: ${gateCount}`);
  log(`Pain Points: ${painPointCount}`);
  log(`Warnings: ${warnings.length}`);
  log(`Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ VALIDATION FAILED');
    console.log('Build cannot proceed with truth integrity violations.\n');
    process.exit(1);
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Validation passed with warnings.');
    console.log('Review warnings before proceeding.\n');
  } else {
    console.log('\n✅ Validation passed. All content is truth-based.\n');
  }
}

main();

