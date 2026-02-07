/**
 * Consolidate Duplicates and Verify Production Readiness
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const PUBLIC_DIR = join(process.cwd(), 'public');

// Check which script versions are loaded
function checkScriptUsage() {
  console.log('\n=== Checking Script Usage ===');
  
  const htmlFiles = [
    'index.html',
    'tools.html',
    'insights.html',
    'gates/pain-point.html',
    'gates/gate.html',
    'tools/tool.html'
  ];
  
  const issues = [];
  
  for (const file of htmlFiles) {
    const filePath = join(PUBLIC_DIR, file);
    if (!existsSync(filePath)) continue;
    
    const content = readFileSync(filePath, 'utf8');
    
    // Check for non-hardened versions
    if (content.includes('gates-renderer.js') && !content.includes('gates-renderer.hardened.js')) {
      issues.push(`${file}: Uses non-hardened gates-renderer.js`);
    }
    if (content.includes('matrix-loader.js') && !content.includes('matrix-loader.hardened.js')) {
      issues.push(`${file}: Uses non-hardened matrix-loader.js`);
    }
    if (content.includes('ryd-bind.js') && !content.includes('ryd-bind.hardened.js')) {
      issues.push(`${file}: Uses non-hardened ryd-bind.js`);
    }
  }
  
  if (issues.length > 0) {
    console.log('⚠️  Issues found:');
    issues.forEach(i => console.log(`  ${i}`));
  } else {
    console.log('✅ All HTML files use hardened versions');
  }
  
  return issues.length === 0;
}

// Check for placeholders
function checkPlaceholders() {
  console.log('\n=== Checking for Placeholders ===');
  
  const jsFiles = readdirSync(join(PUBLIC_DIR, 'js')).filter(f => f.endsWith('.js'));
  let found = false;
  
  for (const file of jsFiles) {
    const content = readFileSync(join(PUBLIC_DIR, 'js', file), 'utf8');
    const badPatterns = [
      /TODO/i, /TBD/i, /\[PLACEHOLDER\]/i, /lorem ipsum/i
    ];
    
    for (const pattern of badPatterns) {
      if (pattern.test(content) && !content.includes('placeholder workthroughs')) {
        console.log(`⚠️  ${file}: Contains ${pattern}`);
        found = true;
      }
    }
  }
  
  if (!found) {
    console.log('✅ No critical placeholders found');
  }
  
  return !found;
}

// Main
const scriptOk = checkScriptUsage();
const placeholderOk = checkPlaceholders();

if (scriptOk && placeholderOk) {
  console.log('\n✅ Production verification complete');
} else {
  console.log('\n⚠️  Some issues found - review above');
  process.exit(1);
}
