/**
 * Client-Side Compliance State
 * 
 * PURPOSE: Maintain compliance status locally without backend API
 * SCOPE: Local state management for compliance UI
 */

class ComplianceState {
  constructor() {
    this.state = {
      status: "ACTIVE",
      region: "US", // Default region
      mode: "SELF_HELP_ONLY",
      disclaimersAccepted: true,
      lastUpdated: new Date().toISOString()
    };
    
    // Load region from localStorage if available
    const savedRegion = localStorage.getItem('ryd_compliance_region');
    if (savedRegion) {
      this.state.region = savedRegion;
    }
  }

  /**
   * Get current compliance state
   * @returns {Object} Current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Update region
   * @param {string} region - Region code (US, CA, EU, UK)
   */
  setRegion(region) {
    this.state.region = region;
    this.state.lastUpdated = new Date().toISOString();
    localStorage.setItem('ryd_compliance_region', region);
  }

  /**
   * Get region
   * @returns {string} Current region
   */
  getRegion() {
    return this.state.region;
  }

  /**
   * Update compliance status
   * @param {string} status - Status (ACTIVE, REVIEW, BLOCKED)
   */
  setStatus(status) {
    this.state.status = status;
    this.state.lastUpdated = new Date().toISOString();
  }

  /**
   * Check if compliant
   * @returns {boolean} True if compliant
   */
  isCompliant() {
    return this.state.status === "ACTIVE" && this.state.disclaimersAccepted;
  }
}

// Make available globally
window.ComplianceState = ComplianceState;

// Initialize global instance
window.complianceState = new ComplianceState();

