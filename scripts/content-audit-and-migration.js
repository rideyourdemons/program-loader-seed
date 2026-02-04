#!/usr/bin/env node

/**
 * Content Audit and Migration Script
 * Analyzes live platform content and prepares for migration to matrix structure
 */

import navigationController from '../core/navigation-controller.js';
import codeAuditor from '../core/code-auditor.js';
import webAutomation from '../core/web-automation.js';
import firebaseBackend from '../core/firebase-backend.js';
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
 * Extract content from live platform
 */
async function auditAndExtractContent() {
  console.log('\n' + '='.repeat(70));
  console.log('Content Audit & Migration Preparation');
  console.log('='.repeat(70) + '\n');

  let websiteSessionId = null;
  const contentInventory = {
    timestamp: new Date().toISOString(),
    url: 'https://rideyourdemons.com',
    pages: [],
    tools: [],
    painPoints: [],
    citations: [],
    uxIssues: [],
    metadata: {}
  };

  try {
    // Step 1: Access website
    console.log('📡 Step 1: Accessing live platform...\n');
    
    const url = await question('Website URL (default: https://rideyourdemons.com): ') || 'https://rideyourdemons.com';
    const username = await question('Email/Username: ');
    const password = await question('Password: ');
    const headless = (await question('Headless mode? (y/n, default: n): ')) === 'y';

    websiteSessionId = await navigationController.initWebsiteSession({
      url,
      username,
      password
    }, { headless });

    console.log(`✅ Session created: ${websiteSessionId}\n`);

    // Step 2: Navigate and discover content
    console.log('🔍 Step 2: Discovering content structure...\n');
    console.log('Please navigate through the site to help us discover content.\n');
    console.log('We will extract:');
    console.log('  - Page structure and content');
    console.log('  - Tools (especially "tool of the day")');
    console.log('  - Pain points/challenges');
    console.log('  - Citations and research links');
    console.log('  - UX issues and clutter points\n');

    await question('Press Enter after you\'ve navigated to the homepage...');

    // Get homepage content
    const homepageUrl = await navigationController.getCurrentUrl(websiteSessionId);
    const homepageContent = await navigationController.getCurrentContent(websiteSessionId);
    
    contentInventory.pages.push({
      url: homepageUrl,
      type: 'homepage',
      contentLength: homepageContent.length,
      extracted: new Date().toISOString()
    });

    // Discover code files (may contain content structure)
    console.log('\n🔍 Discovering code files...');
    const codeFiles = await webAutomation.discoverCodeFiles(websiteSessionId);
    console.log(`✅ Found ${codeFiles.length} code files\n`);

    // Step 3: Extract tools
    console.log('🛠️  Step 3: Extracting tools...\n');
    
    const extractTools = (await question('Extract tools from page? (y/n, default: y): ')) !== 'n';
    if (extractTools) {
      try {
        // Extract tool information from page
        const toolsData = await webAutomation.evaluate(websiteSessionId, () => {
          const tools = [];
          
          // Look for tool elements (adjust selectors based on actual site)
          const toolElements = document.querySelectorAll('[data-tool], .tool, [class*="tool"]');
          
          toolElements.forEach((el, index) => {
            const tool = {
              id: el.getAttribute('data-tool-id') || el.id || `tool-${index}`,
              title: el.querySelector('h1, h2, h3, .title, [class*="title"]')?.textContent?.trim() || 'Untitled Tool',
              description: el.querySelector('.description, [class*="description"], p')?.textContent?.trim() || '',
              isToolOfDay: el.classList.contains('tool-of-day') || 
                          el.getAttribute('data-tool-of-day') === 'true' ||
                          el.textContent.toLowerCase().includes('tool of the day'),
              element: el.tagName
            };
            tools.push(tool);
          });
          
          return tools;
        });

        contentInventory.tools = toolsData;
        console.log(`✅ Extracted ${toolsData.length} tools\n`);
      } catch (error) {
        console.log(`⚠️  Could not extract tools automatically: ${error.message}`);
        console.log('You can manually add tool information later.\n');
      }
    }

    // Step 4: Extract citations
    console.log('📚 Step 4: Extracting citations...\n');
    
    try {
      const citationsData = await webAutomation.evaluate(websiteSessionId, () => {
        const citations = [];
        
        // Look for citation elements
        const citationLinks = document.querySelectorAll('a[href*="doi"], a[href*="pubmed"], a[href*="research"], .citation, [class*="citation"]');
        
        citationLinks.forEach((link, index) => {
          citations.push({
            id: `citation-${index}`,
            text: link.textContent.trim(),
            url: link.href,
            source: link.closest('article, section, .content')?.querySelector('h1, h2, h3')?.textContent?.trim() || 'Unknown'
          });
        });
        
        return citations;
      });

      contentInventory.citations = citationsData;
      console.log(`✅ Found ${citationsData.length} citations\n`);
    } catch (error) {
      console.log(`⚠️  Citation extraction had issues: ${error.message}\n`);
    }

    // Step 5: UX Issues Documentation
    console.log('🎨 Step 5: Documenting UX observations...\n');
    console.log('Please note any UX issues you observe:\n');
    
    const uxNotes = await question('Enter UX issues observed (press Enter when done): ');
    if (uxNotes) {
      contentInventory.uxIssues.push({
        timestamp: new Date().toISOString(),
        notes: uxNotes,
        severity: 'medium' // Could be enhanced with categorization
      });
    }

    // Step 6: Save inventory
    console.log('\n💾 Step 6: Saving content inventory...\n');
    
    const outputDir = path.join(__dirname, '../logs/content-audit');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const inventoryFile = path.join(
      outputDir,
      `content-inventory-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );

    fs.writeFileSync(inventoryFile, JSON.stringify(contentInventory, null, 2));
    console.log(`✅ Content inventory saved: ${inventoryFile}\n`);

    // Step 7: Generate migration recommendations
    console.log('📋 Step 7: Generating migration recommendations...\n');
    
    const recommendations = generateMigrationRecommendations(contentInventory);
    
    const recommendationsFile = path.join(
      outputDir,
      `migration-recommendations-${new Date().toISOString().replace(/[:.]/g, '-')}.md`
    );

    fs.writeFileSync(recommendationsFile, recommendations);
    console.log(`✅ Recommendations saved: ${recommendationsFile}\n`);

    // Summary
    console.log('='.repeat(70));
    console.log('Content Audit Summary');
    console.log('='.repeat(70));
    console.log(`Pages discovered: ${contentInventory.pages.length}`);
    console.log(`Tools found: ${contentInventory.tools.length}`);
    console.log(`Citations found: ${contentInventory.citations.length}`);
    console.log(`UX issues documented: ${contentInventory.uxIssues.length}`);
    console.log('\n✅ Content audit complete!\n');

  } catch (error) {
    console.error('\n❌ Error during content audit:', error.message);
    console.error(error.stack);
    
    // Save partial results
    const outputDir = path.join(__dirname, '../logs/content-audit');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const errorFile = path.join(
      outputDir,
      `content-audit-error-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );
    
    fs.writeFileSync(errorFile, JSON.stringify({
      error: error.message,
      stack: error.stack,
      partialInventory: contentInventory
    }, null, 2));
    
    process.exit(1);
  } finally {
    if (websiteSessionId) {
      await navigationController.closeSession(websiteSessionId);
    }
    rl.close();
  }
}

/**
 * Generate migration recommendations
 */
function generateMigrationRecommendations(inventory) {
  let recommendations = `# Content Migration Recommendations\n\n`;
  recommendations += `Generated: ${new Date().toISOString()}\n\n`;
  recommendations += `## Overview\n\n`;
  recommendations += `This document provides recommendations for migrating content to the self-resonating SEO matrix structure.\n\n`;

  // Tools section
  recommendations += `## Tools Migration\n\n`;
  recommendations += `Found ${inventory.tools.length} tools.\n\n`;
  
  if (inventory.tools.length > 0) {
    recommendations += `### Tool of the Day Issue\n`;
    const toolOfDay = inventory.tools.find(t => t.isToolOfDay);
    if (toolOfDay) {
      recommendations += `- Current tool of the day: "${toolOfDay.title}"\n`;
      recommendations += `- **Action Required**: Implement daily rotation system\n`;
      recommendations += `- Use \`core/tool-rotation.js\` for automatic rotation\n\n`;
    } else {
      recommendations += `- No tool of the day identified in extraction\n`;
      recommendations += `- **Action Required**: Identify which tool should be featured\n\n`;
    }

    recommendations += `### Tools to Migrate\n\n`;
    inventory.tools.forEach((tool, index) => {
      recommendations += `${index + 1}. **${tool.title}**\n`;
      recommendations += `   - ID: ${tool.id}\n`;
      if (tool.description) {
        recommendations += `   - Description: ${tool.description.substring(0, 100)}...\n`;
      }
      recommendations += `   - Migrate to: \`tools\` collection in Firestore\n\n`;
    });
  }

  // Citations section
  recommendations += `## Citations Audit\n\n`;
  recommendations += `Found ${inventory.citations.length} citations.\n\n`;
  
  if (inventory.citations.length > 0) {
    recommendations += `### Citation Status\n`;
    recommendations += `- Total citations: ${inventory.citations.length}\n`;
    recommendations += `- **Action Required**: Verify all citations are:\n`;
    recommendations += `  - Properly formatted\n`;
    recommendations += `  - Links are valid\n`;
    recommendations += `  - Attributed correctly\n`;
    recommendations += `  - Added to \`research\` collection\n\n`;

    recommendations += `### Citations Found\n\n`;
    inventory.citations.forEach((citation, index) => {
      recommendations += `${index + 1}. ${citation.text}\n`;
      recommendations += `   - URL: ${citation.url}\n`;
      recommendations += `   - Source: ${citation.source}\n\n`;
    });
  } else {
    recommendations += `⚠️  **Warning**: No citations found. This may indicate:\n`;
    recommendations += `- Citations are embedded in text (need manual extraction)\n`;
    recommendations += `- Missing citations that need to be added\n`;
    recommendations += `- Citations use different HTML structure\n\n`;
  }

  // UX Issues
  recommendations += `## UX Issues Identified\n\n`;
  if (inventory.uxIssues.length > 0) {
    inventory.uxIssues.forEach((issue, index) => {
      recommendations += `${index + 1}. ${issue.notes}\n`;
      recommendations += `   - Severity: ${issue.severity}\n\n`;
    });
  } else {
    recommendations += `No specific UX issues documented. Consider:\n`;
    recommendations += `- Visual clutter assessment\n`;
    recommendations += `- Navigation complexity\n`;
    recommendations += `- Content overwhelm points\n\n`;
  }

  // Migration Steps
  recommendations += `## Recommended Migration Steps\n\n`;
  recommendations += `1. **Fix Tool of the Day Rotation**\n`;
  recommendations += `   - Implement \`core/tool-rotation.js\`\n`;
  recommendations += `   - Update homepage to use rotation system\n\n`;

  recommendations += `2. **Organize Tools**\n`;
  recommendations += `   - Structure tools with steps/workthroughs\n`;
  recommendations += `   - Link tools to pain points\n`;
  recommendations += `   - Add proper metadata (difficulty, duration, etc.)\n\n`;

  recommendations += `3. **Audit and Add Citations**\n`;
  recommendations += `   - Review all content for missing citations\n`;
  recommendations += `   - Add citations to \`research\` collection\n`;
  recommendations += `   - Link research to tools and pain points\n\n`;

  recommendations += `4. **Create Pain Points**\n`;
  recommendations += `   - Identify pain points from current content\n`;
  recommendations += `   - Create \`painPoints\` collection entries\n`;
  recommendations += `   - Link to tools and research\n\n`;

  recommendations += `5. **Build Matrix Connections**\n`;
  recommendations += `   - Create connections between related elements\n`;
  recommendations += `   - Set up gates/anchors for categorization\n`;
  recommendations += `   - Enable self-resonating SEO system\n\n`;

  recommendations += `6. **UX Improvements**\n`;
  recommendations += `   - Implement progressive disclosure\n`;
  recommendations += `   - Reduce visual clutter\n`;
  recommendations += `   - Improve navigation\n`;
  recommendations += `   - Add AI-guided tour\n\n`;

  return recommendations;
}

// Run audit
auditAndExtractContent().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});




