/**
 * Add Filtered Tools to Base Tools
 * Merges the 526 filtered tools into the base tools.json
 * This gives you more tools to navigate before launch
 */

const fs = require('fs');
const path = require('path');

const BASE_TOOLS_FILE = path.join(__dirname, '..', 'public', 'data', 'tools.json');
const FILTERED_TOOLS_FILE = path.join(__dirname, '..', 'public', 'store', 'tools.filtered.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'data', 'tools.json');

function addFilteredTools() {
  console.log('[ADD] Loading base tools...');
  const baseData = JSON.parse(fs.readFileSync(BASE_TOOLS_FILE, 'utf8'));
  const baseTools = baseData.tools || [];
  console.log(`[ADD] Base tools: ${baseTools.length}`);
  
  console.log('[ADD] Loading filtered tools...');
  const filteredTools = JSON.parse(fs.readFileSync(FILTERED_TOOLS_FILE, 'utf8'));
  console.log(`[ADD] Filtered tools: ${filteredTools.length}`);
  
  // Get existing tool IDs to avoid duplicates
  const existingIds = new Set(baseTools.map(t => t.id || t.slug));
  
  // Convert filtered tools to base tool format
  const newTools = filteredTools
    .filter(tool => {
      const id = tool.id || tool.slug;
      return id && !existingIds.has(id);
    })
    .map(tool => {
      // Extract gate from URL if possible
      const url = tool.url || '';
      let gateIds = [];
      let painPointIds = [];
      let keywords = [];
      
      // Try to extract gate from URL pattern: /insights/{gate}/...
      const gateMatch = url.match(/\/insights\/([^\/]+)\//);
      if (gateMatch) {
        const gateSlug = gateMatch[1];
        // Map common gate slugs to gate IDs
        const gateMap = {
          'addiction-recovery': 'addiction-recovery',
          'anxiety-stress': 'anxiety-stress',
          'emotional-health': 'emotional-health',
          'relationships': 'relationships',
          'self-worth': 'self-worth',
          'trauma-recovery': 'trauma-recovery',
          'grief-loss': 'grief-loss',
          'work-life': 'work-life',
          'sleep': 'sleep',
          'anger': 'anger',
          'loneliness': 'loneliness',
          'purpose-meaning': 'purpose-meaning'
        };
        if (gateMap[gateSlug]) {
          gateIds = [gateMap[gateSlug]];
        }
      }
      
      // Extract keywords from title
      const title = (tool.title || '').toLowerCase();
      keywords = title.split(/\s+/).filter(w => w.length > 3);
      
      return {
        id: tool.id || tool.slug,
        slug: tool.slug || tool.id,
        name: tool.title,
        title: tool.title,
        description: tool.description || `${tool.title}. A self-help tool for addressing this challenge.`,
        duration: 'Self-paced',
        difficulty: 'Beginner',
        category: gateIds[0] || 'general',
        summary: tool.description ? tool.description.substring(0, 100) + '...' : tool.title,
        cta: `/tools/${tool.slug || tool.id}`,
        gateIds: gateIds,
        painPointIds: painPointIds,
        keywords: keywords,
        walkthroughs: [
          {
            title: 'Quick Workthrough (5 min)',
            steps: [
              'Take a moment to pause and reflect on this challenge.',
              'Identify one small step you can take right now.',
              'Commit to trying this step today.',
              'Notice how it feels to take action.'
            ]
          },
          {
            title: 'Standard Workthrough (15 min)',
            steps: [
              'Find a quiet space for reflection.',
              'Write down what this challenge means to you.',
              'Explore what has worked before and what hasn\'t.',
              'Identify 2-3 concrete steps you can take.',
              'Choose one step to implement this week.',
              'Reflect on what support you might need.'
            ]
          },
          {
            title: 'Deep Workthrough (30 min)',
            steps: [
              'Set aside dedicated time for this exploration.',
              'Begin with 5 minutes of breath awareness.',
              'Reflect deeply on this challenge and its impact.',
              'Explore your values and what matters most to you.',
              'Identify patterns and underlying factors.',
              'Create a concrete action plan with specific steps.',
              'Consider what resources and support you need.',
              'Commit to one meaningful action you\'ll take.',
              'Reflect on how this practice can support your growth.'
            ]
          }
        ],
        howWhyWorks: 'This tool is designed to help you explore and address this challenge through self-reflection and practical action. Content details are being imported from the live site.',
        citations: [
          {
            title: 'Content pending import',
            source: 'Content pending import from live site',
            url: tool.url || '',
            year: ''
          }
        ]
      };
    });
  
  console.log(`[ADD] New tools to add: ${newTools.length}`);
  
  // Merge tools (keep base tools first, then add filtered)
  const allTools = [...baseTools, ...newTools];
  
  // Update toolOfTheDay if needed
  const toolOfTheDay = baseData.toolOfTheDay || allTools[0];
  
  const updatedData = {
    version: '3.0',
    generated: new Date().toISOString(),
    toolOfTheDay: toolOfTheDay,
    tools: allTools
  };
  
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(updatedData, null, 2),
    'utf8'
  );
  
  console.log('\n[ADD] ===== MERGE SUMMARY =====');
  console.log(`Base tools: ${baseTools.length}`);
  console.log(`New tools added: ${newTools.length}`);
  console.log(`Total tools: ${allTools.length}`);
  console.log('================================\n');
  
  console.log('[ADD] Updated tools.json with filtered tools');
  console.log('[ADD] Next: Run map-tools-to-pain-points.cjs to create mappings');
}

// Run if called directly
if (require.main === module) {
  addFilteredTools();
}

module.exports = { addFilteredTools };

