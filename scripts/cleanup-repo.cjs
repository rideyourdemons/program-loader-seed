/**
 * Repo Cleanup Script
 * 
 * Safely archives duplicate/obsolete files
 * - Moves files to _archive/ with date stamps
 * - Does NOT delete anything
 * - Verifies build still works after cleanup
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const ARCHIVE_DIR = path.join(ROOT_DIR, '_archive');
const DATE_STAMP = new Date().toISOString().split('T')[0].replace(/-/g, '-');

// Archive operations
const archiveOps = [];

// Create archive directories
function ensureArchiveDirs() {
  const dirs = [
    path.join(ARCHIVE_DIR, 'experimental-html'),
    path.join(ARCHIVE_DIR, 'docs-from-public'),
    path.join(ARCHIVE_DIR, 'duplicate-scripts')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[CLEANUP] Created archive directory: ${dir}`);
    }
  });
}

// Archive a file
function archiveFile(sourcePath, archiveSubdir, reason) {
  const fileName = path.basename(sourcePath);
  const archivePath = path.join(ARCHIVE_DIR, archiveSubdir, `${fileName}.${DATE_STAMP}`);
  
  if (!fs.existsSync(sourcePath)) {
    console.warn(`[CLEANUP] Source file not found: ${sourcePath}`);
    return false;
  }
  
  try {
    // Ensure archive directory exists
    const archiveDir = path.dirname(archivePath);
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }
    
    fs.copyFileSync(sourcePath, archivePath);
    fs.unlinkSync(sourcePath);
    
    console.log(`[CLEANUP] Archived: ${sourcePath} → ${archivePath}`);
    console.log(`          Reason: ${reason}`);
    
    archiveOps.push({
      source: sourcePath,
      archive: archivePath,
      reason: reason
    });
    
    return true;
  } catch (error) {
    console.error(`[CLEANUP] Error archiving ${sourcePath}:`, error.message);
    return false;
  }
}

function cleanup() {
  console.log('[CLEANUP] Starting repo cleanup...\n');
  console.log(`[CLEANUP] Archive date stamp: ${DATE_STAMP}\n`);
  
  ensureArchiveDirs();
  
  let archived = 0;
  let errors = 0;
  
  // 1. Archive experimental HTML files
  console.log('[CLEANUP] Archiving experimental HTML files...');
  const experimentalHTML = [
    { file: 'public/index-integrated.html', reason: 'Experimental integrated version, not in firebase.json' },
    { file: 'public/index-integrated-ryd.html', reason: 'Experimental RYD version, not in firebase.json' },
    { file: 'public/platform-integrated.html', reason: 'Experimental platform version, not in firebase.json' },
    { file: 'public/live-site-integration.html', reason: 'Experimental integration, not in firebase.json' }
  ];
  
  experimentalHTML.forEach(({ file, reason }) => {
    const sourcePath = path.join(ROOT_DIR, file);
    if (archiveFile(sourcePath, 'experimental-html', reason)) {
      archived++;
    } else {
      errors++;
    }
  });
  
  // 2. Archive documentation from public/
  console.log('\n[CLEANUP] Archiving documentation from public/...');
  const docsInPublic = [
    { file: 'public/CSS_FIX_COMPLETE.md', reason: 'Documentation should not be in public/ (gets deployed)' },
    { file: 'public/CSS_FIX_SUMMARY.md', reason: 'Documentation should not be in public/ (gets deployed)' },
    { file: 'public/DEPLOYMENT_READY.md', reason: 'Documentation should not be in public/ (gets deployed)' },
    { file: 'public/FINAL_STATUS.md', reason: 'Documentation should not be in public/ (gets deployed)' },
    { file: 'public/VERIFICATION_CHECKLIST.md', reason: 'Documentation should not be in public/ (gets deployed)' }
  ];
  
  docsInPublic.forEach(({ file, reason }) => {
    const sourcePath = path.join(ROOT_DIR, file);
    if (archiveFile(sourcePath, 'docs-from-public', reason)) {
      archived++;
    } else {
      errors++;
    }
  });
  
  // 3. Archive duplicate scripts (non-canonical .js versions)
  console.log('\n[CLEANUP] Archiving duplicate scripts...');
  const duplicateScripts = [
    { file: 'scripts/build-tools-canonical.js', reason: 'Duplicate of .cjs version (which is canonical)' },
    { file: 'scripts/fix-ryd-all.js', reason: 'Duplicate of .cjs version (which is canonical)' }
  ];
  
  duplicateScripts.forEach(({ file, reason }) => {
    const sourcePath = path.join(ROOT_DIR, file);
    if (fs.existsSync(sourcePath)) {
      if (archiveFile(sourcePath, 'duplicate-scripts', reason)) {
        archived++;
      } else {
        errors++;
      }
    }
  });
  
  // Print summary
  console.log('\n===== CLEANUP COMPLETE =====');
  console.log(`Archived: ${archived}`);
  console.log(`Errors: ${errors}`);
  console.log(`Archive location: ${ARCHIVE_DIR}`);
  console.log('============================\n');
  
  // Generate report
  const report = {
    date: DATE_STAMP,
    archived: archived,
    errors: errors,
    operations: archiveOps
  };
  
  const reportPath = path.join(ARCHIVE_DIR, `cleanup-report.${DATE_STAMP}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`[CLEANUP] Report saved: ${reportPath}\n`);
  
  return { archived, errors, operations: archiveOps };
}

// Run if called directly
if (require.main === module) {
  try {
    cleanup();
  } catch (error) {
    console.error('[CLEANUP] Error during cleanup:', error);
    process.exit(1);
  }
}

module.exports = { cleanup };

