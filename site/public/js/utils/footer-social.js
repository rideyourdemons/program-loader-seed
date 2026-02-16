/**
 * Footer Social Links Renderer
 * Dynamically adds social links to footer
 */

(function() {
  'use strict';

  // Simple SVG icons (inline, no external dependencies)
  const icons = {
    facebook: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    instagram: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
    x: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>'
  };

  function renderSocialLinks(container) {
    if (!window.RYD_SocialConfig) {
      console.warn('[RYD Footer] Social config not loaded');
      return;
    }

    const links = window.RYD_SocialConfig.getEnabledLinks();
    if (links.length === 0) {
      return;
    }

    // Create social section
    const socialSection = document.createElement('div');
    socialSection.className = 'footer-social';
    socialSection.style.cssText = 'margin-top: var(--spacing-md, 16px); padding-top: var(--spacing-md, 16px); border-top: 1px solid var(--color-border, #e0e0e0);';

    const socialTitle = document.createElement('h3');
    socialTitle.textContent = 'Follow / Community';
    socialTitle.style.cssText = 'font-size: 0.95em; font-weight: 600; margin-bottom: 12px; color: var(--color-text, #1a1a1a);';
    socialSection.appendChild(socialTitle);

    const socialLinks = document.createElement('div');
    socialLinks.className = 'footer-social-links';
    socialLinks.style.cssText = 'display: flex; gap: 16px; justify-content: center; align-items: center; flex-wrap: wrap;';

    links.forEach(link => {
      const a = document.createElement('a');
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', `Follow us on ${link.name}`);
      a.className = `footer-social-link footer-social-${link.platform}`;
      a.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--color-bg, #f5f5f5);
        color: var(--color-text, #1a1a1a);
        text-decoration: none;
        transition: background 0.2s, transform 0.2s;
      `;
      a.innerHTML = icons[link.platform] || '';
      a.onmouseover = () => {
        a.style.background = 'var(--color-accent, #667eea)';
        a.style.color = 'white';
        a.style.transform = 'translateY(-2px)';
      };
      a.onmouseout = () => {
        a.style.background = 'var(--color-bg, #f5f5f5)';
        a.style.color = 'var(--color-text, #1a1a1a)';
        a.style.transform = 'translateY(0)';
      };
      a.onclick = () => {
        if (window.RYD_SocialShare && typeof window.RYD_SocialShare.trackSocialClick === 'function') {
          window.RYD_SocialShare.trackSocialClick(link.platform, 'footer');
        }
      };
      socialLinks.appendChild(a);
    });

    socialSection.appendChild(socialLinks);
    container.appendChild(socialSection);
  }

  function init() {
    // Find footer containers
    const footers = document.querySelectorAll('footer .footer-content');
    footers.forEach(footer => {
      // Check if social section already exists
      if (!footer.querySelector('.footer-social')) {
        renderSocialLinks(footer);
      }
    });
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export
  window.RYD_FooterSocial = {
    where_it_came_from: {
      origin: "internal",
      basis: "built for Ride Your Demons platform",
      source_type: "system-utility",
      verified: true
    },
    renderSocialLinks,
    init
  };
})();
