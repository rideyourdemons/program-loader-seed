/**
 * Platform v1 — minimal local dev server
 * Serves static files from ./app
 */
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const appDir = path.join(__dirname, 'app');

app.use(express.static(appDir));

app.get('/', (req, res) => {
  const indexPath = path.join(appDir, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) res.status(404).send('<h1>Platform v1 Running</h1><p>Build lane active. index.html not found.</p>');
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[PLATFORM-V1] http://localhost:${PORT}`);
  console.log(`[PLATFORM-V1] Press Ctrl+C to stop`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[PLATFORM-V1] Port ${PORT} in use. Try: PORT=3002 npm run dev`);
  } else {
    console.error('[PLATFORM-V1]', err.message);
  }
  process.exit(1);
});
