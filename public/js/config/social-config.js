/**
 * Social Configuration
 * Single source of truth for social links and feature flags
 */

(function() {
  'use strict';

  const SocialConfig = {
    where_it_came_from: {
      origin: "internal",
      basis: "built for Ride Your Demons platform",
      source_type: "system-config",
      verified: true
    },

    // Required: Facebook URL
    FACEBOOK_URL: 'https://www.facebook.com/RideYourDemons',

    // Optional: Instagram URL (leave empty string to disable)
    INSTAGRAM_URL: '', // e.g., 'https://www.instagram.com/rideyourdemons'

    // Optional: X (Twitter) URL (leave empty string to disable)
    X_URL: '', // e.g., 'https://twitter.com/rideyourdemons'

    // Feature flags
    ENABLE_SHARE_BUTTONS: true,

    // Site base URL for share links
    getSiteBaseUrl: function() {
      if (typeof window !== 'undefined') {
        return window.location.origin;
      }
      return 'https://rideyourdemons.com';
    },

    // Get all enabled social links
    getEnabledLinks: function() {
      const links = [];
      if (this.FACEBOOK_URL) {
        links.push({ platform: 'facebook', url: this.FACEBOOK_URL, name: 'Facebook' });
      }
      if (this.INSTAGRAM_URL) {
        links.push({ platform: 'instagram', url: this.INSTAGRAM_URL, name: 'Instagram' });
      }
      if (this.X_URL) {
        links.push({ platform: 'x', url: this.X_URL, name: 'X' });
      }
      return links;
    },

    // Validate config
    validate: function() {
      if (!this.FACEBOOK_URL || this.FACEBOOK_URL.trim() === '') {
        console.warn('[RYD Social] FACEBOOK_URL is required but not set');
        return false;
      }
      return true;
    }
  };

  // Export
  window.RYD_SocialConfig = SocialConfig;

  // Validate on load
  if (typeof window !== 'undefined') {
    SocialConfig.validate();
  }
})();
