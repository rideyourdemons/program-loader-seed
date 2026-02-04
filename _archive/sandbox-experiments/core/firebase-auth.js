import { logger } from "./logger.js";
import webAutomation from "./web-automation.js";

/**
 * Firebase Authentication Handler
 * Handles Firebase authentication in browser automation
 */
class FirebaseAuth {
  constructor() {
    this.firebaseConfigs = new Map(); // sessionId -> firebase config
  }

  /**
   * Detect Firebase configuration from page
   * @param {string} sessionId
   * @returns {Promise<Object|null>} Firebase config or null
   */
  async detectFirebaseConfig(sessionId) {
    try {
      const config = await webAutomation.evaluate(sessionId, () => {
        // Look for Firebase config in window object
        if (window.firebase && window.firebase.apps && window.firebase.apps.length > 0) {
          const app = window.firebase.apps[0];
          return app.options;
        }
        
        // Look for Firebase config in common variable names
        if (window.firebaseConfig) {
          return window.firebaseConfig;
        }
        
        // Look in script tags
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const script of scripts) {
          const text = script.textContent || script.innerHTML;
          const match = text.match(/firebaseConfig\s*=\s*({[^}]+})/);
          if (match) {
            try {
              return eval('(' + match[1] + ')');
            } catch (e) {
              // Try JSON parse
              try {
                return JSON.parse(match[1]);
              } catch (e2) {
                // Continue
              }
            }
          }
        }
        
        return null;
      });

      if (config) {
        this.firebaseConfigs.set(sessionId, config);
        logger.info(`Firebase config detected for session: ${sessionId}`);
        return config;
      }

      return null;
    } catch (error) {
      logger.warn(`Could not detect Firebase config: ${error.message}`);
      return null;
    }
  }

  /**
   * Login with Firebase using email/password
   * @param {string} sessionId
   * @param {string} email
   * @param {string} password
   * @param {Object} options - { waitForNavigation, timeout }
   * @returns {Promise<boolean>}
   */
  async loginWithEmailPassword(sessionId, email, password, options = {}) {
    const page = webAutomation.pages.get(sessionId);
    if (!page) {
      throw new Error(`No active page for session: ${sessionId}`);
    }

    try {
      // First, detect or inject Firebase
      const firebaseConfig = await this.detectFirebaseConfig(sessionId);
      
      // Inject Firebase SDK if not present
      await page.evaluate(() => {
        if (!window.firebase) {
          // Try to load Firebase from CDN
          const script = document.createElement('script');
          script.src = 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
          document.head.appendChild(script);
          
          return new Promise((resolve) => {
            script.onload = () => {
              const authScript = document.createElement('script');
              authScript.src = 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
              document.head.appendChild(authScript);
              authScript.onload = resolve;
            };
          });
        }
      });

      // Wait a bit for Firebase to load
      await page.waitForTimeout(2000);

      // Try to find Firebase auth UI elements
      const authMethod = await this.detectAuthMethod(sessionId);

      if (authMethod === 'ui') {
        // Use Firebase UI
        return await this.loginWithFirebaseUI(sessionId, email, password);
      } else {
        // Use programmatic Firebase auth
        return await this.loginProgrammatically(sessionId, email, password, firebaseConfig);
      }
    } catch (error) {
      logger.error(`Firebase login failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Detect authentication method (UI or programmatic)
   * @param {string} sessionId
   * @returns {Promise<string>} 'ui' or 'programmatic'
   */
  async detectAuthMethod(sessionId) {
    try {
      const hasUI = await webAutomation.evaluate(sessionId, () => {
        // Check for Firebase UI elements
        const firebaseUI = document.querySelector('#firebaseui-auth-container') ||
                          document.querySelector('.firebaseui-container') ||
                          document.querySelector('[data-firebase-auth]');
        
        // Check for common auth form patterns
        const authForm = document.querySelector('form[action*="auth"]') ||
                        document.querySelector('.auth-form') ||
                        document.querySelector('#login-form');
        
        return !!(firebaseUI || authForm);
      });

      return hasUI ? 'ui' : 'programmatic';
    } catch (error) {
      return 'programmatic'; // Default to programmatic
    }
  }

  /**
   * Login using Firebase UI (interactive)
   * @param {string} sessionId
   * @param {string} email
   * @param {string} password
   * @returns {Promise<boolean>}
   */
  async loginWithFirebaseUI(sessionId, email, password) {
    const page = webAutomation.pages.get(sessionId);
    
    try {
      // Wait for Firebase UI to load
      await page.waitForSelector('input[type="email"], input[name="email"], #email', { timeout: 10000 });
      
      // Fill email
      const emailSelector = await page.evaluate(() => {
        return document.querySelector('input[type="email"], input[name="email"], #email')?.getAttribute('id') || 
               'input[type="email"], input[name="email"], #email';
      });
      
      await page.type(emailSelector, email);
      
      // Click next/continue button if present
      const nextButton = await page.$('button:has-text("Next"), button:has-text("Continue"), button[type="submit"]');
      if (nextButton) {
        await nextButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Fill password
      await page.waitForSelector('input[type="password"], input[name="password"], #password', { timeout: 10000 });
      const passwordSelector = await page.evaluate(() => {
        return document.querySelector('input[type="password"], input[name="password"], #password')?.getAttribute('id') || 
               'input[type="password"], input[name="password"], #password';
      });
      
      await page.type(passwordSelector, password);
      
      // Submit
      const submitButton = await page.$('button:has-text("Sign in"), button:has-text("Login"), button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
      } else {
        await page.keyboard.press('Enter');
      }
      
      // Wait for navigation or success
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      
      logger.info(`Firebase UI login successful for session: ${sessionId}`);
      return true;
    } catch (error) {
      logger.error(`Firebase UI login failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Login programmatically using Firebase SDK
   * @param {string} sessionId
   * @param {string} email
   * @param {string} password
   * @param {Object} firebaseConfig
   * @returns {Promise<boolean>}
   */
  async loginProgrammatically(sessionId, email, password, firebaseConfig) {
    const page = webAutomation.pages.get(sessionId);
    
    try {
      // Inject and execute Firebase auth
      const result = await page.evaluate(async (email, password, config) => {
        try {
          // Initialize Firebase if not already
          if (!window.firebase || !window.firebase.apps || window.firebase.apps.length === 0) {
            if (config) {
              window.firebase.initializeApp(config);
            } else {
              // Try to get config from page
              const existingConfig = window.firebaseConfig || 
                                    (window.firebase && window.firebase.apps[0]?.options);
              if (existingConfig) {
                window.firebase.initializeApp(existingConfig);
              } else {
                throw new Error('Firebase config not found');
              }
            }
          }

          const auth = window.firebase.auth();
          
          // Sign in with email and password
          const userCredential = await auth.signInWithEmailAndPassword(email, password);
          
          // Wait for auth state to be ready
          await new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged((user) => {
              if (user) {
                unsubscribe();
                resolve(user);
              }
            });
          });

          return { success: true, user: userCredential.user?.email };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }, email, password, firebaseConfig);

      if (result.success) {
        // Wait for page to update after auth
        await page.waitForTimeout(2000);
        
        // Check if we need to navigate
        const currentUrl = page.url();
        if (currentUrl.includes('login') || currentUrl.includes('signin')) {
          // Try to navigate to home or dashboard
          await page.goto(new URL(page.url()).origin, { waitUntil: 'networkidle2' });
        }

        logger.info(`Firebase programmatic login successful for session: ${sessionId}`);
        return true;
      } else {
        throw new Error(result.error || 'Firebase login failed');
      }
    } catch (error) {
      logger.error(`Firebase programmatic login failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   * @param {string} sessionId
   * @returns {Promise<boolean>}
   */
  async isAuthenticated(sessionId) {
    try {
      const result = await webAutomation.evaluate(sessionId, () => {
        if (window.firebase && window.firebase.auth) {
          const auth = window.firebase.auth();
          return auth.currentUser !== null;
        }
        return false;
      });
      return result;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current Firebase user
   * @param {string} sessionId
   * @returns {Promise<Object|null>}
   */
  async getCurrentUser(sessionId) {
    try {
      const user = await webAutomation.evaluate(sessionId, () => {
        if (window.firebase && window.firebase.auth) {
          const auth = window.firebase.auth();
          const currentUser = auth.currentUser;
          if (currentUser) {
            return {
              email: currentUser.email,
              uid: currentUser.uid,
              displayName: currentUser.displayName
            };
          }
        }
        return null;
      });
      return user;
    } catch (error) {
      logger.error(`Failed to get current user: ${error.message}`);
      return null;
    }
  }
}

export const firebaseAuth = new FirebaseAuth();
export default firebaseAuth;

