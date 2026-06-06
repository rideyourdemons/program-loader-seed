
export interface RawShiftInput {
  drillerId: string;
  currentDepthMeters: number;
  mudViscositySeconds: number;
  bitSerialNumber: string;
}

export class MINDDataIngestionGuard {
  public validateRawInput(input: unknown): { success: boolean; errors: string[]; sanitizedData?: RawShiftInput } {
    const errors: string[] = [];
    
    if (!input || typeof input !== "object") {
      return { success: false, errors: ["INVALID_PAYLOAD"] };
    }

    const typedInput = input as Record<string, unknown>;

    if (typeof typedInput.drillerId !== "string") errors.push("Missing drillerId");
    if (typeof typedInput.currentDepthMeters !== "number") errors.push("Invalid currentDepthMeters");

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return {
      success: true,
      errors: [],
      sanitizedData: {
        drillerId: String(typedInput.drillerId),
        currentDepthMeters: Number(typedInput.currentDepthMeters),
        mudViscositySeconds: Number(typedInput.mudViscositySeconds || 0),
        bitSerialNumber: String(typedInput.bitSerialNumber || "")
      }
    };
  }
}

