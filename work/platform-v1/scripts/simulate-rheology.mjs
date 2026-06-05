
class MINDRheologySimulator {
  analyzeAndTreat(mud, weightGain) {
    let bentonite = 0;
    let barite = 0;
    let polymer = 0;
    let directive = "Mud properties within optimal threshold bands. Maintain current circulation.";

    if (mud.yieldPoint < 12) {
      bentonite = 15;
      directive = "CRITICAL: Low yield point detected. Gel strength insufficient to lift cuttings. Inject Bentonite.";
    }
    if (weightGain > 0) {
      barite = Math.round(weightGain * 20);
      directive = `ALERT: Increasing mud density by ${weightGain} PPG. Adding Barite weighting agents to counteract zone influx pressure.`;
    }
    if (mud.sandContent > 1.0) {
      polymer = 5;
      directive = "WARNING: Sand contamination exceeds 1.0%. Clear shale shaker screens and add polymers.";
    }

    const cost = (bentonite + barite + polymer) * 45;
    return { bentonite, barite, polymer, cost, directive };
  }

  renderReport(conditionName, mud, weightGain) {
    const tx = this.analyzeAndTreat(mud, weightGain);
    
    return `
================================================================================
?? REAL-TIME MUD RHEOLOGY MONITORING ENGINE // ZONE: ${conditionName}
================================================================================
?? ACTIVE CHEMICAL TELEMETRY RAW COUNTS:
   * System Fluid pH:        ${mud.pH} pH
   * Plastic Viscosity:      ${mud.plasticViscosity} cP
   * Yield Point Parameter:  ${mud.yieldPoint} lbs/100ft²
   * Abrasive Sand Volume:   ${mud.sandContent}% (Target < 1.0%)

?? AUTOMATED LOGISTICS MIX-TANK DIRECTIVE:
   -> ${tx.directive}

?? EXPENDABLE MATERIAL REQUISITION MATRIX:
   * Bentonite Sacks:   ${tx.bentonite} bags
   * Barite Sacks:      ${tx.barite} bags
   * Polymer Additives: ${tx.polymer} bags
   -----------------------------------------------------------------------------
   * SHIFT PIT TREATMENT ESTIMATED COST: $${tx.cost.toLocaleString()} CAD
================================================================================`;
  }
}

const simulator = new MINDRheologySimulator();

// Scenario A: Standard stable basement rock
console.log(simulator.renderReport("PRISTINE BASEMENT GRANITE", { pH: 9.2, plasticViscosity: 18, yieldPoint: 15, sandContent: 0.2 }, 0));

// Scenario B: Encountering water flow - sand entry & pressure kick requiring immediate weighting action
console.log(simulator.renderReport("SANDY HYDROSTATIC AQUIFER INFLUX", { pH: 8.1, plasticViscosity: 12, yieldPoint: 8, sandContent: 2.4 }, 1.5));

