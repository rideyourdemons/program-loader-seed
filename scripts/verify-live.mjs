/**
 * Live Site Verification
 * Tests production routes to ensure they're working
 */

const LIVE_URL = process.env.LIVE_URL || 'https://rideyourdemons.com';
const TEST_ROUTES = [
  { path: '/', name: 'Home' },
  { path: '/tools', name: 'Tools' },
  { path: '/insights', name: 'Insights' }
];

/**
 * Test a single route
 */
async function testRoute(baseUrl, route) {
  const url = `${baseUrl}${route.path}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'RYD-Verification/1.0'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      return {
        route: route.name,
        path: route.path,
        status: 'FAIL',
        issue: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return {
        route: route.name,
        path: route.path,
        status: 'FAIL',
        issue: `Unexpected content type: ${contentType}`
      };
    }

    const html = await response.text();

    // Check for error pages
    if (html.includes('500 Internal Server Error') || 
        html.includes('404 Not Found') ||
        html.includes('Error') && html.includes('Something went wrong')) {
      return {
        route: route.name,
        path: route.path,
        status: 'FAIL',
        issue: 'Error page detected in response'
      };
    }

    // Check for expected content
    if (!html.includes('<html') && !html.includes('<!DOCTYPE')) {
      return {
        route: route.name,
        path: route.path,
        status: 'FAIL',
        issue: 'Response does not appear to be HTML'
      };
    }

    // Check for dev/sandbox indicators (should not be present)
    if (html.includes('localhost') || html.includes('127.0.0.1') || html.includes('sandbox')) {
      return {
        route: route.name,
        path: route.path,
        status: 'WARN',
        issue: 'Dev/sandbox references detected in HTML'
      };
    }

    return {
      route: route.name,
      path: route.path,
      status: 'PASS',
      issue: null
    };
  } catch (err) {
    return {
      route: route.name,
      path: route.path,
      status: 'FAIL',
      issue: `Request failed: ${err.message}`
    };
  }
}

/**
 * Main verification
 */
async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  LIVE SITE VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`Testing: ${LIVE_URL}`);
  console.log('');

  const results = [];
  for (const route of TEST_ROUTES) {
    process.stdout.write(`  ${route.name.padEnd(12)} (${route.path.padEnd(15)}) ... `);
    const result = await testRoute(LIVE_URL, route);
    results.push(result);
    
    if (result.status === 'PASS') {
      console.log('✅ PASS');
    } else if (result.status === 'WARN') {
      console.log('⚠️  WARN');
      console.log(`      ${result.issue}`);
    } else {
      console.log('❌ FAIL');
      console.log(`      ${result.issue}`);
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  
  console.log(`  RESULTS: ${passed} passed, ${warned} warned, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  if (failed > 0) {
    console.log('FAILED ROUTES:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ❌ ${r.route} (${r.path}): ${r.issue}`);
    });
    console.log('');
    process.exit(1);
  } else if (warned > 0) {
    console.log('⚠️  Some routes have warnings but are functional');
    console.log('');
    process.exit(0);
  } else {
    console.log('✅ All routes verified successfully!');
    console.log('');
    process.exit(0);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { testRoute, TEST_ROUTES };
