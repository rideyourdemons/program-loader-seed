/**
 * Simple Local Runner - Opens site in real browser
 * Matches production behavior, zero extra tooling
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT_DIR = path.join(__dirname, '..');
const FIREBASE_JSON = path.join(ROOT_DIR, 'firebase.json');

/**
 * Check if Firebase CLI is available
 */
function hasFirebaseCLI() {
  try {
    execSync('firebase --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for server to respond
 */
function waitForServer(url, maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? require('https') : http;
      const req = client.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error(`Server returned ${res.statusCode}`));
        } else {
          setTimeout(check, 500);
        }
      });
      req.on('error', () => {
        if (attempts >= maxAttempts) {
          reject(new Error('Server not responding'));
        } else {
          setTimeout(check, 500);
        }
      });
      req.setTimeout(2000, () => {
        req.destroy();
        if (attempts >= maxAttempts) {
          reject(new Error('Server timeout'));
        } else {
          setTimeout(check, 500);
        }
      });
    };
    check();
  });
}

/**
 * Open browser (Windows)
 */
function openBrowser(url) {
  const isWindows = process.platform === 'win32';
  if (isWindows) {
    spawn('cmd', ['/c', 'start', '', url], { stdio: 'ignore', shell: false });
  } else if (process.platform === 'darwin') {
    spawn('open', [url], { stdio: 'ignore' });
  } else {
    spawn('xdg-open', [url], { stdio: 'ignore' });
  }
}

/**
 * Start Firebase Emulator
 */
function startFirebaseEmulator() {
  return new Promise((resolve) => {
    console.log('🔥 Starting Firebase Hosting Emulator...\n');
    const emulator = spawn('firebase', ['emulators:start', '--only', 'hosting'], {
      cwd: ROOT_DIR,
      stdio: 'pipe',
      shell: true
    });
    
    let url = 'http://localhost:5000';
    let ready = false;
    
    emulator.stdout.on('data', (data) => {
      const text = data.toString();
      process.stdout.write(text);
      
      // Extract URL
      const match = text.match(/http:\/\/localhost:(\d+)/);
      if (match) {
        url = `http://localhost:${match[1]}`;
      }
      
      if ((text.includes('All emulators ready') || text.includes('hosting')) && !ready) {
        ready = true;
        setTimeout(() => resolve({ process: emulator, url }), 2000);
      }
    });
    
    emulator.stderr.on('data', (data) => {
      process.stderr.write(data);
      const match = data.toString().match(/http:\/\/localhost:(\d+)/);
      if (match) {
        url = `http://localhost:${match[1]}`;
      }
    });
    
    // Fallback resolve
    setTimeout(() => {
      if (!ready) {
        ready = true;
        resolve({ process: emulator, url });
      }
    }, 8000);
  });
}

/**
 * Start npm dev server
 */
function startNpmDev() {
  return new Promise((resolve) => {
    console.log('🚀 Starting dev server (npm run dev)...\n');
    const dev = spawn('npm', ['run', 'dev'], {
      cwd: ROOT_DIR,
      stdio: 'pipe',
      shell: true
    });
    
    let url = 'http://localhost:3000';
    let ready = false;
    
    dev.stdout.on('data', (data) => {
      const text = data.toString();
      process.stdout.write(text);
      
      // Extract URL from output
      const match = text.match(/http:\/\/localhost:(\d+)/);
      if (match) {
        url = `http://localhost:${match[1]}`;
      }
      
      if (text.includes('listening') || text.includes('online') || text.includes('ready')) {
        if (!ready) {
          ready = true;
          setTimeout(() => resolve({ process: dev, url }), 1000);
        }
      }
    });
    
    dev.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    // Fallback resolve
    setTimeout(() => {
      if (!ready) {
        ready = true;
        resolve({ process: dev, url });
      }
    }, 5000);
  });
}

/**
 * Verify pages load
 */
async function verifyHealth(baseUrl) {
  console.log('\n📋 Verifying basic health...');
  try {
    await waitForServer(`${baseUrl}/`, 10);
    console.log('   ✅ Homepage loads');
    
    await waitForServer(`${baseUrl}/insights`, 10);
    console.log('   ✅ Insights page loads');
    
    return true;
  } catch (error) {
    console.log(`   ⚠️  Health check incomplete: ${error.message}`);
    return false;
  }
}

/**
 * Main
 */
async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  LOCAL SITE RUNNER');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  // Step 1: Detect how site runs
  const hasFirebase = fs.existsSync(FIREBASE_JSON);
  const hasDevScript = true; // package.json has "dev"
  
  let serverInfo;
  let serverType;
  
  // Step 2: Start server
  if (hasFirebase && hasFirebaseCLI()) {
    serverInfo = await startFirebaseEmulator();
    serverType = 'Firebase Emulator';
  } else if (hasDevScript) {
    serverInfo = await startNpmDev();
    serverType = 'npm run dev';
  } else {
    console.error('❌ No valid server configuration found');
    process.exit(1);
  }
  
  // Wait for server
  console.log(`\n⏳ Waiting for server at ${serverInfo.url}...`);
  try {
    await waitForServer(serverInfo.url, 30);
    console.log(`✅ Server is ready\n`);
  } catch (error) {
    console.error(`\n❌ Server did not become ready: ${error.message}`);
    process.exit(1);
  }
  
  // Step 3: Verify health
  await verifyHealth(serverInfo.url);
  
  // Step 4: Open browser
  const targetUrl = `${serverInfo.url}/insights`;
  console.log(`\n🌐 Opening browser: ${targetUrl}`);
  openBrowser(targetUrl);
  
  // Step 5: Output result
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  LOCAL SITE RUNNING');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`  Server Type: ${serverType}`);
  console.log(`  Local URL: ${serverInfo.url}`);
  console.log(`  Opened: ${targetUrl}`);
  console.log('');
  console.log('  Press Ctrl+C to stop\n');
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n\nShutting down...');
    if (serverInfo.process) {
      serverInfo.process.kill('SIGINT');
    }
    process.exit(0);
  });
}

if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = { main };
