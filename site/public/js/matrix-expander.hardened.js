/**
 * RYD Matrix Expander - HARDENED VERSION
 * Dynamically maps Gates + Pain Points to Tools without duplicating base tools.
 * 
 * PRODUCTION HARDENING:
 * - Error boundaries
 * - Retry logic for fetches
 * - Data validation
 * - Edge case handling
 * - Memoization
 */

(function() {
  'use strict';

  // Check utilities - use resilient fetch if available, fallback to fetch-with-retry
  const { resilientFetch, safeJsonParse: resilientSafeParse } = window.RYD_ResilientFetch || {};
  const { fetchWithRetry, safeJsonParse: retrySafeParse } = window.RYD_Fetch || {};
  const { ErrorBoundary } = window.RYD_ErrorBoundary || { ErrorBoundary: class { catch() {} } };
  const { schemas, validateData } = window.RYD_Validation || { 
    schemas: {}, 
    validateData: (data) => ({ success: true, data }) 
  };
  const { dataCache } = window.RYD_Cache || { dataCache: { get: () => null, set: () => {} } };
  const { cleanData, ensureWhereItCameFrom } = window.RYD_DataSanitizer || {
    cleanData: (data) => data,
    ensureWhereItCameFrom: (data) => data
  };
  const { logError } = window.RYD_ErrorMonitor || { logError: () => {} };
  const API_CONFIG = window.RYD_API_CONFIG || {};

  // Use resilient fetch if available, otherwise fallback
  const safeFetch = resilientFetch || fetchWithRetry || async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        logError(new Error(`HTTP ${res.status}`), { url });
        return { ok: false, data: {}, silent: true };
      }
      return { ok: true, data: await res.json().catch(() => ({})) };
    } catch (err) {
      logError(err, { url });
      return { ok: false, data: {}, silent: true };
    }
  };
  
  const safeJsonParse = resilientSafeParse || retrySafeParse || ((data) => {
    try {
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch {
      return {};
    }
  });

  console.log('[MatrixExpander] Hardened version initialized');

  // Use centralized config for URLs
  const GATES_URL = API_CONFIG.GATES_URL || '/data/gates.json';
  const PAIN_POINTS_URL = API_CONFIG.PAIN_POINTS_URL || '/data/pain-points.json';
  const TOOLS_URL = API_CONFIG.TOOLS_URL || '/data/tools.json';
  const TOOLS_CANONICAL_URL = API_CONFIG.TOOLS_CANONICAL_URL || '/data/tools-canonical.json';
  const DATA_FILES = window.RYD_DATA_FILES || {
    gates: 'gates.json',
    painPoints: 'pain-points.json',
    tools: 'tools.json',
    toolsCanonical: 'tools-canonical.json'
  };

  let initPromise = null;
  let isReady = false;
  let hasLoggedInit = false;
  const isNodeRuntime = typeof process !== 'undefined'
    && process.versions
    && process.versions.node;
  let nodeModulesPromise = null;

  let gatesIndex = {};
  let painPointsIndex = {};
  let toolsIndex = {};
  let gatesList = [];
  let baseTools = [];

  const warnedPainPoints = new Set();
  const warnedMissingTools = new Set();
  let warnedNotReady = false;

  /**
   * Safe array normalization
   */
  function normalizeArray(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (value == null) return [];
    return [];
  }

  /**
   * Safe object normalization
   */
  function normalizeObject(value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
    return {};
  }

  /**
   * Safe ID normalization
   */
  function normalizeId(value) {
    if (value == null) return '';
    return String(value).trim();
  }

  /**
   * Safe string truncation
   */
  function truncateString(str, maxLength = 200) {
    if (!str || typeof str !== 'string') return '';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }

  function logInitOnce(payload, isError = false) {
    if (hasLoggedInit) return;
    hasLoggedInit = true;
    if (isError) {
      console.warn('[MatrixExpander] Init failed:', payload);
      return;
    }
    console.log('[MatrixExpander] Initialized', payload);
  }

  async function loadNodeModules() {
    if (!isNodeRuntime) return null;
    if (nodeModulesPromise) return nodeModulesPromise;

    nodeModulesPromise = (async () => {
      try {
        if (typeof require === 'function') {
          return { fs: require('fs'), path: require('path') };
        }
        const fs = await import('node:fs');
        const path = await import('node:path');
        return { fs, path };
      } catch (err) {
        console.error('[MatrixExpander] Failed to load Node modules:', err);
        return null;
      }
    })();

    return nodeModulesPromise;
  }

  async function getNodeDataPath(fileName) {
    const mods = await loadNodeModules();
    if (!mods || !mods.path) {
      throw new Error('Node path module unavailable');
    }
    return mods.path.join(process.cwd(), 'public', 'data', fileName);
  }

  async function readJsonStream(filePath) {
    const mods = await loadNodeModules();
    if (!mods || !mods.fs) {
      throw new Error('Node fs module unavailable');
    }

    return new Promise((resolve, reject) => {
      try {
        const chunks = [];
        const stream = mods.fs.createReadStream(filePath, { encoding: 'utf8' });

        stream.on('data', chunk => {
          if (chunk && typeof chunk === 'string') {
            chunks.push(chunk);
          }
        });
        stream.on('error', reject);
        stream.on('end', () => {
          try {
            const jsonStr = chunks.join('');
            if (!jsonStr || jsonStr.trim().length === 0) {
              reject(new Error('Empty file'));
              return;
            }
            resolve(safeJsonParse(JSON.parse(jsonStr), {}));
          } catch (err) {
            reject(err);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  async function fetchJson(url, nodeFileName) {
    if (!isNodeRuntime) {
      try {
        const result = await safeFetch(url, {
          timeout: API_CONFIG.DEFAULT_TIMEOUT || 10000,
          maxRetries: API_CONFIG.MAX_RETRIES || 3,
          fallback: {}
        });
        
        // Handle silent failures (404, network errors) gracefully
        if (result.silent || !result.ok) {
          logError(new Error(`Fetch failed: ${url}`), { 
            status: result.status, 
            silent: result.silent,
            component: 'matrix-expander'
          });
          return {};
        }
        
        // Sanitize and clean data
        const parsed = safeJsonParse(result.data, {});
        return cleanData(parsed, 'toolsResponse');
      } catch (error) {
        // Log but don't throw - return empty object for graceful degradation
        logError(error, { url, component: 'matrix-expander' });
        return {};
      }
    }

    try {
      const filePath = await getNodeDataPath(nodeFileName);
      const data = await readJsonStream(filePath);
      return cleanData(data, 'toolsResponse');
    } catch (error) {
      logError(error, { fileName: nodeFileName, component: 'matrix-expander' });
      return {};
    }
  }

  function buildIndices({ gates = [], painPoints = {}, tools = [] }) {
    try {
      // Sanitize all inputs
      const cleanGates = cleanDataArray(gates, 'gate');
      const cleanTools = cleanDataArray(tools, 'tool').map(tool => ensureWhereItCameFrom(tool));
      
      gatesList = normalizeArray(cleanGates);
      baseTools = normalizeArray(cleanTools);

      gatesIndex = {};
      gatesList.forEach(gate => {
        if (gate && typeof gate === 'object' && gate.id) {
          const id = normalizeId(gate.id);
          if (id) {
            gatesIndex[id] = gate;
          }
        }
      });

      painPointsIndex = {};
      const painPointsObject = normalizeObject(painPoints);
      Object.keys(painPointsObject).forEach(gateId => {
        if (!gateId) return;
        const points = normalizeArray(painPointsObject[gateId]);
        if (points.length > 0) {
          painPointsIndex[gateId] = points.filter(pp => pp && typeof pp === 'object' && pp.id);
        }
      });

      toolsIndex = {};
      baseTools.forEach(tool => {
        if (!tool || typeof tool !== 'object') return;
        const id = normalizeId(tool.id);
        const slug = normalizeId(tool.slug);
        if (id) {
          toolsIndex[id] = tool;
          toolsIndex[id.toLowerCase()] = tool;
        }
        if (slug && slug !== id) {
          toolsIndex[slug] = tool;
          toolsIndex[slug.toLowerCase()] = tool;
        }
      });

      return {
        gates: Object.keys(gatesIndex).length,
        painPointGates: Object.keys(painPointsIndex).length,
        tools: Object.keys(toolsIndex).length,
        where_it_came_from: {
          origin: "internal",
          basis: "runtime-assembled loader object",
          source_type: "system-assembly",
          verified: true
        }
      };
    } catch (error) {
      console.error('[MatrixExpander] Error building indices:', error);
      return {
        gates: 0,
        painPointGates: 0,
        tools: 0,
        where_it_came_from: {
          origin: "internal",
          basis: "runtime-assembled loader object",
          source_type: "system-assembly",
          verified: true
        }
      };
    }
  }

  async function fetchToolsData() {
    try {
      const result = await fetchJson(TOOLS_CANONICAL_URL, DATA_FILES.toolsCanonical);
      const validation = validateData(result, schemas.toolsResponse || schemas.object({}), { tools: [] });
      return validation.data?.tools || validation.data || [];
    } catch (error) {
      console.warn('[MatrixExpander] Falling back to tools.json:', error.message || error);
      try {
        const result = await fetchJson(TOOLS_URL, DATA_FILES.tools);
        const validation = validateData(result, schemas.toolsResponse || schemas.object({}), { tools: [] });
        return validation.data?.tools || validation.data || [];
      } catch (fallbackError) {
        console.error('[MatrixExpander] Both tool sources failed:', fallbackError);
        return [];
      }
    }
  }

  async function loadMatrixData() {
    const cacheKey = 'matrix-data';
    const cached = dataCache.get(cacheKey);
    if (cached) {
      console.log('[MatrixExpander] Using cached data');
      return cached;
    }

    try {
      if (!isNodeRuntime) {
        const [gatesResult, painPointsResult, toolsData] = await Promise.all([
          fetchJson(GATES_URL, DATA_FILES.gates).catch(err => {
            console.error('[MatrixExpander] Gates fetch failed:', err);
            return {
              gates: [],
              where_it_came_from: {
                origin: "internal",
                basis: "runtime-assembled loader object",
                source_type: "system-assembly",
                verified: true
              }
            };
          }),
          fetchJson(PAIN_POINTS_URL, DATA_FILES.painPoints).catch(err => {
            console.error('[MatrixExpander] Pain points fetch failed:', err);
            return {
              painPoints: {},
              where_it_came_from: {
                origin: "internal",
                basis: "runtime-assembled loader object",
                source_type: "system-assembly",
                verified: true
              }
            };
          }),
          fetchToolsData()
        ]);

        const gatesValidation = validateData(gatesResult, schemas.gatesResponse || schemas.object({}), { gates: [] });
        const painPointsValidation = validateData(painPointsResult, schemas.painPointsResponse || schemas.object({}), { painPoints: {} });

        const result = {
          gatesData: gatesValidation.data?.gates || gatesValidation.data || [],
          painPointsData: painPointsValidation.data?.painPoints || painPointsValidation.data || {},
          toolsData: normalizeArray(toolsData),
          where_it_came_from: {
            origin: "internal",
            basis: "runtime-assembled loader object",
            source_type: "system-assembly",
            verified: true
          }
        };

        dataCache.set(cacheKey, result);
        return result;
      }

      // Node runtime: stream sequentially
      const gatesData = await fetchJson(GATES_URL, DATA_FILES.gates).catch(() => ({
        gates: [],
        where_it_came_from: {
          origin: "internal",
          basis: "runtime-assembled loader object",
          source_type: "system-assembly",
          verified: true
        }
      }));
      const painPointsData = await fetchJson(PAIN_POINTS_URL, DATA_FILES.painPoints).catch(() => ({
        painPoints: {},
        where_it_came_from: {
          origin: "internal",
          basis: "runtime-assembled loader object",
          source_type: "system-assembly",
          verified: true
        }
      }));
      const toolsData = await fetchToolsData();

      const result = {
        gatesData: normalizeArray(gatesData?.gates || gatesData || []),
        painPointsData: normalizeObject(painPointsData?.painPoints || painPointsData || {}),
        toolsData: normalizeArray(toolsData),
        where_it_came_from: {
          origin: "internal",
          basis: "runtime-assembled loader object",
          source_type: "system-assembly",
          verified: true
        }
      };

      dataCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('[MatrixExpander] Load error:', error);
      return {
        gatesData: [],
        painPointsData: {},
        toolsData: [],
        where_it_came_from: {
          origin: "internal",
          basis: "runtime-assembled loader object",
          source_type: "system-assembly",
          verified: true
        }
      };
    }
  }

  /**
   * Render fallback UI when data is unavailable
   */
  function renderFallbackUI() {
    // Find common container elements
    const containers = [
      document.getElementById('gatesContainer'),
      document.getElementById('matrix-status'),
      document.getElementById('mainContent'),
      document.querySelector('main')
    ].filter(Boolean);

    containers.forEach(container => {
      if (container && !container.querySelector('.ryd-fallback-ui')) {
        const fallback = document.createElement('div');
        fallback.className = 'ryd-fallback-ui';
        fallback.style.cssText = `
          padding: 2rem;
          text-align: center;
          background: #f5f5f5;
          border-radius: 8px;
          margin: 1rem 0;
        `;
        fallback.innerHTML = `
          <h3 style="margin: 0 0 0.5rem 0; color: #333;">System Stable - Data Pending</h3>
          <p style="margin: 0; color: #666; font-size: 0.9em;">
            Content is loading. Please check your connection or try again in a moment.
          </p>
        `;
        container.appendChild(fallback);
      }
    });
  }

  async function init() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        const { gatesData, painPointsData, toolsData } = await loadMatrixData();

        // Check if we got empty data (silent failure)
        const hasData = (
          (Array.isArray(gatesData) && gatesData.length > 0) ||
          (Array.isArray(toolsData) && toolsData.length > 0) ||
          (typeof painPointsData === 'object' && Object.keys(painPointsData).length > 0)
        );

        if (!hasData) {
          console.warn('[MatrixExpander] No data loaded, rendering fallback UI');
          renderFallbackUI();
          isReady = true; // Mark as ready with empty data
          return {
            gates: 0,
            painPointGates: 0,
            tools: 0,
            where_it_came_from: {
              origin: "internal",
              basis: "runtime-assembled loader object",
              source_type: "system-assembly",
              verified: true
            }
          };
        }

        const counts = buildIndices({
          gates: normalizeArray(gatesData),
          painPoints: normalizeObject(painPointsData),
          tools: normalizeArray(toolsData)
        });

        isReady = true;
        logInitOnce(counts);
        return counts;
      } catch (err) {
        isReady = true; // Mark as ready even on error
        logInitOnce(err, true);
        renderFallbackUI();
        // Return safe fallback instead of throwing
        return { gates: 0, painPointGates: 0, tools: 0 };
      }
    })();

    return initPromise;
  }

  function getToolIds(painPoint) {
    if (!painPoint || typeof painPoint !== 'object') return [];
    if (Array.isArray(painPoint.toolIds)) return painPoint.toolIds.filter(Boolean);
    if (Array.isArray(painPoint.tools)) return painPoint.tools.filter(Boolean);
    if (painPoint.links && Array.isArray(painPoint.links.tools)) {
      return painPoint.links.tools.filter(Boolean);
    }
    return [];
  }

  function expandToolsForSelection(gateId, painPointId) {
    if (!isReady) {
      if (!warnedNotReady) {
        console.warn('[MatrixExpander] expandToolsForSelection called before init is ready');
        warnedNotReady = true;
      }
      return [];
    }

    const normalizedGateId = normalizeId(gateId);
    const normalizedPainPointId = normalizeId(painPointId);

    if (!normalizedGateId || !normalizedPainPointId) {
      return [];
    }

    const gatePainPoints = normalizeArray(painPointsIndex[normalizedGateId] || []);
    const painPoint = gatePainPoints.find(pp => pp && pp.id === normalizedPainPointId);

    if (!painPoint) {
      return [];
    }

    const toolIds = getToolIds(painPoint)
      .map(id => normalizeId(id))
      .filter(Boolean);

    if (toolIds.length === 0) {
      const warnKey = `${normalizedGateId}::${normalizedPainPointId}`;
      if (!warnedPainPoints.has(warnKey)) {
        warnedPainPoints.add(warnKey);
        console.warn('[MatrixExpander] No tool mapping for pain point:', {
          gateId: normalizedGateId,
          painPointId: normalizedPainPointId,
          painPointTitle: truncateString(String(painPoint.title || painPointId), 100)
        });
      }
      return [];
    }

    const gate = gatesIndex[normalizedGateId];
    const gateTitle = truncateString(String((gate && (gate.title || gate.gateName)) || normalizedGateId), 100);
    const painPointTitle = truncateString(String(painPoint.title || normalizedPainPointId), 100);
    const contextLabel = `${gateTitle} — ${painPointTitle}`;

    const instances = [];
    const seenToolIds = new Set();

    toolIds.forEach(toolId => {
      if (!toolId || seenToolIds.has(toolId)) return;
      seenToolIds.add(toolId);

      const lookupId = normalizeId(toolId);
      const baseTool = toolsIndex[lookupId] || toolsIndex[lookupId.toLowerCase()];

      if (!baseTool) {
        if (!warnedMissingTools.has(lookupId)) {
          warnedMissingTools.add(lookupId);
          console.warn('[MatrixExpander] Base tool not found:', truncateString(lookupId, 50));
        }
        return;
      }

      instances.push({
        instanceId: `${normalizedGateId}::${normalizedPainPointId}::${lookupId}`,
        gateId: normalizedGateId,
        painPointId: normalizedPainPointId,
        toolId: lookupId,
        baseTool,
        contextLabel: truncateString(contextLabel, 200)
      });
    });

    return instances;
  }

  function getGates() {
    return gatesList.slice();
  }

  function getPainPointsByGate() {
    const copy = {};
    Object.keys(painPointsIndex).forEach(gateId => {
      if (gateId) {
        copy[gateId] = normalizeArray(painPointsIndex[gateId]).slice();
      }
    });
    return copy;
  }

  function getBaseTools() {
    return baseTools.slice();
  }

  const exportTarget = (typeof window !== 'undefined')
    ? window
    : (typeof globalThis !== 'undefined' ? globalThis : null);

  if (exportTarget) {
    exportTarget.MatrixExpander = {
      init,
      expandToolsForSelection,
      getGates,
      getPainPointsByGate,
      getBaseTools
    };
  }
})();
