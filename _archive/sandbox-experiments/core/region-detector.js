/**
 * Region Detector
 * Automatically detects user region for compliance adaptation
 * Uses multiple fallback methods: IP geolocation, browser language, URL params, user preference
 */

import { logger } from './logger.js';

export class RegionDetector {
  constructor() {
    this.defaultRegion = 'US';
    this.userPreference = null; // Can be set via localStorage or cookie
    this.geolocationAPI = null; // Optional: Can be set to use external geolocation service
  }

  /**
   * Detect user region using multiple methods
   * @param {Object} options - Detection options
   * @param {Object} options.request - HTTP request object (for server-side)
   * @param {string} options.userPreference - User's manually selected region
   * @param {string} options.urlRegion - Region from URL parameter
   * @param {string} options.fallbackRegion - Fallback region if detection fails
   * @returns {Promise<string>} Detected region code (e.g., 'US', 'DE', 'JP')
   */
  async detectRegion(options = {}) {
    const { request, userPreference, urlRegion, fallbackRegion } = options;

    // Priority 1: User manually selected region (highest priority)
    if (userPreference) {
      logger.debug(`Region detected from user preference: ${userPreference}`);
      return userPreference;
    }

    // Priority 2: Region from URL parameter (?region=DE)
    if (urlRegion) {
      logger.debug(`Region detected from URL parameter: ${urlRegion}`);
      return this.normalizeRegionCode(urlRegion);
    }

    // Priority 3: Server-side: Detect from request headers (Accept-Language, IP geolocation)
    if (request) {
      const region = await this.detectFromRequest(request);
      if (region) {
        logger.debug(`Region detected from request: ${region}`);
        return region;
      }
    }

    // Priority 4: Browser-side: Detect from browser language
    if (typeof navigator !== 'undefined' && navigator.language) {
      const region = this.detectFromBrowserLanguage(navigator.language);
      if (region) {
        logger.debug(`Region detected from browser language: ${region}`);
        return region;
      }
    }

    // Priority 5: Use fallback or default
    const finalRegion = fallbackRegion || this.defaultRegion;
    logger.debug(`Using fallback/default region: ${finalRegion}`);
    return finalRegion;
  }

  /**
   * Detect region from HTTP request (server-side)
   * @param {Object} request - HTTP request object
   * @returns {Promise<string|null>} Detected region or null
   */
  async detectFromRequest(request) {
    // Method 1: Check Accept-Language header
    const acceptLanguage = request.headers?.['accept-language'] || 
                          request.headers?.['Accept-Language'];
    if (acceptLanguage) {
      const region = this.detectFromBrowserLanguage(acceptLanguage);
      if (region) {
        return region;
      }
    }

    // Method 2: IP geolocation (if enabled)
    if (this.geolocationAPI && request.headers?.['x-forwarded-for'] || request.socket?.remoteAddress) {
      try {
        const ip = request.headers['x-forwarded-for']?.split(',')[0] || 
                   request.socket.remoteAddress;
        const region = await this.detectFromIP(ip);
        if (region) {
          return region;
        }
      } catch (error) {
        logger.warn(`IP geolocation failed: ${error.message}`);
      }
    }

    return null;
  }

  /**
   * Detect region from browser language
   * @param {string} languageTag - Language tag (e.g., 'en-US', 'de-DE', 'fr-FR')
   * @returns {string|null} Region code or null
   */
  detectFromBrowserLanguage(languageTag) {
    if (!languageTag) return null;

    // Extract country code from language tag (e.g., 'en-US' -> 'US')
    const parts = languageTag.split(/[-_]/);
    if (parts.length >= 2) {
      const countryCode = parts[1].toUpperCase();
      // Validate it's a known region
      if (this.isValidRegionCode(countryCode)) {
        return countryCode;
      }
    }

    // Fallback: Map common language codes to regions
    const languageMap = {
      'en': 'US',
      'de': 'DE',
      'fr': 'FR',
      'es': 'ES',
      'it': 'IT',
      'pt': 'PT',
      'ja': 'JP',
      'zh': 'CN',
      'ko': 'KR',
      'ar': 'SA', // Default to Saudi Arabia for Arabic
      'he': 'IL',
      'hi': 'IN',
      'nl': 'NL',
      'sv': 'SE',
      'no': 'NO',
      'da': 'DK',
      'fi': 'FI',
      'pl': 'PL',
      'ru': 'RU',
      'tr': 'TR',
      'th': 'TH',
      'vi': 'VN',
      'id': 'ID',
      'ms': 'MY',
      'uk': 'UA'
    };

    const langCode = parts[0].toLowerCase();
    if (languageMap[langCode]) {
      return languageMap[langCode];
    }

    return null;
  }

  /**
   * Detect region from IP address (requires geolocation service)
   * @param {string} ip - IP address
   * @returns {Promise<string|null>} Region code or null
   */
  async detectFromIP(ip) {
    if (!this.geolocationAPI || !ip) {
      return null;
    }

    try {
      // If geolocationAPI is a function, call it
      if (typeof this.geolocationAPI === 'function') {
        const result = await this.geolocationAPI(ip);
        return result?.countryCode || null;
      }

      // If geolocationAPI is a URL, fetch from it
      if (typeof this.geolocationAPI === 'string') {
        const response = await fetch(`${this.geolocationAPI}?ip=${ip}`);
        const data = await response.json();
        return data?.countryCode || null;
      }
    } catch (error) {
      logger.warn(`IP geolocation error: ${error.message}`);
    }

    return null;
  }

  /**
   * Normalize region code to uppercase
   * @param {string} region - Region code
   * @returns {string} Normalized region code
   */
  normalizeRegionCode(region) {
    if (!region) return this.defaultRegion;
    return region.toUpperCase().trim();
  }

  /**
   * Validate if region code is supported
   * @param {string} regionCode - Region code to validate
   * @returns {boolean} True if valid
   */
  isValidRegionCode(regionCode) {
    if (!regionCode || regionCode.length !== 2) return false;

    // List of supported regions (can be expanded)
    const supportedRegions = [
      'US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'VE',
      'GB', 'IE', 'AU', 'NZ', 'ZA',
      'DE', 'FR', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH',
      'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'HR', 'SI', 'EE', 'LV', 'LT',
      'SE', 'NO', 'DK', 'FI', 'IS',
      'GR', 'CY', 'MT',
      'JP', 'CN', 'KR', 'TW', 'HK', 'SG', 'MY', 'TH', 'ID', 'PH', 'VN', 'IN', 'PK', 'BD', 'LK',
      'SA', 'AE', 'IL', 'TR', 'IQ', 'IR', 'EG', 'JO', 'LB', 'KW', 'QA', 'BH', 'OM', 'YE',
      'RU', 'UA', 'BY', 'KZ', 'UZ',
      'NG', 'KE', 'GH', 'ZA', 'EG', 'MA', 'TN', 'DZ'
    ];

    return supportedRegions.includes(regionCode.toUpperCase());
  }

  /**
   * Set user preference for region (browser-side)
   * @param {string} region - User's preferred region
   */
  setUserPreference(region) {
    this.userPreference = this.normalizeRegionCode(region);
    
    // Store in localStorage if available (browser-side)
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('ryd_preferred_region', this.userPreference);
      } catch (error) {
        logger.warn(`Could not save region preference: ${error.message}`);
      }
    }
    
    logger.info(`User region preference set to: ${this.userPreference}`);
  }

  /**
   * Get user preference from storage (browser-side)
   * @returns {string|null} Saved region preference or null
   */
  getUserPreference() {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('ryd_preferred_region');
        if (saved && this.isValidRegionCode(saved)) {
          return this.normalizeRegionCode(saved);
        }
      } catch (error) {
        logger.warn(`Could not read region preference: ${error.message}`);
      }
    }
    return this.userPreference;
  }

  /**
   * Set geolocation API for IP-based detection
   * @param {string|Function} api - Geolocation API URL or function
   */
  setGeolocationAPI(api) {
    this.geolocationAPI = api;
    logger.info('Geolocation API configured');
  }
}

export default new RegionDetector();
















