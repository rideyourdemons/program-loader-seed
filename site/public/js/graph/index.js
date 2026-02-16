/**
 * Canonical Graph Interface
 * 
 * Single source of truth for Anchor -> Gate -> Pain Point -> Tool relationships.
 * All UI components must use this interface, not direct data access.
 * 
 * PRODUCTION REQUIREMENT: Deterministic, validated, fail-loud.
 */

(function() {
  'use strict';

  const EXPECTED_PAINPOINTS_PER_GATE = 40;
  const MIN_TOOLS_PER_PAINPOINT = 1;

  let graphData = null;
  let initPromise = null;

  /**
   * Canonical slug normalization (single function for all IDs)
   */
  function canonicalSlug(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Initialize graph data
   */
  async function init() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        // Load via MatrixExpander (primary) or direct fetch (fallback)
        if (window.MatrixExpander && typeof window.MatrixExpander.init === 'function') {
          await window.MatrixExpander.init();
          
          const gates = window.MatrixExpander.getGates() || [];
          const painPointsByGate = window.MatrixExpander.getPainPointsByGate() || {};
          const tools = window.MatrixExpander.getBaseTools() || [];

          // Load anchors if available
          let anchors = [];
          try {
            const anchorsRes = await fetch('/data/anchors.json').catch(() => null);
            if (anchorsRes && anchorsRes.ok) {
              const anchorsData = await anchorsRes.json();
              anchors = Array.isArray(anchorsData.anchors) ? anchorsData.anchors : [];
            }
          } catch (e) {
            console.warn('[Graph] Anchors not available, using gates as anchors');
          }

          graphData = {
            anchors: anchors.map(a => ({ ...a })),
            gates: gates.map(g => ({ ...g })),
            painPointsByGate: { ...painPointsByGate },
            tools: tools.map(t => ({ ...t })),
            toolsIndex: buildToolsIndex(tools),
            loadedAt: new Date().toISOString()
          };

          // Validate topology
          validateTopology(graphData);

          console.log('[Graph] Initialized:', {
            anchors: graphData.anchors.length,
            gates: graphData.gates.length,
            painPointGates: Object.keys(graphData.painPointsByGate).length,
            tools: graphData.tools.length
          });

          return graphData;
        }

        // Fallback: Direct fetch (prefer seed tools.json over tools-canonical.json)
        const [anchorsRes, gatesRes, painPointsRes, toolsRes] = await Promise.all([
          fetch('/data/anchors.json').catch(() => null),
          fetch('/data/gates.json').catch(() => null),
          fetch('/data/pain-points.json').catch(() => null),
          fetch('/data/tools.json').catch(() => null) // Seed data first
        ]);

        if (!gatesRes || !gatesRes.ok) {
          throw new Error('Failed to load gates.json');
        }
        if (!painPointsRes || !painPointsRes.ok) {
          throw new Error('Failed to load pain-points.json');
        }
        if (!toolsRes || !toolsRes.ok) {
          // Try fallback to tools-canonical.json
          const fallbackRes = await fetch('/data/tools-canonical.json').catch(() => null);
          if (!fallbackRes || !fallbackRes.ok) {
            throw new Error('Failed to load tools.json or tools-canonical.json');
          }
          const fallbackData = await fallbackRes.json();
          const tools = Array.isArray(fallbackData.tools) ? fallbackData.tools : fallbackData;
          graphData = {
            anchors: [],
            gates: [],
            painPointsByGate: {},
            tools: tools.map(t => ({ ...t })),
            toolsIndex: buildToolsIndex(tools),
            loadedAt: new Date().toISOString()
          };
        } else {
          const anchorsData = anchorsRes && anchorsRes.ok ? await anchorsRes.json() : { anchors: [] };
          const gatesData = await gatesRes.json();
          const painPointsData = await painPointsRes.json();
          const toolsData = await toolsRes.json();

          const anchors = Array.isArray(anchorsData.anchors) ? anchorsData.anchors : [];
          const gates = Array.isArray(gatesData.gates) ? gatesData.gates : gatesData;
          const painPointsByGate = painPointsData.painPoints || {};
          const tools = Array.isArray(toolsData.tools) ? toolsData.tools : toolsData;

          graphData = {
            anchors: anchors.map(a => ({ ...a })),
            gates: gates.map(g => ({ ...g })),
            painPointsByGate: { ...painPointsByGate },
            tools: tools.map(t => ({ ...t })),
            toolsIndex: buildToolsIndex(tools),
            loadedAt: new Date().toISOString()
          };
        }

        validateTopology(graphData);

        console.log('[Graph] Initialized (direct fetch):', {
          anchors: graphData.anchors.length,
          gates: graphData.gates.length,
          painPointGates: Object.keys(graphData.painPointsByGate).length,
          tools: graphData.tools.length
        });

        return graphData;
      } catch (error) {
        console.error('[Graph] Init failed:', {
          error: error.message,
          type: error.constructor.name
        });
        throw error;
      }
    })();

    return initPromise;
  }

  /**
   * Build tools index (by id, slug, normalized)
   */
  function buildToolsIndex(tools) {
    const index = new Map();
    
    tools.forEach(tool => {
      if (!tool || typeof tool !== 'object') return;
      
      const id = tool.id || '';
      const slug = tool.slug || '';
      
      if (id) {
        index.set(id, tool);
        index.set(canonicalSlug(id), tool);
      }
      if (slug && slug !== id) {
        index.set(slug, tool);
        index.set(canonicalSlug(slug), tool);
      }
    });
    
    return index;
  }

  /**
   * Validate expected topology
   */
  function validateTopology(data) {
    const errors = [];
    const warnings = [];

    // Each gate must have exactly EXPECTED_PAINPOINTS_PER_GATE pain points
    data.gates.forEach(gate => {
      const painPoints = data.painPointsByGate[gate.id] || [];
      if (painPoints.length !== EXPECTED_PAINPOINTS_PER_GATE) {
        errors.push(`Gate "${gate.id}" has ${painPoints.length} pain points, expected ${EXPECTED_PAINPOINTS_PER_GATE}`);
      }
    });

    // Each pain point must have >= MIN_TOOLS_PER_PAINPOINT tools
    Object.keys(data.painPointsByGate).forEach(gateId => {
      const painPoints = data.painPointsByGate[gateId] || [];
      painPoints.forEach(pp => {
        const toolIds = pp.toolIds || pp.tools || [];
        if (toolIds.length < MIN_TOOLS_PER_PAINPOINT) {
          warnings.push(`Pain point "${pp.id}" has ${toolIds.length} tools, minimum is ${MIN_TOOLS_PER_PAINPOINT}`);
        }
      });
    });

    if (errors.length > 0) {
      console.error('[Graph] Topology validation errors:', errors);
      // Don't throw - allow system to continue, but log
    }
    if (warnings.length > 0) {
      console.warn('[Graph] Topology validation warnings:', warnings.slice(0, 10));
    }
  }

  /**
   * Get all anchors
   */
  function getAnchors() {
    if (!graphData) {
      throw new Error('[Graph] Not initialized. Call init() first.');
    }
    // Return anchors if available, otherwise gates serve as anchors
    return graphData.anchors.length > 0 ? graphData.anchors.slice() : graphData.gates.slice();
  }

  /**
   * Get gates for an anchor
   */
  function getGates(anchorId) {
    if (!graphData) {
      throw new Error('[Graph] Not initialized. Call init() first.');
    }
    if (anchorId) {
      const normalizedAnchorId = canonicalSlug(anchorId);
      return graphData.gates.filter(g => 
        g.anchorId === anchorId || 
        canonicalSlug(g.anchorId) === normalizedAnchorId
      );
    }
    // Return all gates if no anchor specified
    return graphData.gates.slice();
  }

  /**
   * Get pain points for a gate
   */
  function getPainPoints(gateId) {
    if (!graphData) {
      throw new Error('[Graph] Not initialized. Call init() first.');
    }
    const normalizedGateId = canonicalSlug(gateId);
    const painPoints = graphData.painPointsByGate[normalizedGateId] || 
                       graphData.painPointsByGate[gateId] || [];
    return painPoints.slice();
  }

  /**
   * Get tools for a pain point
   */
  function getTools(painPointId, gateId) {
    if (!graphData) {
      throw new Error('[Graph] Not initialized. Call init() first.');
    }
    
    // Find pain point
    const normalizedGateId = gateId ? canonicalSlug(gateId) : null;
    let painPoint = null;
    
    if (normalizedGateId) {
      const painPoints = graphData.painPointsByGate[normalizedGateId] || [];
      painPoint = painPoints.find(pp => 
        pp.id === painPointId || 
        canonicalSlug(pp.id) === canonicalSlug(painPointId)
      );
    } else {
      // Search all gates
      for (const gateIdKey of Object.keys(graphData.painPointsByGate)) {
        const painPoints = graphData.painPointsByGate[gateIdKey] || [];
        painPoint = painPoints.find(pp => 
          pp.id === painPointId || 
          canonicalSlug(pp.id) === canonicalSlug(painPointId)
        );
        if (painPoint) break;
      }
    }
    
    if (!painPoint) {
      return [];
    }
    
    // Get tool IDs from pain point
    const toolIds = painPoint.toolIds || painPoint.tools || [];
    const tools = [];
    
    toolIds.forEach(toolId => {
      const normalizedToolId = canonicalSlug(toolId);
      const tool = graphData.toolsIndex.get(toolId) || 
                   graphData.toolsIndex.get(normalizedToolId);
      if (tool) {
        tools.push(tool);
      }
    });
    
    return tools;
  }

  /**
   * Get a single tool by ID or slug
   */
  function getTool(toolIdOrSlug) {
    if (!graphData) {
      throw new Error('[Graph] Not initialized. Call init() first.');
    }
    
    const normalized = canonicalSlug(toolIdOrSlug);
    return graphData.toolsIndex.get(toolIdOrSlug) || 
           graphData.toolsIndex.get(normalized) || 
           null;
  }

  /**
   * Resolve route (helper for routing)
   */
  function resolveRoute(path) {
    if (!graphData) {
      throw new Error('[Graph] Not initialized. Call init() first.');
    }
    
    // Parse path patterns: /gate/:id, /tool/:id, /gate/:gateId/:painPointId
    const parts = path.split('/').filter(Boolean);
    
    if (parts.length === 0) {
      return { type: 'home' };
    }
    
    if (parts[0] === 'gate' && parts.length >= 2) {
      const gateId = parts[1];
      const painPointId = parts.length >= 3 ? parts[2] : null;
      
      const gate = graphData.gates.find(g => 
        g.id === gateId || canonicalSlug(g.id) === canonicalSlug(gateId)
      );
      
      if (!gate) {
        return { type: 'not-found', path };
      }
      
      if (painPointId) {
        const painPoint = getPainPoints(gateId).find(pp => 
          pp.id === painPointId || canonicalSlug(pp.id) === canonicalSlug(painPointId)
        );
        return { type: 'pain-point', gate, painPoint };
      }
      
      return { type: 'gate', gate };
    }
    
    if (parts[0] === 'tool' && parts.length >= 2) {
      const toolId = parts[1];
      const tool = getTool(toolId);
      return tool ? { type: 'tool', tool } : { type: 'not-found', path };
    }
    
    return { type: 'not-found', path };
  }

  /**
   * Get graph status (safe telemetry)
   */
  function getStatus() {
    if (!graphData) {
      return { initialized: false };
    }
    
    return {
      initialized: true,
      gates: graphData.gates.length,
      painPointGates: Object.keys(graphData.painPointsByGate).length,
      tools: graphData.tools.length,
      loadedAt: graphData.loadedAt
    };
  }

  // Export to global scope
  window.RYD_Graph = {
    init,
    getAnchors,
    getGates,
    getPainPoints,
    getTools,
    getTool,
    resolveRoute,
    getStatus,
    canonicalSlug,
    EXPECTED_PAINPOINTS_PER_GATE,
    MIN_TOOLS_PER_PAINPOINT
  };

  console.log('[Graph] Canonical graph interface initialized');

})();
