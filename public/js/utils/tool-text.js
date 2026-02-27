/**
 * RYD Tool Text Utils
 * - getToolPreview(tool): short blurb for cards (no full description, no raw ##).
 * - getToolMechanismPreview(tool): first 220 chars from "How & Why It Works", plain text.
 * - getToolActionCardData(tool, opts): { title, forWhen, whyThisWorks, toolHref } for 3-part action cards.
 * - renderMarkdownSafe(text): safe minimal markdown for expanded view only.
 */
(function () {
  'use strict';

  var MAX_PREVIEW = 240;
  var MAX_MECHANISM = 220;
  var MAX_FOR_WHEN_LINE = 120;

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
   * Strip markdown to plain text: headings, bold, code, links, collapse whitespace.
   */
  function stripMarkdown(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/^#+\s*.*$/gm, '')
      .replace(/\*\*([^*]*)\*\*/g, '$1')
      .replace(/\*([^*]*)\*/g, '$1')
      .replace(/__([^_]*)__/g, '$1')
      .replace(/`[^`]*`/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Get first 220 characters from "How & Why It Works" section. Plain text only, no markdown.
   */
  function getToolMechanismPreview(tool) {
    if (!tool || typeof tool !== 'object') return '';
    var raw = (tool.howWhyWorks && String(tool.howWhyWorks).trim()) ||
              (tool.how_it_works && String(tool.how_it_works).trim()) ||
              (tool.mechanism && String(tool.mechanism).trim()) ||
              '';
    if (!raw) return '';
    var plain = stripMarkdown(raw);
    if (plain.length <= MAX_MECHANISM) return plain;
    return plain.slice(0, MAX_MECHANISM).trim() + '\u2026';
  }

  /**
   * Data for 3-part RYD action card: title, For when (1 line), Why this works (mechanism), CTA href.
   * opts: { baseUrl: '/tools/tool.html', gate, painPoint } (query params appended when present).
   */
  function getToolActionCardData(tool, opts) {
    opts = opts || {};
    var title = (tool.title || tool.name || tool.slug || tool.id || 'Tool').trim();
    var summary = (tool.summary && String(tool.summary).trim()) || getToolPreview(tool);
    var forWhen = (summary || '').replace(/\s+/g, ' ').trim();
    if (forWhen.length > MAX_FOR_WHEN_LINE) forWhen = forWhen.slice(0, MAX_FOR_WHEN_LINE).trim() + '\u2026';
    var whyThisWorks = getToolMechanismPreview(tool);
    var slug = (tool.slug || tool.id || '').trim();
    var baseUrl = opts.baseUrl || '/tools/tool.html';
    var href = baseUrl + '?slug=' + encodeURIComponent(slug);
    if (opts.gate) href += '&gate=' + encodeURIComponent(opts.gate);
    if (opts.painPoint) href += '&painPoint=' + encodeURIComponent(opts.painPoint);
    return { title: title, forWhen: forWhen, whyThisWorks: whyThisWorks, toolHref: href };
  }

  /**
   * Build one 3-part RYD action card DOM element. data = getToolActionCardData(tool, opts).
   * Returns a div.ryd-action-card with: title, For when, Why this works, CTA "Use this tool".
   */
  function renderActionCard(data) {
    var card = document.createElement('div');
    card.className = 'card tool-card ryd-action-card';
    var h = document.createElement('h3');
    h.className = 'ryd-action-card-title';
    h.textContent = data.title || 'Tool';
    card.appendChild(h);
    if (data.forWhen) {
      var forWhenLabel = document.createElement('div');
      forWhenLabel.className = 'ryd-action-card-label';
      forWhenLabel.textContent = 'For when:';
      card.appendChild(forWhenLabel);
      var forWhenText = document.createElement('p');
      forWhenText.className = 'ryd-action-card-for-when';
      forWhenText.textContent = data.forWhen;
      card.appendChild(forWhenText);
    }
    if (data.whyThisWorks) {
      var whyLabel = document.createElement('div');
      whyLabel.className = 'ryd-action-card-label';
      whyLabel.textContent = 'Why this works:';
      card.appendChild(whyLabel);
      var whyText = document.createElement('p');
      whyText.className = 'ryd-action-card-why';
      whyText.textContent = data.whyThisWorks;
      card.appendChild(whyText);
    }
    var cta = document.createElement('a');
    cta.href = data.toolHref || '#';
    cta.className = 'btn ryd-action-card-cta';
    cta.textContent = 'Use this tool';
    card.appendChild(cta);
    return card;
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
      getToolMechanismPreview: getToolMechanismPreview,
      getToolActionCardData: getToolActionCardData,
      renderActionCard: renderActionCard,
      stripMarkdown: stripMarkdown,
      renderMarkdownSafe: renderMarkdownSafe,
      escapeHtml: escapeHtml
    };
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getToolPreview, getToolMechanismPreview, getToolActionCardData, renderActionCard, stripMarkdown, renderMarkdownSafe, escapeHtml };
  }
})();
