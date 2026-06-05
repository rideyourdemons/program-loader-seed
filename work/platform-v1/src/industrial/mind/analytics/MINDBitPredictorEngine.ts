
export interface BitWearInput {
  bitSerialNumber: string;
  hoursRun: number;
  currentROPFtHr: number;
  baselineROPFtHr: number;     // What this bit cut when it was brand new
  formationAbrasiveness: 1 | 2 | 3 | 4 | 5; // 1 = Soft Limestone, 5 = Highly Abrasive Chert/Quartzite
  rotationalVibrationG: number; // Downhole triaxial accelerometer telemetry
}

export interface BitWearPrediction {
  calculatedWearPct: number;
  remainingUsefulLifeHours: number;
  degradationState: "EXCELLENT" | "NORMAL_WEAR" | "GLAZED_MATRIX" | "TERMINAL_EXHAUSTION";
  actionDirective: string;
}

export class MINDBitPredictorEngine {
  /**
   * Evaluates mechanical performance decay to project downhole tooling failure flags.
   */
  public predictBitFailure(input: BitWearInput): BitWearPrediction {
    // ROP decay ratio indicates how blunt the cutters have become
    const ropDecayRatio = input.currentROPFtHr / input.baselineROPFtHr;
    
    // Base wear model tracking hours modulated by formation abrasiveness multiplier
    let baseWearPct = (input.hoursRun / 40) * 100 * (1 + (input.formationAbrasiveness * 0.15));
    
    // Accelerate wear if the tool is shaking violently downhole
    if (input.rotationalVibrationG > 4.5) {
      baseWearPct += 15;
    }

    const calculatedWearPct = Math.min(100, parseFloat(baseWearPct.toFixed(1)));
    
    // Estimate hours left based on current consumption trend
    const wearPerHour = baseWearPct / input.hoursRun;
    const remainingUsefulLifeHours = calculatedWearPct >= 100 
      ? 0 
      : parseFloat(((100 - calculatedWearPct) / wearPerHour).toFixed(1));

    let degradationState: "EXCELLENT" | "NORMAL_WEAR" | "GLAZED_MATRIX" | "TERMINAL_EXHAUSTION" = "NORMAL_WEAR";
    let actionDirective = "Bit cutting geometry is performing within spec. Continue normal rotation.";

    // Logic Gates for Warning States
    if (calculatedWearPct >= 85 || ropDecayRatio < 0.35) {
      degradationState = "TERMINAL_EXHAUSTION";
      actionDirective = "CRITICAL: Diamond cutting matrix completely depleted or stripped to blank steel steel backer. Pull rods for a bit change immediately to avoid hole damage.";
    } else if (ropDecayRatio < 0.60 && input.rotationalVibrationG < 2.0) {
      degradationState = "GLAZED_MATRIX";
      actionDirective = "ALERT: Bit diamonds have polished/glazed smooth due to insufficient Weight-on-Bit. Drop a charge of abrasive sand downhole to strip the matrix and expose fresh diamond crystals.";
    } else if (calculatedWearPct < 25) {
      degradationState = "EXCELLENT";
    }

    return {
      calculatedWearPct,
      remainingUsefulLifeHours,
      degradationState,
      actionDirective
    };
  }
}

