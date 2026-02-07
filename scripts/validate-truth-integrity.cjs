/**
 * Validate Truth Integrity
 * 
 * Ensures content aligns with RYD principles:
 * - No false authority claims
 * - No manipulation or hype
 * - Grounded, emotionally honest content
 * - Based on lived experience and research
 * - No SEO gaming or keyword stuffing
 * - No medical/diagnostic claims
 */

const fs = require('fs');
const path = require('path');

const TOOLS_DIR = path.join(__dirname, '..', 'tools');

// Forbidden patterns for false authority/manipulation
const FORBIDDEN_PATTERNS = [
  // False authority
  /\b(scientists|experts|research|studies)\s+(prove|show|demonstrate)\s+(that\s+)?(this|it|you)\s+(will|can|guarantees?)\b/gi,
  /\b(proven|scientifically\s+proven|research-backed|evidence-based)\s+(to\s+)?(cure|heal|fix|solve|guarantee)\b/gi,
  /\b(doctors|therapists|psychologists)\s+(recommend|prescribe|endorse)\s+(this|it)\b/gi,
  
  // Manipulation/hype
  /\b(miracle|magic|instant|overnight|effortless|easy\s+fix)\b/gi,
  /\b(transform|revolutionary|breakthrough|game-changer)\s+(your|your\s+life)\b/gi,
  /\b(never\s+feel|always\s+be|completely\s+eliminate|totally\s+remove)\b/gi,
  
  // SEO gaming
  /\b(best|top|ultimate|complete|comprehensive)\s+(guide|method|technique|solution|tool)\s+(for|to)\s+(anxiety|depression|stress|mental\s+health)\b/gi,
  /\b(anxiety|depression|stress|mental\s+health)\s+(treatment|cure|solution|fix)\b/gi,
  
  // Medical/diagnostic claims
  /\b(diagnose|diagnosis|symptom|disorder|disease|illness|condition)\b/gi,
  /\b(medication|prescription|drug|therapy|treatment)\s+(for|to)\s+(anxiety|depression|ptsd|ocd|adhd)\b/gi,
  
  // Outcome promises
  /\b(you\s+will|you\s+must|you\s+should|you\s+need\s+to)\s+(feel|be|have|get|achieve)\s+(better|happy|healed|cured|fixed)\b/gi,
  /\b(results?|outcomes?|success)\s+(are\s+)?(guaranteed|promised|assured|certain)\b/gi
];

// Warning patterns (less severe but should be flagged)
const WARNING_PATTERNS = [
  /\b(should|must|need\s+to|have\s+to)\s+(always|never|every\s+time)\b/gi,
  /\b(only|exclusively|solely)\s+(way|method|solution)\b/gi,
  /\b(works\s+for\s+everyone|everyone\s+can|anyone\s+can)\b/gi
];

function containsForbiddenPattern(text) {
  if (!text || typeof text !== 'string') return false;
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

function containsWarningPattern(text) {
  if (!text || typeof text !== 'string') return false;
  for (const pattern of WARNING_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

function isEmotionallyHonest(text) {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  
  // Check for emotionally honest language
  const honestMarkers = [
    'sometimes', 'may', 'might', 'can help', 'for some', 'if it resonates',
    'this is one way', 'experiment', 'see what works', 'try it',
    'your experience may vary', 'not everyone', 'some people find'
  ];
  
  // Check for manipulative language
  const manipulativeMarkers = [
    'always works', 'guaranteed', 'proven', 'scientifically proven',
    'miracle', 'instant', 'effortless', 'never fail'
  ];
  
  const hasHonestMarkers = honestMarkers.some(marker => lower.includes(marker));
  const hasManipulativeMarkers = manipulativeMarkers.some(marker => lower.includes(marker));
  
  // Prefer honest markers, flag if only manipulative
  if (hasManipulativeMarkers && !hasHonestMarkers) {
    return false;
  }
  
  return true;
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
      
      // Check all text fields
      const textFields = [
        { name: 'description', value: tool.description || tool.action },
        { name: 'how_it_works', value: tool.how_it_works },
        { name: 'where_it_came_from', value: tool.where_it_came_from },
        { name: 'disclaimer', value: tool.disclaimer },
        { name: 'title', value: tool.title || tool.name }
      ];
      
      // Check steps if they exist
      if (tool.steps && Array.isArray(tool.steps)) {
        tool.steps.forEach((step, stepIndex) => {
          if (typeof step === 'string') {
            textFields.push({ name: `steps[${stepIndex}]`, value: step });
          }
        });
      }
      
      for (const field of textFields) {
        if (!field.value || typeof field.value !== 'string') continue;
        
        // Check for forbidden patterns
        if (containsForbiddenPattern(field.value)) {
          errors.push(`${toolPrefix}: '${field.name}' contains forbidden false authority/manipulation/medical language`);
        }
        
        // Check for warning patterns
        if (containsWarningPattern(field.value)) {
          warnings.push(`${toolPrefix}: '${field.name}' contains potentially manipulative language (review recommended)`);
        }
        
        // Check emotional honesty (for main content fields)
        if (['description', 'how_it_works', 'where_it_came_from'].includes(field.name)) {
          if (!isEmotionallyHonest(field.value)) {
            warnings.push(`${toolPrefix}: '${field.name}' may lack emotional honesty - consider more nuanced language`);
          }
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
  console.log('[VALIDATE] Validating truth integrity and RYD compliance...\n');
  
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
      allWarnings.slice(0, 20).forEach(warn => console.warn(`   - ${warn}`));
      if (allWarnings.length > 20) {
        console.warn(`   ... and ${allWarnings.length - 20} more warnings`);
      }
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
    console.error('[VALIDATE] Error validating truth integrity:', error);
    process.exit(1);
  }
}

module.exports = { validateAllTools, validateToolFile };
