
export interface CirculationStatus {
  pumpRateGPM: number;
  returnRateGPM: number;
  volumeLossRateGPM: number;
  circulationEfficiencyPct: number;
  statusFlag: "NORMAL" | "WARNING_FLUID_LOSS" | "CRITICAL_LOST_CIRCULATION";
  recommendedAction: string;
}

export class MINDCirculationEngine {
  /**
   * Analyzes active fluid loops to catch formation leakage and borehole stability drops early.
   */
  public evaluateCirculation(pumpRateGPM: number, returnRateGPM: number): CirculationStatus {
    const volumeLossRateGPM = Math.max(0, pumpRateGPM - returnRateGPM);
    const circulationEfficiencyPct = pumpRateGPM > 0 
      ? parseFloat(((returnRateGPM / pumpRateGPM) * 100).toFixed(1)) 
      : 100;

    let statusFlag: "NORMAL" | "WARNING_FLUID_LOSS" | "CRITICAL_LOST_CIRCULATION" = "NORMAL";
    let recommendedAction = "Maintain current pump pressure and drill ahead.";

    if (circulationEfficiencyPct < 70) {
      statusFlag = "CRITICAL_LOST_CIRCULATION";
      recommendedAction = "CRITICAL: Stop drilling immediately! Mix and spot a high-viscosity Stop-Loss sawdust/LCM squeeze matrix to seal the formation fracture plane.";
    } else if (circulationEfficiencyPct < 95) {
      statusFlag = "WARNING_FLUID_LOSS";
      recommendedAction = "ALERT: Minor downhole formation seepage detected. Increase mud polymer concentrations and monitor pit volume drops closely.";
    }

    return {
      pumpRateGPM,
      returnRateGPM,
      volumeLossRateGPM,
      circulationEfficiencyPct,
      statusFlag,
      recommendedAction
    };
  }
}

