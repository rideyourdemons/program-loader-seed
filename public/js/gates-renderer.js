/**
 * RYD Gates Renderer
 * Renders 12 gates with dropdowns for 40 pain points each
 * Each pain point links to 3 tools
 */

(function() {
  'use strict';

  const GATES_URL = '/data/gates.json';
  const PAIN_POINTS_URL = '/data/pain-points.json';
  const TOOLS_URL = '/data/tools.json';

  let mappingData = null;
  let toolsData = null;

  async function loadData() {
    try {
      if (window.MatrixExpander && window.MatrixExpander.init) {
        await window.MatrixExpander.init();
        const gates = window.MatrixExpander.getGates() || [];
        const painPointsByGate = window.MatrixExpander.getPainPointsByGate() || {};
        const tools = window.MatrixExpander.getBaseTools() || [];

        // Attach pain points to gates for UI rendering
        gates.forEach(gate => {
          gate.painPoints = painPointsByGate[gate.id] || [];
        });

        mappingData = { gates };
        toolsData = tools;
      } else {
        console.log('[RYD Gates] Loading data directly...');
        const [gatesRes, painPointsRes, toolsRes] = await Promise.all([
          fetch(`${GATES_URL}?ts=${Date.now()}`),
          fetch(`${PAIN_POINTS_URL}?ts=${Date.now()}`),
          fetch(`${TOOLS_URL}?ts=${Date.now()}`)
        ]);

        if (!gatesRes.ok) {
          throw new Error(`Failed to load gates: ${gatesRes.status}`);
        }
        if (!painPointsRes.ok) {
          throw new Error(`Failed to load pain points: ${painPointsRes.status}`);
        }
        if (!toolsRes.ok) {
          throw new Error(`Failed to load tools: ${toolsRes.status}`);
        }

        const gatesJson = await gatesRes.json();
        const painPointsJson = await painPointsRes.json();
        const toolsJson = await toolsRes.json();

        const gates = gatesJson.gates || [];
        const painPointsByGate = painPointsJson.painPoints || {};
        toolsData = toolsJson.tools || [];

        gates.forEach(gate => {
          gate.painPoints = painPointsByGate[gate.id] || [];
        });

        mappingData = { gates };
      }

      // Create tool lookup
      const toolMap = new Map();
      toolsData.forEach(tool => {
        if (tool.id) toolMap.set(tool.id, tool);
        if (tool.slug && tool.slug !== tool.id) toolMap.set(tool.slug, tool);
      });

      console.log('[RYD Gates] Loaded:', {
        gates: mappingData.gates.length,
        tools: toolsData.length
      });

      return { mappingData, toolMap, toolsData };
    } catch (error) {
      console.error('[RYD Gates] Error loading data:', error);
      throw error;
    }
  }

  function renderGates(container, mappingData, toolMap) {
    if (!container) {
      console.warn('[RYD Gates] Container not found');
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

    mappingData.gates.forEach(gate => {
      const gateCard = document.createElement('div');
      gateCard.className = 'gate-card';
      gateCard.style.cssText = 'border: 1px solid var(--color-border, #e0e0e0); border-radius: 8px; padding: 1.5rem; background: var(--color-bg-secondary, #ffffff);';

      // Gate title
      const gateTitle = document.createElement('h3');
      gateTitle.textContent = gate.title;
      gateTitle.style.cssText = 'margin-bottom: 0.5rem; font-size: 1.3em; color: var(--color-accent, #667eea);';
      gateCard.appendChild(gateTitle);

      // Gate description
      if (gate.description) {
        const gateDesc = document.createElement('p');
        gateDesc.textContent = gate.description;
        gateDesc.style.cssText = 'margin-bottom: 1rem; color: var(--color-text-secondary, #666); font-size: 0.9em;';
        gateCard.appendChild(gateDesc);
      }

      // Pain points dropdown (navigates to full pain-point page)
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

      // Default option
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '-- Choose a pain point --';
      dropdown.appendChild(defaultOption);

      // Pain point options
      gate.painPoints.forEach(painPoint => {
        const option = document.createElement('option');
        option.value = `${gate.id}__${painPoint.id}`;
        option.textContent = painPoint.title;
        dropdown.appendChild(option);
      });

      dropdownWrapper.appendChild(dropdown);

      const handlePainPointSelect = (e) => {
        const value = e.target.value;
        if (!value) return;
        const [gateId, painPointId] = value.split('__');
        if (!gateId || !painPointId) return;
        window.location.assign(`/gates/${gateId}/${painPointId}`);
      };

      dropdown.addEventListener('change', handlePainPointSelect);
      dropdown.addEventListener('input', handlePainPointSelect);

      const meta = document.createElement('div');
      meta.style.cssText = 'margin-top: 0.75rem; font-size: 0.9em; color: var(--color-text-secondary, #666);';
      meta.textContent = `${gate.painPoints.length} pain points in this gate.`;
      dropdownWrapper.appendChild(meta);

      const gateLink = document.createElement('a');
      gateLink.href = `/gates/${gate.id}`;
      gateLink.textContent = 'View all pain points →';
      gateLink.style.cssText = 'display: inline-block; margin-top: 0.5rem; color: var(--color-accent, #667eea); text-decoration: none; font-size: 0.9em; font-weight: 500;';
      dropdownWrapper.appendChild(gateLink);
      gateCard.appendChild(dropdownWrapper);

      gatesGrid.appendChild(gateCard);
    });

    gatesSection.appendChild(gatesGrid);
    container.appendChild(gatesSection);
  }

  function renderTools(container, gate, painPoint, toolMap) {
    container.innerHTML = '';

    const toolsTitle = document.createElement('h4');
    toolsTitle.textContent = `Tools for "${painPoint.title}"`;
    toolsTitle.style.cssText = 'margin-bottom: 1rem; font-size: 1.1em; color: var(--color-text, #1a1a1a);';
    container.appendChild(toolsTitle);

    // Use MatrixExpander if available
    let toolInstances = [];
    if (window.MatrixExpander) {
      toolInstances = window.MatrixExpander.expandToolsForSelection(gate.id, painPoint.id);
    } else {
      console.warn('[RYD Gates] MatrixExpander not available, falling back to direct mapping');
      // Fallback: use toolIds directly
      const toolIds = painPoint.toolIds || painPoint.tools || [];
      toolIds.forEach(toolId => {
        const tool = toolMap.get(toolId);
        if (tool) {
          toolInstances.push({
            instanceId: `${gate.id}::${painPoint.id}::${toolId}`,
            gateId: gate.id,
            painPointId: painPoint.id,
            toolId: toolId,
            baseTool: tool,
            contextLabel: `${gate.title} — ${painPoint.title}`
          });
        }
      });
    }

    if (toolInstances.length === 0) {
      const fallbackIds = painPoint.toolIds || painPoint.tools || [];
      fallbackIds.forEach(toolId => {
        const tool = toolMap.get(toolId);
        toolInstances.push({
          instanceId: `${gate.id}::${painPoint.id}::${toolId}`,
          gateId: gate.id,
          painPointId: painPoint.id,
          toolId: toolId,
          baseTool: tool || { id: toolId, slug: toolId, title: String(toolId) },
          contextLabel: `${gate.title} — ${painPoint.title}`
        });
      });
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
      const raw = (tool && (tool.description || tool.summary)) || '';
      const title = tool && (tool.title || tool.name);
      if (window.RYD_UI && typeof window.RYD_UI.sanitizeDescription === 'function') {
        return window.RYD_UI.sanitizeDescription(raw, title);
      }
      return String(raw || '').trim();
    };

    toolInstances.forEach(instance => {
      const tool = instance.baseTool || instance.base; // Direct reference to base tool
      if (!tool) return;

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

      const toolTitle = document.createElement('h5');
      toolTitle.textContent = tool.name || tool.title || instance.toolId;
      toolTitle.style.cssText = 'margin-bottom: 0.5rem; font-size: 1em; color: var(--color-accent, #667eea);';
      toolCard.appendChild(toolTitle);

      const description = extractDescription(tool);
      if (description) {
        const toolDesc = document.createElement('p');
        toolDesc.textContent = description.substring(0, 100) + (description.length > 100 ? '...' : '');
        toolDesc.style.cssText = 'font-size: 0.85em; color: var(--color-text-secondary, #666); margin-bottom: 0.5rem;';
        toolCard.appendChild(toolDesc);
      }

      // Link to tool page with context
      const toolLink = document.createElement('a');
      const rawSlug = tool.slug || tool.id || instance.toolId || tool.title || tool.name;
      const toolSlug = encodeURIComponent(String(rawSlug || '').trim());
      toolLink.href = `/tools/tool.html?slug=${toolSlug}&gate=${gate.id}&painPoint=${painPoint.id}`;
      toolLink.textContent = 'Open Tool →';
      toolLink.style.cssText = 'display: inline-block; color: var(--color-accent, #667eea); text-decoration: none; font-size: 0.9em; font-weight: 500;';
      toolLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = toolLink.href;
      });
      toolCard.appendChild(toolLink);

      // Make entire card clickable
      toolCard.addEventListener('click', () => {
        window.location.href = toolLink.href;
      });

      toolsList.appendChild(toolCard);
    });

    container.appendChild(toolsList);

    // Back to gate link
    const backLink = document.createElement('a');
    backLink.href = `#gate-${gate.id}`;
    backLink.textContent = `← Back to ${gate.title}`;
    backLink.style.cssText = 'display: inline-block; margin-top: 1rem; color: var(--color-text-secondary, #666); text-decoration: none; font-size: 0.9em;';
    container.appendChild(backLink);
  }

  async function init() {
    try {
      const container = document.getElementById('gatesContainer');
      if (!container) {
        console.warn('[RYD Gates] Container #gatesContainer not found');
        return;
      }

      const { mappingData, toolMap, toolsData } = await loadData();
      
      // Initialize MatrixExpander if available
      renderGates(container, mappingData, toolMap);
    } catch (error) {
      console.error('[RYD Gates] Initialization failed:', error);
      const container = document.getElementById('gatesContainer');
      if (container) {
        container.innerHTML = '<p style="color: red;">Failed to load gates. Please refresh the page.</p>';
      }
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
    init,
    loadData,
    renderGates
  };
})();

