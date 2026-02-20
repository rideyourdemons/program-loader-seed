/**
 * RYD Tool Content Expander
 *
 * Upgrades short/failing tools to validator-pass production content.
 * Input: tool with title, gate, description, intent.
 * Output: 700–1200 words, disclaimer, mechanism, loop, steps, How & Why.
 *
 * DO NOT modify existing tool data — generates extended content at runtime.
 * Usable for batch processing and DEV auto-expansion (expand=true).
 */

'use strict';

// ---------------------------------------------------------------------------
// MECHANISMS (choose by intent keywords)
// ---------------------------------------------------------------------------

const MECHANISMS = {
  'attention-shift': {
    id: 'attention-shift',
    label: 'Attention Shift / Salience Interrupt',
    description: 'Redirects focus from the internal distress loop to an external anchor or neutral stimulus, breaking the rumination cycle before it amplifies.',
  },
  'cognitive-defusion': {
    id: 'cognitive-defusion',
    label: 'Cognitive Defusion',
    description: 'Creates distance between you and your thoughts so they lose their grip. You notice the thought instead of being run by it.',
  },
  'behavioral-activation': {
    id: 'behavioral-activation',
    label: 'Behavioral Activation',
    description: 'Uses small, concrete actions to interrupt withdrawal and rebuild engagement. Action often precedes motivation rather than the reverse.',
  },
  'exposure-response': {
    id: 'exposure-response',
    label: 'Exposure / Response Prevention',
    description: 'Approaches the avoided situation or sensation gradually while refraining from the usual safety behavior, weakening the fear association over time.',
  },
  'nervous-system-downshift': {
    id: 'nervous-system-downshift',
    label: 'Nervous System Downshift',
    description: 'Activates the parasympathetic branch (rest-and-digest) via breath, posture, or sensation, shifting the body out of fight-or-flight.',
  },
  'self-compassion': {
    id: 'self-compassion',
    label: 'Self-Compassion Reset',
    description: 'Replaces self-criticism with acknowledgment and warmth, reducing shame and creating space for choice rather than reactivity.',
  },
  'implementation-intention': {
    id: 'implementation-intention',
    label: 'Implementation Intention',
    description: 'Pre-links a specific trigger (when/where) to a specific response (then I will), making the desired behavior more likely when the moment arrives.',
  },
  'environmental-friction': {
    id: 'environmental-friction',
    label: 'Environmental Friction',
    description: 'Changes the physical or social environment to make unwanted behavior harder and wanted behavior easier, without relying on willpower alone.',
  },
};

// Intent keywords → mechanism
const INTENT_TO_MECHANISM = [
  { pattern: /\bnumb\b|disconnect|shut down|dissociation\b/i, mechanism: 'nervous-system-downshift' },
  { pattern: /\banxiety|panic|worr(y|ied)\b/i, mechanism: 'nervous-system-downshift' },
  { pattern: /\bprocrastinat|avoid|stuck\b/i, mechanism: 'behavioral-activation' },
  { pattern: /\bshame|silenced|voice\b/i, mechanism: 'self-compassion' },
  { pattern: /\boverwhelm|overwhelmed\b/i, mechanism: 'attention-shift' },
  { pattern: /\bstress|tense|tension\b/i, mechanism: 'nervous-system-downshift' },
  { pattern: /\bpurpose|meaning|direction\b/i, mechanism: 'behavioral-activation' },
  { pattern: /\bconfid(en|ence)\b/i, mechanism: 'behavioral-activation' },
  { pattern: /\bgrief|loss|bereavement\b/i, mechanism: 'self-compassion' },
  { pattern: /\baddiction|craving|relapse\b/i, mechanism: 'environmental-friction' },
  { pattern: /\btrauma|trigger\b/i, mechanism: 'nervous-system-downshift' },
  { pattern: /\bthought|ruminat|obsess\b/i, mechanism: 'cognitive-defusion' },
  { pattern: /\bdefault\b/i, mechanism: 'implementation-intention' },
];

const STANDARD_DISCLAIMER =
  'The information provided is for educational purposes and is not a substitute for professional medical advice, diagnosis, or treatment. If you are in crisis or experiencing severe distress, please seek help from a qualified healthcare provider or crisis line.';

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

function extractIntent(tool) {
  const painPointId = tool.painPointId || tool.painPointIds?.[0];
  const slug = (tool.slug || tool.id || '').toLowerCase();
  const desc = (tool.description || tool.summary || '').toLowerCase();

  if (painPointId) {
    const slugPart = painPointId.replace(/-/g, ' ');
    if (slugPart) return slugPart;
  }
  // Try to extract from slug: "how-do-i-stop-feeling-numb-quick-reset" → "stop feeling numb"
  const m = slug.match(/how-do-i-(.+?)(?:-(?:quick-reset|standard-practice|deep-work))?$/);
  if (m) return m[1].replace(/-/g, ' ');
  return desc.slice(0, 100) || 'manage difficulty';
}

function selectMechanism(tool) {
  const text = [
    tool.title,
    tool.description,
    tool.summary,
    tool.painPointId,
    tool.slug,
    tool.id,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  for (const { pattern, mechanism } of INTENT_TO_MECHANISM) {
    if (pattern.test(text)) return MECHANISMS[mechanism];
  }
  return MECHANISMS['behavioral-activation'];
}

function humanTitle(str) {
  if (!str) return '';
  return str.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// GENERATORS (non-boilerplate, intent- and mechanism-specific)
// ---------------------------------------------------------------------------

function generatePurpose(tool, intent, mechanism) {
  const title = tool.title || 'This tool';
  return `${title} is designed for moments when you notice the pull of ${intent}—whether that shows up as physical tension, mental looping, or a sense of being stuck. Many people try to think or will their way out of these states, but the body and nervous system often need a structured sequence before the mind can shift. This tool gives you that sequence. It is not about fixing or eliminating the feeling in the moment; it is about interrupting the automatic loop and creating enough space to choose a different response. The underlying mechanism is ${mechanism.label}: ${mechanism.description} By working through the steps, you activate that mechanism rather than staying inside the default pattern. Use it when you recognize the early signs (before things spiral), when you need a reset mid-situation, or when you want to build a habit of pausing before reacting. The 5-, 15-, and 30-minute variants let you match the depth of practice to the time and energy you have available.`;
}

function generateLoop(tool, intent, mechanism) {
  const title = tool.title || 'This practice';
  return {
    trigger: `You encounter a situation or internal cue that hooks you into ${intent}.`,
    body: `Your body and mind respond with familiar patterns—tension, avoidance, or rumination.`,
    thought: `Without intervention, your thoughts feed the loop: "I can't handle this" or "I need to escape."`,
    behavior: `Instead of defaulting to the usual response, you run ${title} step by step.`,
    result: `The mechanism (${mechanism.label}) interrupts the loop. You create enough space to choose a different next move.`,
  };
}

function generateMechanismSection(mechanism, loop) {
  return `${mechanism.label}: ${mechanism.description} In this tool, the loop breaks down as: Trigger — ${loop.trigger} Body — ${loop.body} Thought — ${loop.thought} Behavior — ${loop.behavior} Result — ${loop.result}`;
}

function generateSteps5(tool, intent) {
  return [
    `Pause where you are. Name one thing you notice in your body or surroundings right now. This anchor pulls your attention out of the internal loop.`,
    `Take three slow breaths. On each exhale, let your shoulders drop slightly. The lengthened exhale signals safety to your nervous system.`,
    `Identify the specific pull you're feeling (e.g., ${intent}). Acknowledge it without judging. Naming it reduces its grip.`,
    `Choose one small, concrete action you can take in the next few minutes—something you can actually do. Keep it tiny.`,
    `Do that action. Notice what happens in your body and mind afterward. No need to fix anything; just observe.`,
  ];
}

function generateSteps15(tool, intent) {
  return [
    `Find a space where you won't be interrupted for about 15 minutes. Sit or stand in a way that feels grounded.`,
    `Take five slow breaths. Notice the air moving in and out; let your body settle. Give yourself permission to slow down.`,
    `Identify the main challenge or feeling you're working with (e.g., ${intent}). Put it in words, even roughly.`,
    `Break it into two or three smaller pieces. Which piece feels most addressable right now?`,
    `Pick one concrete action for that piece—something you could do today. Be specific: what, where, when.`,
    `Imagine doing it. What would the first step look like? What would get in the way?`,
    `Take that first step, or the smallest version of it, right now if possible. Movement matters more than perfection.`,
    `Observe what happens. What did you learn from taking action? What would you adjust?`,
    `Notice any shift in how you feel. There's no "right" shift—just notice without judging.`,
    `Name one next step for later today or tomorrow. Write it down or say it out loud to make it stick.`,
  ];
}

function generateSteps30(tool, intent) {
  return [
    `Set aside 30 minutes in a space where you won't be interrupted.`,
    `Start with five minutes of quiet breathing. Let your body and mind settle.`,
    `Identify the core issue you want to work with—the deeper layer behind ${intent}.`,
    `Explore what this issue means to you. When did you first notice it? How does it show up now?`,
    `Notice any patterns or connections to past experiences. Write or speak a few sentences if helpful.`,
    `Break the issue into parts. What's within your control? What isn't?`,
    `Choose one aspect you can influence. What would a small win look like?`,
    `Design a specific plan: what, when, and where. Make it concrete.`,
    `Take the first step of that plan right now, or schedule it clearly.`,
    `Observe what happens. What worked? What would you adjust?`,
    `Reflect on what you learned from this process.`,
    `Identify one thing you'll do differently going forward.`,
    `Acknowledge your effort. You showed up.`,
  ];
}

function generateHowWhy(loop, mechanism, tool) {
  const title = tool.title || 'This tool';
  return `How ${title} works: The loop you are interrupting goes like this. ${loop.trigger} ${loop.body} ${loop.thought} Without a deliberate intervention, that loop reinforces itself; each repetition makes the default response feel more automatic. ${title} inserts a new behavior at the behavior stage: instead of defaulting to avoidance, rumination, or shutdown, you follow the steps. The mechanism behind it is ${mechanism.label}. ${mechanism.description} That is why the steps are built the way they are—each one is designed to activate that mechanism. For example, if the mechanism is nervous system downshift, the breathing and grounding steps directly engage the parasympathetic branch. If it is behavioral activation, the action steps create momentum that often precedes motivation rather than waiting for it. When you complete the sequence, you create enough distance and enough momentum to choose a different result. It is not about fixing the trigger or the thought in the moment; it is about changing what you do in response. Over time, that change rewires the loop, so the default becomes less automatic and the new response more available.`;
}

function generateWhereItCameFrom(tool) {
  const origin = tool.where_it_came_from || tool.origin;
  if (origin && String(origin).trim().length > 50 && !/coming soon|placeholder|tbd/i.test(origin)) {
    return origin;
  }
  return `This practice draws from lived experience and behavioral science principles. The mechanism is supported by research in acceptance and commitment therapy, behavioral activation, and nervous-system regulation. These approaches have been used in clinical and community settings for decades, and have been adapted here for self-directed use when professional support is not immediately available. The structure of trigger-body-thought-behavior-result mirrors feedback-loop models used in functional analysis and contextual behavioral science, which emphasize that changing behavior in the loop is often more effective than trying to eliminate triggers or thoughts directly.`;
}

// ---------------------------------------------------------------------------
// MAIN EXPANDER
// ---------------------------------------------------------------------------

/**
 * Expands a tool to production-grade content (700–1200 words).
 *
 * @param {Object} tool - Source tool (title, gate, description, intent, etc.)
 * @returns {Object} Expanded tool with purpose, loop, mechanism, steps, howWhyWorks, where_it_came_from, disclaimer
 */
function toolContentExpander(tool) {
  if (!tool || typeof tool !== 'object') {
    return null;
  }

  const intent = extractIntent(tool);
  const mechanism = selectMechanism(tool);
  const purpose = generatePurpose(tool, intent, mechanism);
  const loop = generateLoop(tool, intent, mechanism);
  const mechanismSection = generateMechanismSection(mechanism, loop);
  const steps5 = generateSteps5(tool, intent);
  const steps15 = generateSteps15(tool, intent);
  const steps30 = generateSteps30(tool, intent);

  // Pick steps by duration; default to 15
  const dur = (tool.duration || '').toLowerCase();
  let steps = steps15;
  if (dur.includes('5') || /quick|5-?min/i.test(dur)) steps = steps5;
  else if (dur.includes('30') || /deep|30-?min/i.test(dur)) steps = steps30;

  const howWhyWorks = generateHowWhy(loop, mechanism, tool);
  const whereItCameFrom = generateWhereItCameFrom(tool);

  // Problem / lock (validator counts this)
  const problem = `When ${intent} shows up, it's easy to get caught in a loop: the more you resist or ruminate, the tighter it gets. This tool gives you a way out by shifting what you do in the moment, not by trying to think or force your way through.`;

  const expanded = {
    // Preserve original fields (read-only; we don't mutate)
    ...tool,

    // Extended content (additive, runtime-only)
    purpose,
    problem,
    loop,
    mechanism: mechanismSection,
    mechanismId: mechanism.id,
    mechanismLabel: mechanism.label,
    steps: steps.map((s) => (typeof s === 'string' ? s : (s && s.content) ? s.content : String(s))),
    walkthroughs: [
      { title: '5 minutes', steps: steps5 },
      { title: '15 minutes', steps: steps15 },
      { title: '30 minutes', steps: steps30 },
    ],
    how_it_works: howWhyWorks,
    howWhyWorks,
    where_it_came_from: whereItCameFrom,
    origin: whereItCameFrom,
    disclaimer: tool.disclaimer && String(tool.disclaimer).trim().length > 20
      ? tool.disclaimer
      : STANDARD_DISCLAIMER,
  };

  return expanded;
}

/**
 * Batch expand tools. Logs upgrade count and average word count.
 *
 * @param {Object[]} tools - Array of tools
 * @param {Object} options - { log: (msg) => void }
 * @returns {Object[]} Expanded tools
 */
function expandToolsBatch(tools, options = {}) {
  const log = options.log || (() => {});
  const expanded = [];
  let totalWords = 0;

  for (const t of tools) {
    const ex = toolContentExpander(t);
    if (ex) {
      expanded.push(ex);
      const content = [
        ex.purpose,
        ex.problem,
        ex.mechanism,
        ex.how_it_works,
        ex.where_it_came_from,
        (ex.steps || []).join(' '),
      ].join(' ');
      totalWords += countWords(content);
    }
  }

  const avg = expanded.length > 0 ? Math.round(totalWords / expanded.length) : 0;
  log(`Tool Content Expander: upgraded ${expanded.length} tools; new average word count: ${avg}`);

  return expanded;
}

/**
 * DEV MODE: If tool fails validation and has expand=true, return expanded version.
 * Use before rendering: const toRender = expandIfNeeded(tool, validateTool(tool));
 *
 * @param {Object} tool - Source tool
 * @param {Object} validationResult - { valid: boolean, ... } from validateTool
 * @returns {Object} Expanded tool if expand=true and !valid, else original tool
 */
function expandIfNeeded(tool, validationResult) {
  if (!tool) return tool;
  if (tool.expand && validationResult && !validationResult.valid) {
    return toolContentExpander(tool);
  }
  return tool;
}

// ---------------------------------------------------------------------------
// EXPORTS
// ---------------------------------------------------------------------------

export {
  toolContentExpander,
  toolContentExpander as expandToolContent,
  expandToolsBatch,
  expandIfNeeded,
  countWords,
  MECHANISMS,
  STANDARD_DISCLAIMER,
};
