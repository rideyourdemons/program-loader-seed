/**
 * Dev Open - One Command Local Dev
 * Starts server, waits for readiness, opens browser
 */

import { spawn, exec } from 'child_process';
import http from 'http';
import https from 'https';
import net from 'net';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const SERVER_ENTRY = join(__dirname, 'serve-public.cjs');

const PREFERRED_PORTS = [5173, 3000];
const MAX_PORT_CHECK = 100;

/**
 * Check if a port is available
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.on('error', () => resolve(false));
  });
}

/**
 * Find available port
 */
async function findAvailablePort() {
  // Try preferred ports first
  for (const port of PREFERRED_PORTS) {
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
  }
  
  // Find next free port
  for (let port = 3000; port < 3000 + MAX_PORT_CHECK; port++) {
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
  }
  
  throw new Error('No available port found');
}

/**
 * Wait for server to respond with 200
 */
function waitForServer(url, maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const check = () => {
      attempts++;
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const req = client.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          if (attempts >= maxAttempts) {
            reject(new Error(`Server returned ${res.statusCode} after ${maxAttempts} attempts`));
          } else {
            setTimeout(check, 500);
          }
        }
      });
      
      req.on('error', () => {
        if (attempts >= maxAttempts) {
          reject(new Error(`Server not responding after ${maxAttempts} attempts`));
        } else {
          setTimeout(check, 500);
        }
      });
      
      req.setTimeout(2000, () => {
        req.destroy();
        if (attempts >= maxAttempts) {
          reject(new Error(`Server timeout after ${maxAttempts} attempts`));
        } else {
          setTimeout(check, 500);
        }
      });
    };
    
    check();
  });
}

/**
 * Open browser (Windows-compatible)
 */
function openBrowser(url) {
  const isWindows = process.platform === 'win32';
  const command = isWindows
    ? `start "" "${url}"`
    : process.platform === 'darwin'
    ? `open "${url}"`
    : `xdg-open "${url}"`;
  
  exec(command, (error) => {
    if (error) {
      console.warn(`Could not open browser automatically: ${error.message}`);
      console.log(`Please open manually: ${url}`);
    }
  });
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  STARTING LOCAL DEV SERVER');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    
    // Find available port
    console.log('Finding available port...');
    const port = await findAvailablePort();
    console.log(`  Selected port: ${port}`);
    console.log('');
    
    // Set PORT environment variable
    process.env.PORT = String(port);
    
    // Start server
    console.log('Starting server...');
    const serverProcess = spawn('node', [SERVER_ENTRY], {
      cwd: ROOT_DIR,
      stdio: 'pipe',
      shell: false,
      env: { ...process.env, PORT: String(port) }
    });
    
    // Capture server output
    let serverOutput = '';
    serverProcess.stdout.on('data', (data) => {
      serverOutput += data.toString();
      process.stdout.write(data);
    });
    serverProcess.stderr.on('data', (data) => {
      serverOutput += data.toString();
      process.stderr.write(data);
    });
    
    // Wait for server to be ready
    const url = `http://localhost:${port}`;
    console.log(`Waiting for server to be ready...`);
    
    await waitForServer(url);
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  SERVER READY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(`  URL: ${url}`);
    console.log(`  Insights: ${url}/insights`);
    console.log(`  Tools: ${url}/tools`);
    console.log('');
    console.log('Opening browser...');
    console.log('');
    
    // Open browser
    openBrowser(url);
    
    // Handle process exit
    serverProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`\n❌ Server exited with code ${code}`);
        process.exit(code);
      }
    });
    
    serverProcess.on('error', (err) => {
      console.error(`\n❌ Failed to start server: ${err.message}`);
      process.exit(1);
    });
    
    // Handle Ctrl+C
    process.on('SIGINT', () => {
      console.log('\n\nShutting down server...');
      serverProcess.kill('SIGINT');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     import.meta.url.endsWith('dev-open.mjs') ||
                     process.argv[1] && process.argv[1].endsWith('dev-open.mjs');

if (isMainModule) {
  main();
}

export { findAvailablePort, waitForServer, openBrowser };
