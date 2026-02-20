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

    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const validator = window.RYD_ToolValidator;
    const expander = window.RYD_ToolExpander;

    tools.forEach(tool => {
      let currentTool = tool;
      let quality = validator && validator.validateToolQuality ? validator.validateToolQuality(currentTool, tools) : { ok: true };
      if (!quality.ok && isDev && expander && typeof expander.expandToolContent === 'function') {
        try {
          currentTool = expander.expandToolContent(currentTool);
          quality = validator && validator.validateToolQuality ? validator.validateToolQuality(currentTool, tools) : quality;
        } catch (e) {
          console.warn('[RYD Tools] Expand failed for', currentTool.id || currentTool.slug, e.message);
        }
      }
      const validation = validator && validator.validateTool ? validator.validateTool(currentTool) : { ok: false, errors: [] };
      const eligible = validator && validator.isEligibleForLists ? validator.isEligibleForLists(currentTool, tools) : true;
      if (!validation.ok) {
        if (validator && validator.logValidationOnce) {
          validator.logValidationOnce(currentTool.id || currentTool.slug || currentTool.title, validation.errors);
        }
        if (!isDev) return;
      }

      const card = document.createElement('div');
      card.className = 'card tool-card';

      const title = document.createElement('h3');
      title.className = 'tool-title';
      title.textContent = currentTool.title || currentTool.name || currentTool.id || 'Tool';
      if ((!validation.ok || !eligible) && isDev) {
        const badge = document.createElement('span');
        badge.textContent = eligible ? ' NEEDS CONTENT' : ' DRAFT';
        badge.style.cssText = 'font-size: 0.65em; color: #ff9800; font-weight: 600;';
        title.appendChild(badge);
      }
      card.appendChild(title);

      const desc = document.createElement('p');
      desc.className = 'tool-description';
      const preview = window.RYD_ToolPreview && typeof window.RYD_ToolPreview.getToolPreview === 'function'
        ? window.RYD_ToolPreview.getToolPreview(currentTool)
        : null;
      const cleaned = (typeof preview === 'string' && preview.trim())
        ? preview.trim()
        : (window.RYD_UI && typeof window.RYD_UI.sanitizeDescription === 'function'
            ? window.RYD_UI.sanitizeDescription(validator && validator.getContentSafe ? validator.getContentSafe(currentTool, 'description') : (currentTool.description || currentTool.summary || ''), currentTool.title || currentTool.name)
            : String((validator && validator.getContentSafe ? validator.getContentSafe(currentTool, 'description') : (currentTool.description || currentTool.summary || '')) || '').trim()) || 'Content needs review.';
      desc.textContent = cleaned;
      card.appendChild(desc);

      const meta = document.createElement('div');
      meta.className = 'tool-meta';

      if (currentTool.duration) {
        const duration = document.createElement('span');
        duration.className = 'tool-meta-item';
        duration.textContent = `⏱️ ${currentTool.duration}`;
        meta.appendChild(duration);
      }

      if (currentTool.difficulty) {
        const difficulty = document.createElement('span');
        difficulty.className = 'tool-meta-item';
        difficulty.textContent = `📊 ${currentTool.difficulty}`;
        meta.appendChild(difficulty);
      }

      if (meta.children.length > 0) {
        card.appendChild(meta);
      }

      const cta = document.createElement('a');
      const slug = encodeURIComponent(String(currentTool.slug || currentTool.id || currentTool.title || currentTool.name || '').trim());
      cta.href = `/tools/tool.html?slug=${slug}`;
      cta.textContent = 'Open Tool';
      cta.className = 'tool-cta';
      card.appendChild(cta);

      grid.appendChild(card);
    });
  }

  function handleReady() {
    let tools = (window.RYD && typeof window.RYD.getTools === 'function')
      ? window.RYD.getTools()
      : [];
    if (window.RYD_ToolVariant && window.RYD_ToolVariant.filterPrimaryTools) {
      tools = window.RYD_ToolVariant.filterPrimaryTools(tools);
    }
    const isProd = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    if (window.RYD_ToolValidator && window.RYD_ToolValidator.filterToolsForList) {
      tools = window.RYD_ToolValidator.filterToolsForList(tools, isProd);
    }
    renderTools(tools);
  }

  window.addEventListener('ryd:ready', handleReady);
  window.addEventListener('ryd:error', (e) => {
    const grid = document.getElementById('toolsGrid');
    if (!grid) return;
    const err = (e && e.detail && e.detail.error) ? new Error(String(e.detail.error)) : new Error('Tool registry failed');
    grid.innerHTML = '';
    const panel = document.createElement('div');
    panel.className = 'card';
    panel.style.cssText = 'border-left: 4px solid #d32f2f; background: #ffebee; padding: 20px; color: #c53030;';
    panel.innerHTML = '<h3 style="margin-bottom:12px;">Data Load Error</h3><p>' + (err.message || 'Tool registry failed') + '</p><p style="font-size:0.9em;">Data source: registry / tools.json</p><button onclick="window.location.reload()" style="margin-top:12px;padding:8px 16px;background:#667eea;color:white;border:none;border-radius:4px;cursor:pointer;">Retry</button>';
    grid.appendChild(panel);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleReady);
  } else {
    handleReady();
  }
})();
