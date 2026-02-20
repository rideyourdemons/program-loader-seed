/**
 * RYD Tool Content Expander - DEV ONLY
 * Upgrades draft/failing tools to production-grade content at runtime.
 * Used in DEV when hostname is localhost. PROD never auto-expands.
 *
 * Export: expandToolContent(tool) -> enriched tool object
 */

(function() {
  'use strict';

  const MECHANISMS = {
    'nervous-system-downshift': { id: 'nervous-system-downshift', label: 'Nervous System Downshift', description: 'Activates the parasympathetic branch (rest-and-digest) via breath, posture, or sensation, shifting the body out of fight-or-flight.' },
    'interoceptive-reframing': { id: 'interoceptive-reframing', label: 'Interoceptive Reframing', description: 'Reframes internal sensations from threat signals to neutral information, reducing anxiety-driven avoidance.' },
    'behavioral-activation': { id: 'behavioral-activation', label: 'Behavioral Activation', description: 'Uses small, concrete actions to interrupt withdrawal and rebuild engagement. Action often precedes motivation rather than the reverse.' },
    'cognitive-defusion': { id: 'cognitive-defusion', label: 'Cognitive Defusion', description: 'Creates distance between you and your thoughts so they lose their grip. You notice the thought instead of being run by it.' },
    'exposure-response': { id: 'exposure-response', label: 'Exposure / Response Prevention', description: 'Approaches the avoided situation or sensation gradually while refraining from the usual safety behavior, weakening the fear association over time.' },
    'self-compassion': { id: 'self-compassion', label: 'Self-Compassion Reset', description: 'Replaces self-criticism with acknowledgment and warmth, reducing shame and creating space for choice rather than reactivity.' },
    'impulse-gap': { id: 'impulse-gap', label: 'Impulse Gap', description: 'Creates a pause between trigger and response, allowing physiological arousal to decrease before acting.' },
    'meaning-making': { id: 'meaning-making', label: 'Meaning-Making', description: 'Integrates the loss into one\'s life narrative while allowing oscillating between loss-oriented and restoration-oriented coping.' },
    'attention-shift': { id: 'attention-shift', label: 'Attention Shift / Salience Interrupt', description: 'Redirects focus from the internal distress loop to an external anchor or neutral stimulus.' },
    'implementation-intention': { id: 'implementation-intention', label: 'Implementation Intention', description: 'Pre-links a specific trigger (when/where) to a specific response (then I will).' },
    'environmental-friction': { id: 'environmental-friction', label: 'Environmental Friction', description: 'Changes the physical or social environment to make unwanted behavior harder.' }
  };

  const INTENT_TO_MECHANISM = [
    { pattern: /\banxiety|panic|worr(y|ied)\b/i, mechanism: 'nervous-system-downshift' },
    { pattern: /\bdepress|withdrawn|low mood\b/i, mechanism: 'behavioral-activation' },
    { pattern: /\bruminat|obsess|thought loop\b/i, mechanism: 'cognitive-defusion' },
    { pattern: /\bavoid|escape|stuck\b/i, mechanism: 'exposure-response' },
    { pattern: /\bshame|silenced|voice\b/i, mechanism: 'self-compassion' },
    { pattern: /\bangry|anger|rage\b/i, mechanism: 'impulse-gap' },
    { pattern: /\bgrief|loss|bereavement\b/i, mechanism: 'meaning-making' },
    { pattern: /\bnumb|disconnect|dissociation\b/i, mechanism: 'nervous-system-downshift' },
    { pattern: /\bprocrastinat\b/i, mechanism: 'behavioral-activation' },
    { pattern: /\boverwhelm\b/i, mechanism: 'attention-shift' },
    { pattern: /\bstress|tense|tension\b/i, mechanism: 'nervous-system-downshift' },
    { pattern: /\bpurpose|meaning|direction\b/i, mechanism: 'behavioral-activation' },
    { pattern: /\bconfid(en|ence)\b/i, mechanism: 'behavioral-activation' },
    { pattern: /\baddiction|craving|relapse\b/i, mechanism: 'environmental-friction' },
    { pattern: /\btrauma|trigger\b/i, mechanism: 'nervous-system-downshift' }
  ];

  const STANDARD_DISCLAIMER = 'The information provided is for educational purposes and is not a substitute for professional medical advice, diagnosis, or treatment. If you are in crisis or experiencing severe distress, please seek help from a qualified healthcare provider or crisis line.';

  function countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(function(w) { return w.length > 0; }).length;
  }

  function extractIntent(tool) {
    var painPointId = tool.painPointId || (tool.painPointIds && tool.painPointIds[0]);
    var slug = (tool.slug || tool.id || '').toLowerCase();
    if (painPointId) return painPointId.replace(/-/g, ' ');
    var m = slug.match(/how-do-i-(.+?)(?:-(?:quick-reset|standard-practice|deep-work))?$/);
    if (m) return m[1].replace(/-/g, ' ');
    return (tool.description || tool.summary || '').slice(0, 80) || 'manage difficulty';
  }

  function selectMechanism(tool) {
    var text = [tool.title, tool.description, tool.summary, tool.painPointId, tool.slug, tool.id].filter(Boolean).join(' ').toLowerCase();
    for (var i = 0; i < INTENT_TO_MECHANISM.length; i++) {
      if (INTENT_TO_MECHANISM[i].pattern.test(text)) return MECHANISMS[INTENT_TO_MECHANISM[i].mechanism];
    }
    return MECHANISMS['behavioral-activation'];
  }

  function generatePurpose(tool, intent, mechanism) {
    var title = tool.title || 'This tool';
    return title + ' is designed for moments when you notice the pull of ' + intent + '—whether that shows up as physical tension, mental looping, or a sense of being stuck. Many people try to think or will their way out of these states, but the body and nervous system often need a structured sequence before the mind can shift. This tool gives you that sequence. The underlying mechanism is ' + mechanism.label + ': ' + mechanism.description + ' By working through the steps, you activate that mechanism rather than staying inside the default pattern. Use it when you recognize the early signs, when you need a reset mid-situation, or when you want to build a habit of pausing before reacting.';
  }

  function generateLoop(tool, intent, mechanism) {
    var title = tool.title || 'This practice';
    return {
      trigger: 'You encounter a situation or internal cue that hooks you into ' + intent + '.',
      body: 'Your body and mind respond with familiar patterns—tension, avoidance, or rumination.',
      thought: 'Without intervention, your thoughts feed the loop.',
      behavior: 'Instead of defaulting to the usual response, you run ' + title + ' step by step.',
      result: 'The mechanism (' + mechanism.label + ') interrupts the loop. You create enough space to choose a different next move.'
    };
  }

  function generateMechanismSection(mechanism, loop) {
    return mechanism.label + ': ' + mechanism.description + ' In this tool: Trigger — ' + loop.trigger + ' Body — ' + loop.body + ' Thought — ' + loop.thought + ' Behavior — ' + loop.behavior + ' Result — ' + loop.result;
  }

  function generateSteps5(tool, intent) {
    return [
      'Pause where you are. Name one thing you notice in your body or surroundings right now.',
      'Take three slow breaths. On each exhale, let your shoulders drop slightly.',
      'Identify the specific pull you\'re feeling (e.g., ' + intent + '). Acknowledge it without judging.',
      'Choose one small, concrete action you can take in the next few minutes.',
      'Do that action. Notice what happens in your body and mind afterward.'
    ];
  }

  function generateSteps15(tool, intent) {
    return [
      'Find a space where you won\'t be interrupted for about 15 minutes. Sit or stand in a way that feels grounded.',
      'Take five slow breaths. Notice the air moving in and out; let your body settle.',
      'Identify the main challenge or feeling you\'re working with (e.g., ' + intent + ').',
      'Break it into two or three smaller pieces. Which piece feels most addressable right now?',
      'Pick one concrete action for that piece—something you could do today.',
      'Imagine doing it. What would the first step look like?',
      'Take that first step, or the smallest version of it, right now if possible.',
      'Observe what happens. What did you learn from taking action?',
      'Notice any shift in how you feel. There\'s no "right" shift—just notice.',
      'Name one next step for later today or tomorrow.'
    ];
  }

  function generateSteps30(tool, intent) {
    return [
      'Set aside 30 minutes in a space where you won\'t be interrupted.',
      'Start with five minutes of quiet breathing. Let your body and mind settle.',
      'Identify the core issue you want to work with—the deeper layer behind ' + intent + '.',
      'Explore what this issue means to you. When did you first notice it?',
      'Notice any patterns or connections to past experiences.',
      'Break the issue into parts. What\'s within your control? What isn\'t?',
      'Choose one aspect you can influence. What would a small win look like?',
      'Design a specific plan: what, when, and where.',
      'Take the first step of that plan right now, or schedule it clearly.',
      'Observe what happens. Reflect on what you learned.',
      'Identify one thing you\'ll do differently going forward.',
      'Acknowledge your effort. You showed up.'
    ];
  }

  function generateHowWhy(loop, mechanism, tool) {
    var title = tool.title || 'This tool';
    return 'How ' + title + ' works: The loop you are interrupting goes like this. ' + loop.trigger + ' ' + loop.body + ' ' + loop.thought + ' Without a deliberate intervention, that loop reinforces itself. ' + title + ' inserts a new behavior at the behavior stage. The mechanism behind it is ' + mechanism.label + '. ' + mechanism.description + ' That is why the steps are built the way they are—each one is designed to activate that mechanism. When you complete the sequence, you create enough distance and momentum to choose a different result. Over time, that change rewires the loop.';
  }

  function generateWhereItCameFrom(tool) {
    var origin = tool.where_it_came_from || tool.origin;
    if (origin && String(origin).trim().length > 50 && !/coming soon|placeholder|tbd/i.test(origin)) return origin;
    return 'This practice draws from lived experience and behavioral science principles. The mechanism is supported by research in acceptance and commitment therapy, behavioral activation, and nervous-system regulation. It has been adapted here for self-directed use when professional support is not immediately available.';
  }

  /**
   * expandToolContent(tool) -> enriched tool object
   * Adds: purpose, loop, mechanism, steps, walkthroughs, how_it_works, howWhyWorks, where_it_came_from, disclaimer
   */
  function expandToolContent(tool) {
    if (!tool || typeof tool !== 'object') return null;
    var intent = extractIntent(tool);
    var mechanism = selectMechanism(tool);
    var purpose = generatePurpose(tool, intent, mechanism);
    var loop = generateLoop(tool, intent, mechanism);
    var mechanismSection = generateMechanismSection(mechanism, loop);
    var steps5 = generateSteps5(tool, intent);
    var steps15 = generateSteps15(tool, intent);
    var steps30 = generateSteps30(tool, intent);
    var dur = (tool.duration || '').toLowerCase();
    var steps = steps15;
    if (dur.indexOf('5') >= 0 || /quick|5-?min/i.test(dur)) steps = steps5;
    else if (dur.indexOf('30') >= 0 || /deep|30-?min/i.test(dur)) steps = steps30;
    var howWhyWorks = generateHowWhy(loop, mechanism, tool);
    var whereItCameFrom = generateWhereItCameFrom(tool);
    var problem = 'When ' + intent + ' shows up, it\'s easy to get caught in a loop. This tool gives you a way out by shifting what you do in the moment.';
    var content = [purpose, problem, mechanismSection, howWhyWorks, whereItCameFrom, steps.join(' ')].join(' ');
    return Object.assign({}, tool, {
      purpose: purpose,
      problem: problem,
      loop: loop,
      mechanism: mechanismSection,
      mechanismId: mechanism.id,
      mechanismLabel: mechanism.label,
      steps: steps,
      walkthroughs: [
        { title: '5 minutes', steps: steps5 },
        { title: '15 minutes', steps: steps15 },
        { title: '30 minutes', steps: steps30 }
      ],
      how_it_works: howWhyWorks,
      howWhyWorks: howWhyWorks,
      where_it_came_from: whereItCameFrom,
      origin: whereItCameFrom,
      disclaimer: (tool.disclaimer && String(tool.disclaimer).trim().length > 20) ? tool.disclaimer : STANDARD_DISCLAIMER,
      wordCountEstimate: countWords(content)
    });
  }

  window.RYD_ToolExpander = {
    expandToolContent: expandToolContent,
    countWords: countWords
  };
})();
