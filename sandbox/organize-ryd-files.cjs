/**
 * Organize RYD Files - Archive duplicates, test files, and broken files
 * Keep only production-ready code
 */

const fs = require('fs');
const path = require('path');

const ARCHIVE_DIR = path.join(__dirname, '..', '_archive');
const PRODUCTION_ROOT = path.join(__dirname, '..', 'public');

// Create archive structure
const archiveDirs = {
  duplicates: path.join(ARCHIVE_DIR, 'duplicates'),
  testFiles: path.join(ARCHIVE_DIR, 'test-files'),
  brokenFiles: path.join(ARCHIVE_DIR, 'broken-files'),
  oldDocs: path.join(ARCHIVE_DIR, 'old-docs'),
  backups: path.join(ARCHIVE_DIR, 'backups'),
  sandbox: path.join(ARCHIVE_DIR, 'sandbox-experiments'),
  rootHTML: path.join(ARCHIVE_DIR, 'root-html-duplicates')
};

// Initialize archive directories
Object.values(archiveDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Files to archive
const filesToArchive = {
  // Root HTML duplicates (keep only public/index.html as canonical)
  rootHTML: [
    'platform-integrated.html',
    'index-integrated.html',
    'index-integrated-ryd.html',
    'sandbox-preview.html',
    'sandbox-preview-complete.html',
    'sandbox-preview-search.html'
  ],
  
  // Backup files
  backups: [
    'public/index.html.bak_2026-02-01T08-38-28-914Z',
    'public/insights.html.bak_2026-02-01T08-38-28-914Z',
    'public/tools.html.bak_2026-02-01T08-38-28-914Z',
    'public/js/matrix-loader.js.bak_2026-02-01T08-38-28-914Z',
    'firebase.json.bak_2026-02-01T08-38-28-914Z'
  ],
  
  // Old status/docs (keep only README.md and RYD_MASTER_DIRECTIVE.md)
  oldDocs: [
    'ALL_ENGINES_INTEGRATED.md',
    'AUDIT_IN_PROGRESS.md',
    'AUDIT_INSTRUCTIONS.md',
    'AUTO_LANGUAGE_DETECTION_READY.md',
    'AUTO_REGION_DETECTION_READY.md',
    'BUILD_STATUS_REPORT.md',
    'CHANGE_WORKFLOW.md',
    'CHANGES_SUMMARY_LANGUAGE_DETECTION.md',
    'CHANGES_SUMMARY.md',
    'COMPLETE_SYSTEM_READY.md',
    'CONTENT_BINDING_FIX_SUMMARY.md',
    'CONTENT_VERIFICATION.md',
    'CURRENT_STATUS_UPDATE.md',
    'DEPLOY_PREVIEW_CHANNEL.md',
    'DEPLOY_TO_FIREBASE_PRELAUNCH.md',
    'DEPLOYMENT_POLICY.md',
    'DEPLOYMENT_STATUS.md',
    'DISCLAIMER_VERIFICATION.md',
    'ENCODING_FIX_SUMMARY.md',
    'ENTRY_FLOW_VERIFIED.md',
    'EXECUTION_STATUS.md',
    'FIREBASE_MONITORING_READY.md',
    'FIREBASE_SANDBOX_FIX_COMPLETE.md',
    'FIX_VERIFICATION.md',
    'FUNCTIONAL_MATRIX_IMPLEMENTATION.md',
    'GLOBAL_COMPLIANCE_STATUS.md',
    'GUARDRAILS_STATUS.md',
    'HOW_TO_OPEN_PREVIEW.md',
    'INTEGRATE_TO_LIVE_SITE.md',
    'INTEGRATION_COMPLETE.md',
    'INTEGRATION_PLAN.md',
    'INTEGRATION_STATUS_SUMMARY.md',
    'INTEGRATION_STATUS.md',
    'INTERLINKING_STATUS.md',
    'LIVE_PREVIEW_READY.md',
    'LOCAL_ACCESS_READY.md',
    'LOGIN_AND_AUDIT_GUIDE.md',
    'MATRIX_EXPANDER_IMPLEMENTATION.md',
    'MATRIX_FIX_COMPLETE.md',
    'MATRIX_STRUCTURE_FIXED.md',
    'NAVIGATION_FLOW_IMPLEMENTATION.md',
    'NAVIGATION_FLOW_TEST_CHECKLIST.md',
    'OBJECTIVE_READY.md',
    'PLATFORM_CAPABILITIES_OVERVIEW.md',
    'PLATFORM_OVERLAY_INTEGRATION_GUIDE.md',
    'QUICK_DEPLOY.md',
    'QUICK_START.md',
    'READABILITY_IMPROVEMENTS.md',
    'REDESIGN_READY.md',
    'RYD_FINALIZATION_REPORT.md',
    'RYD_FIX_SUMMARY.md',
    'RYD_REDESIGN_IMPLEMENTATION_SUMMARY.md',
    'RYD_SITE_INTEGRATION_COMPLETE.md',
    'RYD_System_Gap_Analysis_and_Action_List.txt',
    'RYD_SYSTEM_IMPROVEMENTS_COMPLETE.md',
    'RYD_WEBSITE_INTEGRATION_STATUS.md',
    'SANDBOX_DATA_INVENTORY.md',
    'SANDBOX_FIX_COMPLETE.md',
    'SANDBOX_FIX_SUMMARY.md',
    'SANDBOX_INTEGRATED_READY.md',
    'SANDBOX_INTEGRATION_STATUS.md',
    'SANDBOX_REVIEW_GUIDE.md',
    'SANDBOX_TEST_AND_DEPLOY_GUIDE.md',
    'SEARCH_INTEGRATION_COMPLETE.md',
    'STATIC_HOSTING_PATH_FIX.md',
    'SYSTEM_CAPABILITIES_REPORT.md',
    'SYSTEM_READY.md',
    'SYSTEM_STATUS.md',
    'UTF8_SANITIZATION_REPORT.md',
    'WEBSITE_FUNCTIONALITY_ISSUES_REPORT.md',
    'WHAT_WE_HAVE_EXPLAINED.md'
  ]
};

// Directories to archive (move entire dirs)
const dirsToArchive = {
  sandbox: [
    'sandbox-preview',
    'integrated-sandbox',
    'production', // Old production dir, public/ is the real one
    'core', // Old core, public/js/ has the real files
    'components', // Example components only
    'programs', // Old programs
    'memory', // Old memory
    'compliance-data', // Old compliance, public/config/ has the real ones
    'config' // Old config, public/config/ has the real ones
  ]
};

function moveFile(source, destDir, category) {
  const fileName = path.basename(source);
  const destPath = path.join(destDir, fileName);
  
  try {
    if (fs.existsSync(source)) {
      // Create subdirectory with timestamp if file exists
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const finalDest = fs.existsSync(destPath) 
        ? path.join(destDir, `${timestamp}_${fileName}`)
        : destPath;
      
      fs.renameSync(source, finalDest);
      console.log(`[ARCHIVE] Moved: ${source} → ${finalDest}`);
      return true;
    } else {
      console.log(`[SKIP] File not found: ${source}`);
      return false;
    }
  } catch (err) {
    console.error(`[ERROR] Failed to move ${source}:`, err.message);
    return false;
  }
}

function moveDirectory(source, destDir) {
  const dirName = path.basename(source);
  const destPath = path.join(destDir, dirName);
  
  try {
    if (fs.existsSync(source)) {
      if (fs.existsSync(destPath)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const finalDest = path.join(destDir, `${timestamp}_${dirName}`);
        fs.renameSync(source, finalDest);
        console.log(`[ARCHIVE] Moved dir: ${source} → ${finalDest}`);
      } else {
        fs.renameSync(source, destPath);
        console.log(`[ARCHIVE] Moved dir: ${source} → ${destPath}`);
      }
      return true;
    } else {
      console.log(`[SKIP] Directory not found: ${source}`);
      return false;
    }
  } catch (err) {
    console.error(`[ERROR] Failed to move directory ${source}:`, err.message);
    return false;
  }
}

function organizeFiles() {
  console.log('[ORGANIZE] Starting RYD file organization...\n');
  
  const stats = {
    filesArchived: 0,
    dirsArchived: 0,
    errors: 0
  };
  
  // Archive root HTML duplicates
  console.log('[ORGANIZE] Archiving root HTML duplicates...');
  filesToArchive.rootHTML.forEach(file => {
    const source = path.join(__dirname, '..', file);
    if (moveFile(source, archiveDirs.rootHTML, 'rootHTML')) {
      stats.filesArchived++;
    } else {
      stats.errors++;
    }
  });
  
  // Archive backup files
  console.log('\n[ORGANIZE] Archiving backup files...');
  filesToArchive.backups.forEach(file => {
    const source = path.join(__dirname, '..', file);
    if (moveFile(source, archiveDirs.backups, 'backups')) {
      stats.filesArchived++;
    } else {
      stats.errors++;
    }
  });
  
  // Archive old docs
  console.log('\n[ORGANIZE] Archiving old documentation...');
  filesToArchive.oldDocs.forEach(file => {
    const source = path.join(__dirname, '..', file);
    if (moveFile(source, archiveDirs.oldDocs, 'oldDocs')) {
      stats.filesArchived++;
    } else {
      stats.errors++;
    }
  });
  
  // Archive directories
  console.log('\n[ORGANIZE] Archiving old directories...');
  dirsToArchive.sandbox.forEach(dir => {
    const source = path.join(__dirname, '..', dir);
    if (moveDirectory(source, archiveDirs.sandbox)) {
      stats.dirsArchived++;
    } else {
      stats.errors++;
    }
  });
  
  // Generate organization report
  const report = {
    timestamp: new Date().toISOString(),
    stats: stats,
    archiveLocations: archiveDirs,
    productionRoot: PRODUCTION_ROOT,
    canonicalFiles: {
      homepage: 'public/index.html',
      tools: 'public/tools.html',
      insights: 'public/insights.html',
      data: [
        'public/data/tools.json',
        'public/data/gates.json',
        'public/data/pain-points.json',
        'public/store/tools.filtered.json'
      ],
      config: [
        'public/config/region-profiles.json',
        'public/config/weight-table.json',
        'public/config/state-registry.json',
        'public/config/numerology-map.json'
      ],
      js: [
        'public/js/matrix-loader.js',
        'public/js/ryd-boot.js',
        'public/js/ryd-bind.js',
        'public/js/ryd-navigation.js',
        'public/js/ryd-router.js',
        'public/js/matrix-expander.js'
      ]
    }
  };
  
  const reportPath = path.join(__dirname, 'organization-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  
  console.log('\n[ORGANIZE] ===== ORGANIZATION SUMMARY =====');
  console.log(`Files archived: ${stats.filesArchived}`);
  console.log(`Directories archived: ${stats.dirsArchived}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`\nArchive location: ${ARCHIVE_DIR}`);
  console.log(`Report saved to: ${reportPath}`);
  console.log('==========================================\n');
  
  console.log('[ORGANIZE] Production files remain in:');
  console.log('  - public/ (Firebase hosting root)');
  console.log('  - public/js/ (Core JavaScript)');
  console.log('  - public/data/ (Data files)');
  console.log('  - public/config/ (Configuration)');
  console.log('  - public/store/ (Canonical tools)');
  console.log('\n[ORGANIZE] Organization complete!');
}

// Run if called directly
if (require.main === module) {
  organizeFiles();
}

module.exports = { organizeFiles };

