
import { readFileSync } from "fs";
import { join } from "path";
import { MINDMemoryReader } from "./MINDMemoryReader.js";

export interface ActiveRigTelemetry {
  rigId: string;
  projectCode: string;
  currentDepthMeter: number;
  measuredVibrationG: number;
  mudViscositySeconds: number;
  safetyTailgateSigned: boolean;
  crewCertificationsPresent: string[];
}

export interface RiskProfileOutput {
  rigId: string;
  overallRiskScore: number;
  vectors: {
    safety: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    environmental: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    equipment: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    production: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  };
  mitigationDirectives: string[];
}

export class MINDRiskEngine {
  private memoryReader = new MINDMemoryReader();

  private mapPointsToSeverity(points: number): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    if (points >= 70) return "CRITICAL";
    if (points >= 40) return "HIGH";
    if (points >= 15) return "MEDIUM";
    return "LOW";
  }

  public analyzeRigRisk(telemetry: ActiveRigTelemetry): RiskProfileOutput {
    const directives: string[] = [];
    
    // Dynamically load the active corporate compliance rules
    let rules;
    try {
      const rulePath = join(process.cwd(), "data", "compliance", "kamloops_rules.json");
      rules = JSON.parse(readFileSync(rulePath, "utf-8"));
    } catch (e) {
      // Fallback configuration parameters if the file fails to read
      rules = {
        vibrationMaxG: 4.5,
        minMudViscositySeconds: 40,
        requiredCertifications: ["CORE_SAFETY"],
        weights: { missingTailgatePoints: 50, missingCertPoints: 30, excessVibrationPoints: 60, historicalProximityPoints: 40, thinMudDangerPoints: 35 }
      };
    }

    let safetyPoints = 0;
    let envPoints = 0;
    let equipPoints = 0;
    let prodPoints = 0;

    // 1. Evaluate Compliance Metrics via Loaded Configurations
    if (!telemetry.safetyTailgateSigned) {
      safetyPoints += rules.weights.missingTailgatePoints;
      directives.push("IMMEDIATE ACTION: Daily tailgate safety documentation is missing or unsigned.");
    }
    
    const hasValidCerts = rules.requiredCertifications.every((cert: string) => 
      telemetry.crewCertificationsPresent.includes(cert)
    );
    if (!hasValidCerts) {
      safetyPoints += rules.weights.missingCertPoints;
      directives.push(`COMPLIANCE GAP: Active crew lacks verified credentials matching [${rules.requiredCertifications.join(", ")}].`);
    }

    // 2. Evaluate Mechanical Operations
    if (telemetry.measuredVibrationG > rules.vibrationMaxG) {
      equipPoints += rules.weights.excessVibrationPoints;
      directives.push(`MECHANICAL ALERT: Vibration exceeded safety threshold of ${rules.vibrationMaxG}G. Reduce RPM immediately.`);
    }

    // 3. Evaluate Historical Ground Intersections
    const historicalPrecedents = this.memoryReader.searchPriorGround("Quartzite", telemetry.currentDepthMeter, 15);
    if (historicalPrecedents.length > 0) {
      prodPoints += rules.weights.historicalProximityPoints;
      
      const containsCirculationLoss = historicalPrecedents.some(p => p.incidents.includes("LOST_CIRCULATION"));
      if (containsCirculationLoss && telemetry.mudViscositySeconds < rules.minMudViscositySeconds) {
        prodPoints += rules.weights.thinMudDangerPoints;
        envPoints += 30;
        directives.push(`PREDICTIVE RISK: Approaching lost circulation horizon. Mud viscosity must be bumped over ${rules.minMudViscositySeconds}s.`);
      }
    }

    const aggregateScore = Math.min(100, Math.round((safetyPoints + envPoints + equipPoints + prodPoints) / 4));

    return {
      rigId: telemetry.rigId,
      overallRiskScore: aggregateScore,
      vectors: {
        safety: this.mapPointsToSeverity(safetyPoints),
        environmental: this.mapPointsToSeverity(envPoints),
        equipment: this.mapPointsToSeverity(equipPoints),
        production: this.mapPointsToSeverity(prodPoints)
      },
      mitigationDirectives: directives
    };
  }
}

