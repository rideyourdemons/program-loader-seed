/**
 * Temporal Weighting System
 * Implements variable time blocks based on node depth and cluster size
 * Prevents uniform 30-minute boilerplate
 */

(function() {
  'use strict';

  /**
   * Calculate temporal weight based on node characteristics
   * @param {Object} tool - Tool object
   * @param {Object} context - Context with gateId, painPointId, cluster info
   * @returns {string} Duration string (e.g., "5 minutes", "15 minutes", "30 minutes")
   */
  function calculateTemporalWeight(tool, context = {}) {
    // 1. Variable Temporal Weighting Logic
    
    // Micro-Tools (Pumps): High-intensity, low-drag = 5 min
    // Criteria: Leaf nodes, small cluster, single pain point
    const isMicroTool = (
      (!context.painPointIds || context.painPointIds.length <= 1) &&
      (!context.gateIds || context.gateIds.length <= 1) &&
      (!tool.painPointIds || tool.painPointIds.length <= 1)
    );
    
    if (isMicroTool) {
      return '5 minutes';
    }
    
    // Core Tools: Standard execution = 15 min
    // Criteria: Medium cluster, 2-3 pain points, moderate depth
    const clusterSize = calculateClusterSize(tool, context);
    const nodeDepth = calculateNodeDepth(tool, context);
    
    const isCoreTool = (
      clusterSize >= 2 && clusterSize <= 5 &&
      nodeDepth >= 1 && nodeDepth <= 2
    );
    
    if (isCoreTool) {
      return '15 minutes';
    }
    
    // Strategic Gates: Deep architectural work = 30-60 min
    // Criteria: Large clusters, multiple gates, high depth
    const isStrategicGate = (
      clusterSize > 5 ||
      nodeDepth > 2 ||
      (context.gateIds && context.gateIds.length > 1) ||
      (tool.gateIds && tool.gateIds.length > 1)
    );
    
    if (isStrategicGate) {
      // Deeper work = longer time
      if (clusterSize > 10 || nodeDepth > 3) {
        return '60 minutes';
      }
      return '30 minutes';
    }
    
    // Default fallback (shouldn't happen, but safety)
    return tool.duration || '15 minutes';
  }

  /**
   * Calculate cluster size (number of connected nodes)
   */
  function calculateClusterSize(tool, context) {
    let size = 0;
    
    // Count pain points
    if (tool.painPointIds && Array.isArray(tool.painPointIds)) {
      size += tool.painPointIds.length;
    }
    if (context.painPointIds && Array.isArray(context.painPointIds)) {
      size += context.painPointIds.length;
    }
    
    // Count gates (weighted higher)
    if (tool.gateIds && Array.isArray(tool.gateIds)) {
      size += tool.gateIds.length * 2; // Gates are more complex
    }
    if (context.gateIds && Array.isArray(context.gateIds)) {
      size += context.gateIds.length * 2;
    }
    
    // Count keywords (indicates breadth)
    if (tool.keywords && Array.isArray(tool.keywords)) {
      size += Math.floor(tool.keywords.length / 3); // Every 3 keywords = +1 complexity
    }
    
    return size;
  }

  /**
   * Calculate node depth (how many layers deep in the hierarchy)
   */
  function calculateNodeDepth(tool, context) {
    let depth = 0;
    
    // Base depth from tool structure
    if (tool.walkthroughs && Array.isArray(tool.walkthroughs)) {
      depth += tool.walkthroughs.length; // More walkthroughs = deeper
    }
    
    // Depth from context (gate -> pain point -> tool)
    if (context.gateId) depth += 1;
    if (context.painPointId) depth += 1;
    if (tool.id) depth += 1;
    
    // Depth from related tools
    if (tool.relatedTools && Array.isArray(tool.relatedTools)) {
      depth += Math.min(tool.relatedTools.length, 2); // Cap at 2
    }
    
    return depth;
  }

  /**
   * Generate dynamic description based on connected pain points
   * Uses 0.82 clustering data to pull unique attributes
   */
  function generateDynamicDescription(tool, context = {}) {
    // 2. Dynamic Content Generation
    
    let baseDescription = '';
    if (window.RYD_ToolValidator) {
      const v = window.RYD_ToolValidator.validateTool(tool);
      if (v.ok) {
        baseDescription = window.RYD_ToolValidator.getContent(tool, 'description');
      } else {
        console.warn('[Temporal Weighting] Tool validation failed, using safe content:', v.errors);
        baseDescription = window.RYD_ToolValidator.getContentSafe(tool, 'description');
      }
    } else {
      baseDescription = tool.description || tool.summary || '';
    }
    
    // If tool is linked to specific pain points, customize description
    const painPointIds = context.painPointIds || tool.painPointIds || [];
    const gateIds = context.gateIds || tool.gateIds || [];
    
    // Get pain point context from MatrixExpander if available
    let painPointContext = '';
    if (window.MatrixExpander && typeof window.MatrixExpander.getPainPointsByGate === 'function') {
      try {
        const painPointsByGate = window.MatrixExpander.getPainPointsByGate() || {};
        
        // Find pain points that match this tool
        for (const gateId of Object.keys(painPointsByGate)) {
          const painPoints = painPointsByGate[gateId] || [];
          const matchingPainPoints = painPoints.filter(pp => 
            painPointIds.includes(pp.id) || 
            (pp.toolIds && pp.toolIds.includes(tool.id))
          );
          
          if (matchingPainPoints.length > 0) {
            // Extract unique attributes from connected pain points
            const attributes = matchingPainPoints.map(pp => {
              if (pp.title && pp.title.toLowerCase().includes('financial')) {
                return 'financial metrics';
              }
              if (pp.title && pp.title.toLowerCase().includes('relationship')) {
                return 'relationship dynamics';
              }
              if (pp.title && pp.title.toLowerCase().includes('career')) {
                return 'career alignment';
              }
              if (pp.title && pp.title.toLowerCase().includes('health')) {
                return 'health optimization';
              }
              return null;
            }).filter(Boolean);
            
            if (attributes.length > 0) {
              painPointContext = ` This tool specifically addresses ${attributes.join(' and ')}.`;
            }
          }
        }
      } catch (e) {
        console.warn('[Temporal Weighting] Error getting pain point context:', e);
      }
    }
    
    // If no specific context, use generic but avoid repetition
    if (!painPointContext && baseDescription) {
      // Check if description is generic boilerplate
      const genericPatterns = [
        'This technique helps',
        'A practical tool',
        'Learn to',
        'This tool helps you'
      ];
      
      const isGeneric = genericPatterns.some(pattern => 
        baseDescription.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (isGeneric && tool.category) {
        painPointContext = ` Specifically designed for ${tool.category} challenges.`;
      }
    }
    
    return baseDescription + painPointContext;
  }

  /**
   * Generate dynamic work-through content
   * Avoids repetitive descriptions
   */
  function generateDynamicWorkthrough(tool, context = {}) {
    const baseWorkthrough = tool.workthroughContent || tool.walkthroughs?.[0]?.steps || [];
    
    // If tool is linked to a 'Financial Demon', mention financial metrics
    const painPointIds = context.painPointIds || tool.painPointIds || [];
    const hasFinancialContext = painPointIds.some(id => 
      String(id).toLowerCase().includes('financial') ||
      String(id).toLowerCase().includes('money') ||
      String(id).toLowerCase().includes('wealth')
    );
    
    if (hasFinancialContext && Array.isArray(baseWorkthrough)) {
      // Add financial-specific guidance
      return [
        ...baseWorkthrough,
        'Track your financial metrics: income, expenses, savings rate, and investment returns.',
        'Identify patterns in your financial behavior that align with your values.',
        'Set specific, measurable financial goals based on your insights.'
      ];
    }
    
    return baseWorkthrough;
  }

  /**
   * Apply temporal weighting to a tool instance
   */
  function applyTemporalWeighting(toolInstance, context = {}) {
    const tool = toolInstance.baseTool || toolInstance.base || toolInstance;
    
    // Calculate new duration
    const newDuration = calculateTemporalWeight(tool, {
      ...context,
      painPointIds: tool.painPointIds || context.painPointIds,
      gateIds: tool.gateIds || context.gateIds
    });
    
    // Generate dynamic description
    const dynamicDescription = generateDynamicDescription(tool, context);
    
    // Generate dynamic work-through
    const dynamicWorkthrough = generateDynamicWorkthrough(tool, context);
    
    return {
      ...toolInstance,
      duration: newDuration,
      description: dynamicDescription,
      workthroughContent: dynamicWorkthrough,
      temporalWeight: {
        clusterSize: calculateClusterSize(tool, context),
        nodeDepth: calculateNodeDepth(tool, context),
        timeBlock: newDuration
      }
    };
  }

  // Export to window
  window.TemporalWeighting = {
    calculateTemporalWeight,
    calculateClusterSize,
    calculateNodeDepth,
    generateDynamicDescription,
    generateDynamicWorkthrough,
    applyTemporalWeighting
  };

  console.log('[Temporal Weighting] Variable temporal weighting system loaded');
})();
