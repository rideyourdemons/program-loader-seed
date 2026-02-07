/**
 * Bulletproof Local Server Runner
 * Automatically finds an available port and starts the server
 */

import { spawn } from 'child_process';
import net from 'net';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

const PREFERRED_PORTS = [5173, 3000, 4173, 8080, 5000];
const SERVER_ENTRY = join(__dirname, 'serve-public.cjs');

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
 * Find the first available port
 */
async function findAvailablePort() {
  for (const port of PREFERRED_PORTS) {
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
  }
  throw new Error('No available port found. Please close other servers.');
}

/**
 * Start the server
 */
async function startServer() {
  try {
    const port = await findAvailablePort();
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  STARTING LOCAL SERVER');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(`  Selected port: ${port}`);
    console.log('');
    
    // Set PORT environment variable
    const env = { ...process.env, PORT: String(port) };
    
    // Start the server
    const serverProcess = spawn('node', [SERVER_ENTRY], {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      shell: false,
      env: env
    });
    
    // Handle process exit
    serverProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`\n❌ Server exited with code ${code}`);
        process.exit(code);
      }
    });
    
    serverProcess.on('error', (err) => {
      console.error('\n❌ Failed to start server:', err.message);
      process.exit(1);
    });
    
    // Handle Ctrl+C
    process.on('SIGINT', () => {
      console.log('\n\nShutting down server...');
      serverProcess.kill('SIGINT');
      process.exit(0);
    });
    
    // Wait for server to start and verify
    await new Promise(resolve => setTimeout(resolve, 1500));
    const stillAvailable = await isPortAvailable(port);
    if (stillAvailable) {
      console.error(`\n❌ Server failed to start on port ${port}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Error starting server:', error.message);
    process.exit(1);
  }
}

// Start the server
startServer();
