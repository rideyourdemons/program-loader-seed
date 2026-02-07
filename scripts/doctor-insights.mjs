/**
 * RYD Insights Doctor Tool
 * Diagnoses and fixes /insights 500 errors across all server types
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// Configuration
const DEFAULT_URL = process.env.DOCTOR_URL || 'http://localhost:5173';
const TEST_PATHS = ['/', '/tools', '/insights'];

/**
 * Detect server type from package.json and file structure
 */
function detectServerType() {
  const pkgPath = path.join(ROOT_DIR, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  const serverTypes = {
    vite: false,
    express: false,
    static: false,
    firebase: false
  };
  
  // Check for Vite
  if (fs.existsSync(path.join(ROOT_DIR, 'vite.config.js')) || 
      fs.existsSync(path.join(ROOT_DIR, 'vite.config.ts'))) {
    serverTypes.vite = true;
  }
  
  // Check for Express server
  if (fs.existsSync(path.join(ROOT_DIR, 'server.cjs')) ||
      fs.existsSync(path.join(ROOT_DIR, 'server.js'))) {
    serverTypes.express = true;
  }
  
  // Check for static server
  if (fs.existsSync(path.join(ROOT_DIR, 'scripts', 'serve-public.cjs'))) {
    serverTypes.static = true;
  }
  
  // Check for Firebase
  if (fs.existsSync(path.join(ROOT_DIR, 'firebase.json'))) {
    serverTypes.firebase = true;
  }
  
  // Detect from npm scripts
  const scripts = pkg.scripts || {};
  if (scripts.dev && (scripts.dev.includes('vite') || scripts.dev.includes('5173'))) {
    serverTypes.vite = true;
  }
  if (scripts.start && scripts.start.includes('server')) {
    serverTypes.express = true;
  }
  if (scripts.serve && scripts.serve.includes('firebase')) {
    serverTypes.firebase = true;
  }
  
  return serverTypes;
}

/**
 * Validate file paths exist
 */
function validateFilePaths() {
  const publicDir = path.join(ROOT_DIR, 'public');
  const checks = {
    'public/insights.html': fs.existsSync(path.join(publicDir, 'insights.html')),
    'public/index.html': fs.existsSync(path.join(publicDir, 'index.html')),
    'public/tools.html': fs.existsSync(path.join(publicDir, 'tools.html')),
    'public/insights/': fs.existsSync(path.join(publicDir, 'insights'))
  };
  
  return checks;
}

/**
 * Test HTTP endpoint
 */
function testEndpoint(url, path) {
  return new Promise((resolve) => {
    const fullUrl = `${url}${path}`;
    const urlObj = new URL(fullUrl);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.get(fullUrl, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const contentType = res.headers['content-type'] || '';
        const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
        const hasContent = data.length > 0;
        const isHtml = contentType.includes('text/html');
        
        resolve({
          path,
          status: res.statusCode,
          headers: res.headers,
          bodyLength: data.length,
          contentType: contentType || 'unknown',
          bodyPreview: data.substring(0, 60).replace(/\s+/g, ' '),
          error: null,
          isSuccess: isSuccess && (hasContent || isHtml)
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        path,
        status: null,
        headers: {},
        bodyLength: 0,
        contentType: 'unknown',
        bodyPreview: '',
        error: err.message,
        isSuccess: false
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        path,
        status: null,
        headers: {},
        bodyLength: 0,
        contentType: 'unknown',
        bodyPreview: '',
        error: 'Request timeout',
        isSuccess: false
      });
    });
  });
}

/**
 * Analyze results and provide diagnosis
 */
function diagnose(results, fileChecks, serverTypes) {
  const insightsResult = results.find(r => r.path === '/insights');
  const issues = [];
  const fixes = [];
  
  // Check if /insights failed
  if (insightsResult && !insightsResult.isSuccess && insightsResult.status === 500) {
    issues.push('❌ /insights returns 500 Internal Server Error');
    
    // Diagnose root cause
    if (!fileChecks['public/insights.html']) {
      issues.push('   → Root cause: public/insights.html does not exist');
      fixes.push('   → Fix: Create public/insights.html or ensure build script generates it');
    } else {
      issues.push('   → Root cause: Server cannot serve /insights route correctly');
      
      if (serverTypes.static) {
        issues.push('   → Static server (serve-public.cjs) needs rewrite rule for /insights -> insights.html');
        fixes.push('   → Fix: Update serve-public.cjs to handle /insights -> insights.html');
      }
      
      if (serverTypes.express) {
        issues.push('   → Express server (server.cjs) needs route handler for /insights');
        fixes.push('   → Fix: Add route handler in server.cjs for /insights -> insights.html');
      }
      
      if (serverTypes.firebase) {
        issues.push('   → Firebase rewrites may be misconfigured');
        fixes.push('   → Fix: Check firebase.json rewrites for /insights');
      }
    }
  } else if (insightsResult && !insightsResult.isSuccess && insightsResult.status === 404) {
    issues.push('⚠️  /insights returns 404 Not Found');
    if (!fileChecks['public/insights.html']) {
      issues.push('   → Root cause: public/insights.html does not exist');
      fixes.push('   → Fix: Create public/insights.html');
    } else {
      issues.push('   → Root cause: Server routing not configured for /insights');
      fixes.push('   → Fix: Add route/rewrite for /insights -> insights.html');
    }
  } else if (insightsResult && insightsResult.error) {
    issues.push(`❌ /insights request failed: ${insightsResult.error}`);
    issues.push('   → Root cause: Server may not be running or unreachable');
    fixes.push('   → Fix: Start the server first (npm run serve:local or npm run dev)');
  } else if (insightsResult && insightsResult.isSuccess) {
    issues.push(`✅ /insights returns ${insightsResult.status} OK - No issues detected`);
  } else if (insightsResult && insightsResult.status && insightsResult.status >= 200 && insightsResult.status < 300) {
    issues.push(`✅ /insights returns ${insightsResult.status} - Success`);
  }
  
  return { issues, fixes };
}

/**
 * Main doctor function
 */
async function runDoctor() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  RYD INSIGHTS DOCTOR');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  // Step 1: Detect server type
  console.log('[1/4] Detecting server configuration...');
  const serverTypes = detectServerType();
  console.log('   Server types detected:');
  Object.entries(serverTypes).forEach(([type, detected]) => {
    console.log(`   - ${type}: ${detected ? '✅' : '❌'}`);
  });
  console.log('');
  
  // Step 2: Validate file paths
  console.log('[2/4] Validating file paths...');
  const fileChecks = validateFilePaths();
  console.log('   File checks:');
  Object.entries(fileChecks).forEach(([file, exists]) => {
    console.log(`   - ${file}: ${exists ? '✅' : '❌'}`);
  });
  console.log('');
  
  // Step 3: Test HTTP endpoints
  console.log('[3/4] Testing HTTP endpoints...');
  console.log(`   Testing against: ${DEFAULT_URL}`);
  console.log('');
  
  const results = [];
  for (const testPath of TEST_PATHS) {
    process.stdout.write(`   Testing ${testPath}... `);
    const result = await testEndpoint(DEFAULT_URL, testPath);
    results.push(result);
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    } else if (result.isSuccess) {
      console.log(`✅ ${result.status} (${result.contentType}, ${result.bodyLength} bytes)`);
    } else if (result.status >= 400) {
      console.log(`❌ ${result.status} (${result.contentType})`);
      if (result.bodyPreview) {
        console.log(`      Body preview: ${result.bodyPreview}...`);
      }
    } else {
      console.log(`⚠️  ${result.status || 'null'} (${result.contentType || 'no content-type'}, ${result.bodyLength} bytes)`);
      if (result.bodyPreview) {
        console.log(`      Body preview: ${result.bodyPreview}...`);
      }
    }
  }
  console.log('');
  
  // Step 4: Diagnose
  console.log('[4/4] Diagnosis...');
  console.log('');
  const { issues, fixes } = diagnose(results, fileChecks, serverTypes);
  
  if (issues.length > 0) {
    issues.forEach(issue => console.log(issue));
    console.log('');
  }
  
  if (fixes.length > 0) {
    console.log('Recommended fixes:');
    fixes.forEach(fix => console.log(fix));
    console.log('');
  }
  
  // Summary
  const insightsResult = results.find(r => r.path === '/insights');
  const homeResult = results.find(r => r.path === '/');
  const toolsResult = results.find(r => r.path === '/tools');
  
  const allSuccess = insightsResult?.isSuccess && homeResult?.isSuccess && toolsResult?.isSuccess;
  
  if (allSuccess) {
    console.log('✅ DIAGNOSIS COMPLETE: All routes working correctly');
    console.log(`   /: ${homeResult.status} ${homeResult.contentType}`);
    console.log(`   /tools: ${toolsResult.status} ${toolsResult.contentType}`);
    console.log(`   /insights: ${insightsResult.status} ${insightsResult.contentType}`);
  } else {
    console.log('❌ DIAGNOSIS COMPLETE: Issues found (see above)');
    process.exit(1);
  }
  console.log('');
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'));

if (isMainModule || import.meta.url.endsWith('doctor-insights.mjs')) {
  runDoctor().catch(err => {
    console.error('❌ Doctor tool error:', err);
    process.exit(1);
  });
}

export { runDoctor, detectServerType, validateFilePaths, testEndpoint };
