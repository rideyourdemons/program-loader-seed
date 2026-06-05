
import { RawShiftInput } from "../validation/DataIngestionGuard";

export interface MasterState {
  project: { projectName: string; fiscalYear: number };
  hole: { holeName: string; contractorCompany: string; currentDepthMeters: number; targetDepthMeters: number; status: string };
  site: { siteName: string; region: string };
  intervals: any[];
}

export class MINDStateCoordinator {
  private state: MasterState;

  constructor(initialState: MasterState) {
    this.state = initialState;
  }

  /**
   * Retrieves the current synchronized master state
   */
  public getState(): MasterState {
    return this.state;
  }

  /**
   * Processes validated field telemetry and updates operations/financial models instantly
   */
  public applyValidatedShiftLog(sanitized: RawShiftInput, costs: { rigCost: number; mudCost: number; toolCost: number }) {
    // 1. Update the current drilling depth tracker
    this.state.hole.currentDepthMeters = sanitized.currentDepthMeters;
    
    if (this.state.hole.currentDepthMeters >= this.state.hole.targetDepthMeters) {
      this.state.hole.status = "COMPLETED";
    }

    // 2. Append a new operational depth interval history block
    const previousMaxDepth = this.state.intervals.length > 0 
      ? this.state.intervals[this.state.intervals.length - 1].toMeter 
      : 0;

    this.state.intervals.push({
      fromMeter: previousMaxDepth,
      toMeter: sanitized.currentDepthMeters,
      geology: { lithology: "Inferred Shear Zone" },
      mudSystem: { viscositySeconds: sanitized.mudViscositySeconds },
      operations: { downtimeMinutes: 0 },
      costs: {
        rigOperationalCost: costs.rigCost,
        mudChemicalsCost: costs.mudCost,
        toolingWearCost: costs.toolCost,
        currency: "CAD"
      },
      lessonsLearned: {
        hazardFlagged: sanitized.mudViscositySeconds > 50,
        notes: sanitized.mudViscositySeconds > 50 ? "High viscosity mud system adjustment logged by crew." : "Normal drilling conditions."
      }
    });
  }
}

