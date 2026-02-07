/**
 * Minimal Local Runner - Outputs ROOT and URL only
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT_DIR = path.join(__dirname, '..');
const FIREBASE_JSON = path.join(ROOT_DIR, 'firebase.json');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

/**
 * Check if Firebase CLI available
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
 * Get Firebase hosting public directory
 */
function getFirebasePublicDir() {
  try {
    const config = JSON.parse(fs.readFileSync(FIREBASE_JSON, 'utf8'));
    return path.join(ROOT_DIR, config.hosting?.public || 'public');
  } catch {
    return PUBLIC_DIR;
  }
}

/**
 * Check if build needed
 */
function needsBuild() {
  const matrixFile = path.join(PUBLIC_DIR, 'matrix', 'seo-matrix.json');
  return !fs.existsSync(matrixFile);
}

/**
 * Wait for server
 */
function waitForServer(url, maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? require('https') : http;
      const req = client.get(url, (res) => {
        if (res.statusCode === 200) resolve();
        else if (attempts >= maxAttempts) reject(new Error(`HTTP ${res.statusCode}`));
        else setTimeout(check, 500);
      });
      req.on('error', () => {
        if (attempts >= maxAttempts) reject(new Error('Not responding'));
        else setTimeout(check, 500);
      });
      req.setTimeout(2000, () => {
        req.destroy();
        if (attempts >= maxAttempts) reject(new Error('Timeout'));
        else setTimeout(check, 500);
      });
    };
    check();
  });
}

/**
 * Start Firebase Emulator
 */
function startFirebaseEmulator() {
  return new Promise((resolve) => {
    const emulator = spawn('firebase', ['emulators:start', '--only', 'hosting'], {
      cwd: ROOT_DIR,
      stdio: 'pipe',
      shell: true
    });
    
    let url = 'http://localhost:5000';
    let ready = false;
    
    emulator.stdout.on('data', (data) => {
      const text = data.toString();
      const match = text.match(/http:\/\/localhost:(\d+)/);
      if (match) url = `http://localhost:${match[1]}`;
      if ((text.includes('All emulators ready') || text.includes('hosting')) && !ready) {
        ready = true;
        setTimeout(() => resolve({ process: emulator, url }), 2000);
      }
    });
    
    emulator.stderr.on('data', (data) => {
      const match = data.toString().match(/http:\/\/localhost:(\d+)/);
      if (match) url = `http://localhost:${match[1]}`;
    });
    
    setTimeout(() => {
      if (!ready) {
        ready = true;
        resolve({ process: emulator, url });
      }
    }, 8000);
  });
}

/**
 * Start Express server
 */
function startExpress() {
  return new Promise((resolve) => {
    const server = spawn('node', ['server.cjs'], {
      cwd: ROOT_DIR,
      stdio: 'pipe',
      shell: false,
      env: { ...process.env, PORT: '3000' }
    });
    
    const url = 'http://localhost:3000';
    let ready = false;
    
    server.stdout.on('data', (data) => {
      const text = data.toString();
      if ((text.includes('listening') || text.includes('online') || text.includes('RIG ONLINE')) && !ready) {
        ready = true;
        setTimeout(() => resolve({ process: server, url }), 1000);
      }
    });
    
    setTimeout(() => {
      if (!ready) {
        ready = true;
        resolve({ process: server, url });
      }
    }, 5000);
  });
}

/**
 * Main
 */
async function main() {
  // Step 1: Detect
  const hasFirebase = fs.existsSync(FIREBASE_JSON);
  const publicDir = hasFirebase ? getFirebasePublicDir() : PUBLIC_DIR;
  const publicDirRelative = path.relative(ROOT_DIR, publicDir);
  
  // Step 2: Build if needed
  if (needsBuild()) {
    try {
      execSync('npm run build', { stdio: 'ignore', cwd: ROOT_DIR });
    } catch {
      // Continue anyway
    }
  }
  
  // Step 3: Start server
  let serverInfo;
  if (hasFirebase && hasFirebaseCLI()) {
    serverInfo = await startFirebaseEmulator();
  } else {
    serverInfo = await startExpress();
  }
  
  // Step 4: Wait for ready
  try {
    await waitForServer(serverInfo.url, 30);
  } catch {
    // Continue anyway
  }
  
  // Step 5: Output (ONLY these two lines)
  console.log(`ROOT: ${publicDirRelative}`);
  console.log(`URL: ${serverInfo.url}`);
  
  // Keep running
  process.on('SIGINT', () => {
    if (serverInfo.process) serverInfo.process.kill('SIGINT');
    process.exit(0);
  });
}

if (require.main === module) {
  main().catch(() => process.exit(1));
}

module.exports = { main };
