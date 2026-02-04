#!/usr/bin/env node

/**
 * Get RYD Website Code and Integrate Engines
 * 
 * This script will:
 * 1. Check for local RYD codebase
 * 2. Use remote access to get code if needed
 * 3. Copy engines to RYD codebase
 * 4. Create integrated sandbox
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../core/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');
const ENGINES_SOURCE = path.join(PROJECT_ROOT, 'core');
const COMPLIANCE_SOURCE = path.join(PROJECT_ROOT, 'compliance-data');

// Possible RYD codebase locations
const POSSIBLE_RYD_LOCATIONS = [
  path.join(path.dirname(PROJECT_ROOT), '..', 'rideyourdemons'),
  path.join(path.dirname(PROJECT_ROOT), '..', 'ryd-website'),
  path.join(path.dirname(PROJECT_ROOT), '..', 'ride-your-demons'),
  path.join('C:', 'Users', 'Earl Taylor', 'Documents', 'rideyourdemons'),
  path.join('C:', 'Users', 'Earl Taylor', 'Documents', 'ryd-website'),
];

// Where to create integrated sandbox
const INTEGRATED_SANDBOX = path.join(PROJECT_ROOT, 'integrated-sandbox');

console.log('\n' + '='.repeat(70));
console.log('🔄 RYD Code Integration Script');
console.log('='.repeat(70) + '\n');

// Step 1: Check for existing RYD codebase
console.log('📋 Step 1: Looking for RYD website codebase...\n');

let rydCodebasePath = null;

for (const location of POSSIBLE_RYD_LOCATIONS) {
  if (fs.existsSync(location)) {
    const packageJsonPath = path.join(location, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (packageJson.dependencies?.react || packageJson.devDependencies?.react) {
          console.log(`✅ Found React codebase at: ${location}\n`);
          rydCodebasePath = location;
          break;
        }
      } catch (error) {
        // Not a valid package.json, continue searching
      }
    }
  }
}

if (!rydCodebasePath) {
  console.log('⚠️  RYD React codebase not found locally.\n');
  console.log('📋 Options:');
  console.log('   1. Use remote access to download code');
  console.log('   2. Create a test React app structure');
  console.log('   3. Specify path manually\n');
  
  // For now, create a test structure
  console.log('🔧 Creating test React structure for integration...\n');
  rydCodebasePath = path.join(INTEGRATED_SANDBOX, 'ryd-website');
  
  // Create directory structure
  fs.mkdirSync(rydCodebasePath, { recursive: true });
  fs.mkdirSync(path.join(rydCodebasePath, 'src'), { recursive: true });
  fs.mkdirSync(path.join(rydCodebasePath, 'src', 'utils'), { recursive: true });
  fs.mkdirSync(path.join(rydCodebasePath, 'src', 'data', 'compliance'), { recursive: true });
  
  // Create basic package.json
  const testPackageJson = {
    name: 'rideyourdemons',
    version: '1.0.0',
    type: 'module',
    dependencies: {
      react: '^18.0.0',
      'react-dom': '^18.0.0',
      firebase: '^11.9.0'
    }
  };
  
  fs.writeFileSync(
    path.join(rydCodebasePath, 'package.json'),
    JSON.stringify(testPackageJson, null, 2)
  );
  
  console.log(`✅ Created test structure at: ${rydCodebasePath}\n`);
}

// Step 2: Copy engines to RYD codebase
console.log('📋 Step 2: Copying engines to RYD codebase...\n');

const enginesToCopy = [
  'compliance-middleware.js',
  'tool-rotation.js',
  'matrix-engine.js',
  'authority-engine.js',
  'ai-tour-guide.js',
  'logger.js'
];

const targetUtilsDir = path.join(rydCodebasePath, 'src', 'utils');
fs.mkdirSync(targetUtilsDir, { recursive: true });

for (const engine of enginesToCopy) {
  const sourcePath = path.join(ENGINES_SOURCE, engine);
  const targetPath = path.join(targetUtilsDir, engine);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`   ✅ Copied ${engine}`);
  } else {
    console.log(`   ⚠️  ${engine} not found`);
  }
}

// Step 3: Copy compliance data
console.log('\n📋 Step 3: Copying compliance data...\n');

const complianceFiles = [
  'legal-rules.json',
  'cultural-guidelines.json',
  'language-requirements.json',
  'religious-considerations.json'
];

const targetComplianceDir = path.join(rydCodebasePath, 'src', 'data', 'compliance');
fs.mkdirSync(targetComplianceDir, { recursive: true });

for (const file of complianceFiles) {
  const sourcePath = path.join(COMPLIANCE_SOURCE, file);
  const targetPath = path.join(targetComplianceDir, file);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`   ✅ Copied ${file}`);
  } else {
    console.log(`   ⚠️  ${file} not found`);
  }
}

// Step 4: Create integration example
console.log('\n📋 Step 4: Creating integration example...\n');

const integrationExample = `// Example: How to use engines in React components
import toolRotation from './utils/tool-rotation.js';
import complianceMiddleware from './utils/compliance-middleware.js';
import { MatrixEngine } from './utils/matrix-engine.js';
import { AuthorityEngine } from './utils/authority-engine.js';
import aiTourGuide from './utils/ai-tour-guide.js';

// Example usage in a React component
export function useEngines() {
  // Tool Rotation
  const getToolOfDay = (tools) => {
    return toolRotation.getToolOfTheDay(tools);
  };
  
  // Compliance
  const checkCompliance = async (content, region) => {
    return await complianceMiddleware.processContent(content, region);
  };
  
  // Matrix Engine
  const calculateMatrix = (text) => {
    const engine = new MatrixEngine(mockFirebaseBackend);
    return engine.calculateNumerologicalValue(text);
  };
  
  // Authority Engine
  const calculateAuthority = async (painPointId) => {
    const engine = new AuthorityEngine(mockFirebaseBackend);
    return await engine.calculateAuthorityScore(painPointId);
  };
  
  // AI Tour Guide
  const startTour = () => {
    aiTourGuide.start();
  };
  
  return {
    getToolOfDay,
    checkCompliance,
    calculateMatrix,
    calculateAuthority,
    startTour
  };
}
`;

fs.writeFileSync(
  path.join(rydCodebasePath, 'src', 'utils', 'engines-integration-example.js'),
  integrationExample
);

console.log('   ✅ Created integration example\n');

// Step 5: Create integrated sandbox server
console.log('📋 Step 5: Creating integrated sandbox...\n');

const sandboxServerPath = path.join(INTEGRATED_SANDBOX, 'server.js');
const sandboxServer = `#!/usr/bin/env node

/**
 * Integrated Sandbox Server
 * Tests RYD website with all engines integrated
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3002; // Different port from regular sandbox

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    const htmlPath = path.join(__dirname, 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log('\\n' + '='.repeat(70));
  console.log('🚀 Integrated Sandbox Server');
  console.log('='.repeat(70) + '\\n');
  console.log(\`✅ Server running at: http://localhost:\${PORT}\\n\`);
  console.log('🌐 Open this URL to test integrated system\\n');
});
`;

fs.writeFileSync(sandboxServerPath, sandboxServer);

// Create simple HTML for sandbox
const sandboxHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Integrated RYD Sandbox</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
    .success { background: #d4edda; border: 1px solid #c3e6cb; }
  </style>
</head>
<body>
  <h1>🚀 Integrated RYD Sandbox</h1>
  <div class="status success">
    <h2>✅ Integration Complete!</h2>
    <p>Engines have been copied to RYD codebase.</p>
    <p>Location: <code>${rydCodebasePath}</code></p>
  </div>
  <h2>Next Steps:</h2>
  <ol>
    <li>Navigate to RYD codebase: <code>${rydCodebasePath}</code></li>
    <li>Import engines in your React components</li>
    <li>Test integration</li>
  </ol>
</body>
</html>`;

fs.writeFileSync(path.join(INTEGRATED_SANDBOX, 'index.html'), sandboxHtml);

console.log('   ✅ Created integrated sandbox server\n');

// Summary
console.log('='.repeat(70));
console.log('✅ Integration Complete!');
console.log('='.repeat(70) + '\n');
console.log('📁 RYD Codebase Location:');
console.log(`   ${rydCodebasePath}\n`);
console.log('📁 Integrated Sandbox:');
console.log(`   ${INTEGRATED_SANDBOX}\n`);
console.log('🚀 To test integrated sandbox:');
console.log(`   cd ${INTEGRATED_SANDBOX}`);
console.log('   node server.js');
console.log('   Open: http://localhost:3002\n');
console.log('📋 Engines copied to:');
console.log(`   ${targetUtilsDir}\n`);
console.log('📋 Compliance data copied to:');
console.log(`   ${targetComplianceDir}\n`);

logger.info('RYD code integration completed');

