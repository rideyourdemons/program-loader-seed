/**
 * Read-Only Mode Enforcement
 * Prevents any write operations without explicit authorization
 */
class ReadOnlyMode {
  constructor() {
    this.authorized = false;
    this.authorizationToken = null;
    this.attemptedWrites = [];
  }

  /**
   * Check if write operations are authorized
   * @param {string} operation - Description of operation
   * @param {string} target - What is being modified
   * @returns {boolean}
   */
  isAuthorized(operation, target) {
    if (this.authorized) {
      return true;
    }

    // Log attempted write
    this.attemptedWrites.push({
      timestamp: new Date().toISOString(),
      operation,
      target,
      authorized: false
    });

    return false;
  }

  /**
   * Request authorization for write operations
   * @param {string} token - Authorization token
   * @returns {boolean}
   */
  authorize(token) {
    // In a real system, this would validate the token
    // For now, we'll use a simple check
    if (token && token.length > 0) {
      this.authorized = true;
      this.authorizationToken = token;
      return true;
    }
    return false;
  }

  /**
   * Revoke authorization
   */
  revokeAuthorization() {
    this.authorized = false;
    this.authorizationToken = null;
  }

  /**
   * Get list of attempted writes
   * @returns {Array}
   */
  getAttemptedWrites() {
    return this.attemptedWrites;
  }

  /**
   * Clear attempted writes log
   */
  clearAttemptedWrites() {
    this.attemptedWrites = [];
  }
}

export const readOnlyMode = new ReadOnlyMode();
export default readOnlyMode;

