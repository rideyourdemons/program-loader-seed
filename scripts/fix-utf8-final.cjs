#!/usr/bin/env node
/**
 * Final UTF-8 corruption fixer - aggressive pattern matching
 */

const fs = require('fs');
const path = require('path');

const FILES = [
  'public/insights.html',
  'public/platform-integrated.html',
  'public/index-integrated.html',
];

function fixFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  console.log(`\n🔧 Processing: ${filePath}`);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`  ⚠️  File not found`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let changes = 0;
  
  // Fix search button - match any variation of corrupted search icon
  const searchPatterns = [
    [/Ã°Å¸"Â[^\s]*/g, 'Search'],  // Search button
    [/Ã°Å¸"Â Search/g, '🔍 Search'],  // Search link
  ];
  
  for (const [pattern, replacement] of searchPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, replacement);
      changes += matches.length;
      console.log(`  ✓ Fixed ${matches.length} search icon(s)`);
    }
  }
  
  // Fix back arrow - any variation
  const backPattern = /Ã¢"[\s]*Â[\s]*/g;
  if (content.match(backPattern)) {
    const count = (content.match(backPattern) || []).length;
    content = content.replace(backPattern, '← ');
    changes += count;
    console.log(`  ✓ Fixed ${count} back arrow(s)`);
  }
  
  // Fix warning icon fragments
  const warningPattern = /Ã¯Â¸Â/g;
  if (content.match(warningPattern)) {
    const count = (content.match(warningPattern) || []).length;
    content = content.replace(warningPattern, '');
    changes += count;
    console.log(`  ✓ Fixed ${count} warning fragment(s)`);
  }
  
  // Fix timer icon - match any variation
  const timerPatterns = [
    [/⏱️[Â±]+/g, '⏱️'],
    [/⏱️Â±/g, '⏱️'],
    [/⏱️Â/g, '⏱️'],
  ];
  
  for (const [pattern, replacement] of timerPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, replacement);
      changes += matches.length;
      console.log(`  ✓ Fixed ${matches.length} timer icon(s)`);
    }
  }
  
  // Fix home icon
  const homePattern = /🏠[Â\s]+/g;
  if (content.match(homePattern)) {
    const count = (content.match(homePattern) || []).length;
    content = content.replace(homePattern, '🏠 ');
    changes += count;
    console.log(`  ✓ Fixed ${count} home icon(s)`);
  }
  
  // Fix chart icon
  const chartPattern = /Ã°Å¸"Å[\s]*/g;
  if (content.match(chartPattern)) {
    const count = (content.match(chartPattern) || []).length;
    content = content.replace(chartPattern, '📊 ');
    changes += count;
    console.log(`  ✓ Fixed ${count} chart icon(s)`);
  }
  
  // Remove any remaining isolated corruption markers
  const isolatedPattern = /Â[\s]*/g;
  const isolatedMatches = content.match(isolatedPattern);
  if (isolatedMatches && isolatedMatches.length > 0) {
    // Only remove if it's clearly corruption (not part of a word)
    content = content.replace(/([^\w])Â([\s])/g, '$1$2');
    console.log(`  ✓ Cleaned isolated corruption markers`);
    changes++;
  }
  
  if (changes > 0) {
    // Remove BOM
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
    
    fs.writeFileSync(fullPath, content, { encoding: 'utf8' });
    console.log(`  ✅ Fixed ${changes} corruption(s)`);
    return true;
  } else {
    console.log(`  ℹ️  No corruption found`);
    return false;
  }
}

console.log('🔍 Final UTF-8 Corruption Fixer\n');

let totalFixed = 0;
for (const file of FILES) {
  if (fixFile(file)) {
    totalFixed++;
  }
}

console.log(`\n✅ Complete! Fixed ${totalFixed} file(s).`);
console.log('\n📋 Verification:');
console.log('  - Check browser for remaining "Ã" or "Â" characters');
console.log('  - Verify all buttons display correctly');

