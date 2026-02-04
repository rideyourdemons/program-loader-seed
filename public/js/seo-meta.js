/**
 * RYD SEO Meta Tags Manager
 * 
 * Dynamically updates canonical, Open Graph, and Twitter meta tags
 * for tool pages and other dynamic content
 */

(function() {
  'use strict';

  const BASE_URL = 'https://rideyourdemons.com';
  const DEFAULT_IMAGE = `${BASE_URL}/images/og-default.jpg`;

  function updateCanonical(url) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }

  function updateMeta(name, content, isProperty = false) {
    const selector = isProperty 
      ? `meta[property="${name}"]`
      : `meta[name="${name}"]`;
    
    let meta = document.querySelector(selector);
    if (!meta) {
      meta = document.createElement('meta');
      if (isProperty) {
        meta.setAttribute('property', name);
      } else {
        meta.setAttribute('name', name);
      }
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  }

  function updateTitle(title) {
    document.title = title;
    updateMeta('og:title', title, true);
    updateMeta('twitter:title', title);
  }

  function updateDescription(description) {
    updateMeta('description', description);
    updateMeta('og:description', description, true);
    updateMeta('twitter:description', description);
  }

  function updateImage(imageUrl) {
    updateMeta('og:image', imageUrl, true);
    updateMeta('twitter:image', imageUrl);
  }

  function updateUrl(url) {
    updateMeta('og:url', url, true);
    updateCanonical(url);
  }

  function initToolPage() {
    // Parse tool slug from URL
    const pathParts = window.location.pathname.split('/').filter(p => p);
    const toolIndex = pathParts.indexOf('tools');
    const slug = toolIndex >= 0 ? pathParts[toolIndex + 1] : null;

    if (!slug) return;

    // Load tool data
    fetch(`/data/tools-canonical.json?ts=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        const tool = (data.tools || []).find(t => (t.slug === slug || t.id === slug));
        if (!tool) return;

        const toolUrl = `${BASE_URL}/tools/${slug}`;
        const toolTitle = `${tool.title || tool.name} - Ride Your Demons`;
        const toolDescription = tool.description 
          ? tool.description.substring(0, 160).replace(/\r\n/g, ' ').trim()
          : 'Free self-help tool for mental health and emotional well-being.';

        // Update canonical
        updateCanonical(toolUrl);

        // Update title
        updateTitle(toolTitle);

        // Update description
        updateDescription(toolDescription);

        // Update OG and Twitter
        updateUrl(toolUrl);
        updateImage(DEFAULT_IMAGE);
        updateMeta('og:type', 'article', true);
        updateMeta('twitter:card', 'summary_large_image');

        console.log('[RYD SEO] Updated meta tags for tool:', slug);
      })
      .catch(err => {
        console.warn('[RYD SEO] Failed to load tool data:', err);
      });
  }

  function initGatePage() {
    const pathParts = window.location.pathname.split('/').filter(p => p);
    const gateIndex = pathParts.indexOf('gates');
    const gateId = gateIndex >= 0 ? pathParts[gateIndex + 1] : null;

    if (!gateId) return;

    fetch(`/data/gates.json?ts=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        const gate = (data.gates || []).find(g => g.id === gateId);
        if (!gate) return;

        const gateUrl = `${BASE_URL}/gates/${gateId}`;
        const gateTitle = `${gate.title || gate.gateName} - Ride Your Demons`;
        const gateDescription = gate.description || 'Mental health tools and resources.';

        updateCanonical(gateUrl);
        updateTitle(gateTitle);
        updateDescription(gateDescription);
        updateUrl(gateUrl);
        updateImage(DEFAULT_IMAGE);
        updateMeta('og:type', 'website', true);
        updateMeta('twitter:card', 'summary_large_image');

        console.log('[RYD SEO] Updated meta tags for gate:', gateId);
      })
      .catch(err => {
        console.warn('[RYD SEO] Failed to load gate data:', err);
      });
  }

  function init() {
    const path = window.location.pathname;

    // Set default canonical for all pages
    const canonicalUrl = `${BASE_URL}${path === '/' ? '' : path}`;
    updateCanonical(canonicalUrl);

    // Initialize based on page type
    if (path.startsWith('/tools/') && path.split('/').length >= 3) {
      initToolPage();
    } else if (path.startsWith('/gates/')) {
      initGatePage();
    } else {
      // Homepage and other static pages
      updateUrl(canonicalUrl);
      updateMeta('og:type', 'website', true);
      updateMeta('twitter:card', 'summary_large_image');
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for external use
  window.RYD_SEO = {
    updateCanonical,
    updateTitle,
    updateDescription,
    updateImage,
    updateUrl
  };
})();

