#!/usr/bin/env node

/**
 * Sandbox Server for Fully Integrated Platform
 * Serves the complete integrated platform with all features:
 * - Mobile/Desktop detection
 * - Search functionality
 * - Tour guide system
 * - Tool rotation
 * - Live site styling
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3002;

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
  
  // Handle root - serve the integrated platform
  if (req.url === '/' || req.url === '/index.html') {
    filePath = path.join(__dirname, 'platform-integrated.html');
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
  console.log('🚀 Integrated Platform Sandbox Server');
  console.log('='.repeat(70) + '\n');
  console.log('✅ Server running at:');
  console.log(`   http://localhost:${PORT}\n`);
  console.log('🎯 Features available:');
  console.log('   ✓ Mobile/Desktop responsive design');
  console.log('   ✓ Search functionality (depression, anxiety, etc.)');
  console.log('   ✓ AI-guided tour system');
  console.log('   ✓ Tool of the day rotation');
  console.log('   ✓ Live site styling');
  console.log('   ✓ Pain point pages with tools\n');
  console.log('🌐 Open the URL above in your browser to test all features');
  console.log('   Press Ctrl+C to stop the server\n');
});

