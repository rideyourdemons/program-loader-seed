/**
 * Triage Pending Files
 * Categorizes pending changes into must-keep, must-revert, needs-merge
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = process.cwd();

// Get all pending files
function getPendingFiles() {
  try {
    const output = execSync('git status --porcelain', { encoding: 'utf8', cwd: ROOT_DIR });
    return output.split('\n').filter(line => line.trim()).map(line => {
      const status = line.substring(0, 2).trim();
      const file = line.substring(3).trim();
      return { status, file };
    });
  } catch (err) {
    console.error('Error getting git status:', err.message);
    return [];
  }
}

// Categorize files
function categorizeFiles(files) {
  const mustKeep = [];
  const mustRevert = [];
  const needsMerge = [];
  const generated = [];

  const archivePatterns = [
    /^_archive\//,
    /sandbox[\/\\]/,
    /experiment/i,
    /backup/i,
    /\.bak/i,
    /\.old/i,
    /\.tmp/i
  ];

  const criticalPaths = [
    /^public\/(js|css|html|data)\//,
    /^scripts\/(validate|deploy|serve|doctor|production|final|dev-)/,
    /^firebase\.json$/,
    /^package\.json$/,
    /^tools\//,
    /^config\//
  ];

  const duplicatePatterns = [
    /\.hardened\.js$/,
    /\.js$/,
    /\.mjs$/,
    /\.cjs$/
  ];

  for (const { status, file } of files) {
    // Skip deleted files that are in archive/sandbox
    if (status === 'D ' || status === ' D') {
      if (archivePatterns.some(p => p.test(file))) {
        mustRevert.push({ file, reason: 'Deleted archive/sandbox file' });
        continue;
      }
    }

    // Archive/sandbox files - revert
    if (archivePatterns.some(p => p.test(file))) {
      mustRevert.push({ file, reason: 'Archive/sandbox file' });
      continue;
    }

    // Critical runtime files - keep
    if (criticalPaths.some(p => p.test(file))) {
      mustKeep.push({ file, reason: 'Critical runtime file' });
      continue;
    }

    // Documentation files - keep if in docs/, revert if in root or _archive
    if (file.endsWith('.md')) {
      if (file.startsWith('docs/')) {
        mustKeep.push({ file, reason: 'Documentation' });
      } else if (file.startsWith('_archive/') || file.includes('REPO_') || file.includes('PRODUCTION_') || file.includes('EMERGENCY_') || file.includes('CRITICAL_') || file.includes('HARDENING_')) {
        mustRevert.push({ file, reason: 'Old documentation/status file' });
      } else {
        mustKeep.push({ file, reason: 'Root documentation' });
      }
      continue;
    }

    // Generated files
    if (file.includes('generated') || file.includes('RYD_GENERATED') || file.includes('RYD_MATRIX')) {
      generated.push({ file, reason: 'Generated content' });
      continue;
    }

    // Check for duplicates
    const baseName = file.replace(/\.(hardened|old|bak).*$/, '');
    const duplicates = files.filter(f => 
      f.file !== file && 
      f.file.replace(/\.(hardened|old|bak).*$/, '') === baseName &&
      duplicatePatterns.some(p => f.file.match(p))
    );

    if (duplicates.length > 0) {
      needsMerge.push({ file, duplicates: duplicates.map(d => d.file), reason: 'Potential duplicate' });
    } else {
      mustKeep.push({ file, reason: 'Standard file' });
    }
  }

  return { mustKeep, mustRevert, needsMerge, generated };
}

// Main
const files = getPendingFiles();
console.log(`\n📊 Total pending files: ${files.length}\n`);

const { mustKeep, mustRevert, needsMerge, generated } = categorizeFiles(files);

console.log(`✅ Must Keep: ${mustKeep.length}`);
console.log(`❌ Must Revert: ${mustRevert.length}`);
console.log(`🔀 Needs Merge: ${needsMerge.length}`);
console.log(`⚙️  Generated: ${generated.length}\n`);

if (mustRevert.length > 0) {
  console.log('\n❌ Files to revert:');
  mustRevert.slice(0, 20).forEach(({ file, reason }) => {
    console.log(`  ${file} (${reason})`);
  });
  if (mustRevert.length > 20) {
    console.log(`  ... and ${mustRevert.length - 20} more`);
  }
}

if (needsMerge.length > 0) {
  console.log('\n🔀 Files needing merge:');
  needsMerge.slice(0, 10).forEach(({ file, duplicates, reason }) => {
    console.log(`  ${file}`);
    duplicates.forEach(dup => console.log(`    vs ${dup}`));
  });
}

// Write report
import { writeFileSync } from 'fs';
writeFileSync(
  join(ROOT_DIR, 'TRIAGE_REPORT.json'),
  JSON.stringify({ mustKeep, mustRevert, needsMerge, generated }, null, 2)
);

console.log('\n📄 Report written to TRIAGE_REPORT.json');
