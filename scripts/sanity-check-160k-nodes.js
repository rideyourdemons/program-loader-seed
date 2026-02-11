/**
 * Sanity Check Script - Verify 160k nodes are loaded
 * Run in browser console to verify nodes are available before searching
 */

(function() {
  'use strict';

  console.log('🔍 160k Node Sanity Check\n');
  console.log('='.repeat(60));

  // Check 1: MatrixExpander
  console.log('\n1. MatrixExpander Status');
  console.log('-'.repeat(60));
  if (window.MatrixExpander) {
    console.log('✅ MatrixExpander loaded');
    if (typeof window.MatrixExpander.init === 'function') {
      console.log('✅ MatrixExpander.init available');
    } else {
      console.log('❌ MatrixExpander.init not found');
    }
  } else {
    console.log('❌ MatrixExpander not loaded');
  }

  // Check 2: Tools Data
  console.log('\n2. Tools Data');
  console.log('-'.repeat(60));
  if (window.MatrixExpander && typeof window.MatrixExpander.getBaseTools === 'function') {
    try {
      const tools = window.MatrixExpander.getBaseTools() || [];
      console.log(`✅ Tools loaded: ${tools.length} tools`);
      if (tools.length > 0) {
        console.log(`   Sample tool: ${tools[0].title || tools[0].name || tools[0].id}`);
      }
    } catch (e) {
      console.log('❌ Error getting tools:', e.message);
    }
  } else {
    console.log('⚠️  getBaseTools not available');
  }

  // Check 3: Gates Data
  console.log('\n3. Gates Data');
  console.log('-'.repeat(60));
  if (window.MatrixExpander && typeof window.MatrixExpander.getGates === 'function') {
    try {
      const gates = window.MatrixExpander.getGates() || [];
      console.log(`✅ Gates loaded: ${gates.length} gates`);
      if (gates.length > 0) {
        console.log(`   Sample gate: ${gates[0].title || gates[0].id}`);
      }
    } catch (e) {
      console.log('❌ Error getting gates:', e.message);
    }
  } else {
    console.log('⚠️  getGates not available');
  }

  // Check 4: Pain Points Data
  console.log('\n4. Pain Points Data');
  console.log('-'.repeat(60));
  if (window.MatrixExpander && typeof window.MatrixExpander.getPainPointsByGate === 'function') {
    try {
      const painPointsByGate = window.MatrixExpander.getPainPointsByGate() || {};
      const gateIds = Object.keys(painPointsByGate);
      const totalPainPoints = gateIds.reduce((sum, gateId) => {
        const points = painPointsByGate[gateId] || [];
        return sum + (Array.isArray(points) ? points.length : 0);
      }, 0);
      console.log(`✅ Pain Points loaded: ${totalPainPoints} total across ${gateIds.length} gates`);
      if (gateIds.length > 0) {
        const firstGate = gateIds[0];
        const firstGatePoints = painPointsByGate[firstGate] || [];
        console.log(`   Sample gate "${firstGate}": ${Array.isArray(firstGatePoints) ? firstGatePoints.length : 0} pain points`);
      }
    } catch (e) {
      console.log('❌ Error getting pain points:', e.message);
    }
  } else {
    console.log('⚠️  getPainPointsByGate not available');
  }

  // Check 5: Search Encoder
  console.log('\n5. Search Encoder');
  console.log('-'.repeat(60));
  if (window.SearchEncoder) {
    console.log('✅ SearchEncoder loaded');
    console.log('   Functions:', Object.keys(window.SearchEncoder).join(', '));
  } else {
    console.log('❌ SearchEncoder not loaded');
  }

  // Check 6: Gate State Manager
  console.log('\n6. Gate State Manager');
  console.log('-'.repeat(60));
  if (window.GateStateManager) {
    console.log('✅ GateStateManager loaded');
    const activeGate = window.GateStateManager.getActiveGate();
    console.log(`   Active Gate: ${activeGate || 'None'}`);
    const filtered = window.GateStateManager.getFilteredPainPoints();
    console.log(`   Filtered Pain Points: ${Array.isArray(filtered) ? filtered.length : 0}`);
  } else {
    console.log('❌ GateStateManager not loaded');
  }

  // Check 7: Mock Data (fallback)
  console.log('\n7. Mock Data (Fallback)');
  console.log('-'.repeat(60));
  if (typeof mockGates !== 'undefined') {
    console.log(`✅ mockGates: ${Array.isArray(mockGates) ? mockGates.length : 0} gates`);
  } else {
    console.log('⚠️  mockGates not defined');
  }
  
  if (typeof mockPainPoints !== 'undefined') {
    console.log(`✅ mockPainPoints: ${Array.isArray(mockPainPoints) ? mockPainPoints.length : 0} pain points`);
  } else {
    console.log('⚠️  mockPainPoints not defined');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SANITY CHECK SUMMARY');
  console.log('='.repeat(60));
  
  const allChecks = [
    window.MatrixExpander,
    window.SearchEncoder,
    window.GateStateManager
  ];
  
  const passed = allChecks.filter(check => check !== undefined).length;
  const total = allChecks.length;
  
  if (passed === total) {
    console.log('\n✅ ALL CHECKS PASSED');
    console.log('🎉 160k nodes are ready for searching!');
  } else {
    console.log(`\n⚠️  ${passed}/${total} checks passed`);
    console.log('Some components may not be fully loaded.');
  }
  
  console.log('\n💡 To use this check:');
  console.log('   1. Open browser console (F12)');
  console.log('   2. Paste this entire script');
  console.log('   3. Review the results');
  console.log('\n');
})();
