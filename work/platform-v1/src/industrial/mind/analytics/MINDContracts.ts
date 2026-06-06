
export interface AdvancedShiftInput {
  drillerId: string;
  rodSize: string;
  startingFootageFeet: number;
  endingFootageFeet: number;
  activeDrillingHours: number;
  reamingHours: number;
  circulatingHours: number;
  rigMoveHours: number;
  standbyHours: number;
  mechanicalDowntimeHours: number;
  holeStabilizationHours: number;
  waterLineHours: number;
  machineServiceHours: number;
  pressureTestingHours: number;
  safetyMeetingMinutes: number;
  mud: { pH: number; plasticViscosityCP: number; yieldPointLbs100ft2: number; sandContentPct: number };
  targetMudWeightGainsPPG: number;
  consumables: { bitsConsumedCount: number; reamingShellsUsed: number; bentoniteSacksMixed: number; bariteSacksMixed: number; lcmSacksMixed: number; casingFeetLeftInHole: number };
}

export interface SiteStockSnapshot {
  bentonite: number;
  lcm: number;
  casingFeet: number;
}

