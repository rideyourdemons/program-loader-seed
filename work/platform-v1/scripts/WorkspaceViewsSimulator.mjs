
export class MINDWorkspaceEngine {
  renderLevel1TrainingBrain(activeHole, currentDepth) {
    const nearbyHazards = activeHole.intervals
      .filter(inv => inv.lessonsLearned?.hazardFlagged && Math.abs(inv.toMeter - currentDepth) <= 20)
      .map(inv => `?? DEPTH [${inv.fromMeter}m-${inv.toMeter}m]: ${inv.lessonsLearned?.notes}`);

    return `
================================================================================
?? MIND MOBILE PORTAL // LEVEL 1: TRAINING BRAIN
================================================================================
[RIG STATUS]: ACTIVE DRILLING  |  [CURRENT DEPTH]: ${currentDepth} meters
--------------------------------------------------------------------------------
?? QUICK FIELD GUIDE:
   * Current Target:   ${activeHole.hole.holeName}
   * Contractor:       ${activeHole.hole.contractorCompany}
   * Recommended Bit:  Diamond Impregnated Matrix V9 (For Hard Formations)

?? UPCOMING DOWNHOLE HAZARDS (Next 20 Meters):
${nearbyHazards.length > 0 ? nearbyHazards.join("\n") : "   ? No major hazards flagged by cross-shifts nearby."}

?? TAP TO LOG CONSUMABLES:
   [1] Add Cup Polymer  [2] Add Bag Bentonite  [3] Report Bit Swap
================================================================================`;
  }

  renderLevel2OperationsBrain(activeHole) {
    const totalIntervals = activeHole.intervals.length;
    const totalDowntime = activeHole.intervals.reduce((acc, inv) => acc + inv.operations.downtimeMinutes, 0);
    
    return `
================================================================================
??? MIND SITE COCKPIT // LEVEL 2: OPERATIONS BRAIN
================================================================================
[OPERATIONAL SUMMARY]: ${activeHole.site.siteName} (${activeHole.site.region})
--------------------------------------------------------------------------------
?? PRODUCTION LOGS:
   * Active Intervals Logged: ${totalIntervals}
   * Total Accumulated Downtime: ${totalDowntime} minutes
   * Current Status: ${activeHole.hole.status.toUpperCase()}

?? FLUID & GROUND CONDITIONS ENGINE:
${activeHole.intervals.map(inv => 
  `   -> [${inv.fromMeter}m - ${inv.toMeter}m] Lithology: ${inv.geology.lithology.padEnd(35)} | Mud Viscosity: ${inv.mudSystem.viscositySeconds}s`
).join("\n")}

?? FOREMAN ACTIONS:
   [A] Sign Off Shift Report  [B] Trigger Tool Consumption Audit  [C] Flag Safety Violation
================================================================================`;
  }

  renderLevel3ExecutiveBrain(activeHole) {
    const totals = activeHole.intervals.reduce((acc, current) => {
      acc.ops += current.costs.rigOperationalCost;
      acc.mud += current.costs.mudChemicalsCost;
      acc.tools += current.costs.toolingWearCost;
      return acc;
    }, { ops: 0, mud: 0, tools: 0 });

    const totalCost = totals.ops + totals.mud + totals.tools;
    const costPerMeter = (totalCost / activeHole.hole.currentDepthMeters).toFixed(2);

    return `
================================================================================
?? MIND CAPITAL PORTAL // LEVEL 3: EXECUTIVE BRAIN
================================================================================
[PROJECT FINANCIAL AUDIT]: ${activeHole.project.projectName.toUpperCase()} [FY ${activeHole.project.fiscalYear}]
--------------------------------------------------------------------------------
?? CAPITAL EFFICIENCY DASHBOARD:
   * Total Capital Burned:    $${totalCost.toLocaleString()} ${activeHole.intervals[0]?.costs.currency || "CAD"}
   * Realized Cost Per Meter: $${costPerMeter} / meter
   * Target Depth Completion:  ${((activeHole.hole.currentDepthMeters / activeHole.hole.targetDepthMeters) * 100).toFixed(1)}%

?? HIGH-COST FORMATION LEAKAGE ANALYTICS:
${activeHole.intervals.map(inv => {
  const invTotal = inv.costs.rigOperationalCost + inv.costs.mudChemicalsCost + inv.costs.toolingWearCost;
  return `   * Zone [${inv.fromMeter}m - ${inv.toMeter}m] (${inv.geology.lithology}): $${invTotal.toLocaleString()} total burn`;
}).join("\n")}

?? STRATEGIC RECOMMENDATIONS:
   * Fluid Loss Mitigation: Switch polymer program before entering Fault Zone B.
   * Contractor Assessment: ${activeHole.hole.contractorCompany} operational variance is within 4.2% of pro-forma budget.
================================================================================`;
  }

  routeToWorkspace(session, activeHole) {
    console.log(`\n?? Routing User: ${session.username} [Role: ${session.assignedRole.toUpperCase()}]`);
    if (session.assignedRole === "drill_crew") {
      console.log(this.renderLevel1TrainingBrain(activeHole, activeHole.hole.currentDepthMeters));
    } else if (session.assignedRole === "geologist") {
      console.log(this.renderLevel2OperationsBrain(activeHole));
    } else if (session.assignedRole === "exploration_manager") {
      console.log(this.renderLevel3ExecutiveBrain(activeHole));
    }
  }
}

