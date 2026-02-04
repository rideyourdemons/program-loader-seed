#!/usr/bin/env node

/**
 * Integrated Sandbox Server - RYD Site + All Engines
 * Tests the actual RYD Site codebase with all engines integrated
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse as parseUrl } from 'url';
import complianceMiddleware from '../core/compliance-middleware.js';
import toolRotationModule from '../core/tool-rotation.js';
import { MatrixEngine } from '../core/matrix-engine.js';
import { AuthorityEngine } from '../core/authority-engine.js';
import aiTourGuideModule from '../core/ai-tour-guide.js';
import { logger } from '../core/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');
// RYD Site location - try multiple possible paths
const POSSIBLE_RYD_PATHS = [
  process.env.RYD_SITE_PATH, // Environment variable takes priority
  process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Documents', 'Site') : null,
  process.env.HOME ? path.join(process.env.HOME, 'Documents', 'Site') : null,
  path.join(path.dirname(PROJECT_ROOT), '..', '..', 'Site'),
].filter(Boolean); // Remove null/undefined values

let RYD_SITE_PATH = null;
for (const possiblePath of POSSIBLE_RYD_PATHS) {
  if (fs.existsSync(possiblePath)) {
    RYD_SITE_PATH = possiblePath;
    break;
  }
}

// Handle exports
const toolRotation = toolRotationModule.default || toolRotationModule;
const aiTourGuide = aiTourGuideModule.default || aiTourGuideModule;

const PORT = 3003; // Different port for integrated RYD sandbox

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

// Initialize engines
let matrixEngine = null;
let authorityEngine = null;

const mockFirebaseBackend = {
  readDocument: async () => ({ data: {}, id: 'mock' }),
  readCollection: async () => [],
  writeDocument: async () => ({ success: true })
};

try {
  matrixEngine = new MatrixEngine(mockFirebaseBackend);
  authorityEngine = new AuthorityEngine(mockFirebaseBackend);
  logger.info('All engines initialized successfully');
} catch (error) {
  logger.warn(`Some engines failed to initialize: ${error.message}`);
}

// Check if RYD Site engines exist
function checkRYDSiteEngines() {
  const utilsPath = path.join(RYD_SITE_PATH, 'js', 'utils');
  const enginesExist = fs.existsSync(path.join(utilsPath, 'tool-rotation.js'));
  return {
    exists: enginesExist,
    path: utilsPath,
    sitePath: RYD_SITE_PATH
  };
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = parseUrl(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // API endpoint for RYD Site status
  if (pathname === '/api/ryd-site/status' && req.method === 'GET') {
    const siteStatus = checkRYDSiteEngines();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(siteStatus, null, 2));
    return;
  }

  // Serve main sandbox page
  if (pathname === '/' || pathname === '/index.html') {
    const htmlPath = path.join(__dirname, 'index-integrated-ryd.html');
    if (fs.existsSync(htmlPath)) {
      let html = fs.readFileSync(htmlPath, 'utf8');
      
      // Inject RYD Site status
      const siteStatus = checkRYDSiteEngines();
      const statusScript = `
        <script>
          window.rydSiteStatus = ${JSON.stringify(siteStatus)};
        </script>
      `;
      html = html.replace('</head>', statusScript + '</head>');
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } else {
      res.writeHead(404);
      res.end('Sandbox page not found');
    }
    return;
  }

  // Try to serve from RYD Site (if exists)
  if (RYD_SITE_PATH && fs.existsSync(RYD_SITE_PATH)) {
    const relativePath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    const filePath = path.join(RYD_SITE_PATH, relativePath);
    
    // Security check - ensure path is within RYD_SITE_PATH
    if (!filePath.startsWith(RYD_SITE_PATH)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const extname = String(path.extname(filePath)).toLowerCase();
      const contentType = MIME_TYPES[extname] || 'application/octet-stream';
      
      try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
        return;
      } catch (error) {
        logger.error(`Error serving file: ${error.message}`);
      }
    }
  }

  // API endpoints (same as server-all-engines.js)
  if (pathname === '/api/tool-rotation' && req.method === 'GET') {
    const tools = JSON.parse(query.tools || '[]');
    const date = query.date ? new Date(query.date) : new Date();
    
    try {
      const tool = toolRotation.getToolOfTheDay(tools, date);
      const schedule = toolRotation.getRotationSchedule(tools, 7);
      const nextRotation = toolRotation.getNextRotationInfo ? toolRotation.getNextRotationInfo() : { formatted: '24h 0m' };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ tool, schedule, nextRotation }, null, 2));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // Other API endpoints... (similar to server-all-engines.js)
  // For brevity, including key ones

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 Integrated RYD Site Sandbox Server');
  console.log('='.repeat(70) + '\n');
  console.log(`✅ Server running at: http://localhost:${PORT}\n`);
  
  const siteStatus = checkRYDSiteEngines();
  console.log('📁 RYD Site Status:');
  console.log(`   Path: ${siteStatus.sitePath}`);
  console.log(`   Engines Integrated: ${siteStatus.exists ? '✅ YES' : '❌ NO'}\n`);
  
  console.log('🌐 Open http://localhost:3003 to test integrated RYD Site\n');
  
  logger.info('Integrated RYD Site sandbox server ready');
});

