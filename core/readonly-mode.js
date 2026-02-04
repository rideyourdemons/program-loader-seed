/**
 * Read-Only Mode Enforcement
 * Prevents any write operations without explicit authorization.
 */
class ReadOnlyMode {
  constructor() {
    this.authorized = false;
    this.authorizationToken = null;
    this.attemptedWrites = [];
  }

  isAuthorized(operation, target) {
    if (this.authorized) {
      return true;
    }

    this.attemptedWrites.push({
      timestamp: new Date().toISOString(),
      operation,
      target,
      authorized: false
    });

    return false;
  }

  authorize(token) {
    if (token && token.length > 0) {
      this.authorized = true;
      this.authorizationToken = token;
      return true;
    }
    return false;
  }

  revokeAuthorization() {
    this.authorized = false;
    this.authorizationToken = null;
  }

  getAttemptedWrites() {
    return this.attemptedWrites;
  }

  clearAttemptedWrites() {
    this.attemptedWrites = [];
  }
}

export const readOnlyMode = new ReadOnlyMode();
export default readOnlyMode;
