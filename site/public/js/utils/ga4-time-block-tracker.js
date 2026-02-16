/**
 * GA4 Time-Block Tracker
 * Tracks which time blocks (5, 15, 30, 60 min) users interact with most
 * Used to auto-tune the Matrix to offer more high-efficiency tools
 */

(function() {
  'use strict';

  /**
   * Track time-block interaction
   * @param {string} timeBlock - Duration string (e.g., "5 minutes", "15 minutes", "30 minutes", "60 minutes")
   * @param {string} toolId - Tool ID
   * @param {string} action - Action type (e.g., "view", "start", "complete")
   */
  function trackTimeBlock(timeBlock, toolId, action = 'view') {
    // Extract numeric value from time block
    const timeValue = extractTimeValue(timeBlock);
    const timeCategory = categorizeTimeBlock(timeValue);

    // 4. GA4 Tracking of 'Value-Density'
    if (typeof window.gtag === 'function') {
      try {
        window.gtag('event', 'time_block_interaction', {
          time_block: timeCategory, // "5min", "15min", "30min", "60min"
          time_value: timeValue, // Numeric value (5, 15, 30, 60)
          tool_id: toolId || 'unknown',
          action: action, // "view", "start", "complete"
          page_path: window.location.pathname,
          value_density: calculateValueDensity(timeValue) // Efficiency metric
        });
        console.log('[GA4] Time-block interaction tracked:', {
          timeBlock: timeCategory,
          toolId,
          action
        });
      } catch (e) {
        console.warn('[GA4] Failed to track time-block interaction:', e);
      }
    }

    // Fallback to RYD_ANALYTICS if available
    if (window.RYD_ANALYTICS && typeof window.RYD_ANALYTICS.pushEvent === 'function') {
      try {
        window.RYD_ANALYTICS.pushEvent('time_block_interaction', {
          time_block: timeCategory,
          time_value: timeValue,
          tool_id: toolId || 'unknown',
          action: action,
          page_path: window.location.pathname,
          value_density: calculateValueDensity(timeValue)
        });
      } catch (e) {
        console.warn('[RYD Analytics] Failed to track time-block interaction:', e);
      }
    }
  }

  /**
   * Extract numeric time value from duration string
   */
  function extractTimeValue(timeBlock) {
    if (!timeBlock || typeof timeBlock !== 'string') {
      return 15; // Default fallback
    }

    // Match patterns like "5 minutes", "15 min", "30-60 minutes"
    const match = timeBlock.match(/(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }

    return 15; // Default fallback
  }

  /**
   * Categorize time block for analytics
   */
  function categorizeTimeBlock(timeValue) {
    if (timeValue <= 5) {
      return '5min';
    } else if (timeValue <= 15) {
      return '15min';
    } else if (timeValue <= 30) {
      return '30min';
    } else {
      return '60min';
    }
  }

  /**
   * Calculate value density (efficiency metric)
   * Higher value = more efficient (5 min tools are highest value)
   */
  function calculateValueDensity(timeValue) {
    // Inverse relationship: shorter time = higher value density
    // 5 min = 100, 15 min = 33, 30 min = 17, 60 min = 8
    return Math.round((60 / timeValue) * 8.33);
  }

  /**
   * Track tool view (when tool card is displayed)
   */
  function trackToolView(tool) {
    if (!tool) return;

    const duration = tool.duration || tool.temporalWeight?.timeBlock || '15 minutes';
    const toolId = tool.id || tool.toolId || 'unknown';

    trackTimeBlock(duration, toolId, 'view');
  }

  /**
   * Track tool start (when user clicks to start tool)
   */
  function trackToolStart(tool) {
    if (!tool) return;

    const duration = tool.duration || tool.temporalWeight?.timeBlock || '15 minutes';
    const toolId = tool.id || tool.toolId || 'unknown';

    trackTimeBlock(duration, toolId, 'start');
  }

  /**
   * Track tool complete (when user finishes tool)
   */
  function trackToolComplete(tool) {
    if (!tool) return;

    const duration = tool.duration || tool.temporalWeight?.timeBlock || '15 minutes';
    const toolId = tool.id || tool.toolId || 'unknown';

    trackTimeBlock(duration, toolId, 'complete');
  }

  /**
   * Get time-block statistics (for auto-tuning)
   * Returns aggregated data about which time blocks are most popular
   */
  function getTimeBlockStats() {
    // This would typically query GA4 API or local storage
    // For now, return structure for future implementation
    return {
      '5min': { views: 0, starts: 0, completes: 0 },
      '15min': { views: 0, starts: 0, completes: 0 },
      '30min': { views: 0, starts: 0, completes: 0 },
      '60min': { views: 0, starts: 0, completes: 0 }
    };
  }

  // Export to window
  window.GA4TimeBlockTracker = {
    trackTimeBlock,
    trackToolView,
    trackToolStart,
    trackToolComplete,
    getTimeBlockStats,
    extractTimeValue,
    categorizeTimeBlock,
    calculateValueDensity
  };

  console.log('[GA4 Time-Block Tracker] Time-block tracking utilities loaded');
})();
