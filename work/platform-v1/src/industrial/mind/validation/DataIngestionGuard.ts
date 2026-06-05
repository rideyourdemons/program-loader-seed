
export interface RawShiftInput {
  drillerId: string;
  currentDepthMeters: number;
  mudViscositySeconds: number;
  bitSerialNumber: string;
}

export class MINDDataIngestionGuard {
  public validateShiftLog(input: RawShiftInput): { success: boolean; errors: string[]; sanitizedData?: RawShiftInput } {
    const errors: string[] = [];
    
    if (!input.drillerId || input.drillerId.trim() === "") {
      errors.push("INVALID_DRILLER_ID: Shift logs must contain a verifiable Driller Credentials Token.");
    }
    if (typeof input.currentDepthMeters !== "number" || input.currentDepthMeters <= 0) {
      errors.push("INVALID_DEPTH: Current depth must be a positive numeric value.");
    }
    if (typeof input.mudViscositySeconds !== "number" || input.mudViscositySeconds < 25 || input.mudViscositySeconds > 120) {
      errors.push("CRITICAL_MUD_VISCOSITY_OUT_OF_BOUNDS: Viscosity must be between 25s and 120s.");
    }
    if (!input.bitSerialNumber || !input.bitSerialNumber.startsWith("BIT-")) {
      errors.push("INVALID_TOOLING_SERIAL: Bit serial must match strict inventory prefix tracking standards.");
    }

    return {
      success: errors.length === 0,
      errors: errors,
      sanitizedData: errors.length === 0 ? {
        drillerId: input.drillerId.trim(),
        currentDepthMeters: Math.round(input.currentDepthMeters),
        mudViscositySeconds: Math.round(input.mudViscositySeconds),
        bitSerialNumber: input.bitSerialNumber.trim().toUpperCase()
      } : undefined
    };
  }
}

