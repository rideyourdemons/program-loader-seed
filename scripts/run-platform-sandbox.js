#!/usr/bin/env node

/**
 * Run Platform in Sandbox with New Upgrades
 * Demonstrates all new features: tool rotation, AI tour, matrix system, etc.
 */

import toolRotation from '../core/tool-rotation.js';
import AITourGuideModule from '../core/ai-tour-guide.js';
import MatrixEngineModule from '../core/matrix-engine.js';
import AuthorityEngineModule from '../core/authority-engine.js';
import { logger } from '../core/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Handle exports
const AITourGuide = AITourGuideModule.AITourGuide || AITourGuideModule.default || AITourGuideModule;
const MatrixEngine = MatrixEngineModule.MatrixEngine || MatrixEngineModule.default || MatrixEngineModule;
const AuthorityEngine = AuthorityEngineModule.AuthorityEngine || AuthorityEngineModule.default || AuthorityEngineModule;

let rl = null;

function createReadline() {
  // Check if stdin is available and is a TTY
  if (!process.stdin.isTTY) {
    throw new Error('Not running in an interactive terminal. Please run this script directly in a terminal.');
  }
  
  if (!rl || rl.closed) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  return rl;
}

function question(prompt) {
  return new Promise((resolve, reject) => {
    try {
      const rlInterface = createReadline();
      if (!rlInterface || rlInterface.closed) {
        reject(new Error('Readline interface is not available'));
        return;
      }
      rlInterface.question(prompt, resolve);
    } catch (error) {
      reject(error);
    }
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Mock data for sandbox
const mockTools = [
  {
    id: 'tool-1',
    title: 'Breathing Exercise',
    description: 'A simple breathing technique to reduce anxiety',
    duration: '5 minutes',
    difficulty: 'beginner',
    steps: [
      'Sit comfortably',
      'Inhale for 4 counts',
      'Hold for 4 counts',
      'Exhale for 4 counts',
      'Repeat 5 times'
    ]
  },
  {
    id: 'tool-2',
    title: 'Grounding Technique',
    description: '5-4-3-2-1 grounding method',
    duration: '3 minutes',
    difficulty: 'beginner',
    steps: [
      'Name 5 things you can see',
      'Name 4 things you can touch',
      'Name 3 things you can hear',
      'Name 2 things you can smell',
      'Name 1 thing you can taste'
    ]
  },
  {
    id: 'tool-3',
    title: 'Progressive Muscle Relaxation',
    description: 'Release tension through muscle relaxation',
    duration: '10 minutes',
    difficulty: 'intermediate',
    steps: [
      'Tense and hold each muscle group',
      'Release and feel the relaxation',
      'Move through all major muscle groups',
      'Focus on the contrast between tension and relaxation'
    ]
  },
  {
    id: 'tool-4',
    title: 'Cognitive Reframing',
    description: 'Change your perspective on challenging thoughts',
    duration: '10-15 minutes',
    difficulty: 'intermediate',
    steps: [
      'Identify the negative thought',
      'Question its validity',
      'Consider alternative perspectives',
      'Reframe the thought positively'
    ]
  },
  {
    id: 'tool-5',
    title: 'Mindful Meditation',
    description: 'Practice present-moment awareness',
    duration: '10 minutes',
    difficulty: 'beginner',
    steps: [
      'Find a quiet space',
      'Focus on your breath',
      'Notice thoughts without judgment',
      'Return focus to breath when distracted'
    ]
  }
];

const mockPainPoints = [
  { id: 'pp-1', title: 'Anxiety', searchVolume: 450000, tools: ['tool-1', 'tool-2'] },
  { id: 'pp-2', title: 'Stress', searchVolume: 600000, tools: ['tool-3', 'tool-4'] },
  { id: 'pp-3', title: 'Sleep Issues', searchVolume: 300000, tools: ['tool-5', 'tool-1'] }
];

/**
 * Display tool of the day
 */
async function showToolOfTheDay() {
  console.log('\n' + '='.repeat(70));
  console.log('🔄 Tool of the Day (Rotates Daily)');
  console.log('='.repeat(70) + '\n');
  
  const todayTool = toolRotation.getToolOfTheDay(mockTools);
  const rotationInfo = toolRotation.getNextRotationInfo();
  
  console.log(`✨ Featured Tool: ${todayTool.title}`);
  console.log(`   ${todayTool.description}`);
  console.log(`   Duration: ${todayTool.duration} | Difficulty: ${todayTool.difficulty}`);
  console.log(`\n   Next rotation in: ${rotationInfo.formatted}\n`);
  
  console.log('📋 Quick Preview:');
  todayTool.steps.slice(0, 3).forEach((step, index) => {
    console.log(`   ${index + 1}. ${step}`);
  });
  console.log(`   ... and ${todayTool.steps.length - 3} more steps\n`);
  
  console.log('💡 Feature: Tool automatically rotates daily for fresh content!\n');
  
  await question('Press Enter to continue...');
}

/**
 * Show tool rotation schedule
 */
async function showRotationSchedule() {
  console.log('\n' + '='.repeat(70));
  console.log('📅 Tool Rotation Schedule');
  console.log('='.repeat(70) + '\n');
  
  const daysInput = await question('How many days to show? (default: 7): ');
  const days = parseInt(daysInput) || 7;
  
  const schedule = toolRotation.getRotationSchedule(mockTools, days);
  
  console.log(`\nRotation Schedule (Next ${days} Days):\n`);
  schedule.forEach(day => {
    const date = new Date(day.date);
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const marker = day.isToday ? '⭐ TODAY' : '  ';
    console.log(`   ${marker} ${dateStr.padEnd(15)} → ${day.tool.title} (index: ${day.toolIndex})`);
  });
  
  // Show distribution
  const toolCounts = {};
  schedule.forEach(day => {
    const toolId = day.tool.id;
    toolCounts[toolId] = (toolCounts[toolId] || 0) + 1;
  });
  
  console.log('\n📊 Distribution:');
  Object.entries(toolCounts).forEach(([toolId, count]) => {
    const tool = mockTools.find(t => t.id === toolId);
    const bar = '█'.repeat(count);
    console.log(`   ${tool.title.padEnd(30)} ${bar} (${count} days)`);
  });
  
  console.log('\n💡 Feature: Equal distribution ensures all tools get featured!\n');
  
  await question('Press Enter to continue...');
}

/**
 * Test rotation with custom dates
 */
async function testRotationWithDates() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 Test Rotation with Custom Dates');
  console.log('='.repeat(70) + '\n');
  
  console.log('Testing rotation consistency across different dates...\n');
  
  // Test today
  const today = new Date();
  const todayTool = toolRotation.getToolOfTheDay(mockTools, today);
  console.log(`📅 Today (${today.toLocaleDateString()}): ${todayTool.title}`);
  
  // Test specific dates
  const testDates = [
    new Date('2025-12-25'),
    new Date('2025-12-26'),
    new Date('2026-01-01'),
    new Date('2026-01-15'),
    new Date('2026-02-14')
  ];
  
  console.log('\n📆 Testing specific dates:\n');
  testDates.forEach(date => {
    const tool = toolRotation.getToolOfTheDay(mockTools, date);
    console.log(`   ${date.toLocaleDateString().padEnd(12)} → ${tool.title} (index: ${toolRotation.getToolIndexForDate(date, mockTools.length)})`);
  });
  
  // Test consistency - same date should return same tool
  console.log('\n✅ Consistency Test:\n');
  const testDate = new Date('2025-12-25');
  const tool1 = toolRotation.getToolOfTheDay(mockTools, testDate);
  const tool2 = toolRotation.getToolOfTheDay(mockTools, testDate);
  const tool3 = toolRotation.getToolOfTheDay(mockTools, new Date('2025-12-25'));
  
  if (tool1.id === tool2.id && tool2.id === tool3.id) {
    console.log(`   ✓ Same date returns same tool: ${tool1.title}`);
  } else {
    console.log(`   ✗ INCONSISTENT: Same date returned different tools!`);
  }
  
  // Test custom date input
  console.log('\n🔍 Test your own date:');
  const dateInput = await question('Enter date (YYYY-MM-DD) or press Enter to skip: ');
  if (dateInput.trim()) {
    try {
      const customDate = new Date(dateInput.trim());
      if (!isNaN(customDate.getTime())) {
        const customTool = toolRotation.getToolOfTheDay(mockTools, customDate);
        console.log(`\n   ${customDate.toLocaleDateString()} → ${customTool.title}`);
      } else {
        console.log('   Invalid date format');
      }
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }
  }
  
  console.log('\n');
  await question('Press Enter to continue...');
}

/**
 * Verify rotation distribution
 */
async function verifyRotationDistribution() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 Verify Rotation Distribution');
  console.log('='.repeat(70) + '\n');
  
  const daysInput = await question('How many days to test? (default: 30): ');
  const testDays = parseInt(daysInput) || 30;
  
  console.log(`\nTesting distribution over ${testDays} days...\n`);
  
  const verification = toolRotation.verifyRotation(mockTools, testDays);
  
  if (!verification.valid) {
    console.log(`❌ Verification failed: ${verification.error}\n`);
    await question('Press Enter to continue...');
    return;
  }
  
  console.log('✅ Verification Results:\n');
  console.log(`   Test Period: ${testDays} days`);
  console.log(`   Tools: ${mockTools.length}`);
  console.log(`   Expected count per tool: ~${verification.distribution.expected}`);
  console.log(`   Actual range: ${verification.distribution.min} - ${verification.distribution.max}`);
  console.log(`   Variance: ${verification.distribution.variance}`);
  console.log(`   Distribution: ${verification.distribution.isEven ? '✅ EVEN' : '⚠️  UNEVEN'}\n`);
  
  console.log('📊 Tool Counts:\n');
  Object.entries(verification.toolCounts).forEach(([index, count]) => {
    const tool = mockTools[parseInt(index)];
    const percentage = ((count / testDays) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count / testDays * 20));
    console.log(`   ${tool.title.padEnd(30)} ${bar.padEnd(20)} ${count.toString().padStart(3)} days (${percentage}%)`);
  });
  
  // Show sample schedule
  console.log('\n📅 Sample Schedule (first 14 days):\n');
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const testDate = new Date(today);
    testDate.setDate(today.getDate() + i);
    const tool = toolRotation.getToolOfTheDay(mockTools, testDate);
    const dateStr = testDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    console.log(`   ${dateStr.padEnd(15)} → ${tool.title}`);
  }
  
  console.log('\n');
  await question('Press Enter to continue...');
}

/**
 * Simulate rotation over time
 */
async function simulateRotationOverTime() {
  console.log('\n' + '='.repeat(70));
  console.log('⏱️  Simulate Rotation Over Time');
  console.log('='.repeat(70) + '\n');
  
  console.log('This simulates how tools rotate day by day...\n');
  
  const daysInput = await question('How many days to simulate? (default: 14): ');
  const days = parseInt(daysInput) || 14;
  
  const startDate = new Date();
  console.log(`\nStarting from: ${startDate.toLocaleDateString()}\n`);
  
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    const tool = toolRotation.getToolOfTheDay(mockTools, currentDate);
    const rotationInfo = toolRotation.getNextRotationInfo();
    
    const dateStr = currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    
    if (i === 0) {
      console.log(`📅 Day ${i + 1} - ${dateStr}`);
      console.log(`   Tool: ${tool.title}`);
      console.log(`   Next rotation: ${rotationInfo.formatted}\n`);
    } else {
      console.log(`📅 Day ${i + 1} - ${dateStr}`);
      console.log(`   Tool: ${tool.title}\n`);
    }
    
    if (i < days - 1) {
      await sleep(800);
    }
  }
  
  console.log('✅ Simulation complete!\n');
  await question('Press Enter to continue...');
}

/**
 * Demonstrate AI Tour Guide
 */
async function demonstrateAITour() {
  console.log('\n' + '='.repeat(70));
  console.log('🤖 AI-Guided Tour System');
  console.log('='.repeat(70) + '\n');
  
  console.log('Starting tour...\n');
  await sleep(500);
  
  const tourGuide = new AITourGuide();
  tourGuide.start();
  
  // Step through tour
  for (let i = 0; i < tourGuide.tourSteps.length; i++) {
    const step = tourGuide.getCurrentStepData();
    const progress = tourGuide.getProgress();
    
    console.log(`Step ${step.stepNumber}/${step.totalSteps} (${progress}% complete)`);
    console.log(`📍 ${step.title}`);
    console.log(`   ${step.content}\n`);
    
    if (i < tourGuide.tourSteps.length - 1) {
      await sleep(1000);
      tourGuide.next();
    }
  }
  
  // Complete tour
  const completed = tourGuide.complete();
  console.log('='.repeat(70));
  console.log('✅ Tour Completed!');
  console.log(`   Progress: ${completed.progress}%`);
  console.log(`   Steps completed: ${completed.stepsCompleted}/${completed.totalSteps}`);
  console.log(`   Completion time: ${completed.completionTime}ms\n`);
  
  console.log('💡 Features:');
  console.log('   - Step-by-step guidance with progress tracking');
  console.log('   - Previous/Next navigation');
  console.log('   - Skip and resume capability');
  console.log('   - Completion state persistence\n');
  
  await question('Press Enter to continue...');
}

/**
 * Show matrix system
 */
async function showMatrixSystem() {
  console.log('\n' + '='.repeat(70));
  console.log('🔗 Self-Resonating SEO Matrix System');
  console.log('='.repeat(70) + '\n');
  
  const matrix = new MatrixEngine(null);
  
  console.log('Pain Points → Tools → Research Flow:\n');
  
  for (const painPoint of mockPainPoints) {
    console.log(`📌 ${painPoint.title}`);
    console.log(`   Search Volume: ${painPoint.searchVolume.toLocaleString()}/month`);
    
    // Calculate numerological value
    const numValue = matrix.calculateNumerologicalValue(painPoint.title);
    console.log(`   Numerological Value: ${numValue}`);
    
    // Show connected tools
    const connectedTools = painPoint.tools.map(toolId => 
      mockTools.find(t => t.id === toolId)
    ).filter(Boolean);
    
    console.log(`   Connected Tools (${connectedTools.length}):`);
    connectedTools.forEach(tool => {
      console.log(`      • ${tool.title}`);
    });
    
    console.log('');
  }
  
  console.log('💡 Features:');
  console.log('   - Pain points connect to multiple tools');
  console.log('   - Tools link to research and citations');
  console.log('   - Numerology integration for meaningful connections');
  console.log('   - Self-resonating system strengthens with each search\n');
  
  await question('Press Enter to continue...');
}

/**
 * Show authority system
 */
async function showAuthoritySystem() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 Authority & E-A-T Scoring System');
  console.log('='.repeat(70) + '\n');
  
  const authority = new AuthorityEngine(null);
  
  for (const painPoint of mockPainPoints) {
    // Simulate authority score calculation
    const score = Math.floor(Math.random() * 30) + 70; // Mock score 70-100
    
    console.log(`📌 ${painPoint.title}`);
    console.log(`   Authority Score: ${score}/100`);
    console.log(`   Search Volume: ${painPoint.searchVolume.toLocaleString()}/month`);
    console.log(`   Tools Available: ${painPoint.tools.length}`);
    console.log(`   Status: ${score >= 80 ? 'High Authority ✅' : score >= 70 ? 'Good Authority ✓' : 'Building Authority'}`);
    console.log('');
  }
  
  console.log('💡 Features:');
  console.log('   - Multi-factor authority scoring (0-100)');
  console.log('   - E-A-T (Expertise, Authoritativeness, Trustworthiness) signals');
  console.log('   - Authority grows with searches and engagement');
  console.log('   - Content gap detection and recommendations\n');
  
  await question('Press Enter to continue...');
}

/**
 * Show UX improvements preview
 */
async function showUXPreview() {
  console.log('\n' + '='.repeat(70));
  console.log('🎨 UX Improvements Preview');
  console.log('='.repeat(70) + '\n');
  
  console.log('Key Improvements:\n');
  console.log('✅ Reduced Visual Clutter');
  console.log('   - Cleaner homepage layout');
  console.log('   - More whitespace and breathing room');
  console.log('   - Simplified navigation\n');
  
  console.log('✅ Progressive Disclosure');
  console.log('   - Tools expand on click (not all visible at once)');
  console.log('   - Research sections are collapsible');
  console.log('   - Step-by-step workthroughs\n');
  
  console.log('✅ Better Content Organization');
  console.log('   - Card-based layouts');
  console.log('   - Clear visual hierarchy');
  console.log('   - Consistent spacing system\n');
  
  console.log('✅ Improved Citations');
  console.log('   - Research-backed badges');
  console.log('   - Expandable citation details');
  console.log('   - Proper source attribution\n');
  
  console.log('✅ Enhanced Navigation');
  console.log('   - AI-guided tour for new users');
  console.log('   - Clear breadcrumbs');
  console.log('   - Tool of the day rotation\n');
  
  console.log('📚 Full specifications: docs/UX_REDESIGN_SPECIFICATIONS.md\n');
  
  await question('Press Enter to continue...');
}

/**
 * Interactive menu
 */
async function showMenu() {
  console.log('\n' + '='.repeat(70));
  console.log('Sandbox Menu - Tool Rotation Testing');
  console.log('='.repeat(70) + '\n');
  console.log('TOOL ROTATION TESTS:');
  console.log('1. 🔄 Tool of the Day (Current)');
  console.log('2. 📅 Tool Rotation Schedule');
  console.log('3. 🧪 Test Rotation with Custom Dates');
  console.log('4. 📊 Verify Rotation Distribution');
  console.log('5. ⏱️  Simulate Rotation Over Time');
  console.log('\nOTHER FEATURES:');
  console.log('6. 🤖 AI-Guided Tour System');
  console.log('7. 🔗 SEO Matrix System');
  console.log('8. 📈 Authority Scoring System');
  console.log('9. 🎨 UX Improvements Preview');
  console.log('10. 🎬 Run All Demos');
  console.log('11. ❌ Exit\n');
}

/**
 * Main sandbox runner
 */
async function runSandbox() {
  try {
    // Check if running in interactive terminal
    if (typeof process.stdin.isTTY === 'undefined' || !process.stdin.isTTY) {
      console.log('\n' + '='.repeat(70));
      console.log('⚠️  Interactive Terminal Required');
      console.log('='.repeat(70) + '\n');
      console.log('This sandbox requires an interactive terminal.');
      console.log('Please run this command directly in your terminal:\n');
      console.log('   npm run sandbox-interactive\n');
      console.log('Or use the non-interactive demo version:\n');
      console.log('   npm run sandbox\n');
      process.exit(1);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('RYD Platform Sandbox - Tool Rotation Testing');
    console.log('='.repeat(70) + '\n');
    
    console.log('Welcome to the RYD Platform Sandbox!');
    console.log('Test and navigate the tool rotation system before going live.\n');
    console.log('Available Tools:');
    mockTools.forEach((tool, index) => {
      console.log(`   ${index + 1}. ${tool.title}`);
    });
    console.log('');
    
    await sleep(1000);
    
    let running = true;
    
    while (running) {
      await showMenu();
      const choice = await question('Select option (1-11): ');
      
      switch(choice) {
        case '1':
          await showToolOfTheDay();
          break;
        case '2':
          await showRotationSchedule();
          break;
        case '3':
          await testRotationWithDates();
          break;
        case '4':
          await verifyRotationDistribution();
          break;
        case '5':
          await simulateRotationOverTime();
          break;
        case '6':
          await demonstrateAITour();
          break;
        case '7':
          await showMatrixSystem();
          break;
        case '8':
          await showAuthoritySystem();
          break;
        case '9':
          await showUXPreview();
          break;
        case '10':
          console.log('\n🎬 Running all demos...\n');
          await showToolOfTheDay();
          await showRotationSchedule();
          await testRotationWithDates();
          await verifyRotationDistribution();
          await demonstrateAITour();
          await showMatrixSystem();
          await showAuthoritySystem();
          await showUXPreview();
          break;
        case '11':
          running = false;
          break;
        default:
          console.log('\n⚠️  Invalid option. Please select 1-11.\n');
          await sleep(500);
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('Sandbox Session Complete!');
    console.log('='.repeat(70) + '\n');
    
    console.log('📚 Documentation:');
    console.log('   - docs/IMPLEMENTATION_GUIDE.md');
    console.log('   - docs/UX_REDESIGN_SPECIFICATIONS.md');
    console.log('   - RYD_REDESIGN_IMPLEMENTATION_SUMMARY.md\n');
    
    console.log('🔧 Next Steps:');
    console.log('   1. Integrate features into your React app');
    console.log('   2. Run content audit: npm run content-audit');
    console.log('   3. Apply UX improvements');
    console.log('   4. Deploy to production\n');
    
    logger.info('Sandbox session completed');
    
  } catch (error) {
    console.error('\n❌ Sandbox error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    if (rl && !rl.closed) {
      try {
        rl.close();
      } catch (error) {
        // Ignore close errors
      }
    }
  }
}

// Run sandbox
runSandbox().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

