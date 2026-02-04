/**
 * Compliance Middleware
 * Intercepts content before display to ensure compliance
 * Non-breaking: Only adds checks, doesn't modify content until approved
 * Automatically detects region for ethics, culture, and legal adaptation
 */

import { ComplianceChecker } from './compliance-checker.js';
import regionDetector from './region-detector.js';
import languageDetector from './language-detector.js';
import { logger } from './logger.js';

// Create compliance checker instance
const complianceChecker = new ComplianceChecker();

export class ComplianceMiddleware {
  constructor() {
    this.enabled = process.env.COMPLIANCE_ENABLED !== 'false'; // Default enabled
    this.autoFixEnabled = process.env.AUTO_FIX_ENABLED === 'true'; // Default disabled
    this.strictMode = process.env.COMPLIANCE_STRICT_MODE === 'true'; // Default lenient
    this.autoDetectRegion = process.env.AUTO_DETECT_REGION !== 'false'; // Default enabled
  }

  /**
   * Process content through compliance middleware
   * Automatically detects region and language if not provided
   * Primary focus: Translate to their language with cultural respect
   * @param {Object} content - Content to check
   * @param {string|Object} regionOrOptions - Target region (optional) OR options object (for backward compatibility)
   * @param {string|Object} languageOrOptions - Target language (optional) OR options object (for backward compatibility)
   * @param {Object} options - Processing options (if region and language are strings)
   * @param {Object} options.request - HTTP request (for server-side detection)
   * @param {string} options.userPreference - User's manually selected region/language
   * @param {string} options.urlRegion - Region from URL parameter
   * @param {string} options.urlLanguage - Language from URL parameter
   * @returns {Promise<Object>} Processed content with compliance status, language, and cultural adaptations
   */
  async processContent(content, regionOrOptions = null, languageOrOptions = null, options = {}) {
    // Handle backward compatibility: processContent(content, region, options)
    let region = null;
    let language = null;
    let finalOptions = options;

    if (typeof regionOrOptions === 'object' && regionOrOptions !== null && !Array.isArray(regionOrOptions)) {
      // Old signature: processContent(content, options)
      finalOptions = regionOrOptions;
      region = null;
      language = null;
    } else {
      // New signature: processContent(content, region, language, options)
      region = regionOrOptions;
      if (typeof languageOrOptions === 'object' && languageOrOptions !== null && !Array.isArray(languageOrOptions)) {
        // processContent(content, region, options)
        finalOptions = languageOrOptions;
        language = null;
      } else {
        // processContent(content, region, language, options)
        language = languageOrOptions;
        finalOptions = options;
      }
    }
    if (!this.enabled) {
      logger.debug('Compliance middleware disabled, returning content as-is');
      return {
        content,
        compliant: true,
        checks: null,
        warnings: []
      };
    }

    try {
      // Auto-detect region and language if not provided and auto-detection is enabled
      let detectedRegion = region;
      let detectedLanguage = language;
      let culturalAdaptations = null;

      if (this.autoDetectRegion) {
        // Detect region and language together for better accuracy
        if (!detectedRegion || !detectedLanguage) {
          const detection = await languageDetector.detectRegionAndLanguage({
            request: finalOptions.request,
            userPreference: finalOptions.userPreference,
            urlRegion: finalOptions.urlRegion || detectedRegion,
            urlLanguage: finalOptions.urlLanguage || detectedLanguage,
            fallbackRegion: detectedRegion || 'US',
            fallbackLanguage: detectedLanguage || 'en'
          });

          if (!detectedRegion) {
            detectedRegion = detection.region;
            logger.info(`Auto-detected region: ${detectedRegion}`);
          }
          
          if (!detectedLanguage) {
            detectedLanguage = detection.language;
            culturalAdaptations = detection.culturalAdaptations;
            logger.info(`Auto-detected language: ${detectedLanguage} (cultural: ${culturalAdaptations.communicationStyle})`);
          } else {
            culturalAdaptations = languageDetector.getCulturalAdaptations(detectedLanguage);
          }
        } else {
          // Both provided, but still get cultural adaptations
          culturalAdaptations = languageDetector.getCulturalAdaptations(detectedLanguage);
        }

        // Legacy: If only region was auto-detected (backward compatibility)
        if (!detectedRegion && this.autoDetectRegion) {
          detectedRegion = await regionDetector.detectRegion({
            request: finalOptions.request,
            userPreference: finalOptions.userPreference,
            urlRegion: finalOptions.urlRegion,
            fallbackRegion: 'US'
          });
          logger.info(`Auto-detected region: ${detectedRegion}`);
        }
      }
      
      // Fallback to US/en if still no region/language
      if (!detectedRegion) {
        detectedRegion = 'US';
      }
      if (!detectedLanguage) {
        detectedLanguage = languageDetector.getLanguageFromRegion(detectedRegion) || 'en';
        culturalAdaptations = languageDetector.getCulturalAdaptations(detectedLanguage);
      }

      // Run compliance check with detected region
      const complianceReport = await complianceChecker.checkCompliance(content, detectedRegion);

      // If compliant, return as-is
      if (complianceReport.canDeploy) {
        logger.debug(`Content compliant for region: ${detectedRegion}`);
        return {
          content,
          compliant: true,
          checks: complianceReport.checks,
          warnings: complianceReport.warnings,
          region: detectedRegion,
          language: detectedLanguage,
          culturalAdaptations: culturalAdaptations
        };
      }

      // If not compliant, handle based on mode
      if (this.strictMode) {
        // Strict mode: Block non-compliant content
        logger.warn(`Content blocked for region ${detectedRegion}: ${complianceReport.blockers.length} blocker(s)`);
        return {
          content: null,
          compliant: false,
          blocked: true,
          blockers: complianceReport.blockers,
          checks: complianceReport.checks,
          region: detectedRegion,
          language: detectedLanguage,
          culturalAdaptations: culturalAdaptations
        };
      } else {
        // Lenient mode: Return with warnings, allow through
        logger.warn(`Content has compliance issues for region ${detectedRegion}, but allowing through (lenient mode)`);
        return {
          content,
          compliant: false,
          blocked: false,
          blockers: complianceReport.blockers,
          warnings: complianceReport.warnings,
          requiredChanges: complianceReport.requiredChanges,
          checks: complianceReport.checks,
          region: detectedRegion,
          language: detectedLanguage,
          culturalAdaptations: culturalAdaptations
        };
      }
    } catch (error) {
      logger.error(`Compliance middleware error: ${error.message}`);
      
      // On error, allow content through (fail open)
      // But log the error for investigation
      // Fallback values if detection failed
      const fallbackRegion = detectedRegion || region || 'US';
      const fallbackLanguage = detectedLanguage || language || 'en';
      const fallbackCultural = culturalAdaptations || languageDetector.getCulturalAdaptations(fallbackLanguage);
      
      return {
        content,
        compliant: null, // Unknown
        error: error.message,
        checks: null,
        region: fallbackRegion,
        language: fallbackLanguage,
        culturalAdaptations: fallbackCultural
      };
    }
  }

  /**
   * Check if content is compliant (read-only check)
   * Automatically detects region if not provided
   * @param {Object} content - Content to check
   * @param {string} region - Target region (optional, will auto-detect if not provided)
   * @param {Object} options - Detection options
   * @returns {Promise<Object>} Compliance report
   */
  async checkCompliance(content, region = null, options = {}) {
    // Auto-detect region if not provided
    let detectedRegion = region;
    if (!detectedRegion && this.autoDetectRegion) {
      detectedRegion = await regionDetector.detectRegion({
        request: options.request,
        userPreference: options.userPreference,
        urlRegion: options.urlRegion,
        fallbackRegion: 'US'
      });
    }
    
    return await complianceChecker.checkCompliance(content, detectedRegion || 'US');
  }

  /**
   * Enable/disable compliance middleware
   * @param {boolean} enabled - Whether to enable
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    logger.info(`Compliance middleware ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Enable/disable auto-fix
   * @param {boolean} enabled - Whether to enable auto-fix
   */
  setAutoFixEnabled(enabled) {
    this.autoFixEnabled = enabled;
    logger.info(`Compliance auto-fix ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set strict mode
   * @param {boolean} strict - Whether to use strict mode
   */
  setStrictMode(strict) {
    this.strictMode = strict;
    logger.info(`Compliance strict mode ${strict ? 'enabled' : 'disabled'}`);
  }

  /**
   * Enable/disable auto region detection
   * @param {boolean} enabled - Whether to auto-detect region
   */
  setAutoDetectRegion(enabled) {
    this.autoDetectRegion = enabled;
    logger.info(`Auto region detection ${enabled ? 'enabled' : 'disabled'}`);
  }
}

export default new ComplianceMiddleware();


