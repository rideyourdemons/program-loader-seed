/**
 * RYD Navigation - Pain-First Search & Routing
 * Routes: Pain Search → Gate → Pain Point → Tool → Work-Through
 */

(function() {
  'use strict';
  
  console.log('[RYD] ryd-navigation boot');
  
  // Load truth data
  let gates = [];
  let painPoints = {};
  let tools = [];
  
  async function loadTruthData() {
    const gatesUrl = '/data/gates.json?ts=' + Date.now();
    const painPointsUrl = '/data/pain-points.json?ts=' + Date.now();
    const canonicalToolsUrl = '/store/tools.canonical.json?ts=' + Date.now();
    const fallbackToolsUrl = '/data/tools.json?ts=' + Date.now();
    
    console.log('[RYD] Loading JSON files:');
    console.log('  -', gatesUrl);
    console.log('  -', painPointsUrl);
    console.log('  -', canonicalToolsUrl, '(canonical)');
    console.log('  -', fallbackToolsUrl, '(fallback)');
    
    try {
      const [gatesRes, painPointsRes, canonicalToolsRes, fallbackToolsRes] = await Promise.all([
        fetch(gatesUrl),
        fetch(painPointsUrl),
        fetch(canonicalToolsUrl).catch(() => ({ ok: false })),
        fetch(fallbackToolsUrl)
      ]);
      
      if (gatesRes.ok) {
        const gatesData = await gatesRes.json();
        gates = gatesData.gates || [];
        console.log('[RYD] Gates loaded:', gates.length);
      } else {
        console.warn('[RYD] Gates fetch failed:', gatesRes.status, gatesRes.statusText);
      }
      
      if (painPointsRes.ok) {
        const painPointsData = await painPointsRes.json();
        painPoints = painPointsData.painPoints || {};
        console.log('[RYD] Pain points loaded:', Object.keys(painPoints).length, 'gates');
      } else {
        console.warn('[RYD] Pain points fetch failed:', painPointsRes.status, painPointsRes.statusText);
      }
      
      // Try canonical tools first
      let toolsSource = 'fallback';
      if (canonicalToolsRes.ok) {
        try {
          const toolsData = await canonicalToolsRes.json();
          tools = Array.isArray(toolsData) ? toolsData : (toolsData.tools || []);
          toolsSource = 'canonical';
          console.log('[RYD] Tools loaded:', tools.length, '(canonical)');
        } catch (parseErr) {
          console.warn('[RYD] Failed to parse canonical tools, using fallback', parseErr);
        }
      }
      
      // Fallback to existing tools.json if canonical not available
      if (tools.length === 0 && fallbackToolsRes.ok) {
        const toolsData = await fallbackToolsRes.json();
        tools = toolsData.tools || [];
        toolsSource = 'fallback';
        console.warn('[RYD] Tools loaded:', tools.length, '(fallback - canonical not found)');
      } else if (tools.length === 0) {
        console.warn('[RYD] Tools fetch failed:', fallbackToolsRes.status, fallbackToolsRes.statusText);
      }
      
      console.log(`[RYD] base tools loaded: ${tools.length} (${toolsSource})`);
      console.log('[RYD] Navigation data loaded:', {
        gates: gates.length,
        painPointGates: Object.keys(painPoints).length,
        tools: tools.length
      });
    } catch (err) {
      console.error('[RYD] Failed to load navigation data:', err);
    }
  }
  
  // Pain-first search: classify query → Gate → Pain Point → Tools
  function classifyPain(query) {
    const normalized = query.toLowerCase().trim();
    
    // Simple keyword matching (in production, use proper NLP/classification)
    const gateKeywords = {
      'mens-mental-health': ['men', 'male', 'man', 'numb', 'discipline', 'confidence'],
      'womens-mental-health': ['women', 'female', 'mother', 'menopause', 'cycle'],
      'addiction-recovery': ['addiction', 'substance', 'recovery', 'sobriety'],
      'fathers-and-sons': ['father', 'dad', 'son', 'parent', 'family'],
      'teen-and-gen-z': ['teen', 'gen z', 'school', 'youth', 'college'],
      'grief-and-loss': ['grief', 'loss', 'death', 'mourning', 'bereavement'],
      'financial-collapse-and-purpose': ['money', 'financial', 'debt', 'broke', 'purpose'],
      'trauma-rebuild': ['trauma', 'abuse', 'violence', 'ptsd', 'trigger'],
      'heartbreak-loop': ['heartbreak', 'breakup', 'relationship', 'divorce'],
      'identity-crisis': ['identity', 'who am i', 'self', 'confused'],
      'full-resurrection-system': ['resurrection', 'rebuild', 'restart', 'system'],
      'loneliness': ['lonely', 'isolated', 'alone', 'disconnected']
    };
    
    // Find best matching gate
    let bestGate = null;
    let bestScore = 0;
    
    Object.keys(gateKeywords).forEach(gateId => {
      const keywords = gateKeywords[gateId];
      const score = keywords.filter(kw => normalized.includes(kw)).length;
      if (score > bestScore) {
        bestScore = score;
        bestGate = gateId;
      }
    });
    
    if (!bestGate) {
      // Default to first gate if no match
      bestGate = gates.length > 0 ? gates[0].id : null;
    }
    
    // Find best matching pain point in that gate
    const gatePainPoints = painPoints[bestGate] || [];
    let bestPainPoint = null;
    let bestPainScore = 0;
    
    gatePainPoints.forEach(pp => {
      const score = pp.title.toLowerCase().includes(normalized) ? 2 : 
                   pp.id.toLowerCase().includes(normalized) ? 1 : 0;
      if (score > bestPainScore) {
        bestPainScore = score;
        bestPainPoint = pp;
      }
    });
    
    // Find relevant tools (match by keywords/tags)
    const relevantTools = tools.filter(tool => {
      if (!tool.title || !tool.description) return false;
      const searchable = [
        tool.title,
        tool.description,
        tool.slug,
        ...(tool.tags || [])
      ].join(' ').toLowerCase();
      return searchable.includes(normalized);
    });
    
    return {
      gate: bestGate,
      painPoint: bestPainPoint,
      tools: relevantTools.slice(0, 5), // Top 5 matches
      query: normalized
    };
  }
  
  // Route handlers
  window.RYD_NAV = {
    search: function(query) {
      const result = classifyPain(query);
      
      // Store in session for results page
      try {
        sessionStorage.setItem('ryd:searchResult', JSON.stringify(result));
      } catch (e) {
        // Ignore sessionStorage errors
      }
      
      // Navigate to search results
      const url = `/search?q=${encodeURIComponent(query)}`;
      window.location.href = url;
    },
    
    goToGate: function(gateId) {
      window.location.href = `/gates/${gateId}`;
    },
    
    goToPainPoint: function(gateId, painPointId) {
      window.location.href = `/gates/${gateId}/${painPointId}`;
    },
    
    goToTool: function(slug) {
      const safeSlug = encodeURIComponent(String(slug || '').trim());
      window.location.href = `/tools/tool.html?slug=${safeSlug}`;
    },
    
    goToWorkthrough: function(slug, type) {
      window.location.href = `/tools/${slug}/${type}`;
    },
    
    init: function() {
      loadTruthData();
    }
  };
  
  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.RYD_NAV.init());
  } else {
    window.RYD_NAV.init();
  }
})();

