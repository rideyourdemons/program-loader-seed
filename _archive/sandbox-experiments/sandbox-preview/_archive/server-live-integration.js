#!/usr/bin/env node

/**
 * Live Site Integration Server
 * Serves the platform integrated with RYD site header
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3004;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let filePath;
  
  // Handle root - serve the integration preview
  if (req.url === '/' || req.url === '/index.html') {
    filePath = path.join(__dirname, 'live-site-integration.html');
  } else {
    // Remove leading slash and join with directory
    const relativePath = req.url.startsWith('/') ? req.url.slice(1) : req.url;
    filePath = path.join(__dirname, relativePath);
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, 'utf-8');
      }
    } else {
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
  console.log('🚀 Live Site Integration Preview Server');
  console.log('='.repeat(70) + '\n');
  console.log('✅ Server running at:');
  console.log(`   http://localhost:${PORT}\n`);
  console.log('🎯 Shows platform integrated with RYD site header');
  console.log('   (Platform server must be running on port 3002)\n');
  console.log('🌐 Open the URL above in your browser\n');
});

