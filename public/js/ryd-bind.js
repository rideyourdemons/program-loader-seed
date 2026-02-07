/**
 * RYD UI Binder Module
 * Binds Tool of the Day, Search, and Insights to the canonical boot signal
 * Uses textContent to prevent encoding issues and injection
 */

(function() {
  'use strict';
  
  console.log('[RYD] bind starting');

  function sanitizeDescription(raw, title) {
    if (window.RYD_UI && typeof window.RYD_UI.sanitizeDescription === 'function') {
      return window.RYD_UI.sanitizeDescription(raw, title);
    }
    return String(raw || '').trim();
  }
  
  // Tool of the Day rendering
  function renderToolOfDay(tool) {
    if (!tool) {
      showFallback('No tool available');
      return;
    }
    
    // Find container
    const container = document.getElementById('tool-of-the-day') ||
                     document.querySelector('[data-tool-of-day]') ||
                     document.querySelector('.tool-of-day');
    
    if (!container) {
      console.log('[RYD] no Tool of the Day container found');
      return;
    }
    
    // Find elements
    const titleEl = document.getElementById('toolTitle') || 
                   container.querySelector('.tool-title') ||
                   container.querySelector('h3');
    
    const descEl = document.getElementById('toolDescription') ||
                  container.querySelector('.tool-description') ||
                  container.querySelector('p');
    
    const durationEl = document.getElementById('toolDuration');
    const difficultyEl = document.getElementById('toolDifficulty');
    const errorEl = document.getElementById('toolError');
    
    // Remove "Loading..." text
    if (titleEl && titleEl.textContent.trim() === 'Loading...') {
      titleEl.textContent = '';
    }
    
    // Update content using textContent (safe, no encoding issues)
    if (titleEl) {
      titleEl.textContent = tool.title || 'Grounding Reset';
    }
    
    if (descEl) {
      const raw = tool.description || tool.summary || '';
      const cleaned = sanitizeDescription(raw, tool.title || tool.name);
      descEl.textContent = cleaned || 'A practical self-help tool for personal growth and well-being.';
    }
    
    if (durationEl) {
      durationEl.textContent = tool.duration || '5 minutes';
    }
    
    if (difficultyEl) {
      difficultyEl.textContent = tool.difficulty || 'beginner';
      if (difficultyEl.className) {
        difficultyEl.className = `badge badge-${tool.difficulty || 'beginner'}`;
      }
    }
    
    // Clear errors
    if (errorEl) {
      errorEl.style.display = 'none';
    }
    
    // Add CTA link if container supports it
    const ctaEl = container.querySelector('.tool-cta') || 
                  container.querySelector('a[href*="tools"]');
    if (ctaEl && tool.cta) {
      ctaEl.href = tool.cta;
    }
    
    console.log('[RYD] Tool of the Day rendered:', tool.title || tool.id);
  }
  
  // Fallback rendering
  function showFallback(message) {
    const container = document.getElementById('tool-of-the-day') ||
                     document.querySelector('[data-tool-of-day]') ||
                     document.querySelector('.tool-of-day');
    
    if (!container) return;
    
    const titleEl = document.getElementById('toolTitle') || 
                   container.querySelector('.tool-title');
    const errorEl = document.getElementById('toolError');
    
    if (titleEl) {
      titleEl.textContent = 'Grounding Reset';
    }
    
    if (errorEl) {
      errorEl.textContent = message || 'Unable to load tool data';
      errorEl.style.display = 'block';
      
      // Add retry button
      const retryBtn = document.createElement('button');
      retryBtn.textContent = 'Retry';
      retryBtn.style.cssText = 'margin-left: 8px; padding: 4px 8px; background: var(--color-accent, #667eea); color: white; border: none; border-radius: 4px; cursor: pointer;';
      retryBtn.onclick = () => location.reload();
      errorEl.appendChild(retryBtn);
    }
  }
  
  // Search binding
  function bindSearch() {
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
      if (e) e.preventDefault();
      
      const query = (searchInput.value || '').trim().toLowerCase();
      if (!query) return;
      
      const tools = window.RYD.getTools() || [];
      
      // Filter tools
      const matches = tools.filter(tool => {
        const searchable = [
          tool.title || '',
          tool.id || '',
          tool.category || '',
          tool.summary || '',
          tool.description || ''
        ].join(' ').toLowerCase();
        return searchable.includes(query);
      });
      
      // Store results
      try {
        sessionStorage.setItem('ryd:lastSearch', JSON.stringify({
          query: query,
          matches: matches,
          timestamp: Date.now()
        }));
      } catch (e) {
        // Ignore sessionStorage errors
      }
      
      // Always redirect to /tools with query
      const url = `/tools?q=${encodeURIComponent(query)}`;
      window.location.href = url;
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
  }
  
  // Insights hydration
  function hydrateInsights() {
    const container = document.getElementById('insights-list') ||
                     document.getElementById('insights-container') ||
                     document.querySelector('[data-insights]');
    
    if (!container) {
      // Console safety: log once, exit silently
      if (!window._rydBindInsightsWarned) {
        console.log('[RYD] no insights container found (this is OK if insights section is not on this page)');
        window._rydBindInsightsWarned = true;
      }
      return;
    }
    
    const tools = window.RYD.getTools() || [];
    
    if (tools.length === 0) {
      container.textContent = 'No insights available at this time.';
      return;
    }
    
    // Simple list rendering (can be enhanced later)
    const list = document.createElement('ul');
    tools.slice(0, 10).forEach(tool => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      const slug = encodeURIComponent(String(tool.slug || tool.id || tool.title || tool.name || '').trim());
      link.href = `/tools/tool.html?slug=${slug}`;
      link.textContent = tool.title || tool.id;
      li.appendChild(link);
      list.appendChild(li);
    });
    
    container.innerHTML = '';
    container.appendChild(list);
    
    console.log('[RYD] insights hydrated');
  }
  
  // Main bind function
  function bind() {
    if (window.RYD.status === 'ready') {
      const tool = window.RYD.pickToolOfDay();
      renderToolOfDay(tool);
      hydrateInsights();
    } else if (window.RYD.status === 'error') {
      showFallback(window.RYD.error || 'Unable to load data');
    }
    
    // Always bind search (works even without matrix)
    bindSearch();
  }
  
  // Listen for ready/error events
  window.addEventListener('ryd:ready', (e) => {
    console.log('[RYD] bind: ready event received');
    const tool = window.RYD.pickToolOfDay();
    renderToolOfDay(tool);
    hydrateInsights();
  });
  
  window.addEventListener('ryd:error', (e) => {
    console.log('[RYD] bind: error event received');
    showFallback(window.RYD.error || 'Unable to load data');
  });
  
  // Bind on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
  
  // Also bind after a short delay (in case boot finishes first)
  setTimeout(bind, 100);
})();

