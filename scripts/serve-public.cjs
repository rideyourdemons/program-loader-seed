/**
 * Minimal Static File Server for /public directory
 * Serves files at http://localhost:5173
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5173;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Content-Type mapping
const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return CONTENT_TYPES[ext] || 'application/octet-stream';
}

function serveFile(filePath, res, fallbackPath = null) {
  const fullPath = path.join(PUBLIC_DIR, filePath);
  
  // Security: prevent directory traversal
  if (!fullPath.startsWith(PUBLIC_DIR)) {
    console.error(`[SERVER ERROR] 403 Forbidden: ${filePath}`);
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }
  
  // Try to serve the requested file
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found - try fallback if provided
        if (fallbackPath) {
          const fallbackFullPath = path.join(PUBLIC_DIR, fallbackPath);
          if (fs.existsSync(fallbackFullPath)) {
            console.warn(`[SERVER] File not found: ${filePath}, using fallback: ${fallbackPath}`);
            return serveFile(fallbackPath, res, null);
          } else {
            console.error(`[SERVER ERROR] Fallback file also missing: ${fallbackPath}`);
          }
        }
        console.error(`[SERVER ERROR] 404 Not Found: ${filePath} (${fullPath})`);
        if (filePath === 'index.html') {
          console.error(`[SERVER ERROR] CRITICAL: index.html is missing from ${PUBLIC_DIR}`);
          console.error(`[SERVER ERROR] This file is required for SPA routing to work`);
        }
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>404 Not Found</h1><p>The requested file was not found.</p></body></html>');
      } else {
        // Other error - try fallback if provided
        if (fallbackPath) {
          const fallbackFullPath = path.join(PUBLIC_DIR, fallbackPath);
          if (fs.existsSync(fallbackFullPath)) {
            console.error(`[SERVER ERROR] Error reading ${filePath}, using fallback: ${fallbackPath}`);
            console.error(`[SERVER ERROR] Error details:`, err);
            return serveFile(fallbackPath, res, null);
          }
        }
        console.error(`[SERVER ERROR] 500 Internal Server Error: ${filePath}`);
        console.error(`[SERVER ERROR] Error details:`, err);
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<!DOCTYPE html><html><head><title>500 Internal Server Error</title></head><body><h1>500 Internal Server Error</h1><p>An error occurred while processing your request.</p></body></html>');
      }
      return;
    }
    
    res.writeHead(200, { 'Content-Type': getContentType(fullPath) });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  // CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('405 Method Not Allowed');
    return;
  }
  
  let urlPath = req.url.split('?')[0]; // Remove query string
  const acceptHeader = req.headers.accept || '';
  const isHtmlRequest = acceptHeader.includes('text/html') || !acceptHeader.includes('application/json');
  
  // Check if this is a static asset request (has file extension)
  const hasExtension = /\.\w+$/.test(urlPath);
  const isApiRoute = urlPath.startsWith('/api/');
  const isInternalRoute = urlPath.startsWith('/__') || urlPath.startsWith('/_next/');
  
  // Default to index.html for root
  if (urlPath === '/' || urlPath === '') {
    return serveFile('index.html', res, null);
  }
  
  // Don't rewrite static assets, API routes, or internal routes
  if (hasExtension || isApiRoute || isInternalRoute) {
    const filePath = urlPath.substring(1); // Remove leading slash
    return serveFile(filePath, res, null);
  }
  
  // SPA fallback: For HTML requests without extensions, try specific files first, then fallback to index.html
  const routeMap = {
    '/insights': 'insights.html',
    '/tools': 'tools.html',
    '/search': 'search.html',
    '/gates': 'gates/index.html'
  };
  
  // Check if we have a mapped route
  if (routeMap[urlPath]) {
    const mappedFile = routeMap[urlPath];
    const mappedPath = path.join(PUBLIC_DIR, mappedFile);
    if (fs.existsSync(mappedPath)) {
      return serveFile(mappedFile, res, 'index.html');
    }
    // Mapped file doesn't exist - fall through to SPA fallback
  }
  
  // Try to find a file with .html extension
  const htmlPath = urlPath.substring(1) + '.html';
  const fullHtmlPath = path.join(PUBLIC_DIR, htmlPath);
  
  if (fs.existsSync(fullHtmlPath)) {
    return serveFile(htmlPath, res, 'index.html');
  }
  
  // SPA fallback: serve index.html for all HTML requests
  // This ensures /insights, /tools, and all other routes work with client-side routing
  if (isHtmlRequest) {
    const indexPath = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      return serveFile('index.html', res, null);
    } else {
      console.error(`[SERVER ERROR] CRITICAL: index.html is missing from ${PUBLIC_DIR}`);
      console.error(`[SERVER ERROR] SPA routing requires index.html to exist`);
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>404 Not Found</h1><p>The SPA entry file (index.html) is missing.</p></body></html>');
      return;
    }
  }
  
  // Non-HTML request for non-existent route
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

server.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  LOCAL SERVER RUNNING');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`  Port: ${PORT}`);
  console.log(`  URL: http://localhost:${PORT}`);
  console.log(`  Insights: http://localhost:${PORT}/insights`);
  console.log(`  Tools: http://localhost:${PORT}/tools`);
  console.log('');
  console.log('  Press Ctrl+C to stop the server');
  console.log('');
});

// Handle errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error('   Try closing other servers or change PORT in serve-public.cjs');
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down server...');
  server.close(() => {
    console.log('Server stopped.');
    process.exit(0);
  });
});
