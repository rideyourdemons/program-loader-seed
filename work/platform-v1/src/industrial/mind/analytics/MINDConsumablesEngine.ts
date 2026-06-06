
import type { SiteStockSnapshot } from "./MINDContracts.js";

export interface ConsumablesUsage {
  bitsConsumedCount: number;
  reamingShellsUsed: number;
  bentoniteSacksMixed: number;
  bariteSacksMixed: number;
  lcmSacksMixed: number;
  casingFeetLeftInHole: number;
}

export class MINDConsumablesEngine {
  public calculateShiftConsumablesBurn(usage: ConsumablesUsage, footageDrilled: number) {
    const totalConsumablesBurnCAD = (usage.bitsConsumedCount * 1200) + (usage.casingFeetLeftInHole * 35);
    const costPerFootDrilledCAD = footageDrilled > 0 ? parseFloat((totalConsumablesBurnCAD / footageDrilled).toFixed(2)) : 0;

    return { totalConsumablesBurnCAD, costPerFootDrilledCAD };
  }

  public generateSupplierRequisitions(role: string, currentStock: SiteStockSnapshot) {
    if (role !== "SUPPLIER" && role !== "EXECUTIVE") {
      throw new Error("SECURITY_VIOLATION");
    }
    const orders = [];
    if (currentStock.lcm < 5) {
      orders.push({ orderId: "REQ-LCM-991", itemRequested: "Lost Circulation Material", quantityNeeded: 50, deliveryUrgency: "CRITICAL" });
    }
    return orders;
  }
}

