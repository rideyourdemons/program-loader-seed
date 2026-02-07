/**
 * RYD Hash-Based Router
 * Handles navigation: /#/?q=query, /#/gate/:id, /#/tool/:id
 */

(function() {
  'use strict';
  
  console.log('[RYD] router initializing');

  function sanitizeDescription(raw, title) {
    if (window.RYD_UI && typeof window.RYD_UI.sanitizeDescription === 'function') {
      return window.RYD_UI.sanitizeDescription(raw, title);
    }
    return String(raw || '').trim();
  }

  // If a clean /tools/:slug URL loads the homepage, redirect to tool.html.
  const path = window.location.pathname || '';
  if (path.startsWith('/tools/') && !path.startsWith('/tools/tool.html')) {
    const parts = path.split('/').filter(Boolean);
    const slugFromPath = parts.length >= 2 ? decodeURIComponent(parts[1]) : '';
    if (slugFromPath) {
      const params = new URLSearchParams(window.location.search);
      if (!params.get('slug')) {
        params.set('slug', slugFromPath);
      }
      const target = `/tools/tool.html?${params.toString()}`;
      window.location.replace(target);
      return;
    }
  }
  
  let currentRoute = null;
  let gates = [];
  let painPoints = {};
  let tools = [];
  
  // Load data once
  async function loadData() {
    try {
      if (!window.MatrixExpander || typeof window.MatrixExpander.init !== 'function') {
        throw new Error('MatrixExpander is not available');
      }

      await window.MatrixExpander.init();

      gates = window.MatrixExpander.getGates();
      painPoints = window.MatrixExpander.getPainPointsByGate();
      tools = window.MatrixExpander.getBaseTools();

      console.log('[RYD] router: gates loaded', gates.length);
      console.log('[RYD] router: pain points loaded', Object.keys(painPoints).length, 'gates');
      console.log(`[RYD] base tools loaded: ${tools.length}`);
    } catch (err) {
      console.error('[RYD] router: failed to load data', err);
    }
  }

  function buildToolUrl(toolSlug) {
    const safeSlug = encodeURIComponent(String(toolSlug || '').trim());
    return `/tools/tool.html?slug=${safeSlug}`;
  }
  
  // Parse hash route
  function parseRoute(hash) {
    const routeBase = {
      where_it_came_from: {
        origin: "internal",
        basis: "runtime-assembled loader object",
        source_type: "system-assembly",
        verified: true
      }
    };
    
    if (!hash || hash === '#') return { ...routeBase, type: 'home' };
    
    // Remove # and leading /
    const path = hash.replace(/^#\/?/, '');
    
    // Query string: ?q=query
    if (path.startsWith('?q=')) {
      const query = decodeURIComponent(path.substring(3));
      return { ...routeBase, type: 'search', query };
    }
    
    // /gate/:id
    if (path.startsWith('gate/')) {
      const gateId = path.substring(5);
      console.log('[RYD] router: selected gate', gateId);
      return { ...routeBase, type: 'gate', gateId };
    }
    
    // /tool/:id
    if (path.startsWith('tool/')) {
      const toolId = path.substring(5);
      console.log('[RYD] router: selected tool', toolId);
      return { ...routeBase, type: 'tool', toolId };
    }
    
    // /gate/:id
    if (path.startsWith('gate/')) {
      const gateId = path.substring(5);
      console.log('[RYD] router: selected gate', gateId);
      return { ...routeBase, type: 'gate', gateId };
    }
    
    // /pain/:gateId/:painPointId
    if (path.startsWith('pain/')) {
      const parts = path.substring(5).split('/');
      if (parts.length >= 2) {
        const gateId = parts[0];
        const painPointId = parts[1];
        console.log('[RYD] router: selected pain point', { gateId, painPointId });
        return { ...routeBase, type: 'pain', gateId, painPointId };
      }
    }
    
    return { ...routeBase, type: 'home' };
  }
  
  // Search: match query against pain points and tools (case-insensitive)
  function search(query) {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return {
      gates: [],
      where_it_came_from: {
        origin: "internal",
        basis: "runtime-assembled loader object",
        source_type: "system-assembly",
        verified: true
      }
    };
    
    const results = {};
    
    // Search pain points - enhanced matching
    Object.keys(painPoints).forEach(gateId => {
      const points = painPoints[gateId] || [];
      const matchingPoints = points.filter(pp => {
        const searchable = [
          pp.title || '',
          pp.id || '',
          ...(pp.keywords || [])
        ].join(' ').toLowerCase();
        
        // Exact match gets highest priority
        if (searchable === normalized || pp.id === normalized) {
          return true;
        }
        
        // Partial match
        return searchable.includes(normalized) || normalized.includes(pp.title.toLowerCase());
      });
      
      if (matchingPoints.length > 0) {
        if (!results[gateId]) {
          results[gateId] = { painPoints: [], tools: [] };
        }
        // Sort by relevance (exact matches first)
        matchingPoints.sort((a, b) => {
          const aExact = (a.id === normalized || a.title.toLowerCase() === normalized) ? 1 : 0;
          const bExact = (b.id === normalized || b.title.toLowerCase() === normalized) ? 1 : 0;
          return bExact - aExact;
        });
        results[gateId].painPoints = matchingPoints;
        console.log('[RYD] router: found', matchingPoints.length, 'pain points in gate', gateId);
      }
    });
    
      // Search tools
    tools.forEach(tool => {
      const searchable = [
        tool.title || tool.name || '',
        tool.description || '',
        tool.summary || '',
        tool.category || '',
        tool.id || '',
        ...(tool.keywords || []),
        ...(tool.tags || [])
      ].join(' ').toLowerCase();
      
      if (searchable.includes(normalized)) {
        // Use gateIds if present; otherwise fallback to the first gate
        const toolGateIds = tool.gateIds || [];
        const defaultGateId = gates.length > 0 ? gates[0].id : null;
        const gateIdsToUse = toolGateIds.length > 0 ? toolGateIds : (defaultGateId ? [defaultGateId] : []);
        
        gateIdsToUse.forEach(gateId => {
          if (!results[gateId]) {
            results[gateId] = { painPoints: [], tools: [] };
          }
          if (!results[gateId].tools.find(t => t.id === tool.id)) {
            results[gateId].tools.push(tool);
            console.log('[RYD] router: found tool', tool.id, 'in gate', gateId);
          }
        });
      }
    });
    
    const baseGate = gates.find(g => g.id);
    return {
      gates: Object.keys(results).map(gateId => ({
        gateId,
        gate: gates.find(g => g.id === gateId),
        painPoints: results[gateId].painPoints,
        tools: results[gateId].tools,
        where_it_came_from: (gates.find(g => g.id === gateId))?.where_it_came_from || {
          origin: "internal",
          basis: "runtime-assembled loader object",
          source_type: "system-assembly",
          verified: true
        }
      })),
      where_it_came_from: {
        origin: "internal",
        basis: "runtime-assembled loader object",
        source_type: "system-assembly",
        verified: true
      }
    };
  }
  
  // Render search results - Landing result page: Pain → Gate → Tools
  function renderSearchResults(query, results) {
    const container = document.getElementById('routerContent') ||
                     document.getElementById('searchResults') || 
                     document.getElementById('mainContent') ||
                     document.querySelector('main');
    
    if (!container) {
      // Console safety: log once, exit silently
      if (!window._rydRouterContainerWarned) {
        console.warn('[RYD] router: no container found for search results');
        window._rydRouterContainerWarned = true;
      }
      return;
    }
    
    container.innerHTML = '';
    
    // Main heading
    const h1 = document.createElement('h1');
    h1.textContent = `Search Results: "${query}"`;
    h1.style.cssText = 'margin-bottom: 30px;';
    container.appendChild(h1);
    
    if (results.gates.length === 0) {
      const p = document.createElement('p');
      p.textContent = 'No results found. Try: anxiety, depression, stress, relationships';
      p.style.cssText = 'color: var(--color-text-secondary, #666);';
      container.appendChild(p);
      return;
    }
    
    // Render each gate with pain points and tools
    results.gates.forEach(({ gateId, gate, painPoints, tools }) => {
      const section = document.createElement('section');
      section.className = 'card';
      section.style.cssText = 'margin-bottom: 30px; padding: 24px; border-radius: 12px; background: var(--color-bg-secondary, #ffffff);';
      
      // Gate header
      const gateHeader = document.createElement('div');
      gateHeader.style.cssText = 'margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid var(--color-border, #e0e0e0);';
      
      const h2 = document.createElement('h2');
      h2.textContent = gate ? gate.title : gateId;
      h2.style.cssText = 'margin: 0 0 8px 0;';
      gateHeader.appendChild(h2);
      
      if (gate && gate.description) {
        const gateDesc = document.createElement('p');
        gateDesc.textContent = sanitizeDescription(gate.description, gate.title);
        gateDesc.style.cssText = 'color: var(--color-text-secondary, #666); margin: 0;';
        gateHeader.appendChild(gateDesc);
      }
      
      section.appendChild(gateHeader);
      
      // Pain Points section
      if (painPoints.length > 0) {
        const painSection = document.createElement('div');
        painSection.style.cssText = 'margin-bottom: 24px;';
        
        const h3 = document.createElement('h3');
        h3.textContent = 'Related Pain Points';
        h3.style.cssText = 'margin: 0 0 12px 0; font-size: 1.2em;';
        painSection.appendChild(h3);
        
        const ul = document.createElement('ul');
        ul.style.cssText = 'list-style: none; padding: 0; margin: 0;';
        
        painPoints.forEach(pp => {
          const li = document.createElement('li');
          li.style.cssText = 'margin: 8px 0;';
          
          const link = document.createElement('a');
          // Find best matching tool for this pain point
          const gateTools = tools.filter(t => {
            if (!t.gateIds || !Array.isArray(t.gateIds)) return false;
            return t.gateIds.includes(gateId) || 
                   (t.painPointIds && Array.isArray(t.painPointIds) && t.painPointIds.includes(pp.id));
          });
          
          const matchingTool = gateTools.length > 0 ? gateTools[0] : 
                              tools.length > 0 ? tools[0] : null;
          
          if (matchingTool) {
            const toolSlug = matchingTool.slug || matchingTool.id;
            link.href = buildToolUrl(toolSlug);
            link.textContent = pp.title;
            link.style.cssText = 'color: var(--color-accent, #667eea); text-decoration: none; font-weight: 500; display: inline-block; padding: 8px 12px; border-radius: 6px; transition: background 0.2s;';
            link.onmouseover = () => link.style.background = 'var(--color-bg, #f5f5f5)';
            link.onmouseout = () => link.style.background = 'transparent';
            link.onclick = (e) => {
              e.preventDefault();
              console.log('[RYD] router: selected pain point', pp.id, 'in gate', gateId);
              console.log('[RYD] router: routing to tool', toolSlug);
              window.location.href = buildToolUrl(toolSlug);
            };
          } else {
            link.textContent = pp.title;
            link.style.cssText = 'color: var(--color-text-secondary, #666); text-decoration: none;';
          }
          
          li.appendChild(link);
          ul.appendChild(li);
        });
        
        painSection.appendChild(ul);
        section.appendChild(painSection);
      }
      
      // Tools section - Tool cards with descriptions
      if (tools.length > 0) {
        const toolsSection = document.createElement('div');
        
        const h3 = document.createElement('h3');
        h3.textContent = 'Recommended Tools';
        h3.style.cssText = 'margin: 0 0 16px 0; font-size: 1.2em;';
        toolsSection.appendChild(h3);
        
        const toolsGrid = document.createElement('div');
        toolsGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;';
        
        tools.forEach(tool => {
          const toolCard = document.createElement('div');
          toolCard.className = 'tool-card';
          toolCard.style.cssText = 'padding: 20px; border: 1px solid var(--color-border, #e0e0e0); border-radius: 8px; background: var(--color-bg-secondary, #ffffff); transition: box-shadow 0.2s;';
          toolCard.onmouseover = () => toolCard.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          toolCard.onmouseout = () => toolCard.style.boxShadow = 'none';
          
          // Tool title
          const toolTitle = document.createElement('h4');
          toolTitle.textContent = tool.title || tool.name || tool.id;
          toolTitle.style.cssText = 'margin: 0 0 12px 0; font-size: 1.1em;';
          toolCard.appendChild(toolTitle);
          
          // Tool description (ALWAYS show - use summary or description or generate from howWhyWorks)
          const toolDesc = document.createElement('p');
          const description = tool.description || 
                            tool.summary || 
                            (tool.howWhyWorks ? tool.howWhyWorks.substring(0, 120) + '...' : null) ||
                            'A practical self-help tool for managing this challenge.';
          toolDesc.textContent = sanitizeDescription(description, tool.title || tool.name);
          toolDesc.style.cssText = 'color: var(--color-text-secondary, #666); margin: 0 0 16px 0; font-size: 0.95em; line-height: 1.5;';
          toolCard.appendChild(toolDesc);
          
          // Tool meta (duration, difficulty)
          const toolMeta = document.createElement('div');
          toolMeta.style.cssText = 'display: flex; gap: 12px; margin-bottom: 16px; font-size: 0.9em; color: var(--color-text-secondary, #666);';
          
          if (tool.duration) {
            const duration = document.createElement('span');
            duration.textContent = `⏱️ ${tool.duration}`;
            toolMeta.appendChild(duration);
          }
          
          if (tool.difficulty) {
            const difficulty = document.createElement('span');
            difficulty.textContent = `📊 ${tool.difficulty}`;
            toolMeta.appendChild(difficulty);
          }
          
          if (toolMeta.children.length > 0) {
            toolCard.appendChild(toolMeta);
          }
          
          // CTA button
          const cta = document.createElement('a');
          const toolSlug = tool.slug || tool.id;
          cta.href = buildToolUrl(toolSlug);
          cta.textContent = 'Open Tool';
          cta.style.cssText = 'display: inline-block; padding: 10px 20px; background: var(--color-accent, #667eea); color: white; text-decoration: none; border-radius: 6px; font-weight: 500; transition: background 0.2s;';
          cta.onmouseover = () => cta.style.background = 'var(--color-accent-dark, #764ba2)';
          cta.onmouseout = () => cta.style.background = 'var(--color-accent, #667eea)';
          cta.onclick = (e) => {
            e.preventDefault();
            console.log('[RYD] router: selected tool', tool.id);
            window.location.href = buildToolUrl(toolSlug);
          };
          toolCard.appendChild(cta);
          
          toolsGrid.appendChild(toolCard);
        });
        
        toolsSection.appendChild(toolsGrid);
        section.appendChild(toolsSection);
      }
      
      container.appendChild(section);
    });
  }
  
  // Render tool view
  function renderTool(toolId) {
    const tool = tools.find(t => t.id === toolId || t.slug === toolId);
    
    if (!tool) {
      console.warn('[RYD] router: tool not found', toolId);
      return;
    }
    
    console.log('[RYD] router: rendering tool', toolId, tool.title);
    
    const container = document.getElementById('routerContent') ||
                     document.getElementById('toolView') ||
                     document.getElementById('mainContent') ||
                     document.querySelector('main');
    
    if (!container) {
      // Console safety: log once, exit silently
      if (!window._rydRouterToolContainerWarned) {
        console.warn('[RYD] router: no container found for tool view');
        window._rydRouterToolContainerWarned = true;
      }
      return;
    }
    
    container.innerHTML = '';
    
    // Title
    const h1 = document.createElement('h1');
    h1.textContent = tool.title;
    container.appendChild(h1);
    
    // Description (ALWAYS show - never leave blank)
    const desc = tool.description || 
                 tool.summary || 
                 (tool.howWhyWorks ? tool.howWhyWorks.substring(0, 200) + '...' : null) ||
                 'A practical self-help tool for personal growth and well-being.';
    const p = document.createElement('p');
    p.textContent = sanitizeDescription(desc, tool.title || tool.name);
    p.style.cssText = 'margin-bottom: 20px; line-height: 1.7; color: var(--color-text, #1a1a1a);';
    container.appendChild(p);
    
    // Meta info
    const meta = document.createElement('div');
    meta.className = 'tool-meta';
    meta.style.cssText = 'display: flex; gap: 20px; margin-bottom: 30px;';
    
    if (tool.duration) {
      const duration = document.createElement('span');
      duration.textContent = `⏱️ ${tool.duration}`;
      meta.appendChild(duration);
    }
    
    if (tool.difficulty) {
      const difficulty = document.createElement('span');
      difficulty.className = `badge badge-${tool.difficulty}`;
      difficulty.textContent = tool.difficulty;
      meta.appendChild(difficulty);
    }
    
    container.appendChild(meta);
    
    // 3 Workthrough dropdowns (Self-Help Workthroughs)
    const h2 = document.createElement('h2');
    h2.textContent = 'Self-Help Workthroughs';
    h2.style.marginTop = '30px';
    container.appendChild(h2);
    
    if (tool.walkthroughs && tool.walkthroughs.length > 0) {
      tool.walkthroughs.forEach((wt, index) => {
        const details = document.createElement('details');
        details.style.cssText = 'margin: 15px 0; padding: 15px; border: 1px solid var(--color-border, #e0e0e0); border-radius: 8px; background: var(--color-bg-secondary, #ffffff);';
        
        const summary = document.createElement('summary');
        summary.textContent = wt.title;
        summary.style.cssText = 'font-weight: 500; cursor: pointer; font-size: 1.1em; padding: 5px 0;';
        details.appendChild(summary);
        
        const content = document.createElement('div');
        content.style.cssText = 'margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--color-border, #e0e0e0); line-height: 1.7;';
        
        if (wt.steps && wt.steps.length > 0) {
          const ol = document.createElement('ol');
          ol.style.cssText = 'padding-left: 25px; margin: 10px 0;';
          wt.steps.forEach(step => {
            const li = document.createElement('li');
            li.style.cssText = 'margin: 8px 0;';
            li.textContent = step;
            ol.appendChild(li);
          });
          content.appendChild(ol);
        } else {
          const p = document.createElement('p');
          p.textContent = wt.content || 'Content pending import from live site.';
          content.appendChild(p);
        }
        
        details.appendChild(content);
        container.appendChild(details);
      });
    } else {
      // Fallback: create 3 placeholder workthroughs
      const fallbackWorkthroughs = [
        { title: 'Quick Workthrough (5 min)', content: 'Content pending import from live site.' },
        { title: 'Standard Workthrough (15 min)', content: 'Content pending import from live site.' },
        { title: 'Deep Workthrough (30 min)', content: 'Content pending import from live site.' }
      ];
      
      fallbackWorkthroughs.forEach(wt => {
        const details = document.createElement('details');
        details.style.cssText = 'margin: 15px 0; padding: 15px; border: 1px solid var(--color-border, #e0e0e0); border-radius: 8px; background: var(--color-bg-secondary, #ffffff);';
        
        const summary = document.createElement('summary');
        summary.textContent = wt.title;
        summary.style.cssText = 'font-weight: 500; cursor: pointer; font-size: 1.1em; padding: 5px 0;';
        details.appendChild(summary);
        
        const content = document.createElement('div');
        content.style.cssText = 'margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--color-border, #e0e0e0); line-height: 1.7;';
        content.textContent = wt.content;
        details.appendChild(content);
        
        container.appendChild(details);
      });
    }
    
    // "How & Why It Works" section
    if (tool.howWhyWorks) {
      const howWhySection = document.createElement('div');
      howWhySection.style.cssText = 'margin-top: 40px; padding: 24px; background: var(--color-bg, #f5f5f5); border-radius: 8px;';
      
      const h2 = document.createElement('h2');
      h2.textContent = 'How & Why It Works';
      h2.style.cssText = 'margin: 0 0 16px 0;';
      howWhySection.appendChild(h2);
      
      const howWhyContent = document.createElement('p');
      howWhyContent.textContent = tool.howWhyWorks;
      howWhyContent.style.cssText = 'line-height: 1.7; color: var(--color-text, #1a1a1a);';
      howWhySection.appendChild(howWhyContent);
      
      container.appendChild(howWhySection);
    }
    
    // Citations section
    if (tool.citations && Array.isArray(tool.citations) && tool.citations.length > 0) {
      const citationsSection = document.createElement('div');
      citationsSection.style.cssText = 'margin-top: 30px; padding: 24px; background: var(--color-bg-secondary, #ffffff); border: 1px solid var(--color-border, #e0e0e0); border-radius: 8px;';
      
      const h2 = document.createElement('h2');
      h2.textContent = 'References & Citations';
      h2.style.cssText = 'margin: 0 0 16px 0;';
      citationsSection.appendChild(h2);
      
      const citationsList = document.createElement('ul');
      citationsList.style.cssText = 'list-style: none; padding: 0; margin: 0;';
      
      tool.citations.forEach(citation => {
        const li = document.createElement('li');
        li.style.cssText = 'margin: 12px 0; padding-left: 20px; position: relative;';
        
        const citationText = document.createElement('span');
        citationText.style.cssText = 'display: block; line-height: 1.6;';
        
        if (citation.title) {
          const title = document.createElement('strong');
          title.textContent = citation.title;
          citationText.appendChild(title);
        }
        
        if (citation.source) {
          const source = document.createElement('span');
          source.textContent = ` — ${citation.source}`;
          source.style.cssText = 'color: var(--color-text-secondary, #666);';
          citationText.appendChild(source);
        }
        
        if (citation.year) {
          const year = document.createElement('span');
          year.textContent = ` (${citation.year})`;
          year.style.cssText = 'color: var(--color-text-secondary, #666);';
          citationText.appendChild(year);
        }
        
        if (citation.url) {
          const link = document.createElement('a');
          link.href = citation.url;
          link.textContent = ' View source';
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.style.cssText = 'color: var(--color-accent, #667eea); text-decoration: none; margin-left: 8px;';
          citationText.appendChild(link);
        }
        
        li.appendChild(citationText);
        citationsList.appendChild(li);
      });
      
      citationsSection.appendChild(citationsList);
      container.appendChild(citationsSection);
    }
    
    // Related tools navigation
    if (tool.gateIds && Array.isArray(tool.gateIds) && tool.gateIds.length > 0) {
      const relatedSection = document.createElement('div');
      relatedSection.style.cssText = 'margin-top: 30px; padding: 20px; background: var(--color-bg, #f5f5f5); border-radius: 8px;';
      
      const h3 = document.createElement('h3');
      h3.textContent = 'Related Tools';
      h3.style.cssText = 'margin: 0 0 12px 0;';
      relatedSection.appendChild(h3);
      
      // Find related tools in same gates
      const relatedTools = tools.filter(t => {
        if (!t.gateIds || !Array.isArray(t.gateIds)) return false;
        return t.id !== tool.id && tool.gateIds.some(gid => t.gateIds.includes(gid));
      }).slice(0, 3);
      
      if (relatedTools.length > 0) {
        const relatedList = document.createElement('ul');
        relatedList.style.cssText = 'list-style: none; padding: 0; margin: 0;';
        
        relatedTools.forEach(relatedTool => {
          const li = document.createElement('li');
          li.style.cssText = 'margin: 8px 0;';
          
          const link = document.createElement('a');
          const toolSlug = relatedTool.slug || relatedTool.id;
          link.href = buildToolUrl(toolSlug);
          link.textContent = relatedTool.title || relatedTool.name || relatedTool.id;
          link.style.cssText = 'color: var(--color-accent, #667eea); text-decoration: none;';
          link.onclick = (e) => {
            e.preventDefault();
            window.location.href = buildToolUrl(toolSlug);
          };
          
          li.appendChild(link);
          relatedList.appendChild(li);
        });
        
        relatedSection.appendChild(relatedList);
      } else {
        const p = document.createElement('p');
        p.textContent = 'Explore more tools in the Tools section.';
        p.style.cssText = 'color: var(--color-text-secondary, #666); margin: 0;';
        relatedSection.appendChild(p);
      }
      
      container.appendChild(relatedSection);
    }
    
    // Back to search link
    const back = document.createElement('a');
    back.href = '/';
    back.textContent = '← Back to Search';
    back.style.cssText = 'display: inline-block; margin-top: 30px; color: var(--color-accent, #667eea); text-decoration: none; font-weight: 500;';
    container.appendChild(back);
  }
  
  // Navigate to route
  function navigate(hash) {
    window.location.hash = hash;
    handleRoute();
  }
  
  // Handle current route
  function handleRoute() {
    const hash = window.location.hash || '#';
    const route = parseRoute(hash);
    currentRoute = route;
    
    console.log('[RYD] router: handling route', route);
    
    if (route.type === 'search') {
      const results = search(route.query);
      renderSearchResults(route.query, results);
    } else if (route.type === 'tool') {
      renderTool(route.toolId);
    } else if (route.type === 'gate') {
      renderGateView(route.gateId);
    } else if (route.type === 'pain') {
      renderPainPointView(route.gateId, route.painPointId);
    } else {
      // Home - show landing page (clear router content)
      const container = document.getElementById('routerContent') ||
                       document.getElementById('searchResults') ||
                       document.getElementById('toolView') ||
                       document.getElementById('mainContent');
      if (container) {
        container.innerHTML = '';
      }
    }
  }
  
  // Initialize
  loadData().then(() => {
    // Handle initial route
    handleRoute();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleRoute);
    
    console.log('[RYD] router: ready');
  });
  
  // Expose API
  window.RYD_ROUTER = {
    where_it_came_from: {
      origin: "internal",
      basis: "built for Ride Your Demons platform",
      source_type: "system-utility",
      verified: true
    },
    navigate,
    search,
    getCurrentRoute: () => currentRoute,
    getTools: () => tools,
    getGates: () => gates,
    getPainPoints: () => painPoints
  };
})();

