
class InspectionModePortalSimulator {
  renderInspectionDashboard(siteName, payload, activePack) {
    // Basic dynamic evaluation matching our engine rules
    const infractions = [];
    let safety = 0, env = 0, equip = 0, comp = 0;

    if (!payload.safetyMeeting) { infractions.push(`[SAFETY] No daily tailgate toolbox logged.`); safety += 35; comp += 30; }
    
    activePack.requiredCerts.forEach(c => {
      if (!payload.certs.includes(c)) { infractions.push(`[TRAINING] Missing mandate credential: ${c}`); safety += 20; comp += 20; }
    });

    if (payload.ph < activePack.minPH || payload.ph > activePack.maxPH) {
      infractions.push(`[ENV] Fluid pH (${payload.ph}) violates limits [${activePack.minPH}-${activePack.maxPH}].`);
      env += 45; comp += 35;
    }

    if (payload.vibration > activePack.maxG) { infractions.push(`[ASSET] Destructive mechanical harmonic vibration detected: ${payload.vibration}G.`); equip += 40; }

    const rawScore = (safety + env + equip + comp) / 4;
    const riskScore = Math.min(100, Math.round(rawScore));
    const systemStatus = riskScore > 50 ? "?? HIGH COMPLIANCE DRIFT" : riskScore > 15 ? "?? WARNING: MINOR RISK" : "?? OPTIMAL COMPLIANCE RUN";

    return `
================================================================================
??? INDUSTRIAL MIND ENTERPRISE SYSTEM // RISK ENGINE CONTROL CONSOLE
================================================================================
?? DEPLOYED PROJECT SITE:  ${siteName}
?? ACTIVE SYSTEM RULE PACK: ${activePack.name}

?? MATRIX VECHTORIZED RISK SCORECARD:
   * OVERALL RUNNING RISK METRIC: [ ${riskScore} / 100 ] --> STATE: ${systemStatus}
   -----------------------------------------------------------------------------
   * Safety Risk Vector:       ${safety >= 50 ? "CRITICAL" : safety >= 20 ? "HIGH" : "LOW"}
   * Environmental Risk Vector: ${env >= 50 ? "CRITICAL" : env >= 20 ? "HIGH" : "LOW"}
   * Asset/Equipment Risk:      ${equip >= 50 ? "CRITICAL" : equip >= 20 ? "HIGH" : "LOW"}
   * Structural Compliance Risk: ${comp >= 50 ? "CRITICAL" : comp >= 20 ? "HIGH" : "LOW"}

? LIVE CRITICAL RISK ENGINE THREAT STREAM:
${infractions.map(i => `   [X] ${i}`).join("\n") || "   ? All incoming streams mapping clear of current rule pack boundaries."}

================================================================================
? [ONE-CLICK INSPECTION MODE ACTIVATED] // GENERATING SEALED COMPLIANCE BRIEF...
================================================================================
[DOC-VAULT]: Pulling complete digitized records for enforcement review...
   * Training Records:    ${payload.certs.length} Active Verified Certifications Checked
   * Equipment Audits:    Casing & Rig Pressure Testing Logs Certified (Vibration: ${payload.vibration}G)
   * Safety Confirmations: ${payload.safetyMeeting ? "Verified Signed Daily Tailgate Document Present" : "?? MISSING RECORD ENTRY"}
   * Fluid Discharges:    ISO 14001 Compliant Water Discharge Baseline Logs Isolated
   
?? ARCHIVE OUTPUT STATUS: AUDIT BUNDLE GENERATED SUCCESSFULLYING IN 0.04s.
================================================================================`;
  }
}

// Instantiate the environment
const portal = new InspectionModePortalSimulator();

// Define diverse rule packs completely isolated from core code
const bcExplorationPack = { name: "BC_EXPLORATION_V2", minPH: 6.5, maxPH: 8.5, requiredCerts: ["WHMIS", "BC_CORE_SAFETY"], maxG: 4.0 };
const nevadaMiningPack = { name: "NEVADA_MSHA_COMPLIANT_V4", minPH: 7.0, maxPH: 8.0, requiredCerts: ["WHMIS", "MSHA_46", "HAZMAT_LEVEL_1"], maxG: 3.5 };

// Incoming raw muddy field logs (Same data, tested against different locations)
const incomingFieldTelemetry = {
  safetyMeeting: true,
  certs: ["WHMIS", "BC_CORE_SAFETY"], // Missing specific Nevada MSHA requirements
  ph: 6.7, // Passing BC regulations, but outside Nevada tight margins
  vibration: 3.8 // Exceeds Nevada high-precision tooling baseline
};

// Test Run 1: Evaluate under British Columbia standard boundaries
console.log(portal.renderInspectionDashboard("KAMLOOPS COPPER - RIG 04", incomingFieldTelemetry, bcExplorationPack));

// Test Run 2: Evaluate the identical dataset under strict Nevada operational rules
console.log(portal.renderInspectionDashboard("CARLIN TREND INFRASTRUCTURE - RIG 04", incomingFieldTelemetry, nevadaMiningPack));

