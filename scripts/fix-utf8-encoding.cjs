#!/usr/bin/env node
/**
 * UTF-8 Sanitation Script
 * Fixes character encoding corruption across the repository
 */

const fs = require('fs');
const path = require('path');

const CORRUPTION_MAP = {
  // Emojis and symbols - multiple variants
  'Ã°Å¸"Â': 'Search', // Search emoji corrupted
  'Ã°Å¸"Â': '🔍', // Search emoji corrupted (alternative)
  'Ã°Å¸"ž': '🔍', // Tool of the day icon
  'Ã°Å¸"Å ': '📖', // Book emoji
  'Ã°Å¸Â': '🏠', // Home emoji
  'Ã¢" Â': '←', // Left arrow
  'Ã¢â€ "Â': '←', // Left arrow variant
  'Ã¢Å¡Â Ã¯Â¸Â': '⚠️', // Warning emoji
  '⏱️Â±': '⏱️', // Clock emoji with extra chars
  'Ãƒ""': '×', // Multiplication sign
  'Ãƒâ€"': '×', // Multiplication sign variant
  '🏠Â ': '🏠', // Home emoji with extra space
  
  // Common corrupted sequences
  'â€™': "'", // Right single quotation mark
  'â€"': '—', // Em dash
  'â€œ': '"', // Left double quotation mark
  'â€': '"', // Right double quotation mark
  'â€"': '–', // En dash
  
  // Additional corrupted patterns
  'Ã¢â€"': '—',
  'Ã¢â€œ': '"',
  'Ã¢â€': '"',
};

const FILES_TO_SCAN = [
  'public/**/*.html',
  'public/**/*.js',
  'public/**/*.json'
];

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .git, etc.
      if (!['node_modules', '.git', '.firebase', 'dist', 'build'].includes(file)) {
        walkDir(filePath, fileList);
      }
    } else if (file.match(/\.(html|js|json)$/i)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const originalContent = content;
    
    // Fix corrupted characters
    Object.keys(CORRUPTION_MAP).forEach(corrupted => {
      const correct = CORRUPTION_MAP[corrupted];
      if (content.includes(corrupted)) {
        content = content.replace(new RegExp(corrupted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), correct);
        modified = true;
      }
    });
    
    // Ensure UTF-8 meta tag in HTML files
    if (filePath.endsWith('.html')) {
      // Check if charset meta exists
      if (!content.match(/<meta\s+charset\s*=\s*["']?utf-8["']?\s*\/?>/i)) {
        // Insert after <head> or at start of head
        if (content.includes('<head>')) {
          content = content.replace(/<head>/i, '<head>\n    <meta charset="UTF-8">');
          modified = true;
        } else if (content.includes('<head ')) {
          content = content.replace(/<head([^>]*)>/i, '<head$1>\n    <meta charset="UTF-8">');
          modified = true;
        }
      }
    }
    
    // Write back if modified
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
    return false;
  }
}

function main() {
  const publicDir = path.join(process.cwd(), 'public');
  
  if (!fs.existsSync(publicDir)) {
    console.error('public/ directory not found');
    process.exit(1);
  }
  
  console.log('Scanning for UTF-8 encoding issues...\n');
  
  const files = walkDir(publicDir);
  const modified = [];
  
  files.forEach(file => {
    const relativePath = path.relative(process.cwd(), file);
    if (fixFile(file)) {
      modified.push(relativePath);
      console.log(`✅ Fixed: ${relativePath}`);
    }
  });
  
  console.log(`\n✅ UTF-8 sanitization complete.`);
  console.log(`   Files modified: ${modified.length}`);
  
  if (modified.length > 0) {
    console.log('\nModified files:');
    modified.forEach(f => console.log(`  - ${f}`));
  }
}

main();

