/**
 * Route Tester - Simple diagnostic for local routes
 */

import http from 'http';
import https from 'https';

const DEFAULT_URL = process.env.DOCTOR_URL || 'http://localhost:5173';
const TEST_PATHS = ['/', '/tools', '/insights'];

function testRoute(url, path) {
  return new Promise((resolve) => {
    const fullUrl = `${url}${path}`;
    const urlObj = new URL(fullUrl);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.get(fullUrl, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          contentType: res.headers['content-type'] || 'unknown',
          bodyLength: data.length,
          success: res.statusCode >= 200 && res.statusCode < 400
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        path,
        status: null,
        contentType: 'unknown',
        bodyLength: 0,
        success: false,
        error: err.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        path,
        status: null,
        contentType: 'unknown',
        bodyLength: 0,
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

async function testRoutes() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ROUTE TESTER');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`Testing: ${DEFAULT_URL}`);
  console.log('');
  
  const results = [];
  for (const testPath of TEST_PATHS) {
    process.stdout.write(`  ${testPath.padEnd(12)} ... `);
    const result = await testRoute(DEFAULT_URL, testPath);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${result.status} (${result.contentType}, ${result.bodyLength} bytes)`);
    } else if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    } else {
      console.log(`❌ ${result.status || 'null'}`);
    }
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  
  const allSuccess = results.every(r => r.success);
  if (allSuccess) {
    console.log('✅ ALL ROUTES WORKING');
    console.log('');
    process.exit(0);
  } else {
    console.log('❌ SOME ROUTES FAILED');
    console.log('');
    process.exit(1);
  }
}

testRoutes().catch(err => {
  console.error('❌ Route tester error:', err);
  process.exit(1);
});
