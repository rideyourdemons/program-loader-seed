
export interface ConsumablesUsageInput {
  bitsConsumedCount: number;
  reamingShellsUsed: number;
  bentoniteSacksMixed: number;
  bariteSacksMixed: number;
  lcmSacksMixed: number;
  casingFeetLeftInHole: number;
}

export interface FinancialConsumablesInvoice {
  toolingCostCAD: number;
  chemicalCostCAD: number;
  casingCostCAD: number;
  totalConsumablesBurnCAD: number;
  costPerFootDrilledCAD: number;
}

export class MINDConsumablesEngine {
  // Fixed industrial market baseline pricing
  private static PRICE_PER_BIT = 1200;
  private static PRICE_PER_SHELL = 650;
  private static PRICE_PER_CHEMICAL_SACK = 45;
  private static PRICE_PER_CASING_FOOT = 35;

  /**
   * Translates material counts from the driller daily timesheet into immediate asset capital calculations.
   */
  public calculateShiftConsumablesBurn(usage: ConsumablesUsageInput, footageDrilled: number): FinancialConsumablesInvoice {
    const toolingCostCAD = (usage.bitsConsumedCount * MINDConsumablesEngine.PRICE_PER_BIT) + (usage.reamingShellsUsed * MINDConsumablesEngine.PRICE_PER_SHELL);
    
    const chemicalCostCAD = (usage.bentoniteSacksMixed + usage.bariteSacksMixed + usage.lcmSacksMixed) * MINDConsumablesEngine.PRICE_PER_CHEMICAL_SACK;
    
    const casingCostCAD = usage.casingFeetLeftInHole * MINDConsumablesEngine.PRICE_PER_CASING_FOOT;
    
    const totalConsumablesBurnCAD = toolingCostCAD + chemicalCostCAD + casingCostCAD;
    
    const costPerFootDrilledCAD = footageDrilled > 0 
      ? parseFloat((totalConsumablesBurnCAD / footageDrilled).toFixed(2)) 
      : 0;

    return {
      toolingCostCAD,
      chemicalCostCAD,
      casingCostCAD,
      totalConsumablesBurnCAD,
      costPerFootDrilledCAD
    };
  }
}

