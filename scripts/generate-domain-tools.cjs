/**
 * Generate Domain Tools
 * 
 * Generates a full set of tool JSONs for a given pillar+domain across S1-S4.
 * 
 * Usage:
 *   node scripts/generate-domain-tools.cjs --pillar mens-mental-health --domain loss-and-grief
 *   node scripts/generate-domain-tools.cjs --pillar mens-mental-health --domain loss-and-grief --out tools/mens-mental-health/
 * 
 * Creates 4 files:
 *   <domain>-s1.json
 *   <domain>-s2.json
 *   <domain>-s3.json
 *   <domain>-s4.json
 */

const fs = require('fs');
const path = require('path');

// Parse CLI arguments
const args = process.argv.slice(2);
let pillar = null;
let domain = null;
let outDir = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--pillar' && args[i + 1]) {
    pillar = args[i + 1];
    i++;
  } else if (args[i] === '--domain' && args[i + 1]) {
    domain = args[i + 1];
    i++;
  } else if (args[i] === '--out' && args[i + 1]) {
    outDir = args[i + 1];
    i++;
  }
}

if (!pillar || !domain) {
  console.error('❌ Error: --pillar and --domain are required');
  console.error('Usage: node scripts/generate-domain-tools.cjs --pillar <pillar-slug> --domain <domain-slug> [--out <output-dir>]');
  process.exit(1);
}

// Load config files
const PILLARS_FILE = path.join(__dirname, '..', 'config', 'pillars.json');
const DOMAINS_FILE = path.join(__dirname, '..', 'config', 'domains.json');
const STATES_FILE = path.join(__dirname, '..', 'config', 'states.json');

let pillarData = null;
let domainData = null;
let states = [];

try {
  const pillarsData = JSON.parse(fs.readFileSync(PILLARS_FILE, 'utf8'));
  pillarData = pillarsData.pillars.find(p => p.slug === pillar);
  if (!pillarData) {
    console.error(`❌ Error: Pillar "${pillar}" not found in config/pillars.json`);
    process.exit(1);
  }
} catch (err) {
  console.error(`❌ Error loading ${PILLARS_FILE}: ${err.message}`);
  process.exit(1);
}

try {
  const domainsData = JSON.parse(fs.readFileSync(DOMAINS_FILE, 'utf8'));
  domainData = domainsData.domains.find(d => d.slug === domain);
  if (!domainData) {
    console.error(`❌ Error: Domain "${domain}" not found in config/domains.json`);
    process.exit(1);
  }
} catch (err) {
  console.error(`❌ Error loading ${DOMAINS_FILE}: ${err.message}`);
  process.exit(1);
}

try {
  const statesData = JSON.parse(fs.readFileSync(STATES_FILE, 'utf8'));
  states = statesData.states || [];
  if (states.length !== 4) {
    console.error(`❌ Error: Expected 4 states in config/states.json, found ${states.length}`);
    process.exit(1);
  }
} catch (err) {
  console.error(`❌ Error loading ${STATES_FILE}: ${err.message}`);
  process.exit(1);
}

// Determine output directory
if (!outDir) {
  outDir = path.join(__dirname, '..', 'tools', pillar);
} else {
  outDir = path.resolve(outDir);
}

// Ensure output directory exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Tone map for different pillars
const toneMap = {
  'mens-mental-health': {
    style: 'direct, practical, action-oriented',
    pronouns: 'you',
    voice: 'conversational but grounded'
  },
  'womens-mental-health': {
    style: 'empathetic, validating, supportive',
    pronouns: 'you',
    voice: 'warm and understanding'
  },
  'teen-and-genz-mental-health': {
    style: 'relatable, authentic, non-patronizing',
    pronouns: 'you',
    voice: 'genuine and real'
  },
  'addiction-recovery': {
    style: 'honest, non-judgmental, practical',
    pronouns: 'you',
    voice: 'straightforward and supportive'
  }
};

const tone = toneMap[pillar] || {
  style: 'grounded, honest, practical',
  pronouns: 'you',
  voice: 'authentic'
};

// Generate starter content for each state
function generateToolContent(state, stateIndex) {
  const stateLabel = state.label;
  const stateDescription = state.description;
  
  // Base tool templates by state
  const toolTemplates = {
    S1: {
      title: `Grounding Technique for ${stateLabel}`,
      description: `When you're in ${stateLabel.toLowerCase()}, your nervous system is in survival mode. This grounding technique helps bring you back to the present moment by engaging your senses. It's a simple way to interrupt the stress response and create a small pocket of stability.`,
      steps: [
        `Find a quiet space where you can sit or stand comfortably`,
        `Name 4 things you can see around you right now`,
        `Identify 3 things you can touch and notice their texture`,
        `Listen for 2 distinct sounds in your environment`,
        `Take one deep breath and notice one thing you can smell`
      ],
      how_it_works: `When you're in a state of high stress or overwhelm, your brain's threat detection system is hyperactive. This technique works by redirecting your attention from internal distress to external sensory input. By systematically engaging each of your five senses, you're essentially "grounding" yourself in the present moment and interrupting the stress response cycle. The counting aspect (4-3-2-1) provides structure when your mind feels chaotic, and the sensory focus activates the parasympathetic nervous system, which helps calm the body's stress response. This isn't about eliminating the difficult feelings, but creating enough space to function.`,
      where_it_came_from: `This technique draws from sensory grounding practices used in trauma therapy and mindfulness-based interventions. The 5-4-3-2-1 method has been adapted by many mental health practitioners as a practical tool for acute stress management. It's based on the principle that focusing on external sensory input can help regulate an overwhelmed nervous system.`,
      disclaimer: `This is a grounding technique, not a replacement for professional mental health support. If you're experiencing persistent distress, consider reaching out to a mental health professional. This is here if you want it. Use what helps. Ignore what doesn't.`
    },
    S2: {
      title: `Small Action for ${stateLabel}`,
      description: `When you're in ${stateLabel.toLowerCase()}, you might feel disconnected or running on autopilot. This small, concrete action helps you reconnect with your agency and break through the numbness. It's designed to be so simple that even when you feel flat, you can still do it.`,
      steps: [
        `Choose one tiny task that takes less than 15 minutes`,
        `Set a timer for exactly 15 minutes`,
        `Focus only on that one task until the timer goes off`,
        `When the timer ends, stop and take one deep breath`,
        `Notice how it feels to have completed something concrete`
      ],
      how_it_works: `When you're functioning but disconnected, your brain is often in a kind of autopilot mode where everything feels equally meaningless or overwhelming. This technique works by creating a very small, bounded container of action. The timer creates a clear boundary, and the simplicity of the task reduces decision fatigue. Completing even a tiny concrete action can help break the cycle of numbness by giving you a small win and reconnecting you with your ability to affect change. The time limit prevents it from becoming overwhelming, and the focus requirement helps bring your attention back to the present moment.`,
      where_it_came_from: `This approach draws from behavioral activation techniques used in cognitive behavioral therapy and the concept of "micro-actions" from productivity and mental health practices. The time-boxing method is commonly used to overcome procrastination and overwhelm by making tasks feel more manageable.`,
      disclaimer: `This is a practical tool for reconnecting with agency, not a treatment for depression or other mental health conditions. If you're experiencing persistent numbness or disconnection, consider speaking with a mental health professional. This is here if you want it. Use what helps. Ignore what doesn't.`
    },
    S3: {
      title: `Reflection Tool for ${stateLabel}`,
      description: `When you're in ${stateLabel.toLowerCase()}, your mind might be racing or stuck in loops. This reflection tool helps you step back, gain perspective, and identify one concrete next step. It's designed to help you land the plane when your thoughts are spinning.`,
      steps: [
        `Take a piece of paper or open a note on your phone`,
        `Write down what's currently looping in your mind`,
        `Identify one small action you can take that would move you forward`,
        `Write down what you need to let go of or accept right now`,
        `Choose one of these actions and commit to doing it within the next hour`
      ],
      how_it_works: `When your mind is spinning or stuck, it's often because you're trying to process too much at once or you're caught between competing thoughts. This technique works by externalizing what's happening in your mind onto paper, which creates psychological distance and helps you see patterns more clearly. The act of writing engages different parts of your brain than just thinking, and the structure of identifying both action and acceptance helps you move from rumination to decision. By committing to one small action within an hour, you're creating momentum and breaking the loop of indecision.`,
      where_it_came_from: `This approach combines elements of cognitive defusion from acceptance and commitment therapy (ACT) with structured problem-solving techniques. The practice of externalizing thoughts through writing is a common tool in many therapeutic approaches, and the focus on small, immediate actions draws from behavioral activation principles.`,
      disclaimer: `This is a reflection and action tool, not a replacement for professional mental health support. If you're experiencing persistent racing thoughts or difficulty making decisions, consider reaching out to a mental health professional. This is here if you want it. Use what helps. Ignore what doesn't.`
    },
    S4: {
      title: `Building Practice for ${stateLabel}`,
      description: `When you're in ${stateLabel.toLowerCase()}, you have enough stability to engage in practices that build capacity and create positive momentum. This tool helps you establish a sustainable practice that supports your ongoing growth and resilience.`,
      steps: [
        `Identify one practice or habit you want to build`,
        `Commit to doing it for just 5 minutes today`,
        `Set a specific time and place where you'll do it`,
        `After completing it, write down one thing you noticed`,
        `Plan to repeat this same practice tomorrow at the same time`
      ],
      how_it_works: `When you have enough stability and bandwidth, your brain is in a state where it can learn, adapt, and build new patterns. This technique works by starting extremely small (5 minutes) to ensure success and build the habit of consistency. The specificity of time and place creates cues that make the practice more automatic over time. The reflection step (writing down what you noticed) helps you stay connected to the practice and notice its effects. By planning to repeat it tomorrow, you're creating the foundation for a sustainable habit that can support your ongoing resilience.`,
      where_it_came_from: `This approach draws from habit formation research, particularly the work on "tiny habits" and the importance of starting small to build consistency. The combination of specific timing, reflection, and planning is based on principles from behavioral psychology and habit science.`,
      disclaimer: `This is a practice-building tool, not a guarantee of specific outcomes. Building sustainable practices takes time and consistency. If you're looking for support in establishing healthy habits, consider working with a coach or mental health professional. This is here if you want it. Use what helps. Ignore what doesn't.`
    }
  };
  
  const template = toolTemplates[state.id] || toolTemplates.S1;
  
  // Generate unique tool ID
  const toolId = `${pillarData.id}-${domainData.id}-T${String(stateIndex + 1).padStart(2, '0')}`;
  
  return {
    pillar_slug: pillar,
    domain_slug: domain,
    state_id: state.id,
    tool_id: toolId,
    title: template.title,
    slug: `${domain}-${state.slug}`,
    description: template.description,
    steps: template.steps,
    how_it_works: template.how_it_works,
    where_it_came_from: template.where_it_came_from,
    disclaimer: template.disclaimer
  };
}

// Generate files for each state
console.log(`\nGenerating tools for:`);
console.log(`  Pillar: ${pillarData.name} (${pillar})`);
console.log(`  Domain: ${domainData.name} (${domain})`);
console.log(`  Output: ${outDir}\n`);

let generatedCount = 0;

for (let i = 0; i < states.length; i++) {
  const state = states[i];
  const tool = generateToolContent(state, i);
  const fileName = `${domain}-${state.slug}.json`;
  const filePath = path.join(outDir, fileName);
  
  // Check if file already exists
  if (fs.existsSync(filePath)) {
    console.warn(`⚠️  File already exists: ${fileName} (skipping)`);
    continue;
  }
  
  // Write file
  fs.writeFileSync(filePath, JSON.stringify(tool, null, 2) + '\n', 'utf8');
  console.log(`✅ Created: ${fileName}`);
  generatedCount++;
}

console.log(`\n✅ Generated ${generatedCount} tool file(s)`);
console.log(`\nNext steps:`);
console.log(`  1. Review the generated files`);
console.log(`  2. Customize the content to match your specific domain`);
console.log(`  3. Run: npm run validate`);
console.log(`\n`);
