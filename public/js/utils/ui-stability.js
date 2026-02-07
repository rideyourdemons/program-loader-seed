/**
 * UI Stability Utilities
 * Prevents layout shift by setting min-heights and aspect ratios
 */

(function() {
  'use strict';

  /**
   * Set minimum height for container to prevent layout shift
   */
  function setMinHeight(container, minHeight = '200px') {
    if (!container || !(container instanceof Element)) {
      return;
    }

    // Only set if not already set
    if (!container.style.minHeight) {
      container.style.minHeight = minHeight;
      container.setAttribute('data-ryd-min-height', minHeight);
    }
  }

  /**
   * Set aspect ratio for container
   */
  function setAspectRatio(container, ratio = '16/9') {
    if (!container || !(container instanceof Element)) {
      return;
    }

    container.style.aspectRatio = ratio;
    container.setAttribute('data-ryd-aspect-ratio', ratio);
  }

  /**
   * Initialize stability for all refillable containers
   */
  function initializeStability() {
    // Common container selectors
    const selectors = [
      '#gatesContainer',
      '#toolsGrid',
      '#tool-of-the-day',
      '[data-tool-of-day]',
      '.tool-of-day',
      '#insights-list',
      '#insights-container',
      '[data-insights]',
      '#routerContent',
      '#searchResults',
      '#mainContent',
      '.gates-section',
      '.tools-list',
      '.tool-card'
    ];

    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          // Set min-height based on container type
          if (selector.includes('gates') || selector.includes('tools-list')) {
            setMinHeight(el, '300px');
          } else if (selector.includes('tool-card')) {
            setMinHeight(el, '150px');
          } else if (selector.includes('tool-of-day')) {
            setMinHeight(el, '200px');
          } else {
            setMinHeight(el, '100px');
          }
        });
      });
    });
  }

  /**
   * Add stability CSS to document head
   */
  function injectStabilityCSS() {
    if (document.getElementById('ryd-stability-css')) {
      return; // Already injected
    }

    const style = document.createElement('style');
    style.id = 'ryd-stability-css';
    style.textContent = `
      /* RYD UI Stability - Prevent Layout Shift */
      #gatesContainer,
      #toolsGrid,
      #tool-of-the-day,
      [data-tool-of-day],
      .tool-of-day {
        min-height: 200px;
      }
      
      .gates-section,
      .tools-list {
        min-height: 300px;
      }
      
      .tool-card,
      .gate-card {
        min-height: 150px;
      }
      
      #insights-list,
      #insights-container,
      [data-insights] {
        min-height: 100px;
      }
      
      /* Loading state placeholder */
      .ryd-loading {
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      /* Error state placeholder */
      .ryd-error-boundary {
        min-height: 150px;
      }
      
      /* Fallback UI placeholder */
      .ryd-fallback-ui {
        min-height: 200px;
      }
    `;
    
    document.head.appendChild(style);
  }

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectStabilityCSS();
      initializeStability();
    });
  } else {
    injectStabilityCSS();
    initializeStability();
  }

  // Export
  if (typeof window !== 'undefined') {
    window.RYD_UIStability = {
      where_it_came_from: {
        origin: "internal",
        basis: "built for Ride Your Demons platform",
        source_type: "system-utility",
        verified: true
      },
      setMinHeight,
      setAspectRatio,
      initializeStability,
      injectStabilityCSS
    };
  }
})();
