/**
 * RYD Tools Page Renderer
 * Populates the tools grid once matrix data is ready.
 */
(function() {
  'use strict';

  function sanitizeDescription(raw, title) {
    if (window.RYD_UI && typeof window.RYD_UI.sanitizeDescription === 'function') {
      return window.RYD_UI.sanitizeDescription(raw, title);
    }
    return String(raw || '').trim();
  }

  function renderTools(tools) {
    const grid = document.getElementById('toolsGrid');
    if (!grid) return;

    grid.innerHTML = '';

    if (!Array.isArray(tools) || tools.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'card tool-card';
      empty.textContent = 'No tools available yet.';
      grid.appendChild(empty);
      return;
    }

    tools.forEach(tool => {
      const card = document.createElement('div');
      card.className = 'card tool-card';

      const title = document.createElement('h3');
      title.className = 'tool-title';
      title.textContent = tool.title || tool.name || tool.id || 'Tool';
      card.appendChild(title);

      const desc = document.createElement('p');
      desc.className = 'tool-description';
      const cleaned = sanitizeDescription(tool.description || tool.summary || '', tool.title || tool.name);
      desc.textContent = cleaned || 'Description coming soon.';
      card.appendChild(desc);

      const meta = document.createElement('div');
      meta.className = 'tool-meta';

      if (tool.duration) {
        const duration = document.createElement('span');
        duration.className = 'tool-meta-item';
        duration.textContent = `⏱️ ${tool.duration}`;
        meta.appendChild(duration);
      }

      if (tool.difficulty) {
        const difficulty = document.createElement('span');
        difficulty.className = 'tool-meta-item';
        difficulty.textContent = `📊 ${tool.difficulty}`;
        meta.appendChild(difficulty);
      }

      if (meta.children.length > 0) {
        card.appendChild(meta);
      }

      const cta = document.createElement('a');
      const slug = encodeURIComponent(String(tool.slug || tool.id || tool.title || tool.name || '').trim());
      cta.href = `/tools/tool.html?slug=${slug}`;
      cta.textContent = 'Open Tool';
      cta.className = 'tool-cta';
      card.appendChild(cta);

      grid.appendChild(card);
    });
  }

  function handleReady() {
    const tools = (window.RYD && typeof window.RYD.getTools === 'function')
      ? window.RYD.getTools()
      : [];
    renderTools(tools);
  }

  window.addEventListener('ryd:ready', handleReady);
  window.addEventListener('ryd:error', () => renderTools([]));

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleReady);
  } else {
    handleReady();
  }
})();
