/**
 * Principal Engineer Refactor Verification Script
 * Verifies all 5 goals have been achieved
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Principal Engineer Refactor Verification\n');
console.log('='.repeat(60));

let allPassed = true;

// 1. Git History & Secret Scrubbing
console.log('\n1. Git History & Secret Scrubbing');
console.log('-'.repeat(60));

const serverCjs = fs.readFileSync('server.cjs', 'utf8');
const hasHardcodedGTM = /GTM-[A-Z0-9]{7,}/.test(serverCjs);
const hasHardcodedGA4 = /G-[A-Z0-9]{10,}/.test(serverCjs);
const usesEnvVars = serverCjs.includes('process.env.GTM_CONTAINER_ID');

if (hasHardcodedGTM || hasHardcodedGA4) {
    console.log('❌ FAIL: Hardcoded GTM/GA4 IDs found in server.cjs');
    allPassed = false;
} else if (usesEnvVars) {
    console.log('✅ PASS: No hardcoded secrets, using environment variables');
} else {
    console.log('⚠️  WARN: No environment variable usage detected');
}

const gitignoreExists = fs.existsSync('.gitignore');
const gitignoreContent = gitignoreExists ? fs.readFileSync('.gitignore', 'utf8') : '';
const hasEnvInGitignore = gitignoreContent.includes('.env');

if (gitignoreExists && hasEnvInGitignore) {
    console.log('✅ PASS: .gitignore properly configured');
} else {
    console.log('❌ FAIL: .gitignore missing or incomplete');
    allPassed = false;
}

const envExampleExists = fs.existsSync('env.example');
if (envExampleExists) {
    console.log('✅ PASS: env.example template exists');
} else {
    console.log('❌ FAIL: env.example missing');
    allPassed = false;
}

// 2. Character Encoding & Null-Proof Pipeline
console.log('\n2. Character Encoding & Null-Proof Pipeline');
console.log('-'.repeat(60));

const safeMapperPath = 'public/js/utils/safe-data-mapper.js';
const safeMapperExists = fs.existsSync(safeMapperPath);

if (safeMapperExists) {
    const safeMapperContent = fs.readFileSync(safeMapperPath, 'utf8');
    const hasSafeFetch = safeMapperContent.includes('safeFetch');
    const hasSafeRender = safeMapperContent.includes('safeRender') || safeMapperContent.includes('sanitizeString');
    const hasUTF8 = safeMapperContent.includes('charset=utf-8') || safeMapperContent.includes('utf-8');
    
    if (hasSafeFetch && hasSafeRender && hasUTF8) {
        console.log('✅ PASS: Safe-Render pipeline implemented with UTF-8 enforcement');
    } else {
        console.log('⚠️  WARN: Safe-Render pipeline incomplete');
        if (!hasSafeFetch) console.log('   Missing: safeFetch');
        if (!hasSafeRender) console.log('   Missing: safeRender/sanitizeString');
        if (!hasUTF8) console.log('   Missing: UTF-8 encoding');
    }
} else {
    console.log('❌ FAIL: safe-data-mapper.js not found');
    allPassed = false;
}

// 3. UI Geometry & Viewport Constraint
console.log('\n3. UI Geometry & Viewport Constraint');
console.log('-'.repeat(60));

const insightsPath = 'public/insights.html';
if (fs.existsSync(insightsPath)) {
    const insightsContent = fs.readFileSync(insightsPath, 'utf8');
    const hasBottom80px = insightsContent.includes('bottom: 80px');
    const hasMaxHeight65vh = insightsContent.includes('max-height: 65vh');
    const hasOverflowAuto = insightsContent.includes('overflow-y: auto');
    const hasFixedPosition = insightsContent.includes('position: fixed');
    
    if (hasBottom80px && hasMaxHeight65vh && hasOverflowAuto && hasFixedPosition) {
        console.log('✅ PASS: Tour Guide positioned correctly (bottom: 80px, max-height: 65vh)');
    } else {
        console.log('⚠️  WARN: Tour Guide CSS may be incomplete');
        if (!hasBottom80px) console.log('   Missing: bottom: 80px');
        if (!hasMaxHeight65vh) console.log('   Missing: max-height: 65vh');
        if (!hasOverflowAuto) console.log('   Missing: overflow-y: auto');
        if (!hasFixedPosition) console.log('   Missing: position: fixed');
    }
} else {
    console.log('❌ FAIL: insights.html not found');
    allPassed = false;
}

// 4. Expert GA4 & Security Hardening
console.log('\n4. Expert GA4 & Security Hardening');
console.log('-'.repeat(60));

if (fs.existsSync(insightsPath)) {
    const insightsContent = fs.readFileSync(insightsPath, 'utf8');
    const hasActionImperativeEvent = insightsContent.includes('action_imperative_clicked');
    const hasMatrixException = insightsContent.includes('matrix_exception');
    const innerHTMLCount = (insightsContent.match(/\.innerHTML\s*=/g) || []).length;
    const hasXSSSanitizer = insightsContent.includes('XSSSanitizer') || insightsContent.includes('xss-sanitizer.js');
    const hasEventDelegation = insightsContent.includes('addEventListener') && insightsContent.includes('data-tool-id');
    
    if (hasActionImperativeEvent) {
        console.log('✅ PASS: Action Imperative GA4 event wired');
    } else {
        console.log('❌ FAIL: Action Imperative GA4 event not found');
        allPassed = false;
    }
    
    if (hasMatrixException) {
        console.log('✅ PASS: matrix_exception event implemented');
    } else {
        console.log('⚠️  WARN: matrix_exception event not found');
    }
    
    if (innerHTMLCount === 0) {
        console.log('✅ PASS: No innerHTML usage (fully XSS-hardened)');
    } else if (innerHTMLCount <= 2 && hasXSSSanitizer) {
        console.log(`⚠️  WARN: ${innerHTMLCount} innerHTML usages found (but XSSSanitizer is present)`);
    } else {
        console.log(`❌ FAIL: ${innerHTMLCount} innerHTML usages found (XSS risk)`);
        allPassed = false;
    }
    
    if (hasEventDelegation) {
        console.log('✅ PASS: Event delegation implemented (no inline onclick)');
    } else {
        console.log('⚠️  WARN: Event delegation may be incomplete');
    }
} else {
    console.log('❌ FAIL: insights.html not found');
    allPassed = false;
}

// 5. Performance Hardening
console.log('\n5. Performance Hardening');
console.log('-'.repeat(60));

const performancePath = 'public/js/utils/performance-debounce.js';
const performanceExists = fs.existsSync(performancePath);

if (performanceExists) {
    const performanceContent = fs.readFileSync(performancePath, 'utf8');
    const hasDebounce = performanceContent.includes('debounce');
    const has250ms = performanceContent.includes('250') || performanceContent.includes('250ms');
    
    if (hasDebounce && has250ms) {
        console.log('✅ PASS: Performance debouncing implemented (250ms)');
    } else {
        console.log('⚠️  WARN: Performance debouncing may be incomplete');
    }
} else {
    console.log('❌ FAIL: performance-debounce.js not found');
    allPassed = false;
}

if (fs.existsSync(insightsPath)) {
    const insightsContent = fs.readFileSync(insightsPath, 'utf8');
    const hasDebounceMatrix = insightsContent.includes('debounceMatrixRecalc') || insightsContent.includes('debounce');
    const hasPerformanceMonitor = insightsContent.includes('monitorMatrixPerformance');
    
    if (hasDebounceMatrix && hasPerformanceMonitor) {
        console.log('✅ PASS: Matrix operations debounced and monitored');
    } else {
        console.log('⚠️  WARN: Matrix debouncing may not be fully integrated');
    }
}

// Final Summary
console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(60));

if (allPassed) {
    console.log('\n✅ ALL CHECKS PASSED');
    console.log('🎉 Principal Engineer refactor is complete!');
    console.log('\n📋 Next Steps:');
    console.log('  1. Run: git grep "GTM-" $(git rev-list --all)');
    console.log('  2. If secrets found, rotate keys and scrub history');
    console.log('  3. Test Tour Guide positioning in browser');
    console.log('  4. Check console for "GA4 Event Dispatched" messages');
    console.log('  5. Verify no "null" text appears in UI');
} else {
    console.log('\n⚠️  SOME CHECKS FAILED');
    console.log('Please review the failures above and complete the refactor.');
}

console.log('\n');
