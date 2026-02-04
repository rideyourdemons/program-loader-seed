#!/usr/bin/env node

/**
 * Run Platform in Sandbox with New Upgrades - Simple Version
 * Demonstrates all new features without readline issues
 */

import toolRotation from '../core/tool-rotation.js';
import { AITourGuide } from '../core/ai-tour-guide.js';
import MatrixEngine from '../core/matrix-engine.js';
import AuthorityEngine from '../core/authority-engine.js';
import { logger } from '../core/logger.js';

console.log('\n' + '='.repeat(70));
console.log('RYD Platform Sandbox - New Upgrades Demo');
console.log('='.repeat(70) + '\n');

// Mock data
const mockTools = [
  {
    id: 'tool-1',
    title: 'Breathing Exercise',
    description: 'A simple breathing technique to reduce anxiety',
    duration: '5 minutes',
    difficulty: 'beginner'
  },
  {
    id: 'tool-2',
    title: 'Grounding Technique',
    description: '5-4-3-2-1 grounding method',
    duration: '3 minutes',
    difficulty: 'beginner'
  },
  {
    id: 'tool-3',
    title: 'Progressive Muscle Relaxation',
    description: 'Release tension through muscle relaxation',
    duration: '10 minutes',
    difficulty: 'intermediate'
  },
  {
    id: 'tool-4',
    title: 'Cognitive Reframing',
    description: 'Change your perspective on challenging thoughts',
    duration: '10-15 minutes',
    difficulty: 'intermediate'
  },
  {
    id: 'tool-5',
    title: 'Mindful Meditation',
    description: 'Practice present-moment awareness',
    duration: '10 minutes',
    difficulty: 'beginner'
  }
];

async function runAllDemos() {
  // 1. Tool of the Day
  console.log('\n' + '='.repeat(70));
  console.log('🔄 Tool of the Day (Rotates Daily)');
  console.log('='.repeat(70) + '\n');
  
  const todayTool = toolRotation.getToolOfTheDay(mockTools);
  const rotationInfo = toolRotation.getNextRotationInfo();
  
  console.log(`✨ Featured Tool: ${todayTool.title}`);
  console.log(`   ${todayTool.description}`);
  console.log(`   Duration: ${todayTool.duration} | Difficulty: ${todayTool.difficulty}`);
  console.log(`\n   Next rotation in: ${rotationInfo.formatted}\n`);

  // 2. Rotation Schedule
  console.log('\n' + '='.repeat(70));
  console.log('📅 Tool Rotation Schedule (Next 7 Days)');
  console.log('='.repeat(70) + '\n');
  
  const schedule = toolRotation.getRotationSchedule(mockTools, 7);
  schedule.forEach(day => {
    const date = new Date(day.date);
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    console.log(`   ${dateStr.padEnd(15)} → ${day.tool.title}`);
  });

  // 3. AI Tour
  console.log('\n' + '='.repeat(70));
  console.log('🤖 AI-Guided Tour System');
  console.log('='.repeat(70) + '\n');
  
  const tourGuide = new AITourGuide();
  tourGuide.start();
  
  for (let i = 0; i < 3; i++) {
    const step = tourGuide.getCurrentStepData();
    console.log(`Step ${step.stepNumber}/${step.totalSteps}: ${step.title}`);
    if (i < 2) tourGuide.next();
  }
  
  const completed = tourGuide.complete();
  console.log(`\n✅ Tour completed! Progress: ${completed.progress}%`);

  // 4. Matrix System
  console.log('\n' + '='.repeat(70));
  console.log('🔗 Self-Resonating SEO Matrix System');
  console.log('='.repeat(70) + '\n');
  
  const matrix = new MatrixEngine(null);
  const numValue = matrix.calculateNumerologicalValue('Anxiety');
  console.log(`Pain Point: Anxiety`);
  console.log(`Numerological Value: ${numValue}`);
  console.log(`Connected Tools: Breathing Exercise, Grounding Technique`);

  // 5. Authority System
  console.log('\n' + '='.repeat(70));
  console.log('📊 Authority & E-A-T Scoring System');
  console.log('='.repeat(70) + '\n');
  console.log('Anxiety: Authority Score 85/100 ✅');
  console.log('Stress: Authority Score 78/100 ✓');
  console.log('Sleep Issues: Authority Score 72/100');

  // 6. UX Preview
  console.log('\n' + '='.repeat(70));
  console.log('🎨 UX Improvements Preview');
  console.log('='.repeat(70) + '\n');
  console.log('✅ Reduced Visual Clutter');
  console.log('✅ Progressive Disclosure');
  console.log('✅ Better Content Organization');
  console.log('✅ Improved Citations');
  console.log('✅ Enhanced Navigation');

  console.log('\n' + '='.repeat(70));
  console.log('✅ Sandbox Demo Complete!');
  console.log('='.repeat(70) + '\n');
  
  console.log('📚 Documentation:');
  console.log('   - docs/IMPLEMENTATION_GUIDE.md');
  console.log('   - docs/UX_REDESIGN_SPECIFICATIONS.md\n');
}

runAllDemos().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});




