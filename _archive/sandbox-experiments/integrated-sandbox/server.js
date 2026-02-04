#!/usr/bin/env node

/**
 * Integrated Sandbox Server
 * Tests RYD website with all engines integrated
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3002; // Different port from regular sandbox

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    const htmlPath = path.join(__dirname, 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 Integrated Sandbox Server');
  console.log('='.repeat(70) + '\n');
  console.log(`✅ Server running at: http://localhost:${PORT}\n`);
  console.log('🌐 Open this URL to test integrated system\n');
});
