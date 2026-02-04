#!/usr/bin/env node

/**
 * Canonical Sandbox Development Server
 * Single server for all sandbox preview routes on port 3001
 * 
 * Routes:
 *   /                         -> Landing page with links to all previews
 *   /platform-integrated      -> platform-integrated.html
 *   /ryd-integrated           -> index-integrated-ryd.html
 *   /live-integration         -> live-site-integration.html
 *   /integration-preview      -> live-site-integration-preview.html
 * 
 * Also serves static files from /sandbox-preview directory
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse as parseUrl } from 'url';
import { MatrixEngine } from '../core/matrix-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3001;
const matrixEngine = new MatrixEngine(null);

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

// Route to HTML file mapping
const ROUTES = {
  '/platform-integrated': 'platform-integrated.html',
  '/ryd-integrated': 'index-integrated-ryd.html',
  '/live-integration': 'live-site-integration.html',
  '/integration-preview': 'live-site-integration-preview.html'
};

// Generate landing page HTML
function generateLandingPage() {
  const routes = Object.keys(ROUTES);
  const links = routes.map(route => {
    const fileName = ROUTES[route];
    const displayName = fileName
      .replace(/-/g, ' ')
      .replace(/\.html$/i, '')
      .replace(/^\w/, c => c.toUpperCase());
    
    return `
      <div class="route-card">
        <h3>${displayName}</h3>
        <p class="route-path">Route: <code>${route}</code></p>
        <p class="file-name">File: <code>${fileName}</code></p>
        <a href="${route}" class="preview-link">View Preview →</a>
      </div>
    `;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sandbox Preview - Development Server</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 20px;
            color: #333;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        header {
            text-align: center;
            margin-bottom: 50px;
            color: white;
        }

        header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }

        header p {
            font-size: 1.2em;
            opacity: 0.9;
        }

        .routes-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
        }

        .route-card {
            background: white;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .route-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 12px rgba(0,0,0,0.15);
        }

        .route-card h3 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.4em;
        }

        .route-card .route-path,
        .route-card .file-name {
            margin: 8px 0;
            font-size: 0.9em;
            color: #666;
        }

        .route-card code {
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }

        .preview-link {
            display: inline-block;
            margin-top: 15px;
            padding: 10px 20px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            transition: background 0.2s;
            font-weight: 600;
        }

        .preview-link:hover {
            background: #5568d3;
        }

        .info-section {
            background: white;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .info-section h2 {
            color: #667eea;
            margin-bottom: 15px;
        }

        .info-section p {
            margin: 10px 0;
            line-height: 1.6;
            color: #555;
        }

        .info-section code {
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
        }

        @media (max-width: 768px) {
            header h1 {
                font-size: 2em;
            }

            .routes-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🚀 Sandbox Preview Server</h1>
            <p>Development server for testing platform previews</p>
        </header>

        <div class="routes-grid">
            ${links}
        </div>

        <div class="info-section">
            <h2>ℹ️ Server Information</h2>
            <p><strong>Port:</strong> <code>${PORT}</code></p>
            <p><strong>Base URL:</strong> <code>http://localhost:${PORT}</code></p>
            <p><strong>Routes:</strong> All preview routes are accessible from this landing page</p>
            <p><strong>Static Files:</strong> Any file in the sandbox-preview directory can be accessed directly by filename</p>
        </div>
    </div>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const parsedUrl = parseUrl(req.url, true);
  const pathname = parsedUrl.pathname;

  // Matrix API - numerological calculation
  if (pathname === '/api/matrix/calculate' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const text = typeof payload.text === 'string' ? payload.text : '';
        if (!text.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'text is required' }));
          return;
        }

        const value = matrixEngine.calculateNumerologicalValue(text);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ text, numerologicalValue: value }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'invalid json payload' }));
      }
    });
    return;
  }

  // Handle root - serve landing page
  if (pathname === '/' || pathname === '/index.html') {
    const landingPage = generateLandingPage();
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(landingPage, 'utf-8');
    return;
  }

  // Handle route mappings
  if (ROUTES[pathname]) {
    const fileName = ROUTES[pathname];
    const filePath = path.join(__dirname, fileName);
    
    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(`<h1>404 - File Not Found</h1><p>Route "${pathname}" maps to "${fileName}" but file does not exist.</p>`, 'utf-8');
        } else {
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end(`<h1>500 - Server Error</h1><p>${error.message}</p>`, 'utf-8');
        }
      } else {
        // For live-site-integration.html, update iframe src to use route instead of port
        let htmlContent = content.toString();
        if (fileName === 'live-site-integration.html') {
          // Replace localhost:3002 with /platform-integrated route
          htmlContent = htmlContent.replace(
            /src="http:\/\/localhost:3002"/g,
            'src="/platform-integrated"'
          );
        }

        const extname = String(path.extname(filePath)).toLowerCase();
        const contentType = MIME_TYPES[extname] || 'text/html';

        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
        res.end(htmlContent, 'utf-8');
      }
    });
    return;
  }

  // Serve static files from sandbox-preview directory
  const relativePath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  const filePath = path.join(__dirname, relativePath);

  // Security check - ensure path is within __dirname
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/html' });
    res.end('<h1>403 - Forbidden</h1>', 'utf-8');
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h1>500 - Server Error</h1><p>${error.message}</p>`, 'utf-8');
      }
    } else {
      const extname = String(path.extname(filePath)).toLowerCase();
      const contentType = MIME_TYPES[extname] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 CANONICAL SANDBOX DEVELOPMENT SERVER');
  console.log('='.repeat(70) + '\n');
  console.log(`✅ Server running at: http://localhost:${PORT}\n`);
  console.log('📋 Available Routes:');
  Object.keys(ROUTES).forEach(route => {
    console.log(`   ${route.padEnd(25)} -> ${ROUTES[route]}`);
  });
  console.log('\n🌐 Open http://localhost:' + PORT + ' to see the landing page');
  console.log('   Press Ctrl+C to stop the server\n');
});




