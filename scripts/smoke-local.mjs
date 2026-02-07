/**
 * Smoke Test - Local HTTP Checks
 * Validates critical JSON endpoints and routes without browser automation
 */

import http from 'http';
import { URL } from 'url';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const JSON_ENDPOINTS = [
  '/data/gates.json',
  '/data/pain-points.json',
  '/data/tools.json',
  '/data/tools-canonical.json',
  '/data/insights.json'
];

const ROUTES = [
  '/',
  '/insights',
  '/tools',
  '/gates'
];

/**
 * Fetch URL and return response
 */
function fetch(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? require('https') : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Test JSON endpoint
 */
async function testJSONEndpoint(path) {
  const url = `${BASE_URL}${path}`;
  try {
    const response = await fetch(url);
    
    if (response.status !== 200) {
      return {
        url,
        status: 'FAIL',
        reason: `HTTP ${response.status}`
      };
    }
    
    try {
      const data = JSON.parse(response.body);
      
      // Basic sanity checks
      if (Array.isArray(data)) {
        if (data.length === 0) {
          return {
            url,
            status: 'WARN',
            reason: 'Empty array'
          };
        }
      } else if (typeof data === 'object' && data !== null) {
        const keys = Object.keys(data);
        if (keys.length === 0) {
          return {
            url,
            status: 'WARN',
            reason: 'Empty object'
          };
        }
      } else {
        return {
          url,
          status: 'FAIL',
          reason: 'Invalid JSON structure'
        };
      }
      
      return {
        url,
        status: 'PASS',
        reason: 'Valid JSON'
      };
    } catch (parseError) {
      return {
        url,
        status: 'FAIL',
        reason: `JSON parse error: ${parseError.message}`
      };
    }
  } catch (error) {
    return {
      url,
      status: 'FAIL',
      reason: error.message
    };
  }
}

/**
 * Test route
 */
async function testRoute(path) {
  const url = `${BASE_URL}${path}`;
  try {
    const response = await fetch(url);
    
    if (response.status !== 200) {
      return {
        url,
        status: 'FAIL',
        reason: `HTTP ${response.status}`
      };
    }
    
    const contentLength = response.body.length;
    if (contentLength < 500) {
      return {
        url,
        status: 'WARN',
        reason: `Content too short (${contentLength} bytes)`
      };
    }
    
    // Check for basic HTML structure
    const isHTML = response.headers['content-type']?.includes('text/html') ||
                   response.body.trim().startsWith('<!');
    
    if (!isHTML && !path.startsWith('/data')) {
      return {
        url,
        status: 'WARN',
        reason: 'Response does not appear to be HTML'
      };
    }
    
    return {
      url,
      status: 'PASS',
      reason: `Valid response (${contentLength} bytes)`
    };
  } catch (error) {
    return {
      url,
      status: 'FAIL',
      reason: error.message
    };
  }
}

/**
 * Main smoke test runner
 */
async function runSmokeTest() {
  console.log('\n' + '='.repeat(70));
  console.log('  SMOKE TEST - Local HTTP Checks');
  console.log('='.repeat(70));
  console.log(`\nBase URL: ${BASE_URL}\n`);
  
  const results = [];
  
  // Test JSON endpoints
  console.log('Testing JSON endpoints...');
  for (const endpoint of JSON_ENDPOINTS) {
    const result = await testJSONEndpoint(endpoint);
    results.push(result);
    const icon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️ ' : '❌';
    console.log(`  ${icon} ${endpoint.padEnd(35)} ${result.status.padEnd(6)} ${result.reason}`);
  }
  
  console.log('\nTesting routes...');
  for (const route of ROUTES) {
    const result = await testRoute(route);
    results.push(result);
    const icon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️ ' : '❌';
    console.log(`  ${icon} ${route.padEnd(35)} ${result.status.padEnd(6)} ${result.reason}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('  SUMMARY');
  console.log('='.repeat(70));
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  
  console.log(`\n✅ PASS: ${passed}`);
  if (warned > 0) {
    console.log(`⚠️  WARN: ${warned}`);
  }
  if (failed > 0) {
    console.log(`❌ FAIL: ${failed}`);
    console.log('\nFailures:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.url}: ${r.reason}`);
    });
  }
  
  console.log('');
  
  // Exit code
  if (failed > 0) {
    process.exit(1);
  } else if (warned > 0) {
    console.log('⚠️  Smoke test passed with warnings\n');
    process.exit(0);
  } else {
    console.log('✅ Smoke test passed\n');
    process.exit(0);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || 
    import.meta.url.endsWith('smoke-local.mjs')) {
  runSmokeTest().catch(error => {
    console.error('\n❌ Smoke test error:', error.message);
    process.exit(1);
  });
}

export { runSmokeTest, testJSONEndpoint, testRoute };
