#!/usr/bin/env node

/**
 * Complete Integrated Sandbox Server - ALL ENGINES ACTIVE
 * Includes: Compliance, Tool Rotation, Matrix Engine, Authority Engine, AI Tour Guide
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

// Handle exports (can be class or instance)
const ToolRotation = toolRotationModule.ToolRotation || toolRotationModule.default?.constructor || toolRotationModule;
const toolRotation = toolRotationModule.default || toolRotationModule;
const aiTourGuide = aiTourGuideModule.default || aiTourGuideModule;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3001;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json'
};

// Initialize all engines
// Tool rotation is already an instance
let matrixEngine = null;
let authorityEngine = null;

// Mock Firebase backend for engines that need it
const mockFirebaseBackend = {
  readDocument: async (path) => ({ data: {}, id: 'mock' }),
  readCollection: async (path) => [],
  writeDocument: async (path, data) => ({ success: true })
};

try {
  matrixEngine = new MatrixEngine(mockFirebaseBackend);
  authorityEngine = new AuthorityEngine(mockFirebaseBackend);
  logger.info('All engines initialized successfully');
} catch (error) {
  logger.warn(`Some engines failed to initialize: ${error.message}`);
}

// Check RYD Site integration status
const POSSIBLE_RYD_PATHS = [
  process.env.RYD_SITE_PATH, // Environment variable takes priority
  process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Documents', 'Site') : null,
  process.env.HOME ? path.join(process.env.HOME, 'Documents', 'Site') : null,
].filter(Boolean); // Remove null/undefined values

let RYD_SITE_PATH = null;
for (const possiblePath of POSSIBLE_RYD_PATHS) {
  if (fs.existsSync(possiblePath)) {
    RYD_SITE_PATH = possiblePath;
    break;
  }
}

function checkRYDSiteEngines() {
  if (!RYD_SITE_PATH) {
    return {
      exists: false,
      path: null,
      sitePath: null,
      error: 'RYD Site path not found'
    };
  }
  
  const utilsPath = path.join(RYD_SITE_PATH, 'js', 'utils');
  const enginesExist = fs.existsSync(path.join(utilsPath, 'tool-rotation.js'));
  return {
    exists: enginesExist,
    path: utilsPath,
    sitePath: RYD_SITE_PATH,
    error: null
  };
}

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

// Inject engine status into HTML
function addEngineStatus(html) {
  const statusHTML = `
    <div id="engine-status" style="background: #e7f3ff; border-left: 4px solid #2196F3; 
         padding: 15px; margin: 20px 0; border-radius: 4px;">
      <strong>🔧 Engine Status:</strong>
      <div style="margin-top: 10px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
        <div>✅ Compliance Middleware: <strong>ACTIVE</strong></div>
        <div>✅ Tool Rotation: <strong>ACTIVE</strong></div>
        <div>${matrixEngine ? '✅' : '⚠️'} Matrix Engine: <strong>${matrixEngine ? 'ACTIVE' : 'MOCK'}</strong></div>
        <div>${authorityEngine ? '✅' : '⚠️'} Authority Engine: <strong>${authorityEngine ? 'ACTIVE' : 'MOCK'}</strong></div>
        <div>${aiTourGuide ? '✅' : '⚠️'} AI Tour Guide: <strong>${aiTourGuide ? 'ACTIVE' : 'MOCK'}</strong></div>
      </div>
    </div>
  `;

  const headerEnd = html.indexOf('</header>');
  if (headerEnd !== -1) {
    return html.slice(0, headerEnd) + statusHTML + html.slice(headerEnd);
  }
  
  return html;
}

// Inject disclaimers into HTML
function injectDisclaimers(html, region = 'US') {
  const disclaimers = loadDisclaimers(region);
  
  if (disclaimers.length === 0) {
    return html;
  }
  
  const disclaimerHTML = disclaimers.map(d => {
    return `
      <div class="disclaimer-item" style="margin-bottom: 15px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
        <h4 style="margin: 0 0 8px 0; color: #856404;">${d.title || 'Disclaimer'}</h4>
        <p style="margin: 0; color: #856404; line-height: 1.6;">${d.text || ''}</p>
      </div>
    `;
  }).join('');

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
  const regionInfo = complianceStatus.region ? `<div style="margin-top: 8px;"><strong>Region:</strong> ${complianceStatus.region}</div>` : '';
  const languageInfo = complianceStatus.language ? `<div style="margin-top: 5px;"><strong>Language:</strong> ${complianceStatus.language}</div>` : '';
  const culturalInfo = complianceStatus.culturalAdaptations ? `
    <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 4px;">
      <strong>Cultural Adaptations:</strong>
      <div style="margin-top: 5px; font-size: 0.9em;">
        <div><strong>Communication Style:</strong> ${complianceStatus.culturalAdaptations.communicationStyle || 'N/A'}</div>
        <div><strong>Formality Level:</strong> ${complianceStatus.culturalAdaptations.formalityLevel || 'N/A'}</div>
        ${complianceStatus.culturalAdaptations.rtl ? '<div><strong>Text Direction:</strong> Right-to-Left (RTL)</div>' : ''}
      </div>
    </div>
  ` : '';
  
  const statusHTML = `
    <div id="compliance-status" style="background: ${complianceStatus.compliant ? '#d4edda' : '#f8d7da'}; 
         border-left: 4px solid ${complianceStatus.compliant ? '#28a745' : '#dc3545'}; 
         padding: 15px; margin: 20px 0; border-radius: 4px;">
      <strong>🔒 Compliance Status:</strong> 
      <span style="color: ${complianceStatus.compliant ? '#155724' : '#721c24'}; font-weight: 600;">
        ${complianceStatus.compliant ? '✅ COMPLIANT' : '⚠️ ISSUES FOUND'}
      </span>
      ${regionInfo}
      ${languageInfo}
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
      ${culturalInfo}
    </div>
  `;

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

  // API endpoint for RYD Site status
  if (pathname === '/api/ryd-site/status' && req.method === 'GET') {
    const siteStatus = checkRYDSiteEngines();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(siteStatus, null, 2));
    return;
  }

  // API endpoint for tool rotation
  if (pathname === '/api/tool-rotation' && req.method === 'GET') {
    const tools = JSON.parse(query.tools || '[]');
    const date = query.date ? new Date(query.date) : new Date();
    
    try {
      const tool = toolRotation.getToolOfTheDay(tools, date);
      const schedule = toolRotation.getRotationSchedule(tools, 7);
      const nextRotation = toolRotation.getNextRotationInfo ? toolRotation.getNextRotationInfo() : { formatted: '24h 0m' };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        tool,
        schedule,
        nextRotation
      }, null, 2));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // API endpoint for matrix engine
  if (pathname === '/api/matrix/calculate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    
    req.on('end', async () => {
      try {
        const { text } = JSON.parse(body);
        if (!matrixEngine) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Matrix engine not available' }));
          return;
        }
        
        const numerologicalValue = matrixEngine.calculateNumerologicalValue(text);
        const resonance = matrixEngine.calculateResonance(numerologicalValue, numerologicalValue);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          numerologicalValue,
          resonance,
          text
        }, null, 2));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // API endpoint for authority engine
  if (pathname === '/api/authority/score' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    
    req.on('end', async () => {
      try {
        const { painPointId } = JSON.parse(body);
        if (!authorityEngine) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Authority engine not available' }));
          return;
        }
        
        // Mock score since we don't have real Firebase data
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          painPointId,
          authorityScore: 75,
          message: 'Mock score - Firebase connection required for real scores'
        }, null, 2));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // API endpoint for AI Tour Guide
  if (pathname === '/api/tour' && req.method === 'GET') {
    try {
      if (!aiTourGuide) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'AI Tour Guide not available' }));
        return;
      }
      
      const action = query.action || 'status';
      let result;
      
      if (!aiTourGuide) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'AI Tour Guide not available' }));
        return;
      }
      
      switch (action) {
        case 'start':
          if (aiTourGuide.start) aiTourGuide.start();
          result = aiTourGuide.getCurrentStepData ? aiTourGuide.getCurrentStepData() : {};
          break;
        case 'next':
          if (aiTourGuide.next) aiTourGuide.next();
          result = aiTourGuide.getCurrentStepData ? aiTourGuide.getCurrentStepData() : {};
          break;
        case 'previous':
          if (aiTourGuide.previous) aiTourGuide.previous();
          result = aiTourGuide.getCurrentStepData ? aiTourGuide.getCurrentStepData() : {};
          break;
        case 'status':
        default:
          result = {
            currentStep: aiTourGuide.getCurrentStep ? aiTourGuide.getCurrentStep() : 0,
            totalSteps: aiTourGuide.getTotalSteps ? aiTourGuide.getTotalSteps() : 7,
            stepData: aiTourGuide.getCurrentStepData ? aiTourGuide.getCurrentStepData() : {},
            isCompleted: aiTourGuide.isCompleted ? aiTourGuide.isCompleted() : false
          };
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result, null, 2));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // API endpoint for compliance checking
  if (pathname === '/api/compliance/check' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    
    req.on('end', async () => {
      try {
        const content = JSON.parse(body);
        const region = query.region || null; // null = auto-detect
        const language = query.language || null; // null = auto-detect
        const urlRegion = query.region || null;
        const urlLanguage = query.language || null;
        
        // Pass request object for automatic detection
        const result = await complianceMiddleware.processContent(content, region, language, {
          request: req,
          urlRegion: urlRegion,
          urlLanguage: urlLanguage
        });
        
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
    const region = query.region || null; // null = auto-detect
    const language = query.language || null; // null = auto-detect
    const urlRegion = query.region || null;
    const urlLanguage = query.language || null;
    
    // Use detected region for disclaimers, or fallback to US
    const regionForDisclaimers = region || 'US';
    const disclaimers = loadDisclaimers(regionForDisclaimers);
    const sampleContent = {
      text: 'Sample content for compliance checking',
      disclaimers: disclaimers.map(d => ({ id: d.id || '', text: d.text || '' }))
    };
    
    try {
      // Pass request object for automatic detection
      const result = await complianceMiddleware.processContent(sampleContent, region, language, {
        request: req,
        urlRegion: urlRegion,
        urlLanguage: urlLanguage
      });
      
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
    filePath = path.join(__dirname, 'index-all-engines.html');
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
      // If HTML, process it with all systems
      if (extname === '.html') {
        let htmlContent = content.toString();
        const region = query.region || null; // null = auto-detect
        const language = query.language || null; // null = auto-detect
        const urlRegion = query.region || null;
        const urlLanguage = query.language || null;
        
        // Check compliance for the page content (with auto-detection)
        const regionForDisclaimers = region || 'US'; // Use detected or fallback
        const disclaimers = loadDisclaimers(regionForDisclaimers);
        const pageContent = {
          text: htmlContent.substring(0, 1000),
          disclaimers: disclaimers.map(d => ({ id: d.id || '', text: d.text || '' }))
        };
        
        try {
          // Use auto-detection for region and language
          const complianceResult = await complianceMiddleware.processContent(pageContent, region, language, {
            request: req,
            urlRegion: urlRegion,
            urlLanguage: urlLanguage
          });
          
          // Use detected region (from result) or fallback
          const detectedRegion = complianceResult.region || regionForDisclaimers;
          
          // Inject all systems
          htmlContent = injectDisclaimers(htmlContent, detectedRegion);
          htmlContent = addComplianceStatus(htmlContent, {
            compliant: complianceResult.compliant,
            blockers: complianceResult.blockers,
            warnings: complianceResult.warnings,
            region: detectedRegion,
            language: complianceResult.language,
            culturalAdaptations: complianceResult.culturalAdaptations
          });
          htmlContent = addEngineStatus(htmlContent);
          
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(htmlContent, 'utf-8');
        } catch (error) {
          logger.error(`Error processing HTML: ${error.message}`);
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
  console.log('🚀 ALL ENGINES ACTIVE - Integrated Sandbox Server');
  console.log('='.repeat(70) + '\n');
  console.log(`✅ Server running at: http://localhost:${PORT}\n`);
  console.log('🔧 Engines Status:');
  console.log(`   ✅ Compliance Middleware: ACTIVE`);
  console.log(`   ✅ Tool Rotation: ACTIVE`);
  console.log(`   ${matrixEngine ? '✅' : '⚠️'}  Matrix Engine: ${matrixEngine ? 'ACTIVE' : 'MOCK'}`);
  console.log(`   ${authorityEngine ? '✅' : '⚠️'}  Authority Engine: ${authorityEngine ? 'ACTIVE' : 'MOCK'}`);
  console.log(`   ${aiTourGuide ? '✅' : '⚠️'}  AI Tour Guide: ${aiTourGuide ? 'ACTIVE' : 'MOCK'}`);
  console.log('\n📋 API Endpoints:');
  console.log(`   GET  http://localhost:${PORT}/api/tool-rotation`);
  console.log(`   POST http://localhost:${PORT}/api/matrix/calculate`);
  console.log(`   POST http://localhost:${PORT}/api/authority/score`);
  console.log(`   GET  http://localhost:${PORT}/api/tour?action=start`);
  console.log(`   GET  http://localhost:${PORT}/api/compliance/status?region=US`);
  console.log(`   POST http://localhost:${PORT}/api/compliance/check?region=US`);
  console.log('\n   Press Ctrl+C to stop the server\n');
  
  logger.info('All engines initialized and server ready');
});

