#!/usr/bin/env node

/**
 * Integrated Sandbox Preview Server
 * Serves preview with all compliance systems, guardrails, and disclaimers integrated
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

const PORT = 3001;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json'
};

// Load compliance data for disclaimers
function loadDisclaimers(region = 'US') {
  try {
    const legalRulesPath = path.join(__dirname, '../compliance-data/legal-rules.json');
    const legalRules = JSON.parse(fs.readFileSync(legalRulesPath, 'utf8'));
    const regionRules = legalRules[region] || legalRules['US'];
    
    return regionRules?.requiredDisclaimers || [];
  } catch (error) {
    logger.error(`Error loading disclaimers: ${error.message}`);
    return [];
  }
}

// Inject disclaimers into HTML
function injectDisclaimers(html, region = 'US') {
  const disclaimers = loadDisclaimers(region);
  
  // Create disclaimer HTML
  const disclaimerHTML = disclaimers.map(d => {
    return `
      <div class="disclaimer-item" style="margin-bottom: 15px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
        <h4 style="margin: 0 0 8px 0; color: #856404;">${d.title}</h4>
        <p style="margin: 0; color: #856404; line-height: 1.6;">${d.text}</p>
      </div>
    `;
  }).join('');

  // Inject before closing footer tag
  const footerEnd = html.indexOf('</footer>');
  if (footerEnd !== -1) {
    const disclaimerSection = `
      <section class="disclaimer-section" style="background: white; border-radius: 12px; padding: 30px; margin: 30px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #667eea; margin-bottom: 20px; font-size: 1.8em;">⚠️ Legal & Medical Disclaimers</h2>
        ${disclaimerHTML}
        <div style="margin-top: 20px; padding: 15px; background: #d1ecf1; border-left: 4px solid #0c5460; border-radius: 4px;">
          <p style="margin: 0; color: #0c5460; font-weight: 600;">
            <strong>Emergency:</strong> If you are experiencing a medical or mental health emergency, 
            please contact your local emergency services immediately or call 911.
          </p>
        </div>
      </section>
    `;
    return html.slice(0, footerEnd) + disclaimerSection + html.slice(footerEnd);
  }
  
  return html;
}

// Add compliance status to HTML
function addComplianceStatus(html, complianceStatus) {
  const statusHTML = `
    <div id="compliance-status" style="background: ${complianceStatus.compliant ? '#d4edda' : '#f8d7da'}; 
         border-left: 4px solid ${complianceStatus.compliant ? '#28a745' : '#dc3545'}; 
         padding: 15px; margin: 20px 0; border-radius: 4px;">
      <strong>Compliance Status:</strong> 
      <span style="color: ${complianceStatus.compliant ? '#155724' : '#721c24'}; font-weight: 600;">
        ${complianceStatus.compliant ? '✅ COMPLIANT' : '⚠️ ISSUES FOUND'}
      </span>
      ${complianceStatus.blockers?.length > 0 ? `
        <div style="margin-top: 10px;">
          <strong>Blockers:</strong> ${complianceStatus.blockers.length}
        </div>
      ` : ''}
      ${complianceStatus.warnings?.length > 0 ? `
        <div style="margin-top: 5px;">
          <strong>Warnings:</strong> ${complianceStatus.warnings.length}
        </div>
      ` : ''}
    </div>
  `;

  // Inject after header
  const headerEnd = html.indexOf('</header>');
  if (headerEnd !== -1) {
    return html.slice(0, headerEnd) + statusHTML + html.slice(headerEnd);
  }
  
  return html;
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = parseUrl(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // API endpoint for compliance checking
  if (pathname === '/api/compliance/check' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const content = JSON.parse(body);
        const region = query.region || 'US';
        
        const result = await complianceMiddleware.processContent(content, region);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result, null, 2));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // API endpoint for compliance status
  if (pathname === '/api/compliance/status' && req.method === 'GET') {
    const region = query.region || 'US';
    
    // Create sample content for testing
    const disclaimers = loadDisclaimers(region);
    const sampleContent = {
      text: 'Sample content for compliance checking',
      disclaimers: disclaimers.map(d => ({ id: d.id || '', text: d.text || '' }))
    };
    
    try {
      const result = await complianceMiddleware.processContent(sampleContent, region);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        compliant: result.compliant,
        blockers: result.blockers || [],
        warnings: result.warnings || [],
        region: region
      }, null, 2));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // Serve static files
  let filePath;
  
  if (pathname === '/' || pathname === '/index.html') {
    filePath = path.join(__dirname, 'index-integrated.html');
  } else {
    const relativePath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    filePath = path.join(__dirname, relativePath);
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, async (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, 'utf-8');
      }
    } else {
      // If HTML, process it with compliance systems
      if (extname === '.html') {
        let htmlContent = content.toString();
        const region = query.region || 'US';
        
        // Check compliance for the page content
        const disclaimers = loadDisclaimers(region);
        const pageContent = {
          text: htmlContent.substring(0, 1000), // Limit text for checking (HTML can be large)
          disclaimers: disclaimers.map(d => ({ id: d.id || '', text: d.text || '' }))
        };
        
        try {
          const complianceResult = await complianceMiddleware.processContent(pageContent, region);
          
          // Inject disclaimers
          htmlContent = injectDisclaimers(htmlContent, region);
          
          // Add compliance status
          htmlContent = addComplianceStatus(htmlContent, {
            compliant: complianceResult.compliant,
            blockers: complianceResult.blockers,
            warnings: complianceResult.warnings
          });
          
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(htmlContent, 'utf-8');
        } catch (error) {
          logger.error(`Error processing HTML: ${error.message}`);
          // Serve original content if processing fails
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    }
  });
});

server.listen(PORT, () => {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 Integrated Sandbox Preview Server');
  console.log('   All Compliance Systems Active');
  console.log('='.repeat(70) + '\n');
  console.log(`✅ Server running at:`);
  console.log(`   http://localhost:${PORT}\n`);
  console.log('🌐 Open this URL in your browser to view the preview');
  console.log('📋 API Endpoints:');
  console.log(`   GET  http://localhost:${PORT}/api/compliance/status?region=US`);
  console.log(`   POST http://localhost:${PORT}/api/compliance/check?region=US`);
  console.log('\n   Press Ctrl+C to stop the server\n');
  
  // Log compliance middleware status
  logger.info('Compliance middleware enabled:', complianceMiddleware.enabled !== false);
  logger.info('Strict mode:', complianceMiddleware.strictMode === true);
});

