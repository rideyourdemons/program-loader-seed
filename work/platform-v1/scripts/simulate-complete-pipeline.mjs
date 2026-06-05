
class CompletePipelineDemo {
  runDemo() {
    console.log("================================================================================");
    console.log("?? INITIALIZING INDUSTRIAL MIND PLATFORM // SYSTEM READY [FY 2026]");
    console.log("================================================================================");

    // 1. Initial State setup
    const masterState = {
      project: { projectName: "Kamloops Deep Copper", fiscalYear: 2026 },
      hole: { holeName: "Discovery Deep Target B", contractorCompany: "Apex Frontier Drilling", currentDepthMeters: 180, targetDepthMeters: 600, status: "DRILLING" },
      site: { siteName: "Valley Shear Zone", region: "Kamloops, BC" },
      intervals: [
        { fromMeter: 0, toMeter: 60, geology: { lithology: "Glacial Till" }, mudSystem: { viscositySeconds: 34 }, operations: { downtimeMinutes: 30 }, costs: { rigOperationalCost: 2000, mudChemicalsCost: 500, toolingWearCost: 250 } },
        { fromMeter: 60, toMeter: 120, geology: { lithology: "Silicified Quartzite" }, mudSystem: { viscositySeconds: 42 }, operations: { downtimeMinutes: 40 }, costs: { rigOperationalCost: 6000, mudChemicalsCost: 1500, toolingWearCost: 1250 } },
        { fromMeter: 120, toMeter: 180, geology: { lithology: "Fault Zone B" }, mudSystem: { viscositySeconds: 55 }, operations: { downtimeMinutes: 80 }, costs: { rigOperationalCost: 4000, mudChemicalsCost: 1000, toolingWearCost: 800 } }
      ]
    };

    // 2. Incoming Telemetry Input from Rig Tablet (Simulating Raw Shift Log Input)
    const rawInputFromTablet = {
      drillerId: "   BIT-BOSS-404  ", // Needs trimming
      currentDepthMeters: 240,       // Advanced depth interval
      mudViscositySeconds: 58,        // Heavy downhole viscosity matrix
      bitSerialNumber: "bit-v9-matrix" // Needs standardization to uppercase/prefix
    };

    console.log("\n?? [STEP 1]: RECEIVING RAW TELEMETRY FROM LAYER 1 RIG APP...");
    console.log(`   * Raw Driller Payload: Depth: ${rawInputFromTablet.currentDepthMeters}m | Viscosity: ${rawInputFromTablet.mudViscositySeconds}s | Serial: ${rawInputFromTablet.bitSerialNumber}`);

    // 3. Step 2: Pass through Data Ingestion Guard
    console.log("\n??? [STEP 2]: RUNNING DATA INGESTION GUARD SANITIZATION...");
    let errors = [];
    if (rawInputFromTablet.currentDepthMeters <= masterState.hole.currentDepthMeters) errors.push("INVALID_DEPTH");
    if (!rawInputFromTablet.bitSerialNumber.toUpperCase().startsWith("BIT-")) {
      // Auto-fixing or flagging formatting variance
      rawInputFromTablet.bitSerialNumber = "BIT-" + rawInputFromTablet.bitSerialNumber.toUpperCase();
    }
    
    const sanitized = {
      drillerId: rawInputFromTablet.drillerId.trim(),
      currentDepthMeters: rawInputFromTablet.currentDepthMeters,
      mudViscositySeconds: rawInputFromTablet.mudViscositySeconds,
      bitSerialNumber: rawInputFromTablet.bitSerialNumber
    };
    console.log("   ? Data Sanitized and Standardized. Inventory Token Registered:", sanitized.bitSerialNumber);

    // 4. Step 3: Propagate via State Coordinator and Recalculate Metrics
    console.log("\n?? [STEP 3]: COORDINATING STATE UPDATE AND RECALCULATING FINANCIAL LEDGER...");
    const prevDepth = masterState.hole.currentDepthMeters;
    masterState.hole.currentDepthMeters = sanitized.currentDepthMeters;
    
    // Append recalculated costs for the new 180m-240m interval
    masterState.intervals.push({
      fromMeter: prevDepth,
      toMeter: sanitized.currentDepthMeters,
      geology: { lithology: "Highly Fractured Andesite" },
      mudSystem: { viscositySeconds: sanitized.mudViscositySeconds },
      operations: { downtimeMinutes: 0 },
      costs: { rigOperationalCost: 4500, mudChemicalsCost: 1100, toolingWearCost: 900 }
    });

    // Recompute master aggregates
    const totalCost = masterState.intervals.reduce((acc, current) => {
      return acc + current.costs.rigOperationalCost + current.costs.mudChemicalsCost + current.costs.toolingWearCost;
    }, 0);
    const costPerMeter = (totalCost / masterState.hole.currentDepthMeters).toFixed(2);
    const progressPct = ((masterState.hole.currentDepthMeters / masterState.hole.targetDepthMeters) * 100).toFixed(1);

    console.log(`   ? Global Metrics Synchronized: Total Capital Burned: $${totalCost.toLocaleString()} CAD`);

    // 5. Step 4: Security RBAC Gate Evaluation & Dynamic Dashboard View Rendering
    console.log("\n?? [STEP 4]: VERIFYING USER SESSIONS AND RENDERING TARGETED VIEWS...");
    
    const sessions = [
      { name: "Bobby Crew-Hand", role: "DRILL_CREW", targetLevel: 1 },
      { name: "Jill Investor-Admin", role: "EXPLORATION_MANAGER", targetLevel: 3 }
    ];

    sessions.forEach(session => {
      console.log(`\n--------------------------------------------------------------------------------`);
      console.log(`?? User: ${session.name} [Role: ${session.role}] -> Accessing Brain Level ${session.targetLevel}`);
      console.log(`--------------------------------------------------------------------------------`);
      
      if (session.targetLevel === 1) {
        console.log(`?? MIND MOBILE PORTAL // LEVEL 1: TRAINING BRAIN
[RIG STATUS]: ACTIVE DRILLING | [CURRENT DEPTH]: ${masterState.hole.currentDepthMeters} meters
* Contractor:  ${masterState.hole.contractorCompany}
* Current Bit: ${sanitized.bitSerialNumber}
? Field system updated by cross-shift log tracking.`);
      } else if (session.targetLevel === 3) {
        console.log(`?? MIND CAPITAL PORTAL // LEVEL 3: EXECUTIVE BRAIN
[PROJECT FINANCIAL AUDIT]: ${masterState.project.projectName.toUpperCase()} [FY ${masterState.project.fiscalYear}]
* Total Capital Burned:     $${totalCost.toLocaleString()} CAD
* Realized Cost Per Meter:  $${costPerMeter} / meter
* Target Depth Completion:   ${progressPct}%

?? HIGH-COST FORMATION LEAKAGE ANALYTICS:`);
        masterState.intervals.forEach(inv => {
          const invSum = inv.costs.rigOperationalCost + inv.costs.mudChemicalsCost + inv.costs.toolingWearCost;
          console.log(`   * Zone [${inv.fromMeter}m - ${inv.toMeter}m] (${inv.geology.lithology}): $${invSum.toLocaleString()} burn`);
        });
      }
    });
    console.log("================================================================================");
  }
}

const pipeline = new CompletePipelineDemo();
pipeline.runDemo();

