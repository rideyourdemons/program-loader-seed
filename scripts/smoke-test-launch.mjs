#!/usr/bin/env node
/**
 * Smoke Test Launch Script
 * Clears ports, starts dev server, waits for readiness, opens browser, and injects anchor checker
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
const smokeLogPath = path.join(rootDir, 'smoke_log.txt');

// Ports to kill
const COMMON_PORTS = [3000, 3001, 5173, 8000];

/**
 * Clear ports
 */
async function clearPorts() {
  console.log('🧹 Clearing ports...');
  
  try {
    const portsStr = COMMON_PORTS.join(' ');
    await execAsync(`npx kill-port ${portsStr}`, { 
      stdio: 'ignore',
      timeout: 5000 
    });
    console.log('✅ Ports cleared\n');
  } catch (err) {
    console.log('⚠️  Could not clear ports (might not be in use)\n');
  }
}

/**
 * Start dev server and log to file
 */
function startDevServer() {
  console.log('🔥 Running Smoke Test...');
  
  // Clear old log
  if (fs.existsSync(smokeLogPath)) {
    fs.unlinkSync(smokeLogPath);
  }
  
  // Get dev command from package.json
  const packageJsonPath = path.join(rootDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const devCmd = packageJson.scripts?.dev || 'npm start';
  
  // Start server with output to log file
  const isWindows = process.platform === 'win32';
  const shell = isWindows ? 'cmd.exe' : '/bin/sh';
  const shellFlag = isWindows ? '/c' : '-c';
  
  const child = spawn(shell, [shellFlag, devCmd], {
    cwd: rootDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
    shell: true
  });
  
  // Write stdout and stderr to log file
  const logStream = fs.createWriteStream(smokeLogPath, { flags: 'a' });
  
  child.stdout.on('data', (data) => {
    logStream.write(data);
    process.stdout.write(data); // Also show in console
  });
  
  child.stderr.on('data', (data) => {
    logStream.write(data);
    process.stderr.write(data); // Also show in console
  });
  
  child.unref();
  
  return child;
}

/**
 * Wait for localhost to be ready (check log file)
 */
async function waitForLocalhost(maxAttempts = 15) {
  console.log('⏳ Waiting for localhost...');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      if (fs.existsSync(smokeLogPath)) {
        const logContent = fs.readFileSync(smokeLogPath, 'utf8');
        
        // Check for localhost URL in log
        if (logContent.includes('http://localhost') || 
            logContent.includes('Local:') ||
            logContent.includes('ready') ||
            logContent.includes('listening')) {
          console.log('\n✅ Server is ready!');
          return true;
        }
      }
      
      process.stdout.write('.');
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      // Log file might not exist yet
      process.stdout.write('.');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n⚠️  Timeout waiting for server (opening browser anyway...)');
  return false;
}

/**
 * Extract port from log file
 */
function extractPort() {
  try {
    if (fs.existsSync(smokeLogPath)) {
      const logContent = fs.readFileSync(smokeLogPath, 'utf8');
      
      // Try to find port in various formats
      const patterns = [
        /http:\/\/localhost:(\d+)/,
        /localhost:(\d+)/,
        /:(\d+)/,
        /port\s+(\d+)/i,
        /listening on port (\d+)/i
      ];
      
      for (const pattern of patterns) {
        const match = logContent.match(pattern);
        if (match) {
          const port = parseInt(match[1]);
          if (port > 0 && port < 65536) {
            return port;
          }
        }
      }
    }
  } catch (err) {
    // Fallback
  }
  
  // Default port
  return 3000;
}

/**
 * Open browser
 */
async function openBrowser(port) {
  const url = `http://localhost:${port}`;
  console.log(`\n✅ Opening Browser on Port ${port}...`);
  
  try {
    if (process.platform === 'win32') {
      await execAsync(`start ${url}`);
    } else if (process.platform === 'darwin') {
      await execAsync(`open ${url}`);
    } else {
      await execAsync(`xdg-open ${url}`);
    }
    console.log(`   URL: ${url}\n`);
  } catch (err) {
    console.warn(`⚠️  Could not auto-open browser. Please open manually: ${url}\n`);
  }
}

/**
 * Inject anchor checker script into HTML
 */
function injectAnchorChecker() {
  const indexPath = path.join(rootDir, 'public', 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.warn('⚠️  index.html not found, cannot inject anchor checker');
    return;
  }
  
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Check if already injected
  if (content.includes('RYD_checkAnchors') || content.includes('check-anchors.js')) {
    console.log('✅ Anchor checker already available in page\n');
    return;
  }
  
  // Find closing body tag and inject script before it
  const anchorCheckerScript = `
    <!-- Anchor Checker (Auto-injected by smoke test) -->
    <script>
      // Auto-run anchor checker when page loads
      (function() {
        function runAnchorCheck() {
          if (typeof window.RYD_checkAnchors === 'function') {
            window.RYD_checkAnchors();
          } else {
            // Load the checker script
            const script = document.createElement('script');
            script.src = '/js/utils/check-anchors.js';
            script.onload = function() {
              if (typeof window.RYD_checkAnchors === 'function') {
                window.RYD_checkAnchors();
              }
            };
            document.head.appendChild(script);
          }
        }
        
        // Run after a short delay to ensure DOM is ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', runAnchorCheck);
        } else {
          setTimeout(runAnchorCheck, 1000);
        }
      })();
    </script>
`;
  
  // Inject before closing body tag
  if (content.includes('</body>')) {
    content = content.replace('</body>', `${anchorCheckerScript}</body>`);
    fs.writeFileSync(indexPath, content, 'utf8');
    console.log('✅ Anchor checker injected into index.html\n');
  } else {
    // Append to end of file
    fs.appendFileSync(indexPath, anchorCheckerScript, 'utf8');
    console.log('✅ Anchor checker appended to index.html\n');
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔥 Smoke Test Launch Script\n');
  console.log('='.repeat(50) + '\n');
  
  try {
    // Step 1: Clear ports
    await clearPorts();
    
    // Step 2: Inject anchor checker (do this before starting server)
    console.log('📝 Injecting anchor checker...');
    injectAnchorChecker();
    
    // Step 3: Start dev server
    const serverProcess = startDevServer();
    
    // Step 4: Wait for localhost
    await waitForLocalhost(15);
    
    // Step 5: Extract port and open browser
    const port = extractPort();
    await openBrowser(port);
    
    // Step 6: Instructions
    console.log('='.repeat(50));
    console.log('✅ Smoke Test Setup Complete!\n');
    console.log('📋 Next Steps:');
    console.log('   1. Check your browser - it should have opened automatically');
    console.log('   2. Open browser console (F12)');
    console.log('   3. Look for the anchor checker report');
    console.log('   4. Verify all 12 anchors are visible\n');
    console.log('💡 The anchor checker runs automatically when the page loads');
    console.log('💡 Server log is saved to: smoke_log.txt\n');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
