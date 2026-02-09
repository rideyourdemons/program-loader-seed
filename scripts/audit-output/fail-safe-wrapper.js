
/**
 * FAIL-SAFE WRAPPER - Shadow Mode
 * New engine runs first, falls back to legacy code if exception occurs
 * Failover time: <10ms target
 */

class FailSafeEngine {
  constructor(newEngine, legacyEngine) {
    this.newEngine = newEngine;
    this.legacyEngine = legacyEngine;
    this.failoverCount = 0;
    this.lastFailover = null;
  }
  
  async execute(operation, ...args) {
    const startTime = performance.now();
    
    try {
      // Try new engine first
      const result = await Promise.race([
        this.newEngine[operation](...args),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), FAILOVER_TIMEOUT_MS)
        )
      ]);
      
      const duration = performance.now() - startTime;
      if (duration > FAILOVER_TIMEOUT_MS) {
        throw new Error(`Operation exceeded 10ms`);
      }
      
      return { success: true, result, engine: 'new', duration };
      
    } catch (error) {
      // Fail-safe to legacy
      const failoverStart = performance.now();
      this.failoverCount++;
      this.lastFailover = new Date().toISOString();
      
      try {
        const legacyResult = await this.legacyEngine[operation](...args);
        const failoverDuration = performance.now() - failoverStart;
        
        return {
          success: true,
          result: legacyResult,
          engine: 'legacy',
          duration: failoverDuration,
          failover: true,
          originalError: error.message
        };
      } catch (legacyError) {
        throw new Error(`Both engines failed: ${error.message} | ${legacyError.message}`);
      }
    }
  }
  
  getStats() {
    return {
      failoverCount: this.failoverCount,
      lastFailover: this.lastFailover
    };
  }
}
