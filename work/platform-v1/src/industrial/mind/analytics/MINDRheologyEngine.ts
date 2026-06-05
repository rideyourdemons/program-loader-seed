
export interface MudRheologyInput {
  pH: number;                  // Target: 8.5 - 10.5 (prevents pipe corrosion)
  plasticViscosityCP: number;  // Resistance to fluid flow (mPas/cP)
  yield PointLbs100ft2: number; // Ability to lift cuttings out of the hole
  sandContentPct: number;      // Max limit: 1% (abrasive sand destroys mud pumps)
}

export interface ChemicalTreatmentInvoice {
  bentoniteSacksRequired: number;  // For increasing viscosity/filter cake stability
  bariteSacksRequired: number;     // For increasing mud weight to control high pressure
  polymerSacksRequired: number;    // For cutting down fluid loss
  totalChemicalCostCAD: number;
  treatmentDirective: string;
}

export class MINDRheologyEngine {
  private static COST_PER_SACK = 45; // Flat average cost per industrial chemical product sack

  /**
   * Evaluates raw mud property metrics and outputs precise chemical counter-measures.
   */
  public analyzeAndTreat(mud: MudRheologyInput, targetMudWeightGainsPPG: number): ChemicalTreatmentInvoice {
    let bentoniteSacksRequired = 0;
    let bariteSacksRequired = 0;
    let polymerSacksRequired = 0;
    let treatmentDirective = "Mud properties within optimal threshold bands. Maintain current circulation.";

    // 1. Check if mud is getting too thin to carry rock fragments up to surface
    if (mud.yieldPointLbs100ft2 < 12) {
      bentoniteSacksRequired = 15;
      treatmentDirective = "CRITICAL: Low yield point detected. Gel strength insufficient to transport cuttings. Inject Bentonite.";
    }

    // 2. Add Barite if the geologist needs to spike mud weight to hold back formation pressure
    if (targetMudWeightGainsPPG > 0) {
      bariteSacksRequired = Math.round(targetMudWeightGainsPPG * 20);
      treatmentDirective = `ALERT: Increasing mud density by ${targetMudWeightGainsPPG} PPG to offset zone influx. Injecting Barite weighting agents.`;
    }

    // 3. Check for high sand content which erodes downhole components
    if (mud.sandContentPct > 1.0) {
      polymerSacksRequired = 5;
      treatmentDirective = "WARNING: Sand contamination exceeds 1.0%. Spin hydrocyclones/desanders and add polymer thinners immediately.";
    }

    const totalChemicalCostCAD = (bentoniteSacksRequired + bariteSacksRequired + polymerSacksRequired) * MINDRheologyEngine.COST_PER_SACK;

    return {
      bentoniteSacksRequired,
      bariteSacksRequired,
      polymerSacksRequired,
      totalChemicalCostCAD,
      treatmentDirective
    };
  }
}

