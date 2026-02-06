/**
 * Validate Tools - Gold Standard Content Completeness
 * 
 * Enforces minimum content quality standards:
 * - description >= 180 chars
 * - how_it_works >= 400 chars
 * - where_it_came_from >= 120 chars
 * - steps: 3-7 items, each >= 20 chars, action-phrased
 * - disclaimer must include: "This is here if you want it. Use what helps. Ignore what doesn't."
 * - Rejects medical/legal claims and "guarantees" language
 */

const fs = require('fs');
const path = require('path');

const TOOLS_DIR = path.join(__dirname, '..', 'tools');

// Minimum length requirements
const MIN_DESCRIPTION_LENGTH = 180;
const MIN_HOW_IT_WORKS_LENGTH = 400;
const MIN_WHERE_IT_CAME_FROM_LENGTH = 120;
const MIN_STEP_LENGTH = 20;
const MIN_STEPS_COUNT = 3;
const MAX_STEPS_COUNT = 7;

// Required disclaimer closing sentence
const REQUIRED_DISCLAIMER_SENTENCE = "This is here if you want it. Use what helps. Ignore what doesn't.";

// Forbidden language patterns
const FORBIDDEN_PATTERNS = [
  /\bguarantee(s|d|ing)?\b/gi,
  /\bguaranteed\s+(to|that|you|it|results?|outcomes?)\b/gi,
  /\bwill\s+(cure|heal|fix|solve|eliminate|remove)\b/gi,
  /\b(cure|heal|fix|solve|eliminate|remove)s?\s+(your|the|all|every)\b/gi,
  /\bmedical\s+(advice|treatment|diagnosis|prescription)\b/gi,
  /\b(legal|legal advice)\b/gi,
  /\b(doctor|physician|therapist|psychiatrist|psychologist)\s+(recommends?|says?|prescribes?)\b/gi,
  /\b(100%|guaranteed|promised)\s+(results?|outcomes?|success)\b/gi
];

function containsForbiddenLanguage(text) {
  if (!text || typeof text !== 'string') return false;
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

function isActionPhrased(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  // Check if it starts with an action verb (imperative mood)
  const actionVerbs = [
    'identify', 'list', 'write', 'draw', 'perform', 'set', 'focus', 'inhale', 'exhale',
    'repeat', 'label', 'cross', 'take', 'pick', 'act', 'process', 'lay', 'close',
    'slow', 'burn', 'audit', 'draft', 'script'
  ];
  const firstWord = trimmed.split(/\s+/)[0].toLowerCase();
  return actionVerbs.some(verb => firstWord.startsWith(verb)) || 
         trimmed.match(/^(Inhale|Exhale|Set|List|Write|Draw|Perform|Focus|Repeat|Label|Cross|Take|Pick|Act|Process|Lay|Close|Slow|Burn|Audit|Draft|Script)/i);
}

function validateToolFile(filePath) {
  const errors = [];
  const warnings = [];
  const relativePath = path.relative(process.cwd(), filePath);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Handle both schema variants
    let tools = [];
    if (Array.isArray(data.tools)) {
      tools = data.tools;
    } else if (data.tools && Array.isArray(data.tools)) {
      tools = data.tools;
    } else {
      tools = [data];
    }
    
    tools.forEach((tool, index) => {
      const toolPrefix = `${relativePath}[${index}]`;
      const toolName = tool.title || tool.name || `Tool ${index}`;
      
      // Validate description length
      const description = tool.description || tool.action;
      if (description) {
        if (description.length < MIN_DESCRIPTION_LENGTH) {
          errors.push(`${toolPrefix}: 'description' must be at least ${MIN_DESCRIPTION_LENGTH} characters (found ${description.length})`);
        }
        if (containsForbiddenLanguage(description)) {
          errors.push(`${toolPrefix}: 'description' contains forbidden medical/legal/guarantee language`);
        }
      }
      
      // Validate how_it_works length
      const howItWorks = tool.how_it_works;
      if (howItWorks) {
        if (howItWorks.length < MIN_HOW_IT_WORKS_LENGTH) {
          errors.push(`${toolPrefix}: 'how_it_works' must be at least ${MIN_HOW_IT_WORKS_LENGTH} characters (found ${howItWorks.length})`);
        }
        if (containsForbiddenLanguage(howItWorks)) {
          errors.push(`${toolPrefix}: 'how_it_works' contains forbidden medical/legal/guarantee language`);
        }
      } else {
        errors.push(`${toolPrefix}: Missing required field 'how_it_works'`);
      }
      
      // Validate where_it_came_from length
      const whereItCameFrom = tool.where_it_came_from;
      if (whereItCameFrom) {
        if (whereItCameFrom.length < MIN_WHERE_IT_CAME_FROM_LENGTH) {
          errors.push(`${toolPrefix}: 'where_it_came_from' must be at least ${MIN_WHERE_IT_CAME_FROM_LENGTH} characters (found ${whereItCameFrom.length})`);
        }
        if (containsForbiddenLanguage(whereItCameFrom)) {
          errors.push(`${toolPrefix}: 'where_it_came_from' contains forbidden medical/legal/guarantee language`);
        }
      } else {
        errors.push(`${toolPrefix}: Missing required field 'where_it_came_from'`);
      }
      
      // Validate steps
      const steps = tool.steps;
      if (!steps || !Array.isArray(steps)) {
        errors.push(`${toolPrefix}: 'steps' must be an array`);
      } else {
        if (steps.length < MIN_STEPS_COUNT) {
          errors.push(`${toolPrefix}: 'steps' must have at least ${MIN_STEPS_COUNT} items (found ${steps.length})`);
        }
        if (steps.length > MAX_STEPS_COUNT) {
          errors.push(`${toolPrefix}: 'steps' must have at most ${MAX_STEPS_COUNT} items (found ${steps.length})`);
        }
        
        steps.forEach((step, stepIndex) => {
          if (typeof step !== 'string') {
            errors.push(`${toolPrefix}: steps[${stepIndex}] must be a string`);
          } else {
            if (step.trim().length < MIN_STEP_LENGTH) {
              errors.push(`${toolPrefix}: steps[${stepIndex}] must be at least ${MIN_STEP_LENGTH} characters (found ${step.trim().length})`);
            }
            if (!isActionPhrased(step)) {
              warnings.push(`${toolPrefix}: steps[${stepIndex}] should be action-phrased (imperative mood)`);
            }
            if (containsForbiddenLanguage(step)) {
              errors.push(`${toolPrefix}: steps[${stepIndex}] contains forbidden medical/legal/guarantee language`);
            }
          }
        });
      }
      
      // Validate disclaimer
      const disclaimer = tool.disclaimer;
      if (!disclaimer) {
        errors.push(`${toolPrefix}: Missing required field 'disclaimer'`);
      } else if (typeof disclaimer !== 'string' || disclaimer.trim() === '') {
        errors.push(`${toolPrefix}: 'disclaimer' cannot be empty`);
      } else {
        if (!disclaimer.includes(REQUIRED_DISCLAIMER_SENTENCE)) {
          errors.push(`${toolPrefix}: 'disclaimer' must include the exact sentence: "${REQUIRED_DISCLAIMER_SENTENCE}"`);
        }
        if (containsForbiddenLanguage(disclaimer)) {
          errors.push(`${toolPrefix}: 'disclaimer' contains forbidden medical/legal/guarantee language`);
        }
      }
    });
    
  } catch (err) {
    if (err instanceof SyntaxError) {
      errors.push(`${relativePath}: Invalid JSON - ${err.message}`);
    } else {
      errors.push(`${relativePath}: Error reading file - ${err.message}`);
    }
  }
  
  return { errors, warnings };
}

function findAllToolFiles(dir) {
  const files = [];
  
  function walk(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

function validateAllTools() {
  console.log('[VALIDATE] Validating tool content completeness (gold standard)...\n');
  
  const toolFiles = findAllToolFiles(TOOLS_DIR);
  const allErrors = [];
  const allWarnings = [];
  
  if (toolFiles.length === 0) {
    console.warn('⚠️  No tool JSON files found in', TOOLS_DIR);
    return true;
  }
  
  console.log(`Found ${toolFiles.length} tool JSON file(s) to validate\n`);
  
  for (const file of toolFiles) {
    const { errors, warnings } = validateToolFile(file);
    allErrors.push(...errors);
    allWarnings.push(...warnings);
  }
  
  // Print results
  console.log('===== VALIDATION RESULTS =====');
  
  if (allErrors.length === 0 && allWarnings.length === 0) {
    console.log('✅ VALIDATION PASSED');
    console.log(`   Tool files: ${toolFiles.length}`);
    console.log('================================\n');
    return true;
  } else {
    if (allErrors.length > 0) {
      console.error('❌ VALIDATION FAILED');
      console.error(`   Errors: ${allErrors.length}`);
      allErrors.forEach(err => console.error(`   - ${err}`));
    }
    
    if (allWarnings.length > 0) {
      console.warn(`\n⚠️  Warnings: ${allWarnings.length}`);
      allWarnings.forEach(warn => console.warn(`   - ${warn}`));
    }
    
    console.log('================================\n');
    return allErrors.length === 0; // Pass if only warnings
  }
}

// Run if called directly
if (require.main === module) {
  try {
    const isValid = validateAllTools();
    process.exit(isValid ? 0 : 1);
  } catch (error) {
    console.error('[VALIDATE] Error validating tools:', error);
    process.exit(1);
  }
}

module.exports = { validateAllTools, validateToolFile };
