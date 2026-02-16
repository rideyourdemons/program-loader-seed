/**
 * Tool Collapse Toggle
 * Handles expand/collapse for tool details sections
 */

(function() {
  'use strict';

  function initToolCollapse() {
    const toggleButtons = document.querySelectorAll('.tool-toggle');
    
    if (toggleButtons.length === 0) {
      return; // No tool cards found, exit silently
    }

    toggleButtons.forEach(button => {
      button.addEventListener('click', function() {
        const details = this.parentElement.querySelector('.tool-details');
        
        if (!details) {
          return; // Failsafe: no details found, do nothing
        }

        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        
        if (isExpanded) {
          details.setAttribute('hidden', '');
          this.setAttribute('aria-expanded', 'false');
          this.textContent = 'Show details';
        } else {
          details.removeAttribute('hidden');
          this.setAttribute('aria-expanded', 'true');
          this.textContent = 'Hide details';
        }
      });
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initToolCollapse);
  } else {
    initToolCollapse();
  }
})();
