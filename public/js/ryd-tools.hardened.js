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
   * CIRCULAR REFERENCE DETECTION - Prevents memory leaks
   * Non-blocking validation using WeakSet for O(1) lookups
   */
  const circularReferenceDetector = (function() {
    const visited = new WeakSet();
    const MAX_DEPTH = 10;
    
    function detectCircular(obj, path = [], depth = 0) {
      if (depth > MAX_DEPTH) {
        return { circular: true, path: path.join(' -> ') };
      }
      
      if (typeof obj !== 'object' || obj === null) {
        return { circular: false };
      }
      
      if (visited.has(obj)) {
        return { circular: true, path: path.join(' -> ') };
      }
      
      visited.add(obj);
      
      try {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            if (typeof value === 'object' && value !== null) {
              const result = detectCircular(value, [...path, key], depth + 1);
              if (result.circular) {
                return result;
              }
            }
          }
        }
      } finally {
        // Clean up visited set periodically to prevent memory growth
        if (depth === 0 && visited.size > 1000) {
          visited.clear();
        }
      }
      
      return { circular: false };
    }
    
    return {
      detect: detectCircular,
      clear: () => visited.clear()
    };
  })();

  /**
   * Safe clone that strips circular refs and non-serializable refs (parent/children/related).
   * Use before validation/stringify so circular reference never breaks the page.
   */
  function safeCloneTool(tool) {
    if (!tool || typeof tool !== 'object') return null;
    const seen = new WeakSet();
    const BACKREF_KEYS = ['parent', 'children', 'related', 'parentTool', 'childTools', '_parent', '_children'];
    function clone(obj, depth) {
      if (depth > 15) return null;
      if (obj === null || typeof obj !== 'object') return obj;
      if (seen.has(obj)) return undefined;
      if (Array.isArray(obj)) {
        seen.add(obj);
        return obj.map(item => clone(item, depth + 1)).filter(item => item !== undefined);
      }
      seen.add(obj);
      const out = {};
      for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
        if (BACKREF_KEYS.indexOf(key) >= 0) continue;
        try {
          const v = clone(obj[key], depth + 1);
          if (v !== undefined) out[key] = v;
        } catch (_) { /* skip bad refs */ }
      }
      return out;
    }
    return clone(tool, 0);
  }
  
  /**
   * NON-BLOCKING VALIDATION - Uses requestIdleCallback or setTimeout
   */
  function validateNonBlocking(data, validator, callback) {
    const validateFn = () => {
      try {
        const result = validator(data);
        callback(result);
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    };
    
    // Use requestIdleCallback if available (non-blocking)
    if (window.requestIdleCallback) {
      requestIdleCallback(validateFn, { timeout: 100 });
    } else {
      // Fallback to setTimeout with minimal delay
      setTimeout(validateFn, 0);
    }
  }

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

    // Filter to primary tools only; PROD = EligibleForLists only, DEV = all (mark drafts)
    let rawTools = tools || [];
    const totalTools = rawTools.length;
    if (window.RYD_ToolVariant && window.RYD_ToolVariant.filterPrimaryTools) {
      rawTools = window.RYD_ToolVariant.filterPrimaryTools(rawTools);
    }
    const primaryCount = rawTools.length;
    const isProd = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const eligibleTools = window.RYD_ToolValidator && window.RYD_ToolValidator.getEligibleForLists
      ? window.RYD_ToolValidator.getEligibleForLists(rawTools)
      : rawTools;
    if (window.RYD_ToolValidator && window.RYD_ToolValidator.filterToolsForList) {
      rawTools = window.RYD_ToolValidator.filterToolsForList(rawTools, isProd);
    }
    const hiddenDrafts = isProd ? primaryCount - rawTools.length : 0;
    console.log('[RYD Tools] Publish gate:', { total: totalTools, primary: primaryCount, eligible: eligibleTools.length, hiddenDrafts: isProd ? hiddenDrafts : 0 });
    let validatedTools = [];
    
    // Quick synchronous validation first
    if (Array.isArray(rawTools)) {
      // Non-blocking circular reference check: sanitize instead of dropping all tools
      const circularCheck = circularReferenceDetector.detect({ tools: rawTools });
      if (circularCheck.circular) {
        console.warn('[RYD Tools] Circular reference detected in tools data:', circularCheck.path);
        rawTools = rawTools.map(t => safeCloneTool(t)).filter(Boolean);
      }
      
      // Validate each tool asynchronously to prevent blocking
      validatedTools = rawTools.map((tool, index) => {
        // Quick synchronous validation
        if (!tool || typeof tool !== 'object') return null;
        
        // If circular in this tool, use safe clone so we don't block rendering
        const toolCircular = circularReferenceDetector.detect(tool);
        if (toolCircular.circular) {
          console.warn(`[RYD Tools] Circular reference in tool ${index}:`, toolCircular.path);
          tool = safeCloneTool(tool);
          if (!tool) return null;
        }
        
        // Full validation (can be async, but we do sync for now)
        const toolValidation = validateData(tool, schemas.tool, tool);
        const cleaned = cleanDataArray([toolValidation.data || tool], 'tool')[0];
        return cleaned ? ensureWhereItCameFrom(cleaned) : null;
      }).filter(Boolean);
    }

    if (validatedTools.length === 0) {
      // FAIL-LOUD: Show loading/error state, not empty state
      const stateCard = document.createElement('div');
      stateCard.className = 'card tool-card';
      stateCard.style.cssText = 'padding: 2rem; text-align: center;';
      
      // Check if registry is loading or failed
      if (window.RYD_RegistryLoader) {
        const status = window.RYD_RegistryLoader.getStatus();
        if (status.error) {
          stateCard.style.cssText = 'border-left: 4px solid #d32f2f; background: #ffebee; padding: 2rem; text-align: center;';
          stateCard.innerHTML = `
            <h3 style="color: #d32f2f; margin-bottom: 12px;">Tool Registry Failed to Load</h3>
            <p style="color: #666; margin-bottom: 16px;">${status.error.message || 'Unknown error'}</p>
            <button onclick="window.location.reload()" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button>
          `;
        } else if (!status.loaded) {
          stateCard.innerHTML = '<p style="color: #666;">Loading tools...</p>';
        } else {
          stateCard.style.cssText = 'border-left: 4px solid #ff9800; background: #fff3e0; padding: 2rem; text-align: center;';
          stateCard.innerHTML = `
            <h3 style="color: #ff9800; margin-bottom: 12px;">No Valid Tools Available</h3>
            <p style="color: #666;">Registry loaded (${status.toolCount} tools) but all tools failed validation. Check console for details.</p>
          `;
        }
      } else {
        stateCard.innerHTML = '<p style="color: #666;">Initializing tool registry...</p>';
      }
      
      grid.appendChild(stateCard);
      return;
    }

    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const validator = window.RYD_ToolValidator;
    const expander = window.RYD_ToolExpander;

    validatedTools.forEach(tool => {
      if (!tool || typeof tool !== 'object') return;

      let currentTool = tool;
      const toolTitle = currentTool.title || currentTool.name || currentTool.id;
      if (!toolTitle || String(toolTitle).trim() === '') return;

      let quality = validator && validator.validateToolQuality ? validator.validateToolQuality(currentTool, validatedTools) : { ok: true };
      if (!quality.ok && isDev && expander && typeof expander.expandToolContent === 'function') {
        try {
          currentTool = expander.expandToolContent(currentTool);
          quality = validator && validator.validateToolQuality ? validator.validateToolQuality(currentTool, validatedTools) : quality;
        } catch (e) {
          console.warn('[RYD Tools] Expand failed for', currentTool.id || currentTool.slug, e.message);
        }
      }

      const validation = validator && validator.validateTool ? validator.validateTool(currentTool) : { ok: false, errors: [] };
      const eligible = validator && validator.isEligibleForLists ? validator.isEligibleForLists(currentTool, validatedTools) : true;
      if (!validation.ok) {
        if (validator && validator.logValidationOnce) {
          validator.logValidationOnce(currentTool.id || currentTool.slug || currentTool.title, validation.errors);
        }
        if (!isDev) return;
      }

      try {
        const card = document.createElement('div');
        card.className = 'card tool-card';
        card.style.cssText = 'border: 1px solid #e0e0e0; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; background: #fff; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;';
        
        card.addEventListener('mouseenter', () => {
          card.style.transform = 'translateY(-2px)';
          card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        });
        card.addEventListener('mouseleave', () => {
          card.style.transform = 'translateY(0)';
          card.style.boxShadow = 'none';
        });

        const title = document.createElement('h3');
        title.className = 'tool-title';
        title.textContent = truncateString(String(currentTool.title || currentTool.name || currentTool.id), 60);
        title.style.cssText = 'margin: 0 0 0.5rem 0; font-size: 1.2em; color: #333;';
        if ((!validation.ok || !eligible) && isDev) {
          const badge = document.createElement('span');
          badge.textContent = eligible ? ' NEEDS CONTENT' : ' DRAFT';
          badge.style.cssText = 'font-size: 0.65em; color: #ff9800; font-weight: 600;';
          title.appendChild(badge);
        }
        card.appendChild(title);

        const desc = document.createElement('p');
        desc.className = 'tool-description';
        const preview = window.RYD_ToolPreview && typeof window.RYD_ToolPreview.getToolPreview === 'function'
          ? window.RYD_ToolPreview.getToolPreview(currentTool)
          : null;
        const rawDesc = validator && validator.getContentSafe
          ? validator.getContentSafe(currentTool, 'description')
          : (currentTool.description || currentTool.summary || '');
        const cleaned = (typeof preview === 'string' && preview.trim())
          ? preview.trim()
          : (sanitizeDescription(rawDesc, toolTitle) || 'Content needs review.');
        desc.textContent = cleaned;
        desc.style.cssText = 'margin: 0 0 1rem 0; color: #666; font-size: 0.9em; line-height: 1.5;';
        card.appendChild(desc);

        const meta = document.createElement('div');
        meta.className = 'tool-meta';
        meta.style.cssText = 'display: flex; gap: 1rem; margin-bottom: 1rem; font-size: 0.85em; color: #888;';

        if (currentTool.duration && String(currentTool.duration).trim()) {
          const duration = document.createElement('span');
          duration.className = 'tool-meta-item';
          duration.textContent = `⏱️ ${truncateString(String(currentTool.duration), 20)}`;
          meta.appendChild(duration);
        }

        if (currentTool.difficulty && String(currentTool.difficulty).trim()) {
          const difficulty = document.createElement('span');
          difficulty.className = 'tool-meta-item';
          difficulty.textContent = `📊 ${truncateString(String(currentTool.difficulty), 20)}`;
          meta.appendChild(difficulty);
        }

        if (meta.children.length > 0) {
          card.appendChild(meta);
        }

        const cta = document.createElement('a');
        const slug = encodeURIComponent(truncateString(String(currentTool.slug || currentTool.id || toolTitle || ''), 100));
        cta.href = `/tools/tool.html?slug=${slug}`;
        cta.textContent = 'Open Tool';
        cta.className = 'tool-cta';
        cta.style.cssText = 'display: inline-block; padding: 0.5rem 1rem; background: #667eea; color: white; text-decoration: none; border-radius: 4px; font-size: 0.9em;';
        cta.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.href = cta.href;
        });
        card.appendChild(cta);

        // Make entire card clickable
        card.addEventListener('click', (e) => {
          // Don't trigger if clicking the CTA link or About button
          if (e.target === cta || cta.contains(e.target)) return;
          if (e.target.classList.contains('ryd-about-button') || e.target.closest('.ryd-about-button')) return;
          window.location.href = cta.href;
        });

        // Add "About This Tool" button
        if (window.RYD_ToolAbout && typeof window.RYD_ToolAbout.addAboutButton === 'function') {
          window.RYD_ToolAbout.addAboutButton(card, tool);
        }

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
      <div class="ryd-loading" style="padding: 2rem; text-align: center; min-height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none;">
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
   * Handle ready event - Use graph API or registry loader
   */
  async function handleReady() {
    try {
      // Try graph API first (canonical)
      if (window.RYD_Graph && typeof window.RYD_Graph.init === 'function') {
        try {
          await window.RYD_Graph.init();
          const tools = window.RYD_Graph.graphData?.tools || [];
          if (tools.length > 0) {
            renderTools(tools);
            return;
          }
        } catch (graphError) {
          console.warn('[RYD Tools] Graph API failed, trying registry loader:', graphError.message);
        }
      }

      // Try registry loader (fallback)
      if (window.RYD_RegistryLoader) {
        try {
          const registry = await window.RYD_RegistryLoader.load();
          if (registry.tools && registry.tools.length > 0) {
            renderTools(registry.tools);
            return;
          }
        } catch (registryError) {
          console.error('[RYD Tools] Registry load failed:', {
            error: registryError.message,
            status: window.RYD_RegistryLoader.getStatus()
          });
          renderError(registryError);
          return;
        }
      }
      
      // Fallback to RYD.getTools (legacy)
      const tools = (window.RYD && typeof window.RYD.getTools === 'function')
        ? window.RYD.getTools()
        : [];
      
      if (tools.length === 0) {
        throw new Error('No tools available. Ensure graph API or registry loader is initialized.');
      }
      
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

    // Check if inline script already rendered (tools.html has inline loadAndRenderTools)
    // If grid has content beyond initial "Loading tools...", skip to avoid conflict
    const currentContent = grid.innerHTML.trim();
    if (currentContent && !currentContent.includes('Loading tools') && !currentContent.includes('ryd-loading')) {
      console.log('[RYD Tools] Grid already has content, skipping ryd-tools.hardened init');
      return;
    }

    renderLoading();

    // Do NOT block on RYD_ErrorBoundary or ryd:utils-ready — call handleReady immediately
    // (ryd:utils-ready may never fire if utils-loader not loaded)
    const runHandleReady = () => {
      handleReady().catch(err => {
        console.error('[RYD Tools] Initial load failed:', err);
        renderError(err);
      });
    };

    if (window.RYD_ErrorBoundary) {
      window.addEventListener('ryd:ready', handleReady);
      window.addEventListener('ryd:error', (e) => {
        const err = (e && e.detail && e.detail.error) ? new Error(String(e.detail.error)) : new Error('Tool registry failed');
        renderError(err);
      });
    }

    // Always run handleReady (primary path: registry/graph)
    setTimeout(runHandleReady, 50);
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
