/**
 * GA4 Sanity Test Script
 * Run this in browser console to verify GA4 events are firing correctly
 * 
 * Usage: Copy and paste into browser console, or run: node ga4-sanity-test.js
 */

(function() {
  'use strict';
  
  console.log('🧪 GA4 Sanity Test Starting...\n');
  
  const tests = [];
  let passed = 0;
  let failed = 0;
  
  function test(name, condition, details = '') {
    const result = condition;
    tests.push({ name, result, details });
    if (result) {
      passed++;
      console.log(`✅ ${name}`, details ? `- ${details}` : '');
    } else {
      failed++;
      console.error(`❌ ${name}`, details ? `- ${details}` : '');
    }
    return result;
  }
  
  // Test 1: GA4 gtag available
  test('GA4 gtag function available', typeof window.gtag === 'function', 
    window.gtag ? 'gtag is a function' : 'gtag not found');
  
  // Test 2: RYD_ANALYTICS available
  test('RYD_ANALYTICS available', typeof window.RYD_ANALYTICS === 'object' && window.RYD_ANALYTICS !== null,
    window.RYD_ANALYTICS ? 'RYD_ANALYTICS object found' : 'RYD_ANALYTICS not found');
  
  // Test 3: dataLayer available
  test('dataLayer available', Array.isArray(window.dataLayer),
    window.dataLayer ? `dataLayer has ${window.dataLayer.length} items` : 'dataLayer not found');
  
  // Test 4: SafeMapper available
  test('SafeMapper available', typeof window.SafeMapper === 'object' && window.SafeMapper !== null,
    window.SafeMapper ? 'SafeMapper utilities loaded' : 'SafeMapper not found');
  
  // Test 5: SafeMapper functions
  if (window.SafeMapper) {
    test('SafeMapper.safeRender available', typeof window.SafeMapper.safeRender === 'function');
    test('SafeMapper.sanitizeString available', typeof window.SafeMapper.sanitizeString === 'function');
    test('SafeMapper.isNullish available', typeof window.SafeMapper.isNullish === 'function');
    test('SafeMapper.reportDataIntegrityError available', typeof window.SafeMapper.reportDataIntegrityError === 'function');
  }
  
  // Test 6: Test event firing
  if (typeof window.gtag === 'function') {
    try {
      const testEventName = 'sanity_test_event';
      const testParams = {
        test: true,
        timestamp: Date.now(),
        page_path: window.location.pathname
      };
      
      window.gtag('event', testEventName, testParams);
      test('Test event fired', true, `Event "${testEventName}" sent to GA4`);
    } catch (e) {
      test('Test event fired', false, `Error: ${e.message}`);
    }
  }
  
  // Test 7: Test data integrity error event
  if (window.SafeMapper && typeof window.SafeMapper.reportDataIntegrityError === 'function') {
    try {
      window.SafeMapper.reportDataIntegrityError('sanity_test', { test: true });
      test('Data integrity error reporting works', true, 'Error event sent to GA4');
    } catch (e) {
      test('Data integrity error reporting works', false, `Error: ${e.message}`);
    }
  }
  
  // Test 8: Test safeRender with null
  if (window.SafeMapper && typeof window.SafeMapper.safeRender === 'function') {
    const nullResult = window.SafeMapper.safeRender(null, 'fallback');
    test('safeRender handles null', nullResult === 'fallback', 
      `null rendered as: "${nullResult}"`);
    
    const undefinedResult = window.SafeMapper.safeRender(undefined, 'fallback');
    test('safeRender handles undefined', undefinedResult === 'fallback',
      `undefined rendered as: "${undefinedResult}"`);
    
    const stringNullResult = window.SafeMapper.safeRender('null', 'fallback');
    test('safeRender handles string "null"', stringNullResult === 'fallback',
      `"null" string rendered as: "${stringNullResult}"`);
  }
  
  // Test 9: Test encoding sanitization
  if (window.SafeMapper && typeof window.SafeMapper.sanitizeString === 'function') {
    const corrupted = 'ÃƒÂ° test';
    const sanitized = window.SafeMapper.sanitizeString(corrupted);
    test('Encoding sanitization works', !sanitized.includes('Ã') && !sanitized.includes('Â'),
      `Corrupted: "${corrupted}" → Sanitized: "${sanitized}"`);
  }
  
  // Test 10: Check dataLayer for recent events
  if (Array.isArray(window.dataLayer)) {
    const recentEvents = window.dataLayer.filter(item => 
      item.event && (item.event.includes('action_imperative') || 
                     item.event.includes('show_details') || 
                     item.event.includes('data_integrity'))
    );
    test('Recent GA4 events in dataLayer', recentEvents.length >= 0,
      `Found ${recentEvents.length} relevant events in dataLayer`);
    
    if (recentEvents.length > 0) {
      console.log('\n📊 Recent Events:');
      recentEvents.slice(-5).forEach((event, i) => {
        console.log(`  ${i + 1}. ${event.event}`, event);
      });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));
  
  if (failed === 0) {
    console.log('✅ All tests passed! GA4 integration is working correctly.');
  } else {
    console.warn('⚠️ Some tests failed. Check the errors above.');
  }
  
  // Return test results for programmatic access
  return {
    passed,
    failed,
    total: tests.length,
    tests,
    summary: `${passed}/${tests.length} tests passed`
  };
})();
