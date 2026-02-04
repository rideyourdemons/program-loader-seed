#!/usr/bin/env node
/**
 * Fix UTF-8 encoding corruption in HTML files
 * Replaces common mojibake patterns with correct UTF-8 characters
 */

const fs = require('fs');
const path = require('path');

// Common corruption patterns and their correct replacements
// Note: Some patterns may appear differently due to double-encoding
const CORRUPTION_MAP = {
  // Search button - replace corrupted icon with text
  'Ã°Å¸"Â': 'Search',
  'Ã°Å¸"Â': 'Search',
  
  // Search icon in links
  'Ã°Å¸"Â Search': '🔍 Search',
  'Ã°Å¸"Â Search for More Help': '🔍 Search for More Help',
  
  // Chart/stat icon
  'Ã°Å¸"Å': '📊',
  'Ã°Å¸"Å ': '📊 ',
  
  // Arrow/back button corruption (multiple variants)
  'Ã¢" Â': '←',
  'Ã¢"Â': '←',
  'Ã¢" Â Back': '← Back',
  'Ã¢" Â Back to Search': '← Back to Search',
  
  // Warning/emergency icon corruption
  'Ã¢Å¡Â Ã¯Â¸Â': '⚠️',
  'Ã¢Å¡Â Ã¯Â¸Â Emergency': '⚠️ Emergency',
  'Ã¢Å¡Â Ã¯Â¸Â Emergency Situations': '⚠️ Emergency Situations',
  
  // Timer icon corruption
  '⏱️Â±': '⏱️',
  '⏱️Â': '⏱️',
  '⏱️Â± ': '⏱️ ',
  
  // Home icon corruption
  '🏠Â': '🏠',
  '🏠Â ': '🏠 ',
  '🏠Â Visit': '🏠 Visit',
  
  // Other common patterns
  'â€™': "'",
  'â€œ': '"',
  'â€': '"',
  'â€"': '—',
  'â€"': '–',
};

// Files to fix
const FILES_TO_FIX = [
  'public/insights.html',
  'public/platform-integrated.html',
];

function fixFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }
  
  console.log(`\n🔧 Fixing: ${filePath}`);
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;
  let changeCount = 0;
  
  // Apply all corruption fixes
  for (const [corrupted, correct] of Object.entries(CORRUPTION_MAP)) {
    const regex = new RegExp(corrupted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, correct);
      changeCount += matches.length;
      changed = true;
      console.log(`  ✓ Fixed ${matches.length} occurrence(s) of: ${corrupted.substring(0, 20)}... → ${correct}`);
    }
  }
  
  // Also fix specific patterns in template literals (JavaScript)
  const templatePatterns = [
    { pattern: /⏱️Â±/g, replacement: '⏱️' },
    { pattern: /Ã°Å¸"Å /g, replacement: '📊 ' },
    { pattern: /🏠Â /g, replacement: '🏠 ' },
  ];
  
  for (const { pattern, replacement } of templatePatterns) {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, replacement);
      changeCount += matches.length;
      changed = true;
      console.log(`  ✓ Fixed ${matches.length} template literal occurrence(s)`);
    }
  }
  
  if (changed) {
    // Ensure UTF-8 BOM is NOT present (BOM causes issues)
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
      console.log(`  ✓ Removed UTF-8 BOM`);
    }
    
    // Ensure charset meta tag is present and correct
    if (!content.includes('<meta charset="UTF-8">') && content.includes('<head>')) {
      content = content.replace(
        /<head>/i,
        '<head>\n    <meta charset="UTF-8">'
      );
      console.log(`  ✓ Added <meta charset="UTF-8">`);
      changed = true;
    }
    
    // Write back with UTF-8 encoding (no BOM)
    fs.writeFileSync(fullPath, content, { encoding: 'utf8' });
    console.log(`  ✅ Fixed ${changeCount} corruption(s) in ${filePath}`);
    return true;
  } else {
    console.log(`  ℹ️  No corruption found in ${filePath}`);
    return false;
  }
}

// Main execution
console.log('🔍 UTF-8 Corruption Fixer\n');
console.log('Scanning files for encoding issues...\n');

let totalFixed = 0;
for (const file of FILES_TO_FIX) {
  if (fixFile(file)) {
    totalFixed++;
  }
}

console.log(`\n✅ Complete! Fixed ${totalFixed} file(s).`);
console.log('\n📋 Next steps:');
console.log('  1. Reload the site in your browser');
console.log('  2. Verify all buttons and labels display correctly');
console.log('  3. Check for any remaining "Ã" or "Â" characters');

