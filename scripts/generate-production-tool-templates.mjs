#!/usr/bin/env node
/**
 * Generate Production-Grade Tool Templates
 * Phase 2: Content Replacement Protocol
 * 
 * Creates 5-10 production-grade tool examples with full RYD structure:
 * 1. Tool Name
 * 2. The Lock (specific behavioral/emotional trap)
 * 3. The Trigger (real activation scenario)
 * 4. The Cost (clear lived consequences)
 * 5. The Tool (step-by-step executable instructions)
 * 6. How & Why This Works (mechanism-based explanation)
 * 7. Where It Came From (real, verifiable origin)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * Production-grade tool template following RYD structure
 */
function createProductionTool(toolId, baseTool) {
  // This is a template - actual content would be written by human with lived experience
  // For now, creating structure that shows what's required
  
  return {
    id: toolId,
    slug: baseTool.slug || toolId,
    title: baseTool.title,
    
    // REQUIRED: Disclaimer
    disclaimer: "The information provided is for educational purposes and is not a substitute for professional medical advice.",
    
    // RYD Production Structure
    
    // 1. Tool Name (already in title)
    
    // 2. The Lock - specific behavioral/emotional trap
    theLock: `[REQUIRED: 150-200 words describing the specific behavioral or emotional trap this tool addresses. Must be concrete, not abstract. Example: "The trap of believing that if you just think harder, you'll solve the problem, when actually the problem is that thinking has become a form of avoidance."]`,
    
    // 3. The Trigger - real activation scenario
    theTrigger: `[REQUIRED: 100-150 words describing a specific, real scenario where someone would use this tool. Must be concrete and relatable. Example: "You're sitting at your desk at 3pm, and you realize you've been scrolling social media for 45 minutes instead of working on the project that's due tomorrow. You feel a wave of shame, then immediately start thinking about how you're going to explain this to your boss."]`,
    
    // 4. The Cost - clear lived consequences
    theCost: `[REQUIRED: 100-150 words describing the real, lived consequences of staying in the lock. Must be specific and concrete. Example: "When this pattern continues, you end up working until 2am, sleep for 4 hours, show up to work exhausted, make mistakes, get feedback that you're not meeting expectations, feel more shame, and the cycle intensifies. Your relationships suffer because you're too tired to be present. Your health suffers because you're not sleeping. Your career suffers because you're not performing."]`,
    
    // 5. The Tool - step-by-step executable instructions
    steps: [
      {
        stepNumber: 1,
        title: "[REQUIRED: Specific action title]",
        instruction: "[REQUIRED: Concrete, executable instruction. Not 'think about' but 'write down' or 'stand up and' or 'set a timer for' - something you can actually do.]",
        tips: [
          "[Optional: Specific tip that helps with this step]"
        ]
      }
      // Minimum 5 steps required, each must be executable
    ],
    
    // 6. How & Why This Works - mechanism-based explanation
    how_it_works: `[REQUIRED: 200-300 words explaining the mechanism. Must be grounded in psychology, neuroscience, or behavioral science. No therapy jargon. Must explain WHY it works, not just that it works. Example: "This works because when you're stuck in a thinking loop, your prefrontal cortex is overactive and your body is in a state of low-level threat response. The physical action of standing up and moving interrupts the neural pattern, shifts your body state, and gives your prefrontal cortex a break. When you return to the task, your brain has reset and you can access different neural pathways."]`,
    
    // 7. Where It Came From - real, verifiable origin
    where_it_came_from: {
      origin: "[REQUIRED: Real origin. Examples: 'Developed from Acceptance and Commitment Therapy (ACT) principles, specifically the work of Steven Hayes on cognitive defusion.' OR 'Adapted from lived experience of managing anxiety attacks, combined with research on polyvagal theory by Stephen Porges.' OR 'Based on behavioral activation research, specifically the work of Martell, Dimidjian, and Herman-Dunn (2010).']",
      basis: "[REQUIRED: What it's based on - research, lived experience, or combination]",
      source_type: "[REQUIRED: 'research-based', 'lived-experience', or 'research-and-experience']",
      verified: true,
      citations: [
        "[If research-based: Full citation in APA format]"
      ]
    },
    
    // Additional required fields
    description: `[REQUIRED: 100-150 word description that doesn't use generic language. Must be specific to this tool.]`,
    
    // Walkthroughs (5, 15, 30 min versions)
    walkthroughs: [
      {
        title: "Quick Workthrough (5 min)",
        steps: [
          "[REQUIRED: 5 concrete, executable steps that can be completed in 5 minutes]"
        ]
      },
      {
        title: "Standard Workthrough (15 min)",
        steps: [
          "[REQUIRED: 8-10 concrete, executable steps that can be completed in 15 minutes]"
        ]
      },
      {
        title: "Deep Workthrough (30 min)",
        steps: [
          "[REQUIRED: 12-15 concrete, executable steps that can be completed in 30 minutes]"
        ]
      }
    ],
    
    // Metadata
    duration: "5-30 minutes",
    difficulty: "beginner",
    category: baseTool.category || "emotional-regulation",
    
    // Word count target: 700-1,200 words total
    // This template structure ensures all required sections are present
  };
}

/**
 * Generate production templates for sample tools
 */
function generateTemplates() {
  const toolsFile = path.join(PROJECT_ROOT, 'public', 'data', 'tools-canonical.json');
  
  if (!fs.existsSync(toolsFile)) {
    console.error('Tools file not found:', toolsFile);
    process.exit(1);
  }
  
  const toolsData = JSON.parse(fs.readFileSync(toolsFile, 'utf8'));
  const tools = toolsData.tools || [];
  
  // Select 5 diverse tools for templates
  const sampleTools = [
    tools.find(t => t.id === '100year-vision-how-do-i-find-my-purpose'),
    tools.find(t => t.id === '30-second-truth-drop-how-do-i-find-my-voice-after-being-silenced-by-shame'),
    tools.find(t => t.id && t.id.includes('breathing')),
    tools.find(t => t.id && t.id.includes('anxiety')),
    tools.find(t => t.id && t.id.includes('depression'))
  ].filter(Boolean).slice(0, 5);
  
  console.log('\n' + '='.repeat(80));
  console.log('📝 GENERATING PRODUCTION-GRADE TOOL TEMPLATES');
  console.log('='.repeat(80) + '\n');
  
  const templates = sampleTools.map(tool => {
    console.log(`Creating template for: ${tool.title} (${tool.id})`);
    return createProductionTool(tool.id, tool);
  });
  
  // Save templates
  const outputPath = path.join(PROJECT_ROOT, 'PRODUCTION_TOOL_TEMPLATES.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    version: '1.0',
    generated: new Date().toISOString(),
    note: 'These are STRUCTURAL TEMPLATES showing required fields. Actual content must be written by humans with lived experience.',
    templates
  }, null, 2));
  
  console.log(`\n✅ Templates saved to: ${path.relative(PROJECT_ROOT, outputPath)}`);
  console.log(`\n📋 Next Steps:`);
  console.log(`   1. Review templates to understand required structure`);
  console.log(`   2. Write production content for each section`);
  console.log(`   3. Ensure word count is 700-1,200 words per tool`);
  console.log(`   4. Verify all required fields are filled`);
  console.log(`   5. Test with RYD_ToolValidator before deployment\n`);
}

generateTemplates();
