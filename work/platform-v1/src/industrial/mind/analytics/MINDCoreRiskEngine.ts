
export interface ComplianceRulePack {
  packName: string;
  maxAllowableFluidPH: number;
  minAllowableFluidPH: number;
  requiredCertifications: string[];
  maxVibrationGThreshold: number;
}

export interface TelemetryIngestPayload {
  sitePersonnelCerts: { [workerId: string]: string[] }; // workerId maps to list of active certs
  fluidPH: number;
  vibrationG: number;
  safetyMeetingLogged: boolean;
  incidentsCount: number;
}

export interface VectorRiskScorecard {
  overallRiskScore: number;       // Scaled 0 (Safe) to 100 (Immediate Shutdown Risk)
  safetyRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  environmentalRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  equipmentRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  complianceRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  activeInfractions: string[];
}

export class MINDCoreRiskEngine {
  /**
   * Processes agnostic field telemetry against an injectable regional Rule Pack
   * to output real-time risk scores.
   */
  public evaluateSiteRisk(payload: TelemetryIngestPayload, rulePack: ComplianceRulePack): VectorRiskScorecard {
    const infractions: string[] = [];
    
    let safetyPoints = 0;
    let envPoints = 0;
    let equipPoints = 0;
    let compPoints = 0;

    // 1. Safety & Training Vector
    if (!payload.safetyMeetingLogged) {
      infractions.push(`[COMPLIANCE] Missing daily safety meeting under ${rulePack.packName} protocol.`);
      safetyPoints += 30;
      compPoints += 25;
    }

    // Dynamic cross-reference of required certifications in the active Rule Pack
    const uniqueCertsPresent = new Set(Object.values(payload.sitePersonnelCerts).flat());
    rulePack.requiredCertifications.forEach(cert => {
      if (!uniqueCertsPresent.has(cert)) {
        infractions.push(`[TRAINING] Required site certification "${cert}" is completely missing from current active shift crew.`);
        safetyPoints += 20;
        compPoints += 15;
      }
    });

    // 2. Environmental Vector
    if (payload.fluidPH > rulePack.maxAllowableFluidPH || payload.fluidPH < rulePack.minAllowableFluidPH) {
      infractions.push(`[ENVIRONMENT] Fluid pH (${payload.fluidPH}) breaches ${rulePack.packName} boundaries [${rulePack.minAllowableFluidPH} - ${rulePack.maxAllowableFluidPH}].`);
      envPoints += 40;
      compPoints += 30;
    }

    // 3. Equipment & Production Vector
    if (payload.vibrationG > rulePack.maxVibrationGThreshold) {
      infractions.push(`[EQUIPMENT] Downhole mechanical vibration (${payload.vibrationG}G) exceeds pack stress limit (${rulePack.maxVibrationGThreshold}G).`);
      equipPoints += 35;
    }

    if (payload.incidentsCount > 0) {
      infractions.push(`[OPERATIONS] ${payload.incidentsCount} active safety/operational incidents logged on shift string.`);
      safetyPoints += 40;
      envPoints += 20;
    }

    // Calculate normalized overall score
    const totalRiskAccumulated = (safetyPoints + envPoints + equipPoints + compPoints) / 4;
    const overallRiskScore = Math.min(100, Math.round(totalRiskAccumulated));

    const getSeverity = (points: number) => {
      if (points >= 60) return "CRITICAL";
      if (points >= 35) return "HIGH";
      if (points >= 15) return "MEDIUM";
      return "LOW";
    };

    return {
      overallRiskScore,
      safetyRisk: getSeverity(safetyPoints),
      environmentalRisk: getSeverity(envPoints),
      equipmentRisk: getSeverity(equipPoints),
      complianceRisk: getSeverity(compPoints),
      activeInfractions: infractions
    };
  }
}

