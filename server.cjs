const express = require('express');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

// Central Configuration - "Black Box" approach
// Logic is public, secrets stay in .env (private)
const CONFIG = {
  GTM_CONTAINER_ID: process.env.GTM_CONTAINER_ID || '',
  GTM_TEST_ID: process.env.GTM_TEST_ID || '',
  GA4_MEASUREMENT_ID: process.env.GA4_MEASUREMENT_ID || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000
};

// Analytics configuration (alias for compatibility)
const ANALYTICS_CONFIG = {
  GTM_CONTAINER_ID: CONFIG.GTM_CONTAINER_ID,
  GTM_TEST_ID: CONFIG.GTM_TEST_ID,
  GA4_MEASUREMENT_ID: CONFIG.GA4_MEASUREMENT_ID
};

// Lazy-bridge to the Matrix substrate engine (ESM) from this CommonJS server.
// We only load & initialize the million-node substrate once per process.
let siteControllerModulePromise = null;
let matrixEngineAvailable = false;

async function getSiteControllerModule() {
  if (!siteControllerModulePromise) {
    siteControllerModulePromise = import('./site_controller.mjs')
      .then((mod) => {
        if (typeof mod.initSubstrateEngine === 'function') {
          try {
            mod.initSubstrateEngine();
            matrixEngineAvailable = true;
            console.log('[MATRIX ENGINE] Substrate initialized successfully');
          } catch (err) {
            console.warn('[MATRIX ENGINE] Initialization warning:', err.message);
            matrixEngineAvailable = false;
          }
        }
        return mod;
      })
      .catch((err) => {
        console.warn('[MATRIX ENGINE] Matrix engine unavailable (optional):', err.message);
        matrixEngineAvailable = false;
        // Return a mock module so the server doesn't crash
        return {
          getSubstrateStatus: () => ({ error: 'Matrix engine unavailable' }),
          getVirtualWindow: () => [],
        };
      });
  }
  return siteControllerModulePromise;
}

// Safe file sender with error handling and analytics config injection
function safeSendFile(filePath, res, fallbackPath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`[EXPRESS] File not found: ${filePath}, using fallback`);
      if (fallbackPath && fs.existsSync(fallbackPath)) {
        return safeSendFile(fallbackPath, res, null);
      }
      return res.status(404).send('<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>404 Not Found</h1><p>The requested page was not found.</p></body></html>');
    }
    
        // For HTML files, inject central config (Black Box approach)
        if (filePath.endsWith('.html')) {
          try {
            let content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('</head>')) {
              // Inject central config - secrets stay in .env, logic is public
              const configScript = `
    <script>
      window.ENV_CONFIG = ${JSON.stringify(CONFIG)};
      window.RYD_ANALYTICS_CONFIG = ${JSON.stringify(ANALYTICS_CONFIG)};
    </script>`;
              content = content.replace('</head>', configScript + '\n</head>');
              return res.send(content);
            }
          } catch (readErr) {
            console.warn(`[Config] Failed to inject config for ${filePath}:`, readErr.message);
            // Fall through to regular sendFile
          }
        }
    
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error(`[EXPRESS ERROR] Failed to send file ${filePath}:`, err);
        if (fallbackPath && fs.existsSync(fallbackPath)) {
          return res.status(500).sendFile(fallbackPath, (fallbackErr) => {
            if (fallbackErr) {
              console.error(`[EXPRESS ERROR] Fallback also failed:`, fallbackErr);
              return res.status(500).send('<!DOCTYPE html><html><head><title>500 Internal Server Error</title></head><body><h1>500 Internal Server Error</h1><p>An error occurred while processing your request.</p></body></html>');
            }
          });
        }
        return res.status(500).send('<!DOCTYPE html><html><head><title>500 Internal Server Error</title></head><body><h1>500 Internal Server Error</h1><p>An error occurred while processing your request.</p></body></html>');
      }
    });
  } catch (error) {
    console.error(`[EXPRESS ERROR] Exception in safeSendFile for ${filePath}:`, error);
    if (fallbackPath && fs.existsSync(fallbackPath)) {
      return res.status(500).sendFile(fallbackPath, (fallbackErr) => {
        if (fallbackErr) {
          console.error(`[EXPRESS ERROR] Fallback also failed:`, fallbackErr);
          return res.status(500).send('<!DOCTYPE html><html><head><title>500 Internal Server Error</title></head><body><h1>500 Internal Server Error</h1><p>An error occurred while processing your request.</p></body></html>');
        }
      });
    }
    return res.status(500).send('<!DOCTYPE html><html><head><title>500 Internal Server Error</title></head><body><h1>500 Internal Server Error</h1><p>An error occurred while processing your request.</p></body></html>');
  }
}

// ============================================================================
// ROUTE ORDER (NON-NEGOTIABLE):
// 1. API routes FIRST (so they don't get swallowed by SPA fallback)
// 2. Static assets (express.static)
// 3. Specific page routes
// 4. Main route (/)
// 5. SPA fallback LAST
// ============================================================================

// 1. API ROUTES FIRST
app.get('/api/nodes', async (req, res) => {
  try {
    const mod = await getSiteControllerModule();
    const status = typeof mod.getSubstrateStatus === 'function'
      ? mod.getSubstrateStatus()
      : null;
    const windowSample = typeof mod.getVirtualWindow === 'function'
      ? mod.getVirtualWindow(0, 3, { reviewMode: true, maxAccessMs: 20 })
      : null;

    // Shard Manager: Check if archiving is needed
    const nodeCount = status?.totalNodes || 0;
    if (nodeCount >= 1_000_000) {
      try {
        const { shouldArchive, archiveShard, getSeedNodes } = await import('./core/shard_manager.mjs');
        if (shouldArchive(nodeCount)) {
          console.log(`[Shard Manager] Node count (${nodeCount}) exceeds 1M, archiving...`);
          const clusterData = {
            nodes: windowSample ? [windowSample] : [],
            seedNodes: getSeedNodes()
          };
          const shardId = archiveShard(clusterData, {
            clusteringCoefficient: 0.82,
            nodeCount
          });
          
          // Track shard transition in GA4
          if (typeof process !== 'undefined' && process.env.GA4_MEASUREMENT_ID) {
            // GA4 event would be tracked here if gtag was available server-side
            console.log(`[GA4] Shard transition: ${shardId}`);
          }
        }
      } catch (shardError) {
        console.warn('[Shard Manager] Archiving failed (non-critical):', shardError.message);
      }
    }

    // Force UTF-8 encoding to prevent corrupted text (ÃƒÂ... issue)
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json({
      message: 'Substrate Online. Million-node matrix seated.',
      status,
      windowSample,
      shardInfo: {
        nodeCount,
        shouldArchive: nodeCount >= 1_000_000
      }
    });
  } catch (error) {
    console.error('[API /api/nodes] Error accessing substrate:', error);
    res.status(500).json({
      error: 'Substrate engine unavailable',
    });
  }
});

// Shard Manager API endpoints
app.get('/api/shard/list', async (req, res) => {
  try {
    const { listShards } = await import('./core/shard_manager.mjs');
    const shards = listShards();
    res.json({ shards });
  } catch (error) {
    console.error('[API /api/shard/list] Error:', error);
    res.status(500).json({ error: 'Failed to list shards' });
  }
});

app.get('/api/shard/:shardId', async (req, res) => {
  try {
    const { loadShard } = await import('./core/shard_manager.mjs');
    const shard = loadShard(req.params.shardId);
    res.json({ shard });
  } catch (error) {
    console.error(`[API /api/shard/${req.params.shardId}] Error:`, error);
    res.status(404).json({ error: 'Shard not found' });
  }
});

// Virtual window API for frontend experiments (Engine ↔ Interface bridge)
app.get('/api/matrix/window', async (req, res) => {
  try {
    const start = Number.parseInt(req.query.start ?? '0', 10);
    const size = Number.parseInt(req.query.size ?? '3', 10);

    const mod = await getSiteControllerModule();
    if (typeof mod.getVirtualWindow !== 'function') {
      return res.status(500).json({ error: 'Virtual window not available' });
    }

    const windowNodes = mod.getVirtualWindow(start, size, {
      reviewMode: true,
      maxAccessMs: 20, // 0.02s Purser threshold
    });

    res.json({
      start,
      size: windowNodes.length,
      nodes: windowNodes,
    });
  } catch (error) {
    console.error('[API /api/matrix/window] Error:', error);
    res.status(500).json({
      error: 'Failed to read from substrate window',
    });
  }
});

// 2. STATIC ASSETS (express.static) - Must come after API routes
// Force UTF-8 encoding on all static files
app.use((req, res, next) => {
  // Set UTF-8 headers for all responses
  res.setHeader('Content-Type', res.getHeader('Content-Type') || 'text/html; charset=utf-8');
  if (req.path.endsWith('.json')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  } else if (req.path.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  } else if (req.path.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css; charset=utf-8');
  }
  res.setHeader('Accept-Charset', 'utf-8');
  next();
});

app.use(express.static(publicDir, {
  setHeaders: (res, filePath) => {
    // Force UTF-8 for JSON files
    if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
  }
}));
app.use('/js', express.static(path.join(publicDir, 'js')));
app.use('/data', express.static(path.join(publicDir, 'data'), {
  setHeaders: (res, filePath) => {
    // Force UTF-8 for data files (JSON)
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Accept-Charset', 'utf-8');
  }
}));
app.use('/matrix', express.static(path.join(publicDir, 'matrix')));

// 3. SPECIFIC PAGE ROUTES
app.get('/insights', (req, res, next) => {
  const insightsPath = path.join(publicDir, 'insights.html');
  const fallbackPath = path.join(publicDir, 'index.html');
  safeSendFile(insightsPath, res, fallbackPath);
});

app.get('/tools', (req, res, next) => {
  const toolsPath = path.join(publicDir, 'tools.html');
  const fallbackPath = path.join(publicDir, 'index.html');
  safeSendFile(toolsPath, res, fallbackPath);
});

app.get('/search', (req, res, next) => {
  const searchPath = path.join(publicDir, 'search.html');
  const fallbackPath = path.join(publicDir, 'index.html');
  safeSendFile(searchPath, res, fallbackPath);
});

// 4. MAIN ROUTE
app.get('/', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  safeSendFile(indexPath, res, null);
});

// 5. SPA FALLBACK LAST (must be after API routes and static assets)
// Use use() instead of get('*') for Express 5.x compatibility
// Only catch GET requests that aren't API or static assets
app.use((req, res, next) => {
  if (req.method === 'GET' && 
      !req.path.startsWith('/api') && 
      !req.path.startsWith('/js') && 
      !req.path.startsWith('/data') && 
      !req.path.startsWith('/matrix') && 
      !req.path.startsWith('/css') &&
      !req.path.match(/\.(js|css|json|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i)) {
    const indexPath = path.join(publicDir, 'index.html');
    safeSendFile(indexPath, res, null);
  } else {
    next();
  }
});

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error('[EXPRESS ERROR]', err);
  console.error('[EXPRESS ERROR] Request:', req.method, req.url);
  if (err.stack) {
    console.error('[EXPRESS ERROR] Stack:', err.stack);
  }
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.status(500).sendFile(indexPath, (sendErr) => {
      if (sendErr) {
        res.status(500).send('<!DOCTYPE html><html><head><title>500 Internal Server Error</title></head><body><h1>500 Internal Server Error</h1><p>An error occurred while processing your request.</p></body></html>');
      }
    });
  } else {
    res.status(500).send('<!DOCTYPE html><html><head><title>500 Internal Server Error</title></head><body><h1>500 Internal Server Error</h1><p>An error occurred while processing your request.</p></body></html>');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 RIG ONLINE: http://localhost:${PORT}`);
  console.log(`   Also available at: http://127.0.0.1:${PORT}`);
  console.log('Press Ctrl+C to shut down the well.');
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ ERROR: Port ${PORT} is already in use.`);
    console.error(`   Try: set PORT=3001 && node server.cjs`);
    console.error(`   Or kill the process using port ${PORT}`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});
