/**
 * Global Compliance Checker
 * Validates content against legal, religious, cultural, and language requirements
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ComplianceChecker {
  constructor() {
    this.complianceDataPath = path.join(__dirname, '../compliance-data');
    this.loadComplianceData();
  }

  /**
   * Load compliance data from JSON files
   */
  loadComplianceData() {
    try {
      this.legalRules = JSON.parse(
        fs.readFileSync(path.join(this.complianceDataPath, 'legal-rules.json'), 'utf8')
      );
      this.religiousConsiderations = JSON.parse(
        fs.readFileSync(path.join(this.complianceDataPath, 'religious-considerations.json'), 'utf8')
      );
      this.culturalGuidelines = JSON.parse(
        fs.readFileSync(path.join(this.complianceDataPath, 'cultural-guidelines.json'), 'utf8')
      );
      this.languageRequirements = JSON.parse(
        fs.readFileSync(path.join(this.complianceDataPath, 'language-requirements.json'), 'utf8')
      );
      
      logger.info('Compliance data loaded successfully');
    } catch (error) {
      logger.error(`Error loading compliance data: ${error.message}`);
      this.legalRules = {};
      this.religiousConsiderations = {};
      this.culturalGuidelines = {};
      this.languageRequirements = {};
    }
  }

  /**
   * Check if content can be deployed to region
   * @param {Object} content - Content to check
   * @param {string} targetRegion - Country code (e.g., 'US', 'DE', 'JP')
   * @returns {Promise<Object>} Compliance report
   */
  async checkCompliance(content, targetRegion) {
    const report = {
      region: targetRegion,
      timestamp: new Date().toISOString(),
      canDeploy: false,
      blockers: [],
      warnings: [],
      requiredChanges: [],
      approvals: [],
      checks: {
        legal: null,
        religious: null,
        cultural: null,
        language: null
      }
    };

    // 1. Legal compliance check
    report.checks.legal = await this.checkLegalCompliance(content, targetRegion);
    if (!report.checks.legal.compliant) {
      report.blockers.push(...report.checks.legal.blockers);
    }
    report.warnings.push(...report.checks.legal.warnings);
    report.requiredChanges.push(...report.checks.legal.requiredChanges);

    // 2. Religious compliance check
    report.checks.religious = await this.checkReligiousCompliance(content, targetRegion);
    if (!report.checks.religious.compliant) {
      report.blockers.push(...report.checks.religious.blockers);
    }
    report.warnings.push(...report.checks.religious.warnings);
    report.requiredChanges.push(...report.checks.religious.requiredChanges);

    // 3. Cultural compliance check
    report.checks.cultural = await this.checkCulturalCompliance(content, targetRegion);
    report.warnings.push(...report.checks.cultural.warnings);
    report.requiredChanges.push(...report.checks.cultural.requiredChanges);

    // 4. Language compliance check
    report.checks.language = await this.checkLanguageCompliance(content, targetRegion);
    if (!report.checks.language.compliant) {
      report.blockers.push(...(report.checks.language.blockers || []));
    }
    report.warnings.push(...(report.checks.language.warnings || []));
    if (report.checks.language.requiredChanges) {
      report.requiredChanges.push(...report.checks.language.requiredChanges);
    }

    // Determine if can deploy
    report.canDeploy = report.blockers.length === 0;

    return report;
  }

  /**
   * Check legal compliance
   */
  async checkLegalCompliance(content, region) {
    const legalRules = this.legalRules[region];
    if (!legalRules) {
      return {
        compliant: false,
        blockers: [`No legal rules found for region: ${region}`],
        warnings: [],
        requiredChanges: []
      };
    }

    const issues = [];
    const warnings = [];
    const requiredChanges = [];

    // Check required disclaimers
    const requiredDisclaimers = legalRules.requiredDisclaimers || [];
    const contentDisclaimers = content.disclaimers || [];
    
    for (const disclaimer of requiredDisclaimers) {
      if (disclaimer.required) {
        const found = contentDisclaimers.some(d => 
          d.id === disclaimer.id || d.text === disclaimer.text
        );
        
        if (!found) {
          issues.push({
            type: 'blocker',
            issue: `Required disclaimer missing: ${disclaimer.title}`,
            requiredAction: `Add disclaimer: ${disclaimer.text}`,
            disclaimer: disclaimer
          });
        }
      }
    }

    // Check health claims
    if (!legalRules.allowsHealthClaims && this.containsHealthClaims(content)) {
      issues.push({
        type: 'blocker',
        issue: 'Health claims not allowed in this region',
        requiredAction: 'Remove or modify health claims',
        restrictedTerms: legalRules.restrictions?.cannotClaim || []
      });
    }

    // Check GDPR compliance
    if (legalRules.gdprCompliant && !content.gdprCompliant) {
      issues.push({
        type: 'blocker',
        issue: 'GDPR compliance required',
        requiredAction: 'Implement GDPR-compliant data handling'
      });
    }

    // Check restricted terms
    if (legalRules.restrictions?.cannotClaim) {
      const restrictedTerms = legalRules.restrictions.cannotClaim;
      const contentText = this.extractText(content);
      
      for (const term of restrictedTerms) {
        if (contentText.toLowerCase().includes(term.toLowerCase())) {
          warnings.push({
            type: 'warning',
            issue: `Potentially problematic term found: "${term}"`,
            suggestion: `Review context and consider replacing with acceptable alternative`
          });
        }
      }
    }

    return {
      compliant: issues.filter(i => i.type === 'blocker').length === 0,
      blockers: issues.filter(i => i.type === 'blocker'),
      warnings: warnings,
      requiredChanges: requiredChanges
    };
  }

  /**
   * Check religious compliance
   */
  async checkReligiousCompliance(content, region) {
    // Get dominant religions for region (simplified - would need region-to-religion mapping)
    const religiousRules = this.religiousConsiderations; // Would filter by region
    const issues = [];
    const warnings = [];

    // For now, return basic check
    // TODO: Implement region-to-religion mapping and specific checks
    
    return {
      compliant: true,
      blockers: [],
      warnings: [],
      requiredChanges: []
    };
  }

  /**
   * Check cultural compliance
   */
  async checkCulturalCompliance(content, region) {
    // Find cultural guidelines for region
    const culturalGuidelines = this.findCulturalGuidelines(region);
    if (!culturalGuidelines) {
      return {
        compliant: true,
        warnings: [],
        requiredChanges: []
      };
    }

    const warnings = [];
    const requiredChanges = [];

    // Check communication style
    if (culturalGuidelines.communicationStyle === 'indirect' && content.directCommands) {
      requiredChanges.push({
        type: 'modification',
        issue: 'Content uses direct commands but region prefers indirect communication',
        action: 'Convert direct commands to suggestions',
        example: 'Change "Do this" to "You might consider"'
      });
    }

    // Check formality level
    if (culturalGuidelines.formalityLevel === 'high' && content.informal) {
      warnings.push({
        type: 'suggestion',
        issue: 'Content may be too informal for this region',
        suggestion: 'Increase formality level'
      });
    }

    // Check mental health stigma
    if (culturalGuidelines.mentalHealthStigma === 'high') {
      warnings.push({
        type: 'suggestion',
        issue: 'High mental health stigma in region',
        suggestion: 'Consider using alternative terminology (wellness, emotional wellness)'
      });
    }

    return {
      compliant: true, // Cultural issues are warnings, not blockers
      warnings,
      requiredChanges
    };
  }

  /**
   * Check language compliance
   */
  async checkLanguageCompliance(content, region) {
    const languageRules = this.languageRequirements[region];
    if (!languageRules) {
      return {
        compliant: false,
        blockers: [`No language requirements found for region: ${region}`],
        warnings: []
      };
    }

    const issues = [];
    const warnings = [];

    // Check if content is in correct language
    if (content.language && content.language !== languageRules.primaryLanguage) {
      issues.push({
        type: 'blocker',
        issue: `Content language (${content.language}) does not match required language (${languageRules.primaryLanguage})`,
        requiredAction: `Translate content to ${languageRules.primaryLanguage}`
      });
    }

    // Check if professional translation was used
    if (!content.translationMetadata || !content.translationMetadata.professionalTranslator) {
      issues.push({
        type: 'blocker',
        issue: 'Content must be professionally translated',
        requiredAction: 'Use certified professional translator',
        requirements: languageRules.translationRequirements
      });
    }

    // Check technical considerations
    if (languageRules.technicalConsiderations) {
      if (languageRules.technicalConsiderations.includes('RTL') && !content.rtlSupported) {
        warnings.push({
          type: 'warning',
          issue: 'Region requires right-to-left (RTL) text support',
          suggestion: 'Implement RTL text direction support'
        });
      }
    }

    return {
      compliant: issues.length === 0,
      blockers: issues,
      warnings: warnings,
      requiredChanges: [] // Language compliance doesn't have required changes, just blockers/warnings
    };
  }

  /**
   * Find cultural guidelines for region
   */
  findCulturalGuidelines(region) {
    for (const [key, guidelines] of Object.entries(this.culturalGuidelines)) {
      if (guidelines.regions && guidelines.regions.includes(region)) {
        return guidelines;
      }
    }
    return null;
  }

  /**
   * Check if content contains health claims
   */
  containsHealthClaims(content) {
    const healthClaimKeywords = [
      'treat', 'cure', 'diagnose', 'heal', 'fix',
      'medical treatment', 'therapy', 'prescription'
    ];
    
    const text = this.extractText(content);
    const lowerText = text.toLowerCase();
    
    return healthClaimKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Extract text from content object
   */
  extractText(content) {
    if (typeof content === 'string') return content;
    if (content.text) return content.text;
    if (content.body) return content.body;
    if (content.content) return content.content;
    
    // Try to extract from common fields
    return JSON.stringify(content);
  }

  /**
   * Generate compliance report summary
   */
  generateReportSummary(report) {
    return {
      canDeploy: report.canDeploy,
      region: report.region,
      blockerCount: report.blockers.length,
      warningCount: report.warnings.length,
      requiredChangeCount: report.requiredChanges.length,
      status: report.canDeploy ? 'APPROVED' : 'BLOCKED',
      summary: report.canDeploy 
        ? `Content approved for deployment to ${report.region}`
        : `Content blocked: ${report.blockers.length} blocker(s) must be resolved`
    };
  }
}

export default new ComplianceChecker();


