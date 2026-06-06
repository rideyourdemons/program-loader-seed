
import type { AdvancedShiftInput } from "./MINDContracts.js";

export class MINDTimesheetEngine {
  public auditAdvancedTimesheet(input: AdvancedShiftInput) {
    const totalHours = input.activeDrillingHours + input.reamingHours + input.circulatingHours + 
                       input.rigMoveHours + input.standbyHours + input.mechanicalDowntimeHours + 
                       input.holeStabilizationHours + input.waterLineHours + input.machineServiceHours + 
                       input.pressureTestingHours + (input.safetyMeetingMinutes / 60);

    const footageDrilled = input.endingFootageFeet - input.startingFootageFeet;
    const rateOfPenetrationFtHr = input.activeDrillingHours > 0 ? parseFloat((footageDrilled / input.activeDrillingHours).toFixed(1)) : 0;

    return {
      audit: {
        valid24HourBalance: Math.abs(totalHours - 24) < 0.01,
        totalHoursLogged: totalHours,
        footageDrilled,
        rateOfPenetrationFtHr
      }
    };
  }
}

