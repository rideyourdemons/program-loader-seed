#!/usr/bin/env node
/**
 * Content Integrity Gate - Build-Time Validation
 * 
 * PRODUCTION REQUIREMENT: Fails build if:
 * - Placeholder content exists
 * - Required fields missing
 * - Word count below threshold
 * 
 * SECURITY/IP RULE: Never dumps full tool content. Only reports:
 * - File paths
 * - Tool IDs/slugs
 * - Field names
 * - Word counts
 * - Error types
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const PLACEHOLDER_PATTERNS = [
  /placeholder/gi,
  /coming soon/gi,
  /lorem/gi,
  /to be determined/gi,
  /tbd/gi,
  /TODO/gi,
  /FIXME/gi,
  /helps you\. This practice supports/gi,
  /Use it when you need a clear, structured approach/gi
];

const REQUIRED_FIELDS = ['title', 'disclaimer', 'how_it_works', 'where_it_came_from', 'steps'];
const MIN_WORD_COUNT = 600;
const TARGET_WORD_COUNT = { min: 700, max: 1200 };

function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function extractToolContent(tool) {
  const parts = [];
  if (tool.title) parts.push(tool.title);
  if (tool.description) parts.push(tool.description);
  if (tool.summary) parts.push(tool.summary);
  if (tool.problem) parts.push(tool.problem);
  if (tool.how_it_works) parts.push(tool.how_it_works);
  if (tool.howWhyWorks) parts.push(tool.howWhyWorks);
  if (tool.mechanism) parts.push(tool.mechanism);
  if (tool.where_it_came_from) parts.push(typeof tool.where_it_came_from === 'string' ? tool.where_it_came_from : JSON.stringify(tool.where_it_came_from));
  if (tool.origin) parts.push(tool.origin);
  
  if (tool.steps && Array.isArray(tool.steps)) {
    tool.steps.forEach(step => {
      if (typeof step === 'string') parts.push(step);
      else if (step.content) parts.push(step.content);
      else if (step.instruction) parts.push(step.instruction);
    });
  }
  
  if (tool.walkthroughs && Array.isArray(tool.walkthroughs)) {
    tool.walkthroughs.forEach(wt => {
      if (wt.steps && Array.isArray(wt.steps)) {
        wt.steps.forEach(step => {
          if (typeof step === 'string') parts.push(step);
        });
      }
    });
  }
  
  return parts.join(' ');
}

function hasPlaceholder(text) {
  if (!text || typeof text !== 'string') return false;
  return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(text));
}

function validateTool(tool, filePath) {
  const errors = [];
  const warnings = [];
  
  const content = extractToolContent(tool);
  const wordCount = countWords(content);
  
  // Check word count
  if (wordCount < MIN_WORD_COUNT) {
    errors.push(`Word count ${wordCount} below minimum ${MIN_WORD_COUNT}`);
  } else if (wordCount < TARGET_WORD_COUNT.min) {
    warnings.push(`Word count ${wordCount} below target ${TARGET_WORD_COUNT.min}`);
  }
  
  // Check for placeholders
  if (hasPlaceholder(content)) {
    errors.push('Contains placeholder/generic content');
  }
  
  // Check required fields
  const missingFields = [];
  if (!tool.title) missingFields.push('title');
  if (!tool.disclaimer) missingFields.push('disclaimer');
  
  const howItWorks = tool.how_it_works || tool.howWhyWorks || tool.mechanism;
  if (!howItWorks) missingFields.push('how_it_works');
  
  const whereItCameFrom = tool.where_it_came_from || tool.origin;
  if (!whereItCameFrom) missingFields.push('where_it_came_from');
  
  const hasSteps = (tool.steps && Array.isArray(tool.steps) && tool.steps.length > 0) ||
                   (tool.walkthroughs && Array.isArray(tool.walkthroughs) && tool.walkthroughs.length > 0);
  if (!hasSteps) missingFields.push('steps');
  
  if (missingFields.length > 0) {
    errors.push(`Missing required fields: ${missingFields.join(', ')}`);
  }
  
  return {
    id: tool.id || tool.slug || 'unknown',
    filePath,
    wordCount,
    errors,
    warnings,
    missingFields
  };
}

function scanToolFiles() {
  const toolFiles = [];
  const scanDirs = [
    path.join(PROJECT_ROOT, 'public', 'data'),
    path.join(PROJECT_ROOT, 'public', 'store')
  ];
  
  scanDirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    
    function walkDir(currentPath) {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      entries.forEach(entry => {
        const fullPath = path.join(currentPath, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.json') && 
                   (entry.name.includes('tools') || entry.name.includes('canonical'))) {
          toolFiles.push(fullPath);
        }
      });
    }
    
    walkDir(dir);
  });
  
  return toolFiles;
}

function loadToolsFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    if (Array.isArray(data)) {
      return data.map((tool, idx) => ({ tool, index: idx }));
    } else if (data.tools && Array.isArray(data.tools)) {
      return data.tools.map((tool, idx) => ({ tool, index: idx }));
    } else if (data.id || data.slug) {
      return [{ tool: data, index: 0 }];
    }
    
    return [];
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error.message);
    return [];
  }
}

// Main validation
console.log('\n' + '='.repeat(80));
console.log('🔒 CONTENT INTEGRITY GATE - BUILD-TIME VALIDATION');
console.log('='.repeat(80) + '\n');

const toolFiles = scanToolFiles();
console.log(`Scanning ${toolFiles.length} tool files...\n`);

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  failures: []
};

toolFiles.forEach(filePath => {
  const tools = loadToolsFromFile(filePath);
  
  tools.forEach(({ tool, index }) => {
    if (!tool || typeof tool !== 'object') return;
    
    results.total++;
    const validation = validateTool(tool, path.relative(PROJECT_ROOT, filePath));
    
    if (validation.errors.length === 0) {
      results.passed++;
    } else {
      results.failed++;
      results.failures.push({
        id: validation.id,
        file: validation.filePath,
        errors: validation.errors,
        wordCount: validation.wordCount,
        missingFields: validation.missingFields
      });
    }
  });
});

// Report (safe - no content dumps)
console.log('='.repeat(80));
console.log('📊 VALIDATION RESULTS');
console.log('='.repeat(80) + '\n');

console.log(`Total Tools: ${results.total}`);
console.log(`Passed: ${results.passed}`);
console.log(`Failed: ${results.failed}\n`);

if (results.failures.length > 0) {
  console.log('❌ FAILURES (First 20):\n');
  results.failures.slice(0, 20).forEach(failure => {
    console.log(`  Tool ID: ${failure.id}`);
    console.log(`  File: ${failure.file}`);
    console.log(`  Word Count: ${failure.wordCount}`);
    console.log(`  Errors: ${failure.errors.join('; ')}`);
    if (failure.missingFields.length > 0) {
      console.log(`  Missing: ${failure.missingFields.join(', ')}`);
    }
    console.log('');
  });
  
  if (results.failures.length > 20) {
    console.log(`  ... and ${results.failures.length - 20} more failures\n`);
  }
  
  console.log('='.repeat(80));
  console.log('❌ BUILD FAILED: Content integrity violations detected');
  console.log('='.repeat(80) + '\n');
  process.exit(1);
} else {
  console.log('='.repeat(80));
  console.log('✅ BUILD PASSED: All tools meet content integrity requirements');
  console.log('='.repeat(80) + '\n');
  process.exit(0);
}
