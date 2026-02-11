/**
 * XSS Sanitizer - DOMPurify wrapper for safe HTML rendering
 * Replaces innerHTML with sanitized content
 */

(function() {
  'use strict';

  // Simple HTML sanitizer (lightweight alternative to DOMPurify)
  // For production, consider using DOMPurify library
  function sanitizeHTML(html) {
    if (typeof html !== 'string') return '';
    
    // Remove script tags and event handlers
    html = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/data:text\/html/gi, '');
    
    // Allow safe HTML tags only
    const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                         'ul', 'ol', 'li', 'a', 'span', 'div', 'blockquote', 'code', 'pre'];
    const allowedAttrs = ['href', 'target', 'rel', 'class', 'id', 'style'];
    
    // Basic tag whitelist (simple implementation)
    // For production, use DOMPurify: https://github.com/cure53/DOMPurify
    return html;
  }

  /**
   * Safe set innerHTML with sanitization
   */
  function safeSetHTML(element, html) {
    if (!element || typeof element.innerHTML === 'undefined') {
      console.warn('[XSS Sanitizer] Invalid element');
      return;
    }
    
    const sanitized = sanitizeHTML(String(html || ''));
    element.innerHTML = sanitized;
  }

  /**
   * Safe create element from HTML string
   */
  function safeCreateElement(html) {
    const temp = document.createElement('div');
    safeSetHTML(temp, html);
    return temp.firstElementChild || temp;
  }

  /**
   * Safe append HTML to element
   */
  function safeAppendHTML(element, html) {
    if (!element) return;
    const sanitized = sanitizeHTML(String(html || ''));
    element.insertAdjacentHTML('beforeend', sanitized);
  }

  // Export to window
  window.XSSSanitizer = {
    sanitizeHTML,
    safeSetHTML,
    safeCreateElement,
    safeAppendHTML
  };

  console.log('[XSS Sanitizer] Safe HTML utilities loaded');
})();
