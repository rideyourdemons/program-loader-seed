import puppeteer from "puppeteer";
import { logger } from "./logger.js";
import credentialManager from "./credential-manager.js";
import firebaseAuth from "./firebase-auth.js";

/**
 * Web Automation Tool
 * Handles browser automation for website interaction
 * Never saves credentials - uses session-based credential manager
 */
class WebAutomation {
  constructor() {
    this.browsers = new Map(); // sessionId -> browser instance
    this.pages = new Map(); // sessionId -> page instance
  }

  /**
   * Launch browser for a session
   * @param {string} sessionId
   * @param {Object} options - Browser options
   * @returns {Promise<Object>} { browser, page }
   */
  async launchBrowser(sessionId, options = {}) {
    try {
      const browser = await puppeteer.launch({
        headless: options.headless !== false, // Default to headless
        defaultViewport: { width: 1920, height: 1080 },
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ],
        ...options
      });

      const page = await browser.newPage();
      
      // Set longer timeouts
      page.setDefaultNavigationTimeout(options.timeout || 60000);
      page.setDefaultTimeout(options.timeout || 60000);

      this.browsers.set(sessionId, browser);
      this.pages.set(sessionId, page);

      logger.info(`Browser launched for session: ${sessionId}`);

      return { browser, page };
    } catch (error) {
      logger.error(`Failed to launch browser: ${error.message}`);
      throw error;
    }
  }

  /**
   * Navigate to URL with enhanced SPA support
   * @param {string} sessionId
   * @param {string} url
   * @param {Object} options - { waitForSelector, waitForFunction, timeout }
   * @returns {Promise<void>}
   */
  async navigateTo(sessionId, url, options = {}) {
    const page = this.pages.get(sessionId);
    if (!page) {
      throw new Error(`No active page for session: ${sessionId}`);
    }

    try {
      // Navigate with multiple wait strategies for SPAs
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: options.timeout || 60000
      });
      
      // Additional waiting for React/SPA applications
      await this.waitForSPAReady(page, options);
      
      logger.info(`Navigated to: ${url}`);
    } catch (error) {
      logger.error(`Navigation failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Wait for SPA/React application to be ready
   * @param {Object} page - Puppeteer page
   * @param {Object} options - Wait options
   * @returns {Promise<void>}
   */
  async waitForSPAReady(page, options = {}) {
    try {
      // Wait for common React indicators
      const waitPromises = [];
      
      // Wait for React root element
      waitPromises.push(
        page.waitForFunction(() => {
          return document.querySelector('#root') !== null ||
                 document.querySelector('[data-reactroot]') !== null ||
                 document.querySelector('[id*="root"]') !== null;
        }, { timeout: 10000 }).catch(() => {})
      );
      
      // Wait for no loading indicators
      waitPromises.push(
        page.waitForFunction(() => {
          const loaders = document.querySelectorAll('[class*="loading"], [class*="spinner"], [class*="loader"]');
          return Array.from(loaders).every(el => el.style.display === 'none' || !el.offsetParent);
        }, { timeout: 5000 }).catch(() => {})
      );
      
      // Wait for custom selector if provided
      if (options.waitForSelector) {
        waitPromises.push(
          page.waitForSelector(options.waitForSelector, { timeout: 10000 }).catch(() => {})
        );
      }
      
      // Wait for custom function if provided
      if (options.waitForFunction) {
        waitPromises.push(
          page.waitForFunction(options.waitForFunction, { timeout: 10000 }).catch(() => {})
        );
      }
      
      // Wait for network to be idle (SPAs often make async calls)
      await Promise.all(waitPromises);
      await page.waitForTimeout(1000); // Additional buffer for any late renders
      
    } catch (error) {
      logger.warn(`SPA wait strategy encountered issue: ${error.message}`);
      // Continue anyway - not critical
    }
  }

  /**
   * Login to website using credentials from session
   * @param {string} sessionId
   * @param {Object} selectors - { usernameSelector, passwordSelector, submitSelector, useFirebase }
   * @returns {Promise<boolean>} Success status
   */
  async login(sessionId, selectors = {}) {
    const credentials = credentialManager.getCredentials(sessionId);
    if (!credentials) {
      throw new Error(`No credentials found for session: ${sessionId}`);
    }

    const page = this.pages.get(sessionId);
    if (!page) {
      throw new Error(`No active page for session: ${sessionId}`);
    }

    try {
      // Check if Firebase authentication should be used
      if (selectors.useFirebase !== false) {
        // Try to detect Firebase first
        const firebaseConfig = await firebaseAuth.detectFirebaseConfig(sessionId);
        if (firebaseConfig || selectors.useFirebase === true) {
          logger.info(`Using Firebase authentication for session: ${sessionId}`);
          return await firebaseAuth.loginWithEmailPassword(
            sessionId,
            credentials.username || credentials.email,
            credentials.password
          );
        }
      }

      // Fall back to traditional form-based login
      const usernameSelector = selectors.usernameSelector || 'input[name="username"], input[name="email"], input[type="email"], #username, #email';
      const passwordSelector = selectors.passwordSelector || 'input[name="password"], input[type="password"], #password';
      const submitSelector = selectors.submitSelector || 'button[type="submit"], input[type="submit"]';

      await page.waitForSelector(usernameSelector, { timeout: 10000 });
      await page.waitForSelector(passwordSelector, { timeout: 10000 });

      // Fill in credentials
      await page.type(usernameSelector, credentials.username || credentials.email);
      await page.type(passwordSelector, credentials.password);

      // Submit form
      await page.click(submitSelector);
      
      // Wait for navigation or success indicator
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

      logger.info(`Login successful for session: ${sessionId}`);
      return true;
    } catch (error) {
      logger.error(`Login failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get page content (HTML)
   * @param {string} sessionId
   * @returns {Promise<string>}
   */
  async getPageContent(sessionId) {
    const page = this.pages.get(sessionId);
    if (!page) {
      throw new Error(`No active page for session: ${sessionId}`);
    }

    return await page.content();
  }

  /**
   * Get page text content
   * @param {string} sessionId
   * @returns {Promise<string>}
   */
  async getPageText(sessionId) {
    const page = this.pages.get(sessionId);
    if (!page) {
      throw new Error(`No active page for session: ${sessionId}`);
    }

    return await page.evaluate(() => document.body.innerText);
  }

  /**
   * Click element by selector
   * @param {string} sessionId
   * @param {string} selector
   * @returns {Promise<void>}
   */
  async click(sessionId, selector) {
    const page = this.pages.get(sessionId);
    if (!page) {
      throw new Error(`No active page for session: ${sessionId}`);
    }

    await page.waitForSelector(selector);
    await page.click(selector);
    logger.info(`Clicked element: ${selector}`);
  }

  /**
   * Type text into element
   * @param {string} sessionId
   * @param {string} selector
   * @param {string} text
   * @returns {Promise<void>}
   */
  async type(sessionId, selector, text) {
    const page = this.pages.get(sessionId);
    if (!page) {
      throw new Error(`No active page for session: ${sessionId}`);
    }

    await page.waitForSelector(selector);
    await page.type(selector, text);
    logger.info(`Typed into element: ${selector}`);
  }

  /**
   * Wait for element to appear with enhanced SPA support
   * @param {string} sessionId
   * @param {string} selector
   * @param {number} timeout
   * @param {Object} options - { visible, hidden, attached }
   * @returns {Promise<void>}
   */
  async waitForElement(sessionId, selector, timeout = 30000, options = {}) {
    const page = this.pages.get(sessionId);
    if (!page) {
      throw new Error(`No active page for session: ${sessionId}`);
    }

    const waitOptions = { timeout, ...options };
    await page.waitForSelector(selector, waitOptions);
    
    // Additional wait for element to be actionable (not just present)
    if (options.waitForActionable !== false) {
      await page.waitForFunction((sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0';
      }, { timeout: 5000 }, selector).catch(() => {});
    }
  }
  
  /**
   * Discover code files from the current page
   * @param {string} sessionId
   * @returns {Promise<Array>} Array of discovered code file paths/URLs
   */
  async discoverCodeFiles(sessionId) {
    const page = this.pages.get(sessionId);
    if (!page) {
      throw new Error(`No active page for session: ${sessionId}`);
    }

    try {
      const files = await page.evaluate(() => {
        const discoveredFiles = [];
        
        // Find script tags
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        scripts.forEach(script => {
          const src = script.getAttribute('src');
          if (src && !src.startsWith('http') && !src.startsWith('//')) {
            discoveredFiles.push({
              type: 'script',
              path: src,
              url: new URL(src, window.location.href).href
            });
          }
        });
        
        // Find link tags (CSS files)
        const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        styles.forEach(link => {
          const href = link.getAttribute('href');
          if (href && !href.startsWith('http') && !href.startsWith('//')) {
            discoveredFiles.push({
              type: 'stylesheet',
              path: href,
              url: new URL(href, window.location.href).href
            });
          }
        });
        
        // Check for webpack/manifest files (React apps often have these)
        const webpackManifest = document.querySelector('script[src*="manifest"]');
        if (webpackManifest) {
          discoveredFiles.push({
            type: 'manifest',
            path: webpackManifest.getAttribute('src'),
            url: new URL(webpackManifest.getAttribute('src'), window.location.href).href
          });
        }
        
        // Check for source maps
        const sourceMapScripts = Array.from(document.querySelectorAll('script')).filter(s => {
          return s.textContent && s.textContent.includes('sourceMappingURL');
        });
        
        sourceMapScripts.forEach(script => {
          const match = script.textContent.match(/sourceMappingURL=([^\s]+)/);
          if (match) {
            discoveredFiles.push({
              type: 'sourcemap',
              path: match[1],
              url: new URL(match[1], window.location.href).href
            });
          }
        });
        
        return discoveredFiles;
      });
      
      logger.info(`Discovered ${files.length} code files for session: ${sessionId}`);
      return files;
    } catch (error) {
      logger.error(`Failed to discover code files: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Get all network requests (for code file discovery)
   * @param {string} sessionId
   * @returns {Promise<Array>}
   */
  async getNetworkRequests(sessionId) {
    const page = this.pages.get(sessionId);
    if (!page) {
      throw new Error(`No active page for session: ${sessionId}`);
    }

    try {
      // Enable request interception to track requests
      await page.setRequestInterception(true);
      
      const codeFileRequests = [];
      const codeFilePatterns = /\.(js|jsx|ts|tsx|css|json|map)$/i;
      
      page.on('request', request => {
        const url = request.url();
        if (codeFilePatterns.test(url)) {
          codeFileRequests.push({
            url,
            type: request.resourceType(),
            method: request.method()
          });
        }
        request.continue();
      });
      
      // Wait a bit to collect requests
      await page.waitForTimeout(3000);
      
      return codeFileRequests;
    } catch (error) {
      logger.error(`Failed to get network requests: ${error.message}`);
      return [];
    }
  }

  /**
   * Take screenshot
   * @param {string} sessionId
   * @param {string} path - Optional file path
   * @returns {Promise<Buffer|string>}
   */
  async screenshot(sessionId, path = null) {
    const page = this.pages.get(sessionId);
    if (!page) {
      throw new Error(`No active page for session: ${sessionId}`);
    }

    if (path) {
      return await page.screenshot({ path, fullPage: true });
    } else {
      return await page.screenshot({ fullPage: true, encoding: 'base64' });
    }
  }

  /**
   * Execute JavaScript in page context
   * @param {string} sessionId
   * @param {string|Function} script
   * @returns {Promise<any>}
   */
  async evaluate(sessionId, script) {
    const page = this.pages.get(sessionId);
    if (!page) {
      throw new Error(`No active page for session: ${sessionId}`);
    }

    return await page.evaluate(script);
  }

  /**
   * Get current URL
   * @param {string} sessionId
   * @returns {Promise<string>}
   */
  async getCurrentUrl(sessionId) {
    const page = this.pages.get(sessionId);
    if (!page) {
      throw new Error(`No active page for session: ${sessionId}`);
    }

    return page.url();
  }

  /**
   * Close browser for session
   * @param {string} sessionId
   * @returns {Promise<void>}
   */
  async closeBrowser(sessionId) {
    const browser = this.browsers.get(sessionId);
    if (browser) {
      await browser.close();
      this.browsers.delete(sessionId);
      this.pages.delete(sessionId);
      logger.info(`Browser closed for session: ${sessionId}`);
    }
  }

  /**
   * Close all browsers
   * @returns {Promise<void>}
   */
  async closeAllBrowsers() {
    const closePromises = Array.from(this.browsers.keys()).map(sessionId =>
      this.closeBrowser(sessionId)
    );
    await Promise.all(closePromises);
  }
}

export const webAutomation = new WebAutomation();
export default webAutomation;

