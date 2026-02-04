/**
 * RYD Live Site Tool Crawler
 * Crawls https://rideyourdemons.com to extract canonical tool registry
 * TRUTH ONLY: Only extracts what exists, no invention
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const LIVE_SITE = 'https://rideyourdemons.com';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'store');
const REPORT_DIR = path.join(__dirname);
const CANONICAL_FILE = path.join(OUTPUT_DIR, 'tools.canonical.json');
const REPORT_FILE = path.join(REPORT_DIR, 'tools-crawl-report.json');

// Configuration
const CONCURRENCY = 3;
const DELAY_MS = 150;
const MAX_RETRIES = 2;

// State
const stats = {
  sitemapUrls: 0,
  toolUrlsKept: 0,
  extracted: 0,
  failed: 0,
  deduped: 0,
  skipped: 0
};

const failures = [];
const skipped = [];
const tools = new Map(); // id -> tool (for deduplication)

/**
 * Fetch URL with retries
 */
function fetchUrl(url, retries = MAX_RETRIES) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'RYD-Tool-Crawler/1.0 (Node.js)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 10000
    };
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        } else if (res.statusCode === 429 || res.statusCode >= 500) {
          // Retry on rate limit or server error
          if (retries > 0) {
            const backoff = Math.pow(2, MAX_RETRIES - retries) * 1000;
            console.log(`[RETRY] ${url} - waiting ${backoff}ms (${retries} retries left)`);
            setTimeout(() => {
              fetchUrl(url, retries - 1).then(resolve).catch(reject);
            }, backoff);
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (err) => {
      if (retries > 0) {
        const backoff = Math.pow(2, MAX_RETRIES - retries) * 1000;
        setTimeout(() => {
          fetchUrl(url, retries - 1).then(resolve).catch(reject);
        }, backoff);
      } else {
        reject(err);
      }
    });
    
    req.on('timeout', () => {
      req.destroy();
      if (retries > 0) {
        const backoff = Math.pow(2, MAX_RETRIES - retries) * 1000;
        setTimeout(() => {
          fetchUrl(url, retries - 1).then(resolve).catch(reject);
        }, backoff);
      } else {
        reject(new Error('Request timeout'));
      }
    });
    
    req.end();
  });
}

/**
 * Parse sitemap XML to extract URLs
 */
function parseSitemap(xml) {
  const urls = [];
  
  // Match <loc> tags
  const locRegex = /<loc>(.*?)<\/loc>/gi;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    urls.push(match[1].trim());
  }
  
  return urls;
}

/**
 * Check if URL is a sitemap index
 */
function isSitemapIndex(xml) {
  return xml.includes('<sitemapindex>') || xml.includes('<sitemap:');
}

/**
 * Check if URL should be kept (tool-like page)
 */
function shouldKeepUrl(url) {
  const urlLower = url.toLowerCase();
  
  // Exclude patterns
  const excludePatterns = [
    '/terms', '/privacy', '/about', '/contact', '/blog', '/store',
    '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg',
    '.css', '.js', '.xml', '.txt', '.pdf', '.zip',
    '/feed', '/rss', '/atom', '/sitemap'
  ];
  
  for (const pattern of excludePatterns) {
    if (urlLower.includes(pattern)) {
      return false;
    }
  }
  
  // Include patterns (only if they appear)
  const includePatterns = ['/tools/', '/insights/'];
  for (const pattern of includePatterns) {
    if (urlLower.includes(pattern)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Sanitize ID from URL slug
 */
function sanitizeId(url) {
  const urlObj = new URL(url);
  let slug = urlObj.pathname.split('/').filter(Boolean).pop() || 'index';
  
  // Remove query and hash
  slug = slug.split('?')[0].split('#')[0];
  
  // Sanitize: lowercase, replace non [a-z0-9-] with -, collapse dashes
  slug = slug.toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return slug || 'index';
}

/**
 * Extract tool data from HTML
 */
function extractToolData(html, url) {
  const tool = {
    id: sanitizeId(url),
    url: url,
    source: 'live-site-crawl'
  };
  
  // Extract canonical URL
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  if (canonicalMatch) {
    try {
      const canonicalUrl = new URL(canonicalMatch[1], url).href;
      tool.url = canonicalUrl;
    } catch (e) {
      // Keep original URL if canonical is invalid
    }
  }
  
  // Extract title from <h1>
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/is);
  if (h1Match) {
    tool.title = h1Match[1].replace(/<[^>]+>/g, '').trim();
  } else {
    // Fallback to <title>
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
    if (titleMatch) {
      tool.title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
    } else {
      tool.title = tool.id;
    }
  }
  
  // Extract meta description
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (metaDescMatch) {
    tool.description = metaDescMatch[1].trim();
  } else {
    // Fallback to first meaningful paragraph
    const pMatch = html.match(/<p[^>]*>(.*?)<\/p>/is);
    if (pMatch) {
      const pText = pMatch[1].replace(/<[^>]+>/g, '').trim();
      if (pText.length > 20) { // Meaningful length
        tool.description = pText.substring(0, 200); // Limit length
      } else {
        tool.description = '';
      }
    } else {
      tool.description = '';
    }
  }
  
  // Extract citations/references
  const citations = [];
  
  // Look for citations section (common patterns)
  const citationsSectionPatterns = [
    /<h[23][^>]*>.*?(?:citation|reference|source|attribution|research|study|studies).*?<\/h[23]>/is,
    /<section[^>]*class=["'][^"']*citation[^"']*["'][^>]*>/is,
    /<div[^>]*class=["'][^"']*citation[^"']*["'][^>]*>/is,
    /<div[^>]*class=["'][^"']*reference[^"']*["'][^>]*>/is
  ];
  
  let citationsHtml = '';
  for (const pattern of citationsSectionPatterns) {
    const match = html.match(new RegExp(pattern.source + '([\\s\\S]*?)(?:<h[23]|<section|<div[^>]*class|<\\/body|$)', 'i'));
    if (match && match[1]) {
      citationsHtml = match[1];
      break;
    }
  }
  
  // If no citations section found, look for <cite> tags or reference links throughout
  if (!citationsHtml) {
    // Try to find all <cite> tags
    const citeMatches = html.matchAll(/<cite[^>]*>(.*?)<\/cite>/gi);
    for (const citeMatch of citeMatches) {
      const citeText = citeMatch[1].replace(/<[^>]+>/g, '').trim();
      if (citeText) {
        citations.push({
          title: citeText,
          source: 'extracted from <cite> tag'
        });
      }
    }
    
    // Look for reference links (common patterns: "Source:", "Reference:", links to research)
    const refLinkPatterns = [
      /(?:source|reference|citation|study|research)[\s:]+<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi,
      /<a[^>]*href=["'](?:https?:\/\/)?(?:www\.)?(?:pubmed|scholar|researchgate|doi\.org|arxiv)[^"']*["'][^>]*>(.*?)<\/a>/gi
    ];
    
    for (const pattern of refLinkPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const url = match[1] || match[0].match(/href=["']([^"']+)["']/)?.[1];
        const text = (match[2] || match[1] || '').replace(/<[^>]+>/g, '').trim();
        if (text && url) {
          try {
            const fullUrl = new URL(url, url).href;
            citations.push({
              title: text || 'Research Reference',
              source: 'extracted from reference link',
              url: fullUrl
            });
          } catch (e) {
            // Invalid URL, skip
          }
        }
      }
    }
  } else {
    // Parse citations from citations section
    // Look for list items or links in citations section
    const listItems = citationsHtml.matchAll(/<li[^>]*>(.*?)<\/li>/gi);
    for (const liMatch of listItems) {
      const liText = liMatch[1].replace(/<[^>]+>/g, '').trim();
      const linkMatch = liMatch[1].match(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/i);
      
      if (linkMatch) {
        try {
          const fullUrl = new URL(linkMatch[1], url).href;
          citations.push({
            title: (linkMatch[2] || liText).replace(/<[^>]+>/g, '').trim() || 'Reference',
            source: 'extracted from citations section',
            url: fullUrl
          });
        } catch (e) {
          citations.push({
            title: liText || 'Reference',
            source: 'extracted from citations section'
          });
        }
      } else if (liText && liText.length > 10) {
        citations.push({
          title: liText,
          source: 'extracted from citations section'
        });
      }
    }
    
    // Also check for links in citations section
    const links = citationsHtml.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi);
    for (const linkMatch of links) {
      const linkUrl = linkMatch[1];
      const linkText = linkMatch[2].replace(/<[^>]+>/g, '').trim();
      
      if (linkText && linkUrl && !linkUrl.startsWith('#')) {
        try {
          const fullUrl = new URL(linkUrl, url).href;
          // Avoid duplicates
          if (!citations.find(c => c.url === fullUrl)) {
            citations.push({
              title: linkText || 'Reference',
              source: 'extracted from citations section',
              url: fullUrl
            });
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
    }
  }
  
  // Add citations if found
  if (citations.length > 0) {
    tool.citations = citations;
  }
  
  // Only add gate/pain point if explicitly in HTML (data attributes or visible labels)
  // For now, skip - would need more specific parsing rules
  
  return tool;
}

/**
 * Process a single URL
 */
async function processUrl(url, workerId) {
  await new Promise(resolve => setTimeout(resolve, DELAY_MS));
  
  try {
    console.log(`[Worker ${workerId}] Fetching: ${url}`);
    const response = await fetchUrl(url);
    
    if (!shouldKeepUrl(url)) {
      stats.skipped++;
      skipped.push({ url, reason: 'Does not match tool/insight pattern' });
      return null;
    }
    
    const tool = extractToolData(response.data, url);
    
    // Deduplicate by id
    if (tools.has(tool.id)) {
      stats.deduped++;
      console.log(`[Worker ${workerId}] Duplicate: ${tool.id} (skipping)`);
      return null;
    }
    
    tools.set(tool.id, tool);
    stats.extracted++;
    console.log(`[Worker ${workerId}] Extracted: ${tool.id} - ${tool.title}`);
    
    return tool;
  } catch (error) {
    stats.failed++;
    const failure = { url, status: error.message, error: error.toString() };
    failures.push(failure);
    console.error(`[Worker ${workerId}] Failed: ${url} - ${error.message}`);
    return null;
  }
}

/**
 * Worker pool processor
 */
async function processUrls(urls, concurrency = CONCURRENCY) {
  const queue = [...urls];
  const workers = [];
  
  for (let i = 0; i < concurrency; i++) {
    workers.push((async () => {
      while (queue.length > 0) {
        const url = queue.shift();
        if (url) {
          await processUrl(url, i + 1);
        }
      }
    })());
  }
  
  await Promise.all(workers);
}

/**
 * Main crawl function
 */
async function crawl() {
  console.log('[CRAWLER] Starting crawl of', LIVE_SITE);
  console.log('[CRAWLER] Output:', CANONICAL_FILE);
  
  try {
    // Step 1: Fetch sitemap
    console.log('[CRAWLER] Fetching sitemap...');
    const sitemapResponse = await fetchUrl(`${LIVE_SITE}/sitemap.xml`);
    stats.sitemapUrls = 1;
    
    let allUrls = [];
    
    // Check if it's a sitemap index
    if (isSitemapIndex(sitemapResponse.data)) {
      console.log('[CRAWLER] Detected sitemap index, fetching child sitemaps...');
      const sitemapUrls = parseSitemap(sitemapResponse.data);
      
      for (const sitemapUrl of sitemapUrls) {
        try {
          console.log(`[CRAWLER] Fetching child sitemap: ${sitemapUrl}`);
          const childResponse = await fetchUrl(sitemapUrl);
          const childUrls = parseSitemap(childResponse.data);
          allUrls.push(...childUrls);
          stats.sitemapUrls++;
        } catch (error) {
          console.error(`[CRAWLER] Failed to fetch child sitemap: ${sitemapUrl}`, error.message);
        }
      }
    } else {
      allUrls = parseSitemap(sitemapResponse.data);
    }
    
    console.log(`[CRAWLER] Found ${allUrls.length} URLs in sitemap(s)`);
    
    // Step 2: Filter to tool-like URLs
    const toolUrls = allUrls.filter(shouldKeepUrl);
    stats.toolUrlsKept = toolUrls.length;
    console.log(`[CRAWLER] Keeping ${toolUrls.length} tool-like URLs`);
    
    if (toolUrls.length === 0) {
      console.warn('[CRAWLER] No tool URLs found. Check sitemap structure.');
    }
    
    // Step 3: Process URLs with worker pool
    console.log(`[CRAWLER] Processing ${toolUrls.length} URLs with ${CONCURRENCY} workers...`);
    await processUrls(toolUrls);
    
    // Step 4: Write output
    const toolsArray = Array.from(tools.values());
    
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Write canonical file
    fs.writeFileSync(
      CANONICAL_FILE,
      JSON.stringify(toolsArray, null, 2),
      'utf8'
    );
    console.log(`[CRAWLER] Wrote ${toolsArray.length} tools to ${CANONICAL_FILE}`);
    
    // Write report
    const report = {
      timestamp: new Date().toISOString(),
      source: LIVE_SITE,
      totals: stats,
      failures: failures.slice(0, 100), // Limit to first 100 failures
      skipped: skipped.slice(0, 100) // Limit to first 100 skipped
    };
    
    fs.writeFileSync(
      REPORT_FILE,
      JSON.stringify(report, null, 2),
      'utf8'
    );
    console.log(`[CRAWLER] Wrote report to ${REPORT_FILE}`);
    
    // Final summary
    console.log('\n[CRAWLER] ===== FINAL SUMMARY =====');
    console.log(`Sitemap URLs processed: ${stats.sitemapUrls}`);
    console.log(`Tool URLs kept: ${stats.toolUrlsKept}`);
    console.log(`Tools extracted: ${stats.extracted}`);
    console.log(`Duplicates skipped: ${stats.deduped}`);
    console.log(`Failed: ${stats.failed}`);
    console.log(`Skipped (non-tool): ${stats.skipped}`);
    console.log(`\nCanonical file: ${CANONICAL_FILE}`);
    console.log(`Report file: ${REPORT_FILE}`);
    console.log('====================================\n');
    
    if (toolsArray.length > 0) {
      console.log('Example tool object:');
      console.log(JSON.stringify(toolsArray[0], null, 2));
    }
    
  } catch (error) {
    console.error('[CRAWLER] Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  crawl();
}

module.exports = { crawl };

