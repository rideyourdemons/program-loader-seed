/**
 * Build Canonical Tools Registry
 * 
 * Consolidates all tool data sources into a single authoritative list:
 * 1. public/data/tools.json (base tools with full schema)
 * 2. public/store/tools.canonical.json (raw crawl from live site)
 * 3. public/store/tools.filtered.json (filtered ethical tools)
 * 
 * Output: public/data/tools-canonical.json
 * Schema: Minimal canonical format with source references
 */

const fs = require('fs');
const path = require('path');

const BASE_TOOLS_FILE = path.join(__dirname, '..', 'public', 'data', 'tools.json');
const CANONICAL_RAW_FILE = path.join(__dirname, '..', 'public', 'store', 'tools.canonical.json');
const FILTERED_TOOLS_FILE = path.join(__dirname, '..', 'public', 'store', 'tools.filtered.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'data', 'tools-canonical.json');

function normalizeId(tool) {
  return tool.id || tool.slug || null;
}

function normalizeSlug(tool) {
  return tool.slug || tool.id || null;
}

function buildCanonical() {
  console.log('[BUILD] Building canonical tools registry...\n');
  
  const canonical = {
    version: '1.0',
    generated: new Date().toISOString(),
    sources: {
      base: 'public/data/tools.json',
      canonicalRaw: 'public/store/tools.canonical.json',
      filtered: 'public/store/tools.filtered.json'
    },
    tools: []
  };
  
  const toolMap = new Map(); // id -> tool object
  const sourceCounts = {
    base: 0,
    canonicalRaw: 0,
    filtered: 0,
    duplicates: 0
  };
  
  // 1. Load base tools (richest schema, highest priority)
  if (fs.existsSync(BASE_TOOLS_FILE)) {
    console.log('[BUILD] Loading base tools from public/data/tools.json...');
    const baseData = JSON.parse(fs.readFileSync(BASE_TOOLS_FILE, 'utf8'));
    const baseTools = baseData.tools || [];
    
    for (const tool of baseTools) {
      const id = normalizeId(tool);
      if (!id) {
        console.warn(`[BUILD] Skipping tool without id/slug:`, tool);
        continue;
      }
      
      if (toolMap.has(id)) {
        sourceCounts.duplicates++;
        console.warn(`[BUILD] Duplicate tool ID in base: ${id}`);
        continue;
      }
      
      // Create canonical entry from base tool
      const canonicalTool = {
        id: id,
        slug: normalizeSlug(tool),
        title: tool.title || tool.name || id,
        description: tool.description || tool.summary || '',
        source: 'base',
        sourceFile: 'public/data/tools.json',
        // Rich schema fields (preserve if present)
        duration: tool.duration || null,
        difficulty: tool.difficulty || null,
        category: tool.category || null,
        summary: tool.summary || null,
        cta: tool.cta || null,
        gateIds: tool.gateIds || [],
        painPointIds: tool.painPointIds || [],
        keywords: tool.keywords || [],
        walkthroughs: tool.walkthroughs || null,
        howWhyWorks: tool.howWhyWorks || null,
        citations: tool.citations || null,
        url: tool.url || null
      };
      
      toolMap.set(id, canonicalTool);
      sourceCounts.base++;
    }
    
    console.log(`[BUILD] Loaded ${sourceCounts.base} base tools\n`);
  } else {
    console.warn('[BUILD] Base tools file not found:', BASE_TOOLS_FILE);
  }
  
  // 2. Load filtered tools (merge if not in base)
  if (fs.existsSync(FILTERED_TOOLS_FILE)) {
    console.log('[BUILD] Loading filtered tools from public/store/tools.filtered.json...');
    const filteredTools = JSON.parse(fs.readFileSync(FILTERED_TOOLS_FILE, 'utf8'));
    
    for (const tool of filteredTools) {
      const id = normalizeId(tool);
      if (!id) continue;
      
      if (toolMap.has(id)) {
        // Already in base, skip
        continue;
      }
      
      const canonicalTool = {
        id: id,
        slug: normalizeSlug(tool),
        title: tool.title || id,
        description: tool.description || '',
        source: 'filtered',
        sourceFile: 'public/store/tools.filtered.json',
        url: tool.url || null,
        // Minimal schema for filtered tools
        duration: null,
        difficulty: null,
        category: null,
        summary: null,
        cta: null,
        gateIds: [],
        painPointIds: [],
        keywords: [],
        walkthroughs: null,
        howWhyWorks: null,
        citations: null
      };
      
      toolMap.set(id, canonicalTool);
      sourceCounts.filtered++;
    }
    
    console.log(`[BUILD] Added ${sourceCounts.filtered} filtered tools (not in base)\n`);
  } else {
    console.warn('[BUILD] Filtered tools file not found:', FILTERED_TOOLS_FILE);
  }
  
  // 3. Load canonical raw (merge if not in base or filtered)
  if (fs.existsSync(CANONICAL_RAW_FILE)) {
    console.log('[BUILD] Loading canonical raw tools from public/store/tools.canonical.json...');
    const canonicalRaw = JSON.parse(fs.readFileSync(CANONICAL_RAW_FILE, 'utf8'));
    
    for (const tool of canonicalRaw) {
      const id = normalizeId(tool);
      if (!id) continue;
      
      if (toolMap.has(id)) {
        // Already in base or filtered, skip
        continue;
      }
      
      const canonicalTool = {
        id: id,
        slug: normalizeSlug(tool),
        title: tool.title || id,
        description: tool.description || '',
        source: 'canonical-raw',
        sourceFile: 'public/store/tools.canonical.json',
        url: tool.url || null,
        // Minimal schema for raw tools
        duration: null,
        difficulty: null,
        category: null,
        summary: null,
        cta: null,
        gateIds: [],
        painPointIds: [],
        keywords: [],
        walkthroughs: null,
        howWhyWorks: null,
        citations: null
      };
      
      toolMap.set(id, canonicalTool);
      sourceCounts.canonicalRaw++;
    }
    
    console.log(`[BUILD] Added ${sourceCounts.canonicalRaw} canonical raw tools (not in base/filtered)\n`);
  } else {
    console.warn('[BUILD] Canonical raw file not found:', CANONICAL_RAW_FILE);
  }
  
  // Convert map to sorted array
  canonical.tools = Array.from(toolMap.values()).sort((a, b) => {
    return a.id.localeCompare(b.id);
  });
  
  // Add summary stats
  canonical.stats = {
    total: canonical.tools.length,
    bySource: sourceCounts,
    withWalkthroughs: canonical.tools.filter(t => t.walkthroughs && t.walkthroughs.length > 0).length,
    withGateIds: canonical.tools.filter(t => t.gateIds && t.gateIds.length > 0).length,
    withPainPointIds: canonical.tools.filter(t => t.painPointIds && t.painPointIds.length > 0).length,
    withCitations: canonical.tools.filter(t => t.citations && t.citations.length > 0).length
  };
  
  // Write output
  console.log('[BUILD] Writing canonical tools to public/data/tools-canonical.json...');
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(canonical, null, 2), 'utf8');
  
  // Print summary
  console.log('\n===== CANONICAL TOOLS BUILD COMPLETE =====');
  console.log(`Total tools: ${canonical.stats.total}`);
  console.log(`  - From base: ${sourceCounts.base}`);
  console.log(`  - From filtered: ${sourceCounts.filtered}`);
  console.log(`  - From canonical raw: ${sourceCounts.canonicalRaw}`);
  console.log(`  - Duplicates skipped: ${sourceCounts.duplicates}`);
  console.log(`\nRich schema coverage:`);
  console.log(`  - With walkthroughs: ${canonical.stats.withWalkthroughs}`);
  console.log(`  - With gateIds: ${canonical.stats.withGateIds}`);
  console.log(`  - With painPointIds: ${canonical.stats.withPainPointIds}`);
  console.log(`  - With citations: ${canonical.stats.withCitations}`);
  console.log(`\nOutput: ${OUTPUT_FILE}`);
  console.log('==========================================\n');
  
  return canonical;
}

// Run if called directly
if (require.main === module) {
  try {
    buildCanonical();
  } catch (error) {
    console.error('[BUILD] Error building canonical tools:', error);
    process.exit(1);
  }
}

module.exports = { buildCanonical };

