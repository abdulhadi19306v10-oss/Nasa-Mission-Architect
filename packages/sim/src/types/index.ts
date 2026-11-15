export interface VisualModelConfig {
  type: string;
  [key: string]: any;
}

export interface Instrument {
  id: string;
  name: string;
  category: string;
  description: string;
  massKg: number;
  powerWatts: number;
  dataRateMbps: number;
  costM: number;
  minPointingAccuracyDeg: number;
  scienceValue: number;
  targetDomains: string[];
  visualModel: VisualModelConfig;
}

export interface StructureSubsystem {
  id: string;
  name: string;
  category: 'Structure';
  dryMassKg: number;
  maxPayloadMassKg: number;
  costM: number;
  dimensions: [number, number, number];
  shape: 'box' | 'octagonal' | 'hexagonal';
  description: string;
  visualModel: VisualModelConfig;
}

export interface PowerGenSubsystem {
  id: string;
  name: string;
  category: 'Power Generation';
  massKg: number;
  powerOutputWatts: number;
  costM: number;
  description: string;
  efficiency: number;
  sunTracking: boolean;
  visualModel: VisualModelConfig;
}

export interface EnergyStorageSubsystem {
  id: string;
  name: string;
  category: 'Energy Storage';
  massKg: number;
  capacityWh: number;
  maxDoD: number; // Depth of Discharge e.g. 0.70
  costM: number;
  description: string;
}

export interface AdcsSubsystem {
  id: string;
  name: string;
  category: 'ADCS';
  massKg: number;
  powerWatts: number;
  pointingAccuracyDeg: number;
  costM: number;
  description: string;
  requiresMagneticField: boolean;
}

export interface CommsSubsystem {
  id: string;
  name: string;
  category: 'Communications';
  massKg: number;
  powerWatts: number;
  downlinkRateMbps: number;
  costM: number;
  pointingToleranceDeg: number;
  description: string;
  visualModel?: VisualModelConfig;
}

export interface ObcSubsystem {
  id: string;
  name: string;
  category: 'OBC';
  massKg: number;
  powerWatts: number;
  storageGb: number;
  costM: number;
  description: string;
}

export interface ThermalSubsystem {
  id: string;
  name: string;
  category: 'Thermal';
  massKg: number;
  powerWatts: number;
  costM: number;
  description: string;
}

export interface LaunchVehicle {
  id: string;
  name: string;
  provider: string;
  class: string;
  costM: number;
  maxPayloadLeoKg: number;
  maxPayloadSsoKg: number;
  maxPayloadGtoKg: number;
  maxPayloadTliKg: number;
  fairingDiameterM: number;
  fairingHeightM: number;
  reliabilityRating: number;
  description: string;
  visualModel: VisualModelConfig;
}

export type CelestialBodyId =
  | 'earth'
  | 'moon'
  | 'mars'
  | 'venus'
  | 'europa'
  | 'titan'
  | 'asteroid'
  | 'lagrange';

export type CelestialBodyCategory = 'planet' | 'moon' | 'other';

export interface CelestialBodyMeta {
  id: CelestialBodyId;
  name: string;
  shortName: string;
  category: CelestialBodyCategory;
  subtitle: string;
  description: string;
  muKm3S2: number;
  radiusKm: number;
  gravitySurfaceMs2: number;
  solarDistanceAu: number;
  solarFluxMultiplier: number;
  hasMagnetosphere: boolean;
  tliPayloadScale: number;
  defaultOrbitId: string;
  recommendedPowerTip: string;
  accentColor: string;
}

export interface Orbit {
  id: string;
  name: string;
  centralBody: CelestialBodyId;
  altitudeKm: number;
  inclinationDeg: number;
  periodMinutes: number;
  eclipseMinutes: number;
  eclipseFraction: number;
  deltaVRequiredKmS: number;
  radiationLevel: 'low' | 'medium' | 'high' | 'cosmic-rays';
  groundStationContactsPerDay: number;
  avgPassDurationMinutes: number;
  description: string;
  idealFor: string[];
}

export interface Scenario {
  id: string;
  title: string;
  tagline: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Sandbox';
  briefing: string;
  budgetM: number;
  targetLifetimeYears: number;
  targetOrbits: string[];
  requiredCapabilities: {
    targetScienceDomains: string[];
    minDataRateDailyGb: number;
    maxMassMarginPercent?: number;
    maxPointingErrorDeg?: number;
    radiationHardened?: boolean;
  };
  scoringBonusInstruments: string[];
  badge: string;
}

export interface RealMission {
  id: string;
  name: string;
  agency: string;
  launchYear: number;
  orbit: string;
  primaryInstruments: string[];
  missionCostM: number;
  keyLesson: string;
  similarityProfile: {
    targetDomain: string;
    preferredOrbit: string;
    instruments: string[];
  };
}

export interface SpacecraftDesign {
  name: string;
  scenarioId: string;
  orbitId: string;
  launchVehicleId: string;
  structureId: string;
  powerGenId: string;
  energyStorageId: string;
  adcsId: string;
  commsId: string;
  obcId: string;
  thermalId: string;
  instrumentIds: string[];
}

export interface ResourceBudget {
  totalMassKg: number;
  payloadMassKg: number;
  busDryMassKg: number;
  maxLaunchCapacityKg: number;
  massMarginKg: number;
  massMarginPercent: number;
  isMassFeasible: boolean;

  daylightPowerGenW: number;
  daylightPowerConsumedW: number;
  daylightPowerBalanceW: number;
  eclipsePowerConsumedW: number;
  eclipseEnergyRequiredWh: number;
  batteryCapacityWh: number;
  batteryDoDPercent: number;
  isPowerFeasible: boolean;

  dailyDataGenGb: number;
  dailyDownlinkCapacityGb: number;
  dataBufferHeadroomGb: number;
  isDataFeasible: boolean;

  spacecraftPointingDeg: number;
  pointingDemandedDeg: number;
  isPointingFeasible: boolean;

  spacecraftCostM: number;
  launchCostM: number;
  opsCostM: number;
  totalCostM: number;
  budgetLimitM: number;
  isCostFeasible: boolean;
  isBudgetUnlimited?: boolean;

  environmentCompatible: boolean;
  solarFluxMultiplier?: number;
  rawPowerOutputW?: number;
  criticalIssues: string[];
  warnings: string[];
}

export interface MissionEvent {
  id: string;
  day: number;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'anomaly';
  resolved: boolean;
  impactDescription: string;
  choice?: {
    prompt: string;
    options: {
      label: string;
      outcomeText: string;
      batteryImpactWh?: number;
      scienceEfficiencyMult?: number;
    }[];
  };
}

export interface MissionReport {
  overallScore: number; // 0 - 100
  letterGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  conceptMaturityLevel: number; // CML 1 - 6
  status: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'MISSION_FAILURE';
  scienceScore: number;
  efficiencyScore: number;
  reliabilityScore: number;
  budgetScore: number;
  summaryText: string;
  detailedAnalysis: string[];
  matchedRealMission?: RealMission;
  eventsEncountered: MissionEvent[];
}
