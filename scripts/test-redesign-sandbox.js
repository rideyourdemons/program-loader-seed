#!/usr/bin/env node

/**
 * Sandbox Testing for RYD Platform Redesign
 * Tests all new systems in a safe environment before deployment
 */

import toolRotation from '../core/tool-rotation.js';
import aiTourGuide from '../core/ai-tour-guide.js';
import { logger } from '../core/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n' + '='.repeat(70));
console.log('RYD Platform Redesign - Sandbox Testing');
console.log('='.repeat(70) + '\n');

const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

function recordTest(name, status, message = '', details = {}) {
  const result = {
    name,
    status, // 'pass', 'fail', 'warning'
    message,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  
  if (status === 'pass') {
    testResults.summary.passed++;
    console.log(`✅ ${name}: ${message || 'PASSED'}`);
  } else if (status === 'fail') {
    testResults.summary.failed++;
    console.log(`❌ ${name}: ${message || 'FAILED'}`);
  } else {
    testResults.summary.warnings++;
    console.log(`⚠️  ${name}: ${message || 'WARNING'}`);
  }
}

// Test 1: Tool Rotation System
console.log('\n📋 Testing Tool Rotation System...\n');

try {
  // Create mock tools
  const mockTools = [
    { id: 'tool-1', title: 'Breathing Exercise' },
    { id: 'tool-2', title: 'Meditation Guide' },
    { id: 'tool-3', title: 'Grounding Technique' },
    { id: 'tool-4', title: 'Cognitive Reframing' },
    { id: 'tool-5', title: 'Progressive Relaxation' }
  ];

  // Test basic rotation
  const todayTool = toolRotation.getToolOfTheDay(mockTools);
  if (todayTool && mockTools.includes(todayTool)) {
    recordTest('Tool Rotation - Basic', 'pass', `Tool selected: ${todayTool.title}`);
  } else {
    recordTest('Tool Rotation - Basic', 'fail', 'Tool selection failed');
  }

  // Test rotation consistency (same date = same tool)
  const date1 = new Date('2025-12-25');
  const date2 = new Date('2025-12-25');
  const tool1 = toolRotation.getToolOfTheDay(mockTools, date1);
  const tool2 = toolRotation.getToolOfTheDay(mockTools, date2);
  
  if (tool1.id === tool2.id) {
    recordTest('Tool Rotation - Consistency', 'pass', 'Same date returns same tool');
  } else {
    recordTest('Tool Rotation - Consistency', 'fail', 'Same date returns different tools');
  }

  // Test rotation schedule
  const schedule = toolRotation.getRotationSchedule(mockTools, 7);
  if (schedule.length === 7 && schedule.every(day => day.tool)) {
    recordTest('Tool Rotation - Schedule', 'pass', `Generated ${schedule.length} day schedule`);
  } else {
    recordTest('Tool Rotation - Schedule', 'fail', 'Schedule generation failed');
  }

  // Test rotation verification
  const verification = toolRotation.verifyRotation(mockTools, 30);
  if (verification.valid && verification.distribution.isEven) {
    recordTest('Tool Rotation - Distribution', 'pass', 'Tools distributed evenly');
  } else {
    recordTest('Tool Rotation - Distribution', 'warning', 
      `Distribution variance: ${verification.distribution.variance}`);
  }

  // Test next rotation info
  const rotationInfo = toolRotation.getNextRotationInfo();
  if (rotationInfo && rotationInfo.hoursUntil >= 0) {
    recordTest('Tool Rotation - Next Rotation', 'pass', 
      `Next rotation in ${rotationInfo.formatted}`);
  } else {
    recordTest('Tool Rotation - Next Rotation', 'fail', 'Could not calculate next rotation');
  }

} catch (error) {
  recordTest('Tool Rotation - System', 'fail', error.message, { stack: error.stack });
}

// Test 2: AI Tour Guide System
console.log('\n📋 Testing AI Tour Guide System...\n');

try {
  // Test tour initialization
  const startResult = aiTourGuide.start();
  if (startResult && startResult.stepNumber === 1) {
    recordTest('AI Tour - Initialization', 'pass', 'Tour started successfully');
  } else {
    recordTest('AI Tour - Initialization', 'fail', 'Tour start failed');
  }

  // Test step navigation
  const step1 = aiTourGuide.getCurrentStepData();
  const step2 = aiTourGuide.next();
  const step3 = aiTourGuide.next();
  
  if (step1 && step2 && step3 && step2.stepNumber === 2 && step3.stepNumber === 3) {
    recordTest('AI Tour - Navigation', 'pass', 'Step navigation working');
  } else {
    recordTest('AI Tour - Navigation', 'fail', 'Step navigation failed');
  }

  // Test progress tracking
  const progress = aiTourGuide.getProgress();
  if (progress > 0 && progress <= 100) {
    recordTest('AI Tour - Progress Tracking', 'pass', `Progress: ${progress}%`);
  } else {
    recordTest('AI Tour - Progress Tracking', 'fail', 'Progress calculation failed');
  }

  // Test previous navigation
  aiTourGuide.previous();
  const backStep = aiTourGuide.getCurrentStepData();
  if (backStep && backStep.stepNumber === 2) {
    recordTest('AI Tour - Previous Navigation', 'pass', 'Previous navigation working');
  } else {
    recordTest('AI Tour - Previous Navigation', 'fail', 'Previous navigation failed');
  }

  // Test skip
  aiTourGuide.skip();
  const afterSkip = aiTourGuide.getCurrentStepData();
  if (!afterSkip || !aiTourGuide.isActive) {
    recordTest('AI Tour - Skip', 'pass', 'Tour skip working');
  } else {
    recordTest('AI Tour - Skip', 'fail', 'Tour skip failed');
  }

  // Test reset
  aiTourGuide.reset();
  aiTourGuide.start();
  const resetStep = aiTourGuide.getCurrentStepData();
  if (resetStep && resetStep.stepNumber === 1) {
    recordTest('AI Tour - Reset', 'pass', 'Tour reset working');
  } else {
    recordTest('AI Tour - Reset', 'fail', 'Tour reset failed');
  }

  // Test completion
  while (aiTourGuide.isActive && aiTourGuide.currentStep < aiTourGuide.tourSteps.length - 1) {
    aiTourGuide.next();
  }
  const completed = aiTourGuide.complete();
  if (completed && completed.completed && completed.progress === 100) {
    recordTest('AI Tour - Completion', 'pass', 'Tour completion working');
  } else {
    recordTest('AI Tour - Completion', 'fail', 'Tour completion failed');
  }

  // Reset for next tests
  aiTourGuide.reset();

} catch (error) {
  recordTest('AI Tour - System', 'fail', error.message, { stack: error.stack });
}

// Test 3: Content Audit Script Availability
console.log('\n📋 Testing Content Audit System...\n');

try {
  const auditScriptPath = path.join(__dirname, 'content-audit-and-migration.js');
  if (fs.existsSync(auditScriptPath)) {
    recordTest('Content Audit - Script Exists', 'pass', 'Content audit script available');
  } else {
    recordTest('Content Audit - Script Exists', 'fail', 'Content audit script not found');
  }

  const migrationScriptPath = path.join(__dirname, 'migrate-content-to-matrix.js');
  if (fs.existsSync(migrationScriptPath)) {
    recordTest('Content Migration - Script Exists', 'pass', 'Migration script available');
  } else {
    recordTest('Content Migration - Script Exists', 'fail', 'Migration script not found');
  }

} catch (error) {
  recordTest('Content Audit - System', 'fail', error.message);
}

// Test 4: Matrix Engine Integration
console.log('\n📋 Testing Matrix Engine Integration...\n');

try {
  const matrixEnginePath = path.join(__dirname, '../core/matrix-engine.js');
  if (fs.existsSync(matrixEnginePath)) {
    recordTest('Matrix Engine - Available', 'pass', 'Matrix engine module exists');
    
    // Test numerological calculation
    const matrixEngineModule = await import('../core/matrix-engine.js');
    const MatrixEngine = matrixEngineModule.MatrixEngine || matrixEngineModule.default;
    
    // Create instance to test (Firebase backend not needed for this test)
    const matrixEngine = new MatrixEngine(null);
    const numValue = matrixEngine.calculateNumerologicalValue('Anxiety');
    if (typeof numValue === 'number' && numValue > 0 && numValue <= 33) {
      recordTest('Matrix Engine - Numerology', 'pass', `Numerological value: ${numValue}`);
    } else {
      recordTest('Matrix Engine - Numerology', 'fail', 'Invalid numerological value');
    }
  } else {
    recordTest('Matrix Engine - Available', 'fail', 'Matrix engine not found');
  }
} catch (error) {
  recordTest('Matrix Engine - Integration', 'fail', error.message);
}

// Test 5: Documentation
console.log('\n📋 Testing Documentation...\n');

try {
  const docsDir = path.join(__dirname, '../docs');
  const requiredDocs = [
    'UX_REDESIGN_SPECIFICATIONS.md',
    'IMPLEMENTATION_GUIDE.md',
    'SELF_RESONATING_SEO_MATRIX_DESIGN.md'
  ];

  requiredDocs.forEach(doc => {
    const docPath = path.join(docsDir, doc);
    if (fs.existsSync(docPath)) {
      recordTest(`Documentation - ${doc}`, 'pass', 'Documentation exists');
    } else {
      recordTest(`Documentation - ${doc}`, 'fail', 'Documentation missing');
    }
  });
} catch (error) {
  recordTest('Documentation - System', 'fail', error.message);
}

// Test 6: Example Components
console.log('\n📋 Testing Example Components...\n');

try {
  const componentsDir = path.join(__dirname, '../components');
  const requiredComponents = [
    'TourOverlay.jsx.example',
    'TourOverlay.css.example',
    'CitationBadge.jsx.example',
    'CitationBadge.css.example'
  ];

  requiredComponents.forEach(comp => {
    const compPath = path.join(componentsDir, comp);
    if (fs.existsSync(compPath)) {
      recordTest(`Components - ${comp}`, 'pass', 'Component example exists');
    } else {
      recordTest(`Components - ${comp}`, 'fail', 'Component example missing');
    }
  });
} catch (error) {
  recordTest('Components - System', 'fail', error.message);
}

// Generate Test Report
console.log('\n' + '='.repeat(70));
console.log('Test Summary');
console.log('='.repeat(70));
console.log(`✅ Passed: ${testResults.summary.passed}`);
console.log(`❌ Failed: ${testResults.summary.failed}`);
console.log(`⚠️  Warnings: ${testResults.summary.warnings}`);
console.log(`📊 Total Tests: ${testResults.tests.length}\n`);

// Save test results
const resultsDir = path.join(__dirname, '../logs/test-results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

const resultsFile = path.join(
  resultsDir,
  `redesign-sandbox-test-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
);

fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
console.log(`📄 Test results saved: ${resultsFile}\n`);

// Overall status
const allPassed = testResults.summary.failed === 0;
if (allPassed) {
  console.log('='.repeat(70));
  console.log('✅ ALL TESTS PASSED - Ready for Deployment!');
  console.log('='.repeat(70) + '\n');
  process.exit(0);
} else {
  console.log('='.repeat(70));
  console.log('⚠️  SOME TESTS FAILED - Review before deployment');
  console.log('='.repeat(70) + '\n');
  process.exit(1);
}

