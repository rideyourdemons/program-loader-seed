/**
 * Language Detector
 * Automatically detects user language and provides translation/adaptation
 * Primary focus: Translate to their language with cultural respect
 */

import regionDetector from './region-detector.js';
import { logger } from './logger.js';

export class LanguageDetector {
  constructor() {
    this.defaultLanguage = 'en';
    this.userPreference = null; // Can be set via localStorage or cookie
    this.languageMap = this.buildLanguageMap();
  }

  /**
   * Build language mapping from region codes to languages
   * @returns {Object} Map of region codes to primary languages
   */
  buildLanguageMap() {
    return {
      // Americas
      'US': 'en', 'CA': 'en', 'GB': 'en', 'IE': 'en', 'AU': 'en', 'NZ': 'en', 'ZA': 'en',
      'MX': 'es', 'ES': 'es', 'AR': 'es', 'CL': 'es', 'CO': 'es', 'PE': 'es', 'VE': 'es', 'EC': 'es', 'BO': 'es', 'PY': 'es', 'UY': 'es', 'CR': 'es', 'PA': 'es', 'GT': 'es', 'HN': 'es', 'SV': 'es', 'NI': 'es', 'DO': 'es', 'CU': 'es',
      'BR': 'pt', 'PT': 'pt',
      
      // Europe
      'DE': 'de', 'AT': 'de', 'CH': 'de',
      'FR': 'fr', 'BE': 'fr', 'LU': 'fr',
      'IT': 'it',
      'NL': 'nl',
      'PL': 'pl',
      'CZ': 'cs',
      'SK': 'sk',
      'HU': 'hu',
      'RO': 'ro',
      'BG': 'bg',
      'HR': 'hr',
      'SI': 'sl',
      'EE': 'et',
      'LV': 'lv',
      'LT': 'lt',
      'GR': 'el',
      'CY': 'el',
      'SE': 'sv',
      'NO': 'no',
      'DK': 'da',
      'FI': 'fi',
      'IS': 'is',
      'RU': 'ru',
      'UA': 'uk',
      'BY': 'be',
      'KZ': 'kk',
      'UZ': 'uz',
      
      // Asia-Pacific
      'JP': 'ja',
      'CN': 'zh',
      'TW': 'zh-TW',
      'HK': 'zh-HK',
      'KR': 'ko',
      'SG': 'en', // Primary English, but multilingual
      'MY': 'ms',
      'TH': 'th',
      'ID': 'id',
      'PH': 'en', // Primary English, but Filipino/Tagalog also common
      'VN': 'vi',
      'IN': 'hi', // Hindi primary, but many languages
      'PK': 'ur',
      'BD': 'bn',
      'LK': 'si',
      
      // Middle East
      'SA': 'ar', 'AE': 'ar', 'KW': 'ar', 'QA': 'ar', 'BH': 'ar', 'OM': 'ar', 'YE': 'ar',
      'IQ': 'ar', 'JO': 'ar', 'LB': 'ar', 'SY': 'ar',
      'IL': 'he',
      'IR': 'fa',
      'TR': 'tr',
      'EG': 'ar',
      
      // Africa
      'NG': 'en',
      'KE': 'en',
      'GH': 'en',
      'EG': 'ar',
      'MA': 'ar',
      'TN': 'ar',
      'DZ': 'ar',
      'ZA': 'en'
    };
  }

  /**
   * Detect user language using multiple methods
   * @param {Object} options - Detection options
   * @param {Object} options.request - HTTP request object (for server-side)
   * @param {string} options.userPreference - User's manually selected language
   * @param {string} options.urlLanguage - Language from URL parameter
   * @param {string} options.region - Region code (to map to language)
   * @param {string} options.fallbackLanguage - Fallback language if detection fails
   * @returns {Promise<string>} Detected language code (e.g., 'en', 'es', 'de', 'ja')
   */
  async detectLanguage(options = {}) {
    const { request, userPreference, urlLanguage, region, fallbackLanguage } = options;

    // Priority 1: User manually selected language (highest priority)
    if (userPreference) {
      logger.debug(`Language detected from user preference: ${userPreference}`);
      return this.normalizeLanguageCode(userPreference);
    }

    // Priority 2: Language from URL parameter (?lang=es)
    if (urlLanguage) {
      logger.debug(`Language detected from URL parameter: ${urlLanguage}`);
      return this.normalizeLanguageCode(urlLanguage);
    }

    // Priority 3: Get user preference from storage (browser-side)
    const savedPreference = this.getUserPreference();
    if (savedPreference) {
      logger.debug(`Language detected from saved preference: ${savedPreference}`);
      return savedPreference;
    }

    // Priority 4: Detect from region (if region is known)
    if (region) {
      const regionLanguage = this.getLanguageFromRegion(region);
      if (regionLanguage) {
        logger.debug(`Language detected from region ${region}: ${regionLanguage}`);
        return regionLanguage;
      }
    }

    // Priority 5: Server-side: Detect from request headers (Accept-Language)
    if (request) {
      const language = await this.detectFromRequest(request);
      if (language) {
        logger.debug(`Language detected from request: ${language}`);
        return language;
      }
    }

    // Priority 6: Browser-side: Detect from browser language
    if (typeof navigator !== 'undefined' && navigator.language) {
      const language = this.normalizeLanguageCode(navigator.language);
      if (language) {
        logger.debug(`Language detected from browser language: ${language}`);
        return language;
      }
    }

    // Priority 7: Use fallback or default
    const finalLanguage = fallbackLanguage || this.defaultLanguage;
    logger.debug(`Using fallback/default language: ${finalLanguage}`);
    return finalLanguage;
  }

  /**
   * Detect language from HTTP request (server-side)
   * @param {Object} request - HTTP request object
   * @returns {Promise<string|null>} Detected language or null
   */
  async detectFromRequest(request) {
    const acceptLanguage = request.headers?.['accept-language'] || 
                          request.headers?.['Accept-Language'];
    if (acceptLanguage) {
      // Parse Accept-Language header (e.g., "en-US,en;q=0.9,es;q=0.8")
      const languages = this.parseAcceptLanguage(acceptLanguage);
      if (languages.length > 0) {
        return this.normalizeLanguageCode(languages[0]);
      }
    }
    return null;
  }

  /**
   * Parse Accept-Language header
   * @param {string} acceptLanguage - Accept-Language header value
   * @returns {Array<string>} Array of language codes in priority order
   */
  parseAcceptLanguage(acceptLanguage) {
    if (!acceptLanguage) return [];
    
    // Split by comma and parse quality values
    const languages = acceptLanguage.split(',').map(lang => {
      const parts = lang.trim().split(';');
      const code = parts[0].trim();
      let quality = 1.0;
      
      if (parts[1]) {
        const qMatch = parts[1].match(/q=([\d.]+)/);
        if (qMatch) {
          quality = parseFloat(qMatch[1]);
        }
      }
      
      return { code, quality };
    });
    
    // Sort by quality (descending)
    languages.sort((a, b) => b.quality - a.quality);
    
    // Extract just the language codes
    return languages.map(l => l.code);
  }

  /**
   * Get language code from region code
   * @param {string} regionCode - Region code (e.g., 'DE', 'JP', 'MX')
   * @returns {string|null} Language code or null
   */
  getLanguageFromRegion(regionCode) {
    if (!regionCode) return null;
    return this.languageMap[regionCode.toUpperCase()] || null;
  }

  /**
   * Normalize language code (e.g., 'en-US' -> 'en', 'zh-CN' -> 'zh')
   * @param {string} languageCode - Language code to normalize
   * @returns {string} Normalized language code
   */
  normalizeLanguageCode(languageCode) {
    if (!languageCode) return this.defaultLanguage;
    
    // Handle full locale codes (e.g., 'en-US', 'zh-CN', 'es-MX')
    const parts = languageCode.split(/[-_]/);
    const baseLanguage = parts[0].toLowerCase();
    
    // Handle special cases for Chinese (simplified vs traditional)
    if (baseLanguage === 'zh') {
      // Keep full code for Chinese variants
      return languageCode.toLowerCase().replace('_', '-');
    }
    
    // Return base language code
    return baseLanguage;
  }

  /**
   * Validate if language code is supported
   * @param {string} languageCode - Language code to validate
   * @returns {boolean} True if valid
   */
  isValidLanguageCode(languageCode) {
    if (!languageCode) return false;
    
    const normalized = this.normalizeLanguageCode(languageCode);
    const supportedLanguages = [
      'en', 'es', 'pt', 'fr', 'de', 'it', 'nl', 'pl', 'cs', 'sk', 'hu', 'ro', 'bg', 'hr', 'sl',
      'et', 'lv', 'lt', 'el', 'sv', 'no', 'da', 'fi', 'is', 'ru', 'uk', 'be', 'kk', 'uz',
      'ja', 'zh', 'zh-CN', 'zh-TW', 'zh-HK', 'ko', 'ms', 'th', 'id', 'vi', 'hi', 'ur', 'bn', 'si',
      'ar', 'he', 'fa', 'tr'
    ];
    
    return supportedLanguages.includes(normalized) || 
           normalized.startsWith('zh-') || 
           supportedLanguages.some(lang => normalized.startsWith(lang + '-'));
  }

  /**
   * Set user preference for language (browser-side)
   * @param {string} language - User's preferred language
   */
  setUserPreference(language) {
    this.userPreference = this.normalizeLanguageCode(language);
    
    // Store in localStorage if available (browser-side)
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('ryd_preferred_language', this.userPreference);
      } catch (error) {
        logger.warn(`Could not save language preference: ${error.message}`);
      }
    }
    
    logger.info(`User language preference set to: ${this.userPreference}`);
  }

  /**
   * Get user preference from storage (browser-side)
   * @returns {string|null} Saved language preference or null
   */
  getUserPreference() {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('ryd_preferred_language');
        if (saved && this.isValidLanguageCode(saved)) {
          return this.normalizeLanguageCode(saved);
        }
      } catch (error) {
        logger.warn(`Could not read language preference: ${error.message}`);
      }
    }
    return this.userPreference;
  }

  /**
   * Get cultural adaptations for language
   * @param {string} languageCode - Language code
   * @returns {Object} Cultural adaptation guidelines
   */
  getCulturalAdaptations(languageCode) {
    const normalized = this.normalizeLanguageCode(languageCode);
    
    // Cultural respect guidelines by language
    const culturalGuidelines = {
      'ja': {
        communicationStyle: 'indirect',
        formalityLevel: 'high',
        culturalValues: { harmony: 'emphasize', hierarchy: 'respect', faceSaving: 'important' },
        directCommands: 'avoid',
        examples: 'useJapaneseContext'
      },
      'zh': {
        communicationStyle: 'indirect',
        formalityLevel: 'high',
        culturalValues: { family: 'central', harmony: 'emphasize', tradition: 'respect' },
        directCommands: 'avoid',
        examples: 'useChineseContext'
      },
      'ko': {
        communicationStyle: 'indirect',
        formalityLevel: 'high',
        culturalValues: { hierarchy: 'respect', harmony: 'emphasize', community: 'important' },
        directCommands: 'avoid',
        examples: 'useKoreanContext'
      },
      'ar': {
        communicationStyle: 'indirect',
        formalityLevel: 'moderate',
        culturalValues: { family: 'central', hospitality: 'valued', modesty: 'important' },
        directCommands: 'avoid',
        examples: 'useMiddleEasternContext',
        rtl: true
      },
      'hi': {
        communicationStyle: 'indirect',
        formalityLevel: 'moderate',
        culturalValues: { family: 'extended', community: 'central', tradition: 'respect' },
        directCommands: 'avoid',
        examples: 'useIndianContext'
      },
      'es': {
        communicationStyle: 'moderate',
        formalityLevel: 'moderate',
        culturalValues: { family: 'important', warmth: 'accepted', community: 'valued' },
        directCommands: 'acceptable',
        examples: 'useLatinAmericanContext'
      },
      'fr': {
        communicationStyle: 'direct',
        formalityLevel: 'moderate',
        culturalValues: { clarity: 'valued', formality: 'respected', privacy: 'important' },
        directCommands: 'acceptable',
        examples: 'useFrenchContext'
      },
      'de': {
        communicationStyle: 'direct',
        formalityLevel: 'moderate',
        culturalValues: { precision: 'valued', privacy: 'important', efficiency: 'appreciated' },
        directCommands: 'acceptable',
        examples: 'useGermanContext'
      },
      'en': {
        communicationStyle: 'direct',
        formalityLevel: 'moderate',
        culturalValues: { clarity: 'valued', individual: 'respected', efficiency: 'appreciated' },
        directCommands: 'acceptable',
        examples: 'useWesternContext'
      }
    };

    return culturalGuidelines[normalized] || {
      communicationStyle: 'direct',
      formalityLevel: 'moderate',
      culturalValues: { clarity: 'valued' },
      directCommands: 'acceptable',
      examples: 'useUniversalContext'
    };
  }

  /**
   * Detect both region and language together
   * @param {Object} options - Detection options
   * @returns {Promise<Object>} Object with both region and language
   */
  async detectRegionAndLanguage(options = {}) {
    // First detect region
    let region;
    try {
      region = await regionDetector.detectRegion({
        request: options.request,
        userPreference: options.userPreference,
        urlRegion: options.urlRegion,
        fallbackRegion: options.fallbackRegion || 'US'
      });
    } catch (error) {
      logger.warn(`Region detection failed: ${error.message}, using fallback`);
      region = options.fallbackRegion || 'US';
    }

    // Then detect language (may use region as hint)
    const language = await this.detectLanguage({
      request: options.request,
      userPreference: options.userPreference,
      urlLanguage: options.urlLanguage,
      region: region,
      fallbackLanguage: this.getLanguageFromRegion(region) || 'en'
    });

    return {
      region,
      language,
      culturalAdaptations: this.getCulturalAdaptations(language)
    };
  }
}

export default new LanguageDetector();

