
class MINDTimesheetSimulator {
  auditTimesheet(sheet) {
    const total = sheet.rigMoveHours + sheet.activeDrillingHours + sheet.trippingHours + sheet.holeStabilizationHours + sheet.standbyHours + sheet.mechanicalDowntimeHours;
    const variance = parseFloat((24 - total).toFixed(2));
    const valid = Math.abs(variance) < 0.05;
    const revenueHours = sheet.activeDrillingHours + sheet.rigMoveHours;
    const npHours = total - revenueHours;
    const cost = total * 400;

    return { valid, total, variance, revenueHours, npHours, cost };
  }

  renderAuditReport(title, sheet) {
    const result = this.auditTimesheet(sheet);
    const statusIcon = result.valid ? "? TIMESHEET VERIFIED" : "? TIMESHEET REJECTED (AUDIT FAIL)";

    return `
================================================================================
?? RIG OPERATIONS DAILY TIMESHEET AUDIT // SHIFT: ${title}
================================================================================
?? Driller Token Pointer: ${sheet.drillerId}

?? 24-HOUR METRIC METADATA BALANCE BREAKDOWN:
   * Rig Move Operations:    ${sheet.rigMoveHours}h
   * On-Bottom Drilling:     ${sheet.activeDrillingHours}h
   * Tripping (Rod Pulls):   ${sheet.trippingHours}h
   * Hole Stabilization:     ${sheet.holeStabilizationHours}h
   * Standby Hours:          ${sheet.standbyHours}h
   * Mechanical Downtime:    ${sheet.mechanicalDowntimeHours}h
   -----------------------------------------------------------------------------
   * TOTAL ACCOUNTED HOURS:  ${result.total}h / 24.00h (Variance: ${result.variance}h)

?? PRODUCTION TIME EFFICIENCY LOGISTICS:
   * Revenue/Progress Hours: ${result.revenueHours}h
   * Non-Productive Time:    ${result.npHours}h
   * Calculated Shift Cost:  $${result.cost.toLocaleString()} CAD

?? COMPLIANCE AUDIT STATUS: ${statusIcon}
================================================================================`;
  }
}

const simulator = new MINDTimesheetSimulator();

const badSheet = { drillerId: "CREW-LEAD-A", rigMoveHours: 4, activeDrillingHours: 8, trippingHours: 4, holeStabilizationHours: 2, standbyHours: 1, mechanicalDowntimeHours: 2 };
console.log(simulator.renderAuditReport("MESSY CREW ENTRY", badSheet));

const perfectSheet = { drillerId: "BIT-BOSS-404", rigMoveHours: 0, activeDrillingHours: 12, trippingHours: 5, holeStabilizationHours: 3, standbyHours: 2, mechanicalDowntimeHours: 2 };
console.log(simulator.renderAuditReport("BALANCED FIELD COMPLIANCE LOG", perfectSheet));

