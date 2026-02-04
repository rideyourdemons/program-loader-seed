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
    /\bcreate account\b/gi,
    /^Login\s*\r?\n/i,  // "Login\r\n..." at start
    /Login\s*\r?\n\s*\r?\n/i  // "Login\r\n\r\n..." pattern
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
    
    // Tripwire: detect remaining login patterns
    if (cleaned && /login|log\s*in|sign\s*in|sign\s*up|get\s*started/i.test(cleaned)) {
      console.warn('[RYD UI] Login leak detected:', {
        title: title || 'unknown',
        raw: String(raw || '').substring(0, 100),
        sanitized: cleaned.substring(0, 100)
      });
    }
    
    return cleaned;
  }

  function sanitizeMetaLine(raw, title) {
    if (!raw) return '';
    let cleaned = stripHtml(raw);
    cleaned = stripLoginText(cleaned);
    cleaned = removeTitleEcho(cleaned, title);
    cleaned = normalizeWhitespace(cleaned);
    
    // Tripwire: detect remaining login patterns
    if (cleaned && /login|log\s*in|sign\s*in|sign\s*up|get\s*started/i.test(cleaned)) {
      console.warn('[RYD UI] Login leak in meta line:', {
        title: title || 'unknown',
        raw: String(raw || '').substring(0, 100),
        sanitized: cleaned.substring(0, 100)
      });
    }
    
    return cleaned;
  }

  // DOM-level tripwire: scan rendered tool descriptions for login leaks
  function scanForLoginLeaks() {
    if (typeof document === 'undefined') return;
    
    const toolDescriptions = document.querySelectorAll('.tool-description, [class*="tool"] p, .tool-card p');
    toolDescriptions.forEach(el => {
      const text = el.textContent || '';
      if (/login|log\s*in|sign\s*in|sign\s*up|get\s*started/i.test(text)) {
        const toolTitle = el.closest('.tool-card, .card')?.querySelector('h3, h4, h5, .tool-title')?.textContent || 'unknown';
        console.warn('[RYD UI] DOM tripwire: Login leak detected in rendered text:', {
          tool: toolTitle,
          element: el.className,
          text: text.substring(0, 150)
        });
      }
    });
  }

  // Run scan after DOM is ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(scanForLoginLeaks, 1000);
      });
    } else {
      setTimeout(scanForLoginLeaks, 1000);
    }
  }

  window.RYD_UI = {
    sanitizeDescription,
    sanitizeMetaLine,
    scanForLoginLeaks
  };
})();
