/**
 * Update HTML files to use analytics.js instead of hardcoded GTM IDs
 * 
 * This script replaces hardcoded GTM scripts with analytics.js references
 */

const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'public/about/index.html',
  'public/store/index.html',
  'public/disclosures/index.html',
  'public/ethics/index.html',
  'public/terms/index.html',
  'public/analytics/index.html'
];

const gtmScriptPattern = /<script>\(function\(w,d,s,l,i\)\{w\[l\]=w\[l\]\|\|\[\];w\[l\]\.push\(\{'gtm\.start': new Date\(\)\.getTime\(\),event:'gtm\.js'\}\);var f=d\.getElementsByTagName\(s\)\[0\],j=d\.createElement\(s\),dl=l!='dataLayer'\?'&l='\+l:'';j\.async=true;j\.src='https:\/\/www\.googletagmanager\.com\/gtm\.js\?id='\+i\+dl;f\.parentNode\.insertBefore\(j,f\);\}\)\(window,document,'script','dataLayer','GTM-[A-Z0-9]+'\);\)<\/script>/g;

const gtmNoscriptPattern = /<noscript><iframe src="https:\/\/www\.googletagmanager\.com\/ns\.html\?id=GTM-[A-Z0-9]+"/g;

const replacementScript = `    <!-- Google Tag Manager (via analytics.js) -->
    <script src="/js/analytics.js" defer></script>
    <script src="/js/config/analytics-config.js"></script>
    <script src="/js/config/analytics-config.local.js" onerror="console.log('[Analytics] Local config not found, using defaults')"></script>`;

const replacementNoscript = `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-CONTAINER-ID"`;

console.log('🔄 Updating HTML files to use analytics.js...\n');

let updated = 0;
let errors = 0;

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  File not found: ${filePath}`);
    errors++;
    return;
  }
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    
    // Replace GTM script
    if (gtmScriptPattern.test(content)) {
      content = content.replace(gtmScriptPattern, replacementScript);
      modified = true;
    }
    
    // Replace noscript iframe (keep it but note it will be updated by analytics.js)
    if (gtmNoscriptPattern.test(content)) {
      // Just remove the hardcoded ID, analytics.js will handle it
      content = content.replace(/id=GTM-[A-Z0-9]+/g, 'id=GTM-CONTAINER-ID');
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      updated++;
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    errors++;
  }
});

console.log(`\n📊 Summary: ${updated} files updated, ${errors} errors`);
console.log('\n✅ HTML files updated to use analytics.js');
console.log('⚠️  Note: You still need to set GTM_CONTAINER_ID in .env file');
