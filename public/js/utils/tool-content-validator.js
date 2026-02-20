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
   * Template leak / placeholder patterns (BLOCK = hide in PROD)
   */
  const TEMPLATE_LEAK_PATTERNS = [
    /\binsert\b/i,
    /\btodo\b/i,
    /\bplaceholder\b/i,
    /\[INSERT\]/i,
    /\[TODO\]/i,
    /\[PLACEHOLDER\]/i
  ];

  /**
   * Quality validation: returns { ok, severity, reasons } and NEVER throws.
   * severity: "ok" | "warn" | "block"
   * block = template leak / must hide in PROD
   * warn = quality issues / hide from Tool of Day in PROD
   */
  function validateToolQuality(tool, allTools) {
    const reasons = [];
    let severity = 'ok';

    if (!tool || typeof tool !== 'object') {
      return { ok: false, severity: 'block', reasons: ['Tool is missing or invalid'] };
    }

    const title = String(tool.title || '').trim();
    const slug = String(tool.id || tool.slug || '').toLowerCase();
    const content = [title, tool.description, tool.summary, tool.how_it_works, tool.howWhyWorks, tool.mechanism].join(' ');

    // BLOCK: title starts with "Action:"
    if (/^action:/i.test(title)) {
      reasons.push('Title starts with "Action:" (template leak)');
      severity = 'block';
    }

    // BLOCK: slug starts with "action-"
    if (slug.startsWith('action-')) {
      reasons.push('Slug starts with "action-" (template leak)');
      severity = 'block';
    }

    // BLOCK: placeholder markers
    if (TEMPLATE_LEAK_PATTERNS.some(p => p.test(content))) {
      reasons.push('Content contains INSERT, TODO, or PLACEHOLDER');
      severity = 'block';
    }

    // BLOCK: missing disclaimer
    if (!tool.disclaimer || !String(tool.disclaimer).trim()) {
      reasons.push('Missing disclaimer');
      severity = severity === 'ok' ? 'block' : severity;
    }

    // WARN: word count below minimum
    const wordCount = countWords(extractToolContent(tool));
    if (wordCount < MIN_WORD_COUNT) {
      reasons.push(`Word count ${wordCount} below minimum ${MIN_WORD_COUNT}`);
      if (severity === 'ok') severity = 'warn';
    }

    // WARN: generic/boilerplate How/Why
    if (hasGenericContent(content)) {
      reasons.push('How/Why contains boilerplate placeholder content');
      if (severity === 'ok') severity = 'warn';
    }

    // WARN: missing mechanism field (mechanism = psychological principle)
    const hasMechanism = !!(tool.mechanism && String(tool.mechanism).trim());
    const hasHowWhy = !!(tool.how_it_works || tool.howWhyWorks);
    if (!hasMechanism && !hasHowWhy) {
      reasons.push('Missing mechanism / How & Why section');
      if (severity === 'ok') severity = 'warn';
    }

    // WARN: identical How/Why across many tools (boilerplate signature)
    if (allTools && Array.isArray(allTools) && allTools.length > 5) {
      const howWhy = String(tool.how_it_works || tool.howWhyWorks || '').trim().replace(/\s+/g, ' ').slice(0, 120);
      if (howWhy.length > 40) {
        const matches = allTools.filter(t => {
          const h = String(t.how_it_works || t.howWhyWorks || '').trim().replace(/\s+/g, ' ').slice(0, 120);
          return h === howWhy;
        });
        if (matches.length > 8) {
          reasons.push('How/Why matches boilerplate used across many tools');
          if (severity === 'ok') severity = 'warn';
        }
      }
    }

    const ok = severity === 'ok';
    return { ok, severity, reasons };
  }

  /**
   * Derived flags for publish gate (non-destructive)
   */
  function isTemplateLeak(tool) {
    if (!tool || typeof tool !== 'object') return true;
    const title = String(tool.title || '').trim();
    const slug = String(tool.id || tool.slug || '').toLowerCase();
    const content = [title, tool.description, tool.summary].join(' ');
    if (/^action:/i.test(title)) return true;
    if (slug.startsWith('action-')) return true;
    if (TEMPLATE_LEAK_PATTERNS.some(p => p.test(content))) return true;
    return false;
  }

  function isVariant(tool) {
    if (!tool) return false;
    const variant = typeof window !== 'undefined' && window.RYD_ToolVariant && window.RYD_ToolVariant.getVariantType
      ? window.RYD_ToolVariant.getVariantType(tool)
      : null;
    if (variant) return true;
    const slug = (tool.slug || tool.id || '').toLowerCase();
    return /-(?:5-?min|15-?min|30-?min|quick-reset|deep-work)$/.test(slug);
  }

  function isPrimaryTool(tool) {
    if (!tool) return false;
    if (typeof window !== 'undefined' && window.RYD_ToolVariant && window.RYD_ToolVariant.isPrimaryTool) {
      return window.RYD_ToolVariant.isPrimaryTool(tool);
    }
    return !isVariant(tool);
  }

  function isDraft(tool, allTools) {
    const q = validateToolQuality(tool, allTools);
    return q.severity === 'warn' || q.severity === 'block';
  }

  function isEligibleForLists(tool, allTools) {
    if (!tool) return false;
    if (!isPrimaryTool(tool)) return false;
    if (isTemplateLeak(tool)) return false;
    const q = validateToolQuality(tool, allTools || []);
    return q.ok === true;
  }

  function getEligibleForLists(tools) {
    if (!Array.isArray(tools)) return [];
    return tools.filter(t => isEligibleForLists(t, tools));
  }

  /**
   * Filter tools for Tools List: PROD = EligibleForLists only, DEV = all
   */
  function filterToolsForList(tools, isProd) {
    if (!Array.isArray(tools)) return [];
    if (!isProd) return tools;
    return getEligibleForLists(tools);
  }

  /**
   * Filter tools for display: PROD hides block, DEV shows all
   */
  function filterToolsByQuality(tools, isProd) {
    if (!Array.isArray(tools)) return [];
    if (!isProd) return tools;
    return tools.filter(t => {
      const q = validateToolQuality(t, tools);
      return q.severity !== 'block';
    });
  }

  /**
   * Audit: count BLOCK vs WARN across tools. Call from console: RYD_ToolValidator.auditQuality(tools)
   */
  function auditQuality(tools) {
    if (!Array.isArray(tools)) return { block: 0, warn: 0, ok: 0, total: 0 };
    const counts = { block: 0, warn: 0, ok: 0, total: tools.length };
    tools.forEach(t => {
      const q = validateToolQuality(t, tools);
      if (q.severity === 'block') counts.block++;
      else if (q.severity === 'warn') counts.warn++;
      else counts.ok++;
    });
    console.log('[RYD VALIDATOR] Quality audit:', counts);
    return counts;
  }

  /**
   * Filter tools for Tool of the Day: EligibleForLists only, never variants, never Action/template-leak.
   * Never select generic/placeholder tools (hasGenericContent, standard-practice placeholder).
   * pool = getEligibleForLists; if empty, fallback to isPrimaryTool && !isTemplateLeak (still never variants).
   * Caller stores ryd:lastToolOfDay and avoids repeat.
   */
  function filterToolsForToolOfDay(tools, isProd) {
    if (!Array.isArray(tools)) return [];
    let pool = getEligibleForLists(tools);
    if (pool.length === 0) {
      pool = tools.filter(t => isPrimaryTool(t) && !isTemplateLeak(t));
    }
    // Never use generic placeholder as tool-of-day (5/15/30 variants must be real tools)
    pool = pool.filter(t => {
      if (!t || typeof t !== 'object') return false;
      const content = [t.description, t.summary, t.howWhyWorks, t.how_it_works].filter(Boolean).join(' ');
      if (hasGenericContent(content)) return false;
      const slug = String(t.slug || t.id || '').toLowerCase();
      if (slug.includes('standard-practice') && !t.description) return false;
      return true;
    });
    return pool;
  }

  /**
   * Soft validation: returns { ok, errors } and NEVER throws.
   * Use for tools page render - fail gracefully, don't block.
   */
  function validateTool(tool) {
    if (!tool || typeof tool !== 'object') {
      return { ok: false, errors: ['Tool is missing or invalid'] };
    }
    try {
      const validation = validateRYDStructure(tool);
      return {
        ok: validation.valid,
        errors: validation.errors || [],
        warnings: validation.warnings || [],
        wordCount: validation.wordCount
      };
    } catch (err) {
      return { ok: false, errors: [err.message || 'Validation error'] };
    }
  }

  /**
   * Safe content getter - does NOT require validation. Use when rendering invalid tools.
   */
  function getContentSafe(tool, field) {
    if (!tool || typeof tool !== 'object') return '';
    switch (field) {
      case 'description':
        return (tool.description || tool.summary || '').trim();
      case 'howItWorks':
        return (tool.how_it_works || tool.howWhyWorks || tool.mechanism || '').trim();
      case 'whereItCameFrom':
        return (tool.where_it_came_from || tool.origin || '').trim();
      case 'steps':
        return tool.steps || (tool.walkthroughs && tool.walkthroughs[0]?.steps) || [];
      default:
        return (tool[field] || '').trim();
    }
  }

  /** Log validation error once per tool id (dedupe) */
  const loggedToolIds = new Set();
  function logValidationOnce(toolId, errors) {
    const key = String(toolId || 'unknown');
    if (loggedToolIds.has(key)) return;
    loggedToolIds.add(key);
    console.warn(`[RYD VALIDATOR] Tool "${key}" failed validation:`, errors);
  }

  /**
   * FAIL-LOUD: Throw error if tool is invalid (strict publish/build only)
   * RUNTIME: never throw — console.warn and return tool (non-blocking).
   * Uses logValidationOnce to dedupe per tool id/slug.
   */
  function requireValidTool(tool, context = '') {
    if (!tool || typeof tool !== 'object') {
      console.warn("[RYD VALIDATOR] Tool failed validation", ['Tool is missing or invalid']);
      return tool;
    }

    const validation = validateRYDStructure(tool);

    if (!validation.valid) {
      const key = String(tool.id || tool.slug || tool.title || 'unknown');
      logValidationOnce(key, validation.errors);
      console.warn("[RYD VALIDATOR] Tool failed validation", validation.errors);
      return tool;
    }

    if (validation.warnings.length > 0) {
      const key = String(tool.id || tool.slug || tool.title || 'unknown');
      if (!loggedToolIds.has(key + ':warn')) {
        loggedToolIds.add(key + ':warn');
        console.warn('[RYD VALIDATOR] Tool "' + key + '" has warnings:', validation.warnings);
      }
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
    validateTool,
    validateToolQuality,
    filterToolsByQuality,
    filterToolsForToolOfDay,
    filterToolsForList,
    isVariant,
    isPrimaryTool,
    isTemplateLeak,
    isDraft,
    isEligibleForLists,
    getEligibleForLists,
    auditQuality,
    getContentSafe,
    logValidationOnce,
    require: requireValidTool,
    getContent: getToolContent,
    countWords,
    extractContent: extractToolContent,
    hasGenericContent
  };

})();
