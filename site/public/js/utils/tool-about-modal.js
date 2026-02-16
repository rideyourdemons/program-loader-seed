/**
 * Tool About Modal - Displays "About This Tool" content from Cedar Matrix
 */

(function() {
  'use strict';

  // Cache for loaded content
  const contentCache = new Map();

  /**
   * Load about content from Cedar Matrix (Firestore)
   */
  async function loadAboutContent(toolId, toolSlug) {
    const cacheKey = toolId || toolSlug;
    
    // Check cache first
    if (contentCache.has(cacheKey)) {
      return contentCache.get(cacheKey);
    }

    try {
      // Try to load from Firestore if Firebase is available
      // Check for Firebase v9+ modular SDK
      if (window.firebase && typeof window.firebase.getFirestore === 'function') {
        const { getFirestore, doc, getDoc } = window.firebase;
        const db = getFirestore();
        const docRef = doc(db, 'cedar_matrix', toolId || toolSlug);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const content = data.aboutContent || data.description || data.content || null;
          if (content) {
            contentCache.set(cacheKey, content);
            return content;
          }
        }
      }
      // Fallback: Check for Firebase v8 namespaced SDK
      else if (window.firebase && window.firebase.firestore) {
        const db = window.firebase.firestore();
        const docRef = db.collection('cedar_matrix').doc(toolId || toolSlug);
        const docSnap = await docRef.get();
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const content = data.aboutContent || data.description || data.content || null;
          if (content) {
            contentCache.set(cacheKey, content);
            return content;
          }
        }
      }
    } catch (err) {
      // Silently fail - will fall back to local data
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('[RYD Tool About] Firestore not available, using local data');
      }
    }

    // Fallback: Try to load from local data
    try {
      if (window.RYD && typeof window.RYD.getTools === 'function') {
        const tools = window.RYD.getTools() || [];
        const tool = tools.find(t => (t.id === toolId || t.slug === toolSlug));
        if (tool && (tool.aboutContent || tool.how_it_works || tool.description)) {
          const content = tool.aboutContent || tool.how_it_works || tool.description;
          contentCache.set(cacheKey, content);
          return content;
        }
      }
    } catch (err) {
      console.warn('[RYD Tool About] Could not load from local data:', err.message);
    }

    return null;
  }

  /**
   * Create and show About modal
   */
  function showAboutModal(tool, container) {
    // Remove existing modal if present
    const existing = document.getElementById('ryd-about-modal');
    if (existing) {
      existing.remove();
    }

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'ryd-about-modal';
    overlay.className = 'ryd-about-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'ryd-about-modal';
    modal.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 2rem;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      position: relative;
    `;

    // Modal header
    const header = document.createElement('div');
    header.style.cssText = 'margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #e0e0e0;';
    
    const title = document.createElement('h2');
    title.textContent = `About ${tool.name || tool.title || tool.id || 'This Tool'}`;
    title.style.cssText = 'margin: 0 0 0.5rem 0; font-size: 1.5em; color: #333;';
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: none;
      border: none;
      font-size: 2em;
      color: #666;
      cursor: pointer;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.2s;
    `;
    closeBtn.onmouseover = () => closeBtn.style.background = '#f5f5f5';
    closeBtn.onmouseout = () => closeBtn.style.background = 'transparent';
    closeBtn.onclick = () => overlay.remove();
    header.appendChild(closeBtn);

    modal.appendChild(header);

    // Content area
    const contentDiv = document.createElement('div');
    contentDiv.className = 'ryd-about-content';
    contentDiv.style.cssText = 'color: #333; line-height: 1.7;';
    contentDiv.innerHTML = '<p style="color: #666; font-style: italic;">Loading technical specifications from Cedar Matrix...</p>';
    modal.appendChild(contentDiv);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Close on overlay click (but not on modal click)
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    };

    // Load content
    const toolId = tool.id;
    const toolSlug = tool.slug;
    
    loadAboutContent(toolId, toolSlug).then(content => {
      if (content) {
        // Sanitize content if sanitizer is available
        const safeContent = (window.RYD_UI && typeof window.RYD_UI.sanitizeDescription === 'function')
          ? window.RYD_UI.sanitizeDescription(content, tool.name || tool.title)
          : String(content);
        
        contentDiv.innerHTML = `<p>${safeContent}</p>`;
      } else {
        contentDiv.innerHTML = `
          <p style="color: #666;">Technical specifications are being prepared. This tool is part of the Ride Your Demons platform and is designed to help you manage challenges effectively.</p>
          <p style="color: #666; margin-top: 1rem;">Check back soon for detailed information about how this tool works and why it's effective.</p>
        `;
      }
    }).catch(err => {
      console.error('[RYD Tool About] Error loading content:', err);
      contentDiv.innerHTML = `
        <p style="color: #d32f2f;">Unable to load content at this time. Please try again later.</p>
      `;
    });

    // Close on Escape key
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  }

  /**
   * Add "About This Tool" button to a tool card
   */
  function addAboutButton(toolCard, tool) {
    // Check if button already exists
    if (toolCard.querySelector('.ryd-about-button')) {
      return;
    }

    const aboutBtn = document.createElement('button');
    aboutBtn.className = 'ryd-about-button';
    aboutBtn.textContent = 'About This Tool';
    aboutBtn.style.cssText = `
      display: inline-block;
      padding: 0.5rem 1rem;
      margin-top: 0.5rem;
      background: #f5f5f5;
      color: #667eea;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      font-size: 0.9em;
      cursor: pointer;
      transition: background 0.2s, border-color 0.2s;
    `;
    
    aboutBtn.onmouseover = () => {
      aboutBtn.style.background = '#e8e8e8';
      aboutBtn.style.borderColor = '#667eea';
    };
    aboutBtn.onmouseout = () => {
      aboutBtn.style.background = '#f5f5f5';
      aboutBtn.style.borderColor = '#e0e0e0';
    };

    aboutBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent card click
      showAboutModal(tool, toolCard);
    };

    toolCard.appendChild(aboutBtn);
  }

  // Export API
  window.RYD_ToolAbout = {
    where_it_came_from: {
      origin: "internal",
      basis: "built for Ride Your Demons platform",
      source_type: "system-utility",
      verified: true
    },
    showAboutModal,
    addAboutButton,
    loadAboutContent
  };
})();
