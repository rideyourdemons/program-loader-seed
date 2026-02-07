/**
 * Final Production Readiness Check
 * Comprehensive validation before deployment
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT_DIR, 'public');

let issues = [];
let passed = 0;

function checkFile(filePath, description) {
  if (!existsSync(filePath)) {
    issues.push(`❌ ${description}: File not found`);
    return null;
  }
  return readFileSync(filePath, 'utf8');
}

// 1. Check tool card click handlers
console.log('\n=== Tool Card Click Handlers ===');
const toolFiles = [
  'ryd-tools.hardened.js',
  'gates-renderer.hardened.js',
  'ryd-router.js'
];

for (const file of toolFiles) {
  const content = checkFile(join(PUBLIC_DIR, 'js', file), file);
  if (content && content.includes('addEventListener(\'click\'')) {
    console.log(`✅ ${file}: Has click handlers`);
    passed++;
  } else if (content && (content.includes('toolCard') || content.includes('tool-card'))) {
    issues.push(`⚠️  ${file}: Tool cards found but may be missing click handlers`);
  }
}

// 2. Check for placeholders
console.log('\n=== Placeholder Check ===');
const htmlFiles = ['index.html', 'tools.html', 'insights.html'];
for (const file of htmlFiles) {
  const content = checkFile(join(PUBLIC_DIR, file), file);
  if (content) {
    const badPatterns = [/TODO/i, /TBD/i, /\[PLACEHOLDER\]/i];
    let hasBad = false;
    for (const pattern of badPatterns) {
      if (pattern.test(content)) {
        issues.push(`⚠️  ${file}: Contains ${pattern}`);
        hasBad = true;
      }
    }
    if (!hasBad) {
      console.log(`✅ ${file}: No critical placeholders`);
      passed++;
    }
  }
}

// 3. Check analytics initialization
console.log('\n=== Analytics Check ===');
const analyticsContent = checkFile(join(PUBLIC_DIR, 'js', 'analytics.js'), 'Analytics');
  if (analyticsContent) {
    if (analyticsContent.includes('RYD_ANALYTICS_INITIALIZED')) {
      // Check for proper guard pattern (check + assignment is correct)
      if (analyticsContent.includes('if (window.RYD_ANALYTICS_INITIALIZED)') && 
          analyticsContent.includes('window.RYD_ANALYTICS_INITIALIZED = true')) {
        console.log('✅ Analytics: Proper initialization guard');
        passed++;
      } else {
        issues.push('⚠️  Analytics: Missing initialization guard');
      }
    } else {
      issues.push('⚠️  Analytics: No initialization guard found');
    }
  }

// 4. Check Firebase config
console.log('\n=== Firebase Config ===');
const firebaseContent = checkFile(join(ROOT_DIR, 'firebase.json'), 'Firebase');
if (firebaseContent) {
  try {
    const config = JSON.parse(firebaseContent);
    if (config.hosting && config.hosting.public === 'public') {
      console.log('✅ Firebase: Public directory correct');
      passed++;
    }
  } catch (e) {
    issues.push(`❌ Firebase: Invalid JSON`);
  }
}

// 5. Check social links
console.log('\n=== Social Links ===');
const socialContent = checkFile(join(PUBLIC_DIR, 'js', 'config', 'social-config.js'), 'Social config');
if (socialContent && socialContent.includes('FACEBOOK_URL')) {
  if (socialContent.includes('RideYourDemons')) {
    console.log('✅ Social: Facebook URL configured');
    passed++;
  } else {
    issues.push('⚠️  Social: Facebook URL may be placeholder');
  }
}

// 6. Check for empty tool cards
console.log('\n=== Tool Card Validation ===');
const toolsHardened = checkFile(join(PUBLIC_DIR, 'js', 'ryd-tools.hardened.js'), 'Tools hardened');
if (toolsHardened) {
  if (toolsHardened.includes('Skipping tool with missing title/id')) {
    console.log('✅ Tools: Has validation for missing data');
    passed++;
  }
}

// Summary
console.log('\n=== Summary ===');
console.log(`✅ Passed: ${passed}`);
console.log(`⚠️  Issues: ${issues.length}`);

if (issues.length > 0) {
  console.log('\nIssues found:');
  issues.forEach(i => console.log(`  ${i}`));
  process.exit(1);
} else {
  console.log('\n🎉 Production ready!');
}
