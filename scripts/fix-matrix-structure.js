#!/usr/bin/env node

/**
 * Fix Matrix Folder Structure
 * Moves files from core/matrix/core/matrix/ to core/matrix/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');
const MATRIX_FOLDER = path.join(PROJECT_ROOT, 'core', 'matrix');
const NESTED_FOLDER = path.join(MATRIX_FOLDER, 'core', 'matrix');

console.log('\n' + '='.repeat(70));
console.log('🔧 Fixing Matrix Folder Structure');
console.log('='.repeat(70) + '\n');

// Check if nested folder exists
if (!fs.existsSync(NESTED_FOLDER)) {
  console.log('✅ No nested folder found - structure looks correct\n');
  process.exit(0);
}

console.log('📋 Found nested folder structure:');
console.log(`   ${NESTED_FOLDER}\n`);

// Get files in nested folder
const files = fs.readdirSync(NESTED_FOLDER, { withFileTypes: true })
  .filter(entry => entry.isFile())
  .map(entry => entry.name);

console.log(`📁 Files to move (${files.length}):`);
files.forEach(file => console.log(`   - ${file}`));
console.log('');

// Move files
let moved = 0;
let errors = 0;

for (const file of files) {
  const sourcePath = path.join(NESTED_FOLDER, file);
  const targetPath = path.join(MATRIX_FOLDER, file);
  
  // Check if target already exists
  if (fs.existsSync(targetPath)) {
    console.log(`⚠️  ${file} already exists in target, skipping...`);
    continue;
  }
  
  try {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✅ Moved ${file}`);
    moved++;
  } catch (error) {
    console.log(`❌ Error moving ${file}: ${error.message}`);
    errors++;
  }
}

console.log('');

// Remove nested folder structure if empty
try {
  const remainingFiles = fs.readdirSync(NESTED_FOLDER, { withFileTypes: true })
    .filter(entry => entry.isFile()).length;
  
  const remainingDirs = fs.readdirSync(NESTED_FOLDER, { withFileTypes: true })
    .filter(entry => entry.isDirectory()).length;
  
  if (remainingFiles === 0 && remainingDirs === 0) {
    // Remove empty nested folders
    fs.rmdirSync(NESTED_FOLDER);
    fs.rmdirSync(path.join(MATRIX_FOLDER, 'core'));
    console.log('✅ Removed empty nested folder structure\n');
  } else {
    console.log('⚠️  Nested folder still has files, leaving it\n');
  }
} catch (error) {
  console.log(`⚠️  Could not remove nested folder: ${error.message}\n`);
}

console.log('='.repeat(70));
console.log('✅ Structure Fix Complete!');
console.log('='.repeat(70) + '\n');
console.log(`📊 Results:`);
console.log(`   Files moved: ${moved}`);
console.log(`   Errors: ${errors}\n`);
console.log('📁 Correct structure:');
console.log(`   core/matrix/ (data files)`);
console.log(`   core/matrix-engine.js (engine file)`);
console.log(`   core/matrix-registry.js (registry file)\n`);
















