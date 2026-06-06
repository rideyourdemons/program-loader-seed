
import { runGeoBrain } from "../brains/geo-brain.js";
import { runDrillBrain } from "../brains/drill-brain.js";
import { runCostBrain } from "../brains/cost-brain.js";
import { runInventoryBrain } from "../brains/inventory-brain.js";
import { runTrainingBrain } from "../brains/training-brain.js";
import { runSafetyBrain } from "../brains/safety-brain.js";

export function runIndustrialMindRouter() { 
  return [runGeoBrain(), runDrillBrain(), runCostBrain(), runInventoryBrain(), runTrainingBrain(), runSafetyBrain()]; 
}

