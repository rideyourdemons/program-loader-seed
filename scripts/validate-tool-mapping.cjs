/**
 * Validate Tool JSON Files - Enforce Platform Skeleton
 * 
 * Validates that every tool JSON file includes:
 * - pillar_slug (string, exists in config/pillars.json)
 * - domain_slug (string, exists in config/domains.json)
 * - state_id (S1-S4, exists in config/states.json)
 * - tool_id (string unique within repo)
 * - title (string)
 * - slug (string, kebab-case)
 * - description (string)
 * - steps (array of strings)
 * - how_it_works (string)
 * - where_it_came_from (string)
 * - disclaimer (string; short; non-therapist; no outcome promises)
 * 
 * Rejects: empty strings, placeholders like "TODO", "TBD", "lorem"
 */

const fs = require('fs');
const path = require('path');

const TOOLS_DIR = path.join(__dirname, '..', 'tools');
const PILLARS_FILE = path.join(__dirname, '..', 'config', 'pillars.json');
const DOMAINS_FILE = path.join(__dirname, '..', 'config', 'domains.json');
const STATES_FILE = path.join(__dirname, '..', 'config', 'states.json');

// Load config files
let pillars = [];
let domains = [];
let states = [];
let pillarSlugs = new Set();
let domainSlugs = new Set();
let stateIds = new Set();

try {
  const pillarsData = JSON.parse(fs.readFileSync(PILLARS_FILE, 'utf8'));
  pillars = pillarsData.pillars || [];
  pillars.forEach(p => pillarSlugs.add(p.slug));
} catch (err) {
  console.error(`❌ Error loading ${PILLARS_FILE}: ${err.message}`);
  process.exit(1);
}

try {
  const domainsData = JSON.parse(fs.readFileSync(DOMAINS_FILE, 'utf8'));
  domains = domainsData.domains || [];
  domains.forEach(d => domainSlugs.add(d.slug));
} catch (err) {
  console.error(`❌ Error loading ${DOMAINS_FILE}: ${err.message}`);
  process.exit(1);
}

try {
  const statesData = JSON.parse(fs.readFileSync(STATES_FILE, 'utf8'));
  states = statesData.states || [];
  states.forEach(s => stateIds.add(s.id));
} catch (err) {
  console.error(`❌ Error loading ${STATES_FILE}: ${err.message}`);
  process.exit(1);
}

// Placeholder/forbidden patterns
const FORBIDDEN_PATTERNS = [
  /TODO/i,
  /TBD/i,
  /lorem/i,
  /placeholder/i,
  /example/i,
  /sample/i,
  /test\s+text/i,
  /\[.*?\]/g  // Brackets like [Project X] in examples are OK, but [TODO] is not
];

function isKebabCase(str) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(str);
}

function containsForbiddenPattern(text) {
  if (!text || typeof text !== 'string') return false;
  const normalized = text.trim().toLowerCase();
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(normalized)) {
      // Allow [Project X] style examples but not [TODO]
      if (pattern.source === '\\[.*?\\]' && !normalized.includes('[todo]') && !normalized.includes('[tbd]')) {
        continue;
      }
      return true;
    }
  }
  return false;
}

function validateToolFile(filePath) {
  const errors = [];
  const relativePath = path.relative(process.cwd(), filePath);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Handle both schema variants:
    // Variant 1: Array of tools with individual tool objects
    // Variant 2: Single tool object or tools array at root
    
    let tools = [];
    let pillarSlug = null;
    let domainSlug = null;
    
    if (Array.isArray(data.tools)) {
      tools = data.tools;
      pillarSlug = data.pillar_slug || data.pillar;
      domainSlug = data.domain_slug || data.domain;
    } else if (data.tools && Array.isArray(data.tools)) {
      tools = data.tools;
      pillarSlug = data.pillar_slug || data.pillar;
      domainSlug = data.domain_slug || data.domain;
    } else {
      // Single tool object
      tools = [data];
      pillarSlug = data.pillar_slug || data.pillar;
      domainSlug = data.domain_slug || data.domain;
    }
    
    // Validate root-level fields
    if (!pillarSlug) {
      errors.push(`${relativePath}: Missing 'pillar_slug' or 'pillar' field`);
    } else if (typeof pillarSlug !== 'string' || pillarSlug.trim() === '') {
      errors.push(`${relativePath}: 'pillar_slug' must be a non-empty string`);
    } else if (!pillarSlugs.has(pillarSlug)) {
      errors.push(`${relativePath}: 'pillar_slug' "${pillarSlug}" not found in config/pillars.json`);
    }
    
    if (!domainSlug) {
      errors.push(`${relativePath}: Missing 'domain_slug' or 'domain' field`);
    } else if (typeof domainSlug !== 'string' || domainSlug.trim() === '') {
      errors.push(`${relativePath}: 'domain_slug' must be a non-empty string`);
    } else if (!domainSlugs.has(domainSlug)) {
      errors.push(`${relativePath}: 'domain_slug' "${domainSlug}" not found in config/domains.json`);
    }
    
    // Validate each tool
    tools.forEach((tool, index) => {
      const toolPrefix = `${relativePath}[${index}]`;
      
      // Required fields
      const requiredFields = [
        { key: 'tool_id', alt: 'id', name: 'tool_id/id' },
        { key: 'state_id', alt: null, name: 'state_id' },
        { key: 'title', alt: 'name', name: 'title/name' },
        { key: 'slug', alt: null, name: 'slug' },
        { key: 'description', alt: 'action', name: 'description/action' },
        { key: 'steps', alt: null, name: 'steps' },
        { key: 'how_it_works', alt: null, name: 'how_it_works' },
        { key: 'where_it_came_from', alt: null, name: 'where_it_came_from' },
        { key: 'disclaimer', alt: null, name: 'disclaimer' }
      ];
      
      for (const field of requiredFields) {
        const value = tool[field.key] || tool[field.alt];
        if (!value) {
          errors.push(`${toolPrefix}: Missing required field '${field.name}'`);
        } else if (typeof value === 'string' && value.trim() === '') {
          errors.push(`${toolPrefix}: Field '${field.name}' cannot be empty`);
        } else if (containsForbiddenPattern(value)) {
          errors.push(`${toolPrefix}: Field '${field.name}' contains forbidden placeholder text`);
        }
      }
      
      // Validate state_id
      const stateId = tool.state_id || tool.id;
      if (stateId && !stateIds.has(stateId)) {
        errors.push(`${toolPrefix}: 'state_id' "${stateId}" not found in config/states.json (must be S1, S2, S3, or S4)`);
      }
      
      // Validate slug format
      const slug = tool.slug;
      if (slug && !isKebabCase(slug)) {
        errors.push(`${toolPrefix}: 'slug' "${slug}" must be kebab-case (lowercase letters, numbers, and hyphens only)`);
      }
      
      // Validate steps is array
      const steps = tool.steps;
      if (steps && !Array.isArray(steps)) {
        errors.push(`${toolPrefix}: 'steps' must be an array`);
      } else if (Array.isArray(steps)) {
        steps.forEach((step, stepIndex) => {
          if (typeof step !== 'string' || step.trim() === '') {
            errors.push(`${toolPrefix}: steps[${stepIndex}] must be a non-empty string`);
          } else if (containsForbiddenPattern(step)) {
            errors.push(`${toolPrefix}: steps[${stepIndex}] contains forbidden placeholder text`);
          }
        });
      }
    });
    
  } catch (err) {
    if (err instanceof SyntaxError) {
      errors.push(`${relativePath}: Invalid JSON - ${err.message}`);
    } else {
      errors.push(`${relativePath}: Error reading file - ${err.message}`);
    }
  }
  
  return errors;
}

function findAllToolFiles(dir) {
  const files = [];
  
  function walk(currentDir) {
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
  
  if (fs.existsSync(dir)) {
    walk(dir);
  }
  
  return files;
}

function validateAllTools() {
  console.log('[VALIDATE] Validating tool JSON files against platform skeleton...\n');
  
  const toolFiles = findAllToolFiles(TOOLS_DIR);
  const allErrors = [];
  
  if (toolFiles.length === 0) {
    console.warn('⚠️  No tool JSON files found in', TOOLS_DIR);
    return true;
  }
  
  console.log(`Found ${toolFiles.length} tool JSON file(s) to validate\n`);
  
  for (const file of toolFiles) {
    const errors = validateToolFile(file);
    allErrors.push(...errors);
  }
  
  // Print results
  console.log('===== VALIDATION RESULTS =====');
  
  if (allErrors.length === 0) {
    console.log('✅ VALIDATION PASSED');
    console.log(`   Tool files: ${toolFiles.length}`);
    console.log('================================\n');
    return true;
  } else {
    console.error('❌ VALIDATION FAILED');
    console.error(`   Errors: ${allErrors.length}`);
    allErrors.forEach(err => console.error(`   - ${err}`));
    console.log('================================\n');
    return false;
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
