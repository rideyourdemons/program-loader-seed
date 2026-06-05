
class MINDConsumablesSimulator {
  calculateBurn(usage, footage) {
    const tooling = (usage.bits * 1200) + (usage.shells * 650);
    const chemicals = (usage.bentonite + usage.barite + usage.lcm) * 45;
    const casing = usage.casingFeet * 35;
    const total = tooling + chemicals + casing;
    const perFoot = footage > 0 ? parseFloat((total / footage).toFixed(2)) : 0;

    return { tooling, chemicals, casing, total, perFoot };
  }

  renderInvoice(shiftTitle, usage, footage) {
    const res = this.calculateBurn(usage, footage);

    return `
================================================================================
?? DOWNHOLE CONSUMABLES MATERIAL RECONCILIATION // SHIFT: ${shiftTitle}
================================================================================
?? DRILLING METRIC BASE: ${footage} ft cut over shift span.

?? INVENTORY DISBURSEMENT LOG:
   * Diamond Bits Retrenched: ${usage.bits} units
   * Reaming Shells Swapped:  ${usage.shells} units
   * Bentonite Mud Gel Sacks: ${usage.bentonite} bags
   * Barite Weighting Agent:  ${usage.barite} bags
   * Lost Circulation (LCM):  ${usage.lcm} bags
   * Permanent Steel Casing:  ${usage.casingFeet} ft left downhole

?? RECONCILED EXPENSE MATRICES:
   * Tooling/Bit Asset Burn:  $${res.tooling.toLocaleString()} CAD
   * Fluid & Chemical Cost:   $${res.chemicals.toLocaleString()} CAD
   * Lost Casing Capital:     $${res.casing.toLocaleString()} CAD
   -----------------------------------------------------------------------------
   * TOTAL CONSUMABLES ACCRUAL: $${res.total.toLocaleString()} CAD
   * RUNNING MATERIAL COST/FOOT: $${res.perFoot} / foot
================================================================================`;
  }
}

const simulator = new MINDConsumablesSimulator();

// Scenario A: Smooth drilling
const smoothUsage = { bits: 0, shells: 0, bentonite: 4, barite: 0, lcm: 0, casingFeet: 0 };
console.log(simulator.renderInvoice("ROUTINE FORMATION ROTATION", smoothUsage, 110));

// Scenario B: Encountering a massive cave-in and sand fracture zone
const emergencyUsage = { bits: 1, shells: 1, bentonite: 25, barite: 10, lcm: 40, casingFeet: 60 };
console.log(simulator.renderInvoice("EMERGENCY BOREHOLE COLLAPSE STABILIZATION", emergencyUsage, 15));

