#!/usr/bin/env node

/**
 * Check live site for GA4 (Google Analytics 4) implementation
 */

import navigationController from '../core/navigation-controller.js';
import { logger } from '../core/logger.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function checkGA4() {
  console.log('\n' + '='.repeat(70));
  console.log('Check Live Site for GA4');
  console.log('='.repeat(70) + '\n');

  let sessionId = null;

  try {
    console.log('🌐 Opening browser to live site...\n');
    
    sessionId = await navigationController.initWebsiteSession({
      url: 'https://rideyourdemons.com',
      username: '',
      password: ''
    }, { headless: false });

    console.log(`✅ Browser opened! Session ID: ${sessionId}\n`);
    console.log('⏳ Waiting for page to load...\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get page content
    console.log('🔍 Checking page source for GA4...\n');
    const pageContent = await navigationController.getCurrentContent(sessionId);
    
    // Check for GA4 indicators
    const checks = {
      hasGtagScript: /gtag\(/i.test(pageContent) || /googletagmanager\.com\/gtag/i.test(pageContent),
      hasGA4Id: /G-[A-Z0-9]{10}/.test(pageContent),
      hasDataLayer: /dataLayer/i.test(pageContent),
      hasGoogleAnalytics: /google.*analytics/i.test(pageContent),
      hasGtmScript: /googletagmanager\.com\/gtm/i.test(pageContent)
    };

    // Extract GA4 ID if present
    let ga4Id = null;
    const ga4Match = pageContent.match(/G-[A-Z0-9]{10}/);
    if (ga4Match) {
      ga4Id = ga4Match[0];
    }

    // Extract gtag script if present
    const gtagMatch = pageContent.match(/googletagmanager\.com\/gtag\/js\?id=(G-[A-Z0-9]{10})/);
    if (gtagMatch) {
      ga4Id = gtagMatch[1];
    }

    // Results
    console.log('='.repeat(70));
    console.log('GA4 CHECK RESULTS');
    console.log('='.repeat(70) + '\n');

    console.log('Page URL: https://rideyourdemons.com\n');

    if (ga4Id) {
      console.log('✅ GA4 FOUND!');
      console.log(`   Measurement ID: ${ga4Id}\n`);
      console.log('Status checks:');
      console.log(`   ✓ gtag script: ${checks.hasGtagScript ? '✅' : '❌'}`);
      console.log(`   ✓ GA4 ID (G-XXXXXXXXXX): ${checks.hasGA4Id ? '✅' : '❌'}`);
      console.log(`   ✓ dataLayer: ${checks.hasDataLayer ? '✅' : '❌'}`);
      console.log(`   ✓ Google Analytics reference: ${checks.hasGoogleAnalytics ? '✅' : '❌'}`);
    } else {
      console.log('❌ GA4 NOT FOUND\n');
      console.log('Status checks:');
      console.log(`   ❌ gtag script: ${checks.hasGtagScript ? 'Found but no ID' : 'Not found'}`);
      console.log(`   ❌ GA4 ID (G-XXXXXXXXXX): ${checks.hasGA4Id ? 'Found' : 'Not found'}`);
      console.log(`   ❌ dataLayer: ${checks.hasDataLayer ? 'Found' : 'Not found'}`);
      console.log(`   ❌ Google Analytics reference: ${checks.hasGoogleAnalytics ? 'Found' : 'Not found'}`);
    }

    if (checks.hasGtmScript) {
      console.log(`\n⚠️  Google Tag Manager (GTM) detected - GA4 might be loaded via GTM`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('RECOMMENDATION');
    console.log('='.repeat(70) + '\n');

    if (ga4Id) {
      console.log(`✅ GA4 is integrated on the live site.`);
      console.log(`   Measurement ID: ${ga4Id}`);
      console.log(`\n   To add GA4 to the sandbox platform, use this ID.`);
      console.log(`   You can now integrate it into platform-integrated.html`);
    } else {
      console.log('❌ GA4 is NOT integrated on the live site.');
      console.log('\n   Next steps:');
      console.log('   1. Create a GA4 property in Google Analytics');
      console.log('   2. Get your Measurement ID (G-XXXXXXXXXX)');
      console.log('   3. Add it to both the live site and sandbox platform');
    }

    console.log('\n');

  } catch (error) {
    logger.error(`Error checking GA4: ${error.message}`);
    console.error(`\n❌ Error: ${error.message}\n`);
  } finally {
    if (sessionId) {
      try {
        await navigationController.closeSession(sessionId);
      } catch (e) {
        // Ignore
      }
    }
    rl.close();
  }
}

checkGA4();


