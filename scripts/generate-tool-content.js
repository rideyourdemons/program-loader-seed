/**
 * Generate Tool Content
 * 
 * Populates all tools in tools-canonical.json with required content fields:
 * - summary
 * - problem
 * - quick (steps array)
 * - standard (steps array)
 * - deep (steps array)
 * - howWhy
 * - origin
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'public', 'data');
const TOOLS_FILE = path.join(DATA_DIR, 'tools-canonical.json');
const GATES_FILE = path.join(DATA_DIR, 'gates.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function getGateContext(gateIds, gatesMap) {
  if (!gateIds || gateIds.length === 0) return null;
  const gate = gatesMap[gateIds[0]];
  return gate ? gate.title || gate.gateName : null;
}

function generateSummary(tool, gateContext) {
  if (tool.summary && tool.summary.trim() && !tool.summary.includes('pending')) {
    return tool.summary;
  }
  
  const title = tool.title || '';
  const gate = gateContext || '';
  const context = gate ? ` for ${gate.toLowerCase()}` : '';
  
  return `${title} helps you${context}. This practice supports emotional regulation and practical problem-solving. Use it when you need a clear, structured approach to manage difficult feelings or situations.`;
}

function generateProblem(tool, gateContext) {
  if (tool.problem && tool.problem.trim()) {
    return tool.problem;
  }
  
  const title = tool.title || '';
  const gate = gateContext || '';
  const context = gate ? ` in ${gate.toLowerCase()}` : '';
  
  return `When facing challenges${context}, it can be hard to know where to start. ${title} provides a clear framework to work through difficult moments step by step.`;
}

function generateQuickSteps(tool) {
  if (tool.walkthroughs && Array.isArray(tool.walkthroughs)) {
    const quick = tool.walkthroughs.find(wt => 
      wt.title && (wt.title.toLowerCase().includes('quick') || wt.title.toLowerCase().includes('5 min'))
    );
    if (quick && quick.steps && Array.isArray(quick.steps) && quick.steps.length > 0) {
      return quick.steps;
    }
  }
  
  const title = tool.title || 'This practice';
  return [
    `Take a moment to pause and notice what you're experiencing right now.`,
    `Identify one specific thing you can do in the next few minutes.`,
    `Take that action, even if it's small.`,
    `Notice how you feel after taking the step.`,
    `Acknowledge what you've done, no matter how small it seems.`
  ];
}

function generateStandardSteps(tool) {
  if (tool.walkthroughs && Array.isArray(tool.walkthroughs)) {
    const standard = tool.walkthroughs.find(wt => 
      wt.title && (wt.title.toLowerCase().includes('standard') || wt.title.toLowerCase().includes('15 min'))
    );
    if (standard && standard.steps && Array.isArray(standard.steps) && standard.steps.length > 0) {
      return standard.steps;
    }
  }
  
  const title = tool.title || 'This practice';
  return [
    `Find a quiet space where you can focus for about 15 minutes.`,
    `Take three slow breaths, noticing the air moving in and out.`,
    `Identify the specific challenge or feeling you're working with.`,
    `Break it down into smaller, manageable pieces.`,
    `Choose one piece to address right now.`,
    `Decide on a concrete action you can take.`,
    `Take that action, paying attention to what happens.`,
    `Reflect on what you learned from taking the step.`,
    `Notice any shifts in how you feel.`,
    `Plan one next step for later today or tomorrow.`
  ];
}

function generateDeepSteps(tool) {
  if (tool.walkthroughs && Array.isArray(tool.walkthroughs)) {
    const deep = tool.walkthroughs.find(wt => 
      wt.title && (wt.title.toLowerCase().includes('deep') || wt.title.toLowerCase().includes('30 min'))
    );
    if (deep && deep.steps && Array.isArray(deep.steps) && deep.steps.length > 0) {
      return deep.steps;
    }
  }
  
  const title = tool.title || 'This practice';
  return [
    `Set aside 30 minutes in a space where you won't be interrupted.`,
    `Begin with five minutes of quiet breathing, letting your body settle.`,
    `Identify the core issue you want to work with today.`,
    `Explore what this issue means to you personally.`,
    `Notice any patterns or connections to past experiences.`,
    `Break the issue into its component parts.`,
    `Examine each part with curiosity rather than judgment.`,
    `Identify what's within your control and what isn't.`,
    `Choose one aspect you can influence right now.`,
    `Develop a specific plan of action.`,
    `Take the first step of your plan.`,
    `Observe what happens, both internally and externally.`,
    `Reflect on what you learned from this process.`,
    `Identify what you'll do differently going forward.`,
    `Acknowledge your effort and commitment to working through this.`
  ];
}

function generateHowWhy(tool, gateContext) {
  if (tool.howWhyWorks && tool.howWhyWorks.trim() && !tool.howWhyWorks.includes('pending')) {
    return tool.howWhyWorks;
  }
  
  const title = tool.title || 'This practice';
  const gate = gateContext || '';
  
  return `${title} works by providing structure when things feel overwhelming. Breaking challenges into smaller steps makes them more manageable. Taking concrete actions, even small ones, helps shift from feeling stuck to making progress. This approach is grounded in behavioral activation and cognitive restructuring, which show that action and perspective shifts can improve emotional well-being.`;
}

function generateOrigin(tool, gateContext) {
  if (tool.origin && tool.origin.trim() && !tool.origin.includes('pending')) {
    return tool.origin;
  }
  
  const gate = gateContext || '';
  const context = gate ? ` in ${gate.toLowerCase()}` : '';
  
  return `This practice draws from behavioral psychology and lived experience${context}. It combines structured problem-solving with emotional awareness, reflecting patterns that many people find helpful when working through difficult situations.`;
}

function generateWalkthroughs(tool) {
  // If walkthroughs exist and have content, use them
  if (tool.walkthroughs && Array.isArray(tool.walkthroughs) && tool.walkthroughs.length > 0) {
    const hasContent = tool.walkthroughs.some(wt => 
      wt.steps && Array.isArray(wt.steps) && wt.steps.length > 0
    );
    if (hasContent) {
      return tool.walkthroughs;
    }
  }
  
  // Generate walkthroughs
  const quick = generateQuickSteps(tool);
  const standard = generateStandardSteps(tool);
  const deep = generateDeepSteps(tool);
  
  return [
    {
      title: 'Quick Workthrough (5 min)',
      steps: quick
    },
    {
      title: 'Standard Workthrough (15 min)',
      steps: standard
    },
    {
      title: 'Deep Workthrough (30 min)',
      steps: deep
    }
  ];
}

function processTools() {
  console.log('[GENERATE] Loading tools and gates...\n');
  
  const toolsData = readJson(TOOLS_FILE);
  const tools = Array.isArray(toolsData.tools) ? toolsData.tools : [];
  
  const gatesData = readJson(GATES_FILE);
  const gates = Array.isArray(gatesData.gates) ? gatesData.gates : [];
  const gatesMap = {};
  gates.forEach(gate => {
    gatesMap[gate.id] = gate;
  });
  
  console.log(`[GENERATE] Processing ${tools.length} tools...\n`);
  
  let filled = 0;
  let updated = 0;
  
  tools.forEach((tool, index) => {
    if (index % 100 === 0) {
      console.log(`[GENERATE] Processing tool ${index + 1}/${tools.length}...`);
    }
    
    const gateContext = getGateContext(tool.gateIds, gatesMap);
    let changed = false;
    
    // Generate summary
    if (!tool.summary || !tool.summary.trim() || tool.summary.includes('pending')) {
      tool.summary = generateSummary(tool, gateContext);
      changed = true;
    }
    
    // Generate problem
    if (!tool.problem || !tool.problem.trim()) {
      tool.problem = generateProblem(tool, gateContext);
      changed = true;
    }
    
    // Generate walkthroughs
    const walkthroughs = generateWalkthroughs(tool);
    if (!tool.walkthroughs || tool.walkthroughs.length === 0 || 
        !tool.walkthroughs.some(wt => wt.steps && wt.steps.length > 0)) {
      tool.walkthroughs = walkthroughs;
      changed = true;
    }
    
    // Generate howWhy
    if (!tool.howWhyWorks || !tool.howWhyWorks.trim() || tool.howWhyWorks.includes('pending')) {
      tool.howWhyWorks = generateHowWhy(tool, gateContext);
      changed = true;
    }
    
    // Generate origin (store in a new field or use existing)
    if (!tool.origin || !tool.origin.trim() || tool.origin.includes('pending')) {
      tool.origin = generateOrigin(tool, gateContext);
      changed = true;
    }
    
    if (changed) {
      updated++;
    }
    
    // Check if tool is now fully filled
    const hasSummary = tool.summary && tool.summary.trim();
    const hasProblem = tool.problem && tool.problem.trim();
    const hasWalkthroughs = tool.walkthroughs && Array.isArray(tool.walkthroughs) && 
                           tool.walkthroughs.some(wt => wt.steps && Array.isArray(wt.steps) && wt.steps.length > 0);
    const hasHowWhy = tool.howWhyWorks && tool.howWhyWorks.trim();
    const hasOrigin = tool.origin && tool.origin.trim();
    
    if (hasSummary && hasProblem && hasWalkthroughs && hasHowWhy && hasOrigin) {
      filled++;
    }
  });
  
  console.log('\n[GENERATE] Writing updated tools file...');
  writeJson(TOOLS_FILE, toolsData);
  
  console.log('\n===== GENERATION COMPLETE =====');
  console.log(`Total tools: ${tools.length}`);
  console.log(`Tools updated: ${updated}`);
  console.log(`Tools fully filled: ${filled}`);
  console.log(`Tools needing more content: ${tools.length - filled}`);
  console.log('=================================\n');
  
  return { total: tools.length, updated, filled };
}

if (require.main === module) {
  try {
    processTools();
  } catch (error) {
    console.error('[GENERATE] Error:', error);
    process.exit(1);
  }
}

module.exports = { processTools };
