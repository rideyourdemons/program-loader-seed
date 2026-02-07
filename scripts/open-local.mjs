/**
 * Open Local Browser
 * Waits for server to respond, then opens browser
 */

import http from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TARGET_PATH = process.env.TARGET_PATH || '/insights';
const MAX_WAIT_MS = 20000; // 20 seconds
const POLL_INTERVAL_MS = 500;

/**
 * Wait for server to respond
 */
function waitForServer(url, maxWait = MAX_WAIT_MS) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? require('https') : http;
      
      const req = client.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          if (Date.now() - startTime >= maxWait) {
            reject(new Error(`Server returned ${res.statusCode} after ${maxWait}ms`));
          } else {
            setTimeout(check, POLL_INTERVAL_MS);
          }
        }
      });
      
      req.on('error', () => {
        if (Date.now() - startTime >= maxWait) {
          reject(new Error(`Server not responding after ${maxWait}ms`));
        } else {
          setTimeout(check, POLL_INTERVAL_MS);
        }
      });
      
      req.setTimeout(2000, () => {
        req.destroy();
        if (Date.now() - startTime >= maxWait) {
          reject(new Error(`Server timeout after ${maxWait}ms`));
        } else {
          setTimeout(check, POLL_INTERVAL_MS);
        }
      });
    };
    
    check();
  });
}

/**
 * Open browser (Windows-compatible)
 */
async function openBrowser(url) {
  const isWindows = process.platform === 'win32';
  const command = isWindows
    ? `start "" "${url}"`
    : process.platform === 'darwin'
    ? `open "${url}"`
    : `xdg-open "${url}"`;
  
  try {
    await execAsync(command);
    console.log(`✅ Opened browser: ${url}`);
  } catch (error) {
    console.warn(`⚠️  Could not open browser automatically: ${error.message}`);
    console.log(`   Please open manually: ${url}`);
  }
}

/**
 * Main execution
 */
async function main() {
  const url = `${BASE_URL}${TARGET_PATH}`;
  
  console.log(`Waiting for server at ${BASE_URL}...`);
  
  try {
    await waitForServer(`${BASE_URL}${TARGET_PATH}`);
    console.log('✅ Server is ready');
    
    await openBrowser(url);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.log(`   Server may not be running. Start it with: npm run dev`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || 
    import.meta.url.endsWith('open-local.mjs')) {
  main();
}

export { waitForServer, openBrowser };
