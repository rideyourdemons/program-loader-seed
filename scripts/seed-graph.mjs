#!/usr/bin/env node
/**
 * Seed Graph Data Generator
 * 
 * Creates minimum viable dataset:
 * - 1 Anchor
 * - 12 Gates
 * - 40 Pain Points per Gate
 * - 3 Tools per Pain Point (5-min, 15-min, 30-min workers)
 * 
 * IP RULE: No content dumps in logs. Only counts and IDs.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'public', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Canonical slug normalization
 */
function canonicalSlug(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate Anchor
 */
function generateAnchor() {
  return {
    id: 'mental-health-anchor',
    slug: 'mental-health-anchor',
    title: 'Mental Health & Well-Being',
    description: 'Evidence-based tools and resources for mental health, emotional resilience, and personal growth.',
    isPublic: true,
    createdAt: new Date().toISOString()
  };
}

/**
 * Generate Gates (12 gates)
 */
function generateGates(anchorId) {
  const gateNames = [
    "Men's Mental Health",
    "Women's Mental Health",
    "Addiction Recovery",
    "Fathers & Sons",
    "Teen & Gen Z",
    "Grief & Loss",
    "Financial Collapse & Purpose",
    "Trauma Rebuild",
    "Heartbreak Loop",
    "Identity Crisis",
    "Full Resurrection System",
    "Loneliness"
  ];

  return gateNames.map((name, index) => ({
    id: canonicalSlug(name),
    slug: canonicalSlug(name),
    title: name,
    description: `Tools and resources for ${name.toLowerCase()}.`,
    anchorId,
    gateNumber: index + 1,
    isPublic: true,
    createdAt: new Date().toISOString()
  }));
}

/**
 * Generate Pain Points (40 per gate)
 */
function generatePainPoints(gateId, gateNumber) {
  const painPointTemplates = [
    "How do I stop feeling {emotion}?",
    "How do I deal with {challenge}?",
    "How do I overcome {obstacle}?",
    "How do I build {quality}?",
    "How do I manage {situation}?",
    "How do I find {resource}?",
    "How do I handle {stress}?",
    "How do I improve {aspect}?",
    "How do I recover from {event}?",
    "How do I navigate {transition}?"
  ];

  const variations = [
    { emotion: 'numb', challenge: 'procrastination', obstacle: 'anxiety', quality: 'confidence', situation: 'stress', resource: 'purpose', stress: 'overwhelm', aspect: 'relationships', event: 'loss', transition: 'change' },
    { emotion: 'overwhelmed', challenge: 'anger issues', obstacle: 'depression', quality: 'resilience', situation: 'conflict', resource: 'clarity', stress: 'pressure', aspect: 'self-esteem', event: 'trauma', transition: 'uncertainty' },
    { emotion: 'stuck', challenge: 'self-doubt', obstacle: 'fear', quality: 'discipline', situation: 'crisis', resource: 'direction', stress: 'anxiety', aspect: 'communication', event: 'failure', transition: 'grief' },
    { emotion: 'empty', challenge: 'isolation', obstacle: 'guilt', quality: 'trust', situation: 'loneliness', resource: 'support', stress: 'worry', aspect: 'boundaries', event: 'betrayal', transition: 'identity' }
  ];

  const painPoints = [];
  for (let i = 0; i < 40; i++) {
    const templateIndex = i % painPointTemplates.length;
    const variationIndex = Math.floor(i / painPointTemplates.length) % variations.length;
    const template = painPointTemplates[templateIndex];
    const vars = variations[variationIndex];
    
    const title = template
      .replace('{emotion}', vars.emotion)
      .replace('{challenge}', vars.challenge)
      .replace('{obstacle}', vars.obstacle)
      .replace('{quality}', vars.quality)
      .replace('{situation}', vars.situation)
      .replace('{resource}', vars.resource)
      .replace('{stress}', vars.stress)
      .replace('{aspect}', vars.aspect)
      .replace('{event}', vars.event)
      .replace('{transition}', vars.transition);
    
    const id = canonicalSlug(title);
    painPoints.push({
      id,
      slug: id,
      title,
      description: `Practical tools and techniques for ${title.toLowerCase().replace('how do i ', '').replace('?', '')}.`,
      gateId,
      anchorId: 'mental-health-anchor',
      painPointNumber: i + 1,
      isPublic: true,
      createdAt: new Date().toISOString()
    });
  }

  return painPoints;
}

/**
 * Generate Tools (3 per pain point: 5-min, 15-min, 30-min)
 */
function generateTools(painPointId, gateId, painPointTitle, toolIndex) {
  const durations = ['5 minutes', '15 minutes', '30 minutes'];
  const toolNames = ['Quick Reset', 'Standard Practice', 'Deep Work'];
  
  return durations.map((duration, idx) => {
    const toolId = `${painPointId}-${toolNames[idx].toLowerCase().replace(/\s+/g, '-')}`;
    const is5Min = duration === '5 minutes';
    const is15Min = duration === '15 minutes';
    const is30Min = duration === '30 minutes';

    // Generate structured content (no placeholders)
    const description = is5Min
      ? `A quick ${duration} practice to help you ${painPointTitle.toLowerCase().replace('how do i ', '').replace('?', '')}. This tool provides immediate relief and grounding.`
      : is15Min
      ? `A structured ${duration} practice designed to help you ${painPointTitle.toLowerCase().replace('how do i ', '').replace('?', '')}. This tool offers a balanced approach with clear steps.`
      : `An in-depth ${duration} practice for ${painPointTitle.toLowerCase().replace('how do i ', '').replace('?', '')}. This tool provides comprehensive support and deeper exploration.`;

    const steps = is5Min
      ? [
          'Find a quiet space where you can focus.',
          'Take three slow, deep breaths.',
          'Identify the specific feeling or challenge you\'re facing right now.',
          'Choose one small action you can take in the next few minutes.',
          'Take that action and notice how you feel afterward.'
        ]
      : is15Min
      ? [
          'Find a comfortable space where you won\'t be interrupted.',
          'Take five slow breaths, noticing each inhale and exhale.',
          'Identify the specific challenge or feeling you\'re working with.',
          'Break it down into smaller, manageable pieces.',
          'Choose one piece to address right now.',
          'Decide on a concrete action you can take.',
          'Take that action, paying attention to what happens.',
          'Reflect on what you learned from taking the step.',
          'Notice any shifts in how you feel.',
          'Plan one next step for later today or tomorrow.'
        ]
      : [
          'Set aside a dedicated space and time for this practice.',
          'Begin with ten slow, intentional breaths.',
          'Identify the core challenge or feeling you\'re exploring.',
          'Break it down into its component parts.',
          'Examine each part with curiosity and compassion.',
          'Choose one part to work with in depth.',
          'Develop a concrete plan with specific steps.',
          'Take the first step of your plan.',
          'Observe what happens, both internally and externally.',
          'Reflect on what you learned and how you feel.',
          'Adjust your plan based on what you discovered.',
          'Commit to continuing this work over time.'
        ];

    const howItWorks = is5Min
      ? 'This quick practice activates your parasympathetic nervous system, reducing stress and creating space for clearer thinking. The brief duration makes it accessible even during difficult moments.'
      : is15Min
      ? 'This structured practice combines breathwork, cognitive reframing, and action planning. The moderate duration allows for deeper engagement while remaining practical for daily use.'
      : 'This extended practice provides time for deep reflection, pattern recognition, and comprehensive planning. The longer duration supports meaningful change and integration.';

    const whereItCameFrom = 'This tool is based on evidence-based practices from cognitive behavioral therapy, mindfulness research, and stress reduction techniques. It has been adapted for practical, self-directed use.';

    return {
      id: toolId,
      slug: toolId,
      title: `${toolNames[idx]} (${duration})`,
      description,
      summary: description,
      duration,
      difficulty: is5Min ? 'beginner' : is15Min ? 'intermediate' : 'advanced',
      painPointId,
      gateId,
      anchorId: 'mental-health-anchor',
      isPublic: true,
      disclaimer: 'The information provided is for educational purposes and is not a substitute for professional medical advice.',
      how_it_works: howItWorks,
      howWhyWorks: howItWorks,
      where_it_came_from: whereItCameFrom,
      steps,
      walkthroughs: [
        {
          title: `${duration} Workthrough`,
          steps
        }
      ],
      createdAt: new Date().toISOString()
    };
  });
}

// Main generation
console.log('🌱 Seeding graph data...\n');

const anchor = generateAnchor();
const gates = generateGates(anchor.id);
const allPainPoints = [];
const allTools = [];

// Generate pain points and tools for each gate
gates.forEach(gate => {
  const painPoints = generatePainPoints(gate.id, gate.gateNumber);
  allPainPoints.push(...painPoints);
  
  painPoints.forEach(painPoint => {
    const tools = generateTools(painPoint.id, gate.id, painPoint.title, painPoint.painPointNumber);
    allTools.push(...tools);
    // Link tools to pain point
    painPoint.toolIds = tools.map(t => t.id);
  });
});

// Organize pain points by gate
const painPointsByGate = {};
gates.forEach(gate => {
  painPointsByGate[gate.id] = allPainPoints.filter(pp => pp.gateId === gate.id);
});

// Create registry/index
const registry = {
  anchors: { [anchor.id]: anchor },
  gates: {},
  painPoints: {},
  tools: {},
  edges: {
    anchorToGates: { [anchor.id]: gates.map(g => g.id) },
    gateToPainPoints: {},
    painPointToTools: {}
  }
};

gates.forEach(gate => {
  registry.gates[gate.id] = gate;
  registry.edges.gateToPainPoints[gate.id] = painPointsByGate[gate.id].map(pp => pp.id);
});

allPainPoints.forEach(pp => {
  registry.painPoints[pp.id] = pp;
  const tools = allTools.filter(t => t.painPointId === pp.id);
  registry.edges.painPointToTools[pp.id] = tools.map(t => t.id);
});

allTools.forEach(tool => {
  registry.tools[tool.id] = tool;
});

// Write files
console.log('📊 Generated:');
console.log(`  - Anchors: 1`);
console.log(`  - Gates: ${gates.length}`);
console.log(`  - Pain Points: ${allPainPoints.length}`);
console.log(`  - Tools: ${allTools.length}\n`);

// Write anchors.json
fs.writeFileSync(
  path.join(DATA_DIR, 'anchors.json'),
  JSON.stringify({ version: '1.0', generated: new Date().toISOString(), anchors: [anchor] }, null, 2)
);

// Write gates.json (update existing)
fs.writeFileSync(
  path.join(DATA_DIR, 'gates.json'),
  JSON.stringify({ version: '2.0', generated: new Date().toISOString(), note: '12 gates with descriptions', gates }, null, 2)
);

// Write pain-points.json (update existing)
fs.writeFileSync(
  path.join(DATA_DIR, 'pain-points.json'),
  JSON.stringify({ version: '2.0', generated: new Date().toISOString(), note: '40 pain points per gate', painPoints: painPointsByGate }, null, 2)
);

// Write tools.json (seed data)
fs.writeFileSync(
  path.join(DATA_DIR, 'tools.json'),
  JSON.stringify({ version: '1.0', generated: new Date().toISOString(), note: 'Seed tools (3 per pain point)', tools: allTools }, null, 2)
);

// Write registry.json
fs.writeFileSync(
  path.join(DATA_DIR, 'registry.json'),
  JSON.stringify({ version: '1.0', generated: new Date().toISOString(), registry }, null, 2)
);

console.log('✅ Seed data written to:');
console.log(`  - ${path.join(DATA_DIR, 'anchors.json')}`);
console.log(`  - ${path.join(DATA_DIR, 'gates.json')}`);
console.log(`  - ${path.join(DATA_DIR, 'pain-points.json')}`);
console.log(`  - ${path.join(DATA_DIR, 'tools.json')}`);
console.log(`  - ${path.join(DATA_DIR, 'registry.json')}\n`);

console.log('✅ Graph seed complete!');
