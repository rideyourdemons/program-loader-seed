/**
 * Smoke Dev - Start server and open browser
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { waitForServer, openBrowser } from './open-local.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TARGET_PATH = process.env.TARGET_PATH || '/insights';
const PORT = process.env.PORT || '3000';

/**
 * Main execution
 */
async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('  SMOKE DEV - Starting Server & Opening Browser');
  console.log('='.repeat(70));
  console.log(`\nBase URL: ${BASE_URL}`);
  console.log(`Port: ${PORT}\n`);
  
  // Check if server is already running
  try {
    await waitForServer(`${BASE_URL}${TARGET_PATH}`, 2000);
    console.log('✅ Server is already running');
    await openBrowser(`${BASE_URL}${TARGET_PATH}`);
    return;
  } catch (error) {
    // Server not running, start it
    console.log('Starting dev server...');
  }
  
  // Start server
  const serverProcess = spawn('node', ['server.cjs'], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, PORT }
  });
  
  // Wait for server to be ready
  try {
    console.log(`Waiting for server at ${BASE_URL}...`);
    await waitForServer(`${BASE_URL}${TARGET_PATH}`, 20000);
    console.log('✅ Server is ready\n');
    
    await openBrowser(`${BASE_URL}${TARGET_PATH}`);
    
    console.log('\n✅ Dev server running. Press Ctrl+C to stop.\n');
  } catch (error) {
    console.error(`\n❌ Failed to start server: ${error.message}`);
    serverProcess.kill();
    process.exit(1);
  }
  
  // Handle process exit
  serverProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`\n❌ Server exited with code ${code}`);
    }
  });
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n\nShutting down server...');
    serverProcess.kill('SIGINT');
    process.exit(0);
  });
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
