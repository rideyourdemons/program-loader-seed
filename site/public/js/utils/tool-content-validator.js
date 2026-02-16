/**
 * RYD Tool Content Validator - Fail-Loud System
 * 
 * PRODUCTION REQUIREMENT: System must fail loudly if content is missing.
 * No silent fallbacks. No placeholder rendering.
 * 
 * Required RYD Production Structure:
 * 1. Tool Name (title)
 * 2. The Lock (specific behavioral/emotional trap)
 * 3. The Trigger (real activation scenario)
 * 4. The Cost (clear lived consequences)
 * 5. The Tool (step-by-step executable instructions)
 * 6. How & Why This Works (mechanism-based explanation)
 * 7. Where It Came From (real, verifiable origin)
 */

(function() {
  'use strict';

  const REQUIRED_FIELDS = {
    title: 'Tool Name is required',
    disclaimer: 'Disclaimer is required (RYD requirement)',
    how_it_works: 'How & Why This Works is required',
    where_it_came_from: 'Where It Came From is required',
    steps: 'Executable steps are required'
  };

  const MIN_WORD_COUNT = 600;
  const TARGET_WORD_COUNT = { min: 700, max: 1200 };

  /**
   * Count words in text
   */
  function countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  }

  /**
   * Extract all content from tool for word count
   */
  function extractToolContent(tool) {
    const parts = [];
    
    if (tool.title) parts.push(tool.title);
    if (tool.description) parts.push(tool.description);
    if (tool.summary) parts.push(tool.summary);
    if (tool.problem) parts.push(tool.problem);
    if (tool.how_it_works) parts.push(tool.how_it_works);
    if (tool.howWhyWorks) parts.push(tool.howWhyWorks);
    if (tool.mechanism) parts.push(tool.mechanism);
    if (tool.where_it_came_from) parts.push(tool.where_it_came_from);
    if (tool.origin) parts.push(tool.origin);
    
    // Steps content
    if (tool.steps && Array.isArray(tool.steps)) {
      tool.steps.forEach(step => {
        if (typeof step === 'string') {
          parts.push(step);
        } else if (step.content) {
          parts.push(step.content);
        } else if (step.instruction) {
          parts.push(step.instruction);
        }
      });
    }
    
    // Walkthroughs
    if (tool.walkthroughs && Array.isArray(tool.walkthroughs)) {
      tool.walkthroughs.forEach(wt => {
        if (wt.steps && Array.isArray(wt.steps)) {
          wt.steps.forEach(step => {
            if (typeof step === 'string') {
              parts.push(step);
            }
          });
        }
      });
    }
    
    return parts.join(' ');
  }

  /**
   * Check for generic placeholder content
   */
  function hasGenericContent(content) {
    if (!content || typeof content !== 'string') return false;
    
    const genericPatterns = [
      /helps you\. This practice supports/gi,
      /This practice supports emotional regulation/gi,
      /Use it when you need a clear, structured approach/gi,
      /coming soon/gi,
      /placeholder/gi,
      /to be determined/gi,
      /tbd/gi
    ];
    
    return genericPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Validate tool has required RYD structure
   */
  function validateRYDStructure(tool) {
    const errors = [];
    const warnings = [];
    
    // Check required fields
    if (!tool.title || !tool.title.trim()) {
      errors.push(REQUIRED_FIELDS.title);
    }
    
    if (!tool.disclaimer || !tool.disclaimer.trim()) {
      errors.push(REQUIRED_FIELDS.disclaimer);
    }
    
    const howItWorks = tool.how_it_works || tool.howWhyWorks || tool.mechanism;
    if (!howItWorks || !howItWorks.trim()) {
      errors.push(REQUIRED_FIELDS.how_it_works);
    }
    
    const whereItCameFrom = tool.where_it_came_from || tool.origin;
    if (!whereItCameFrom || !whereItCameFrom.trim()) {
      errors.push(REQUIRED_FIELDS.where_it_came_from);
    }
    
    // Check for executable steps
    const hasSteps = (tool.steps && Array.isArray(tool.steps) && tool.steps.length > 0) ||
                     (tool.walkthroughs && Array.isArray(tool.walkthroughs) && tool.walkthroughs.length > 0);
    if (!hasSteps) {
      errors.push(REQUIRED_FIELDS.steps);
    }
    
    // Check word count
    const content = extractToolContent(tool);
    const wordCount = countWords(content);
    
    if (wordCount < MIN_WORD_COUNT) {
      errors.push(`Tool content is ${wordCount} words. Minimum required: ${MIN_WORD_COUNT} words. Target: ${TARGET_WORD_COUNT.min}-${TARGET_WORD_COUNT.max} words.`);
    } else if (wordCount < TARGET_WORD_COUNT.min) {
      warnings.push(`Tool content is ${wordCount} words. Target range: ${TARGET_WORD_COUNT.min}-${TARGET_WORD_COUNT.max} words.`);
    }
    
    // Check for generic content
    if (hasGenericContent(content)) {
      errors.push('Tool contains generic placeholder content. Production-grade content required.');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      wordCount
    };
  }

  /**
   * FAIL-LOUD: Throw error if tool is invalid
   */
  function requireValidTool(tool, context = '') {
    if (!tool || typeof tool !== 'object') {
      throw new Error(`[RYD VALIDATOR] Tool is missing or invalid${context ? `: ${context}` : ''}`);
    }
    
    const validation = validateRYDStructure(tool);
    
    if (!validation.valid) {
      const errorMsg = `[RYD VALIDATOR] Tool "${tool.id || tool.title || 'unknown'}" failed validation${context ? ` (${context})` : ''}:\n` +
        validation.errors.map(e => `  - ${e}`).join('\n');
      
      // Log to console with full context
      console.error(errorMsg);
      console.error('Tool data:', tool);
      
      // Throw error - system must fail loudly
      throw new Error(errorMsg);
    }
    
    if (validation.warnings.length > 0) {
      console.warn(`[RYD VALIDATOR] Tool "${tool.id || tool.title}" has warnings:`, validation.warnings);
    }
    
    return validation;
  }

  /**
   * Get tool content with validation (no fallbacks)
   */
  function getToolContent(tool, field) {
    requireValidTool(tool);
    
    // No fallbacks - if field doesn't exist, validation should have caught it
    switch(field) {
      case 'description':
        return tool.description || tool.summary || '';
      case 'howItWorks':
        return tool.how_it_works || tool.howWhyWorks || tool.mechanism || '';
      case 'whereItCameFrom':
        return tool.where_it_came_from || tool.origin || '';
      case 'steps':
        return tool.steps || (tool.walkthroughs && tool.walkthroughs[0]?.steps) || [];
      default:
        return tool[field] || '';
    }
  }

  // Export to global scope
  window.RYD_ToolValidator = {
    validate: validateRYDStructure,
    require: requireValidTool,
    getContent: getToolContent,
    countWords,
    extractContent: extractToolContent,
    hasGenericContent
  };

})();
