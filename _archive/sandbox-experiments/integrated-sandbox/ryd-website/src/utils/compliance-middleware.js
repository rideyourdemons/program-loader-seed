/**
 * Compliance Middleware
 * Intercepts content before display to ensure compliance
 * Non-breaking: Only adds checks, doesn't modify content until approved
 */

import complianceChecker from './compliance-checker.js';
import { logger } from './logger.js';

export class ComplianceMiddleware {
  constructor() {
    this.enabled = process.env.COMPLIANCE_ENABLED !== 'false'; // Default enabled
    this.autoFixEnabled = process.env.AUTO_FIX_ENABLED === 'true'; // Default disabled
    this.strictMode = process.env.COMPLIANCE_STRICT_MODE === 'true'; // Default lenient
  }

  /**
   * Process content through compliance middleware
   * @param {Object} content - Content to check
   * @param {string} region - Target region
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processed content with compliance status
   */
  async processContent(content, region = 'US', options = {}) {
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
      // Run compliance check
      const complianceReport = await complianceChecker.checkCompliance(content, region);

      // If compliant, return as-is
      if (complianceReport.canDeploy) {
        logger.debug(`Content compliant for region: ${region}`);
        return {
          content,
          compliant: true,
          checks: complianceReport.checks,
          warnings: complianceReport.warnings,
          region
        };
      }

      // If not compliant, handle based on mode
      if (this.strictMode) {
        // Strict mode: Block non-compliant content
        logger.warn(`Content blocked for region ${region}: ${complianceReport.blockers.length} blocker(s)`);
        return {
          content: null,
          compliant: false,
          blocked: true,
          blockers: complianceReport.blockers,
          checks: complianceReport.checks,
          region
        };
      } else {
        // Lenient mode: Return with warnings, allow through
        logger.warn(`Content has compliance issues for region ${region}, but allowing through (lenient mode)`);
        return {
          content,
          compliant: false,
          blocked: false,
          blockers: complianceReport.blockers,
          warnings: complianceReport.warnings,
          requiredChanges: complianceReport.requiredChanges,
          checks: complianceReport.checks,
          region
        };
      }
    } catch (error) {
      logger.error(`Compliance middleware error: ${error.message}`);
      
      // On error, allow content through (fail open)
      // But log the error for investigation
      return {
        content,
        compliant: null, // Unknown
        error: error.message,
        checks: null,
        region
      };
    }
  }

  /**
   * Check if content is compliant (read-only check)
   * @param {Object} content - Content to check
   * @param {string} region - Target region
   * @returns {Promise<Object>} Compliance report
   */
  async checkCompliance(content, region = 'US') {
    return await complianceChecker.checkCompliance(content, region);
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
}

export default new ComplianceMiddleware();


