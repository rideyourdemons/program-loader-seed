/**
 * RYD Tool Text Utils
 * - getToolPreview(tool): short blurb for cards (no full description, no raw ##).
 * - renderMarkdownSafe(text): safe minimal markdown for expanded view only.
 */
(function () {
  'use strict';

  var MAX_PREVIEW = 240;

  function escapeHtml(str) {
    if (!str || typeof str !== 'string') return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Get a short preview for tool cards. Prefer tool.summary; else derive from description.
   * Strips markdown headings, code fences, collapses whitespace, caps at 240 chars on sentence boundary.
   */
  function getToolPreview(tool) {
    if (!tool || typeof tool !== 'object') return '';
    var raw = (tool.summary && String(tool.summary).trim()) || '';
    if (raw.length > 0) return raw.replace(/\s+/g, ' ').trim();
    raw = (tool.description && String(tool.description)) || '';
    if (!raw) return '';

    raw = raw
      .replace(/^#+\s*.*$/gm, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]*`/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!raw) return '';

    if (raw.length <= MAX_PREVIEW) return raw;
    var slice = raw.slice(0, MAX_PREVIEW);
    var lastDot = slice.lastIndexOf('.');
    var lastQ = Math.max(slice.lastIndexOf('?'), slice.lastIndexOf('!'));
    var last = lastDot > lastQ ? lastDot : lastQ;
    if (last > MAX_PREVIEW * 0.5) slice = slice.slice(0, last + 1);
    else slice = slice.trim();
    return slice + (slice === raw ? '' : '\u2026');
  }

  /**
   * Render markdown-safe for expanded view only. Minimal: ## -> h3, ### -> h4, paragraphs, line breaks.
   * Escapes HTML by default; only creates safe tags.
   */
  function renderMarkdownSafe(text) {
    if (!text || typeof text !== 'string') return '';
    var escaped = escapeHtml(text);
    return escaped
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h3>$1</h3>')
      .replace(/\n\n+/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<h[34]>)/g, '$1')
      .replace(/(<\/h[34]>)<\/p>/g, '$1');
  }

  if (typeof window !== 'undefined') {
    window.RYD_ToolPreview = {
      getToolPreview: getToolPreview,
      renderMarkdownSafe: renderMarkdownSafe,
      escapeHtml: escapeHtml
    };
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getToolPreview, renderMarkdownSafe, escapeHtml };
  }
})();
