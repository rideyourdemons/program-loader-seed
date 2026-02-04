/**
 * Analytics Guard - GA4 Governance Rules
 * 
 * PURPOSE: Ensure GA4 is used for aggregate analytics only, not psychological inference or manipulation
 * ENFORCEMENT: Hard rules that prevent misuse of analytics data
 * SCOPE: All GA4 tracking, data collection, and analytics-to-matrix connections
 */

export class AnalyticsGuard {
  constructor() {
    // GA4 events that ARE allowed (aggregate analytics only)
    this.allowedEvents = [
      'page_view',
      'tool_view',
      'tool_start',
      'tool_complete',
      'navigation_click',
      'time_on_page',
      'scroll_depth'
    ];

    // GA4 events that are FORBIDDEN (psychological inference)
    this.forbiddenEvents = [
      'emotional_state',
      'vulnerability_detected',
      'distress_level',
      'mental_health_inference',
      'psychological_profile',
      'user_emotion',
      'user_state_inference'
    ];

    // GA4 parameters that ARE allowed
    this.allowedParameters = [
      'page_path',
      'page_title',
      'tool_id',
      'tool_name',
      'navigation_from',
      'navigation_to',
      'engagement_time',
      'scroll_percentage'
    ];

    // GA4 parameters that are FORBIDDEN
    this.forbiddenParameters = [
      'emotional_state',
      'vulnerability_score',
      'distress_level',
      'mental_health_label',
      'psychological_state',
      'user_emotion',
      'inferred_state'
    ];

    // GA4 features that MUST be disabled
    this.requiredDisabledFeatures = [
      'Google Signals',
      'Ads Personalization',
      'User-level Profiling',
      'Cross-device Tracking',
      'Demographics and Interests',
      'Remarketing'
    ];

    // Required GA4 settings
    this.requiredSettings = {
      ipAnonymization: true,
      cookieExpiration: 'session', // Or respect regional consent
      respectDoNotTrack: true,
      anonymizeIp: true
    };
  }

  /**
   * Validate GA4 event before sending
   * @param {string} eventName - GA4 event name
   * @param {Object} eventParams - GA4 event parameters
   * @returns {Object} { allowed: boolean, violations: Array, reason: string }
   */
  validateEvent(eventName, eventParams = {}) {
    const violations = [];

    // Check if event is forbidden
    if (this.forbiddenEvents.includes(eventName)) {
      violations.push(`FORBIDDEN_EVENT: "${eventName}" - Psychological inference not allowed`);
    }

    // Check if event is in allowed list
    if (!this.allowedEvents.includes(eventName) && !this.forbiddenEvents.includes(eventName)) {
      violations.push(`UNKNOWN_EVENT: "${eventName}" - Must be explicitly allowed`);
    }

    // Check parameters
    for (const [key, value] of Object.entries(eventParams)) {
      if (this.forbiddenParameters.includes(key)) {
        violations.push(`FORBIDDEN_PARAMETER: "${key}" - Psychological inference not allowed`);
      }

      // Check for forbidden values even if parameter name is allowed
      if (typeof value === 'string') {
        const lowerValue = value.toLowerCase();
        if (lowerValue.includes('emotional') || 
            lowerValue.includes('vulnerable') || 
            lowerValue.includes('distress') ||
            lowerValue.includes('mental_health') ||
            lowerValue.includes('psychological')) {
          violations.push(`FORBIDDEN_VALUE: Parameter "${key}" contains psychological inference: "${value}"`);
        }
      }
    }

    const allowed = violations.length === 0;

    return {
      allowed,
      violations,
      reason: allowed 
        ? 'Event passes analytics guard checks' 
        : `Event blocked: ${violations.join('; ')}`
    };
  }

  /**
   * Check if analytics data can be used for matrix adjustments
   * @param {Object} analyticsData - Analytics data to check
   * @param {string} useCase - Intended use (e.g., 'weight_adjustment', 'tool_ordering')
   * @returns {Object} { allowed: boolean, violations: Array }
   */
  validateMatrixUse(analyticsData, useCase) {
    const violations = [];
    const allowedUseCases = [
      'weight_adjustment',
      'tool_ordering',
      'aggregate_usefulness',
      'flag_for_review'
    ];

    const forbiddenUseCases = [
      'merch_trigger',
      'tone_change',
      'emotional_inference',
      'personalization',
      'vulnerability_targeting'
    ];

    // Check use case
    if (forbiddenUseCases.includes(useCase)) {
      violations.push(`FORBIDDEN_USE_CASE: "${useCase}" - Analytics cannot be used for this purpose`);
    }

    if (!allowedUseCases.includes(useCase) && !forbiddenUseCases.includes(useCase)) {
      violations.push(`UNKNOWN_USE_CASE: "${useCase}" - Must be explicitly allowed`);
    }

    // Check if analytics data contains forbidden fields
    if (analyticsData.emotional_state || 
        analyticsData.vulnerability_score || 
        analyticsData.distress_level ||
        analyticsData.psychological_inference) {
      violations.push('FORBIDDEN_DATA: Analytics data contains psychological inference fields');
    }

    return {
      allowed: violations.length === 0,
      violations
    };
  }

  /**
   * Get required GA4 configuration
   * @returns {Object} GA4 configuration object
   */
  getRequiredGA4Config() {
    return {
      config: {
        // Required settings
        anonymize_ip: this.requiredSettings.anonymizeIp,
        cookie_expires: this.requiredSettings.cookieExpiration,
        respect_dnt: this.requiredSettings.respectDoNotTrack,
        
        // Disabled features
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        allow_enhanced_conversions: false,
        
        // Privacy
        cookie_flags: 'SameSite=None;Secure',
        
        // Regional compliance
        consent_mode: 'required', // Respect regional consent (GDPR, etc.)
        
        // Data retention
        data_retention: '14 months', // Minimum required
        reset_on_new_activity: true
      },
      requiredDisabledFeatures: this.requiredDisabledFeatures,
      allowedEvents: this.allowedEvents,
      allowedParameters: this.allowedParameters
    };
  }

  /**
   * Sanitize analytics data for matrix use (remove any forbidden fields)
   * @param {Object} analyticsData - Raw analytics data
   * @returns {Object} Sanitized analytics data
   */
  sanitizeForMatrix(analyticsData) {
    const sanitized = { ...analyticsData };
    
    // Remove forbidden fields
    delete sanitized.emotional_state;
    delete sanitized.vulnerability_score;
    delete sanitized.distress_level;
    delete sanitized.psychological_inference;
    delete sanitized.user_emotion;
    delete sanitized.inferred_state;
    
    // Only keep aggregate metrics
    return {
      page_views: sanitized.page_views || 0,
      tool_views: sanitized.tool_views || 0,
      tool_completions: sanitized.tool_completions || 0,
      average_time_on_page: sanitized.average_time_on_page || 0,
      bounce_rate: sanitized.bounce_rate || 0,
      navigation_paths: sanitized.navigation_paths || []
    };
  }
}

