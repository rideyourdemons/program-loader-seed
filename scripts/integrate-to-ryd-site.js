#!/usr/bin/env node

/**
 * Integrate Engines to Actual RYD Site Codebase
 * User specified: RYD codebase is in "mydrive" and called "site"
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

console.log('\n' + '='.repeat(70));
console.log('🔄 Integrating Engines to RYD Site Codebase');
console.log('='.repeat(70) + '\n');

// Possible locations for "mydrive/site"
const POSSIBLE_LOCATIONS = [
  // Google Drive locations (check first per user request)
  path.join(process.env.USERPROFILE || 'C:\\Users\\Earl Taylor', 'Google Drive', 'MyDrive', 'Site'),
  path.join(process.env.USERPROFILE || 'C:\\Users\\Earl Taylor', 'Google Drive', 'MyDrive', 'site'),
  path.join(process.env.USERPROFILE || 'C:\\Users\\Earl Taylor', 'Google Drive', 'Site'),
  path.join(process.env.USERPROFILE || 'C:\\Users\\Earl Taylor', 'Google Drive', 'site'),
  // G: drive (if mounted)
  path.join('G:', 'MyDrive', 'Site'),
  path.join('G:', 'MyDrive', 'site'),
  path.join('G:', 'site'),
  // OneDrive
  path.join(process.env.USERPROFILE || 'C:\\Users\\Earl Taylor', 'OneDrive', 'MyDrive', 'Site'),
  path.join(process.env.USERPROFILE || 'C:\\Users\\Earl Taylor', 'OneDrive', 'site'),
  // Documents/Site (fallback)
  path.join('C:', 'Users', 'Earl Taylor', 'Documents', 'Site'),
  path.join(process.env.USERPROFILE || 'C:\\Users\\Earl Taylor', 'Documents', 'Site'),
  // G: drive
  path.join('G:', 'MyDrive', 'Site'),
  path.join('G:', 'site'),
];

console.log('📋 Searching for RYD Site codebase...\n');

let rydSitePath = null;

for (const location of POSSIBLE_LOCATIONS) {
  try {
    if (fs.existsSync(location)) {
      console.log(`   Checking: ${location}`);
      
      // Check if it has package.json (React project indicator)
      const packageJsonPath = path.join(location, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          const hasReact = packageJson.dependencies?.react || 
                          packageJson.devDependencies?.react ||
                          packageJson.dependencies?.['react-dom'] ||
                          packageJson.devDependencies?.['react-dom'];
          

          // If it's the Site folder from Documents, use it (even if not React - might be HTML/JS)
          if (location.includes('Documents') && location.includes('Site')) {
            console.log(`   ✅ Found Site folder\n`);
            rydSitePath = location;
            break;
          } else if (hasReact) {
            console.log(`   ✅ Found React project!\n`);
            rydSitePath = location;
            break;
          } else {
            // Check for src folder or other React indicators
            const srcPath = path.join(location, 'src');
            const jsPath = path.join(location, 'js');
            const publicPath = path.join(location, 'public');
            if (fs.existsSync(srcPath) || (fs.existsSync(jsPath) && fs.existsSync(publicPath))) {
              console.log(`   ✅ Found project structure\n`);
              rydSitePath = location;
              break;
            }
          }
        } catch (error) {
          // Invalid package.json, continue
        }
      } else {
        // No package.json, but check if it looks like a project folder
        const srcPath = path.join(location, 'src');
        const jsPath = path.join(location, 'js');
        const publicPath = path.join(location, 'public');
        // Also accept if it's the Site folder from Documents
        if (location.includes('Documents') && location.includes('Site')) {
          console.log(`   ✅ Found Site folder\n`);
          rydSitePath = location;
          break;
        } else if (fs.existsSync(srcPath) || fs.existsSync(publicPath) || fs.existsSync(jsPath)) {
          console.log(`   ✅ Found project structure\n`);
          rydSitePath = location;
          break;
        }
      }
    }
  } catch (error) {
    // Path doesn't exist or can't access, continue
  }
}

if (!rydSitePath) {
  console.log('⚠️  Could not automatically find RYD Site codebase.\n');
  console.log('Please provide the full path to your Site folder.\n');
  console.log('Common locations:');
  console.log('  - Google Drive: C:\\Users\\[YourName]\\Google Drive\\MyDrive\\Site');
  console.log('  - G:\\MyDrive\\Site');
  console.log('  - Or specify the exact path\n');
  
  process.exit(1);
}

console.log(`✅ Found RYD Site codebase at:\n   ${rydSitePath}\n`);

// Create necessary directories - check if src exists, if not use js or root
let utilsDir, complianceDir;
const srcPath = path.join(rydSitePath, 'src');
const jsPath = path.join(rydSitePath, 'js');

if (fs.existsSync(srcPath)) {
  utilsDir = path.join(rydSitePath, 'src', 'utils');
  complianceDir = path.join(rydSitePath, 'src', 'data', 'compliance');
} else if (fs.existsSync(jsPath)) {
  utilsDir = path.join(rydSitePath, 'js', 'utils');
  complianceDir = path.join(rydSitePath, 'data', 'compliance');
} else {
  utilsDir = path.join(rydSitePath, 'utils');
  complianceDir = path.join(rydSitePath, 'data', 'compliance');
}

fs.mkdirSync(utilsDir, { recursive: true });
fs.mkdirSync(complianceDir, { recursive: true });

console.log('📋 Step 1: Copying engines...\n');

const enginesToCopy = [
  'compliance-middleware.js',
  'tool-rotation.js',
  'matrix-engine.js',
  'authority-engine.js',
  'ai-tour-guide.js',
  'logger.js'
];

for (const engine of enginesToCopy) {
  const sourcePath = path.join(ENGINES_SOURCE, engine);
  const targetPath = path.join(utilsDir, engine);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`   ✅ Copied ${engine}`);
  } else {
    console.log(`   ⚠️  ${engine} not found`);
  }
}

console.log('\n📋 Step 2: Copying compliance data...\n');

const complianceFiles = [
  'legal-rules.json',
  'cultural-guidelines.json',
  'language-requirements.json',
  'religious-considerations.json'
];

for (const file of complianceFiles) {
  const sourcePath = path.join(COMPLIANCE_SOURCE, file);
  const targetPath = path.join(complianceDir, file);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`   ✅ Copied ${file}`);
  } else {
    console.log(`   ⚠️  ${file} not found`);
  }
}

console.log('\n📋 Step 3: Creating integration helper...\n');

const integrationHelper = `// RYD Engines Integration Helper
// Use this in your React components

import toolRotation from './utils/tool-rotation.js';
import complianceMiddleware from './utils/compliance-middleware.js';
import { MatrixEngine } from './utils/matrix-engine.js';
import { AuthorityEngine } from './utils/authority-engine.js';
import aiTourGuide from './utils/ai-tour-guide.js';

// Example React hook
export function useRYDEngines(firebaseBackend) {
  // Tool Rotation
  const getToolOfDay = (tools) => {
    return toolRotation.getToolOfTheDay(tools);
  };
  
  // Compliance
  const checkCompliance = async (content, region = 'US') => {
    return await complianceMiddleware.processContent(content, region);
  };
  
  // Matrix Engine
  const calculateMatrix = (text) => {
    const engine = new MatrixEngine(firebaseBackend || mockBackend());
    return engine.calculateNumerologicalValue(text);
  };
  
  // Authority Engine
  const calculateAuthority = async (painPointId) => {
    const engine = new AuthorityEngine(firebaseBackend || mockBackend());
    return await engine.calculateAuthorityScore(painPointId);
  };
  
  // AI Tour Guide
  const startTour = () => {
    aiTourGuide.start();
  };
  
  const nextTourStep = () => {
    aiTourGuide.next();
  };
  
  return {
    getToolOfDay,
    checkCompliance,
    calculateMatrix,
    calculateAuthority,
    startTour,
    nextTourStep
  };
}

function mockBackend() {
  return {
    readDocument: async () => ({ data: {}, id: 'mock' }),
    readCollection: async () => [],
    writeDocument: async () => ({ success: true })
  };
}
`;

fs.writeFileSync(
  path.join(utilsDir, 'engines-hook.js'),
  integrationHelper
);

console.log('   ✅ Created engines-hook.js\n');

console.log('='.repeat(70));
console.log('✅ Integration Complete!');
console.log('='.repeat(70) + '\n');
console.log('📁 RYD Site Location:');
console.log(`   ${rydSitePath}\n`);
console.log('📁 Engines Location:');
console.log(`   ${utilsDir}\n`);
console.log('📁 Compliance Data Location:');
console.log(`   ${complianceDir}\n`);
console.log('🚀 Next Steps:');
console.log('   1. Import engines in your React components:');
console.log('      import { useRYDEngines } from \'./utils/engines-hook.js\';');
console.log('   2. Use the hook in your components');
console.log('   3. Test the integration\n');

logger.info(`Engines integrated to RYD Site at: ${rydSitePath}`);

