#!/usr/bin/env node

/**
 * Live Site Preview Sandbox Server
 * Serves the actual RYD Site with engines integrated - looks like live site
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse as parseUrl } from 'url';
import complianceMiddleware from '../core/compliance-middleware.js';
import { logger } from '../core/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');
// Use environment variable or try common paths
const RYD_SITE_PATH = process.env.RYD_SITE_PATH || 
  (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Documents', 'Site') : null) ||
  path.join(process.env.HOME || process.env.USERPROFILE || '', 'Documents', 'Site');

const PORT = 3004; // Port for live preview

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

// Check if RYD Site exists
if (!fs.existsSync(RYD_SITE_PATH)) {
  console.error(`❌ RYD Site not found at: ${RYD_SITE_PATH}`);
  console.error('Please ensure the Site folder exists in Documents');
  process.exit(1);
}

console.log('\n' + '='.repeat(70));
console.log('🚀 Live Site Preview Sandbox');
console.log('='.repeat(70) + '\n');
console.log(`📁 Serving from: ${RYD_SITE_PATH}\n`);

const server = http.createServer(async (req, res) => {
  const parsedUrl = parseUrl(req.url, true);
  let pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // Default to index.html for root
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  // Remove leading slash for file path
  const relativePath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  const filePath = path.join(RYD_SITE_PATH, relativePath);

  // Security check - ensure path is within RYD_SITE_PATH
  const normalizedPath = path.normalize(filePath);
  const normalizedSitePath = path.normalize(RYD_SITE_PATH);
  
  if (!normalizedPath.startsWith(normalizedSitePath)) {
    res.writeHead(403, { 'Content-Type': 'text/html' });
    res.end('<h1>403 Forbidden</h1>');
    return;
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 Not Found</h1><p>' + pathname + '</p>');
    return;
  }

  const stats = fs.statSync(filePath);

  // Handle directories - look for index.html
  if (stats.isDirectory()) {
    const indexPath = path.join(filePath, 'index.html');
    if (fs.existsSync(indexPath)) {
      await serveFile(indexPath, res, req, query);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1>');
    }
    return;
  }

  // Serve file
  await serveFile(filePath, res, req, query);
});

async function serveFile(filePath, res, req, query) {
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);

    // For HTML files, we could inject engine scripts here if needed
    if (extname === '.html') {
      let html = content.toString('utf8');
      
      // Optionally inject engine loader script before </body>
      const engineScript = `
        <script type="module">
          // Engines are available at /js/utils/
          console.log('✅ RYD Site with engines loaded');
          console.log('Engines available at: /js/utils/');
        </script>
      `;
      
      html = html.replace('</body>', engineScript + '</body>');
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(html, 'utf8');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  } catch (error) {
    console.error(`Error serving ${filePath}:`, error.message);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('<h1>500 Internal Server Error</h1><p>' + error.message + '</p>');
  }
}

server.listen(PORT, () => {
  console.log(`✅ Server running at: http://localhost:${PORT}\n`);
  console.log('🌐 Open this URL to see your site as it would appear live\n');
  console.log('💡 Your actual RYD Site files are being served');
  console.log('   Engines are integrated at: js/utils/\n');
  console.log('📋 Notes:');
  console.log('   • This is a local preview - safe to test');
  console.log('   • All engines are integrated');
  console.log('   • Looks like the live site');
  console.log('   • No changes to production\n');
});

