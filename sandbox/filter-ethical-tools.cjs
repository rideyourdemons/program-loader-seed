/**
 * Filter Canonical Tools for Solid, Relevant, Ethical Tools
 * Extracts only tools that meet quality criteria for RYD platform
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '..', 'public', 'store', 'tools.canonical.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'store', 'tools.filtered.json');
const REPORT_FILE = path.join(__dirname, 'tools-filter-report.json');

// Quality criteria
function isSolidRelevantTool(tool) {
  // Must have required fields
  if (!tool.id || !tool.title || !tool.url) {
    return false;
  }
  
  // Title must be meaningful (not just ID)
  if (tool.title === tool.id || tool.title.length < 10) {
    return false;
  }
  
  // URL must be valid
  if (!tool.url || !tool.url.includes('rideyourdemons.com')) {
    return false;
  }
  
  // Exclude obvious non-tool pages
  const urlLower = tool.url.toLowerCase();
  const excludeUrlPatterns = [
    '/terms',
    '/privacy',
    '/about',
    '/contact',
    '/blog/',  // Note: /blog/ not /blog to allow blog posts if they exist
    '/store',
    '/members/',
    '/checkout',
    '/cart',
    '/login',
    '/signup',
    '/register'
  ];
  
  for (const pattern of excludeUrlPatterns) {
    if (urlLower.includes(pattern)) {
      return false;
    }
  }
  
  // Must be self-help/educational (check title primarily)
  const titleLower = tool.title.toLowerCase();
  const educationalKeywords = [
    'how do i',
    'how to',
    'how can i',
    'what if',
    'why do i',
    'when should i',
    'tool',
    'technique',
    'practice',
    'exercise',
    'method',
    'strategy',
    'guide',
    'workthrough',
    'work-through'
  ];
  
  // Check title first (most reliable)
  const titleHasEducationalIntent = educationalKeywords.some(kw => 
    titleLower.includes(kw)
  );
  
  if (!titleHasEducationalIntent) {
    return false;
  }
  
  // Exclude clinical/therapeutic language (RYD is self-help only)
  const clinicalKeywords = [
    'diagnose',
    'diagnosis',
    'treatment',
    'therapy session',
    'prescription',
    'medication',
    'disorder',
    'condition',
    'symptom',
    'clinical'
  ];
  
  const hasClinicalLanguage = clinicalKeywords.some(kw => 
    titleLower.includes(kw)
  );
  
  if (hasClinicalLanguage) {
    return false;
  }
  
  // Description can be minimal - we'll use title as primary signal
  const desc = (tool.description || '').trim();
  
  // If description exists and is not just login/nav text, check for corruption
  if (desc && desc.length > 20) {
    const descLower = desc.toLowerCase();
    const isLoginNavText = descLower.includes('login') && 
                           (descLower.includes('insights ›') || desc.length < 50);
    
    if (!isLoginNavText) {
      // Check for corruption only in real descriptions
      if (desc.includes('') || desc.includes('Ã') || desc.includes('Â')) {
        return false; // Corrupted text
      }
    }
  }
  
  return true;
}

// Main filter function
function filterTools() {
  console.log('[FILTER] Reading canonical tools file...');
  
  const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
  const allTools = JSON.parse(rawData);
  
  console.log(`[FILTER] Total tools in canonical file: ${allTools.length}`);
  
  const filtered = [];
  const excluded = [];
  
  allTools.forEach(tool => {
    if (isSolidRelevantTool(tool)) {
      // Clean up the tool object
      let description = (tool.description || '').trim();
      
      // If description is just login/nav text, create a placeholder from title
      const descLower = description.toLowerCase();
      if (descLower.includes('login') && (descLower.includes('insights ›') || description.length < 50)) {
        // Generate a meaningful description from the title
        description = `${tool.title}. A self-help tool for addressing this challenge.`;
      }
      
      const cleanTool = {
        id: tool.id,
        slug: tool.id, // Use id as slug if slug not present
        title: tool.title,
        description: description,
        url: tool.url,
        source: 'live-site-crawl-filtered',
        ...(tool.citations && { citations: tool.citations })
      };
      
      filtered.push(cleanTool);
    } else {
      excluded.push({
        id: tool.id,
        reason: getExclusionReason(tool)
      });
    }
  });
  
  console.log(`[FILTER] Filtered tools: ${filtered.length}`);
  console.log(`[FILTER] Excluded: ${excluded.length}`);
  
  // Write filtered file
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(filtered, null, 2),
    'utf8'
  );
  console.log(`[FILTER] Wrote filtered tools to: ${OUTPUT_FILE}`);
  
  // Write report
  const report = {
    timestamp: new Date().toISOString(),
    inputFile: INPUT_FILE,
    outputFile: OUTPUT_FILE,
    totals: {
      input: allTools.length,
      filtered: filtered.length,
      excluded: excluded.length,
      filterRate: ((filtered.length / allTools.length) * 100).toFixed(1) + '%'
    },
    exclusionReasons: getExclusionReasonCounts(excluded),
    sampleFiltered: filtered.slice(0, 5).map(t => ({ id: t.id, title: t.title })),
    sampleExcluded: excluded.slice(0, 10)
  };
  
  fs.writeFileSync(
    REPORT_FILE,
    JSON.stringify(report, null, 2),
    'utf8'
  );
  console.log(`[FILTER] Wrote filter report to: ${REPORT_FILE}`);
  
  console.log('\n[FILTER] ===== FILTER SUMMARY =====');
  console.log(`Input: ${allTools.length} tools`);
  console.log(`Filtered: ${filtered.length} tools`);
  console.log(`Excluded: ${excluded.length} tools`);
  console.log(`Filter rate: ${report.totals.filterRate}`);
  console.log(`\nFiltered file: ${OUTPUT_FILE}`);
  console.log(`Report file: ${REPORT_FILE}`);
  console.log('====================================\n');
  
  if (filtered.length > 0) {
    console.log('Sample filtered tool:');
    console.log(JSON.stringify(filtered[0], null, 2));
  }
}

// Helper: Get exclusion reason
function getExclusionReason(tool) {
  if (!tool.id || !tool.title || !tool.url) {
    return 'Missing required fields';
  }
  
  if (tool.title === tool.id || tool.title.length < 10) {
    return 'Title is just ID or too short';
  }
  
  const titleLower = tool.title.toLowerCase();
  const educationalKeywords = ['how do i', 'how to', 'how can i', 'what if', 'why do i', 'when should i'];
  const hasEducationalIntent = educationalKeywords.some(kw => titleLower.includes(kw));
  
  if (!hasEducationalIntent) {
    return 'No educational intent in title';
  }
  
  if (titleLower.includes('diagnose') || titleLower.includes('treatment') || titleLower.includes('prescription')) {
    return 'Clinical language';
  }
  
  const urlLower = tool.url.toLowerCase();
  const excludeUrlPatterns = ['/terms', '/privacy', '/about', '/contact', '/blog/', '/store', '/members/', '/checkout', '/cart'];
  if (excludeUrlPatterns.some(pattern => urlLower.includes(pattern))) {
    return 'Non-tool page URL';
  }
  
  return 'Does not meet quality criteria';
}

// Helper: Count exclusion reasons
function getExclusionReasonCounts(excluded) {
  const counts = {};
  excluded.forEach(item => {
    counts[item.reason] = (counts[item.reason] || 0) + 1;
  });
  return counts;
}

// Run if called directly
if (require.main === module) {
  filterTools();
}

module.exports = { filterTools, isSolidRelevantTool };
