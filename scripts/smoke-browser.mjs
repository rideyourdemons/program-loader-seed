/**
 * Smoke Test - Browser Console Checks
 * Uses Puppeteer to check for console errors and network failures
 */

import puppeteer from 'puppeteer';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const ROUTES = [
  '/',
  '/insights',
  '/tools',
  '/gates'
];

const CRITICAL_JSON_PATHS = [
  '/data/gates.json',
  '/data/pain-points.json',
  '/data/tools.json',
  '/data/tools-canonical.json',
  '/data/insights.json'
];

/**
 * Test a route with browser automation
 */
async function testRouteWithBrowser(page, route) {
  const url = `${BASE_URL}${route}`;
  const consoleErrors = [];
  const networkErrors = [];
  
  // Set up console error listener
  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error') {
      const text = msg.text();
      consoleErrors.push({
        type: 'console',
        message: text,
        url
      });
    }
  });
  
  // Set up network failure listener
  page.on('response', (response) => {
    const status = response.status();
    const url = response.url();
    
    // Check for critical JSON failures
    if (status >= 400 && CRITICAL_JSON_PATHS.some(path => url.includes(path))) {
      networkErrors.push({
        type: 'network',
        status,
        url,
        route
      });
    }
  });
  
  try {
    const response = await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    if (!response || response.status() !== 200) {
      return {
        route,
        status: 'FAIL',
        reason: `HTTP ${response?.status() || 'no response'}`,
        consoleErrors: [],
        networkErrors: []
      };
    }
    
    // Wait a bit for any async errors
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      route,
      status: consoleErrors.length > 0 || networkErrors.length > 0 ? 'FAIL' : 'PASS',
      reason: consoleErrors.length > 0 
        ? `${consoleErrors.length} console error(s)`
        : networkErrors.length > 0
        ? `${networkErrors.length} network error(s)`
        : 'No errors',
      consoleErrors,
      networkErrors
    };
  } catch (error) {
    return {
      route,
      status: 'FAIL',
      reason: error.message,
      consoleErrors: [],
      networkErrors: []
    };
  }
}

/**
 * Main browser smoke test
 */
async function runBrowserSmokeTest() {
  console.log('\n' + '='.repeat(70));
  console.log('  SMOKE TEST - Browser Console Checks');
  console.log('='.repeat(70));
  console.log(`\nBase URL: ${BASE_URL}\n`);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    const results = [];
    
    for (const route of ROUTES) {
      console.log(`Testing ${route}...`);
      const result = await testRouteWithBrowser(page, route);
      results.push(result);
      
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`  ${icon} ${route.padEnd(35)} ${result.status.padEnd(6)} ${result.reason}`);
      
      if (result.consoleErrors.length > 0) {
        result.consoleErrors.forEach(err => {
          console.log(`      Console Error: ${err.message}`);
        });
      }
      
      if (result.networkErrors.length > 0) {
        result.networkErrors.forEach(err => {
          console.log(`      Network Error: ${err.url} (HTTP ${err.status})`);
        });
      }
    }
    
    await browser.close();
    
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('  SUMMARY');
    console.log('='.repeat(70));
    
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    
    console.log(`\n✅ PASS: ${passed}`);
    if (failed > 0) {
      console.log(`❌ FAIL: ${failed}`);
      console.log('\nFailures:');
      results.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`  - ${r.route}: ${r.reason}`);
      });
    }
    
    console.log('');
    
    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('✅ Browser smoke test passed\n');
      process.exit(0);
    }
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error('\n❌ Browser smoke test error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || 
    import.meta.url.endsWith('smoke-browser.mjs')) {
  runBrowserSmokeTest().catch(error => {
    console.error('\n❌ Browser smoke test error:', error.message);
    process.exit(1);
  });
}

export { runBrowserSmokeTest, testRouteWithBrowser };
