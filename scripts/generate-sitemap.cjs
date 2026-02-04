/**
 * Generate Sitemap XML
 * 
 * Creates sitemap.xml and sitemap-index.xml based on:
 * - Static HTML pages
 * - Dynamic tool pages (from tools-canonical.json)
 * - Gate and pain point pages
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://rideyourdemons.com';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const TOOLS_CANONICAL_FILE = path.join(PUBLIC_DIR, 'data', 'tools-canonical.json');
const GATES_MAPPING_FILE = path.join(PUBLIC_DIR, 'data', 'gates-painpoints-tools.json');
const SITEMAP_FILE = path.join(PUBLIC_DIR, 'sitemap.xml');
const SITEMAP_INDEX_FILE = path.join(PUBLIC_DIR, 'sitemap-index.xml');

// Priority and changefreq defaults
const PRIORITY = {
  home: '1.0',
  tools: '0.9',
  insights: '0.8',
  gates: '0.8',
  tool: '0.9',
  gate: '0.7',
  painPoint: '0.6',
  static: '0.7'
};

const CHANGEFREQ = {
  home: 'daily',
  tools: 'weekly',
  insights: 'weekly',
  gates: 'weekly',
  tool: 'monthly',
  gate: 'monthly',
  painPoint: 'monthly',
  static: 'monthly'
};

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

function generateSitemap() {
  console.log('[SITEMAP] Generating sitemap...\n');
  
  const urls = [];
  const now = new Date().toISOString().split('T')[0];
  
  // 1. Static pages
  const staticPages = [
    { path: '/', priority: PRIORITY.home, changefreq: CHANGEFREQ.home },
    { path: '/tools', priority: PRIORITY.tools, changefreq: CHANGEFREQ.tools },
    { path: '/insights', priority: PRIORITY.insights, changefreq: CHANGEFREQ.insights },
    { path: '/gates', priority: PRIORITY.gates, changefreq: CHANGEFREQ.gates },
    { path: '/about/', priority: PRIORITY.static, changefreq: CHANGEFREQ.static },
    { path: '/disclosures/', priority: PRIORITY.static, changefreq: CHANGEFREQ.static },
    { path: '/ethics/', priority: PRIORITY.static, changefreq: CHANGEFREQ.static },
    { path: '/analytics/', priority: PRIORITY.static, changefreq: CHANGEFREQ.static },
    { path: '/terms/', priority: PRIORITY.static, changefreq: CHANGEFREQ.static },
    { path: '/store/', priority: PRIORITY.static, changefreq: CHANGEFREQ.static }
  ];
  
  staticPages.forEach(page => {
    urls.push({
      loc: `${BASE_URL}${page.path}`,
      lastmod: now,
      changefreq: page.changefreq,
      priority: page.priority
    });
  });
  
  // 2. Tool pages (from canonical tools)
  if (fs.existsSync(TOOLS_CANONICAL_FILE)) {
    console.log('[SITEMAP] Loading tools from canonical file...');
    const toolsData = JSON.parse(fs.readFileSync(TOOLS_CANONICAL_FILE, 'utf8'));
    const tools = toolsData.tools || [];
    
    tools.forEach(tool => {
      const slug = tool.slug || tool.id;
      if (slug) {
        urls.push({
          loc: `${BASE_URL}/tools/${slug}`,
          lastmod: now,
          changefreq: CHANGEFREQ.tool,
          priority: PRIORITY.tool
        });
      }
    });
    
    console.log(`[SITEMAP] Added ${tools.length} tool pages`);
  }
  
  // 3. Gate and pain point pages (from mapping)
  if (fs.existsSync(GATES_MAPPING_FILE)) {
    console.log('[SITEMAP] Loading gates and pain points from mapping...');
    const mappingData = JSON.parse(fs.readFileSync(GATES_MAPPING_FILE, 'utf8'));
    const gates = mappingData.gates || [];
    
    gates.forEach(gate => {
      // Gate page
      urls.push({
        loc: `${BASE_URL}/gates/${gate.id}`,
        lastmod: now,
        changefreq: CHANGEFREQ.gate,
        priority: PRIORITY.gate
      });
      
      // Pain point pages
      gate.painPoints.forEach(painPoint => {
        urls.push({
          loc: `${BASE_URL}/gates/${gate.id}/${painPoint.id}`,
          lastmod: now,
          changefreq: CHANGEFREQ.painPoint,
          priority: PRIORITY.painPoint
        });
      });
    });
    
    console.log(`[SITEMAP] Added ${gates.length} gate pages and ${gates.reduce((sum, g) => sum + g.painPoints.length, 0)} pain point pages`);
  }
  
  // Generate sitemap.xml
  let sitemapXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemapXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  urls.forEach(url => {
    sitemapXml += '  <url>\n';
    sitemapXml += `    <loc>${escapeXml(url.loc)}</loc>\n`;
    sitemapXml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    sitemapXml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    sitemapXml += `    <priority>${url.priority}</priority>\n`;
    sitemapXml += '  </url>\n';
  });
  
  sitemapXml += '</urlset>\n';
  
  // Write sitemap.xml
  fs.writeFileSync(SITEMAP_FILE, sitemapXml, 'utf8');
  
  // Generate sitemap-index.xml (for future expansion)
  let sitemapIndexXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemapIndexXml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  sitemapIndexXml += '  <sitemap>\n';
  sitemapIndexXml += `    <loc>${BASE_URL}/sitemap.xml</loc>\n`;
  sitemapIndexXml += `    <lastmod>${now}</lastmod>\n`;
  sitemapIndexXml += '  </sitemap>\n';
  sitemapIndexXml += '</sitemapindex>\n';
  
  fs.writeFileSync(SITEMAP_INDEX_FILE, sitemapIndexXml, 'utf8');
  
  console.log('\n===== SITEMAP GENERATION COMPLETE =====');
  console.log(`Total URLs: ${urls.length}`);
  console.log(`Output: ${SITEMAP_FILE}`);
  console.log(`Index: ${SITEMAP_INDEX_FILE}`);
  console.log('========================================\n');
  
  return { urls, count: urls.length };
}

// Run if called directly
if (require.main === module) {
  try {
    generateSitemap();
  } catch (error) {
    console.error('[SITEMAP] Error generating sitemap:', error);
    process.exit(1);
  }
}

module.exports = { generateSitemap };

