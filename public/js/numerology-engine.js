/**
 * Numerology Engine - Symbolic Overlay Only (Client-Side)
 * 
 * PURPOSE: Provide symbolic/reflective framing as an OPTIONAL lens, not truth or guidance
 * CONSTRAINTS: 
 *   - MUST NOT claim truth, predict outcomes, guide decisions, or imply causation
 *   - MUST NOT override matrix logic or personalize psychological claims
 *   - MUST include disclosure that numerology is symbolic reflection only
 * SCOPE: Metaphorical framing and reflective prompts only
 */

class NumerologyEngine {
  constructor() {
    this.ethicsGuard = null; // Will be set if EthicsGuard is available
    this.numerologyMap = null; // Loaded from numerology-map.json
    this.requiredDisclosure = "Numerology is presented here as symbolic reflection only, not factual guidance.";
  }

  /**
   * Initialize engine with numerology map
   * @param {Object} numerologyMap - Loaded from numerology-map.json
   */
  initialize(numerologyMap) {
    this.numerologyMap = numerologyMap;
    if (window.EthicsGuard) {
      this.ethicsGuard = new window.EthicsGuard();
    }
  }

  /**
   * Calculate numerological value from text (symbolic only)
   * @param {string} text - Text to calculate value for
   * @returns {number} Numerological value (1-9, 11, 22, 33)
   */
  calculateValue(text) {
    if (!text || typeof text !== 'string') {
      return null;
    }

    const letterValues = {
      a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9,
      j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9,
      s: 1, t: 2, u: 3, v: 4, w: 5, x: 6, y: 7, z: 8
    };

    const cleaned = text.toLowerCase().replace(/[^a-z]/g, '');
    let sum = 0;

    for (const char of cleaned) {
      if (letterValues[char]) {
        sum += letterValues[char];
      }
    }

    // Reduce to single digit or master number
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
      sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    }

    return sum;
  }

  /**
   * Get symbolic meaning for a numerological value
   * MUST include disclosure and framing as symbolic only
   * @param {number} value - Numerological value
   * @param {string} context - Context (e.g., 'tool', 'page', 'reflection')
   * @returns {Object} { value, symbolicMeaning, reflectivePrompt, disclosure }
   */
  getSymbolicMeaning(value, context = 'general') {
    if (!this.numerologyMap || !this.numerologyMap.meanings[value]) {
      return null;
    }

    const meaning = this.numerologyMap.meanings[value];
    
    // Check meaning through ethics guard if available
    if (this.ethicsGuard) {
      const ethicsCheck = this.ethicsGuard.checkContent(meaning.symbolic || '');
      if (!ethicsCheck.allowed) {
        // If meaning violates ethics, return null (fail closed)
        return null;
      }
    }

    // Build reflective prompt (must be optional and non-prescriptive)
    const reflectivePrompt = this.buildReflectivePrompt(meaning, context);

    return {
      value,
      symbolicMeaning: meaning.symbolic,
      reflectivePrompt,
      disclosure: this.requiredDisclosure,
      // Ensure framing is clearly symbolic
      framing: 'symbolic_reflection_only',
      // Explicitly state what this is NOT
      notIntendedAs: [
        'factual guidance',
        'prediction',
        'decision-making tool',
        'psychological assessment',
        'therapeutic intervention'
      ]
    };
  }

  /**
   * Build reflective prompt (optional, non-prescriptive)
   * @param {Object} meaning - Numerology meaning object
   * @param {string} context - Context for the prompt
   * @returns {string} Reflective prompt
   */
  buildReflectivePrompt(meaning, context) {
    // Prompts must be optional and reflective, not prescriptive
    const prompts = [
      `As a symbolic lens, ${meaning.symbolic} might invite reflection on...`,
      `Some find it interesting to consider ${meaning.symbolic} as a metaphorical frame...`,
      `If you're curious about symbolic meanings, ${meaning.symbolic} could be explored as...`
    ];

    // Select prompt based on context (deterministic, not adaptive)
    const index = context.length % prompts.length;
    return prompts[index];
  }

  /**
   * Get symbolic overlay for a tool or page
   * MUST include disclosure and optional framing
   * @param {string} toolName - Name of tool or page
   * @param {string} context - Context for overlay
   * @returns {Object|null} Symbolic overlay or null if not applicable
   */
  getSymbolicOverlay(toolName, context = 'tool') {
    if (!toolName || !this.numerologyMap) {
      return null;
    }

    const value = this.calculateValue(toolName);
    if (!value) {
      return null;
    }

    const meaning = this.getSymbolicMeaning(value, context);
    if (!meaning) {
      return null;
    }

    // Return overlay with required disclosure
    return {
      toolName,
      numerologicalValue: value,
      symbolicMeaning: meaning.symbolicMeaning,
      reflectivePrompt: meaning.reflectivePrompt,
      disclosure: meaning.disclosure,
      optional: true, // Always optional
      framing: 'symbolic_reflection_only',
      notIntendedAs: meaning.notIntendedAs
    };
  }

  /**
   * Validate numerology output before display
   * Ensures no truth claims, predictions, or guidance language
   * @param {Object} output - Numerology output to validate
   * @returns {Object} { allowed: boolean, violations: Array }
   */
  validateOutput(output) {
    const violations = [];

    // Check for truth claims
    const truthPatterns = [
      /this means/i,
      /this predicts/i,
      /you should/i,
      /you must/i,
      /this will/i,
      /this guarantees/i,
      /this is true/i
    ];

    const textToCheck = JSON.stringify(output).toLowerCase();
    for (const pattern of truthPatterns) {
      if (pattern.test(textToCheck)) {
        violations.push(`TRUTH_CLAIM: Numerology output contains truth claim: "${pattern}"`);
      }
    }

    // Check for missing disclosure
    if (!output.disclosure || !output.disclosure.includes('symbolic reflection only')) {
      violations.push('MISSING_DISCLOSURE: Numerology output must include symbolic reflection disclosure');
    }

    // Check for guidance language
    if (output.guidance || output.advice || output.recommendation) {
      violations.push('GUIDANCE_LANGUAGE: Numerology output must not contain guidance, advice, or recommendations');
    }

    // Check for prediction language
    if (output.prediction || output.forecast || output.outcome) {
      violations.push('PREDICTION_LANGUAGE: Numerology output must not contain predictions or outcomes');
    }

    // Check that it's marked as optional
    if (output.optional !== true) {
      violations.push('NOT_OPTIONAL: Numerology output must be explicitly marked as optional');
    }

    return {
      allowed: violations.length === 0,
      violations
    };
  }
}

// Make available globally
window.NumerologyEngine = NumerologyEngine;

