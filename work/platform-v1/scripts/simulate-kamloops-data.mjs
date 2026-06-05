
import { MINDWorkspaceEngine } from "./WorkspaceViewsSimulator.mjs";

async function runMultiLevelSimulation() {
  const engine = new MINDWorkspaceEngine();

  const mockHoleState = {
    project: { projectId: "PRJ-BC-2026", projectName: "Kamloops Deep Copper", clientName: "Pacific Resource Exploration", fiscalYear: 2026 },
    site: { siteId: "ST-04", siteName: "Valley Shear Zone", region: "Kamloops, BC", environmentType: "surface" },
    hole: { holeId: "HL-26-09B", holeName: "Discovery Deep Target B", targetDepthMeters: 600, currentDepthMeters: 180, status: "drilling", contractorCompany: "Apex Frontier Drilling" },
    intervals: [
      {
        fromMeter: 0, toMeter: 60,
        geology: { lithology: "Glacial Till / Weathered Volcanics", hardnessScale: 3, rqdPercentage: 45, fractureFrequency: 8, groundWaterInflowLPM: 10 },
        mudSystem: { mudType: "water-based", viscositySeconds: 34, mudWeightPPG: 8.6, phLevel: 9.0, fluidLossVolumeCC: 12, consumablesMixed: [] },
        operations: { drillerId: "DRV-102", bitSerialNumber: "BIT-TR-0091", bitType: "Standard Tricone Rock Bit", averageRPM: 110, averageWOB: 25, penetrationRateMetersPerHour: 12.0, downtimeMinutes: 0 },
        costs: { rigOperationalCost: 2250, mudChemicalsCost: 350, toolingWearCost: 150, currency: "CAD" }
      },
      {
        fromMeter: 60, toMeter: 120,
        geology: { lithology: "Silicified Quartzite Shear Zone", hardnessScale: 7, rqdPercentage: 85, fractureFrequency: 2, groundWaterInflowLPM: 0 },
        mudSystem: { mudType: "water-based", viscositySeconds: 42, mudWeightPPG: 8.9, phLevel: 9.5, fluidLossVolumeCC: 6, consumablesMixed: [] },
        operations: { drillerId: "DRV-102", bitSerialNumber: "BIT-DM-V9-001", bitType: "Diamond Impregnated Matrix V9", averageRPM: 180, averageWOB: 15, penetrationRateMetersPerHour: 8.5, downtimeMinutes: 30 },
        costs: { rigOperationalCost: 3150, mudChemicalsCost: 1100, toolingWearCost: 4500, currency: "CAD" },
        lessonsLearned: { lessonId: "LSN-992", hazardFlagged: true, notes: "Quartzite matrix stripped standard tooling. Switched to high-strength V9 matrix diamond bit.", loggedByUserId: "GEO-LEAD-01" }
      },
      {
        fromMeter: 120, toMeter: 180,
        geology: { lithology: "Fault Zone B / Highly Fractured Andesite", hardnessScale: 4, rqdPercentage: 15, fractureFrequency: 22, groundWaterInflowLPM: 150 },
        mudSystem: { mudType: "water-based", viscositySeconds: 55, mudWeightPPG: 9.4, phLevel: 10.0, fluidLossVolumeCC: 25, consumablesMixed: [] },
        operations: { drillerId: "DRV-103", bitSerialNumber: "BIT-DM-V9-001", bitType: "Diamond Impregnated Matrix V9", averageRPM: 90, averageWOB: 10, penetrationRateMetersPerHour: 10.0, downtimeMinutes: 120 },
        costs: { rigOperationalCost: 2700, mudChemicalsCost: 2900, toolingWearCost: 200, currency: "CAD" },
        lessonsLearned: { lessonId: "LSN-993", hazardFlagged: true, notes: "Hit extreme downhole fluid loss inside Fault Zone B. Plastered walls with Stop-Loss sawdust matrix to regain return volume.", loggedByUserId: "DRV-103" }
      }
    ]
  };

  const helperSession = { username: "Bobby Crew-Hand", assignedRole: "drill_crew" };
  const foremanSession = { username: "Mac Foreman-Lead", assignedRole: "geologist" };
  const hotshotSession = { username: "Jill Investor-Admin", assignedRole: "exploration_manager" };

  console.log("================================================================================");
  console.log("?? CYCLING ALL 3 INDUSTRIAL MIND BRAINS NATIVELY");
  console.log("================================================================================");

  engine.routeToWorkspace(helperSession, mockHoleState);
  engine.routeToWorkspace(foremanSession, mockHoleState);
  engine.routeToWorkspace(hotshotSession, mockHoleState);
}

runMultiLevelSimulation();

