/**
 * Gate Styles Loader - Config-driven per-gate flame/glow
 * Loads /config/gate-styles.json once, applies CSS vars to .gate-card[data-gate].
 * If fetch fails, does nothing (no breaking).
 */
(function() {
  'use strict';

  const CONFIG_URL = '/config/gate-styles.json';
  let configCache = null;

  function getDefaults() {
    return {
      flameGlow: ['#ff3c00', '#ff6a00'],
      borderGlow: 'rgba(255,120,0,0.35)',
      underlineGlow: 'rgba(255,120,0,0.65)',
      titleColor: 'var(--color-text, #1a1a1a)'
    };
  }

  async function loadConfig() {
    if (configCache) return configCache;
    try {
      const res = await fetch(CONFIG_URL, { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      configCache = data;
      return data;
    } catch (e) {
      return null;
    }
  }

  function getStylesForGate(config, gateSlug) {
    const defaults = (config && config.defaults) || getDefaults();
    const gateStyles = (config && config.gates && config.gates[gateSlug]) || {};
    const fg = gateStyles.flameGlow || defaults.flameGlow || ['#ff3c00', '#ff6a00'];
    return {
      '--flame1': Array.isArray(fg) ? fg[0] : '#ff3c00',
      '--flame2': Array.isArray(fg) ? (fg[1] || fg[0]) : '#ff6a00',
      '--borderGlow': gateStyles.borderGlow || defaults.borderGlow || 'rgba(255,120,0,0.35)',
      '--underlineGlow': gateStyles.underlineGlow || defaults.underlineGlow || 'rgba(255,120,0,0.65)',
      '--gate-title-color': gateStyles.titleColor || defaults.titleColor || 'var(--color-text, #1a1a1a)'
    };
  }

  function applyStylesToCard(card, styles) {
    if (!card || !styles) return;
    Object.keys(styles).forEach(function(key) {
      card.style.setProperty(key, styles[key]);
    });
  }

  function applyToAll() {
    var cards = document.querySelectorAll('.gate-card[data-gate], .gates-grid .card[data-gate]');
    if (cards.length === 0) return;
    loadConfig().then(function(config) {
      cards.forEach(function(card) {
        var slug = card.getAttribute('data-gate') || '';
        var styles = getStylesForGate(config, slug);
        applyStylesToCard(card, styles);
      });
    });
  }

  window.RYD_GateStyles = {
    load: loadConfig,
    apply: applyToAll,
    getStylesForGate: getStylesForGate
  };
})();
