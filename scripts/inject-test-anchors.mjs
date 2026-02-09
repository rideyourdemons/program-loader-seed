#!/usr/bin/env node
/**
 * Anchor Fixer & Test Injector
 * Injects 12 test anchors into index.html for verification
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// The 12 anchor/gate IDs (based on RYD_MATRIX structure)
const TEST_ANCHORS = [
  { id: 'fathers-sons', name: 'Fathers & Sons' },
  { id: 'mothers-daughters', name: 'Mothers & Daughters' },
  { id: 'the-patriarch', name: 'The Patriarch' },
  { id: 'the-matriarch', name: 'The Matriarch' },
  { id: 'young-lions', name: 'Young Lions' },
  { id: 'young-women', name: 'Young Women' },
  { id: 'the-professional', name: 'The Professional' },
  { id: 'the-griever', name: 'The Griever' },
  { id: 'the-addict', name: 'The Addict' },
  { id: 'the-protector', name: 'The Protector' },
  { id: 'men-solo', name: 'Men (Solo)' },
  { id: 'women-solo', name: 'Women (Solo)' }
];

function injectTestAnchors() {
  const indexPath = path.join(rootDir, 'public', 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.error('❌ index.html not found at:', indexPath);
    process.exit(1);
  }

  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Check if test anchors already exist
  if (content.includes('ryd-test-anchors')) {
    console.log('⚠️  Test anchors already injected. Skipping...');
    return;
  }

  // Find the gatesContainer section
  const gatesContainerPattern = /(<section[^>]*id=["']gatesContainer["'][^>]*>)([\s\S]*?)(<\/section>)/i;
  const match = content.match(gatesContainerPattern);
  
  if (!match) {
    console.error('❌ Could not find #gatesContainer in index.html');
    process.exit(1);
  }

  // Generate test anchor HTML
  const testAnchorsHTML = `
    <!-- RYD TEST ANCHORS (Injected for verification) -->
    <div class="ryd-test-anchors" style="margin: 2rem 0; padding: 1rem; background: #f0f0f0; border: 2px solid #667eea; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #667eea;">🧪 Test Anchors (12 Total)</h3>
      <div class="gates-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
${TEST_ANCHORS.map(anchor => `
        <div class="gate-card" data-gate-id="${anchor.id}" style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 1rem; background: white; cursor: pointer;" onclick="console.log('Anchor clicked: ${anchor.id}')">
          <h4 style="margin: 0 0 0.5rem 0; color: #333;">${anchor.name}</h4>
          <p style="margin: 0; color: #666; font-size: 0.9em;">Test anchor for verification</p>
        </div>
`).join('')}
      </div>
      <p style="margin-top: 1rem; color: #666; font-size: 0.9em;">
        <strong>Note:</strong> These are test anchors. The real gates will load below once gates-renderer.hardened.js initializes.
      </p>
    </div>
  `;

  // Inject test anchors right after the opening section tag
  const newContent = content.replace(
    gatesContainerPattern,
    `$1${testAnchorsHTML}$2$3`
  );

  fs.writeFileSync(indexPath, newContent, 'utf8');
  console.log('✅ Injected 12 test anchors into index.html');
  console.log(`   Location: #gatesContainer section`);
  console.log(`   Anchors: ${TEST_ANCHORS.map(a => a.id).join(', ')}`);
}

async function startServer() {
  console.log('\n🚀 Starting local server...');
  
  try {
    // Check package.json for dev script
    const packageJsonPath = path.join(rootDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const devScript = packageJson.scripts?.dev || packageJson.scripts?.local || 'npm start';
    
    console.log(`   Running: ${devScript}`);
    
    // Start server in background (Windows-compatible)
    const child = exec(devScript, { 
      cwd: rootDir,
      shell: true,
      stdio: 'inherit'
    });
    
    // Don't wait for it - let it run in background
    child.unref();
    
    console.log('   Server starting in background...');
    console.log('   Waiting 5 seconds for server to boot...\n');
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return child;
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

async function openBrowser() {
  const port = process.env.PORT || 3000;
  const url = `http://localhost:${port}`;
  
  console.log(`🌐 Opening browser to: ${url}`);
  
  try {
    // Windows
    if (process.platform === 'win32') {
      await execAsync(`start ${url}`);
    }
    // macOS
    else if (process.platform === 'darwin') {
      await execAsync(`open ${url}`);
    }
    // Linux
    else {
      await execAsync(`xdg-open ${url}`);
    }
    
    console.log('✅ Browser opened');
  } catch (error) {
    console.warn('⚠️  Could not auto-open browser. Please open manually:', url);
  }
}

async function main() {
  console.log('🧹 Anchor Fixer & Test Injector\n');
  
  // Step 1: Inject test anchors
  console.log('Step 1: Injecting test anchors...');
  injectTestAnchors();
  
  // Step 2: Start server
  console.log('\nStep 2: Starting server...');
  await startServer();
  
  // Step 3: Open browser
  console.log('\nStep 3: Opening browser...');
  await openBrowser();
  
  console.log('\n✅ Setup complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Check your browser - you should see 12 test anchors');
  console.log('   2. Open browser console and run: window.RYD_checkAnchors()');
  console.log('   3. Verify all 12 anchors are visible');
  console.log('\n💡 Note: Test anchors will appear above the real gates.');
  console.log('   Once gates-renderer.hardened.js loads, real gates will appear below.');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
