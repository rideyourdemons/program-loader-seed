/**
 * RYD UI Binder Module - HARDENED VERSION
 * Binds Tool of the Day, Search, and Insights to the canonical boot signal
 * 
 * PRODUCTION HARDENING:
 * - Error boundaries
 * - Data validation
 * - Edge case handling
 * - Safe string operations
 */

(function() {
  'use strict';

  // Check utilities
  const { ErrorBoundary, withErrorBoundary } = window.RYD_ErrorBoundary || {
    ErrorBoundary: class { catch() {} },
    withErrorBoundary: (container, fn) => fn
  };
  const { schemas, validateData } = window.RYD_Validation || {
    schemas: {},
    validateData: (data) => ({ success: true, data })
  };
  const { cleanData, ensureWhereItCameFrom } = window.RYD_DataSanitizer || {
    cleanData: (data) => data,
    ensureWhereItCameFrom: (data) => data
  };
  const { logError } = window.RYD_ErrorMonitor || { logError: () => {} };
  const { setMinHeight } = window.RYD_UIStability || { setMinHeight: () => {} };

  console.log('[RYD] bind starting (hardened)');

  /**
   * Safe string truncation
   */
  function truncateString(str, maxLength = 200) {
    if (!str || typeof str !== 'string') return '';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }

  /**
   * Safe array access
   */
  function safeArray(arr, fallback = []) {
    if (!Array.isArray(arr)) return fallback;
    return arr.filter(Boolean);
  }

  function sanitizeDescription(raw, title) {
    if (window.RYD_UI && typeof window.RYD_UI.sanitizeDescription === 'function') {
      return window.RYD_UI.sanitizeDescription(raw, title);
    }
    return truncateString(String(raw || ''), 200);
  }

  /**
   * Render Tool of the Day with error boundary
   */
  const renderToolOfDay = withErrorBoundary(null, function(tool) {
    if (!tool || typeof tool !== 'object') {
      showFallback('No tool available');
      return;
    }

    // Validate and sanitize tool with safe field access
    const validation = validateData(tool, schemas.tool || schemas.object({}), null);
    const rawTool = validation.success ? validation.data : tool;
    
    // Clean data with defaults and ensure where_it_came_from
    const validatedTool = ensureWhereItCameFrom(cleanData(rawTool, 'tool'));
    
    // Force-fix: Safe access to where_it_came_from with fallback
    const source_origin = validatedTool?.where_it_came_from ?? 'hardened_stable_fallback';
    validatedTool.where_it_came_from = source_origin;

    // Find container
    const container = document.getElementById('tool-of-the-day') ||
                     document.querySelector('[data-tool-of-day]') ||
                     document.querySelector('.tool-of-day');

    if (!container) {
      console.log('[RYD] no Tool of the Day container found');
      return;
    }

    // Set min-height to prevent layout shift
    setMinHeight(container, '200px');

    // Find elements safely
    const titleEl = document.getElementById('toolTitle') ||
                   container.querySelector('.tool-title') ||
                   container.querySelector('h3');

    const descEl = document.getElementById('toolDescription') ||
                  container.querySelector('.tool-description') ||
                  container.querySelector('p');

    const durationEl = document.getElementById('toolDuration');
    const difficultyEl = document.getElementById('toolDifficulty');
    const errorEl = document.getElementById('toolError');

    // Remove "Loading..." text
    if (titleEl && String(titleEl.textContent || '').trim() === 'Loading...') {
      titleEl.textContent = '';
    }

    // Update content using textContent (safe, no encoding issues)
    if (titleEl) {
      titleEl.textContent = truncateString(String(validatedTool.title || validatedTool.name || 'Grounding Reset'), 100);
    }

    if (descEl) {
      const raw = validatedTool.description || validatedTool.summary || '';
      const cleaned = sanitizeDescription(raw, validatedTool.title || validatedTool.name);
      descEl.textContent = cleaned || 'Description coming soon.';
    }

    if (durationEl) {
      durationEl.textContent = truncateString(String(validatedTool.duration || '5 minutes'), 50);
    }

    if (difficultyEl) {
      const difficulty = truncateString(String(validatedTool.difficulty || 'beginner'), 20);
      difficultyEl.textContent = difficulty;
      if (difficultyEl.className) {
        difficultyEl.className = `badge badge-${difficulty}`;
      }
    }

    // Clear errors
    if (errorEl) {
      errorEl.style.display = 'none';
    }

    // Add CTA link if container supports it
    const ctaEl = container.querySelector('.tool-cta') ||
                  container.querySelector('a[href*="tools"]');
    if (ctaEl && validatedTool.cta) {
      const ctaUrl = truncateString(String(validatedTool.cta), 500);
      if (ctaUrl.startsWith('http') || ctaUrl.startsWith('/')) {
        ctaEl.href = ctaUrl;
      }
    }

    console.log('[RYD] Tool of the Day rendered:', truncateString(String(validatedTool.title || validatedTool.id), 50));
  });

  /**
   * Fallback rendering with error boundary
   */
  function showFallback(message) {
    const container = document.getElementById('tool-of-the-day') ||
                     document.querySelector('[data-tool-of-day]') ||
                     document.querySelector('.tool-of-day');

    if (!container) return;

    const boundary = new ErrorBoundary(container);

    try {
      const titleEl = document.getElementById('toolTitle') ||
                     container.querySelector('.tool-title');
      const errorEl = document.getElementById('toolError');

      if (titleEl) {
        titleEl.textContent = 'Grounding Reset';
      }

      if (errorEl) {
        errorEl.textContent = truncateString(String(message || 'Unable to load tool data'), 200);
        errorEl.style.display = 'block';

        // Add retry button
        const retryBtn = document.createElement('button');
        retryBtn.textContent = 'Retry';
        retryBtn.style.cssText = 'margin-left: 8px; padding: 4px 8px; background: var(--color-accent, #667eea); color: white; border: none; border-radius: 4px; cursor: pointer;';
        retryBtn.onclick = () => {
          try {
            location.reload();
          } catch (err) {
            console.error('[RYD Bind] Reload error:', err);
          }
        };
        errorEl.appendChild(retryBtn);
      }
    } catch (error) {
      boundary.catch(error, { component: 'ryd-bind-fallback' });
    }
  }

  /**
   * Search binding with error handling
   */
  function bindSearch() {
    try {
      // Find search input
      const searchInput = document.getElementById('search') ||
                        document.querySelector('[data-search]') ||
                        document.querySelector('input[type="search"]') ||
                        document.querySelector('input[name="search"]') ||
                        document.getElementById('searchInput');

      // Find search button
      const searchBtn = document.getElementById('searchBtn') ||
                       document.querySelector('[data-search-btn]') ||
                       document.querySelector('button[type="submit"]') ||
                       document.getElementById('searchButton');

      if (!searchInput) {
        console.log('[RYD] no search input found');
        return;
      }

      const handleSearch = (e) => {
        try {
          if (e) e.preventDefault();

          const query = truncateString(String(searchInput.value || '').trim().toLowerCase(), 200);
          if (!query) return;

          const tools = safeArray(window.RYD?.getTools?.() || []);

          // Filter tools safely
          const matches = tools.filter(tool => {
            if (!tool || typeof tool !== 'object') return false;
            const searchable = [
              tool.title || '',
              tool.id || '',
              tool.category || '',
              tool.summary || '',
              tool.description || ''
            ].map(s => truncateString(String(s), 100)).join(' ').toLowerCase();
            return searchable.includes(query);
          });

          // Store results safely
          try {
            sessionStorage.setItem('ryd:lastSearch', JSON.stringify({
              query: query,
              matches: matches.slice(0, 50), // Limit stored results
              timestamp: Date.now()
            }));
          } catch (e) {
            // Ignore sessionStorage errors
          }

          // Always redirect to /tools with query
          const url = `/tools?q=${encodeURIComponent(query)}`;
          window.location.href = url;
        } catch (searchError) {
          console.error('[RYD Bind] Search error:', searchError);
        }
      };

      // Bind events
      if (searchInput.form) {
        searchInput.form.addEventListener('submit', handleSearch);
      }

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          handleSearch(e);
        }
      });

      if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
      }

      console.log('[RYD] search bound');
    } catch (bindError) {
      console.error('[RYD Bind] Bind search error:', bindError);
    }
  }

  /**
   * Insights hydration with error boundary and safe data loading
   */
  const hydrateInsights = withErrorBoundary(null, async function() {
    const container = document.getElementById('insights-list') ||
                     document.getElementById('insights-container') ||
                     document.querySelector('[data-insights]');

    if (!container) {
      if (!window._rydBindInsightsWarned) {
        console.log('[RYD] no insights container found (this is OK if insights section is not on this page)');
        window._rydBindInsightsWarned = true;
      }
      return;
    }

    // Try to load insights data safely
    let insights = [];
    try {
      // First try the safe loader if available
      if (window.RYD_SafeLoader && typeof window.RYD_SafeLoader.loadInsights === 'function') {
        insights = await window.RYD_SafeLoader.loadInsights();
      } else {
        // Fallback: try to fetch directly
        try {
          const response = await fetch('/data/insights.json');
          if (response.ok) {
            const data = await response.json();
            insights = safeArray(data?.insights || []);
          }
        } catch (fetchError) {
          console.warn('[RYD Bind] Failed to load insights.json:', fetchError.message);
        }
      }
    } catch (loadError) {
      console.warn('[RYD Bind] Error loading insights:', loadError.message);
    }

    // If no insights, try tools as fallback
    if (insights.length === 0) {
      try {
        const tools = safeArray(window.RYD?.getTools?.() || []);
        if (tools.length > 0) {
          // Convert tools to insights-like format for display
          insights = tools.slice(0, 10).map(tool => ({
            id: tool.id || tool.slug,
            title: tool.title || tool.name || tool.id,
            slug: tool.slug || tool.id
          }));
        }
      } catch (toolsError) {
        console.warn('[RYD Bind] Error getting tools for insights:', toolsError.message);
      }
    }

    if (insights.length === 0) {
      container.textContent = 'No insights available at this time.';
      return;
    }

    // Render insights list
    const list = document.createElement('ul');
    insights.slice(0, 10).forEach(insight => {
      if (!insight || typeof insight !== 'object') return;
      
      try {
        const li = document.createElement('li');
        const link = document.createElement('a');
        const slug = encodeURIComponent(truncateString(String(insight.slug || insight.id || ''), 100));
        const title = truncateString(String(insight.title || insight.id || 'Untitled'), 60);
        
        // Use insights route if available, otherwise tools route
        if (insight.slug && insight.id && insight.id.startsWith('insight-')) {
          link.href = `/insights/${slug}`;
        } else {
          link.href = `/tools/tool.html?slug=${slug}`;
        }
        link.textContent = title;
        li.appendChild(link);
        list.appendChild(li);
      } catch (insightError) {
        console.error('[RYD Bind] Error rendering insight:', insightError);
      }
    });

    container.innerHTML = '';
    container.appendChild(list);

    console.log('[RYD] insights hydrated');
  });

  /**
   * Main bind function
   */
  function bind() {
    try {
      if (window.RYD?.status === 'ready') {
        const tool = window.RYD.pickToolOfDay?.();
        renderToolOfDay(tool);
        hydrateInsights();
      } else if (window.RYD?.status === 'error') {
        showFallback(window.RYD.error || 'Unable to load data');
      }

      // Always bind search (works even without matrix)
      bindSearch();
    } catch (bindError) {
      console.error('[RYD Bind] Bind error:', bindError);
      showFallback('Unable to initialize');
    }
  }

  // Listen for ready/error events
  window.addEventListener('ryd:ready', (e) => {
    try {
      console.log('[RYD] bind: ready event received');
      const tool = window.RYD?.pickToolOfDay?.();
      renderToolOfDay(tool);
      hydrateInsights();
    } catch (readyError) {
      console.error('[RYD Bind] Ready event error:', readyError);
    }
  });

  window.addEventListener('ryd:error', (e) => {
    try {
      console.log('[RYD] bind: error event received');
      showFallback(window.RYD?.error || 'Unable to load data');
    } catch (errorEventError) {
      console.error('[RYD Bind] Error event handler error:', errorEventError);
    }
  });

  // Bind on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }

  // Also bind after a short delay (in case boot finishes first)
  setTimeout(bind, 100);
})();
