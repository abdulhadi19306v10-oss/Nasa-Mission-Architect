import { describe, it, expect } from 'vitest';
import {
  calculateOrbitalPeriod,
  calculateOrbitalSpeed,
  calculateEclipseMinutes,
  calculateDailyDownlinkCapacityGb,
  calculateResourceBudget,
  evaluateMissionDesign,
  CELESTIAL_BODY_LIST,
  getNasaMissionProfile,
  DataRegistry,
  SpacecraftDesign
} from '../src/index';

import instrumentsData from '../../../data/instruments.json';
import subsystemsData from '../../../data/subsystems.json';
import launchVehiclesData from '../../../data/launch-vehicles.json';
import orbitsData from '../../../data/orbits.json';
import scenariosData from '../../../data/scenarios.json';
import realMissionsData from '../../../data/real-missions.json';

const registry: DataRegistry = {
  structures: subsystemsData.structures as any,
  powerGeneration: subsystemsData.powerGeneration as any,
  energyStorage: subsystemsData.energyStorage as any,
  adcs: subsystemsData.adcs as any,
  communications: subsystemsData.communications as any,
  obc: subsystemsData.obc as any,
  thermal: subsystemsData.thermal as any,
  instruments: instrumentsData as any,
  launchVehicles: launchVehiclesData as any,
  orbits: orbitsData as any,
  scenarios: scenariosData as any
};

describe('Orbital Mechanics Math', () => {
  it('calculates realistic LEO 400km period (~92.5 minutes)', () => {
    const periodSeconds = calculateOrbitalPeriod(400, 'earth');
    const periodMinutes = periodSeconds / 60;
    expect(periodMinutes).toBeGreaterThan(91);
    expect(periodMinutes).toBeLessThan(94);
  });

  it('calculates realistic orbital speed (~7.67 km/s for LEO)', () => {
    const speed = calculateOrbitalSpeed(400, 'earth');
    expect(speed).toBeGreaterThan(7.6);
    expect(speed).toBeLessThan(7.8);
  });

  it('calculates eclipse duration (~35-37 minutes for LEO)', () => {
    const eclipseMin = calculateEclipseMinutes(400, 'earth');
    expect(eclipseMin).toBeGreaterThan(34);
    expect(eclipseMin).toBeLessThan(38);
  });

  it('calculates downlink capacity accurately', () => {
    // 25 Mbps over 10 passes of 10 minutes = 100 minutes = 6000 seconds -> 150,000 Megabits = 150 Gigabits
    const capacityGb = calculateDailyDownlinkCapacityGb(25, 10, 10);
    expect(capacityGb).toBe(150);
  });
});

describe('Resource Budget Calculations', () => {
  it('detects a well-engineered Earth Watch satellite design as feasible', () => {
    const design: SpacecraftDesign = {
      name: 'Sentinel-1 Alpha',
      scenarioId: 'scenario-earth-watch',
      orbitId: 'orbit-sso-700',
      launchVehicleId: 'lv-falcon9-dedicated',
      structureId: 'bus-espa-smallsat',
      powerGenId: 'pwr-deployable-fixed',
      energyStorageId: 'bat-medium-600wh',
      adcsId: 'adcs-reaction-wheels',
      commsId: 'comm-xband-horn',
      obcId: 'obc-standard-radtol',
      thermalId: 'thm-passive-mli',
      instrumentIds: ['inst-multispectral']
    };

    const budget = calculateResourceBudget(design, registry);

    expect(budget.isMassFeasible).toBe(true);
    expect(budget.isPowerFeasible).toBe(true);
    expect(budget.isPointingFeasible).toBe(true);
    expect(budget.isCostFeasible).toBe(true);
    expect(budget.criticalIssues.length).toBe(0);
  });

  it('flags fatal critical issues when mass exceeds launch vehicle capacity', () => {
    const design: SpacecraftDesign = {
      name: 'Overweight Craft',
      scenarioId: 'scenario-earth-watch',
      orbitId: 'orbit-sso-700',
      launchVehicleId: 'lv-electron', // Electron max SSO is 200kg
      structureId: 'bus-flagship-hex', // Flagship dry mass alone is 320kg
      powerGenId: 'pwr-deployable-fixed',
      energyStorageId: 'bat-heavy-1800wh',
      adcsId: 'adcs-reaction-wheels',
      commsId: 'comm-xband-horn',
      obcId: 'obc-standard-radtol',
      thermalId: 'thm-passive-mli',
      instrumentIds: ['inst-sar-radar'] // 160kg
    };

    const budget = calculateResourceBudget(design, registry);

    expect(budget.isMassFeasible).toBe(false);
    expect(budget.criticalIssues.some((issue) => issue.includes('exceeds'))).toBe(true);
  });

  it('detects environmental incompatibility for magnetic torquers at the Moon', () => {
    const design: SpacecraftDesign = {
      name: 'Lunar Flawed ADCS',
      scenarioId: 'scenario-moon-scout',
      orbitId: 'orbit-lunar-polar-100',
      launchVehicleId: 'lv-falcon9-dedicated',
      structureId: 'bus-espa-smallsat',
      powerGenId: 'pwr-deployable-fixed',
      energyStorageId: 'bat-medium-600wh',
      adcsId: 'adcs-magnetorquers', // Magnetorquers require geomagnetic field!
      commsId: 'comm-xband-horn',
      obcId: 'obc-standard-radtol',
      thermalId: 'thm-passive-mli',
      instrumentIds: ['inst-lunar-lidar']
    };

    const budget = calculateResourceBudget(design, registry);

    expect(budget.environmentCompatible).toBe(false);
    expect(budget.criticalIssues.some((issue) => issue.includes('requires a planetary geomagnetic field'))).toBe(true);
  });
});

describe('Mission Scorer & Debrief Engine', () => {
  it('grades a valid design with high score and assigns CML level', () => {
    const design: SpacecraftDesign = {
      name: 'TerraScope',
      scenarioId: 'scenario-earth-watch',
      orbitId: 'orbit-sso-700',
      launchVehicleId: 'lv-falcon9-rideshare',
      structureId: 'bus-espa-smallsat',
      powerGenId: 'pwr-deployable-fixed',
      energyStorageId: 'bat-medium-600wh',
      adcsId: 'adcs-reaction-wheels',
      commsId: 'comm-xband-horn',
      obcId: 'obc-standard-radtol',
      thermalId: 'thm-passive-mli',
      instrumentIds: ['inst-multispectral', 'inst-radiometer']
    };

    const budget = calculateResourceBudget(design, registry);
    const scenario = registry.scenarios.find((s) => s.id === design.scenarioId)!;
    const orbit = registry.orbits.find((o) => o.id === design.orbitId)!;

    const report = evaluateMissionDesign(
      design,
      budget,
      scenario,
      registry.instruments,
      orbit,
      realMissionsData as any
    );

    expect(report.status).toBe('SUCCESS');
    expect(report.overallScore).toBeGreaterThanOrEqual(80);
    expect(['A+', 'A', 'B']).toContain(report.letterGrade);
    expect(report.conceptMaturityLevel).toBeGreaterThanOrEqual(4);
    expect(report.matchedRealMission).toBeDefined();
    expect(report.matchedRealMission?.name).toBe('Landsat 9');
  });

  it('enforces optical laser comm pointing constraint and continuous RTG eclipse power', () => {
    // 1. Optical Laser Terminal (±0.005°) must reject ±0.04° wheels and pass with ±0.002° star trackers
    const laserDesignCoarse: SpacecraftDesign = {
      name: 'DeepLink Laser Craft',
      scenarioId: 'scenario-moon-scout',
      orbitId: 'orbit-lunar-polar-100',
      launchVehicleId: 'lv-falcon9-dedicated',
      structureId: 'bus-espa-smallsat',
      powerGenId: 'pwr-articulated-tracking',
      energyStorageId: 'bat-medium-600wh',
      adcsId: 'adcs-reaction-wheels', // ±0.04° too coarse for 0.005° laser terminal!
      commsId: 'comm-optical-laser',
      obcId: 'obc-radhard-fpga',
      thermalId: 'thm-active-heaters-louvers',
      instrumentIds: ['inst-neutron-spectrometer']
    };

    const coarseBudget = calculateResourceBudget(laserDesignCoarse, registry);
    expect(coarseBudget.isPointingFeasible).toBe(false);
    expect(coarseBudget.criticalIssues.some((i) => i.includes('Optical Laser'))).toBe(true);

    const fineBudget = calculateResourceBudget(
      { ...laserDesignCoarse, adcsId: 'adcs-star-tracker-precision' },
      registry
    );
    expect(fineBudget.isPointingFeasible).toBe(true);
    expect(fineBudget.isPowerFeasible).toBe(true);

    // 2. 120W RTG sustains a 116W lunar craft continuously through 48-min lunar eclipse with 0% battery DoD
    const rtgDesign: SpacecraftDesign = {
      ...laserDesignCoarse,
      name: 'Lunar RTG Scout',
      powerGenId: 'pwr-deepspace-rtg',
      energyStorageId: 'bat-compact-150wh',
      commsId: 'comm-xband-horn'
    };
    const rtgBudget = calculateResourceBudget(rtgDesign, registry);
    expect(rtgBudget.isPowerFeasible).toBe(true);
    expect(rtgBudget.batteryDoDPercent).toBe(0);
  });

  it('models multi-body Keplerian mechanics, AU solar scaling, and non-Earth magnetospheres', () => {
    const marsSpeed = calculateOrbitalSpeed(380, 'mars');
    expect(marsSpeed).toBeGreaterThan(3.2);
    expect(marsSpeed).toBeLessThan(3.5);

    const psychePeriodMin = calculateOrbitalPeriod(120, 'asteroid') / 60;
    expect(psychePeriodMin).toBeGreaterThan(280);
    expect(psychePeriodMin).toBeLessThan(315);

    const solarTitan: SpacecraftDesign = {
      name: 'Titan Solar Test',
      scenarioId: 'scenario-sandbox',
      orbitId: 'orbit-titan-haze-1200',
      launchVehicleId: 'lv-vulcan-centaur',
      structureId: 'bus-espa-smallsat',
      powerGenId: 'pwr-deployable-fixed',
      energyStorageId: 'bat-heavy-1800wh',
      adcsId: 'adcs-star-tracker-precision',
      commsId: 'comm-kaband-dish',
      obcId: 'obc-radhard-fpga',
      thermalId: 'thm-active-heaters-louvers',
      instrumentIds: ['inst-sar-radar']
    };
    const solarBudget = calculateResourceBudget(solarTitan, registry);
    expect(solarBudget.isPowerFeasible).toBe(false);
    expect(solarBudget.daylightPowerGenW).toBeLessThan(10);

    const rtgTitanBudget = calculateResourceBudget(
      { ...solarTitan, powerGenId: 'pwr-multi-rtg', launchVehicleId: 'lv-nasa-sls' },
      registry
    );
    expect(rtgTitanBudget.isPowerFeasible).toBe(true);
    expect(rtgTitanBudget.batteryDoDPercent).toBe(0);

    const marsMagBudget = calculateResourceBudget(
      {
        ...solarTitan,
        orbitId: 'orbit-mars-science-380',
        powerGenId: 'pwr-articulated-tracking',
        adcsId: 'adcs-magnetorquers',
        commsId: 'comm-xband-horn',
        instrumentIds: ['inst-multispectral']
      },
      registry
    );
    expect(marsMagBudget.environmentCompatible).toBe(false);
  });

  it('grants infinite budget in sandbox planet exploration and validates all 8 NASA flagship presets', () => {
    const sandboxScenario = registry.scenarios.find((s) => s.id === 'scenario-sandbox')!;
    expect(sandboxScenario.budgetM).toBe(-1);

    for (const body of CELESTIAL_BODY_LIST) {
      const profile = getNasaMissionProfile(body.id, body.defaultOrbitId);
      const budget = calculateResourceBudget(profile.simPresetDesign, registry);

      expect(budget.isBudgetUnlimited).toBe(true);
      expect(budget.budgetLimitM).toBe(Infinity);
      expect(budget.isCostFeasible).toBe(true);
      expect(budget.isMassFeasible).toBe(true);
      expect(budget.isPowerFeasible).toBe(true);
      expect(budget.isPointingFeasible).toBe(true);
      expect(budget.isDataFeasible).toBe(true);
      expect(budget.environmentCompatible).toBe(true);
      expect(budget.criticalIssues).toEqual([]);

      const orbit = registry.orbits.find((o) => o.id === profile.simPresetDesign.orbitId)!;
      const report = evaluateMissionDesign(
        profile.simPresetDesign,
        budget,
        sandboxScenario,
        registry.instruments,
        orbit,
        realMissionsData as any
      );
      expect(Number.isFinite(report.overallScore)).toBe(true);
      expect(report.budgetScore).toBe(100);
      expect(report.status).not.toBe('MISSION_FAILURE');
      expect(report.matchedRealMission).toBeDefined();
    }
  });
});
