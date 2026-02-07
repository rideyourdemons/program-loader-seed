/**
 * Social Share Utilities
 * Handles sharing functionality with GA4 tracking
 */

(function() {
  'use strict';

  // Track social/share events
  function trackSocialClick(platform, location) {
    if (window.RYD_ANALYTICS && typeof window.RYD_ANALYTICS.pushEvent === 'function') {
      window.RYD_ANALYTICS.pushEvent('social_click', {
        platform: platform,
        location: location
      });
    }
  }

  function trackShareClick(method, location) {
    if (window.RYD_ANALYTICS && typeof window.RYD_ANALYTICS.pushEvent === 'function') {
      window.RYD_ANALYTICS.pushEvent('share_click', {
        method: method,
        location: location
      });
    }
  }

  // Show toast notification
  function showToast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 0.9em;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // Add fade animations if not present
  if (!document.getElementById('ryd-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'ryd-toast-styles';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateX(-50%) translateY(10px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      @keyframes fadeOut {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(-10px); }
      }
    `;
    document.head.appendChild(style);
  }

  // Share via native share API (mobile/desktop)
  async function shareNative(url, title, text) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text,
          url: url
        });
        trackShareClick('native', 'tool_detail');
        return true;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('[RYD Share] Native share failed:', err);
        }
        return false;
      }
    }
    return false;
  }

  // Copy to clipboard fallback
  function shareCopy(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard');
        trackShareClick('copy', 'tool_detail');
      }).catch(err => {
        console.error('[RYD Share] Copy failed:', err);
        showToast('Failed to copy link');
      });
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showToast('Link copied to clipboard');
        trackShareClick('copy', 'tool_detail');
      } catch (err) {
        console.error('[RYD Share] Copy failed:', err);
        showToast('Failed to copy link');
      }
      document.body.removeChild(textarea);
    }
  }

  // Share on Facebook
  function shareFacebook(url) {
    const encodedUrl = encodeURIComponent(url);
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
    trackShareClick('facebook', 'tool_detail');
  }

  // Main share function
  async function shareTool(toolTitle, toolUrl) {
    const baseUrl = window.RYD_SocialConfig 
      ? window.RYD_SocialConfig.getSiteBaseUrl()
      : window.location.origin;
    const fullUrl = toolUrl || window.location.href;
    const shareText = `Check out "${toolTitle}" on Ride Your Demons`;

    // Try native share first
    const nativeSuccess = await shareNative(fullUrl, toolTitle, shareText);
    if (!nativeSuccess) {
      // Fallback to copy
      shareCopy(fullUrl);
    }
  }

  // Export API
  window.RYD_SocialShare = {
    where_it_came_from: {
      origin: "internal",
      basis: "built for Ride Your Demons platform",
      source_type: "system-utility",
      verified: true
    },
    shareTool,
    shareFacebook,
    shareCopy,
    shareNative,
    trackSocialClick,
    trackShareClick
  };
})();
