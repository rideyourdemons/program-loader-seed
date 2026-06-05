
class MINDCirculationSimulator {
  evaluateCirculation(pumpRate, returnRate) {
    const loss = Math.max(0, pumpRate - returnRate);
    const efficiency = pumpRate > 0 ? parseFloat(((returnRate / pumpRate) * 100).toFixed(1)) : 100;
    
    let flag = "NORMAL";
    let action = "Maintain current pump pressure and drill ahead.";
    
    if (efficiency < 70) {
      flag = "CRITICAL_LOST_CIRCULATION";
      action = "CRITICAL: Stop drilling! Spot a high-viscosity Stop-Loss sawdust matrix immediately.";
    } else if (efficiency < 95) {
      flag = "WARNING_FLUID_LOSS";
      action = "ALERT: Fluid loss detected. Increase polymer concentrations and check pit levels.";
    }

    return { loss, efficiency, flag, action };
  }

  renderCirculationTelemetry(scenarioName, pumpRate, returnRate) {
    const metrics = this.evaluateCirculation(pumpRate, returnRate);
    const statusIcon = metrics.flag === "NORMAL" ? "?" : metrics.flag === "WARNING_FLUID_LOSS" ? "??" : "??";

    return `
================================================================================
?? HYDRAULIC CIRCULATION ENGINE SIMULATION // SCENARIO: ${scenarioName}
================================================================================
?? REAL-TIME FLOW TELEMETRY:
   * Target Pump Delivery:  ${pumpRate} GPM (Gallons Per Minute)
   * Surface Pit Return:    ${returnRate} GPM
   * Underground Leakage:   ${metrics.loss} GPM
   * Return Efficiency:     ${metrics.efficiency}%

${statusIcon} SYSTEM LEVEL DIAGNOSTIC FLAG: ${metrics.flag}
?? AUTOMATED FOREMAN COMMAND ACTION DIRECTIVE:
   -> ${metrics.action}
================================================================================`;
  }
}

const simulator = new MINDCirculationSimulator();

// Scenario A: Clean continuous cycle
console.log(simulator.renderCirculationTelemetry("STABLE VOLCANIC BASEMENT", 350, 348));

// Scenario B: Dropping down into highly fractured Fault Zone B rock formations
console.log(simulator.renderCirculationTelemetry("FAULT ZONE B RE-ENTRY INTERSECTION", 350, 210));

