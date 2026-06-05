import { runGeoBrain } from '../brains/geo-brain';
import { runDrillBrain } from '../brains/drill-brain';
import { runCostBrain } from '../brains/cost-brain';
import { runInventoryBrain } from '../brains/inventory-brain';
import { runTrainingBrain } from '../brains/training-brain';
import { runSafetyBrain } from '../brains/safety-brain';

export function runIndustrialMindRouter() { return [runGeoBrain(), runDrillBrain(), runCostBrain(), runInventoryBrain(), runTrainingBrain(), runSafetyBrain()]; }

