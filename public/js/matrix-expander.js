/**
 * RYD Matrix Expander
 *
 * Dynamically maps Gates + Pain Points to Tools without duplicating base tools.
 * Produces ToolInstance objects from JSON data at runtime.
 */
(function() {
  'use strict';
  console.log('Matrix Initialized');

  const GATES_URL = '/data/gates.json';
  const PAIN_POINTS_URL = '/data/pain-points.json';
  const TOOLS_URL = '/data/tools.json';
  const TOOLS_CANONICAL_URL = '/data/tools-canonical.json';
  const DATA_FILES = {
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
      if (typeof require === 'function') {
        return { fs: require('fs'), path: require('path') };
      }

      const fs = await import('node:fs');
      const path = await import('node:path');
      return { fs, path };
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
      const chunks = [];
      const stream = mods.fs.createReadStream(filePath, { encoding: 'utf8' });

      stream.on('data', chunk => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => {
        try {
          resolve(JSON.parse(chunks.join('')));
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  async function fetchJson(url, nodeFileName) {
    if (!isNodeRuntime) {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`${url} -> HTTP ${res.status}`);
      }
      return await res.json();
    }

    const filePath = await getNodeDataPath(nodeFileName);
    return await readJsonStream(filePath);
  }

  function normalizeArray(value) {
    if (Array.isArray(value)) return value;
    if (value == null) return [];
    return [];
  }

  function normalizeObject(value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
    return {};
  }

  function normalizeId(value) {
    if (value == null) return '';
    return String(value).trim();
  }

  function buildIndices({ gates = [], painPoints = {}, tools = [] }) {
    gatesList = normalizeArray(gates);
    baseTools = normalizeArray(tools);

    gatesIndex = {};
    gatesList.forEach(gate => {
      if (gate && gate.id) {
        gatesIndex[gate.id] = gate;
      }
    });

    painPointsIndex = {};
    const painPointsObject = normalizeObject(painPoints);
    Object.keys(painPointsObject).forEach(gateId => {
      const points = normalizeArray(painPointsObject[gateId]);
      painPointsIndex[gateId] = points;
    });

    toolsIndex = {};
    baseTools.forEach(tool => {
      if (!tool) return;
      const id = normalizeId(tool.id);
      const slug = normalizeId(tool.slug);
      if (id) toolsIndex[id] = tool;
      if (slug && slug !== id) toolsIndex[slug] = tool;
      if (id) toolsIndex[id.toLowerCase()] = tool;
      if (slug) toolsIndex[slug.toLowerCase()] = tool;
    });

    return {
      gates: Object.keys(gatesIndex).length,
      painPointGates: Object.keys(painPointsIndex).length,
      tools: Object.keys(toolsIndex).length
    };
  }

  async function fetchToolsData() {
    try {
      return await fetchJson(TOOLS_CANONICAL_URL, DATA_FILES.toolsCanonical);
    } catch (error) {
      console.warn('[MatrixExpander] Falling back to tools.json:', error.message || error);
      return await fetchJson(TOOLS_URL, DATA_FILES.tools);
    }
  }

  async function loadMatrixData() {
    if (!isNodeRuntime) {
      const [gatesData, painPointsData, toolsData] = await Promise.all([
        fetchJson(GATES_URL, DATA_FILES.gates),
        fetchJson(PAIN_POINTS_URL, DATA_FILES.painPoints),
        fetchToolsData()
      ]);

      return { gatesData, painPointsData, toolsData };
    }

    // Stream sequentially in Node to avoid memory spikes with large payloads.
    const gatesData = await fetchJson(GATES_URL, DATA_FILES.gates);
    const painPointsData = await fetchJson(PAIN_POINTS_URL, DATA_FILES.painPoints);
    const toolsData = await fetchToolsData();

    return { gatesData, painPointsData, toolsData };
  }

  async function init() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        const { gatesData, painPointsData, toolsData } = await loadMatrixData();

        const counts = buildIndices({
          gates: Array.isArray(gatesData?.gates) ? gatesData.gates : gatesData,
          painPoints: normalizeObject(painPointsData?.painPoints || painPointsData),
          tools: Array.isArray(toolsData?.tools) ? toolsData.tools : toolsData
        });

        isReady = true;
        logInitOnce(counts);
        return counts;
      } catch (err) {
        isReady = false;
        logInitOnce(err, true);
        throw err;
      }
    })();

    return initPromise;
  }

  function getToolIds(painPoint) {
    if (!painPoint) return [];
    if (Array.isArray(painPoint.toolIds)) return painPoint.toolIds;
    if (Array.isArray(painPoint.tools)) return painPoint.tools;
    if (painPoint.links && Array.isArray(painPoint.links.tools)) return painPoint.links.tools;
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

    if (!gateId || !painPointId) {
      return [];
    }

    const gatePainPoints = painPointsIndex[gateId] || [];
    const painPoint = gatePainPoints.find(pp => pp && pp.id === painPointId);

    if (!painPoint) {
      return [];
    }

    const toolIds = getToolIds(painPoint)
      .map(normalizeId)
      .filter(Boolean);
    if (toolIds.length === 0) {
      const warnKey = `${gateId}::${painPointId}`;
      if (!warnedPainPoints.has(warnKey)) {
        warnedPainPoints.add(warnKey);
        console.warn('[MatrixExpander] No tool mapping for pain point:', {
          gateId,
          painPointId,
          painPointTitle: painPoint.title || painPointId
        });
      }
      return [];
    }

    const gate = gatesIndex[gateId];
    const gateTitle = (gate && (gate.title || gate.gateName)) || gateId;
    const painPointTitle = painPoint.title || painPointId;
    const contextLabel = `${gateTitle} — ${painPointTitle}`;

    const instances = [];
    const seenToolIds = new Set();

    toolIds.forEach(toolId => {
      if (seenToolIds.has(toolId)) return;
      seenToolIds.add(toolId);

      const lookupId = normalizeId(toolId);
      const baseTool = toolsIndex[lookupId] || toolsIndex[lookupId.toLowerCase()];

      if (!baseTool) {
        if (!warnedMissingTools.has(lookupId)) {
          warnedMissingTools.add(lookupId);
          console.warn('[MatrixExpander] Base tool not found:', lookupId);
        }
        return;
      }

      instances.push({
        instanceId: `${gateId}::${painPointId}::${toolId}`,
        gateId,
        painPointId,
        toolId,
        baseTool,
        contextLabel
      });
    });

    return instances;
  }

  function getGates() {
    return gatesList.slice();
  }

  function getPainPointsByGate() {
    return { ...painPointsIndex };
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
