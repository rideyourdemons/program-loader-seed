
// Dynamic execution simulation for checking the Executive Brain
async function runSimulation() {
  console.log("================================================================================");
  console.log("?? INITIALIZING INDUSTRIAL MIND SIMULATION: KAMLOOPS EXPLORATION FOCUS");
  console.log("================================================================================");

  const mockHoleState = {
    project: {
      projectId: "PRJ-BC-2026",
      projectName: "Kamloops Deep Copper",
      clientName: "Pacific Resource Exploration",
      fiscalYear: 2026
    },
    site: {
      siteId: "ST-04",
      siteName: "Valley Shear Zone",
      region: "Kamloops, BC",
      environmentType: "surface"
    },
    hole: {
      holeId: "HL-26-09B",
      holeName: "Discovery Deep Target B",
      targetDepthMeters: 600,
      currentDepthMeters: 180,
      status: "drilling",
      contractorCompany: "Apex Frontier Drilling"
    },
    intervals: [
      {
        fromMeter: 0,
        toMeter: 60,
        timestampStart: "2026-06-04T07:00:00Z",
        timestampEnd: "2026-06-04T12:00:00Z",
        geology: {
          lithology: "Glacial Till / Weathered Volcanics",
          hardnessScale: 3,
          rqdPercentage: 45,
          fractureFrequency: 8,
          groundWaterInflowLPM: 10
        },
        mudSystem: {
          mudType: "water-based",
          viscositySeconds: 34,
          mudWeightPPG: 8.6,
          phLevel: 9.0,
          fluidLossVolumeCC: 12,
          consumablesMixed: [{ productName: "Bentonite Premium", quantityBagsOrCups: 4 }]
        },
        operations: {
          drillerId: "DRV-102",
          bitSerialNumber: "BIT-TR-0091",
          bitType: "Standard Tricone Rock Bit",
          averageRPM: 110,
          averageWOB: 25,
          penetrationRateMetersPerHour: 12.0,
          downtimeMinutes: 0,
          downtimeReason: "none"
        },
        costs: {
          rigOperationalCost: 2250,
          mudChemicalsCost: 350,
          toolingWearCost: 150,
          currency: "CAD"
        }
      },
      {
        fromMeter: 60,
        toMeter: 120,
        timestampStart: "2026-06-04T12:30:00Z",
        timestampEnd: "2026-06-04T19:30:00Z",
        geology: {
          lithology: "Silicified Quartzite Shear Zone",
          hardnessScale: 7,
          rqdPercentage: 85,
          fractureFrequency: 2,
          groundWaterInflowLPM: 0
        },
        mudSystem: {
          mudType: "water-based",
          viscositySeconds: 42,
          mudWeightPPG: 8.9,
          phLevel: 9.5,
          fluidLossVolumeCC: 6,
          consumablesMixed: [
            { productName: "Polymer Liqui-Gel", quantityBagsOrCups: 6 },
            { productName: "Diamond Lubricant X", quantityBagsOrCups: 2 }
          ]
        },
        operations: {
          drillerId: "DRV-102",
          bitSerialNumber: "BIT-DM-V9-001",
          bitType: "Diamond Impregnated Matrix V9",
          averageRPM: 180,
          averageWOB: 15,
          penetrationRateMetersPerHour: 8.5,
          downtimeMinutes: 30,
          downtimeReason: "none"
        },
        costs: {
          rigOperationalCost: 3150,
          mudChemicalsCost: 1100,
          toolingWearCost: 4500,
          currency: "CAD"
        },
        lessonsLearned: {
          lessonId: "LSN-992",
          hazardFlagged: true,
          notes: "Quartzite matrix stripped standard tooling. Switched to high-strength V9 matrix diamond bit.",
          loggedByUserId: "GEO-LEAD-01"
        }
      },
      {
        fromMeter: 120,
        toMeter: 180,
        timestampStart: "2026-06-04T20:00:00Z",
        timestampEnd: "2026-06-05T02:00:00Z",
        geology: {
          lithology: "Fault Zone B / Highly Fractured Andesite",
          hardnessScale: 4,
          rqdPercentage: 15,
          fractureFrequency: 22,
          groundWaterInflowLPM: 150
        },
        mudSystem: {
          mudType: "water-based",
          viscositySeconds: 55,
          mudWeightPPG: 9.4,
          phLevel: 10.0,
          fluidLossVolumeCC: 25,
          consumablesMixed: [
            { productName: "Polymer Liqui-Gel", quantityBagsOrCups: 12 },
            { productName: "Stop-Loss Sawdust Matrix", quantityBagsOrCups: 8 }
          ]
        },
        operations: {
          drillerId: "DRV-103",
          bitSerialNumber: "BIT-DM-V9-001",
          bitType: "Diamond Impregnated Matrix V9",
          averageRPM: 90,
          averageWOB: 10,
          penetrationRateMetersPerHour: 10.0,
          downtimeMinutes: 120,
          downtimeReason: "fluid-loss"
        },
        costs: {
          rigOperationalCost: 2700,
          mudChemicalsCost: 2900,
          toolingWearCost: 200,
          currency: "CAD"
        },
        lessonsLearned: {
          lessonId: "LSN-993",
          hazardFlagged: true,
          notes: "Hit extreme downhole fluid loss inside Fault Zone B. Plastered walls with Stop-Loss sawdust matrix to regain return volume.",
          loggedByUserId: "DRV-103"
        }
      }
    ]
  };

  const totals = mockHoleState.intervals.reduce((acc, current) => {
    acc.ops += current.costs.rigOperationalCost;
    acc.mud += current.costs.mudChemicalsCost;
    acc.tools += current.costs.toolingWearCost;
    return acc;
  }, { ops: 0, mud: 0, tools: 0 });

  const totalCost = totals.ops + totals.mud + totals.tools;
  const costPerMeter = (totalCost / mockHoleState.hole.currentDepthMeters).toFixed(2);

  console.log("\n?? EXECUTIVE OVERVIEW // PROJECT: " + mockHoleState.project.projectName.toUpperCase());
  console.log("?? SITE: " + mockHoleState.site.siteName + " (" + mockHoleState.site.region + ")");
  console.log("?? HOLE TARGET: " + mockHoleState.hole.holeName + " [Status: " + mockHoleState.hole.status.toUpperCase() + "]");
  console.log("--------------------------------------------------------------------------------");
  console.log("?? Total Meters Drilled:   " + mockHoleState.hole.currentDepthMeters + " m");
  console.log("?? Total Operational Burn: $" + totalCost.toLocaleString() + " CAD");
  console.log("?? Calculated Cost/Meter:  $" + costPerMeter + " CAD/m");
  console.log("--------------------------------------------------------------------------------");
  
  console.log("\n?? INVESTOR CAPITAL LEAKAGE AUDIT (By Interval Geology):");
  mockHoleState.intervals.forEach(inv => {
    const intervalCost = inv.costs.rigOperationalCost + inv.costs.mudChemicalsCost + inv.costs.toolingWearCost;
    const intervalCPM = (intervalCost / (inv.toMeter - inv.fromMeter)).toFixed(2);
    console.log(" -> Layer [" + inv.fromMeter + "m - " + inv.toMeter + "m] (" + inv.geology.lithology + ")");
    console.log("    Cost: $" + intervalCost.toLocaleString() + " | Mud Share: $" + inv.costs.mudChemicalsCost + " | Rate: $" + intervalCPM + " CAD/m");
    if (inv.lessonsLearned?.hazardFlagged) {
      console.log("    ?? [MIND Lesson Captured]: \"" + inv.lessonsLearned.notes + "\"");
    }
  });
  console.log("================================================================================");
}

runSimulation();

