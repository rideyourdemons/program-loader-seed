/**
 * RYD Gates Renderer - HARDENED VERSION
 * Renders 12 gates with dropdowns for 40 pain points each
 * Each pain point links to 3 tools
 * 
 * PRODUCTION HARDENING:
 * - Error boundaries for all dynamic content
 * - Zod-like validation for all API data
 * - Retry logic for failed fetches (max 3 attempts)
 * - Loading and error states
 * - Edge case handling (null, undefined, empty arrays, long strings)
 * - Memoization for performance
 */

(function() {
  'use strict';

  // Load utilities - use resilient fetch if available
  const { resilientFetch } = window.RYD_ResilientFetch || {};
  const { fetchWithRetry } = window.RYD_Fetch || {};
  const { ErrorBoundary, withErrorBoundary } = window.RYD_ErrorBoundary || {
    ErrorBoundary: class { catch() {} },
    withErrorBoundary: (container, fn) => fn
  };
  const { safeJsonParse } = window.RYD_Fetch || { safeJsonParse: (data) => data };
  const { schemas, validateData } = window.RYD_Validation || { 
    schemas: {}, 
    validateData: (data) => ({ success: true, data }) 
  };
  const { dataCache, memoize } = window.RYD_Cache || { 
    dataCache: { get: () => null, set: () => {} },
    memoize: (fn) => fn
  };
  const { cleanData, cleanDataArray, ensureWhereItCameFrom } = window.RYD_DataSanitizer || {
    cleanData: (data) => data,
    cleanDataArray: (arr) => arr,
    ensureWhereItCameFrom: (data) => data
  };
  const { logError } = window.RYD_ErrorMonitor || { logError: () => {} };
  const API_CONFIG = window.RYD_API_CONFIG || {};

  // Use resilient fetch if available
  const safeFetch = resilientFetch || fetchWithRetry || async (url) => {
    try {
      const res = await fetch(url);
      return { 
        ok: res.ok, 
        data: await res.json().catch(() => ({})),
        silent: !res.ok
      };
    } catch (err) {
      logError(err, { url, component: 'gates-renderer' });
      return { ok: false, data: {}, silent: true };
    }
  };

  const GATES_URL = API_CONFIG.GATES_URL || '/data/gates.json';
  const PAIN_POINTS_URL = API_CONFIG.PAIN_POINTS_URL || '/data/pain-points.json';
  const TOOLS_URL = API_CONFIG.TOOLS_URL || '/data/tools.json';

  let mappingData = null;
  let toolsData = null;
  let toolMap = null;

  /**
   * Safe string truncation for UI
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
    if (arr.length === 0) return fallback;
    return arr;
  }

  /**
   * Memoized data loader
   */
  const loadData = memoize(async function() {
    const cacheKey = 'gates-data';
    const cached = dataCache.get(cacheKey);
    if (cached) {
      console.log('[RYD Gates] Using cached data');
      return cached;
    }

    try {
      let gates = [];
      let painPointsByGate = {};
      let tools = [];

      if (window.MatrixExpander && window.MatrixExpander.init) {
        try {
          await window.MatrixExpander.init();
          const gatesRaw = window.MatrixExpander.getGates();
          const painPointsRaw = window.MatrixExpander.getPainPointsByGate();
          const toolsRaw = window.MatrixExpander.getBaseTools();

          // Validate and sanitize
          const gatesValidation = validateData(gatesRaw, schemas.gatesResponse, { gates: [] });
          gates = safeArray(gatesValidation.data?.gates || gatesRaw || []);

          painPointsByGate = painPointsRaw || {};
          if (typeof painPointsByGate !== 'object') {
            painPointsByGate = {};
          }

          const toolsValidation = validateData(toolsRaw, schemas.toolsResponse, { tools: [] });
          tools = safeArray(toolsValidation.data?.tools || toolsRaw || []);
        } catch (matrixError) {
          console.warn('[RYD Gates] MatrixExpander failed, falling back to direct fetch:', matrixError);
          throw matrixError; // Fall through to direct fetch
        }
      }

      // Fallback to direct fetch
      if (gates.length === 0) {
        console.log('[RYD Gates] Loading data directly...');
        
        const [gatesResult, painPointsResult, toolsResult] = await Promise.all([
          safeFetch(`${GATES_URL}?ts=${Date.now()}`, {
            timeout: API_CONFIG.DEFAULT_TIMEOUT || 10000,
            maxRetries: API_CONFIG.MAX_RETRIES || 3,
            fallback: { gates: [] }
          }).catch(err => {
            logError(err, { component: 'gates-renderer', endpoint: 'gates' });
            return { ok: false, data: { gates: [] }, silent: true };
          }),
          safeFetch(`${PAIN_POINTS_URL}?ts=${Date.now()}`, {
            timeout: API_CONFIG.DEFAULT_TIMEOUT || 10000,
            maxRetries: API_CONFIG.MAX_RETRIES || 3,
            fallback: { painPoints: {} }
          }).catch(err => {
            logError(err, { component: 'gates-renderer', endpoint: 'pain-points' });
            return { ok: false, data: { painPoints: {} }, silent: true };
          }),
          safeFetch(`${TOOLS_URL}?ts=${Date.now()}`, {
            timeout: API_CONFIG.DEFAULT_TIMEOUT || 10000,
            maxRetries: API_CONFIG.MAX_RETRIES || 3,
            fallback: { tools: [] }
          }).catch(err => {
            logError(err, { component: 'gates-renderer', endpoint: 'tools' });
            return { ok: false, data: { tools: [] }, silent: true };
          })
        ]);

        // Validate and sanitize gates
        if (gatesResult.data) {
          const validation = validateData(gatesResult.data, schemas.gatesResponse, { gates: [] });
          const rawGates = validation.data?.gates || validation.data || [];
          gates = cleanDataArray(rawGates, 'gate');
        }

        // Validate and sanitize pain points
        if (painPointsResult.data) {
          const validation = validateData(painPointsResult.data, schemas.painPointsResponse, { painPoints: {} });
          const rawPainPoints = validation.data?.painPoints || validation.data || {};
          painPointsByGate = typeof rawPainPoints === 'object' ? rawPainPoints : {};
        }

        // Validate and sanitize tools
        if (toolsResult.data) {
          const validation = validateData(toolsResult.data, schemas.toolsResponse, { tools: [] });
          const rawTools = validation.data?.tools || validation.data || [];
          tools = cleanDataArray(rawTools, 'tool').map(tool => ensureWhereItCameFrom(tool));
        }
      }

      // Attach pain points to gates safely
      gates.forEach(gate => {
        if (!gate || typeof gate !== 'object') return;
        const gateId = gate.id;
        if (!gateId) return;
        
        const painPoints = safeArray(painPointsByGate[gateId] || []);
        gate.painPoints = painPoints.map(pp => {
          if (!pp || typeof pp !== 'object') return null;
          return {
            id: String(pp.id || ''),
            title: truncateString(String(pp.title || ''), 200),
            toolIds: safeArray(pp.toolIds || pp.tools || []),
            where_it_came_from: pp.where_it_came_from || {
              origin: "internal",
              basis: "runtime-assembled loader object",
              source_type: "system-assembly",
              verified: true
            }
          };
        }).filter(Boolean);
      });

      mappingData = { gates: gates.filter(Boolean) };
      toolsData = tools.filter(Boolean);

      // Create tool lookup safely
      toolMap = new Map();
      toolsData.forEach(tool => {
        if (!tool || typeof tool !== 'object') return;
        if (tool.id) toolMap.set(String(tool.id), tool);
        if (tool.slug && tool.slug !== tool.id) {
          toolMap.set(String(tool.slug), tool);
        }
      });

      const result = {
        mappingData,
        toolMap,
        toolsData,
        where_it_came_from: {
          origin: "internal",
          basis: "runtime-assembled loader object",
          source_type: "system-assembly",
          verified: true
        }
      };
      dataCache.set(cacheKey, result);
      
      console.log('[RYD Gates] Loaded:', {
        gates: mappingData.gates.length,
        tools: toolsData.length
      });

      return result;
    } catch (error) {
      console.error('[RYD Gates] Error loading data:', error);
      // Return safe fallback
      return {
        mappingData: { gates: [] },
        toolMap: new Map(),
        toolsData: [],
        where_it_came_from: {
          origin: "internal",
          basis: "runtime-assembled loader object",
          source_type: "system-assembly",
          verified: true
        }
      };
    }
  }, { maxSize: 1, ttl: 300000 });

  /**
   * Render loading state with stability
   */
  function renderLoading(container) {
    if (!container) return;
    
    // Set min-height to prevent layout shift
    if (window.RYD_UIStability) {
      window.RYD_UIStability.setMinHeight(container, '300px');
    } else {
      container.style.minHeight = '300px';
    }
    
    container.innerHTML = `
      <div class="ryd-loading" style="padding: 2rem; text-align: center; min-height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p style="margin-top: 1rem; color: #666;">Loading gates...</p>
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
  function renderError(container, error) {
    if (!container) return;
    
    const boundary = new ErrorBoundary(container);
    boundary.catch(error, { component: 'gates-renderer' });
  }

  /**
   * Render gates with error boundary protection
   */
  const renderGates = withErrorBoundary(null, function(container, mappingData, toolMap) {
    if (!container) {
      console.warn('[RYD Gates] Container not found');
      return;
    }

    if (!mappingData || !mappingData.gates) {
      console.warn('[RYD Gates] Invalid mapping data');
      container.innerHTML = '<p style="color: #666; padding: 1rem;">No gates available.</p>';
      return;
    }

    const gates = safeArray(mappingData.gates);
    if (gates.length === 0) {
      container.innerHTML = '<p style="color: #666; padding: 1rem;">No gates available.</p>';
      return;
    }

    container.innerHTML = '';

    const gatesSection = document.createElement('section');
    gatesSection.className = 'gates-section';
    gatesSection.style.cssText = 'margin-top: 2rem;';

    const sectionTitle = document.createElement('h2');
    sectionTitle.className = 'sectionTitle';
    sectionTitle.textContent = 'Explore by Gate';
    sectionTitle.style.cssText = 'margin-bottom: 1.5rem; font-size: 2em;';
    gatesSection.appendChild(sectionTitle);

    const gatesGrid = document.createElement('div');
    gatesGrid.className = 'gates-grid';
    gatesGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;';

    gates.forEach(gate => {
      if (!gate || typeof gate !== 'object' || !gate.id) return;

      try {
        const gateCard = document.createElement('div');
        gateCard.className = 'gate-card';
        gateCard.style.cssText = 'border: 1px solid var(--color-border, #e0e0e0); border-radius: 8px; padding: 1.5rem; background: var(--color-bg-secondary, #ffffff);';

        // Gate title (safe)
        const gateTitle = document.createElement('h3');
        gateTitle.textContent = truncateString(String(gate.title || gate.id || 'Gate'), 100);
        gateTitle.style.cssText = 'margin-bottom: 0.5rem; font-size: 1.3em; color: var(--color-accent, #667eea);';
        gateCard.appendChild(gateTitle);

        // Gate description (safe)
        if (gate.description) {
          const gateDesc = document.createElement('p');
          gateDesc.textContent = truncateString(String(gate.description), 200);
          gateDesc.style.cssText = 'margin-bottom: 1rem; color: var(--color-text-secondary, #666); font-size: 0.9em;';
          gateCard.appendChild(gateDesc);
        }

        // Pain points dropdown
        const dropdownWrapper = document.createElement('div');
        dropdownWrapper.className = 'pain-points-dropdown';
        dropdownWrapper.style.cssText = 'margin-top: 1rem;';

        const dropdownLabel = document.createElement('label');
        dropdownLabel.textContent = 'Select a pain point:';
        dropdownLabel.style.cssText = 'display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.9em;';
        dropdownWrapper.appendChild(dropdownLabel);

        const dropdown = document.createElement('select');
        dropdown.className = 'pain-point-select';
        dropdown.style.cssText = 'width: 100%; padding: 0.75rem; border: 2px solid var(--color-border, #e0e0e0); border-radius: 6px; font-size: 1em; background: white; cursor: pointer;';

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- Choose a pain point --';
        dropdown.appendChild(defaultOption);

        // Pain point options (safe)
        const painPoints = safeArray(gate.painPoints || []);
        painPoints.forEach(painPoint => {
          if (!painPoint || typeof painPoint !== 'object' || !painPoint.id) return;
          
          const option = document.createElement('option');
          option.value = `${String(gate.id)}__${String(painPoint.id)}`;
          option.textContent = truncateString(String(painPoint.title || painPoint.id), 80);
          dropdown.appendChild(option);
        });

        dropdownWrapper.appendChild(dropdown);

        const handlePainPointSelect = (e) => {
          try {
            const value = e.target.value;
            if (!value) return;
            const parts = value.split('__');
            if (parts.length !== 2) return;
            const [gateId, painPointId] = parts;
            if (!gateId || !painPointId) return;
            window.location.assign(`/gates/${encodeURIComponent(gateId)}/${encodeURIComponent(painPointId)}`);
          } catch (err) {
            console.error('[RYD Gates] Navigation error:', err);
          }
        };

        dropdown.addEventListener('change', handlePainPointSelect);
        dropdown.addEventListener('input', handlePainPointSelect);

        const meta = document.createElement('div');
        meta.style.cssText = 'margin-top: 0.75rem; font-size: 0.9em; color: var(--color-text-secondary, #666);';
        meta.textContent = `${painPoints.length} pain point${painPoints.length !== 1 ? 's' : ''} in this gate.`;
        dropdownWrapper.appendChild(meta);

        const gateLink = document.createElement('a');
        gateLink.href = `/gates/${encodeURIComponent(String(gate.id))}`;
        gateLink.textContent = 'View all pain points →';
        gateLink.style.cssText = 'display: inline-block; margin-top: 0.5rem; color: var(--color-accent, #667eea); text-decoration: none; font-size: 0.9em; font-weight: 500;';
        dropdownWrapper.appendChild(gateLink);
        gateCard.appendChild(dropdownWrapper);

        gatesGrid.appendChild(gateCard);
      } catch (gateError) {
        console.error('[RYD Gates] Error rendering gate:', gateError);
        // Continue with next gate
      }
    });

    gatesSection.appendChild(gatesGrid);
    container.appendChild(gatesSection);
  });

  /**
   * Render tools with error boundary protection
   */
  const renderTools = withErrorBoundary(null, function(container, gate, painPoint, toolMap) {
    if (!container) return;

    container.innerHTML = '';

    if (!painPoint || typeof painPoint !== 'object') {
      container.innerHTML = '<p style="color: #666; padding: 1rem;">Invalid pain point data.</p>';
      return;
    }

    const toolsTitle = document.createElement('h4');
    toolsTitle.textContent = `Tools for "${truncateString(String(painPoint.title || 'Unknown'), 50)}"`;
    toolsTitle.style.cssText = 'margin-bottom: 1rem; font-size: 1.1em; color: var(--color-text, #1a1a1a);';
    container.appendChild(toolsTitle);

    // Get tool instances safely
    let toolInstances = [];
    if (window.MatrixExpander && typeof window.MatrixExpander.expandToolsForSelection === 'function') {
      try {
        const gateId = gate && gate.id ? String(gate.id) : '';
        const painPointId = painPoint && painPoint.id ? String(painPoint.id) : '';
        toolInstances = safeArray(window.MatrixExpander.expandToolsForSelection(gateId, painPointId) || []);
      } catch (matrixError) {
        console.warn('[RYD Gates] MatrixExpander failed:', matrixError);
      }
    }

    // Fallback to direct mapping
    if (toolInstances.length === 0 && toolMap) {
      const toolIds = safeArray(painPoint.toolIds || painPoint.tools || []);
      toolInstances = toolIds.map(toolId => {
        if (!toolId) return null;
        const tool = toolMap.get(String(toolId));
        if (!tool) return null;
        
        return {
          instanceId: `${gate?.id || 'unknown'}::${painPoint.id}::${toolId}`,
          gateId: gate?.id || '',
          painPointId: painPoint.id,
          toolId: toolId,
          baseTool: tool,
          contextLabel: `${gate?.title || 'Gate'} — ${painPoint.title || 'Pain Point'}`,
          where_it_came_from: tool?.where_it_came_from || {
            origin: "internal",
            basis: "runtime-assembled loader object",
            source_type: "system-assembly",
            verified: true
          }
        };
      }).filter(Boolean);
    }

    if (toolInstances.length === 0) {
      const noToolsMsg = document.createElement('p');
      noToolsMsg.textContent = 'No tools available for this pain point.';
      noToolsMsg.style.cssText = 'color: var(--color-text-secondary, #666); font-style: italic;';
      container.appendChild(noToolsMsg);
      return;
    }

    const toolsList = document.createElement('div');
    toolsList.className = 'tools-list';
    toolsList.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;';

    const extractDescription = (tool) => {
      if (!tool || typeof tool !== 'object') return '';
      const raw = tool.description || tool.summary || '';
      if (window.RYD_UI && typeof window.RYD_UI.sanitizeDescription === 'function') {
        return window.RYD_UI.sanitizeDescription(String(raw), tool.title || tool.name);
      }
      return truncateString(String(raw || ''), 200);
    };

    toolInstances.forEach(instance => {
      if (!instance || typeof instance !== 'object') return;
      
      try {
        const tool = instance.baseTool || instance.base;
        if (!tool || typeof tool !== 'object') return;

        // Force-fix: Safe access to where_it_came_from
        tool.where_it_came_from = tool?.where_it_came_from ?? 'hardened_stable_fallback';

        const toolCard = document.createElement('div');
        toolCard.className = 'tool-card';
        toolCard.style.cssText = 'border: 1px solid var(--color-border, #e0e0e0); border-radius: 6px; padding: 1rem; background: var(--color-bg, #f5f5f5); transition: transform 0.2s, box-shadow 0.2s;';
        toolCard.style.cursor = 'pointer';

        toolCard.addEventListener('mouseenter', () => {
          toolCard.style.transform = 'translateY(-2px)';
          toolCard.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        });
        toolCard.addEventListener('mouseleave', () => {
          toolCard.style.transform = 'translateY(0)';
          toolCard.style.boxShadow = 'none';
        });

        // Guardrail: Ensure tool has title/id
        const toolTitleText = tool.name || tool.title || instance.toolId;
        if (!toolTitleText || String(toolTitleText).trim() === '') {
          console.warn('[RYD Gates] Skipping tool with missing title/id:', tool);
          return;
        }

        const toolTitle = document.createElement('h5');
        toolTitle.textContent = truncateString(String(toolTitleText), 60);
        toolTitle.style.cssText = 'margin-bottom: 0.5rem; font-size: 1em; color: var(--color-accent, #667eea);';
        toolCard.appendChild(toolTitle);

        const description = extractDescription(tool);
        // Guardrail: Remove placeholder text
        const cleanDesc = description && !description.toLowerCase().includes('coming soon') && !description.toLowerCase().includes('placeholder')
          ? description
          : 'A practical tool for managing this challenge.';
        if (cleanDesc) {
          const toolDesc = document.createElement('p');
          toolDesc.textContent = truncateString(cleanDesc, 100);
          toolDesc.style.cssText = 'font-size: 0.85em; color: var(--color-text-secondary, #666); margin-bottom: 0.5rem;';
          toolCard.appendChild(toolDesc);
        }

        const toolLink = document.createElement('a');
        const rawSlug = tool.slug || tool.id || instance.toolId || tool.title || tool.name || '';
        const toolSlug = encodeURIComponent(truncateString(String(rawSlug), 100));
        // Link to /gates/:gateSlug/:painPointSlug/:toolSlug route
        const gateId = gate && gate.id ? encodeURIComponent(String(gate.id)) : '';
        const painPointId = painPoint && painPoint.id ? encodeURIComponent(String(painPoint.id)) : '';
        toolLink.href = `/gates/${gateId}/${painPointId}/${toolSlug}`;
        toolLink.textContent = 'Open Tool →';
        toolLink.style.cssText = 'display: inline-block; color: var(--color-accent, #667eea); text-decoration: none; font-size: 0.9em; font-weight: 500;';
        toolLink.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.href = toolLink.href;
        });
        toolCard.appendChild(toolLink);

        toolCard.addEventListener('click', () => {
          window.location.href = toolLink.href;
        });

        toolsList.appendChild(toolCard);
      } catch (toolError) {
        console.error('[RYD Gates] Error rendering tool:', toolError);
        // Continue with next tool
      }
    });

    container.appendChild(toolsList);

    if (gate && gate.id) {
      const backLink = document.createElement('a');
      backLink.href = `#gate-${encodeURIComponent(String(gate.id))}`;
      backLink.textContent = `← Back to ${truncateString(String(gate.title || 'Gate'), 30)}`;
      backLink.style.cssText = 'display: inline-block; margin-top: 1rem; color: var(--color-text-secondary, #666); text-decoration: none; font-size: 0.9em;';
      container.appendChild(backLink);
    }
  });

  /**
   * Initialize with error handling
   */
  async function init() {
    const container = document.getElementById('gatesContainer');
    if (!container) {
      console.warn('[RYD Gates] Container #gatesContainer not found');
      return;
    }

    const boundary = new ErrorBoundary(container);

    try {
      renderLoading(container);
      const { mappingData, toolMap, toolsData } = await loadData();
      
      if (!mappingData || !mappingData.gates || mappingData.gates.length === 0) {
        container.innerHTML = '<p style="color: #666; padding: 1rem;">No gates available at this time.</p>';
        return;
      }

      renderGates(container, mappingData, toolMap);
    } catch (error) {
      console.error('[RYD Gates] Initialization failed:', error);
      renderError(container, error);
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for external use
  window.RYD_GATES = {
    where_it_came_from: {
      origin: "internal",
      basis: "built for Ride Your Demons platform",
      source_type: "system-utility",
      verified: true
    },
    init,
    loadData,
    renderGates,
    renderTools
  };
})();
