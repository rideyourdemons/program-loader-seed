/**
 * UI Sanitizer
 *
 * Canonical data (SEO/meta) must be cleaned before rendering to UI.
 * This does NOT mutate source objects.
 */
(function() {
  'use strict';

  const CTA_PATTERNS = [
    /\blogin\b/gi,
    /\blog in\b/gi,
    /\bsign in\b/gi,
    /\bsign up\b/gi,
    /\bget started\b/gi,
    /\bstart now\b/gi,
    /\bjoin now\b/gi,
    /\bsubscribe\b/gi,
    /\bcreate account\b/gi
  ];

  function stripHtml(raw) {
    return String(raw || '').replace(/<[^>]*>/g, ' ');
  }

  function normalizeWhitespace(raw) {
    return String(raw || '').replace(/\s+/g, ' ').trim();
  }

  function stripLoginText(raw) {
    let cleaned = String(raw || '');
    CTA_PATTERNS.forEach((pattern) => {
      cleaned = cleaned.replace(pattern, ' ');
    });
    return cleaned;
  }

  function removeTitleEcho(raw, title) {
    if (!title) return raw;
    const safeTitle = normalizeWhitespace(title);
    if (!safeTitle) return raw;
    const escaped = safeTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return String(raw || '').replace(new RegExp(escaped, 'gi'), ' ');
  }

  function sanitizeDescription(raw, title) {
    if (!raw) return '';
    let cleaned = stripHtml(raw);
    cleaned = stripLoginText(cleaned);
    cleaned = removeTitleEcho(cleaned, title);
    cleaned = normalizeWhitespace(cleaned);
    return cleaned;
  }

  window.RYD_UI = {
    sanitizeDescription
  };
})();
