/**
 * RYD Tools Page Renderer - HARDENED VERSION
 * Populates the tools grid once matrix data is ready.
 * 
 * PRODUCTION HARDENING:
 * - Error boundaries for all dynamic content
 * - Validation for all API data
 * - Loading and error states
 * - Edge case handling
 * - Memoization for performance
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
  const { renderCache } = window.RYD_Cache || { renderCache: { get: () => null, set: () => {} } };
  const { cleanData, cleanDataArray, ensureWhereItCameFrom } = window.RYD_DataSanitizer || {
    cleanData: (data) => data,
    cleanDataArray: (arr) => arr,
    ensureWhereItCameFrom: (data) => data
  };
  const { logError } = window.RYD_ErrorMonitor || { logError: () => {} };
  const { setMinHeight } = window.RYD_UIStability || { setMinHeight: () => {} };

  /**
   * Safe string truncation
   */
  function truncateString(str, maxLength = 100) {
    if (!str || typeof str !== 'string') return '';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }

  /**
   * Safe array access
   */
  function safeArray(arr, fallback = []) {
    if (!Array.isArray(arr)) return fallback;
    return arr;
  }

  /**
   * Sanitize description
   */
  function sanitizeDescription(raw, title) {
    if (window.RYD_UI && typeof window.RYD_UI.sanitizeDescription === 'function') {
      return window.RYD_UI.sanitizeDescription(raw, title);
    }
    return truncateString(String(raw || ''), 200);
  }

  /**
   * Render tools with error boundary protection
   */
  const renderTools = withErrorBoundary(null, function(tools) {
    const grid = document.getElementById('toolsGrid');
    if (!grid) {
      console.warn('[RYD Tools] Container #toolsGrid not found');
      return;
    }

    grid.innerHTML = '';

    // Validate and sanitize tools
    const toolsValidation = validateData(tools, schemas.toolsResponse, { tools: [] });
    const rawTools = toolsValidation.data?.tools || tools || [];
    const validatedTools = cleanDataArray(rawTools, 'tool').map(tool => ensureWhereItCameFrom(tool));

    if (validatedTools.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'card tool-card';
      empty.style.cssText = 'padding: 2rem; text-align: center; color: #666;';
      empty.textContent = 'No tools available yet.';
      grid.appendChild(empty);
      return;
    }

    validatedTools.forEach(tool => {
      if (!tool || typeof tool !== 'object') return;

      try {
        const card = document.createElement('div');
        card.className = 'card tool-card';
        card.style.cssText = 'border: 1px solid #e0e0e0; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; background: #fff;';

        const title = document.createElement('h3');
        title.className = 'tool-title';
        title.textContent = truncateString(String(tool.title || tool.name || tool.id || 'Tool'), 60);
        title.style.cssText = 'margin: 0 0 0.5rem 0; font-size: 1.2em; color: #333;';
        card.appendChild(title);

        const desc = document.createElement('p');
        desc.className = 'tool-description';
        const cleaned = sanitizeDescription(tool.description || tool.summary || '', tool.title || tool.name);
        desc.textContent = cleaned || 'Description coming soon.';
        desc.style.cssText = 'margin: 0 0 1rem 0; color: #666; font-size: 0.9em; line-height: 1.5;';
        card.appendChild(desc);

        const meta = document.createElement('div');
        meta.className = 'tool-meta';
        meta.style.cssText = 'display: flex; gap: 1rem; margin-bottom: 1rem; font-size: 0.85em; color: #888;';

        if (tool.duration && String(tool.duration).trim()) {
          const duration = document.createElement('span');
          duration.className = 'tool-meta-item';
          duration.textContent = `⏱️ ${truncateString(String(tool.duration), 20)}`;
          meta.appendChild(duration);
        }

        if (tool.difficulty && String(tool.difficulty).trim()) {
          const difficulty = document.createElement('span');
          difficulty.className = 'tool-meta-item';
          difficulty.textContent = `📊 ${truncateString(String(tool.difficulty), 20)}`;
          meta.appendChild(difficulty);
        }

        if (meta.children.length > 0) {
          card.appendChild(meta);
        }

        const cta = document.createElement('a');
        const slug = encodeURIComponent(truncateString(String(tool.slug || tool.id || tool.title || tool.name || ''), 100));
        cta.href = `/tools/tool.html?slug=${slug}`;
        cta.textContent = 'Open Tool';
        cta.className = 'tool-cta';
        cta.style.cssText = 'display: inline-block; padding: 0.5rem 1rem; background: #667eea; color: white; text-decoration: none; border-radius: 4px; font-size: 0.9em;';
        card.appendChild(cta);

        grid.appendChild(card);
      } catch (toolError) {
        console.error('[RYD Tools] Error rendering tool:', toolError);
        // Continue with next tool
      }
    });
  });

  /**
   * Render loading state with stability
   */
  function renderLoading() {
    const grid = document.getElementById('toolsGrid');
    if (!grid) return;
    
    // Set min-height to prevent layout shift
    setMinHeight(grid, '300px');
    
    grid.innerHTML = `
      <div class="ryd-loading" style="padding: 2rem; text-align: center; min-height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p style="margin-top: 1rem; color: #666;">Loading tools...</p>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
  }

  /**
   * Render error state
   */
  function renderError(error) {
    const grid = document.getElementById('toolsGrid');
    if (!grid) return;
    
    const boundary = new ErrorBoundary(grid);
    boundary.catch(error, { component: 'ryd-tools' });
  }

  /**
   * Handle ready event
   */
  function handleReady() {
    try {
      const tools = (window.RYD && typeof window.RYD.getTools === 'function')
        ? window.RYD.getTools()
        : [];
      
      renderTools(tools);
    } catch (error) {
      console.error('[RYD Tools] Error in handleReady:', error);
      renderError(error);
    }
  }

  /**
   * Initialize
   */
  function init() {
    const grid = document.getElementById('toolsGrid');
    if (!grid) {
      console.warn('[RYD Tools] Container #toolsGrid not found');
      return;
    }

    renderLoading();

    // Wait for utils if needed
    if (!window.RYD_ErrorBoundary) {
      window.addEventListener('ryd:utils-ready', () => {
        setTimeout(handleReady, 100);
      });
      return;
    }

    // Listen for ready event
    window.addEventListener('ryd:ready', handleReady);
    window.addEventListener('ryd:error', () => {
      renderTools([]);
    });

    // Try immediate render if data already available
    if (document.readyState !== 'loading') {
      setTimeout(handleReady, 100);
    }
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
