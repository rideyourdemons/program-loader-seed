/**
 * Error Boundary for Vanilla JS Components
 * Prevents single component failures from crashing the entire page
 */

(function() {
  'use strict';

  class ErrorBoundary {
    constructor(container, fallbackRenderer) {
      this.container = container;
      this.fallbackRenderer = fallbackRenderer || this.defaultFallback;
      this.error = null;
    }

    defaultFallback(error, errorInfo) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'ryd-error-boundary';
      errorDiv.style.cssText = `
        padding: 1.5rem;
        margin: 1rem 0;
        border: 2px solid #ff4444;
        border-radius: 8px;
        background: #fff5f5;
        color: #c53030;
      `;
      
      const title = document.createElement('h3');
      title.textContent = 'Content Loading Error';
      title.style.cssText = 'margin: 0 0 0.5rem 0; font-size: 1.1em;';
      errorDiv.appendChild(title);
      
      const message = document.createElement('p');
      message.textContent = 'We encountered an issue loading this content. Please try refreshing the page.';
      message.style.cssText = 'margin: 0 0 0.5rem 0;';
      errorDiv.appendChild(message);
      
      const retryBtn = document.createElement('button');
      retryBtn.textContent = 'Retry';
      retryBtn.style.cssText = `
        padding: 0.5rem 1rem;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9em;
      `;
      retryBtn.addEventListener('click', () => {
        window.location.reload();
      });
      errorDiv.appendChild(retryBtn);
      
      if (error && process.env.NODE_ENV === 'development') {
        const details = document.createElement('details');
        details.style.cssText = 'margin-top: 0.5rem; font-size: 0.85em;';
        const summary = document.createElement('summary');
        summary.textContent = 'Error Details (Development Only)';
        summary.style.cssText = 'cursor: pointer; color: #666;';
        details.appendChild(summary);
        const pre = document.createElement('pre');
        pre.textContent = error.stack || error.message || String(error);
        pre.style.cssText = 'overflow: auto; max-height: 200px; background: #f0f0f0; padding: 0.5rem; border-radius: 4px;';
        details.appendChild(pre);
        errorDiv.appendChild(details);
      }
      
      return errorDiv;
    }

    catch(error, errorInfo = {}) {
      this.error = error;
      console.error('[ErrorBoundary] Caught error:', error, errorInfo);
      
      if (this.container) {
        try {
          const fallback = this.fallbackRenderer(error, errorInfo);
          if (fallback instanceof Node) {
            this.container.innerHTML = '';
            this.container.appendChild(fallback);
          } else if (typeof fallback === 'string') {
            this.container.innerHTML = fallback;
          }
        } catch (fallbackError) {
          console.error('[ErrorBoundary] Fallback renderer failed:', fallbackError);
          this.container.innerHTML = '<p style="color: red; padding: 1rem;">Content unavailable. Please refresh the page.</p>';
        }
      }
      
      return false;
    }

    reset() {
      this.error = null;
      if (this.container) {
        this.container.innerHTML = '';
      }
    }
  }

  /**
   * Wraps a render function with error boundary protection
   */
  function withErrorBoundary(container, renderFn, fallbackRenderer) {
    const boundary = new ErrorBoundary(container, fallbackRenderer);
    
    return function(...args) {
      try {
        boundary.reset();
        return renderFn.apply(this, args);
      } catch (error) {
        boundary.catch(error, { renderFn: renderFn.name || 'anonymous' });
        return null;
      }
    };
  }

  window.RYD_ErrorBoundary = {
    where_it_came_from: {
      origin: "internal",
      basis: "built for Ride Your Demons platform",
      source_type: "system-utility",
      verified: true
    },
    ErrorBoundary,
    withErrorBoundary
  };
})();
