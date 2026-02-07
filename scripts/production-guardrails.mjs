/**
 * Production Guardrails - Validates data and blocks deploy on issues
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const DATA_DIR = join(ROOT_DIR, 'public', 'data');
const TOOLS_DIR = join(ROOT_DIR, 'tools');

const PLACEHOLDER_PATTERNS = [
  /\bTODO\b/i,
  /\bTBD\b/i,
  /\blorem\s+ipsum\b/i,
  /\bplaceholder\b/i,
  /\bcoming\s+soon\b/i,
  /\bnot\s+yet\s+available\b/i,
  /\bcontent\s+pending\s+import\b/i
];

/**
 * Validate tool JSON files
 */
function validateToolFiles() {
  const issues = [];
  
  try {
    const toolsPath = join(TOOLS_DIR, 'mens-mental-health');
    
    if (!existsSync(toolsPath)) {
      return issues; // No tools directory, skip
    }
    
    const files = readdirSync(toolsPath).filter(f => f.endsWith('.json'));
    
    files.forEach(file => {
      try {
        const content = readFileSync(join(toolsPath, file), 'utf8');
        const data = JSON.parse(content);
        
        // Check for placeholders
        const contentStr = JSON.stringify(data);
        PLACEHOLDER_PATTERNS.forEach(pattern => {
          if (pattern.test(contentStr)) {
            issues.push(`${file}: Contains placeholder text`);
          }
        });
        
        // Check for required fields in tools array
        if (data.tools && Array.isArray(data.tools)) {
          data.tools.forEach((tool, index) => {
            if (!tool.title && !tool.name && !tool.id) {
              issues.push(`${file}: Tool[${index}] missing title/name/id`);
            }
            if (!tool.description && !tool.summary) {
              issues.push(`${file}: Tool[${index}] missing description/summary`);
            }
          });
        }
      } catch (err) {
        issues.push(`${file}: ${err.message}`);
      }
    });
  } catch (err) {
    // Tools directory might not exist, that's OK
  }
  
  return issues;
}

/**
 * Validate data files
 */
function validateDataFiles() {
  const issues = [];
  
  try {
    const toolsData = JSON.parse(readFileSync(join(DATA_DIR, 'tools.json'), 'utf8'));
    const tools = toolsData.tools || [];
    
    tools.forEach((tool, index) => {
      if (!tool.title && !tool.name && !tool.id) {
        issues.push(`tools.json: Tool[${index}] missing title/name/id`);
      }
      if (!tool.slug && !tool.id) {
        issues.push(`tools.json: Tool[${index}] missing slug/id`);
      }
      
      // Check for placeholders
      const toolStr = JSON.stringify(tool);
      PLACEHOLDER_PATTERNS.forEach(pattern => {
        if (pattern.test(toolStr)) {
          issues.push(`tools.json: Tool[${index}] contains placeholder text`);
        }
      });
    });
  } catch (err) {
    issues.push(`tools.json: ${err.message}`);
  }
  
  try {
    const gatesData = JSON.parse(readFileSync(join(DATA_DIR, 'gates.json'), 'utf8'));
    const gates = gatesData.gates || [];
    
    gates.forEach((gate, index) => {
      if (!gate.id) {
        issues.push(`gates.json: Gate[${index}] missing id`);
      }
      if (!gate.title && !gate.gateName) {
        issues.push(`gates.json: Gate[${index}] missing title/gateName`);
      }
    });
  } catch (err) {
    issues.push(`gates.json: ${err.message}`);
  }
  
  return issues;
}

/**
 * Main validation
 */
function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  PRODUCTION GUARDRAILS - Data Validation');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const allIssues = [];
  
  // Validate tool files
  console.log('Validating tool JSON files...');
  const toolIssues = validateToolFiles();
  allIssues.push(...toolIssues);
  
  // Validate data files
  console.log('Validating data files...');
  const dataIssues = validateDataFiles();
  allIssues.push(...dataIssues);
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  
  if (allIssues.length === 0) {
    console.log('  ✅ All validations passed!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    process.exit(0);
  } else {
    console.log(`  ❌ Found ${allIssues.length} validation issues:`);
    allIssues.forEach(issue => console.log(`     - ${issue}`));
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('🚫 DEPLOYMENT BLOCKED - Fix issues before deploying');
    console.log('');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateToolFiles, validateDataFiles };
