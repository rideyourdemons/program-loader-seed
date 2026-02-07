/**
 * Production Clean Deploy
 * Ensures NODE_ENV=production, cleans artifacts, and deploys to Firebase
 */

import { execSync } from 'child_process';
import { existsSync, rmSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Set production environment
process.env.NODE_ENV = 'production';

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  PRODUCTION DEPLOY - Clean Build & Deploy');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log('');

// Step 1: Clean build artifacts
console.log('Step 1: Cleaning build artifacts...');
const artifactsToClean = [
  'dist',
  'build',
  '.firebase',
  '.next',
  'out'
];

let cleanedCount = 0;
artifactsToClean.forEach(artifact => {
  const artifactPath = join(ROOT_DIR, artifact);
  if (existsSync(artifactPath)) {
    try {
      rmSync(artifactPath, { recursive: true, force: true });
      console.log(`  ✔ Removed: ${artifact}/`);
      cleanedCount++;
    } catch (err) {
      console.warn(`  ⚠️  Could not remove ${artifact}/: ${err.message}`);
    }
  }
});

if (cleanedCount === 0) {
  console.log('  ✔ No build artifacts found (clean state)');
}
console.log('');

// Step 2: Verify firebase.json
console.log('Step 2: Verifying Firebase hosting config...');
try {
  const firebaseConfigPath = join(ROOT_DIR, 'firebase.json');
  const config = JSON.parse(readFileSync(firebaseConfigPath, 'utf8'));
  
  if (!config.hosting) {
    throw new Error('firebase.json missing hosting configuration');
  }
  
  if (config.hosting.public !== 'public') {
    throw new Error(`firebase.json public directory is "${config.hosting.public}", expected "public"`);
  }
  
  // Check SPA fallback
  const hasSPAFallback = config.hosting.rewrites?.some(r => r.source === '**' && r.destination === '/index.html');
  if (!hasSPAFallback) {
    console.warn('  ⚠️  No SPA fallback found in rewrites (all routes should serve index.html)');
  } else {
    console.log('  ✔ SPA fallback configured');
  }
  
  // Check for sandbox/dev routes
  const hasSandboxRoutes = config.hosting.rewrites?.some(r => 
    r.source?.includes('sandbox') || r.destination?.includes('sandbox')
  );
  if (hasSandboxRoutes) {
    console.warn('  ⚠️  Sandbox routes detected in firebase.json - these should not be deployed');
  }
  
  console.log('  ✔ Firebase config valid');
} catch (err) {
  console.error(`  ❌ Firebase config error: ${err.message}`);
  process.exit(1);
}
console.log('');

// Step 3: Verify public directory exists
console.log('Step 3: Verifying public directory...');
const publicDir = join(ROOT_DIR, 'public');
if (!existsSync(publicDir)) {
  console.error('  ❌ public/ directory not found');
  process.exit(1);
}

const indexHtml = join(publicDir, 'index.html');
if (!existsSync(indexHtml)) {
  console.error('  ❌ public/index.html not found');
  process.exit(1);
}

console.log('  ✔ public/ directory exists');
console.log('  ✔ public/index.html exists');
console.log('');

// Step 4: Deploy to Firebase
console.log('Step 4: Deploying to Firebase Hosting...');
console.log('  Project: rideyourdemons');
console.log('  Target: hosting only (no functions, no emulators)');
console.log('');

try {
  // Deploy only hosting
  const deployCommand = 'firebase deploy --only hosting';
  console.log(`  Running: ${deployCommand}`);
  console.log('');
  
  execSync(deployCommand, {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      CI: 'true' // Disable interactive prompts
    }
  });
  
  console.log('');
  console.log('  ✅ Deploy successful!');
} catch (err) {
  console.error('');
  console.error('  ❌ Deploy failed:', err.message);
  process.exit(1);
}

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  DEPLOYMENT COMPLETE');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('Live URL: https://rideyourdemons.com');
console.log('');
console.log('Next step: Run "npm run verify:live" to test live routes');
console.log('');
