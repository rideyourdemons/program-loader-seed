/**
 * Smoke Run - Execute smoke tests
 * Uses browser automation if Puppeteer is available, else falls back to HTTP checks
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

/**
 * Check if Puppeteer is available
 */
function hasPuppeteer() {
  try {
    // Check if puppeteer is in package.json dependencies
    const packageJsonPath = join(ROOT_DIR, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    return packageJson.dependencies?.puppeteer || packageJson.devDependencies?.puppeteer;
  } catch {
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  const useBrowser = hasPuppeteer();
  
  if (useBrowser) {
    console.log('Using browser automation (Puppeteer)...\n');
    const { runBrowserSmokeTest } = await import('./smoke-browser.mjs');
    await runBrowserSmokeTest();
  } else {
    console.log('Using HTTP checks (no browser automation)...\n');
    const { runSmokeTest } = await import('./smoke-local.mjs');
    await runSmokeTest();
  }
}

main().catch(error => {
  console.error('\n❌ Smoke test error:', error.message);
  process.exit(1);
});
