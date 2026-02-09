/**
 * Production-Grade Tool JSON Validator
 * HARD FAIL rules - NO unsafe, placeholder, or non-compliant content can deploy
 */

const fs = require('fs');
const path = require('path');
const { isAnchor } = require('./anchor-schema.cjs');

const TOOLS_DIR = path.join(__dirname, '..', 'tools');

// HARD FAIL: Placeholder patterns (block deployment)
const PLACEHOLDER_PATTERNS = [
  /\bTBD\b/i,
  /\bTODO\b/i,
  /\blorem\b/i,
  /\bplaceholder\b/i,
  /\bexample\b/i,
  /\bsample\b/i,
  /\btest\s+text\b/i,
  /\b\[TODO\]/i,
  /\b\[TBD\]/i,
  /\b\[PLACEHOLDER\]/i
];

// HARD FAIL: Unsafe instruction patterns (more precise to avoid false positives)
const UNSAFE_PATTERNS = [
  // Self-harm instructions (more specific)
  /\b(self.?harm|self.?injury|cut\s+yourself|kill\s+yourself|end\s+your\s+life|suicide)\b/i,
  // Illegal activity (more specific)
  /\b(steal\s+from|rob\s+a|assault\s+someone|commit\s+violence|illegal\s+activity|drug\s+abuse)\b/i,
  // Hate/harassment (more specific)
  /\b(hate\s+on|harass\s+someone|threaten\s+someone|discriminate\s+against|racist\s+language|sexist\s+language|homophobic\s+language)\b/i
];

// Minimum length requirements
const MIN_LENGTHS = {
  purpose: 40,
  how_and_why: 80,
  where_it_came_from_description: 30
};

// Valid provenance types
const VALID_PROVENANCE_TYPES = [
  'lived_experience',
  'research',
  'adapted',
  'training'
];

/**
 * Check for placeholder content
 */
function containsPlaceholder(text) {
  if (!text || typeof text !== 'string') return false;
  const normalized = text.trim();
  if (normalized === '' || normalized === 'null' || normalized === 'undefined') {
    return true;
  }
  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(normalized)) {
      return true;
    }
  }
  return false;
}

/**
 * Check for unsafe instruction patterns
 */
function containsUnsafePattern(text) {
  if (!text || typeof text !== 'string') return false;
  for (const pattern of UNSAFE_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Validate minimum length
 */
function validateMinLength(field, value, minLength) {
  if (!value || typeof value !== 'string') {
    return { valid: false, error: `Field '${field}' is missing or not a string` };
  }
  if (value.trim().length < minLength) {
    return { 
      valid: false, 
      error: `Field '${field}' must be at least ${minLength} characters (found ${value.trim().length})` 
    };
  }
  return { valid: true };
}

/**
 * Validate provenance enum
 */
function validateProvenance(whereItCameFrom) {
  if (!whereItCameFrom || typeof whereItCameFrom !== 'object') {
    return { valid: false, error: "'where_it_came_from' must be an object" };
  }
  
  if (whereItCameFrom.type) {
    if (!VALID_PROVENANCE_TYPES.includes(whereItCameFrom.type)) {
      return { 
        valid: false, 
        error: `'where_it_came_from.type' must be one of: ${VALID_PROVENANCE_TYPES.join(', ')}` 
      };
    }
  }
  
  if (whereItCameFrom.description) {
    const lengthCheck = validateMinLength(
      'where_it_came_from.description',
      whereItCameFrom.description,
      MIN_LENGTHS.where_it_came_from_description
    );
    if (!lengthCheck.valid) {
      return lengthCheck;
    }
  }
  
  return { valid: true };
}

/**
 * Find all tool JSON files
 */
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

/**
 * Validate a single tool file
 */
function validateToolFile(filePath) {
  const errors = [];
  const relativePath = path.relative(process.cwd(), filePath);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Skip anchors - they have their own schema
    if (isAnchor(data, filePath)) {
      return { errors: [], warnings: [] };
    }
    
    // Extract tools array
    let tools = [];
    if (Array.isArray(data.tools)) {
      tools = data.tools;
    } else if (data.tools && Array.isArray(data.tools)) {
      tools = data.tools;
    } else {
      tools = [data];
    }
    
    // Validate each tool
    tools.forEach((tool, index) => {
      const toolPrefix = `${relativePath}[${index}]`;
      
      // HARD FAIL: Check for placeholders
      const fieldsToCheck = ['name', 'title', 'description', 'action', 'how_it_works', 'where_it_came_from'];
      fieldsToCheck.forEach(field => {
        const value = tool[field];
        if (value && typeof value === 'string') {
          if (containsPlaceholder(value)) {
            errors.push(`${toolPrefix}: Field '${field}' contains placeholder content (TBD, TODO, lorem, etc.)`);
          }
          if (containsUnsafePattern(value)) {
            errors.push(`${toolPrefix}: Field '${field}' contains unsafe instruction patterns`);
          }
        }
      });
      
      // HARD FAIL: Check steps array for placeholders/unsafe patterns
      if (Array.isArray(tool.steps)) {
        tool.steps.forEach((step, stepIndex) => {
          if (typeof step === 'string') {
            if (containsPlaceholder(step)) {
              errors.push(`${toolPrefix}: steps[${stepIndex}] contains placeholder content`);
            }
            if (containsUnsafePattern(step)) {
              errors.push(`${toolPrefix}: steps[${stepIndex}] contains unsafe instruction patterns`);
            }
          }
        });
      }
      
      // HARD FAIL: Minimum length checks
      const purpose = tool.description || tool.action || '';
      if (purpose) {
        const lengthCheck = validateMinLength('purpose/description', purpose, MIN_LENGTHS.purpose);
        if (!lengthCheck.valid) {
          errors.push(`${toolPrefix}: ${lengthCheck.error}`);
        }
      }
      
      const howAndWhy = tool.how_it_works || '';
      if (howAndWhy) {
        const lengthCheck = validateMinLength('how_it_works', howAndWhy, MIN_LENGTHS.how_and_why);
        if (!lengthCheck.valid) {
          errors.push(`${toolPrefix}: ${lengthCheck.error}`);
        }
      }
      
      // HARD FAIL: Validate where_it_came_from (supports both object and string formats)
      if (tool.where_it_came_from) {
        if (typeof tool.where_it_came_from === 'object' && !Array.isArray(tool.where_it_came_from)) {
          // Object format - validate provenance enum
          const provenanceCheck = validateProvenance(tool.where_it_came_from);
          if (!provenanceCheck.valid) {
            errors.push(`${toolPrefix}: ${provenanceCheck.error}`);
          }
        } else if (typeof tool.where_it_came_from === 'string') {
          // Legacy string format - check minimum length and no placeholders
          const lengthCheck = validateMinLength(
            'where_it_came_from',
            tool.where_it_came_from,
            MIN_LENGTHS.where_it_came_from_description
          );
          if (!lengthCheck.valid) {
            errors.push(`${toolPrefix}: ${lengthCheck.error}`);
          }
          if (containsPlaceholder(tool.where_it_came_from)) {
            errors.push(`${toolPrefix}: Field 'where_it_came_from' contains placeholder content`);
          }
        } else {
          errors.push(`${toolPrefix}: 'where_it_came_from' must be a string or object`);
        }
      } else {
        errors.push(`${toolPrefix}: Missing required field 'where_it_came_from'`);
      }
      
      // HARD FAIL: Block null/empty strings (name OR title required, not both)
      const nameOrTitle = tool.name || tool.title;
      if (!nameOrTitle || nameOrTitle === null || nameOrTitle === undefined || (typeof nameOrTitle === 'string' && nameOrTitle.trim() === '')) {
        errors.push(`${toolPrefix}: Field 'name' or 'title' is required and cannot be null, undefined, or empty`);
      }
      
      const requiredStringFields = ['description', 'action'];
      requiredStringFields.forEach(field => {
        const value = tool[field];
        if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
          errors.push(`${toolPrefix}: Field '${field}' cannot be null, undefined, or empty`);
        }
      });
      
    });
    
  } catch (err) {
    if (err instanceof SyntaxError) {
      errors.push(`${relativePath}: Invalid JSON - ${err.message}`);
    } else {
      errors.push(`${relativePath}: Error reading file - ${err.message}`);
    }
  }
  
  return { errors, warnings: [] };
}

/**
 * Validate all tool files
 */
function validateAllTools() {
  console.log('[VALIDATE] Production guardrails validation...\n');
  console.log('Scanning all tool files recursively, including tools/mens-mental-health/ folder...\n');
  
  const toolFiles = findAllToolFiles(TOOLS_DIR);
  const allErrors = [];
  const allWarnings = [];
  
  if (toolFiles.length === 0) {
    console.warn('⚠️  No tool JSON files found in', TOOLS_DIR);
    return { success: true, errors: [], warnings: [] };
  }
  
  // Count files in mens-mental-health folder specifically
  const mensMentalHealthFiles = toolFiles.filter(f => f.includes('mens-mental-health'));
  if (mensMentalHealthFiles.length > 0) {
    console.log(`Found ${mensMentalHealthFiles.length} file(s) in tools/mens-mental-health/`);
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
    console.log('🛡️  RYD GUARDRAILS LOCKED — SAFE TO DEPLOY');
    console.log('');
    return { success: true, errors: [], warnings: [] };
  } else {
    console.error('❌ VALIDATION FAILED — DEPLOYMENT BLOCKED');
    console.error(`   Errors: ${allErrors.length}`);
    if (allWarnings.length > 0) {
      console.warn(`   Warnings: ${allWarnings.length}`);
    }
    allErrors.forEach(err => console.error(`   - ${err}`));
    if (allWarnings.length > 0) {
      allWarnings.forEach(warn => console.warn(`   - ${warn}`));
    }
    console.log('================================\n');
    return { success: false, errors: allErrors, warnings: allWarnings };
  }
}

// Run if called directly
if (require.main === module) {
  try {
    const result = validateAllTools();
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('[VALIDATE] Error validating tools:', error);
    process.exit(1);
  }
}

module.exports = { validateAllTools, validateToolFile };
