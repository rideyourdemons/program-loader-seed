/**
 * UI Interaction Auditor - Tests card clicks and tool detail rendering
 */

import puppeteer from 'puppeteer';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const DATA_DIR = join(ROOT_DIR, 'public', 'data');

const BASE_URL = process.env.AUDIT_URL || 'http://localhost:5173';

/**
 * Load sample tools and gates for testing
 */
function loadTestData() {
  try {
    const toolsData = JSON.parse(readFileSync(join(DATA_DIR, 'tools.json'), 'utf8'));
    const gatesData = JSON.parse(readFileSync(join(DATA_DIR, 'gates.json'), 'utf8'));
    
    return {
      tools: (toolsData.tools || []).slice(0, 10), // Sample first 10
      gates: (gatesData.gates || []).slice(0, 3) // Sample first 3
    };
  } catch (err) {
    console.warn('⚠️  Could not load test data:', err.message);
    return { tools: [], gates: [] };
  }
}

/**
 * Test tool card clicks on /tools page
 */
async function testToolsPageCards(page) {
  const issues = [];
  
  try {
    console.log('  Testing /tools page...');
    await page.goto(`${BASE_URL}/tools`, { waitUntil: 'networkidle2', timeout: 15000 });
    
    // Wait for tools to load
    await page.waitForTimeout(2000);
    
    // Find tool cards
    const cards = await page.$$('.tool-card, [class*="tool"], [data-tool]');
    
    if (cards.length === 0) {
      issues.push('No tool cards found on /tools page');
      return issues;
    }

    console.log(`    Found ${cards.length} tool cards`);

    // Test clicking first 3 cards
    const testCount = Math.min(3, cards.length);
    for (let i = 0; i < testCount; i++) {
      try {
        const card = cards[i];
        const initialUrl = page.url();
        
        // Find clickable element (button, link, or card itself)
        const button = await card.$('a, button, [role="button"]');
        const clickTarget = button || card;
        
        // Click and wait for navigation or content change
        await Promise.race([
          clickTarget.click(),
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => null),
          page.waitForTimeout(2000)
        ]);
        
        const newUrl = page.url();
        
        // Check if URL changed or detail view appeared
        if (newUrl !== initialUrl) {
          // URL changed - check if it's a valid tool detail route
          if (!newUrl.includes('/tools/') && !newUrl.includes('/gates/')) {
            issues.push(`Card ${i + 1}: Navigated to unexpected URL: ${newUrl}`);
          } else {
            // Check if tool detail content is visible
            await page.waitForTimeout(1000);
            const hasDetail = await page.$('h1, [class*="tool-detail"], [class*="detail"]');
            if (!hasDetail) {
              issues.push(`Card ${i + 1}: Navigated but no tool detail content visible`);
            }
          }
        } else {
          // URL didn't change - check for modal or detail panel
          const detailVisible = await page.$('[class*="modal"], [class*="detail"], [class*="tool-view"]');
          if (!detailVisible) {
            issues.push(`Card ${i + 1}: Click did not trigger navigation or detail view`);
          }
        }
        
        // Check for console errors
        const logs = await page.evaluate(() => {
          return window._consoleErrors || [];
        });
        
        if (logs.length > 0) {
          issues.push(`Card ${i + 1}: Console errors detected: ${logs.join(', ')}`);
        }
        
        // Go back if we navigated
        if (newUrl !== initialUrl) {
          await page.goBack({ waitUntil: 'networkidle2' });
          await page.waitForTimeout(1000);
        }
      } catch (err) {
        issues.push(`Card ${i + 1}: Click test failed - ${err.message}`);
      }
    }
  } catch (err) {
    issues.push(`Tools page test failed: ${err.message}`);
  }
  
  return issues;
}

/**
 * Test gate page tool cards
 */
async function testGatePageCards(page, gateId) {
  const issues = [];
  
  try {
    console.log(`  Testing /gates/${gateId}...`);
    await page.goto(`${BASE_URL}/gates/${gateId}`, { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // Try to find a pain point link and click it
    const painPointLinks = await page.$$('a[href*="/gates/' + gateId + '/"]');
    
    if (painPointLinks.length === 0) {
      issues.push(`No pain point links found on gate page`);
      return issues;
    }
    
    // Click first pain point
    await painPointLinks[0].click();
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => null);
    await page.waitForTimeout(2000);
    
    // Now test tool cards on pain point page
    const toolCards = await page.$$('.tool-card, [class*="tool"], a[href*="/gates/' + gateId + '/"]');
    
    if (toolCards.length === 0) {
      issues.push(`No tool cards found on pain point page`);
      return issues;
    }
    
    // Test clicking first tool card
    const firstCard = toolCards[0];
    const initialUrl = page.url();
    
    await firstCard.click();
    await Promise.race([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => null),
      page.waitForTimeout(2000)
    ]);
    
    const newUrl = page.url();
    
    // Check if we navigated to tool detail
    if (newUrl === initialUrl) {
      issues.push(`Tool card click did not navigate`);
    } else if (!newUrl.includes('/gates/') || !newUrl.match(/\/gates\/[^/]+\/[^/]+\/[^/]+/)) {
      issues.push(`Tool card navigated to unexpected route: ${newUrl}`);
    } else {
      // Check for tool detail content
      await page.waitForTimeout(1000);
      const hasTitle = await page.$('h1');
      const hasContent = await page.$('p, [class*="detail"], [class*="content"]');
      
      if (!hasTitle || !hasContent) {
        issues.push(`Tool detail page missing title or content`);
      }
    }
  } catch (err) {
    issues.push(`Gate page test failed: ${err.message}`);
  }
  
  return issues;
}

/**
 * Main audit function
 */
async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  UI INTERACTION AUDIT - Card Click & Navigation Test');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      page.evaluate(() => {
        window._consoleErrors = window._consoleErrors || [];
        window._consoleErrors.push(msg.text());
      });
    }
  });

  page.on('pageerror', error => {
    console.error(`  Page error: ${error.message}`);
  });

  const allIssues = [];

  try {
    // Test /tools page
    console.log('Testing /tools page card clicks...');
    const toolsIssues = await testToolsPageCards(page);
    allIssues.push(...toolsIssues);
    
    if (toolsIssues.length === 0) {
      console.log('  ✅ /tools page cards working correctly\n');
    } else {
      console.log(`  ❌ Found ${toolsIssues.length} issues\n`);
    }

    // Test gate pages
    const testData = loadTestData();
    if (testData.gates.length > 0) {
      console.log('Testing gate page card clicks...');
      for (const gate of testData.gates.slice(0, 2)) { // Test first 2 gates
        const gateIssues = await testGatePageCards(page, gate.id);
        allIssues.push(...gateIssues);
        
        if (gateIssues.length === 0) {
          console.log(`  ✅ Gate ${gate.id} cards working correctly\n`);
        } else {
          console.log(`  ❌ Gate ${gate.id} found ${gateIssues.length} issues\n`);
        }
      }
    }
  } catch (err) {
    console.error('❌ UI audit failed:', err.message);
    allIssues.push(`Audit failed: ${err.message}`);
  } finally {
    await browser.close();
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  if (allIssues.length === 0) {
    console.log('  ✅ All UI interactions passed!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    process.exit(0);
  } else {
    console.log(`  ❌ Found ${allIssues.length} issues:`);
    allIssues.forEach(issue => console.log(`     - ${issue}`));
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { testToolsPageCards, testGatePageCards };
