
class MINDBitPredictorSimulator {
  predictBit(input) {
    const ropDecay = input.currentROP / input.baselineROP;
    let wear = (input.hours / 40) * 100 * (1 + (input.abrasiveness * 0.15));
    if (input.vibration > 4.5) wear += 15;
    
    const wearPct = Math.min(100, parseFloat(wear.toFixed(1)));
    const wearPerHour = wear / input.hours;
    const rul = wearPct >= 100 ? 0 : parseFloat(((100 - wearPct) / wearPerHour).toFixed(1));

    let state = "NORMAL_WEAR";
    let action = "Bit cutting geometry is performing within spec. Continue normal rotation.";

    if (wearPct >= 85 || ropDecay < 0.35) {
      state = "TERMINAL_EXHAUSTION";
      action = "CRITICAL: Diamond matrix completely depleted. Pull rods for an immediate bit change to prevent downhole metal structural damage.";
    } else if (ropDecay < 0.60 && input.vibration < 2.0) {
      state = "GLAZED_MATRIX";
      action = "ALERT: Bit diamonds have polished smooth. Drop an abrasive sand charge downhole to expose fresh diamond crystals.";
    }

    return { wearPct, rul, state, action };
  }

  renderBitReport(scenarioName, input) {
    const prediction = this.predictBit(input);
    const alertIcon = prediction.state === "NORMAL_WEAR" ? "??" : prediction.state === "GLAZED_MATRIX" ? "??" : "??";

    return `
================================================================================
?? PREDICTIVE BIT WEAR & TOOL DEGRADATION INTELLIGENCE // WORKLOG: ${scenarioName}
================================================================================
??? HARDWARE ID PROFILE:  ${input.bitSerialNumber}
?? RUNTIME TELEMETRY DATA COUNTS:
   * Hours Immersed on Bottom: ${input.hours} hours
   * Baseline Factory New ROP:  ${input.baselineROP} ft/hr
   * Realized Active ROP Log:  ${input.currentROP} ft/hr (Decay Ratio: ${(input.currentROP / input.baselineROP).toFixed(2)}x)
   * Rock Core Abrasiveness:   Class ${input.abrasiveness} / 5
   * Harmonic Structural Shock: ${input.vibration} Gs

?? PROJECTION ALGORITHMIC CALCULATIONS:
   * Computed Cutter Wear State: ${prediction.wearPct}% Degraded
   * Remaining Useful Life (RUL): ${prediction.rul} operational hours left

${alertIcon} SYSTEM CLASSIFICATION FLAG: ${prediction.state}
?? AUTOMATED FOREMAN ADVISORY STEP:
   -> ${prediction.action}
================================================================================`;
  }
}

const simulator = new MINDBitPredictorSimulator();

// Scenario A: Standard stable wear behavior
const cleanBitInput = { bitSerialNumber: "BIT-V9-MATRIX-001", hours: 10, baselineROP: 18, currentROP: 16, abrasiveness: 2, vibration: 1.8 };
console.log(simulator.renderBitReport("MID-INTERVAL ROUTINE ROTATION", cleanBitInput));

// Scenario B: Bit is completely chewed up inside an abrasive rock profile
const deadBitInput = { bitSerialNumber: "BIT-X3-QUARTZ-994", hours: 26, baselineROP: 15, currentROP: 4.2, abrasiveness: 5, vibration: 5.2 };
console.log(simulator.renderBitReport("TERMINAL QUARTZ FAULT BLUNTING", deadBitInput));

