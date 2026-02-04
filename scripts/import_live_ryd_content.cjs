#!/usr/bin/env node
/**
 * scripts/import_live_ryd_content.cjs
 * 
 * Extracts tool content from live RYD site.
 * NO INVENTION - only extracts what exists.
 * Flags missing sections instead of fabricating.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const LIVE_SITE_URL = process.env.RYD_LIVE_URL || 'https://rideyourdemons.com';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'data');
const RAW_DIR = path.join(process.cwd(), 'imports', 'raw');

// Ensure directories exist
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(RAW_DIR, { recursive: true });

function log(msg) {
  console.log(`✅ ${msg}`);
}

function warn(msg) {
  console.log(`⚠️  ${msg}`);
}

function error(msg) {
  console.error(`❌ ${msg}`);
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
        } else {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

function extractText(html, selector) {
  // Simple regex-based extraction (for production, use proper HTML parser)
  // This is a placeholder - actual implementation needs proper HTML parsing
  const regex = new RegExp(`<[^>]*class=["'][^"']*${selector}[^"']*["'][^>]*>([\\s\\S]*?)</[^>]+>`, 'i');
  const match = html.match(regex);
  return match ? match[1].replace(/<[^>]+>/g, '').trim() : null;
}

function extractCitations(html) {
  // Extract citation links and metadata
  const citations = [];
  const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    const title = match[2].trim();
    if (url.includes('doi.org') || url.includes('pubmed') || url.includes('research') || url.includes('study')) {
      citations.push({
        title: title || 'Research Reference',
        url: url,
        publisher: null, // Would need to extract from page
        year: null // Would need to extract from page
      });
    }
  }
  return citations;
}

async function extractToolContent(slug, url) {
  try {
    log(`Fetching ${url}`);
    const html = await fetchUrl(url);
    
    // Save raw HTML
    fs.writeFileSync(path.join(RAW_DIR, `${slug}.html`), html, 'utf8');
    
    // Extract sections (using placeholder selectors - adjust based on actual site structure)
    const title = extractText(html, 'tool-title') || extractText(html, 'h1') || null;
    const description = extractText(html, 'tool-description') || extractText(html, 'description') || null;
    const howWhyWorks = extractText(html, 'how-why-works') || extractText(html, 'how-it-works') || null;
    const whereItCameFrom = extractText(html, 'where-it-came-from') || extractText(html, 'source') || null;
    const steps = extractText(html, 'steps') || extractText(html, 'workthrough') || null;
    const citations = extractCitations(html);
    
    // Determine methodology type
    let methodologyType = 'lived-experience';
    if (citations.length > 0) {
      methodologyType = 'research';
    } else if (whereItCameFrom && (whereItCameFrom.includes('adapted') || whereItCameFrom.includes('framework'))) {
      methodologyType = 'adapted-framework';
    }
    
    const tool = {
      slug,
      title: title || `[MISSING TITLE: ${slug}]`,
      description: description || null,
      howWhyWorks: howWhyWorks || null,
      whereItCameFrom: whereItCameFrom || null,
      steps: steps || null,
      citations: citations.length > 0 ? citations : null,
      methodologyType,
      sourceUrl: url,
      flags: []
    };
    
    // Flag missing required sections
    if (!description) tool.flags.push('missing-description');
    if (!howWhyWorks) tool.flags.push('missing-how-why-works');
    if (!whereItCameFrom && methodologyType !== 'lived-experience') tool.flags.push('missing-source');
    if (citations.length === 0 && methodologyType === 'research') tool.flags.push('missing-citations');
    
    return tool;
  } catch (err) {
    error(`Failed to extract ${slug}: ${err.message}`);
    return {
      slug,
      title: `[EXTRACTION FAILED: ${slug}]`,
      description: null,
      howWhyWorks: null,
      whereItCameFrom: null,
      steps: null,
      citations: null,
      methodologyType: 'unknown',
      sourceUrl: url,
      flags: ['extraction-failed'],
      error: err.message
    };
  }
}

async function main() {
  log('Starting content extraction from live RYD site');
  log(`Live site URL: ${LIVE_SITE_URL}`);
  warn('NOTE: This script requires the live site to be accessible.');
  warn('If the site structure is unknown, you must manually provide tool URLs.');
  
  // For now, use existing tools from /data/tools.json as starting point
  const toolsPath = path.join(process.cwd(), 'public', 'data', 'tools.json');
  if (!fs.existsSync(toolsPath)) {
    error('/data/tools.json not found. Cannot extract tool list.');
    process.exit(1);
  }
  
  const toolsJson = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));
  const tools = toolsJson.tools || [];
  
  if (tools.length === 0) {
    warn('No tools found in /data/tools.json. Using placeholder structure.');
    warn('You must manually provide tool URLs or update /data/tools.json first.');
    
    // Create minimal structure
    const output = {
      version: '1.0',
      generated: new Date().toISOString(),
      source: LIVE_SITE_URL,
      tools: [],
      note: 'No tools extracted. Update /data/tools.json with tool slugs and URLs, then re-run.'
    };
    
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'tools.truth.json'),
      JSON.stringify(output, null, 2),
      'utf8'
    );
    
    log('Created placeholder tools.truth.json');
    log('Next: Update /data/tools.json with tool data, then re-run this script.');
    return;
  }
  
  log(`Found ${tools.length} tools in matrix. Extracting content...`);
  
  const extractedTools = [];
  for (const tool of tools) {
    const slug = tool.id || tool.slug || tool.title.toLowerCase().replace(/\s+/g, '-');
    const url = tool.url || `${LIVE_SITE_URL}/tools/${slug}`;
    
    const extracted = await extractToolContent(slug, url);
    extractedTools.push(extracted);
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const output = {
    version: '1.0',
    generated: new Date().toISOString(),
    source: LIVE_SITE_URL,
    tools: extractedTools,
    stats: {
      total: extractedTools.length,
      withDescription: extractedTools.filter(t => t.description).length,
      withHowWhyWorks: extractedTools.filter(t => t.howWhyWorks).length,
      withCitations: extractedTools.filter(t => t.citations && t.citations.length > 0).length,
      flagged: extractedTools.filter(t => t.flags && t.flags.length > 0).length
    }
  };
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'tools.truth.json'),
    JSON.stringify(output, null, 2),
    'utf8'
  );
  
  log(`\n✅ Extraction complete:`);
  log(`   Total tools: ${output.stats.total}`);
  log(`   With description: ${output.stats.withDescription}`);
  log(`   With how/why works: ${output.stats.withHowWhyWorks}`);
  log(`   With citations: ${output.stats.withCitations}`);
  log(`   Flagged issues: ${output.stats.flagged}`);
  
  if (output.stats.flagged > 0) {
    warn('\n⚠️  Some tools have missing sections. Review tools.truth.json flags.');
  }
}

main().catch(err => {
  error(err.stack || err.message);
  process.exit(1);
});

