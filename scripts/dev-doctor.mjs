/**
 * Dev Doctor - Route Health Check
 * Tests /, /tools, /insights and reports PASS/FAIL
 */

import http from 'http';
import https from 'https';

const DEFAULT_URL = process.env.DOCTOR_URL || 'http://localhost:5173';
const TEST_ROUTES = [
  { path: '/', name: 'Home' },
  { path: '/tools', name: 'Tools' },
  { path: '/insights', name: 'Insights' }
];

/**
 * Test a single route
 */
function testRoute(baseUrl, route) {
  return new Promise((resolve) => {
    const url = `${baseUrl}${route.path}`;
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const success = res.statusCode >= 200 && res.statusCode < 400;
        resolve({
          route: route.name,
          path: route.path,
          status: res.statusCode,
          contentType: res.headers['content-type'] || 'unknown',
          bodyLength: data.length,
          success
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        route: route.name,
        path: route.path,
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
        route: route.name,
        path: route.path,
        status: null,
        contentType: 'unknown',
        bodyLength: 0,
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ROUTE HEALTH CHECK');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`Testing: ${DEFAULT_URL}`);
  console.log('');
  
  const results = [];
  for (const route of TEST_ROUTES) {
    process.stdout.write(`  ${route.name.padEnd(10)} (${route.path.padEnd(12)}) ... `);
    const result = await testRoute(DEFAULT_URL, route);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ PASS (${result.status}, ${result.bodyLength} bytes)`);
    } else {
      console.log(`❌ FAIL (${result.status || 'error'})`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    }
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  
  const allPass = results.every(r => r.success);
  const failedRoutes = results.filter(r => !r.success);
  
  if (allPass) {
    console.log('✅ ALL ROUTES PASS');
    console.log('');
    process.exit(0);
  } else {
    console.log('❌ SOME ROUTES FAILED');
    console.log('');
    failedRoutes.forEach(r => {
      console.log(`  ❌ ${r.route} (${r.path}): ${r.status || r.error || 'unknown error'}`);
    });
    console.log('');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Doctor error:', err);
  process.exit(1);
});
