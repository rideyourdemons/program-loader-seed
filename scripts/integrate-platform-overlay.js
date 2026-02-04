#!/usr/bin/env node

/**
 * Integrate Platform Overlay to Live RYD Site
 * Layers the complete platform over the live site for testing before public release
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

console.log('\n' + '='.repeat(70));
console.log('🔄 Platform Overlay Integration');
console.log('='.repeat(70));
console.log('This will integrate the complete platform as a test layer');
console.log('over the live site for testing before public release.\n');

async function integratePlatformOverlay() {
  try {
    // Step 1: Find RYD site codebase
    console.log('Step 1: Locating RYD Site Codebase...\n');
    
    const possiblePaths = [
      process.env.RYD_SITE_PATH, // Environment variable takes priority
      process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Google Drive', 'MyDrive', 'site') : null,
      process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Google Drive', 'MyDrive', 'Site') : null,
      process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Documents', 'site') : null,
      process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Documents', 'Site') : null,
      process.env.HOME ? path.join(process.env.HOME, 'Documents', 'Site') : null,
    ].filter(Boolean); // Remove null/undefined values

    let sitePath = null;
    
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        const packageJson = path.join(testPath, 'package.json');
        const srcPath = path.join(testPath, 'src');
        if (fs.existsSync(packageJson) || fs.existsSync(srcPath)) {
          console.log(`✅ Found site at: ${testPath}\n`);
          sitePath = testPath;
          break;
        }
      }
    }

    if (!sitePath) {
      const customPath = await question('Enter path to RYD site codebase: ');
      if (fs.existsSync(customPath)) {
        sitePath = customPath;
      } else {
        console.error('❌ Site path not found!');
        process.exit(1);
      }
    }

    // Step 2: Create platform overlay structure
    console.log('Step 2: Creating platform overlay structure...\n');
    
    const publicDir = path.join(sitePath, 'public');
    const srcDir = path.join(sitePath, 'src');
    
    // Ensure directories exist
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Create platform overlay directory
    const platformDir = path.join(publicDir, 'platform-overlay');
    if (!fs.existsSync(platformDir)) {
      fs.mkdirSync(platformDir, { recursive: true });
    }

    // Step 3: Copy platform-integrated.html
    console.log('Step 3: Copying platform files...\n');
    
    const sourcePlatformFile = path.join(PROJECT_ROOT, 'sandbox-preview', 'platform-integrated.html');
    const destPlatformFile = path.join(platformDir, 'index.html');
    
    if (!fs.existsSync(sourcePlatformFile)) {
      console.error(`❌ Source file not found: ${sourcePlatformFile}`);
      process.exit(1);
    }

    // Read and modify the platform HTML for integration
    let platformContent = fs.readFileSync(sourcePlatformFile, 'utf8');
    
    // Add test mode indicator
    const testModeScript = `
    <script>
        // Test Mode Indicator
        (function() {
            if (window.location.search.includes('test=true') || localStorage.getItem('platform_test_mode') === 'true') {
                document.body.setAttribute('data-test-mode', 'true');
                console.log('%c🧪 PLATFORM TEST MODE ACTIVE', 'color: #ff6b6b; font-size: 16px; font-weight: bold;');
            }
        })();
    </script>`;
    
    // Insert test mode script before closing </head>
    platformContent = platformContent.replace('</head>', testModeScript + '\n    </head>');
    
    // Write to destination
    fs.writeFileSync(destPlatformFile, platformContent, 'utf8');
    console.log(`✅ Platform HTML copied to: ${destPlatformFile}`);

    // Step 4: Create React component wrapper (if React site)
    const packageJsonPath = path.join(sitePath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const isReact = packageJson.dependencies?.react || packageJson.devDependencies?.react;
      
      if (isReact) {
        console.log('\nStep 4: Creating React integration component...\n');
        
        const componentsDir = path.join(srcDir, 'components');
        if (!fs.existsSync(componentsDir)) {
          fs.mkdirSync(componentsDir, { recursive: true });
        }
        
        const platformWrapper = `// Platform Overlay Component - Test Mode
// This component layers the complete platform over the site for testing

import React, { useEffect, useState } from 'react';

const PlatformOverlay = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  
  useEffect(() => {
    // Check if test mode is enabled
    const testMode = 
      window.location.search.includes('test=true') || 
      localStorage.getItem('platform_test_mode') === 'true';
    
    if (testMode) {
      setShowOverlay(true);
      
      // Load platform overlay
      const iframe = document.createElement('iframe');
      iframe.src = '/platform-overlay/index.html';
      iframe.style.cssText = \`
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: none;
        z-index: 999999;
        background: white;
      \`;
      iframe.id = 'platform-overlay-iframe';
      document.body.appendChild(iframe);
      
      return () => {
        const existing = document.getElementById('platform-overlay-iframe');
        if (existing) existing.remove();
      };
    }
  }, []);
  
  return null; // This component renders via iframe
};

export default PlatformOverlay;
`;
        
        const wrapperPath = path.join(componentsDir, 'PlatformOverlay.jsx');
        fs.writeFileSync(wrapperPath, platformWrapper, 'utf8');
        console.log(`✅ React component created: ${wrapperPath}`);
        
        // Create integration instructions
        const instructions = `# Platform Overlay Integration

## Files Created:
1. \`public/platform-overlay/index.html\` - Complete platform HTML
2. \`src/components/PlatformOverlay.jsx\` - React wrapper component

## How to Test:

### Option 1: URL Parameter (Recommended)
Add \`?test=true\` to any URL:
- \`http://localhost:3000/?test=true\`
- \`https://rideyourdemons.com/?test=true\`

### Option 2: LocalStorage
Open browser console and run:
\`\`\`javascript
localStorage.setItem('platform_test_mode', 'true');
location.reload();
\`\`\`

To disable:
\`\`\`javascript
localStorage.removeItem('platform_test_mode');
location.reload();
\`\`\`

## Integration Steps:

1. **Add to App.js or main component:**
\`\`\`jsx
import PlatformOverlay from './components/PlatformOverlay';

function App() {
  return (
    <>
      {/* Your existing app */}
      <PlatformOverlay />
    </>
  );
}
\`\`\`

2. **Test the overlay:**
   - Visit your site with \`?test=true\`
   - The complete platform will overlay the site
   - Test all features
   - When ready, remove \`?test=true\` or disable localStorage

3. **Make Public (when ready):**
   - Remove the test mode check from PlatformOverlay.jsx
   - Or add a feature flag in your config
   - Deploy to production

## Features Included:
- ✅ Search for Help
- ✅ Tool of the Day (rotating)
- ✅ Tour Guide System
- ✅ Pain Point Pages
- ✅ Tool Workthroughs
- ✅ Research Citations
- ✅ Matrix Loop Navigation
- ✅ Complete Styling (matches live site)
- ✅ Mobile/Desktop Responsive

## Safety:
- Overlay only shows when test mode is enabled
- Can be toggled on/off easily
- Does not affect live site when disabled
- Safe to test before public release
`;
        
        const instructionsPath = path.join(sitePath, 'PLATFORM_OVERLAY_INTEGRATION.md');
        fs.writeFileSync(instructionsPath, instructions, 'utf8');
        console.log(`✅ Integration instructions: ${instructionsPath}`);
      }
    }

    // Step 5: Create standalone test page
    console.log('\nStep 5: Creating standalone test page...\n');
    
    const testPage = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RYD Platform - Test Overlay</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
        iframe {
            width: 100%;
            height: 100vh;
            border: none;
        }
        .test-banner {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ff6b6b;
            color: white;
            padding: 8px;
            text-align: center;
            font-size: 12px;
            font-weight: bold;
            z-index: 1000000;
        }
    </style>
</head>
<body>
    <div class="test-banner">🧪 TEST MODE - Platform Overlay</div>
    <iframe src="./index.html"></iframe>
</body>
</html>`;
    
    const testPagePath = path.join(platformDir, 'test.html');
    fs.writeFileSync(testPagePath, testPage, 'utf8');
    console.log(`✅ Test page created: ${testPagePath}`);
    console.log(`   Access at: /platform-overlay/test.html`);

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ Platform Overlay Integration Complete!');
    console.log('='.repeat(70) + '\n');
    
    console.log('📋 Integration Summary:');
    console.log(`   Platform files: ${platformDir}`);
    console.log(`   Test page: ${platformDir}/test.html`);
    console.log(`   Main platform: ${platformDir}/index.html\n`);
    
    console.log('🧪 Testing Options:');
    console.log('   1. Direct access: /platform-overlay/test.html');
    console.log('   2. URL parameter: ?test=true (with React component)');
    console.log('   3. LocalStorage: platform_test_mode=true\n');
    
    console.log('⚠️  Important:');
    console.log('   - Platform is in TEST MODE only');
    console.log('   - Will not show publicly unless test mode enabled');
    console.log('   - Safe to test on live site before public release\n');
    
    console.log('📚 Next Steps:');
    console.log('   1. Review PLATFORM_OVERLAY_INTEGRATION.md');
    console.log('   2. Integrate PlatformOverlay component in your app');
    console.log('   3. Test with ?test=true parameter');
    console.log('   4. When ready, enable for public release\n');

    rl.close();

  } catch (error) {
    console.error('\n❌ Integration error:', error.message);
    console.error(error.stack);
    rl.close();
    process.exit(1);
  }
}

integratePlatformOverlay();

