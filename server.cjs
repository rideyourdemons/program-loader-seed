const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

// Serve static assets from /public
app.use(express.static(publicDir));
app.use('/js', express.static(path.join(publicDir, 'js')));
app.use('/data', express.static(path.join(publicDir, 'data')));
app.use('/matrix', express.static(path.join(publicDir, 'matrix')));

// Safe file sender with error handling
function safeSendFile(filePath, res, fallbackPath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`[EXPRESS] File not found: ${filePath}, using fallback`);
      if (fallbackPath && fs.existsSync(fallbackPath)) {
        return res.sendFile(fallbackPath);
      }
      return res.status(404).send('<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>404 Not Found</h1><p>The requested page was not found.</p></body></html>');
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

// Route handlers for specific pages (before SPA fallback)
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

// API routes (before SPA fallback)
app.get('/api/nodes', (req, res) => {
  res.json({ message: 'Reservoir Connected. 173,000 Nodes Standby.' });
});

// Main Route - Ride Your Demons Interface
app.get('/', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  safeSendFile(indexPath, res, null);
});

// SPA fallback - serve index.html for all other routes (must be last)
app.get('*', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  safeSendFile(indexPath, res, null);
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

app.listen(PORT, () => {
  console.log(`🚀 RIG ONLINE: http://localhost:${PORT}`);
  console.log('Press Ctrl+C to shut down the well.');
});
