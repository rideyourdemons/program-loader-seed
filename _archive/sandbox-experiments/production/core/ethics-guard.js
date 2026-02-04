/**
 * Ethics Guard - Hard Veto Rules
 * 
 * PURPOSE: Block clinical, manipulative, or unsafe language/content
 * ENFORCEMENT: Fail-closed - if uncertain, block
 * SCOPE: All content, UX patterns, and system outputs
 */

export class EthicsGuard {
  constructor() {
    // Clinical terms that MUST be blocked (self-help only, not therapy)
    this.blockedClinicalTerms = [
      'diagnose', 'diagnosis', 'diagnostic',
      'treat', 'treatment', 'therapy', 'therapeutic', 'therapist',
      'heal', 'healing', 'cure', 'cured',
      'disorder', 'condition', 'syndrome', 'illness', 'disease',
      'prescribe', 'prescription', 'medication', 'medicate',
      'patient', 'clinical', 'clinician', 'psychiatrist', 'psychologist'
    ];

    // Urgency/pressure framing that MUST be blocked
    this.blockedUrgencyPatterns = [
      /you need this/i,
      /don't miss/i,
      /fix yourself/i,
      /fix your/i,
      /must do/i,
      /you must/i,
      /urgent/i,
      /immediate/i,
      /right now/i,
      /act now/i,
      /limited time/i
    ];

    // Emotional leverage patterns that MUST be blocked
    this.blockedEmotionalLeverage = [
      /if you don't/i,
      /you're broken/i,
      /you're damaged/i,
      /you're sick/i,
      /you're wrong/i,
      /everyone else/i,
      /you'll regret/i,
      /you'll fail/i
    ];

    // Outcome promises that MUST be blocked
    this.blockedOutcomePromises = [
      /guaranteed/i,
      /will fix/i,
      /will cure/i,
      /will heal/i,
      /will solve/i,
      /promise/i,
      /guarantee/i,
      /100% effective/i,
      /proven to cure/i
    ];

    // Personalized psychological claims that MUST be blocked
    this.blockedPersonalClaims = [
      /you have/i + /(depression|anxiety|ptsd|bipolar|ocd|adhd)/i,
      /you are/i + /(depressed|anxious|traumatized|bipolar)/i,
      /you suffer from/i,
      /you're experiencing/i + /(disorder|condition|syndrome)/i
    ];

    // Numerology-as-truth framing that MUST be blocked
    this.blockedNumerologyFraming = [
      /this means/i,
      /this predicts/i,
      /this will happen/i,
      /this is your/i,
      /numerology says/i,
      /the numbers reveal/i,
      /this is true/i,
      /this guarantees/i,
      /you should/i + /(because|based on|according to)/i + /(numerology|numbers)/i
    ];
  }

  /**
   * Check content against all veto rules
   * @param {string} content - Content to check
   * @param {string} context - Where content appears (e.g., 'tool', 'navigation', 'store')
   * @returns {Object} { allowed: boolean, violations: Array, reason: string }
   */
  checkContent(content, context = 'general') {
    if (!content || typeof content !== 'string') {
      return { allowed: false, violations: ['INVALID_INPUT'], reason: 'Content must be a non-empty string' };
    }

    const violations = [];
    const normalizedContent = content.toLowerCase();

    // Check for clinical terms
    for (const term of this.blockedClinicalTerms) {
      if (normalizedContent.includes(term)) {
        violations.push(`CLINICAL_TERM: "${term}"`);
      }
    }

    // Check for urgency patterns
    for (const pattern of this.blockedUrgencyPatterns) {
      if (pattern.test(content)) {
        violations.push(`URGENCY_PATTERN: "${pattern}"`);
      }
    }

    // Check for emotional leverage
    for (const pattern of this.blockedEmotionalLeverage) {
      if (pattern.test(content)) {
        violations.push(`EMOTIONAL_LEVERAGE: "${pattern}"`);
      }
    }

    // Check for outcome promises
    for (const pattern of this.blockedOutcomePromises) {
      if (pattern.test(content)) {
        violations.push(`OUTCOME_PROMISE: "${pattern}"`);
      }
    }

    // Check for personalized claims
    for (const pattern of this.blockedPersonalClaims) {
      if (pattern.test(content)) {
        violations.push(`PERSONAL_CLAIM: "${pattern}"`);
      }
    }

    // Check for numerology-as-truth framing
    for (const pattern of this.blockedNumerologyFraming) {
      if (pattern.test(content)) {
        violations.push(`NUMEROLOGY_AS_TRUTH: "${pattern}" - Numerology must be presented as symbolic reflection only`);
      }
    }

    const allowed = violations.length === 0;

    return {
      allowed,
      violations,
      reason: allowed 
        ? 'Content passes all ethics checks' 
        : `Content blocked: ${violations.join('; ')}`
    };
  }

  /**
   * Check UX pattern for manipulation
   * @param {Object} uxPattern - UX pattern to check
   * @returns {Object} { allowed: boolean, violations: Array }
   */
  checkUXPattern(uxPattern) {
    const violations = [];

    // Block timing-based on distress/emotion
    if (uxPattern.triggerOnDistress || uxPattern.triggerOnEmotion) {
      violations.push('UX_MANIPULATION: Cannot trigger on distress or emotion');
    }

    // Block forced actions
    if (uxPattern.forceAction || uxPattern.preventExit) {
      violations.push('UX_MANIPULATION: Cannot force actions or prevent exit');
    }

    // Block urgency timers
    if (uxPattern.countdownTimer || uxPattern.urgencyTimer) {
      violations.push('UX_MANIPULATION: Cannot use urgency timers');
    }

    // Block dark patterns
    if (uxPattern.darkPattern || uxPattern.confusingChoice) {
      violations.push('UX_MANIPULATION: Dark patterns prohibited');
    }

    return {
      allowed: violations.length === 0,
      violations
    };
  }

  /**
   * Sanitize content by removing blocked terms (for logging/debugging only)
   * NOTE: This should NOT be used for production content - blocked content should be rejected entirely
   * @param {string} content
   * @returns {string} Sanitized content (for audit purposes only)
   */
  sanitizeForAudit(content) {
    let sanitized = content;
    
    for (const term of this.blockedClinicalTerms) {
      const regex = new RegExp(term, 'gi');
      sanitized = sanitized.replace(regex, '[BLOCKED]');
    }

    return sanitized;
  }
}

