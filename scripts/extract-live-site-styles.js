#!/usr/bin/env node

/**
 * Extract CSS and styling from live Ride Your Demons website
 * This will help match the sandbox styling to the actual live site
 */

import navigationController from '../core/navigation-controller.js';
import { logger } from '../core/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function extractSiteStyles() {
  console.log('\n' + '='.repeat(70));
  console.log('Extract Live Site Styling');
  console.log('='.repeat(70) + '\n');

  let sessionId = null;

  try {
    console.log('📡 Step 1: Opening browser to live site...\n');
    
    const url = await question('Website URL (default: https://rideyourdemons.com): ') || 
                'https://rideyourdemons.com';
    
    const headless = (await question('Headless mode? (y/n, default: n): ')) !== 'y';

    sessionId = await navigationController.initWebsiteSession({
      url,
      username: '',
      password: ''
    }, { headless });

    console.log(`✅ Browser opened! Session ID: ${sessionId}\n`);

    console.log('📋 INSTRUCTIONS:');
    console.log('   1. Log in if needed');
    console.log('   2. Navigate to the homepage or page you want to extract styling from');
    console.log('   3. Press Enter when ready to extract CSS\n');

    await question('Press Enter when you\'re on the page you want to extract...');

    // Extract CSS and computed styles
    console.log('\n🔍 Extracting CSS and styles...\n');

    const styles = await navigationController.getCurrentContent(sessionId, {
      includeStyles: true,
      extractCSS: true
    });

    // Also extract computed styles from key elements
    const pageData = await navigationController.getCurrentPage(sessionId);
    
    if (pageData && pageData.evaluate) {
      const computedStyles = await pageData.evaluate(() => {
        const styleData = {
          body: {},
          header: {},
          main: {},
          colors: {},
          fonts: {},
          spacing: {}
        };

        // Get body styles
        const body = document.body;
        if (body) {
          const bodyStyles = window.getComputedStyle(body);
          styleData.body = {
            backgroundColor: bodyStyles.backgroundColor,
            color: bodyStyles.color,
            fontFamily: bodyStyles.fontFamily,
            fontSize: bodyStyles.fontSize,
            lineHeight: bodyStyles.lineHeight
          };
        }

        // Get header styles if exists
        const header = document.querySelector('header');
        if (header) {
          const headerStyles = window.getComputedStyle(header);
          styleData.header = {
            backgroundColor: headerStyles.backgroundColor,
            color: headerStyles.color,
            padding: headerStyles.padding,
            margin: headerStyles.margin,
            borderBottom: headerStyles.borderBottom
          };
        }

        // Extract all CSS rules
        const allStyles = Array.from(document.styleSheets)
          .filter(sheet => {
            try {
              return sheet.cssRules;
            } catch (e) {
              return false;
            }
          })
          .flatMap(sheet => Array.from(sheet.cssRules))
          .map(rule => rule.cssText)
          .join('\n');

        styleData.cssRules = allStyles;

        // Extract color palette from computed styles
        const elements = document.querySelectorAll('*');
        const colors = new Set();
        elements.forEach(el => {
          const styles = window.getComputedStyle(el);
          colors.add(styles.color);
          colors.add(styles.backgroundColor);
          colors.add(styles.borderColor);
        });

        styleData.colors = Array.from(colors).filter(c => c && c !== 'rgba(0, 0, 0, 0)');

        return styleData;
      });

      // Save extracted styles
      const outputDir = path.join(__dirname, '..', 'logs', 'extracted-styles');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputFile = path.join(outputDir, `styles-${timestamp}.json`);

      const extractedData = {
        timestamp: new Date().toISOString(),
        url: url,
        computedStyles: computedStyles,
        htmlContent: styles
      };

      fs.writeFileSync(outputFile, JSON.stringify(extractedData, null, 2));

      console.log('✅ Styles extracted successfully!');
      console.log(`📁 Saved to: ${outputFile}\n`);

      console.log('📊 Extracted Style Summary:');
      console.log('   Body Background:', computedStyles.body?.backgroundColor || 'N/A');
      console.log('   Body Color:', computedStyles.body?.color || 'N/A');
      console.log('   Font Family:', computedStyles.body?.fontFamily || 'N/A');
      console.log('   Header Background:', computedStyles.header?.backgroundColor || 'N/A');
      console.log('   Colors Found:', computedStyles.colors?.length || 0, 'unique colors');
      console.log('   CSS Rules:', computedStyles.cssRules?.split('\n').length || 0, 'rules\n');

      console.log('💡 Next step: Use this data to update the sandbox styling to match!\n');

    } else {
      console.log('⚠️  Could not extract computed styles. HTML content extracted.\n');
    }

    // Close session
    await navigationController.closeSession(sessionId);

  } catch (error) {
    logger.error(`Error extracting styles: ${error.message}`);
    console.error(`\n❌ Error: ${error.message}\n`);
    
    if (sessionId) {
      try {
        await navigationController.closeSession(sessionId);
      } catch (e) {
        // Ignore
      }
    }
  } finally {
    rl.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  extractSiteStyles().catch(console.error);
}

export default extractSiteStyles;

