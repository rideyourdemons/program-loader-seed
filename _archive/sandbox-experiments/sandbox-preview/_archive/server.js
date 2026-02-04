#!/usr/bin/env node

/**
 * Sandbox Preview Server
 * Serves a preview of the tool rotation system as it would appear on the live site
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3001;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  let filePath;
  
  // Handle root or index.html
  if (req.url === '/' || req.url === '/index.html') {
    filePath = path.join(__dirname, 'index.html');
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
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 Sandbox Preview Server');
  console.log('='.repeat(70) + '\n');
  console.log(`✅ Server running at:`);
  console.log(`   http://localhost:${PORT}\n`);
  console.log('🌐 Open this URL in your browser to view the preview');
  console.log('   Press Ctrl+C to stop the server\n');
});

