/**
 * Minimal site server — static + HTML routes only. No matrix API.
 * Use from /site: node server.cjs
 */
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

const CONFIG = { GTM_CONTAINER_ID: '', GTM_TEST_ID: '', GA4_MEASUREMENT_ID: '', NODE_ENV: 'development', PORT };
const ANALYTICS_CONFIG = { GTM_CONTAINER_ID: CONFIG.GTM_CONTAINER_ID, GTM_TEST_ID: CONFIG.GTM_TEST_ID, GA4_MEASUREMENT_ID: CONFIG.GA4_MEASUREMENT_ID };

function safeSendFile(filePath, res, fallbackPath) {
  try {
    if (!fs.existsSync(filePath)) {
      if (fallbackPath && fs.existsSync(fallbackPath)) return safeSendFile(fallbackPath, res, null);
      return res.status(404).send('<!DOCTYPE html><html><head><title>404</title></head><body><h1>404 Not Found</h1></body></html>');
    }
    if (filePath.endsWith('.html')) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('</head>')) {
          const configScript = `<script>window.ENV_CONFIG=${JSON.stringify(CONFIG)};window.RYD_ANALYTICS_CONFIG=${JSON.stringify(ANALYTICS_CONFIG)};</script>`;
          content = content.replace('</head>', configScript + '\n</head>');
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          return res.send(content);
        }
      } catch (e) { /* fall through */ }
    }
    return res.sendFile(filePath, (err) => {
      if (err && fallbackPath && fs.existsSync(fallbackPath)) return safeSendFile(fallbackPath, res, null);
      if (err) return res.status(500).send('<h1>500 Error</h1>');
    });
  } catch (e) {
    if (fallbackPath && fs.existsSync(fallbackPath)) return safeSendFile(fallbackPath, res, null);
    return res.status(500).send('<h1>500 Error</h1>');
  }
}

app.use((req, res, next) => {
  if (req.path.endsWith('.json')) res.setHeader('Content-Type', 'application/json; charset=utf-8');
  else if (req.path.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  else if (req.path.endsWith('.css')) res.setHeader('Content-Type', 'text/css; charset=utf-8');
  res.setHeader('Accept-Charset', 'utf-8');
  next();
});
app.use(express.static(publicDir, { setHeaders: (res, fp) => { if (fp.endsWith('.json')) res.setHeader('Content-Type', 'application/json; charset=utf-8'); } }));
app.use('/js', express.static(path.join(publicDir, 'js')));
app.use('/data', express.static(path.join(publicDir, 'data'), { setHeaders: (res) => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); } }));
app.use('/matrix', express.static(path.join(publicDir, 'matrix')));

app.get('/insights', (req, res) => { safeSendFile(path.join(publicDir, 'insights.html'), res, path.join(publicDir, 'index.html')); });
app.get('/tools', (req, res) => { safeSendFile(path.join(publicDir, 'tools.html'), res, path.join(publicDir, 'index.html')); });
app.get('/search', (req, res) => { safeSendFile(path.join(publicDir, 'search.html'), res, path.join(publicDir, 'index.html')); });
app.get('/store', (req, res) => { safeSendFile(path.join(publicDir, 'store', 'index.html'), res, path.join(publicDir, 'index.html')); });
app.get('/store/', (req, res) => { safeSendFile(path.join(publicDir, 'store', 'index.html'), res, path.join(publicDir, 'index.html')); });
app.get('/gates', (req, res) => { safeSendFile(path.join(publicDir, 'gates', 'index.html'), res, path.join(publicDir, 'index.html')); });
app.get('/', (req, res) => { safeSendFile(path.join(publicDir, 'index.html'), res, null); });

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/js') && !req.path.startsWith('/data') && !req.path.startsWith('/matrix') && !req.path.startsWith('/css') && !/\.(js|css|json|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(req.path))
    safeSendFile(path.join(publicDir, 'index.html'), res, null);
  else
    next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Site server: http://localhost:' + PORT);
  console.log('  /insights, /tools, /search, /store, /gates');
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') console.error('Port ' + PORT + ' in use. Try PORT=3001 node server.cjs');
  else console.error(err);
  process.exit(1);
});
