#!/usr/bin/env node
/**
 * Direct UTF-8 corruption fixer
 * Reads files and replaces corrupted byte sequences directly
 */

const fs = require('fs');
const path = require('path');

const FILES = [
  'public/insights.html',
  'public/platform-integrated.html',
];

// Read file, fix corruption, write back
function fixFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  console.log(`\n🔧 Processing: ${filePath}`);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`  ⚠️  File not found`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let originalLength = content.length;
  let changes = 0;
  
  // Fix search button - replace corrupted emoji with "Search"
  const searchButtonPattern = /Ã°Å¸"Â/g;
  if (content.match(searchButtonPattern)) {
    const count = (content.match(searchButtonPattern) || []).length;
    content = content.replace(searchButtonPattern, 'Search');
    changes += count;
    console.log(`  ✓ Fixed ${count} search button(s)`);
  }
  
  // Fix back arrow - replace corrupted arrow with ←
  const backArrowPattern = /Ã¢" Â/g;
  if (content.match(backArrowPattern)) {
    const count = (content.match(backArrowPattern) || []).length;
    content = content.replace(backArrowPattern, '←');
    changes += count;
    console.log(`  ✓ Fixed ${count} back arrow(s)`);
  }
  
  // Fix warning icon - replace corrupted warning with ⚠️
  const warningPattern = /Ã¢Å¡Â Ã¯Â¸Â/g;
  if (content.match(warningPattern)) {
    const count = (content.match(warningPattern) || []).length;
    content = content.replace(warningPattern, '⚠️');
    changes += count;
    console.log(`  ✓ Fixed ${count} warning icon(s)`);
  }
  
  // Fix remaining warning fragments
  const warningFragmentPattern = /⚠️ Ã¯Â¸Â/g;
  if (content.match(warningFragmentPattern)) {
    const count = (content.match(warningFragmentPattern) || []).length;
    content = content.replace(warningFragmentPattern, '⚠️');
    changes += count;
    console.log(`  ✓ Fixed ${count} warning fragment(s)`);
  }
  
  // Fix timer icon
  const timerPattern = /⏱️Â±/g;
  if (content.match(timerPattern)) {
    const count = (content.match(timerPattern) || []).length;
    content = content.replace(timerPattern, '⏱️');
    changes += count;
    console.log(`  ✓ Fixed ${count} timer icon(s)`);
  }
  
  // Fix timer in template literals
  const timerTemplatePattern = /⏱️Â± /g;
  if (content.match(timerTemplatePattern)) {
    const count = (content.match(timerTemplatePattern) || []).length;
    content = content.replace(timerTemplatePattern, '⏱️ ');
    changes += count;
    console.log(`  ✓ Fixed ${count} timer template(s)`);
  }
  
  // Fix home icon
  const homePattern = /🏠Â /g;
  if (content.match(homePattern)) {
    const count = (content.match(homePattern) || []).length;
    content = content.replace(homePattern, '🏠 ');
    changes += count;
    console.log(`  ✓ Fixed ${count} home icon(s)`);
  }
  
  // Fix search icon in links
  const searchLinkPattern = /Ã°Å¸"Â Search/g;
  if (content.match(searchLinkPattern)) {
    const count = (content.match(searchLinkPattern) || []).length;
    content = content.replace(searchLinkPattern, '🔍 Search');
    changes += count;
    console.log(`  ✓ Fixed ${count} search link(s)`);
  }
  
  // Fix chart icon
  const chartPattern = /Ã°Å¸"Å /g;
  if (content.match(chartPattern)) {
    const count = (content.match(chartPattern) || []).length;
    content = content.replace(chartPattern, '📊 ');
    changes += count;
    console.log(`  ✓ Fixed ${count} chart icon(s)`);
  }
  
  if (changes > 0) {
    // Remove BOM if present
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
      console.log(`  ✓ Removed UTF-8 BOM`);
    }
    
    fs.writeFileSync(fullPath, content, { encoding: 'utf8' });
    console.log(`  ✅ Fixed ${changes} corruption(s)`);
    return true;
  } else {
    console.log(`  ℹ️  No corruption found`);
    return false;
  }
}

console.log('🔍 Direct UTF-8 Corruption Fixer\n');

let totalFixed = 0;
for (const file of FILES) {
  if (fixFile(file)) {
    totalFixed++;
  }
}

console.log(`\n✅ Complete! Fixed ${totalFixed} file(s).`);

