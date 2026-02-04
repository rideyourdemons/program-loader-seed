/**
 * Validate Required Assets
 * 
 * Checks that all required files exist before deploy/run
 * - Fails with clear error listing missing filenames
 * - Can be run pre-build, post-build, or pre-deploy
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

// Required assets (relative to public/)
const REQUIRED_ASSETS = [
  // Core data files
  'data/tools.json',
  'data/gates.json',
  'data/pain-points.json',
  'data/gates-painpoints-tools.json',

  // Core HTML pages
  'index.html',
  'insights.html',
  'tools.html',
  'search.html',

  // Core JS files
  'js/ryd-boot.js',
  'js/matrix-expander.js',
  'js/analytics.js',

  // Core CSS files
  'css/main.css',
  'css/integrated.css'
];

// Optional but recommended assets
const RECOMMENDED_ASSETS = [
  'data/tools-canonical.json',
  'data/insights.json',
  'robots.txt',
  'sitemap.xml'
];

function validateAssets() {
  console.log('[VALIDATE] Validating required assets...\n');
  
  const missing = [];
  const recommended = [];
  
  // Check required assets
  REQUIRED_ASSETS.forEach(asset => {
    const fullPath = path.join(PUBLIC_DIR, asset);
    if (!fs.existsSync(fullPath)) {
      missing.push(asset);
    }
  });
  
  // Check recommended assets
  RECOMMENDED_ASSETS.forEach(asset => {
    const fullPath = path.join(PUBLIC_DIR, asset);
    if (!fs.existsSync(fullPath)) {
      recommended.push(asset);
    }
  });
  
  // Print results
  if (missing.length === 0) {
    console.log('✅ All required assets present\n');
  } else {
    console.error('❌ MISSING REQUIRED ASSETS:\n');
    missing.forEach(asset => {
      console.error(`   - ${asset}`);
    });
    console.error('');
  }
  
  if (recommended.length > 0) {
    console.warn('⚠️  Missing recommended assets:\n');
    recommended.forEach(asset => {
      console.warn(`   - ${asset}`);
    });
    console.warn('');
  }
  
  // Summary
  console.log('\n===== VALIDATION SUMMARY =====');
  console.log(`Required: ${REQUIRED_ASSETS.length - missing.length}/${REQUIRED_ASSETS.length} present`);
  console.log(`Recommended: ${RECOMMENDED_ASSETS.length - recommended.length}/${RECOMMENDED_ASSETS.length} present`);
  
  if (missing.length > 0) {
    console.error('\n❌ VALIDATION FAILED');
    console.error('Missing required assets. Run build scripts:');
    console.error('  npm run build:tools');
    console.error('  npm run build:mapping');
    process.exit(1);
  } else {
    console.log('\n✅ VALIDATION PASSED\n');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  validateAssets();
}

module.exports = { validateAssets };

