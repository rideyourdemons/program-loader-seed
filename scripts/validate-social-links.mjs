/**
 * Social Links Validation Script
 * Validates that social links are properly configured and present
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT_DIR, 'public');

const ROUTES_TO_CHECK = [
  '/',
  '/tools',
  '/insights',
  '/about/',
  '/tools/tool.html'
];

let errors = [];
let warnings = [];
let passed = 0;

function checkFile(filePath, description) {
  if (!existsSync(filePath)) {
    errors.push(`❌ ${description}: File not found: ${filePath}`);
    return null;
  }
  return readFileSync(filePath, 'utf8');
}

function checkSocialConfig() {
  console.log('\n=== Checking Social Config ===');
  const configPath = join(PUBLIC_DIR, 'js', 'config', 'social-config.js');
  const content = checkFile(configPath, 'Social config');
  if (!content) return false;
  
  // Check for FACEBOOK_URL
  if (!content.includes('FACEBOOK_URL')) {
    errors.push('❌ Social config missing FACEBOOK_URL');
    return false;
  }
  
  // Check if FACEBOOK_URL is set (not placeholder)
  if (content.includes("FACEBOOK_URL: 'https://www.facebook.com/rideyourdemons'")) {
    warnings.push('⚠️  FACEBOOK_URL appears to be a placeholder - update with your actual Facebook page URL');
  }
  
  console.log('✅ Social config file exists');
  passed++;
  return true;
}

function checkFooterSocial() {
  console.log('\n=== Checking Footer Social ===');
  const footerSocialPath = join(PUBLIC_DIR, 'js', 'utils', 'footer-social.js');
  const content = checkFile(footerSocialPath, 'Footer social utility');
  if (!content) return false;
  
  console.log('✅ Footer social utility exists');
  passed++;
  return true;
}

function checkShareUtility() {
  console.log('\n=== Checking Share Utility ===');
  const sharePath = join(PUBLIC_DIR, 'js', 'utils', 'social-share.js');
  const content = checkFile(sharePath, 'Social share utility');
  if (!content) return false;
  
  // Check for required functions
  const requiredFunctions = ['shareTool', 'shareFacebook', 'trackSocialClick', 'trackShareClick'];
  for (const func of requiredFunctions) {
    if (!content.includes(func)) {
      errors.push(`❌ Social share utility missing function: ${func}`);
      return false;
    }
  }
  
  console.log('✅ Social share utility exists with required functions');
  passed++;
  return true;
}

function checkHTMLFiles() {
  console.log('\n=== Checking HTML Files ===');
  const htmlFiles = [
    { path: join(PUBLIC_DIR, 'index.html'), name: 'index.html' },
    { path: join(PUBLIC_DIR, 'about', 'index.html'), name: 'about/index.html' },
    { path: join(PUBLIC_DIR, 'tools.html'), name: 'tools.html' },
    { path: join(PUBLIC_DIR, 'insights.html'), name: 'insights.html' },
    { path: join(PUBLIC_DIR, 'tools', 'tool.html'), name: 'tools/tool.html' },
    { path: join(PUBLIC_DIR, 'gates', 'pain-point.html'), name: 'gates/pain-point.html' }
  ];
  
  let htmlPassed = 0;
  for (const file of htmlFiles) {
    const content = checkFile(file.path, file.name);
    if (!content) continue;
    
    // Check for social config script
    if (!content.includes('social-config.js')) {
      warnings.push(`⚠️  ${file.name}: Missing social-config.js script`);
    } else {
      htmlPassed++;
    }
    
    // Check for footer social script (except tool detail pages)
    if (!file.name.includes('tool.html') && !file.name.includes('pain-point.html')) {
      if (!content.includes('footer-social.js')) {
        warnings.push(`⚠️  ${file.name}: Missing footer-social.js script`);
      }
    }
    
    // Check for "built in public" on home and about
    if (file.name === 'index.html' || file.name === 'about/index.html') {
      if (!content.includes('Built in public') && !content.includes('built in public')) {
        warnings.push(`⚠️  ${file.name}: Missing "built in public" section`);
      }
    }
    
    // Check for share section on tool detail pages
    if (file.name.includes('tool.html') || file.name.includes('pain-point.html')) {
      if (!content.includes('Share This Tool') && !content.includes('shareToolSection')) {
        warnings.push(`⚠️  ${file.name}: Missing share section`);
      }
    }
  }
  
  if (htmlPassed === htmlFiles.length) {
    console.log(`✅ All ${htmlFiles.length} HTML files have social config`);
    passed++;
  }
  
  return true;
}

function checkNoPlaceholders() {
  console.log('\n=== Checking for Placeholders ===');
  const configPath = join(PUBLIC_DIR, 'js', 'config', 'social-config.js');
  const content = checkFile(configPath, 'Social config');
  if (!content) return false;
  
  const placeholderPatterns = [
    /TODO/i,
    /TBD/i,
    /PLACEHOLDER/i,
    /EXAMPLE/i,
    /YOUR_FACEBOOK/i,
    /your-facebook/i
  ];
  
  for (const pattern of placeholderPatterns) {
    if (pattern.test(content)) {
      errors.push(`❌ Social config contains placeholder text: ${pattern}`);
      return false;
    }
  }
  
  console.log('✅ No placeholder text found');
  passed++;
  return true;
}

async function main() {
  console.log('🔍 Validating Social Links Implementation...\n');
  
  checkSocialConfig();
  checkFooterSocial();
  checkShareUtility();
  checkHTMLFiles();
  checkNoPlaceholders();
  
  console.log('\n=== Summary ===');
  console.log(`✅ Passed: ${passed}`);
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
  
  if (warnings.length === 0 && errors.length === 0) {
    console.log('\n🎉 All social links validation passed!');
  }
}

main().catch(err => {
  console.error('❌ Validation script error:', err);
  process.exit(1);
});
