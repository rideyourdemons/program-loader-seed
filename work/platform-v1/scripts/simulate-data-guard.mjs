
class MINDDataIngestionGuardSimulator {
  validateShiftLog(input) {
    const errors = [];
    if (!input.drillerId || input.drillerId.trim() === "") errors.push("INVALID_DRILLER_ID: Shift logs must contain a verifiable Driller Token.");
    if (!input.currentDepthMeters || input.currentDepthMeters <= 0) errors.push("INVALID_DEPTH: Current depth must be a positive number.");
    if (!input.mudViscositySeconds || input.mudViscositySeconds < 25 || input.mudViscositySeconds > 120) {
      errors.push("CRITICAL_MUD_VISCOSITY_OUT_OF_BOUNDS: Viscosity must be between 25s and 120s.");
    }
    if (!input.bitSerialNumber || !input.bitSerialNumber.startsWith("BIT-")) errors.push("INVALID_TOOLING_SERIAL: Bit serial must start with \"BIT-\".");

    return {
      success: errors.length === 0,
      errors: errors,
      sanitized: errors.length === 0 ? input : null
    };
  }
}

const guard = new MINDDataIngestionGuardSimulator();
const dirtyInput = { drillerId: "   ", currentDepthMeters: -45, mudViscositySeconds: 145, bitSerialNumber: "BAD-SERIAL-123" };

console.log("================================================================================");
const result = guard.validateShiftLog(dirtyInput);
console.log("? REJECTING DIRTY LOG ENTRY FROM CREW APP:");
result.errors.forEach(err => console.log(`   -> ${err}`));
console.log("================================================================================");

