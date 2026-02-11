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

// Safe file sender
function safeSendFile(filePath, res, fallbackPath) {
  try {
    if (!fs.existsSync(filePath)) {
      if (fallbackPath && fs.existsSync(fallbackPath)) {
        return res.sendFile(fallbackPath);
      }
      return res.status(404).send('File not found');
    }
    res.sendFile(filePath);
  } catch (error) {
    console.error('[ERROR]', error);
    if (fallbackPath && fs.existsSync(fallbackPath)) {
      return res.status(500).sendFile(fallbackPath);
    }
    res.status(500).send('Server error');
  }
}

// Routes
app.get('/insights', (req, res) => {
  safeSendFile(path.join(publicDir, 'insights.html'), res, path.join(publicDir, 'index.html'));
});

app.get('/tools', (req, res) => {
  safeSendFile(path.join(publicDir, 'tools.html'), res, path.join(publicDir, 'index.html'));
});

app.get('/search', (req, res) => {
  safeSendFile(path.join(publicDir, 'search.html'), res, path.join(publicDir, 'index.html'));
});

// Main route
app.get('/', (req, res) => {
  safeSendFile(path.join(publicDir, 'index.html'), res, null);
});

// SPA fallback - use use() instead of get('*') for Express 5.x compatibility
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    safeSendFile(path.join(publicDir, 'index.html'), res, null);
  } else {
    next();
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('[EXPRESS ERROR]', err);
  res.status(500).send('Internal server error');
});

app.listen(PORT, () => {
  console.log(`🚀 RIG ONLINE: http://localhost:${PORT}`);
  console.log('Press Ctrl+C to shut down.');
});
