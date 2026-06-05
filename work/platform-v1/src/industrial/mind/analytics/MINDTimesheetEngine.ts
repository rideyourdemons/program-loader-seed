
export interface ShiftTimesheet {
  drillerId: string;
  rigMoveHours: number;         // Tear down, transport, and rig up time
  activeDrillingHours: number;   // Pure on-bottom rotating hours
  trippingHours: number;         // Rod pulls and bit changes
  holeStabilizationHours: number;// Conditioning mud, washing, reaming, cementing
  standbyHours: number;          // Waiting on orders, geologists, or weather
  mechanicalDowntimeHours: number;// Broken iron, pump repairs, hose failures
}

export interface TimesheetAudit {
  valid24HourBalance: boolean;
  totalLoggedHours: number;
  varianceHours: number;
  revenueGeneratingHours: number;
  nonProductiveHours: number;
  burnRateCAD: number;
}

export class MINDTimesheetEngine {
  private static RIG_OP_HOURLY_BURN = 400; // Base cost per hour to run the rig operation

  /**
   * Audits a daily timesheet submission to ensure it accounts for exactly 24 hours and calculates operational cost metrics.
   */
  public auditTimesheet(sheet: ShiftTimesheet): { audit: TimesheetAudit; errors: string[] } {
    const errors: string[] = [];
    
    const totalLoggedHours = 
      sheet.rigMoveHours + 
      sheet.activeDrillingHours + 
      sheet.trippingHours + 
      sheet.holeStabilizationHours + 
      sheet.standbyHours + 
      sheet.mechanicalDowntimeHours;

    const varianceHours = parseFloat((24 - totalLoggedHours).toFixed(2));
    const valid24HourBalance = Math.abs(varianceHours) < 0.05;

    if (!valid24HourBalance) {
      errors.push(`INVALID_SHIFT_DURATION: Total logged hours must equal exactly 24.00. Current log sums to ${totalLoggedHours}h (Variance: ${varianceHours}h).`);
    }

    const revenueGeneratingHours = sheet.activeDrillingHours + sheet.rigMoveHours;
    const nonProductiveHours = sheet.trippingHours + sheet.holeStabilizationHours + sheet.standbyHours + sheet.mechanicalDowntimeHours;
    
    // Calculate total capital burn for the 24-hour cycle
    const burnRateCAD = totalLoggedHours * MINDTimesheetEngine.RIG_OP_HOURLY_BURN;

    return {
      audit: {
        valid24HourBalance,
        totalLoggedHours,
        varianceHours,
        revenueGeneratingHours,
        nonProductiveHours,
        burnRateCAD
      },
      errors
    };
  }
}

