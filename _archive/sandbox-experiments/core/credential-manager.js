/**
 * Secure Credential Manager
 * Stores credentials in memory only - never persists to disk
 * Automatically clears credentials after session timeout
 * Supports automatic session renewal
 */
class CredentialManager {
  constructor() {
    this.sessions = new Map(); // sessionId -> { credentials, expiresAt, type }
    this.defaultTimeout = 30 * 60 * 1000; // 30 minutes
    this.renewalTimers = new Map(); // sessionId -> timer
  }

  /**
   * Store credentials for a session (in memory only)
   * @param {string} sessionId - Unique session identifier
   * @param {Object} credentials - { username, password, url, type }
   * @param {number} timeoutMs - Session timeout in milliseconds
   * @param {Object} options - { autoRenew, renewalThreshold }
   * @returns {string} sessionId
   */
  storeCredentials(sessionId, credentials, timeoutMs = this.defaultTimeout, options = {}) {
    const expiresAt = Date.now() + timeoutMs;
    const autoRenew = options.autoRenew !== false; // Default to true
    const renewalThreshold = options.renewalThreshold || 0.2; // Renew when 20% time remains
    
    this.sessions.set(sessionId, {
      credentials: {
        username: credentials.username,
        password: credentials.password,
        url: credentials.url,
        type: credentials.type || "web", // web, api, ssh, etc.
        apiKey: credentials.apiKey,
        token: credentials.token,
        endpoint: credentials.endpoint
      },
      expiresAt,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      originalTimeout: timeoutMs,
      autoRenew,
      renewalThreshold
    });

    // Auto-cleanup expired sessions
    this.cleanupExpired();
    
    // Setup auto-renewal if enabled
    if (autoRenew) {
      this.setupAutoRenewal(sessionId);
    }

    return sessionId;
  }
  
  /**
   * Setup automatic session renewal
   * @param {string} sessionId
   */
  setupAutoRenewal(sessionId) {
    // Clear any existing renewal timer
    if (this.renewalTimers && this.renewalTimers.has(sessionId)) {
      clearTimeout(this.renewalTimers.get(sessionId));
    }
    
    if (!this.renewalTimers) {
      this.renewalTimers = new Map();
    }
    
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    const timeUntilRenewal = session.originalTimeout * (1 - session.renewalThreshold);
    const timer = setTimeout(() => {
      this.renewSession(sessionId);
    }, timeUntilRenewal);
    
    this.renewalTimers.set(sessionId, timer);
  }
  
  /**
   * Renew session expiration time
   * @param {string} sessionId
   * @returns {boolean} Success status
   */
  renewSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.autoRenew) {
      return false;
    }
    
    // Renew for the original timeout period
    session.expiresAt = Date.now() + session.originalTimeout;
    session.lastAccessed = Date.now();
    
    // Setup next renewal
    this.setupAutoRenewal(sessionId);
    
    return true;
  }
  
  /**
   * Manually extend session
   * @param {string} sessionId
   * @param {number} additionalMs - Additional milliseconds to extend
   * @returns {boolean} Success status
   */
  extendSession(sessionId, additionalMs = this.defaultTimeout) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    
    session.expiresAt = Date.now() + additionalMs;
    session.lastAccessed = Date.now();
    
    // Reset renewal timer
    if (session.autoRenew) {
      this.setupAutoRenewal(sessionId);
    }
    
    return true;
  }

  /**
   * Get credentials for a session (if not expired)
   * @param {string} sessionId
   * @returns {Object|null} credentials or null if expired/not found
   */
  getCredentials(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }

    // Update last accessed
    session.lastAccessed = Date.now();
    
    return session.credentials;
  }

  /**
   * Check if session exists and is valid
   * @param {string} sessionId
   * @returns {boolean}
   */
  hasValidSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return false;
    }
    
    return true;
  }

  /**
   * Remove credentials for a session
   * @param {string} sessionId
   */
  clearSession(sessionId) {
    // Clear renewal timer
    if (this.renewalTimers && this.renewalTimers.has(sessionId)) {
      clearTimeout(this.renewalTimers.get(sessionId));
      this.renewalTimers.delete(sessionId);
    }
    
    if (this.sessions.has(sessionId)) {
      // Securely clear credentials
      const session = this.sessions.get(sessionId);
      if (session.credentials) {
        // Overwrite sensitive data
        session.credentials.password = null;
        session.credentials.apiKey = null;
        session.credentials.token = null;
      }
      this.sessions.delete(sessionId);
      return true;
    }
    return false;
  }

  /**
   * Clear all sessions
   */
  clearAllSessions() {
    // Clear renewal timers
    if (this.renewalTimers) {
      for (const timer of this.renewalTimers.values()) {
        clearTimeout(timer);
      }
      this.renewalTimers.clear();
    }
    
    // Securely clear all credentials
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.credentials) {
        session.credentials.password = null;
        session.credentials.apiKey = null;
        session.credentials.token = null;
      }
    }
    this.sessions.clear();
  }
  
  /**
   * Initialize renewal timers map
   */
  constructor() {
    this.sessions = new Map(); // sessionId -> { credentials, expiresAt, type }
    this.defaultTimeout = 30 * 60 * 1000; // 30 minutes
    this.renewalTimers = new Map(); // sessionId -> timer
  }

  /**
   * Remove expired sessions
   */
  cleanupExpired() {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        if (session.credentials) {
          session.credentials.password = null;
          session.credentials.apiKey = null;
          session.credentials.token = null;
        }
        this.sessions.delete(sessionId);
      }
    }
  }

  /**
   * Get session info (without sensitive data)
   * @param {string} sessionId
   * @returns {Object|null}
   */
  getSessionInfo(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }

    return {
      sessionId,
      type: session.credentials.type,
      url: session.credentials.url,
      username: session.credentials.username, // Username is less sensitive
      createdAt: session.createdAt,
      lastAccessed: session.lastAccessed,
      expiresAt: session.expiresAt,
      timeRemaining: session.expiresAt - Date.now()
    };
  }

  /**
   * List all active sessions (without sensitive data)
   * @returns {Array}
   */
  listSessions() {
    this.cleanupExpired();
    return Array.from(this.sessions.keys()).map(sessionId => 
      this.getSessionInfo(sessionId)
    ).filter(info => info !== null);
  }

  /**
   * Generate a unique session ID
   * @returns {string}
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

// Singleton instance
export const credentialManager = new CredentialManager();

// Auto-cleanup every 5 minutes
setInterval(() => {
  credentialManager.cleanupExpired();
}, 5 * 60 * 1000);

export default credentialManager;

