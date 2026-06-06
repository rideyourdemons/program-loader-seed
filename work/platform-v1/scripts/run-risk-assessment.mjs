
import { MINDRiskEngine } from "../dist/src/industrial/mind/analytics/MINDRiskEngine.js";

const engine = new MINDRiskEngine();

const highRiskRig = {
  rigId: "KAMLOOPS-RIG-02",
  projectCode: "KAMLOOPS_DEEP_COPPER",
  currentDepthMeter: 435,
  measuredVibrationG: 4.8,
  mudViscositySeconds: 28,
  safetyTailgateSigned: false,
  crewCertificationsPresent: ["WHMIS"]
};

const profile = engine.analyzeRigRisk(highRiskRig);

console.log("\n================================================================================");
console.log("?? INDUSTRIAL MIND RISK TELEMETRY // CURRENT EVALUATION");
console.log("================================================================================");
console.log(`?? TARGET RIG IDENTIFIER: ${profile.rigId} (Depth: ${highRiskRig.currentDepthMeter}m)`);
console.log(`?? OVERALL RUNNING SITE RISK PROFILE: [ ${profile.overallRiskScore} / 100 ]`);
console.log("--------------------------------------------------------------------------------");
console.log("??? RISK VECTORS SCORECARD:");
console.log(`   * Safety & Compliance: ${profile.vectors.safety}`);
console.log(`   * Environmental Impact: ${profile.vectors.environmental}`);
console.log(`   * Asset Mechanical Strain: ${profile.vectors.equipment}`);
console.log(`   * Production & Geology: ${profile.vectors.production}`);
console.log("\n? ENGINE AUTOMATED MITIGATION DIRECTIVES:");
profile.mitigationDirectives.forEach(d => console.log(`   [X] ${d}`));
console.log("================================================================================");

