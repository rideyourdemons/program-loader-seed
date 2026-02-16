/**
 * Unique Content Generator - Market-Ready Matrix
 * 
 * Maps specific node IDs to duration-specific content (5/15/30 min)
 * Eliminates generic boilerplate by generating unique content per tool
 * Uses 0.82 clustering coefficient for nearest-node lookup
 */

(function() {
  'use strict';

  const CLUSTERING_COEFFICIENT = 0.82;

  /**
   * Generate unique content for 5-minute "Push" (high-velocity tactical)
   */
  function generate5MinContent(tool, context = {}) {
    if (!tool || !tool.id) {
      throw new Error('[ContentGenerator] Tool ID required for 5-min content');
    }

    // Extract tool-specific data
    const toolId = tool.id;
    const category = tool.category || context.category || 'general';
    const painPoint = context.activePain || context.painPointId || '';
    
    // Generate high-velocity tactical step based on tool category
    const categoryTactics = {
      'breathing': `Take 3 rapid breaths: Inhale sharply through your nose (2 seconds), hold (1 second), exhale forcefully through your mouth (2 seconds). This interrupts the stress response cycle immediately.`,
      'anxiety': `Identify the physical sensation (chest tightness, racing heart, etc.). Name it out loud: "This is [sensation]." This creates cognitive distance from the feeling.`,
      'depression': `Stand up. Walk to a window or door. Look at one thing outside for 10 seconds. This breaks the mental loop by shifting visual focus.`,
      'anger': `Clench your fists for 5 seconds, then release. Repeat 3 times. This discharges physical tension without externalizing it.`,
      'stress': `Write down the ONE thing causing stress right now. Circle it. This externalizes the stressor and makes it manageable.`,
      'default': `Identify the core feeling in one word. Say it out loud. This creates immediate cognitive clarity.`
    };

    const tactic = categoryTactics[category] || categoryTactics['default'];

    return {
      title: `Quick Push: ${tool.title || 'Immediate Action'}`,
      steps: [
        `Stop what you're doing. Set a timer for 5 minutes.`,
        tactic,
        `Notice what shifts in your body or mind after this action.`,
        `Decide: Continue with this tool for 15 minutes, or return to what you were doing.`
      ],
      description: `High-velocity tactical intervention for ${tool.title}. Designed for immediate impact when you need a quick reset.`
    };
  }

  /**
   * Generate unique content for 15-minute "Standard" (3-step procedural)
   */
  function generate15MinContent(tool, context = {}) {
    if (!tool || !tool.id) {
      throw new Error('[ContentGenerator] Tool ID required for 15-min content');
    }

    const toolId = tool.id;
    const description = tool.description || tool.summary || '';
    const painPoint = context.activePain || context.painPointId || '';

    // Extract key elements from tool description
    const descriptionLines = description.split(/[\.\n]/).filter(line => 
      line.trim().length > 20 && 
      !line.toLowerCase().includes('login') &&
      !line.toLowerCase().includes('helps you')
    );

    // Generate 3-step procedural walkthrough
    const step1 = descriptionLines[0] || `Begin by identifying what you're working with: ${painPoint || 'your current challenge'}.`;
    const step2 = descriptionLines[1] || `Apply the core mechanism of ${tool.title}: focus on the process, not the outcome.`;
    const step3 = descriptionLines[2] || `Notice what changes. Document one specific shift you observe.`;

    return {
      title: `Standard Workthrough: ${tool.title}`,
      steps: [
        `Set aside 15 minutes in a space where you won't be interrupted.`,
        step1,
        step2,
        step3,
        `Take 2 minutes to reflect: What did you learn from this process?`,
        `Identify one concrete action you'll take based on this workthrough.`
      ],
      description: `Structured 15-minute procedural walkthrough for ${tool.title}. Uses the tool's specific description to create unique steps.`
    };
  }

  /**
   * Generate unique content for 30-minute "Deep Dive" (strategic integration)
   */
  function generate30MinContent(tool, context = {}) {
    if (!tool || !tool.id) {
      throw new Error('[ContentGenerator] Tool ID required for 30-min content');
    }

    const toolId = tool.id;
    const activePain = context.activePain || context.painPointId || 'your current challenge';
    const howItWorks = tool.how_it_works || tool.howWhyWorks || tool.mechanism || '';
    const origin = tool.where_it_came_from || tool.origin || '';

    // Generate strategic integration plan referencing active pain
    return {
      title: `Deep Dive: ${tool.title}`,
      steps: [
        `Set aside 30 minutes. Create a quiet space. Put your phone away.`,
        `Begin with 5 minutes of quiet breathing. Let your body settle.`,
        `Identify the core issue: ${activePain}. Write it down.`,
        `Explore what this issue means to you personally. What patterns do you notice?`,
        `Apply ${tool.title}: ${howItWorks ? howItWorks.substring(0, 100) + '...' : 'Use the tool\'s core mechanism.'}`,
        `Break the issue into component parts. What's within your control? What isn't?`,
        `Choose one aspect you can influence right now.`,
        `Develop a specific plan of action. Write down 3 concrete steps.`,
        `Take the first step of your plan. Do it now, even if it's small.`,
        `Observe what happens, both internally and externally.`,
        `Reflect: What did you learn from this deep work?`,
        `Identify what you'll do differently going forward.`,
        `Acknowledge your effort and commitment to working through this.`
      ],
      description: `Strategic 30-minute integration plan for ${tool.title}. References your active pain point (${activePain}) and creates a personalized deep work session.`
    };
  }

  /**
   * Find nearest related node using 0.82 clustering coefficient
   */
  async function findNearestNode(toolId, toolsIndex, context = {}) {
    if (!toolsIndex || typeof toolsIndex !== 'object') {
      return null;
    }

    const currentTool = toolsIndex[toolId];
    if (!currentTool) {
      return null;
    }

    // Calculate similarity based on clustering coefficient
    let bestMatch = null;
    let bestScore = 0;

    for (const [id, tool] of Object.entries(toolsIndex)) {
      if (id === toolId) continue;

      let score = 0;

      // Category match
      if (tool.category === currentTool.category) {
        score += 0.3;
      }

      // Pain point overlap
      const currentPainPoints = currentTool.painPointIds || [];
      const toolPainPoints = tool.painPointIds || [];
      const overlap = currentPainPoints.filter(pp => toolPainPoints.includes(pp)).length;
      if (overlap > 0) {
        score += overlap * 0.2;
      }

      // Gate overlap
      const currentGates = currentTool.gateIds || [];
      const toolGates = tool.gateIds || [];
      const gateOverlap = currentGates.filter(g => toolGates.includes(g)).length;
      if (gateOverlap > 0) {
        score += gateOverlap * 0.25;
      }

      // Keyword similarity
      const currentKeywords = currentTool.keywords || [];
      const toolKeywords = tool.keywords || [];
      const keywordOverlap = currentKeywords.filter(k => toolKeywords.includes(k)).length;
      if (keywordOverlap > 0) {
        score += keywordOverlap * 0.1;
      }

      // Apply clustering coefficient threshold
      if (score >= CLUSTERING_COEFFICIENT && score > bestScore) {
        bestScore = score;
        bestMatch = tool;
      }
    }

    return bestMatch;
  }

  /**
   * Main content generator - maps node ID to duration-specific content
   */
  function generateContent(tool, duration, context = {}) {
    if (!tool || !tool.id) {
      throw new Error('[ContentGenerator] Tool with ID required');
    }

    // Normalize duration
    const durationMin = parseInt(duration) || 15;
    
    if (durationMin <= 5) {
      return generate5MinContent(tool, context);
    } else if (durationMin <= 15) {
      return generate15MinContent(tool, context);
    } else {
      return generate30MinContent(tool, context);
    }
  }

  /**
   * Generate content with fallback to nearest node if data missing
   */
  async function generateContentWithFallback(tool, duration, context = {}) {
    try {
      return generateContent(tool, duration, context);
    } catch (error) {
      // If data is missing, perform 0.82-coefficient lookup
      if (context.toolsIndex) {
        const nearestNode = await findNearestNode(tool.id, context.toolsIndex, context);
        if (nearestNode) {
          console.warn(`[ContentGenerator] Using nearest node for ${tool.id}: ${nearestNode.id}`);
          return generateContent(nearestNode, duration, context);
        }
      }
      
      // If no nearest node found, throw error (fail-loud)
      throw new Error(`[ContentGenerator] Cannot generate content for ${tool.id}: ${error.message}`);
    }
  }

  // Export to global scope
  window.RYD_ContentGenerator = {
    generate5Min: generate5MinContent,
    generate15Min: generate15MinContent,
    generate30Min: generate30MinContent,
    generate: generateContent,
    generateWithFallback: generateContentWithFallback,
    findNearestNode
  };

})();
