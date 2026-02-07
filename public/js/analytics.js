/**
 * RYD Analytics Manager
 * 
 * Centralized analytics wrapper for Google Tag Manager
 * - Environment detection (local vs production)
 * - Debug mode for local development
 * - Prevents duplicate firing
 */

(function() {
  'use strict';

  // Configuration
  const GTM_CONTAINER_ID = 'GTM-M8KF4XF';
  const GTM_TEST_ID = 'GTM-TEST'; // Test container for local dev (optional)
  
  // Environment detection
  const isLocal = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' ||
                  window.location.hostname === '0.0.0.0' ||
                  window.location.hostname.includes('.local');
  
  const isProduction = window.location.hostname === 'rideyourdemons.com' ||
                       window.location.hostname === 'www.rideyourdemons.com';
  
  // Debug mode (can be enabled via localStorage or URL param)
  const DEBUG_PARAM = new URLSearchParams(window.location.search).get('analytics_debug');
  const DEBUG_STORAGE = localStorage.getItem('ryd_analytics_debug') === 'true';
  const DEBUG_ENABLED = DEBUG_PARAM === 'true' || DEBUG_STORAGE || (isLocal && window.DEBUG_RYD);
  
  // Prevent duplicate initialization
  if (window.RYD_ANALYTICS_INITIALIZED) {
    if (DEBUG_ENABLED) {
      console.warn('[RYD Analytics] Already initialized, skipping duplicate load');
    }
    return;
  }
  
  window.RYD_ANALYTICS_INITIALIZED = true;
  
  // Analytics state
  const analytics = {
    initialized: false,
    environment: isProduction ? 'production' : (isLocal ? 'local' : 'unknown'),
    debug: DEBUG_ENABLED,
    containerId: null
  };
  
  // Debug logging
  function debugLog(...args) {
    if (analytics.debug) {
      console.log('[RYD Analytics]', ...args);
    }
  }
  
  function debugWarn(...args) {
    if (analytics.debug) {
      console.warn('[RYD Analytics]', ...args);
    }
  }
  
  function debugError(...args) {
    if (analytics.debug) {
      console.error('[RYD Analytics]', ...args);
    }
  }
  
  // Initialize GTM
  function initGTM() {
    // Skip in local dev unless explicitly enabled
    if (isLocal && !DEBUG_ENABLED && !window.ENABLE_ANALYTICS_LOCAL) {
      debugLog('Skipping GTM initialization in local environment');
      analytics.containerId = null;
      return;
    }
    
    // Use test container in local dev if available, otherwise skip
    const containerId = isLocal ? (GTM_TEST_ID || null) : GTM_CONTAINER_ID;
    
    if (!containerId) {
      debugLog('No GTM container ID configured for this environment');
      return;
    }
    
    analytics.containerId = containerId;
    
    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    
    // GTM script injection
    (function(w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
      });
      var f = d.getElementsByTagName(s)[0],
          j = d.createElement(s),
          dl = l != 'dataLayer' ? '&l=' + l : '';
      j.async = true;
      j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', containerId);
    
    analytics.initialized = true;
    debugLog('GTM initialized:', containerId, 'Environment:', analytics.environment);
  }
  
  // Push event to dataLayer
  function pushEvent(eventName, eventData) {
    if (!analytics.initialized && !analytics.debug) {
      debugWarn('Analytics not initialized, event not sent:', eventName);
      return;
    }
    
    const event = {
      event: eventName,
      ...eventData
    };
    
    if (analytics.debug) {
      debugLog('Event:', eventName, eventData);
    }
    
    if (window.dataLayer) {
      window.dataLayer.push(event);
    } else {
      debugWarn('dataLayer not available');
    }
  }
  
  // Track page view
  function trackPageView(path, title) {
    pushEvent('page_view', {
      page_path: path || window.location.pathname,
      page_title: title || document.title,
      page_location: window.location.href
    });
  }
  
  // Track custom events
  function trackEvent(category, action, label, value) {
    pushEvent('custom_event', {
      event_category: category,
      event_action: action,
      event_label: label,
      value: value
    });
  }
  
  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initGTM();
      // Track initial page view after a short delay to ensure GTM is loaded
      setTimeout(() => {
        trackPageView();
      }, 500);
    });
  } else {
    initGTM();
    setTimeout(() => {
      trackPageView();
    }, 500);
  }
  
  // Add noscript iframe for GTM (if not already present)
  function addNoscriptIframe() {
    if (document.querySelector('noscript iframe[src*="googletagmanager.com"]')) {
      return; // Already exists
    }
    
    if (!analytics.containerId) {
      return; // No container ID
    }
    
    const noscript = document.createElement('noscript');
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${analytics.containerId}`;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';
    noscript.appendChild(iframe);
    
    // Insert after body opening tag
    if (document.body) {
      document.body.insertBefore(noscript, document.body.firstChild);
    }
  }
  
  // Add noscript iframe when body is available
  if (document.body) {
    addNoscriptIframe();
  } else {
    document.addEventListener('DOMContentLoaded', addNoscriptIframe);
  }
  
  // Export API
  window.RYD_ANALYTICS = {
    where_it_came_from: {
      origin: "internal",
      basis: "built for Ride Your Demons platform",
      source_type: "system-utility",
      verified: true
    },
    initialized: () => analytics.initialized,
    environment: () => analytics.environment,
    debug: () => analytics.debug,
    containerId: () => analytics.containerId,
    trackPageView,
    trackEvent,
    pushEvent,
    enableDebug: () => {
      analytics.debug = true;
      localStorage.setItem('ryd_analytics_debug', 'true');
      debugLog('Debug mode enabled');
    },
    disableDebug: () => {
      analytics.debug = false;
      localStorage.removeItem('ryd_analytics_debug');
      debugLog('Debug mode disabled');
    }
  };
  
  // Log initialization status
  debugLog('Analytics manager loaded', {
    environment: analytics.environment,
    debug: analytics.debug,
    containerId: analytics.containerId || 'none'
  });
})();

