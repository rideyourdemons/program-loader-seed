/**
 * Encoding Guard - Dev-only regression check
 * Scans UI for corrupted characters after page load
 */

(function() {
  'use strict';
  
  // Only run in development (localhost)
  if (window.location.hostname !== 'localhost' && 
      window.location.hostname !== '127.0.0.1' &&
      !window.location.hostname.includes('localhost')) {
    return;
  }
  
  function checkForCorruption() {
    const corrupted = ['Â', 'Ã', ''', '–', '"', '"'];
    const issues = [];
    
    // Check buttons
    document.querySelectorAll('button').forEach(btn => {
      const text = btn.textContent || btn.innerText || '';
      corrupted.forEach(char => {
        if (text.includes(char)) {
          issues.push({
            element: 'button',
            text: text.substring(0, 50),
            location: 'button text'
          });
        }
      });
    });
    
    // Check links
    document.querySelectorAll('a').forEach(link => {
      const text = link.textContent || link.innerText || '';
      corrupted.forEach(char => {
        if (text.includes(char)) {
          issues.push({
            element: 'link',
            text: text.substring(0, 50),
            location: 'link text'
          });
        }
      });
    });
    
    // Check headings
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
      const text = heading.textContent || heading.innerText || '';
      corrupted.forEach(char => {
        if (text.includes(char)) {
          issues.push({
            element: heading.tagName.toLowerCase(),
            text: text.substring(0, 50),
            location: 'heading'
          });
        }
      });
    });
    
    if (issues.length > 0) {
      console.error('[RYD] Encoding corruption detected:', issues);
      issues.forEach(issue => {
        console.error(`  - ${issue.element}: "${issue.text}" (${issue.location})`);
      });
    } else {
      console.log('[RYD] Encoding check passed - no corruption detected');
    }
  }
  
  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(checkForCorruption, 1000);
    });
  } else {
    setTimeout(checkForCorruption, 1000);
  }
})();

