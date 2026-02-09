#!/usr/bin/env node
/**
 * Smart Launch Script
 * Kills hanging processes, auto-detects tech stack, starts server, and opens browser
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import http from 'http';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Ports to kill
const COMMON_PORTS = [3000, 3001, 5173, 8080, 5000];

/**
 * Kill processes on a specific port (cross-platform)
 */
async function killPort(port) {
  try {
    if (process.platform === 'win32') {
      // Windows: netstat to find PID, then taskkill
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      const lines = stdout.trim().split('\n');
      const pids = new Set();
      
      for (const line of lines) {
        const match = line.match(/\s+(\d+)\s*$/);
        if (match) {
          pids.add(match[1]);
        }
      }
      
      for (const pid of pids) {
        try {
          await execAsync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        } catch (err) {
          // Process might already be dead
        }
      }
    } else {
      // Unix: lsof to find PID, then kill
      try {
        const { stdout } = await execAsync(`lsof -ti:${port}`);
        const pids = stdout.trim().split('\n').filter(Boolean);
        for (const pid of pids) {
          try {
            await execAsync(`kill -9 ${pid}`, { stdio: 'ignore' });
          } catch (err) {
            // Process might already be dead
          }
        }
      } catch (err) {
        // No process on this port
      }
    }
  } catch (err) {
    // Port might not be in use
  }
}

/**
 * Kill all common ports using npx kill-port if available, otherwise manual
 */
async function killHangingProcesses() {
  console.log('🛑 Killing any old servers...');
  
  try {
    // Try using npx kill-port first (simpler and cross-platform)
    const portsStr = COMMON_PORTS.join(' ');
    await execAsync(`npx kill-port ${portsStr}`, { 
      stdio: 'ignore',
      timeout: 5000 
    });
    console.log('✅ Ports cleared (using npx kill-port)\n');
  } catch (err) {
    // Fallback to manual port killing
    console.log('   (npx kill-port not available, using manual method...)');
    for (const port of COMMON_PORTS) {
      await killPort(port);
    }
    console.log('✅ Ports cleared (manual method)\n');
  }
}

/**
 * Auto-detect tech stack and get dev command
 */
function detectTechStack() {
  console.log('🔍 Detecting project type...');
  
  const packageJsonPath = path.join(rootDir, 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const scripts = packageJson.scripts || {};
    
    // Try to find dev script (prefer 'dev' over 'start')
    let cmd = scripts.dev || scripts.start || 'npm start';
    let port = 3000;
    
    // Try to extract port from command string (matches bash regex: --port \K[0-9]+)
    const portMatch = cmd.match(/--port\s+(\d+)/) || 
                     cmd.match(/:\s*(\d+)/) ||
                     cmd.match(/(?:port|PORT)[\s=:]+(\d+)/i);
    
    if (portMatch) {
      port = parseInt(portMatch[1]);
    } else {
      // Check common ports in command
      if (cmd.includes('3001') || cmd.includes(':3001')) port = 3001;
      else if (cmd.includes('5173') || cmd.includes(':5173')) port = 5173;
      else if (cmd.includes('8080') || cmd.includes(':8080')) port = 8080;
      else if (cmd.includes('5000') || cmd.includes(':5000')) port = 5000;
    }
    
    // If using npm run, prepend npm run
    if (!cmd.startsWith('npm ') && !cmd.startsWith('node ') && !cmd.startsWith('npx ')) {
      if (scripts.dev) {
        cmd = `npm run dev`;
      } else if (scripts.start) {
        cmd = `npm start`;
      }
    }
    
    console.log(`   Found: Node.js project`);
    console.log(`   Command: ${cmd}`);
    console.log(`   Port: ${port}\n`);
    
    return { cmd, port, type: 'node' };
  }
  
  // Check for Python
  if (fs.existsSync(path.join(rootDir, 'requirements.txt'))) {
    const port = 8000;
    const cmd = 'python3 -m http.server 8000';
    console.log(`   Found: Python project`);
    console.log(`   Command: ${cmd}`);
    console.log(`   Port: ${port}\n`);
    return { cmd, port, type: 'python' };
  }
  
  // Fallback
  const port = 3000;
  const cmd = 'npx serve .';
  console.log(`   Found: Static site (fallback)`);
  console.log(`   Command: ${cmd}`);
  console.log(`   Port: ${port}\n`);
  return { cmd, port, type: 'static' };
}

/**
 * Check for anchor tags in code
 */
function verifyAnchors() {
  console.log('📝 Checking for anchors in code...');
  
  let anchorCount = 0;
  const extensions = ['.html', '.js', '.jsx', '.ts', '.tsx'];
  
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip node_modules, .git, dist, build
      if (entry.name.startsWith('.') || 
          entry.name === 'node_modules' || 
          entry.name === 'dist' || 
          entry.name === 'build') {
        continue;
      }
      
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const matches = content.match(/href=["']#/g) || [];
          anchorCount += matches.length;
        } catch (err) {
          // Skip binary or unreadable files
        }
      }
    }
  }
  
  scanDir(rootDir);
  
  console.log(`   Found ${anchorCount} anchor tags in your files.\n`);
  return anchorCount;
}

/**
 * Wait for server to be ready (matches bash curl behavior)
 */
async function waitForServer(port, maxAttempts = 10) {
  console.log(`⏳ Waiting for local site to wake up...`);
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: port,
          path: '/',
          method: 'HEAD',
          timeout: 2000
        }, (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            reject(new Error(`Status ${res.statusCode}`));
          }
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
        
        req.end();
      });
      
      console.log('✅ Site is UP!');
      return true;
    } catch (err) {
      process.stdout.write('.');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n⚠️  Server might not be ready yet, but opening browser anyway...');
  return false;
}

/**
 * Start server in background
 */
function startServer(cmd) {
  console.log(`🚀 Launching: ${cmd}`);
  console.log('   (Running in background...)\n');
  
  const isWindows = process.platform === 'win32';
  const shell = isWindows ? 'cmd.exe' : '/bin/sh';
  const shellFlag = isWindows ? '/c' : '-c';
  
  const child = spawn(shell, [shellFlag, cmd], {
    cwd: rootDir,
    stdio: 'inherit',
    detached: true,
    shell: true
  });
  
  child.unref();
  return child;
}

/**
 * Open browser
 */
async function openBrowser(port) {
  const url = `http://localhost:${port}`;
  console.log(`🌐 Opening browser to: ${url}`);
  
  try {
    if (process.platform === 'win32') {
      await execAsync(`start ${url}`);
    } else if (process.platform === 'darwin') {
      await execAsync(`open ${url}`);
    } else {
      await execAsync(`xdg-open ${url}`);
    }
    console.log('✅ Browser opened\n');
  } catch (err) {
    console.warn(`⚠️  Could not auto-open browser. Please open manually: ${url}\n`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Smart Launch Script\n');
  console.log('='.repeat(50) + '\n');
  
  try {
    // Step 1: Kill hanging processes
    await killHangingProcesses();
    
    // Step 2: Auto-detect tech stack
    const { cmd, port } = detectTechStack();
    
    // Step 3: Verify anchors
    const anchorCount = verifyAnchors();
    
    // Step 4: Start server
    startServer(cmd);
    
    // Step 5: Wait for server
    await waitForServer(port);
    
    // Step 6: Open browser
    await openBrowser(port);
    
    console.log('='.repeat(50));
    console.log('✅ Setup complete!');
    console.log(`\n📋 Server running on: http://localhost:${port}`);
    console.log(`📋 Found ${anchorCount} anchor tags in code`);
    console.log('\n💡 Tips:');
    console.log('   - Check browser console for any errors');
    console.log('   - Run window.RYD_checkAnchors() to verify anchors');
    console.log('   - Press Ctrl+C to stop the server\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
