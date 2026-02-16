/**
 * Resilient Fetch Wrapper
 * Production-grade fetching with retry, timeout, and safe error handling
 */

(function() {
  'use strict';

  // Load API config if available
  const API_CONFIG = (typeof window !== 'undefined' && window.RYD_API_CONFIG) || {
    DEFAULT_TIMEOUT: 10000,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    RETRY_STATUS_CODES: [408, 429, 500, 502, 503, 504],
    SILENT_FAIL_STATUSES: [404]
  };

  /**
   * Sleep utility for retry delays
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Safe JSON parse with fallback
   */
  function safeJsonParse(data, fallback = {}) {
    if (data === null || data === undefined) {
      return fallback;
    }
    
    if (typeof data === 'object' && !Array.isArray(data)) {
      return data;
    }
    
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.warn('[ResilientFetch] JSON parse failed:', e.message);
        return fallback;
      }
    }
    
    return fallback;
  }

  /**
   * Resilient fetch with retry, timeout, and safe error handling
   */
  async function resilientFetch(url, options = {}) {
    const config = {
      timeout: options.timeout || API_CONFIG.DEFAULT_TIMEOUT,
      maxRetries: options.maxRetries || API_CONFIG.MAX_RETRIES,
      retryDelay: options.retryDelay || API_CONFIG.RETRY_DELAY,
      retryOn: options.retryOn || API_CONFIG.RETRY_STATUS_CODES,
      silentFailOn: options.silentFailOn || API_CONFIG.SILENT_FAIL_STATUSES,
      fallback: options.fallback || {},
      ...options
    };

    let lastError = null;
    const urlStr = String(url || '');

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, config.timeout);

        try {
          const response = await fetch(urlStr, {
            ...config.fetchOptions,
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          // Handle silent fail statuses (404, etc.)
          if (config.silentFailOn.includes(response.status)) {
            console.warn(`[ResilientFetch] Silent failure (${response.status}) for ${urlStr}`);
            return {
              ok: false,
              status: response.status,
              statusText: response.statusText,
              data: config.fallback,
              silent: true,
              error: null
            };
          }

          // Check if we should retry
          if (!response.ok && config.retryOn.includes(response.status) && attempt < config.maxRetries) {
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
            const delay = config.retryDelay * Math.pow(2, attempt); // Exponential backoff
            console.warn(`[ResilientFetch] Retry ${attempt + 1}/${config.maxRetries} for ${urlStr} after ${delay}ms`);
            await sleep(delay);
            continue;
          }

          // Parse response
          let data = config.fallback;
          try {
            const text = await response.text();
            data = safeJsonParse(text, config.fallback);
          } catch (parseError) {
            console.warn(`[ResilientFetch] Parse error for ${urlStr}:`, parseError.message);
            data = config.fallback;
          }

          return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: data,
            response: response,
            silent: false,
            error: null
          };

        } catch (fetchError) {
          clearTimeout(timeoutId);

          // Handle network errors (ENOTFOUND, etc.)
          if (fetchError.name === 'AbortError') {
            lastError = new Error(`Request timeout after ${config.timeout}ms`);
          } else if (
            fetchError.message && (
              fetchError.message.includes('ENOTFOUND') ||
              fetchError.message.includes('getaddrinfo') ||
              fetchError.message.includes('NetworkError') ||
              fetchError.name === 'TypeError'
            )
          ) {
            console.warn(`[ResilientFetch] Network error for ${urlStr}:`, fetchError.message);
            // Return silent failure instead of throwing
            return {
              ok: false,
              status: 0,
              statusText: 'Network Error',
              headers: new Headers(),
              data: config.fallback,
              response: null,
              silent: true,
              error: fetchError.message
            };
          } else {
            lastError = fetchError;
          }

          // Retry if we have attempts left
          if (attempt < config.maxRetries) {
            const delay = config.retryDelay * Math.pow(2, attempt);
            console.warn(`[ResilientFetch] Retry ${attempt + 1}/${config.maxRetries} for ${urlStr} after ${delay}ms`);
            await sleep(delay);
            continue;
          }
        }
      } catch (error) {
        lastError = error;
        if (attempt < config.maxRetries) {
          const delay = config.retryDelay * Math.pow(2, attempt);
          await sleep(delay);
          continue;
        }
      }
    }

    // Final fallback - return safe empty object instead of throwing
    console.warn(`[ResilientFetch] All retries exhausted for ${urlStr}, returning fallback`);
    return {
      ok: false,
      status: 0,
      statusText: 'Failed',
      headers: new Headers(),
      data: config.fallback,
      response: null,
      silent: true,
      error: lastError?.message || 'Fetch failed after all retries'
    };
  }

  // Export
  if (typeof window !== 'undefined') {
    window.RYD_ResilientFetch = {
      where_it_came_from: {
        origin: "internal",
        basis: "built for Ride Your Demons platform",
        source_type: "system-utility",
        verified: true
      },
      resilientFetch,
      safeJsonParse
    };
  }
})();
