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
  const RYD_Validation = window.RYD_Validation || {};
  const { schemas = {}, validateData = (data) => ({ success: true, data }) } = RYD_Validation;
  const schemaObjectFn = typeof RYD_Validation.object === 'function' ? RYD_Validation.object : null;
  const { cleanData, ensureWhereItCameFrom } = window.RYD_DataSanitizer || {
    cleanData: (data) => data,
    ensureWhereItCameFrom: (data) => data
  };
  const { logError } = window.RYD_ErrorMonitor || { logError: () => {} };
  const { setMinHeight } = window.RYD_UIStability || { setMinHeight: () => {} };

  /** Tool of the Day section UI disabled; no DOM insertion from this module. */
  const TOOL_OF_DAY_UI_DISABLED = true;

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
   * Strip markdown for SCAN MODE: remove ##, ###, **, leading # from a line. Never render raw markdown.
   */
  function stripMarkdownLine(line) {
    if (!line || typeof line !== 'string') return '';
    return line
      .replace(/^#+\s*/, '')
      .replace(/\*\*([^*]*)\*\*/g, '$1')
      .replace(/\*([^*]*)\*/g, '$1')
      .replace(/^[-*]\s*/, '')
      .trim();
  }

  /**
   * Get 5-min reset steps from tool (max 5). Prefer structured steps; else derive from body stripping markdown. Never full content.
   */
  function getResetSteps(tool) {
    const raw = (tool && (tool.reset && tool.reset.do)) ||
                (tool && tool.rydCompressed && tool.rydCompressed.reset5 && tool.rydCompressed.reset5.do) ||
                (tool && tool.reset_5 && tool.reset_5.steps) ||
                (tool && tool.versions && tool.versions.min5 && tool.versions.min5.steps) ||
                (tool && tool.steps);
    let arr = Array.isArray(raw) ? raw : (raw ? [String(raw)] : []);
    arr = arr.filter(Boolean).map(String).slice(0, 5);
    if (arr.length > 0) return arr.map(function(l) { return truncateString(stripMarkdownLine(l), 120); });
    var text = String(tool && (tool.description || tool.summary || tool.content || tool.body || '')).trim();
    if (!text) return [];
    var lines = text.split(/\n/).map(function(l) { return stripMarkdownLine(l.trim()); }).filter(Boolean);
    lines = lines.filter(function(l) { return l.length > 3 && l.length < 200; }).slice(0, 5);
    return lines.map(function(l) { return truncateString(l, 120); });
  }

  /**
   * First sentence for summary. Strips leading markdown (##, **). No long text, no raw markdown.
   */
  function firstSentence(str) {
    if (!str || typeof str !== 'string') return '';
    var s = str.trim().replace(/\s+/g, ' ').replace(/^#+\s*/, '').replace(/\*\*([^*]*)\*\*/g, '$1').replace(/\*([^*]*)\*/g, '$1');
    var match = s.match(/^[^.!?]{1,140}[.!?]?/);
    return match ? match[0].trim() : truncateString(s, 120);
  }

  /**
   * Render Tool of the Day in SCAN MODE: title, short purpose, 3-5 bullets, one CTA. No long text. Optionally show draft badge if needsContent.
   */
  const renderToolOfDay = withErrorBoundary(null, function(tool, opts) {
    if (TOOL_OF_DAY_UI_DISABLED) return;
    opts = opts || {};
    const needsContent = !!opts.needsContent;
    const reasons = Array.isArray(opts.reasons) ? opts.reasons : [];

    if (!tool || typeof tool !== 'object') {
      const container = document.getElementById('tool-of-the-day') ||
                       document.getElementById('toolOfDay') ||
                       document.querySelector('[data-tool-of-day]') ||
                       document.querySelector('.tool-of-day');
      if (container) {
        container.innerHTML = '';
        const titleEl = document.createElement('h2');
        titleEl.textContent = 'Tool of the Day';
        const p = document.createElement('p');
        p.textContent = 'Check back soon for today\'s featured tool.';
        container.appendChild(titleEl);
        container.appendChild(p);
      }
      return;
    }

    const toolSchema = schemas.tool || (schemaObjectFn ? schemaObjectFn({}) : null);
    const rawTool = toolSchema && typeof validateData === 'function'
      ? (function() { var v = validateData(tool, toolSchema, null); return v.success ? v.data : tool; })()
      : tool;
    const validatedTool = ensureWhereItCameFrom(cleanData(rawTool, 'tool'));
    const source_origin = validatedTool?.where_it_came_from ?? 'hardened_stable_fallback';
    validatedTool.where_it_came_from = source_origin;

    const container = document.getElementById('tool-of-the-day') ||
                     document.getElementById('toolOfDay') ||
                     document.querySelector('[data-tool-of-day]') ||
                     document.querySelector('.tool-of-day');

    if (!container) {
      console.log('[RYD] no Tool of the Day container found');
      return;
    }

    setMinHeight(container, '200px');

    if (needsContent && reasons.length > 0) {
      console.warn('[RYD] Tool of the Day: validation warning (showing as draft)', reasons);
    }

    // SCAN MODE ONLY: title (link), 1-2 line summary, 3-5 bullets, one CTA. NEVER full markdown/body.
    const title = truncateString(String(validatedTool.title || validatedTool.name || 'Grounding Reset'), 100);
    const summaryRaw = (window.RYD_ToolPreview && typeof window.RYD_ToolPreview.getToolPreview === 'function')
      ? window.RYD_ToolPreview.getToolPreview(validatedTool)
      : (validatedTool.purpose || validatedTool.tagline ||
          firstSentence(validatedTool.description || validatedTool.body || '') ||
          validatedTool.outcome || validatedTool.summary || '');
    const summary = truncateString(String(summaryRaw || 'A helpful mental health tool.'), 160);
    const slug = truncateString(String(validatedTool.slug || validatedTool.id || ''), 200);
    const resetSteps = getResetSteps(validatedTool);

    container.innerHTML = '';
    if (!container.classList.contains('ryd-tod-scan')) container.classList.add('ryd-tod-scan');
    container.setAttribute('role', 'button');
    container.setAttribute('tabindex', '0');
    container.style.cursor = 'pointer';
    container.style.maxWidth = '42em';

    const titleRow = document.createElement('div');
    titleRow.style.cssText = 'display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 0.5em;';
    const h3 = document.createElement('h3');
    h3.style.cssText = 'font-size: 1.35em; margin: 0; line-height: 1.3; font-weight: 600;';
    const titleLink = document.createElement('a');
    titleLink.href = '/tools/tool.html?slug=' + encodeURIComponent(slug);
    titleLink.textContent = title;
    titleLink.style.color = 'inherit';
    titleLink.style.textDecoration = 'none';
    titleLink.addEventListener('click', function(e) { e.stopPropagation(); });
    h3.appendChild(titleLink);
    titleRow.appendChild(h3);
    if (needsContent) {
      const badge = document.createElement('span');
      badge.className = 'ryd-tod-badge-draft';
      badge.textContent = 'in progress';
      badge.setAttribute('aria-label', 'Content in progress');
      badge.style.cssText = 'font-size: 0.7em; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: var(--color-bg-secondary, #f0f0f0); color: var(--color-text-secondary, #666);';
      titleRow.appendChild(badge);
    }
    container.appendChild(titleRow);

    const summaryEl = document.createElement('p');
    summaryEl.className = 'tod-summary ryd-purpose';
    summaryEl.textContent = summary;
    summaryEl.style.cssText = 'margin: 0 0 1em 0; font-size: 1em; line-height: 1.4; color: var(--color-text-secondary, #555); overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2;';
    container.appendChild(summaryEl);

    if (resetSteps.length > 0) {
      const preview = document.createElement('div');
      preview.className = 'ryd-5min-preview';
      preview.style.cssText = 'margin: 0 0 1em 0;';
      const previewH3 = document.createElement('h3');
      previewH3.textContent = '5 MIN RESET';
      previewH3.style.cssText = 'font-size: 0.95em; margin: 0 0 0.35em 0; font-weight: 600; color: var(--color-text-secondary, #555);';
      preview.appendChild(previewH3);
      const ul = document.createElement('ul');
      ul.className = 'tod-preview';
      ul.style.cssText = 'margin: 0; padding-left: 1.2em; line-height: 1.4; font-size: 0.95em;';
      resetSteps.forEach(function(step) {
        const li = document.createElement('li');
        li.textContent = String(step);
        ul.appendChild(li);
      });
      preview.appendChild(ul);
      container.appendChild(preview);
    }

    const cta = document.createElement('a');
    cta.href = '/tools/tool.html?slug=' + encodeURIComponent(slug) + '#reset-5';
    cta.className = 'tod-cta ryd-tod-cta';
    cta.textContent = 'Try the 5-minute reset';
    cta.style.cssText = 'display: inline-block; box-sizing: border-box; padding: 12px 20px; min-height: 48px; font-size: 1em; font-weight: 600; border: none; border-radius: 8px; background: var(--color-accent, #667eea); color: white; cursor: pointer; width: 100%; max-width: 280px; text-align: center; text-decoration: none; line-height: 1.4;';
    cta.addEventListener('click', function(e) { e.stopPropagation(); });
    container.appendChild(cta);

    function openFullTool(e) {
      if (e) e.stopPropagation();
      if (!slug) return;
      const url = '/tools/tool.html?slug=' + encodeURIComponent(slug);
      window.location.href = url;
    }

    container.addEventListener('click', function(e) {
      if (e.target === cta || cta.contains(e.target) || e.target === titleLink || titleLink.contains(e.target)) return;
      openFullTool(e);
    });
    container.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (e.target === cta || cta.contains(e.target) || e.target === titleLink || titleLink.contains(e.target)) return;
        openFullTool(e);
      }
    });

    console.log('[RYD] Tool of the Day rendered (SCAN MODE):', truncateString(String(validatedTool.title || validatedTool.id), 50));
  });

  /**
   * Show "needs content" state for tool that fails quality validation (SCAN-style, no full text)
   */
  function showNeedsContentState(tool, reasons) {
    if (TOOL_OF_DAY_UI_DISABLED) return;
    const container = document.getElementById('tool-of-the-day') ||
                     document.getElementById('toolOfDay') ||
                     document.querySelector('[data-tool-of-day]') ||
                     document.querySelector('.tool-of-day');
    if (!container) return;
    container.innerHTML = '';
    const title = truncateString(String(tool?.title || tool?.name || 'Tool'), 100);
    const slug = truncateString(String(tool?.slug || tool?.id || ''), 200);
    const h2 = document.createElement('h2');
    h2.textContent = title;
    h2.className = 'ryd-tod-title';
    container.appendChild(h2);
    const p = document.createElement('p');
    p.className = 'ryd-purpose';
    p.textContent = 'This tool needs more content.';
    p.style.cssText = 'margin: 0 0 1em 0; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2;';
    container.appendChild(p);
    const cta = document.createElement('button');
    cta.type = 'button';
    cta.textContent = 'Try the 5-minute reset';
    cta.setAttribute('data-open-tool', slug);
    cta.style.cssText = 'padding: 12px 20px; min-height: 48px; font-size: 1em; font-weight: 600; border: none; border-radius: 8px; background: var(--color-accent, #667eea); color: white; cursor: pointer; width: 100%; max-width: 280px;';
    if (slug) cta.addEventListener('click', function() { window.location.href = '/tools/tool.html?slug=' + encodeURIComponent(slug); });
    container.appendChild(cta);
    console.debug('[RYD] Tool of the Day: needs content state');
  }

  /**
   * Fallback rendering with error boundary (SCAN-style, no full text)
   */
  function showFallback(message) {
    if (TOOL_OF_DAY_UI_DISABLED) return;
    const container = document.getElementById('tool-of-the-day') ||
                     document.getElementById('toolOfDay') ||
                     document.querySelector('[data-tool-of-day]') ||
                     document.querySelector('.tool-of-day');

    if (!container) return;

    const boundary = new ErrorBoundary(container);

    try {
      container.innerHTML = '';
      const titleEl = document.createElement('h2');
      titleEl.textContent = message && message.includes('rotation') ? 'Tool of the Day' : 'Grounding Reset';
      titleEl.className = 'ryd-tod-title';
      container.appendChild(titleEl);
      const p = document.createElement('p');
      p.className = 'ryd-purpose';
      p.textContent = truncateString(String(message || 'Unable to load tool data'), 200);
      p.style.cssText = 'margin: 0 0 1em 0; -webkit-line-clamp: 2; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical;';
      container.appendChild(p);
      const retryBtn = document.createElement('button');
      retryBtn.type = 'button';
      retryBtn.textContent = 'Retry';
      retryBtn.style.cssText = 'padding: 12px 20px; min-height: 48px; font-size: 1em; font-weight: 600; border: none; border-radius: 8px; background: var(--color-accent, #667eea); color: white; cursor: pointer;';
      retryBtn.onclick = function() {
        try { location.reload(); } catch (err) { console.error('[RYD Bind] Reload error:', err); }
      };
      container.appendChild(retryBtn);
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
   * Timeout helper for non-blocking operations
   */
  function withTimeout(promise, ms, onTimeout) {
    let timeoutId;
    const timeout = new Promise((resolve) => {
      timeoutId = setTimeout(() => {
        resolve(onTimeout?.());
      }, ms);
    });
    return Promise.race([
      promise.finally(() => clearTimeout(timeoutId)),
      timeout
    ]);
  }

  let toolOfDayFallbackTried = false;

  const TOOL_OF_DAY_FETCH_MS = 800;

  /**
   * Parse tools from JSON response (array or { tools: array })
   */
  function parseToolsResponse(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.tools)) return data.tools;
    return [];
  }

  /**
   * Load tools for Tool of the Day only. Does NOT wait for MatrixExpander or ryd:ready.
   * Priority: window.__RYD_TOOLS → window.RYD.getTools() → fetch tools.json (800ms timeout).
   */
  function loadToolsForToolOfDay() {
    const fromGlobal = typeof window !== 'undefined' && window.__RYD_TOOLS && Array.isArray(window.__RYD_TOOLS);
    if (fromGlobal && window.__RYD_TOOLS.length > 0) {
      return Promise.resolve({ tools: window.__RYD_TOOLS, source: 'global' });
    }
    const fromRYD = window.RYD && typeof window.RYD.getTools === 'function';
    const mem = fromRYD ? window.RYD.getTools() : null;
    if (mem && Array.isArray(mem) && mem.length > 0) {
      return Promise.resolve({ tools: mem, source: 'memory' });
    }
    const ts = '?ts=' + Date.now();
    const urls = ['/data/tools.pass.json', '/data/tools.json'].map(function(u) { return u + ts; });
    const fetchWithTimeout = function(url, ms) {
      return Promise.race([
        fetch(url).then(function(res) {
          if (!res.ok || (res.headers.get('Content-Type') || '').toLowerCase().includes('text/html')) {
            return { ok: false };
          }
          return res.json().then(function(data) {
            return { ok: true, data: data };
          });
        }),
        new Promise(function(_, reject) {
          setTimeout(function() { reject(new Error('timeout')); }, ms);
        })
      ]);
    };
    function tryNext(i) {
      if (i >= urls.length) return Promise.resolve({ tools: [], source: 'fetch' });
      return fetchWithTimeout(urls[i], TOOL_OF_DAY_FETCH_MS).then(function(out) {
        if (out.ok && out.data) {
          const tools = parseToolsResponse(out.data);
          if (tools.length > 0) return { tools: tools, source: 'fetch' };
        }
        return tryNext(i + 1);
      }).catch(function() {
        return tryNext(i + 1);
      });
    }
    var loadPromise = tryNext(0);
    return Promise.race([
      loadPromise,
      new Promise(function(resolve) {
        setTimeout(function() { resolve({ tools: [], source: 'timeout' }); }, TOOL_OF_DAY_FETCH_MS);
      })
    ]);
  }

  /**
   * Show loading state in Tool-of-Day container (short message, no error)
   */
  function showToolOfDayLoading(message) {
    if (TOOL_OF_DAY_UI_DISABLED) return;
    const container = document.getElementById('tool-of-the-day') ||
                     document.getElementById('toolOfDay') ||
                     document.querySelector('[data-tool-of-day]') ||
                     document.querySelector('.tool-of-day');
    if (!container) return;
    setMinHeight(container, '200px');
    container.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'ryd-tod-loading';
    p.textContent = message || "Loading today's tool…";
    p.style.cssText = 'margin: 0; font-size: 1em; color: var(--color-text-secondary, #555);';
    container.appendChild(p);
  }

  /**
   * True if tool is a duration variant (5min, 15min, 30min) — exclude from Tool of the Day
   */
  function isVariantTool(tool) {
    if (!tool || typeof tool !== 'object') return false;
    const id = String(tool.id || tool.slug || '').toLowerCase();
    if (/5min|15min|30min|quick-reset|deep-work/.test(id)) return true;
    if (tool.variantOf) return true;
    const dur = tool.durationMinutes ?? parseInt(String(tool.duration || ''), 10);
    const hasVariantMarker = !!(tool.variantOf || tool.variantType || /quick-reset|deep-work|5min|15min|30min/.test(id));
    if ([5, 15, 30].includes(dur) && hasVariantMarker) return true;
    return false;
  }

  /**
   * Deterministic hash for date string (same day = same tool)
   */
  function hashDate(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  /**
   * Pick Tool of the Day: primary tools only, day-based rotation, manual override if config allows
   */
  function pickToolOfDayRotating(tools, config) {
    const eligibleTools = (tools || []).filter(t => !isVariantTool(t));
    if (eligibleTools.length === 0) return null;
    if (config && config.mode === 'manual' && config.manualToolId) {
      const manual = eligibleTools.find(t => (t.id || t.slug) === config.manualToolId);
      if (manual && !isVariantTool(manual)) return manual;
    }
    const dateStr = new Date().toISOString().slice(0, 10);
    const idx = hashDate(dateStr) % eligibleTools.length;
    return eligibleTools[idx] || eligibleTools[0];
  }

  /**
   * Minimal fallback tool when fetch times out or no tools available. Always render a real card.
   */
  function getFallbackTool() {
    return {
      title: 'Grounding Reset',
      name: 'Grounding Reset',
      slug: 'grounding-reset',
      id: 'grounding-reset',
      purpose: 'A quick reset when things feel like too much.',
      description: 'A quick reset when things feel like too much.',
      reset: { do: ['Find a quiet spot.', 'Take three slow breaths.', 'Name one thing you can see.'] }
    };
  }

  /**
   * Initialize Tool of the Day. Does NOT wait for MatrixExpander or ryd:ready.
   * Uses loadToolsForToolOfDay() only (800ms fetch timeout). Validation runs in requestIdleCallback.
   */
  function initToolOfTheDayNonBlocking() {
    if (toolOfDayFallbackTried) return;
    const start = performance.now();
    console.debug('[RYD] tool-of-day start (direct load, no Matrix wait)');

    showToolOfDayLoading("Loading today's tool…");

    loadToolsForToolOfDay().then(function(out) {
      if (toolOfDayFallbackTried) return;
      const tools = out && out.tools && Array.isArray(out.tools) ? out.tools : [];
      const source = (out && out.source) || '';

      let tool = null;
      let config = null;
      try {
        var cfgRes = window.__RYD_TOD_CONFIG;
        if (!cfgRes && typeof fetch !== 'undefined') {
          fetch('/config/tool-of-the-day.json?ts=' + Date.now()).then(function(r) { return r.ok ? r.json() : null; }).then(function(c) { window.__RYD_TOD_CONFIG = c; }).catch(function() {});
        }
        config = window.__RYD_TOD_CONFIG || null;
      } catch (_) {}

      if (tools.length > 0) {
        tool = pickToolOfDayRotating(tools, config);
      }
      if (!tool) {
        tool = getFallbackTool();
      }

      toolOfDayFallbackTried = true;
      renderToolOfDay(tool, { needsContent: false, reasons: [] });
      console.debug('[RYD] tool-of-day rendered in ' + Math.round(performance.now() - start) + 'ms (source: ' + source + ')');

      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(function() {
          try {
            var validator = window.RYD_ToolValidator;
            var allTools = tools.length > 0 ? tools : (window.RYD && window.RYD.getTools ? window.RYD.getTools() : []) || [];
            var result = validator && validator.validateToolQuality ? validator.validateToolQuality(tool, allTools) : { ok: true };
            if (!result.ok && result.reasons && result.reasons.length) {
              if (validator && validator.logValidationOnce) validator.logValidationOnce(tool.id || tool.slug, result.reasons);
              var container = document.getElementById('toolOfDay') || document.getElementById('tool-of-the-day') || document.querySelector('.tool-of-day');
              var titleRow = container && container.querySelector('.ryd-tod-title') && container.querySelector('.ryd-tod-title').parentElement;
              if (titleRow && !container.querySelector('.ryd-tod-badge-draft')) {
                var badge = document.createElement('span');
                badge.className = 'ryd-tod-badge-draft';
                badge.textContent = 'in progress';
                badge.setAttribute('aria-label', 'Content in progress');
                badge.style.cssText = 'font-size: 0.7em; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: var(--color-bg-secondary, #f0f0f0); color: var(--color-text-secondary, #666);';
                titleRow.appendChild(badge);
              }
            }
          } catch (_) {}
        }, { timeout: 2000 });
      }
    }).catch(function(err) {
      if (toolOfDayFallbackTried) return;
      toolOfDayFallbackTried = true;
      console.warn('[RYD] tool-of-day fetch failed, showing fallback card', err && err.message);
      renderToolOfDay(getFallbackTool(), { needsContent: false, reasons: [] });
    });
  }

  /**
   * Main bind function - non-blocking for Tool of the Day
   */
  function bind() {
    try {
      // Always bind search immediately (works even without matrix)
      bindSearch();
      
      // Tool of the Day auto-start disabled (feature kept; no auto-render on load)
      // initToolOfTheDayNonBlocking();
      
      // Hydrate insights if ready, otherwise wait
      if (window.RYD?.status === 'ready') {
        hydrateInsights();
      } else {
        // Listen for ready event to hydrate insights
        const readyHandler = () => {
          window.removeEventListener('ryd:ready', readyHandler);
          hydrateInsights();
        };
        window.addEventListener('ryd:ready', readyHandler);
      }
    } catch (bindError) {
      console.error('[RYD Bind] Bind error:', bindError);
      // Don't block - just log error
    }
  }

  // Bind on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();

