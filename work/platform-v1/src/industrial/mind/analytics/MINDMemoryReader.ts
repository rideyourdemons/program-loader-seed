
import { readFileSync } from "fs";
import { join } from "path";

export interface IntervalRecord {
  holeId: string;
  depthStartMeter: number;
  depthEndMeter: number;
  formation: string;
  rqdPercentage: number;
  bitUsed: string;
  wearRatePercentage: number;
  costPerMeterCAD: number;
  incidents: string[];
  lessonLearned: string;
}

export class MINDMemoryReader {
  public searchPriorGround(targetFormation: string, targetDepth: number, maxDepthVariance: number = 30): IntervalRecord[] {
    try {
      const filePath = join(process.cwd(), "data", "intervals", "kamloops_intervals.json");
      const rawData = readFileSync(filePath, "utf-8");
      const logs: IntervalRecord[] = JSON.parse(rawData);

      return logs.filter(log => {
        const formationMatch = log.formation.toLowerCase().includes(targetFormation.toLowerCase());
        const depthMatch = Math.abs(log.depthStartMeter - targetDepth) <= maxDepthVariance || 
                           Math.abs(log.depthEndMeter - targetDepth) <= maxDepthVariance;

        return formationMatch || depthMatch;
      });
    } catch (error) {
      console.error("DATA_READ_ERROR: Unable to load operational history archives.", error);
      return [];
    }
  }
}

