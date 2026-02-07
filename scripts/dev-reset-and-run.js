/**
 * Dev Reset and Run
 * Kills processes on common ports, finds available port, and starts server
 * Windows-compatible Node.js implementation
 */

const { spawn, exec } = require('child_process');
const net = require('net');
const path = require('path');
const fs = require('fs');

const PORTS_TO_CLEAR = [3000, 5173, 5000];
const START_PORT = 3000;
const MAX_PORT_CHECK = 100; // Check up to port 3099
const SERVER_ENTRY = path.join(__dirname, 'serve-public.cjs');

/**
 * Get process ID using a port (Windows-compatible)
 */
function getProcessIdOnPort(port) {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const command = isWindows
      ? `netstat -ano | findstr :${port}`
      : `lsof -ti:${port}`;
    
    exec(command, (error, stdout) => {
      if (error || !stdout.trim()) {
        resolve(null);
        return;
      }
      
      if (isWindows) {
        // Parse Windows netstat output: find the PID in the last column
        const lines = stdout.trim().split('\n');
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && /^\d+$/.test(pid)) {
            resolve(pid);
            return;
          }
        }
        resolve(null);
      } else {
        // Unix: stdout is just the PID
        const pid = stdout.trim();
        resolve(pid || null);
      }
    });
  });
}

/**
 * Kill a process by PID (Windows-compatible)
 */
function killProcess(pid) {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const command = isWindows
      ? `taskkill /F /PID ${pid}`
      : `kill -9 ${pid}`;
    
    exec(command, (error) => {
      // Ignore errors (process might already be dead)
      resolve();
    });
  });
}

/**
 * Clear ports by killing processes using them
 */
async function clearPorts() {
  console.log('Clearing ports:', PORTS_TO_CLEAR.join(', '));
  
  for (const port of PORTS_TO_CLEAR) {
    const pid = await getProcessIdOnPort(port);
    if (pid) {
      console.log(`  Killing process ${pid} on port ${port}...`);
      await killProcess(pid);
      // Wait a moment for port to be released
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('Ports cleared.\n');
}

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
 * Find the first available port starting from START_PORT
 */
async function findAvailablePort() {
  for (let port = START_PORT; port < START_PORT + MAX_PORT_CHECK; port++) {
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
  }
  throw new Error(`No available port found in range ${START_PORT}-${START_PORT + MAX_PORT_CHECK - 1}`);
}

/**
 * Start the server
 */
async function startServer(port) {
  return new Promise((resolve, reject) => {
    // Verify server entry exists
    if (!fs.existsSync(SERVER_ENTRY)) {
      reject(new Error(`Server entry not found: ${SERVER_ENTRY}`));
      return;
    }
    
    // Set PORT environment variable
    process.env.PORT = String(port);
    
    console.log(`Starting server on port ${port}...`);
    console.log('');
    
    // Start the server
    const serverProcess = spawn('node', [SERVER_ENTRY], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      shell: false,
      env: { ...process.env, PORT: String(port) }
    });
    
    serverProcess.on('error', (err) => {
      reject(new Error(`Failed to start server: ${err.message}`));
    });
    
    // Wait a moment to verify server started
    setTimeout(() => {
      isPortAvailable(port).then(available => {
        if (available) {
          reject(new Error(`Server failed to start on port ${port}`));
        } else {
          resolve(serverProcess);
        }
      });
    }, 1000);
    
    // Handle process exit
    serverProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`\n❌ Server exited with code ${code}`);
        process.exit(code);
      }
    });
    
    // Handle Ctrl+C
    process.on('SIGINT', () => {
      console.log('\n\nShutting down server...');
      serverProcess.kill('SIGINT');
      process.exit(0);
    });
  });
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  DEV RESET AND RUN');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    
    // Step 1: Clear ports
    await clearPorts();
    
    // Step 2: Find available port
    console.log('Finding available port...');
    const port = await findAvailablePort();
    console.log(`  Selected port: ${port}`);
    console.log('');
    
    // Step 3: Start server
    await startServer(port);
    
    // Server is running (stdio: 'inherit' means output goes to console)
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { clearPorts, findAvailablePort, startServer };
