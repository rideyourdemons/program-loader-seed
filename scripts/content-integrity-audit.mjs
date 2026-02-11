#!/usr/bin/env node
/**
 * Google-Level Content Integrity Audit
 * Phase 1: Systematic Content Discovery
 * 
 * Scans entire repository for:
 * - Tools with < 600 words
 * - Placeholder/fallback content
 * - Missing required RYD structure
 * - Fallback logic in code
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Placeholder patterns to detect
const PLACEHOLDER_PATTERNS = [
  /placeholder/gi,
  /lorem/gi,
  /coming soon/gi,
  /default text/gi,
  /to be determined/gi,
  /tbd/gi,
  /\[.*?\]/g, // [placeholder] style
  /TODO/gi,
  /FIXME/gi,
  /XXX/gi
];

// Fallback patterns in code
const FALLBACK_PATTERNS = [
  /\|\| ["']/g, // || "fallback"
  /if \(!.*\)\s*return/g, // if (!content) return
  /content \|\| fallback/gi,
  /\.content \|\|/g,
  /default:/gi,
  /fallback:/gi
];

// Required RYD structure fields
const REQUIRED_FIELDS = [
  'title',
  'disclaimer',
  'how_it_works',
  'where_it_came_from',
  'steps'
];

// RYD Production Structure (from directive)
const REQUIRED_SECTIONS = [
  'Tool Name',
  'The Lock',
  'The Trigger',
  'The Cost',
  'The Tool',
  'How & Why This Works',
  'Where It Came From'
];

function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function hasPlaceholder(text) {
  if (!text || typeof text !== 'string') return false;
  return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(text));
}

function extractToolContent(tool) {
  const content = [];
  
  if (tool.title) content.push(tool.title);
  if (tool.description) content.push(tool.description);
  if (tool.summary) content.push(tool.summary);
  if (tool.problem) content.push(tool.problem);
  if (tool.howWhyWorks) content.push(tool.howWhyWorks);
  if (tool.origin) content.push(tool.origin);
  if (tool.mechanism) content.push(tool.mechanism);
  if (tool.expectedOutcome) content.push(tool.expectedOutcome);
  
  // Steps content
  if (tool.steps && Array.isArray(tool.steps)) {
    tool.steps.forEach(step => {
      if (typeof step === 'string') {
        content.push(step);
      } else if (step.content) {
        content.push(step.content);
      } else if (step.instruction) {
        content.push(step.instruction);
      }
    });
  }
  
  // Walkthroughs content
  if (tool.walkthroughs && Array.isArray(tool.walkthroughs)) {
    tool.walkthroughs.forEach(wt => {
      if (wt.steps && Array.isArray(wt.steps)) {
        wt.steps.forEach(step => {
          if (typeof step === 'string') {
            content.push(step);
          }
        });
      }
    });
  }
  
  return content.join(' ');
}

function classifySeverity(tool, wordCount, hasPlaceholders, missingFields) {
  if (wordCount < 100) return 'CRITICAL';
  if (wordCount < 300) return 'CRITICAL';
  if (wordCount < 600) return 'THIN';
  if (hasPlaceholders) return 'CRITICAL';
  if (missingFields.length > 2) return 'CRITICAL';
  if (missingFields.length > 0) return 'THIN';
  return 'CLEAN';
}

function auditTool(tool, filePath) {
  const content = extractToolContent(tool);
  const wordCount = countWords(content);
  const hasPlaceholders = hasPlaceholder(content);
  
  // Check for generic summaries
  const genericPatterns = [
    /helps you\. This practice supports/gi,
    /This practice supports emotional regulation/gi,
    /Use it when you need a clear, structured approach/gi
  ];
  const isGeneric = genericPatterns.some(p => p.test(content));
  
  // Check required fields
  const missingFields = REQUIRED_FIELDS.filter(field => {
    if (field === 'steps') {
      return !tool.steps && !tool.walkthroughs;
    }
    if (field === 'how_it_works') {
      return !tool.how_it_works && !tool.howWhyWorks && !tool.mechanism;
    }
    if (field === 'where_it_came_from') {
      return !tool.where_it_came_from && !tool.origin;
    }
    return !tool[field];
  });
  
  const severity = classifySeverity(tool, wordCount, hasPlaceholders || isGeneric, missingFields);
  
  return {
    id: tool.id || tool.slug || 'unknown',
    filePath,
    wordCount,
    hasPlaceholders,
    isGeneric,
    missingFields,
    severity,
    title: tool.title || 'Untitled',
    hasEmptyContent: wordCount === 0,
    hasEmptySteps: (!tool.steps || tool.steps.length === 0) && (!tool.walkthroughs || tool.walkthroughs.length === 0)
  };
}

function scanToolFiles() {
  const toolFiles = [];
  const scanDirs = [
    path.join(PROJECT_ROOT, 'public', 'data'),
    path.join(PROJECT_ROOT, 'public', 'store'),
    path.join(PROJECT_ROOT, 'tools')
  ];
  
  scanDirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    
    function walkDir(currentPath) {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      
      entries.forEach(entry => {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
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
    
    // Handle different JSON structures
    if (Array.isArray(data)) {
      return data.map((tool, idx) => ({ tool, index: idx }));
    } else if (data.tools && Array.isArray(data.tools)) {
      return data.tools.map((tool, idx) => ({ tool, index: idx }));
    } else if (data.id || data.slug) {
      // Single tool object
      return [{ tool: data, index: 0 }];
    }
    
    return [];
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error.message);
    return [];
  }
}

function scanCodeForFallbacks() {
  const jsFiles = [];
  const scanDirs = [
    path.join(PROJECT_ROOT, 'public', 'js'),
    path.join(PROJECT_ROOT, 'scripts')
  ];
  
  scanDirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    
    function walkDir(currentPath) {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      
      entries.forEach(entry => {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.mjs') || entry.name.endsWith('.cjs'))) {
          jsFiles.push(fullPath);
        }
      });
    }
    
    walkDir(dir);
  });
  
  const fallbackFindings = [];
  
  jsFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, lineNum) => {
        FALLBACK_PATTERNS.forEach(pattern => {
          if (pattern.test(line)) {
            fallbackFindings.push({
              file: path.relative(PROJECT_ROOT, filePath),
              line: lineNum + 1,
              code: line.trim(),
              pattern: pattern.toString()
            });
          }
        });
      });
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  return fallbackFindings;
}

// Main audit execution
console.log('\n' + '='.repeat(80));
console.log('🔬 GOOGLE-LEVEL CONTENT INTEGRITY AUDIT');
console.log('='.repeat(80) + '\n');

console.log('📋 Phase 1: Systematic Content Discovery\n');

// Scan tool files
console.log('Scanning tool files...');
const toolFiles = scanToolFiles();
console.log(`Found ${toolFiles.length} JSON files to audit\n`);

const auditResults = {
  tools: [],
  fallbacks: [],
  summary: {
    totalTools: 0,
    critical: 0,
    thin: 0,
    clean: 0,
    wordCounts: [],
    placeholderCount: 0,
    genericCount: 0,
    missingFieldsCount: 0,
    emptyContentCount: 0,
    emptyStepsCount: 0
  }
};

// Audit each tool file
toolFiles.forEach(filePath => {
  const tools = loadToolsFromFile(filePath);
  
  tools.forEach(({ tool, index }) => {
    if (!tool || typeof tool !== 'object') return;
    
    const result = auditTool(tool, path.relative(PROJECT_ROOT, filePath));
    auditResults.tools.push(result);
    auditResults.summary.totalTools++;
    
    if (result.severity === 'CRITICAL') auditResults.summary.critical++;
    else if (result.severity === 'THIN') auditResults.summary.thin++;
    else auditResults.summary.clean++;
    
    if (result.hasPlaceholders) auditResults.summary.placeholderCount++;
    if (result.isGeneric) auditResults.summary.genericCount++;
    if (result.missingFields.length > 0) auditResults.summary.missingFieldsCount++;
    if (result.hasEmptyContent) auditResults.summary.emptyContentCount++;
    if (result.hasEmptySteps) auditResults.summary.emptyStepsCount++;
    
    auditResults.summary.wordCounts.push(result.wordCount);
  });
});

// Scan code for fallbacks
console.log('Scanning code for fallback logic...');
auditResults.fallbacks = scanCodeForFallbacks();
console.log(`Found ${auditResults.fallbacks.length} fallback patterns in code\n`);

// Generate report
const reportPath = path.join(PROJECT_ROOT, 'CONTENT_INTEGRITY_AUDIT_REPORT.json');
fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));

// Print summary
console.log('='.repeat(80));
console.log('📊 AUDIT SUMMARY');
console.log('='.repeat(80) + '\n');

console.log(`Total Tools Audited: ${auditResults.summary.totalTools}`);
console.log(`  CRITICAL: ${auditResults.summary.critical}`);
console.log(`  THIN: ${auditResults.summary.thin}`);
console.log(`  CLEAN: ${auditResults.summary.clean}\n`);

console.log(`Content Issues:`);
console.log(`  Placeholder content: ${auditResults.summary.placeholderCount}`);
console.log(`  Generic summaries: ${auditResults.summary.genericCount}`);
console.log(`  Missing required fields: ${auditResults.summary.missingFieldsCount}`);
console.log(`  Empty content: ${auditResults.summary.emptyContentCount}`);
console.log(`  Empty steps: ${auditResults.summary.emptyStepsCount}\n`);

if (auditResults.summary.wordCounts.length > 0) {
  const sorted = [...auditResults.summary.wordCounts].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median = sorted[Math.floor(sorted.length / 2)];
  const avg = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length);
  
  console.log(`Word Count Distribution:`);
  console.log(`  Min: ${min}`);
  console.log(`  Max: ${max}`);
  console.log(`  Median: ${median}`);
  console.log(`  Average: ${avg}\n`);
}

console.log(`Fallback Logic in Code: ${auditResults.fallbacks.length} instances\n`);

// List critical tools
const criticalTools = auditResults.tools.filter(t => t.severity === 'CRITICAL');
if (criticalTools.length > 0) {
  console.log('='.repeat(80));
  console.log('🚨 CRITICAL TOOLS (Require Immediate Attention)');
  console.log('='.repeat(80) + '\n');
  
  criticalTools.slice(0, 20).forEach(tool => {
    console.log(`ID: ${tool.id}`);
    console.log(`  File: ${tool.filePath}`);
    console.log(`  Title: ${tool.title}`);
    console.log(`  Word Count: ${tool.wordCount}`);
    console.log(`  Issues: ${[
      tool.hasPlaceholders && 'Placeholders',
      tool.isGeneric && 'Generic content',
      tool.hasEmptyContent && 'Empty content',
      tool.hasEmptySteps && 'Empty steps',
      tool.missingFields.length > 0 && `Missing: ${tool.missingFields.join(', ')}`
    ].filter(Boolean).join(', ')}`);
    console.log('');
  });
  
  if (criticalTools.length > 20) {
    console.log(`... and ${criticalTools.length - 20} more critical tools\n`);
  }
}

console.log(`\n✅ Full audit report saved to: ${path.relative(PROJECT_ROOT, reportPath)}\n`);
