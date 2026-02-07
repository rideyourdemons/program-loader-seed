/**
 * Site Auditor - Crawls all routes and checks for errors, placeholders, and invalid content
 */

import http from 'http';
import https from 'https';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT_DIR, 'public');
const DATA_DIR = join(PUBLIC_DIR, 'data');

const BASE_URL = process.env.AUDIT_URL || 'http://localhost:5173';
const SERVER_ENTRY = join(__dirname, 'serve-public.cjs');

// Placeholder patterns to detect
const PLACEHOLDER_PATTERNS = [
  /\bTODO\b/i,
  /\bTBD\b/i,
  /\blorem\s+ipsum\b/i,
  /\bplaceholder\b/i,
  /\bcoming\s+soon\b/i,
  /\bnot\s+yet\s+available\b/i,
  /\bcontent\s+pending\s+import\b/i,
  /\b\[TODO\]/i,
  /\b\[TBD\]/i,
  /\b\[PLACEHOLDER\]/i
];

// Invalid content patterns
const INVALID_PATTERNS = [
  /\bundefined\b/i,
  /\bnull\b/i,
  /\[object\s+Object\]/i,
  /NaN/i
];

let serverProcess = null;
let serverPort = null;

/**
 * Start local server if not running
 */
async function ensureServerRunning() {
  // Check if server is already running
  const testUrl = `${BASE_URL}/`;
  try {
    await fetch(testUrl, { signal: AbortSignal.timeout(2000) });
    console.log(`✅ Server already running at ${BASE_URL}`);
    return;
  } catch (err) {
    // Server not running, start it
  }

  console.log('Starting local server...');
  serverPort = BASE_URL.split(':').pop() || '5173';
  process.env.PORT = serverPort;

  return new Promise((resolve, reject) => {
    serverProcess = spawn('node', [SERVER_ENTRY], {
      cwd: ROOT_DIR,
      stdio: 'pipe',
      env: { ...process.env, PORT: serverPort }
    });

    let output = '';
    serverProcess.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('Server running') || output.includes('listening')) {
        setTimeout(resolve, 1000); // Give server time to fully start
      }
    });

    serverProcess.stderr.on('data', (data) => {
      output += data.toString();
    });

    serverProcess.on('error', reject);

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!output.includes('Server running') && !output.includes('listening')) {
        reject(new Error('Server failed to start within 10 seconds'));
      } else {
        resolve();
      }
    }, 10000);
  });
}

/**
 * Load routes from data files
 */
function loadRoutes() {
  const routes = ['/', '/tools', '/insights'];

  try {
    // Load gates
    const gatesData = JSON.parse(readFileSync(join(DATA_DIR, 'gates.json'), 'utf8'));
    const gates = gatesData.gates || [];
    
    gates.forEach(gate => {
      routes.push(`/gates/${gate.id}`);
    });

    // Load tools to build tool detail routes
    const toolsData = JSON.parse(readFileSync(join(DATA_DIR, 'tools.json'), 'utf8'));
    const tools = toolsData.tools || [];

    // Sample first 20 tools for tool detail routes (to avoid too many routes)
    tools.slice(0, 20).forEach(tool => {
      if (tool.slug || tool.id) {
        const slug = tool.slug || tool.id;
        // Try to find a gate and pain point for this tool
        if (tool.gateIds && tool.gateIds.length > 0 && tool.painPointIds && tool.painPointIds.length > 0) {
          routes.push(`/gates/${tool.gateIds[0]}/${tool.painPointIds[0]}/${slug}`);
        }
      }
    });

    return routes;
  } catch (err) {
    console.warn('⚠️  Could not load all routes from data files:', err.message);
    return routes;
  }
}

/**
 * Fetch a route and check for issues
 */
async function auditRoute(route) {
  const url = `${BASE_URL}${route}`;
  const issues = [];

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      issues.push(`HTTP ${response.status}: ${response.statusText}`);
      return { route, status: 'FAIL', issues };
    }

    const html = await response.text();

    // Check for server errors
    if (html.includes('500 Internal Server Error') || html.includes('Internal Server Error')) {
      issues.push('Server error detected in HTML');
    }

    // Check for placeholders
    PLACEHOLDER_PATTERNS.forEach(pattern => {
      if (pattern.test(html)) {
        const matches = html.match(new RegExp(pattern.source, 'gi'));
        issues.push(`Placeholder found: ${matches?.[0] || pattern.source}`);
      }
    });

    // Check for invalid content
    INVALID_PATTERNS.forEach(pattern => {
      if (pattern.test(html)) {
        const matches = html.match(new RegExp(pattern.source, 'gi'));
        issues.push(`Invalid content found: ${matches?.[0] || pattern.source}`);
      }
    });

    // Check for expected page structure
    if (!html.includes('<header') && !html.includes('<nav')) {
      issues.push('Missing header/nav structure');
    }

    if (!html.includes('<main') && !html.includes('container')) {
      issues.push('Missing main content container');
    }

    // Check for empty sections (common patterns)
    const emptySectionPatterns = [
      /<div[^>]*>\s*<\/div>/g,
      /<section[^>]*>\s*<\/section>/g,
      /<ul[^>]*>\s*<\/ul>/g
    ];

    // This is a soft check - we'll flag but not fail
    const emptySections = html.match(/<div[^>]*class="[^"]*card[^"]*"[^>]*>\s*<\/div>/g);
    if (emptySections && emptySections.length > 3) {
      issues.push(`Multiple empty card containers detected (${emptySections.length})`);
    }

    return {
      route,
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues
    };
  } catch (err) {
    return {
      route,
      status: 'FAIL',
      issues: [`Request failed: ${err.message}`]
    };
  }
}

/**
 * Main audit function
 */
async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  SITE AUDIT - Route & Content Quality Check');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  try {
    // Ensure server is running
    await ensureServerRunning();
    console.log('');

    // Load routes
    console.log('Loading routes from data files...');
    const routes = loadRoutes();
    console.log(`Found ${routes.length} routes to audit\n`);

    // Audit each route
    const results = [];
    for (const route of routes) {
      process.stdout.write(`  ${route.padEnd(50)} ... `);
      const result = await auditRoute(route);
      results.push(result);
      
      if (result.status === 'PASS') {
        console.log('✅ PASS');
      } else {
        console.log('❌ FAIL');
        result.issues.forEach(issue => {
          console.log(`      - ${issue}`);
        });
      }
    }

    // Summary
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    
    console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    if (failed > 0) {
      console.log('FAILED ROUTES:');
      results.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`  ❌ ${r.route}`);
        r.issues.forEach(issue => console.log(`     ${issue}`));
      });
      console.log('');
      process.exit(1);
    } else {
      console.log('✅ All routes passed audit!');
      process.exit(0);
    }
  } catch (err) {
    console.error('\n❌ Audit failed:', err.message);
    process.exit(1);
  } finally {
    // Cleanup server if we started it
    if (serverProcess) {
      serverProcess.kill();
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { auditRoute, loadRoutes, ensureServerRunning };
