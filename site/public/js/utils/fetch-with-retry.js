/**
 * Fetch Utility with Retry Logic and Error Handling
 * Handles network failures, timeouts, and invalid responses
 */

(function() {
  'use strict';

  const DEFAULT_OPTIONS = {
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 10000,
    retryOn: [408, 429, 500, 502, 503, 504],
    validateResponse: null
  };

  /**
   * Sleep utility for retry delays
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get API base URL with fallback
   */
  function getApiBaseUrl() {
    // Check NEXT_PUBLIC_API_URL first (Next.js convention)
    if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    // Check environment variable (Node.js)
    if (typeof process !== 'undefined' && process.env && process.env.API_BASE_URL) {
      return process.env.API_BASE_URL;
    }
    // Check window config (browser)
    if (typeof window !== 'undefined' && window.RYD_CONFIG && window.RYD_CONFIG.API_BASE_URL) {
      return window.RYD_CONFIG.API_BASE_URL;
    }
    // Local fallback - use '#' to prevent ENOTFOUND
    return '#';
  }

  /**
   * Normalize URL - replace hardcoded API URLs with environment variable
   */
  function normalizeUrl(url) {
    if (!url || typeof url !== 'string') return url;
    
    // Replace any hardcoded api2.cursor.sh with environment variable
    const apiBase = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) || '#';
    if (url.includes('api2.cursor.sh')) {
      const path = url.split('api2.cursor.sh')[1] || '';
      return apiBase && apiBase !== '#' ? `${apiBase}${path}` : '#';
    }
    
    return url;
  }

  /**
   * Fetch with retry logic and silent failure handling
   */
  async function fetchWithRetry(url, options = {}) {
    const config = { ...DEFAULT_OPTIONS, ...options };
    const normalizedUrl = normalizeUrl(url);
    let lastError = null;
    
    // Add 404 to non-retryable but handle silently
    const silentFailStatuses = [404];
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
        
        try {
          const response = await fetch(normalizedUrl, {
            ...config.fetchOptions,
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          // Handle 404 silently - return empty data instead of error
          if (response.status === 404) {
            console.warn(`[fetchWithRetry] 404 for ${normalizedUrl} - returning empty data`);
            return {
              ok: false,
              status: 404,
              statusText: 'Not Found',
              headers: response.headers,
              data: null,
              response,
              silent: true
            };
          }
          
          // Check if status code indicates retry
          if (!response.ok && config.retryOn.includes(response.status) && attempt < config.maxRetries) {
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
            await sleep(config.retryDelay * (attempt + 1)); // Exponential backoff
            continue;
          }
          
          // Validate response if validator provided
          if (config.validateResponse) {
            const isValid = await config.validateResponse(response);
            if (!isValid && attempt < config.maxRetries) {
              lastError = new Error('Response validation failed');
              await sleep(config.retryDelay * (attempt + 1));
              continue;
            }
          }
          
          return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: await response.json().catch(() => null),
            response
          };
        } catch (fetchError) {
          clearTimeout(timeoutId);
          
          // Handle ENOTFOUND and network errors silently
          if (fetchError.message && (
            fetchError.message.includes('ENOTFOUND') ||
            fetchError.message.includes('getaddrinfo') ||
            fetchError.message.includes('NetworkError') ||
            fetchError.name === 'TypeError'
          )) {
            console.warn(`[fetchWithRetry] Network error for ${normalizedUrl}:`, fetchError.message);
            // Return silent failure instead of throwing
            return {
              ok: false,
              status: 0,
              statusText: 'Network Error',
              headers: new Headers(),
              data: null,
              response: null,
              silent: true,
              error: fetchError.message
            };
          }
          
          if (fetchError.name === 'AbortError') {
            lastError = new Error(`Request timeout after ${config.timeout}ms`);
          } else {
            lastError = fetchError;
          }
          
          if (attempt < config.maxRetries) {
            await sleep(config.retryDelay * (attempt + 1));
            continue;
          }
          
          // On final attempt, return silent failure instead of throwing
          console.warn(`[fetchWithRetry] Final attempt failed for ${normalizedUrl}:`, lastError.message || lastError);
          return {
            ok: false,
            status: 0,
            statusText: 'Failed',
            headers: new Headers(),
            data: null,
            response: null,
            silent: true,
            error: lastError.message || String(lastError)
          };
        }
      } catch (error) {
        lastError = error;
        if (attempt < config.maxRetries) {
          await sleep(config.retryDelay * (attempt + 1));
          continue;
        }
      }
    }
    
    // Final fallback - return silent failure
    console.warn(`[fetchWithRetry] All retries exhausted for ${normalizedUrl}`);
    return {
      ok: false,
      status: 0,
      statusText: 'Failed',
      headers: new Headers(),
      data: null,
      response: null,
      silent: true,
      error: lastError?.message || 'Fetch failed after all retries'
    };
  }

  /**
   * Safe JSON parse with fallback
   */
  function safeJsonParse(data, fallback = null) {
    if (data === null || data === undefined) {
      return fallback;
    }
    
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.warn('[fetchWithRetry] JSON parse failed:', e);
        return fallback;
      }
    }
    
    return data;
  }

  /**
   * Validate response is valid JSON
   */
  async function validateJsonResponse(response) {
    try {
      const text = await response.clone().text();
      JSON.parse(text);
      return true;
    } catch (e) {
      return false;
    }
  }

  window.RYD_Fetch = {
    where_it_came_from: {
      origin: "internal",
      basis: "built for Ride Your Demons platform",
      source_type: "system-utility",
      verified: true
    },
    fetchWithRetry,
    safeJsonParse,
    validateJsonResponse,
    getApiBaseUrl,
    normalizeUrl
  };
})();
