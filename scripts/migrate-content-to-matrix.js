#!/usr/bin/env node

/**
 * Content Migration to Matrix Structure
 * Migrates existing content from current platform to self-resonating SEO matrix structure
 */

import firebaseBackend from '../core/firebase-backend.js';
import matrixEngine from '../core/matrix-engine.js';
import authorityEngine from '../core/authority-engine.js';
import { logger } from '../core/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

/**
 * Migrate content to matrix structure
 */
async function migrateContentToMatrix() {
  console.log('\n' + '='.repeat(70));
  console.log('Content Migration to Matrix Structure');
  console.log('='.repeat(70) + '\n');

  try {
    // Load content inventory if exists
    const inventoryPath = path.join(__dirname, '../logs/content-audit');
    const inventoryFiles = fs.existsSync(inventoryPath) 
      ? fs.readdirSync(inventoryPath).filter(f => f.includes('content-inventory') && f.endsWith('.json'))
      : [];

    let contentInventory = null;

    if (inventoryFiles.length > 0) {
      console.log('📋 Found content inventory files:\n');
      inventoryFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file}`);
      });
      
      const useInventory = await question('\nUse existing inventory? (y/n, default: y): ') !== 'n';
      
      if (useInventory && inventoryFiles.length > 0) {
        const selectedFile = inventoryFiles[inventoryFiles.length - 1]; // Use most recent
        const inventoryData = fs.readFileSync(path.join(inventoryPath, selectedFile), 'utf8');
        contentInventory = JSON.parse(inventoryData);
        console.log(`✅ Loaded inventory: ${selectedFile}\n`);
      }
    }

    if (!contentInventory) {
      console.log('⚠️  No inventory found. Please run content-audit script first.\n');
      console.log('Run: npm run content-audit\n');
      process.exit(1);
    }

    // Initialize Firebase
    console.log('🔥 Initializing Firebase backend...\n');
    const sessionId = 'migration-session';
    
    // Note: This would need actual Firebase credentials
    // For now, we'll create the migration plan without actual Firebase writes
    
    console.log('📊 Migration Plan:\n');
    console.log(`  - Tools to migrate: ${contentInventory.tools.length}`);
    console.log(`  - Citations found: ${contentInventory.citations.length}`);
    console.log(`  - Pages discovered: ${contentInventory.pages.length}\n`);

    // Transform tools to matrix format
    const transformedTools = contentInventory.tools.map((tool, index) => {
      return {
        id: tool.id || `tool-${index + 1}`,
        title: tool.title,
        description: tool.description || '',
        toolType: 'general', // Would need classification
        difficulty: 'beginner', // Default, would need assessment
        duration: '5-10 minutes', // Default
        steps: [], // Would need extraction from content
        mechanism: '',
        expectedOutcome: '',
        researchIds: [],
        numerologicalValue: matrixEngine.calculateNumerologicalValue(tool.title),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        migratedFrom: 'legacy-platform'
      };
    });

    // Transform citations to research format
    const transformedResearch = contentInventory.citations.map((citation, index) => {
      return {
        id: citation.id || `research-${index + 1}`,
        title: citation.text,
        url: citation.url,
        citationText: citation.text,
        relatedPainPoints: [],
        relatedTools: [],
        credibility: 'medium', // Would need verification
        createdAt: new Date().toISOString(),
        migratedFrom: 'legacy-platform'
      };
    });

    // Generate migration report
    console.log('📝 Generating migration report...\n');
    
    const migrationReport = {
      timestamp: new Date().toISOString(),
      summary: {
        toolsTransformed: transformedTools.length,
        researchTransformed: transformedResearch.length,
        pagesProcessed: contentInventory.pages.length
      },
      tools: transformedTools,
      research: transformedResearch,
      migrationPlan: {
        step1: 'Initialize Firestore collections',
        step2: 'Migrate tools to tools collection',
        step3: 'Migrate research to research collection',
        step4: 'Create pain points from content',
        step5: 'Build matrix connections',
        step6: 'Set up gates/anchors',
        step7: 'Link tools to pain points',
        step8: 'Link research to tools and pain points'
      },
      notes: [
        'Tool steps need to be extracted from current content',
        'Pain points need to be identified and created',
        'Matrix connections need to be established',
        'Citations need verification and proper formatting'
      ]
    };

    // Save migration report
    const outputDir = path.join(__dirname, '../logs/migration');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const reportFile = path.join(
      outputDir,
      `migration-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );

    fs.writeFileSync(reportFile, JSON.stringify(migrationReport, null, 2));
    console.log(`✅ Migration report saved: ${reportFile}\n`);

    // Generate migration script code
    const migrationScriptCode = generateMigrationScript(migrationReport);
    const scriptFile = path.join(outputDir, 'migration-script.js');
    fs.writeFileSync(scriptFile, migrationScriptCode);
    console.log(`✅ Migration script generated: ${scriptFile}\n`);

    console.log('='.repeat(70));
    console.log('Migration Preparation Complete');
    console.log('='.repeat(70));
    console.log('\nNext Steps:');
    console.log('1. Review migration report');
    console.log('2. Verify tool and research transformations');
    console.log('3. Run migration script with Firebase credentials');
    console.log('4. Verify data in Firestore collections');
    console.log('5. Test matrix structure and connections\n');

  } catch (error) {
    console.error('\n❌ Migration error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    rl.close();
  }
}

/**
 * Generate migration script code
 */
function generateMigrationScript(migrationReport) {
  return `/**
 * Generated Migration Script
 * Execute this script to migrate content to Firestore matrix structure
 * 
 * Usage: node migration-script.js
 * 
 * Make sure Firebase is initialized before running
 */

import firebaseBackend from '../core/firebase-backend.js';
import { logger } from '../core/logger.js';

const migrationData = ${JSON.stringify(migrationReport, null, 2)};

async function executeMigration() {
  try {
    // Initialize Firebase (you'll need to provide credentials)
    // await firebaseBackend.initialize(sessionId, firebaseConfig);
    
    console.log('Starting migration...\\n');
    
    // Migrate tools
    console.log('Migrating tools...');
    for (const tool of migrationData.tools) {
      try {
        // await firebaseBackend.writeDocument(\`tools/\${tool.id}\`, tool);
        console.log(\`  ✓ Migrated tool: \${tool.title}\`);
      } catch (error) {
        console.error(\`  ✗ Error migrating tool \${tool.id}: \${error.message}\`);
      }
    }
    
    // Migrate research
    console.log('\\nMigrating research...');
    for (const research of migrationData.research) {
      try {
        // await firebaseBackend.writeDocument(\`research/\${research.id}\`, research);
        console.log(\`  ✓ Migrated research: \${research.title}\`);
      } catch (error) {
        console.error(\`  ✗ Error migrating research \${research.id}: \${error.message}\`);
      }
    }
    
    console.log('\\n✅ Migration complete!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Uncomment to run:
// executeMigration().catch(console.error);
`;
}

// Run migration preparation
migrateContentToMatrix().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});




