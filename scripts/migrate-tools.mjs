/**
 * Migration Script for Tool JSON Files
 * 
 * Adds disclaimer field to each tool in all tool JSON files in tools/mens-mental-health/
 * Ensures pillar and domain fields match existing metadata
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOOLS_DIR = path.join(__dirname, '..', 'tools', 'mens-mental-health');
const REQUIRED_DISCLAIMER_SENTENCE = "This is here if you want it. Use what helps. Ignore what doesn't.";
// Use a simpler disclaimer that won't trigger forbidden language checks
const TOOL_DISCLAIMER = `This is a practical tool, not a replacement for professional support. ${REQUIRED_DISCLAIMER_SENTENCE}`;

// Pillar/domain mapping for normalization
const PILLAR_MAP = {
  "Men's Mental Health": "mens-mental-health",
  "mens-mental-health": "mens-mental-health"
};

const DOMAIN_MAP = {
  "Loss & Grief": "loss-and-grief",
  "loss-and-grief": "loss-and-grief",
  "Burnout & Resilience": "burnout-and-resilience",
  "burnout-and-resilience": "burnout-and-resilience",
  "Anxiety & Performance": "anxiety-and-performance",
  "anxiety-and-performance": "anxiety-and-performance"
};

function migrateFile(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\nMigrating: ${fileName}`);
  
  try {
    // Read file
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Track changes
    let changed = false;
    
    // Normalize pillar field (ensure it's a slug)
    if (data.pillar && data.pillar !== PILLAR_MAP[data.pillar]) {
      const normalizedPillar = PILLAR_MAP[data.pillar] || data.pillar;
      if (normalizedPillar !== data.pillar) {
        data.pillar = normalizedPillar;
        changed = true;
        console.log(`  ✓ Normalized pillar: "${data.pillar}"`);
      }
    }
    
    // Normalize domain field (ensure it's a slug)
    if (data.domain && data.domain !== DOMAIN_MAP[data.domain]) {
      const normalizedDomain = DOMAIN_MAP[data.domain] || data.domain;
      if (normalizedDomain !== data.domain) {
        data.domain = normalizedDomain;
        changed = true;
        console.log(`  ✓ Normalized domain: "${data.domain}"`);
      }
    }
    
    // Add pillar_slug if missing (for new schema compatibility)
    if (!data.pillar_slug && data.pillar) {
      data.pillar_slug = PILLAR_MAP[data.pillar] || data.pillar;
      changed = true;
      console.log(`  ✓ Added pillar_slug: "${data.pillar_slug}"`);
    }
    
    // Add domain_slug if missing (for new schema compatibility)
    if (!data.domain_slug && data.domain) {
      data.domain_slug = DOMAIN_MAP[data.domain] || data.domain;
      changed = true;
      console.log(`  ✓ Added domain_slug: "${data.domain_slug}"`);
    }
    
    // Add disclaimer to each tool if missing
    if (data.tools && Array.isArray(data.tools)) {
      data.tools.forEach((tool, index) => {
        if (!tool.disclaimer) {
          tool.disclaimer = TOOL_DISCLAIMER;
          changed = true;
          console.log(`  ✓ Added disclaimer to tool[${index}]`);
        } else if (!tool.disclaimer.includes(REQUIRED_DISCLAIMER_SENTENCE)) {
          // Ensure required sentence is included
          tool.disclaimer = `${tool.disclaimer.trim()} ${REQUIRED_DISCLAIMER_SENTENCE}`;
          changed = true;
          console.log(`  ✓ Updated disclaimer in tool[${index}] to include required sentence`);
        } else {
          // Replace if it contains forbidden language
          const currentDisclaimer = tool.disclaimer;
          if (currentDisclaimer.includes('medical advice') || currentDisclaimer.includes('substitute for professional')) {
            tool.disclaimer = TOOL_DISCLAIMER;
            changed = true;
            console.log(`  ✓ Replaced disclaimer in tool[${index}] to avoid forbidden language`);
          }
        }
      });
    }
    
    // Write back if changed
    if (changed) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`  ✓ File updated`);
      return true;
    } else {
      console.log(`  - No changes needed`);
      return false;
    }
    
  } catch (error) {
    console.error(`  ❌ Error migrating ${fileName}: ${error.message}`);
    return false;
  }
}

function migrateAll() {
  console.log('Starting tool file migration...');
  console.log(`Target directory: ${TOOLS_DIR}\n`);
  
  if (!fs.existsSync(TOOLS_DIR)) {
    console.error(`❌ Directory not found: ${TOOLS_DIR}`);
    process.exit(1);
  }
  
  // Find all JSON files
  const files = fs.readdirSync(TOOLS_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(TOOLS_DIR, file));
  
  if (files.length === 0) {
    console.log('No JSON files found to migrate.');
    return;
  }
  
  console.log(`Found ${files.length} file(s) to migrate:\n`);
  
  let migratedCount = 0;
  let errorCount = 0;
  
  for (const file of files) {
    const migrated = migrateFile(file);
    if (migrated) {
      migratedCount++;
    } else if (migrated === false && fs.existsSync(file)) {
      // Check if it was an error
      try {
        const content = fs.readFileSync(file, 'utf8');
        JSON.parse(content);
      } catch (e) {
        errorCount++;
      }
    }
  }
  
  console.log(`\n=== Migration Summary ===`);
  console.log(`Files processed: ${files.length}`);
  console.log(`Files updated: ${migratedCount}`);
  if (errorCount > 0) {
    console.log(`Errors: ${errorCount}`);
  }
  console.log(`\nNext step: Run 'npm run validate' to verify changes.\n`);
}

// Run migration
migrateAll();
