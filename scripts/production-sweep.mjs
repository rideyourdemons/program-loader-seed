/**
 * Production Readiness Sweep
 * Comprehensive validation and auto-fix for production deployment
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT_DIR, 'public');
const TOOLS_DIR = join(ROOT_DIR, 'tools');

let errors = [];
let warnings = [];
let fixes = [];

function checkFile(filePath, description) {
  if (!existsSync(filePath)) {
    errors.push(`❌ ${description}: File not found: ${filePath}`);
    return null;
  }
  return readFileSync(filePath, 'utf8');
}

// 1. Validate JSON files
function validateJSONFiles() {
  console.log('\n=== Validating JSON Files ===');
  
  const toolsSubdirs = ['mens-mental-health'];
  for (const subdir of toolsSubdirs) {
    const dirPath = join(TOOLS_DIR, subdir);
    if (!existsSync(dirPath)) continue;
    
    const files = readdirSync(dirPath).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const filePath = join(dirPath, file);
      const content = readFileSync(filePath, 'utf8');
      
      try {
        const data = JSON.parse(content);
        
        // Check for placeholders
        const placeholderPatterns = [
          /TODO/i, /TBD/i, /PLACEHOLDER/i, /EXAMPLE/i, /lorem/i,
          /coming soon/i, /\[TODO\]/i, /\[TBD\]/i, /\[PLACEHOLDER\]/i
        ];
        
        const jsonStr = JSON.stringify(data);
        for (const pattern of placeholderPatterns) {
          if (pattern.test(jsonStr)) {
            warnings.push(`⚠️  ${file}: Contains placeholder text`);
          }
        }
        
        // Check for empty strings in required fields
        if (data.tools && Array.isArray(data.tools)) {
          data.tools.forEach((tool, idx) => {
            if (!tool.id || !tool.title && !tool.name) {
              errors.push(`❌ ${file}: Tool[${idx}] missing id or title/name`);
            }
            if (tool.description === '' || tool.summary === '') {
              warnings.push(`⚠️  ${file}: Tool[${idx}] has empty description`);
            }
          });
        }
        
        console.log(`✅ ${file}: Valid JSON`);
      } catch (err) {
        errors.push(`❌ ${file}: Invalid JSON - ${err.message}`);
      }
    }
  }
}

// 2. Check tool card click handlers
function checkToolCardHandlers() {
  console.log('\n=== Checking Tool Card Handlers ===');
  
  const files = [
    join(PUBLIC_DIR, 'js', 'ryd-tools.hardened.js'),
    join(PUBLIC_DIR, 'js', 'gates-renderer.hardened.js'),
    join(PUBLIC_DIR, 'js', 'ryd-router.js')
  ];
  
  for (const filePath of files) {
    const content = checkFile(filePath, `Tool handler: ${filePath}`);
    if (!content) continue;
    
    // Check for click handlers
    if (content.includes('addEventListener(\'click\'')) {
      console.log(`✅ ${filePath.split('/').pop()}: Has click handlers`);
    } else if (content.includes('toolCard') || content.includes('tool-card')) {
      warnings.push(`⚠️  ${filePath.split('/').pop()}: Tool cards found but no click handlers`);
    }
  }
}

// 3. Check for empty sections/placeholders in HTML
function checkHTMLPlaceholders() {
  console.log('\n=== Checking HTML for Placeholders ===');
  
  const htmlFiles = [
    'index.html',
    'tools.html',
    'insights.html',
    'tools/tool.html',
    'gates/pain-point.html'
  ];
  
  const placeholderPatterns = [
    /coming soon/i, /TODO/i, /TBD/i, /PLACEHOLDER/i,
    /lorem ipsum/i, /\[TODO\]/i, /\[TBD\]/i
  ];
  
  for (const file of htmlFiles) {
    const filePath = join(PUBLIC_DIR, file);
    const content = checkFile(filePath, file);
    if (!content) continue;
    
    for (const pattern of placeholderPatterns) {
      if (pattern.test(content)) {
        warnings.push(`⚠️  ${file}: Contains placeholder text`);
      }
    }
    
    // Check for empty sections
    if (content.includes('id="') && content.includes('style="display: none"')) {
      // This is OK, but check for empty content divs
      if (content.match(/<div[^>]*id="[^"]*"[^>]*>\s*<\/div>/)) {
        warnings.push(`⚠️  ${file}: Has empty content divs`);
      }
    }
  }
}

// 4. Verify analytics
function checkAnalytics() {
  console.log('\n=== Checking Analytics ===');
  
  const analyticsPath = join(PUBLIC_DIR, 'js', 'analytics.js');
  const content = checkFile(analyticsPath, 'Analytics');
  if (!content) return;
  
  // Check for duplicate initialization
  if ((content.match(/RYD_ANALYTICS_INITIALIZED/g) || []).length > 1) {
    warnings.push('⚠️  Analytics: Potential duplicate initialization');
  }
  
  // Check for GTM
  if (content.includes('GTM-') || content.includes('googletagmanager')) {
    console.log('✅ Analytics: GTM configured');
  } else {
    warnings.push('⚠️  Analytics: GTM not found');
  }
}

// 5. Check Firebase config
function checkFirebase() {
  console.log('\n=== Checking Firebase Config ===');
  
  const firebasePath = join(ROOT_DIR, 'firebase.json');
  const content = checkFile(firebasePath, 'Firebase config');
  if (!content) return;
  
  try {
    const config = JSON.parse(content);
    
    // Check hosting config
    if (config.hosting) {
      console.log('✅ Firebase: Hosting configured');
      
      // Warn if public dir is unusual
      if (config.hosting.public && !config.hosting.public.includes('public')) {
        warnings.push('⚠️  Firebase: Public directory may be incorrect');
      }
    }
    
    // Check project ID (should not be changed)
    if (config.projectId) {
      console.log(`✅ Firebase: Project ID set (${config.projectId.substring(0, 10)}...)`);
    }
  } catch (err) {
    errors.push(`❌ Firebase config: Invalid JSON - ${err.message}`);
  }
}

// 6. Check social links
function checkSocialLinks() {
  console.log('\n=== Checking Social Links ===');
  
  const socialConfigPath = join(PUBLIC_DIR, 'js', 'config', 'social-config.js');
  const content = checkFile(socialConfigPath, 'Social config');
  if (!content) return;
  
  // Check if Facebook URL is placeholder
  if (content.includes('rideyourdemons') || content.includes('your-actual-page')) {
    warnings.push('⚠️  Social: Facebook URL may be placeholder');
  }
  
  console.log('✅ Social: Config file exists');
}

// 7. Check for console errors in JS
function checkJSErrors() {
  console.log('\n=== Checking JS for Common Errors ===');
  
  const jsFiles = [
    'ryd-tools.hardened.js',
    'gates-renderer.hardened.js',
    'ryd-router.js',
    'ryd-bind.hardened.js'
  ];
  
  for (const file of jsFiles) {
    const filePath = join(PUBLIC_DIR, 'js', file);
    const content = checkFile(filePath, file);
    if (!content) continue;
    
    // Check for common error patterns
    if (content.includes('undefined') && content.includes('.map(')) {
      // Check if there's proper null checking
      if (!content.includes('|| []') && !content.includes('?.map')) {
        warnings.push(`⚠️  ${file}: Potential undefined array access`);
      }
    }
    
    // Check for try-catch blocks
    if (content.includes('fetch(') && !content.includes('try {')) {
      warnings.push(`⚠️  ${file}: Fetch without try-catch`);
    }
  }
}

// Main execution
async function main() {
  console.log('🔍 Production Readiness Sweep Starting...\n');
  
  validateJSONFiles();
  checkToolCardHandlers();
  checkHTMLPlaceholders();
  checkAnalytics();
  checkFirebase();
  checkSocialLinks();
  checkJSErrors();
  
  console.log('\n=== Summary ===');
  console.log(`✅ Checks completed`);
  console.log(`⚠️  Warnings: ${warnings.length}`);
  console.log(`❌ Errors: ${errors.length}`);
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(w => console.log(`  ${w}`));
  }
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(e => console.log(`  ${e}`));
    process.exit(1);
  }
  
  console.log('\n🎉 Production readiness check complete!');
}

main().catch(err => {
  console.error('❌ Sweep error:', err);
  process.exit(1);
});
