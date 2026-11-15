import {
  SpacecraftDesign,
  ResourceBudget,
  StructureSubsystem,
  PowerGenSubsystem,
  EnergyStorageSubsystem,
  AdcsSubsystem,
  CommsSubsystem,
  ObcSubsystem,
  ThermalSubsystem,
  Instrument,
  LaunchVehicle,
  Orbit,
  Scenario
} from '../types';
import {
  calculateDailyDownlinkCapacityGb,
  getCelestialBodyMeta,
  isNuclearRtgPower
} from './orbital';

/**
 * Returns true if a budget limit or scenario grants unlimited (infinity) funding.
 */
export function isBudgetUnlimited(limitM: number): boolean {
  return !Number.isFinite(limitM) || limitM < 0;
}

/**
 * Computes effective launch vehicle payload capacity (kg) for a given mission orbit.
 */
export function getLaunchCapacityForOrbit(launchVehicle: LaunchVehicle, orbit: Orbit): number {
  if (orbit.id === 'orbit-sso-700') return launchVehicle.maxPayloadSsoKg;
  if (orbit.id === 'orbit-geo-35786') return launchVehicle.maxPayloadGtoKg;
  if (orbit.id === 'orbit-lunar-polar-100' || orbit.id === 'orbit-lagrange-l2') {
    return launchVehicle.maxPayloadTliKg;
  }
  if (orbit.centralBody !== 'earth') {
    const bodyMeta = getCelestialBodyMeta(orbit.centralBody);
    if (bodyMeta.tliPayloadScale < 0.5 && launchVehicle.maxPayloadTliKg < 500) {
      return 0;
    }
    return Math.round(launchVehicle.maxPayloadTliKg * bodyMeta.tliPayloadScale);
  }
  return launchVehicle.maxPayloadLeoKg;
}

export interface DataRegistry {
  structures: StructureSubsystem[];
  powerGeneration: PowerGenSubsystem[];
  energyStorage: EnergyStorageSubsystem[];
  adcs: AdcsSubsystem[];
  communications: CommsSubsystem[];
  obc: ObcSubsystem[];
  thermal: ThermalSubsystem[];
  instruments: Instrument[];
  launchVehicles: LaunchVehicle[];
  orbits: Orbit[];
  scenarios: Scenario[];
}

export function calculateResourceBudget(
  design: SpacecraftDesign,
  data: DataRegistry
): ResourceBudget {
  const structure = data.structures.find((s) => s.id === design.structureId) || data.structures[0];
  const powerGen = data.powerGeneration.find((p) => p.id === design.powerGenId) || data.powerGeneration[0];
  const battery = data.energyStorage.find((b) => b.id === design.energyStorageId) || data.energyStorage[0];
  const adcs = data.adcs.find((a) => a.id === design.adcsId) || data.adcs[0];
  const comms = data.communications.find((c) => c.id === design.commsId) || data.communications[0];
  const obc = data.obc.find((o) => o.id === design.obcId) || data.obc[0];
  const thermal = data.thermal.find((t) => t.id === design.thermalId) || data.thermal[0];

  const selectedInstruments = data.instruments.filter((inst) =>
    design.instrumentIds.includes(inst.id)
  );

  const orbit = data.orbits.find((o) => o.id === design.orbitId) || data.orbits[0];
  const launchVehicle = data.launchVehicles.find((lv) => lv.id === design.launchVehicleId) || data.launchVehicles[0];
  const scenario = data.scenarios.find((sc) => sc.id === design.scenarioId) || data.scenarios[0];

  const criticalIssues: string[] = [];
  const warnings: string[] = [];

  // 1. Mass calculation
  const busDryMassKg =
    structure.dryMassKg +
    powerGen.massKg +
    battery.massKg +
    adcs.massKg +
    comms.massKg +
    obc.massKg +
    thermal.massKg;

  const payloadMassKg = selectedInstruments.reduce((acc, inst) => acc + inst.massKg, 0);
  const totalMassKg = busDryMassKg + payloadMassKg;

  if (payloadMassKg > structure.maxPayloadMassKg) {
    criticalIssues.push(
      `Payload mass (${payloadMassKg.toFixed(1)} kg) exceeds ${structure.name} limit (${structure.maxPayloadMassKg} kg)`
    );
  }

  // Determine launch vehicle capacity for the chosen orbit
  const bodyMeta = getCelestialBodyMeta(orbit.centralBody);
  const maxLaunchCapacityKg = getLaunchCapacityForOrbit(launchVehicle, orbit);

  const massMarginKg = maxLaunchCapacityKg - totalMassKg;
  const massMarginPercent = maxLaunchCapacityKg > 0 ? (massMarginKg / maxLaunchCapacityKg) * 100 : -100;
  const isMassFeasible = totalMassKg <= maxLaunchCapacityKg && maxLaunchCapacityKg > 0;

  if (!isMassFeasible) {
    criticalIssues.push(
      `Spacecraft mass (${totalMassKg.toFixed(1)} kg) exceeds ${launchVehicle.name} launch capacity to ${orbit.name} (${maxLaunchCapacityKg} kg)`
    );
  } else if (massMarginPercent < 20.0) {
    warnings.push(
      `NASA Design Margin Warning: Mass margin (${massMarginPercent.toFixed(1)}%) is below standard 20% AIAA reserve`
    );
  }

  // 2. Power calculation (inverse-square AU scaling for solar PV; RTGs are distance-immune)
  const instrumentsPowerWatts = selectedInstruments.reduce((acc, inst) => acc + inst.powerWatts, 0);
  const baseBusPowerWatts = adcs.powerWatts + comms.powerWatts + obc.powerWatts + thermal.powerWatts;
  const daylightPowerConsumedW = baseBusPowerWatts + instrumentsPowerWatts;
  const isRtg = isNuclearRtgPower(powerGen.id);
  const solarFluxMultiplier = isRtg ? 1.0 : bodyMeta.solarFluxMultiplier;
  const rawPowerOutputW = powerGen.powerOutputWatts;
  const daylightPowerGenW = isRtg
    ? powerGen.powerOutputWatts
    : Math.round(powerGen.powerOutputWatts * bodyMeta.solarFluxMultiplier);
  const daylightPowerBalanceW = daylightPowerGenW - daylightPowerConsumedW;

  // During eclipse, non-essential transmitters might reduce power, but instruments + bus run.
  // RTG power generation continues uninterrupted in planetary shadow.
  const eclipsePowerConsumedW = baseBusPowerWatts * 0.7 + instrumentsPowerWatts * 0.8;
  const eclipseGenW = isRtg ? powerGen.powerOutputWatts : 0;
  const netEclipseDrawW = Math.max(0, eclipsePowerConsumedW - eclipseGenW);
  const eclipseDurationHours = (orbit.eclipseMinutes || 0) / 60.0;
  const eclipseEnergyRequiredWh = netEclipseDrawW * eclipseDurationHours;

  const batteryDoDPercent = battery.capacityWh > 0 ? (eclipseEnergyRequiredWh / battery.capacityWh) * 100 : 100;
  const isBatteryDoDSafe = batteryDoDPercent <= battery.maxDoD * 100;
  const isPowerFeasible = daylightPowerBalanceW >= 0 && isBatteryDoDSafe;

  if (daylightPowerBalanceW < 0) {
    const fluxNote =
      !isRtg && bodyMeta.solarFluxMultiplier < 0.8
        ? ` (${(bodyMeta.solarFluxMultiplier * 100).toFixed(1)}% sunlight at ${bodyMeta.name} cuts ${rawPowerOutputW}W PV to ${daylightPowerGenW}W — try Articulated/Mega Solar or RTG)`
        : '';
    criticalIssues.push(
      `Power generation (${daylightPowerGenW} W) cannot support daylight load (${daylightPowerConsumedW.toFixed(0)} W). Deficit: ${Math.abs(daylightPowerBalanceW).toFixed(0)} W${fluxNote}`
    );
  }

  if (!isBatteryDoDSafe && orbit.eclipseMinutes > 0) {
    criticalIssues.push(
      `Eclipse Depth of Discharge (${batteryDoDPercent.toFixed(1)}%) exceeds battery safe limit (${(battery.maxDoD * 100).toFixed(0)}%). Spacecraft will brown out during night passes.`
    );
  }

  // 3. Data & Telecommunications
  // Assume instruments collect data across a 25% duty cycle each day
  const dailyActiveSeconds = 86400 * 0.25;
  const totalInstrumentsDataRateMbps = selectedInstruments.reduce((acc, inst) => acc + inst.dataRateMbps, 0);
  let dailyDataGenGb = (totalInstrumentsDataRateMbps * dailyActiveSeconds) / 8000; // in Gigabytes

  // If edge AI is present, onboard preprocessing reduces downlink bandwidth required
  if (obc.id === 'obc-edge-ai-payload') {
    dailyDataGenGb *= 0.4; // 60% bandwidth compression
  }

  const dailyDownlinkCapacityGb = calculateDailyDownlinkCapacityGb(
    comms.downlinkRateMbps,
    orbit.groundStationContactsPerDay,
    orbit.avgPassDurationMinutes
  );

  const dataBufferHeadroomGb = dailyDownlinkCapacityGb - dailyDataGenGb;
  const isDataFeasible = dataBufferHeadroomGb >= 0 || dailyDataGenGb === 0;

  if (!isDataFeasible) {
    warnings.push(
      `Data Bottleneck: Daily data generated (${dailyDataGenGb.toFixed(1)} GB) exceeds ground downlink capacity (${dailyDownlinkCapacityGb.toFixed(1)} GB). Storage buffer will overflow.`
    );
  }

  // 4. Pointing accuracy (driven by strictest mounted instrument AND comms beamwidth)
  const spacecraftPointingDeg = adcs.pointingAccuracyDeg;
  let pointingDemandedDeg = 5.0;
  let pointingDriver = 'Spacecraft bus baseline';
  for (const inst of selectedInstruments) {
    if (inst.minPointingAccuracyDeg < pointingDemandedDeg) {
      pointingDemandedDeg = inst.minPointingAccuracyDeg;
      pointingDriver = inst.name;
    }
  }
  if (comms.pointingToleranceDeg < pointingDemandedDeg) {
    pointingDemandedDeg = comms.pointingToleranceDeg;
    pointingDriver = comms.name;
  }

  const isPointingFeasible = spacecraftPointingDeg <= pointingDemandedDeg;
  if (!isPointingFeasible && (selectedInstruments.length > 0 || comms.pointingToleranceDeg < 5.0)) {
    criticalIssues.push(
      `Pointing Accuracy Error: ADCS accuracy (±${spacecraftPointingDeg}°) does not meet ${pointingDriver} requirement (±${pointingDemandedDeg}°)`
    );
  }

  // 5. Environmental & Orbit compatibility
  let environmentCompatible = true;
  if (adcs.requiresMagneticField && !bodyMeta.hasMagnetosphere) {
    environmentCompatible = false;
    criticalIssues.push(
      `${adcs.name} requires a planetary geomagnetic field and cannot operate at ${orbit.name}`
    );
  }

  if (orbit.radiationLevel === 'high' || orbit.radiationLevel === 'cosmic-rays') {
    if (obc.id === 'obc-standard-radtol') {
      warnings.push(
        `High radiation environment at ${orbit.name} may induce Single Event Upsets (SEUs) in standard avionics. Rad-hard computer recommended.`
      );
    }
  }

  // 6. Cost model
  const instrumentsCostM = selectedInstruments.reduce((acc, inst) => acc + inst.costM, 0);
  const busCostM =
    structure.costM +
    powerGen.costM +
    battery.costM +
    adcs.costM +
    comms.costM +
    obc.costM +
    thermal.costM;

  const spacecraftCostM = busCostM + instrumentsCostM;
  const launchCostM = launchVehicle.costM;
  const opsCostM = scenario.targetLifetimeYears * 2.5; // $2.5M per year mission operations
  const totalCostM = spacecraftCostM + launchCostM + opsCostM;
  const unlimitedBudget = scenario.difficulty === 'Sandbox' || isBudgetUnlimited(scenario.budgetM);
  const budgetLimitM = unlimitedBudget ? Infinity : scenario.budgetM;
  const isCostFeasible = unlimitedBudget ? true : totalCostM <= budgetLimitM;

  if (!isCostFeasible) {
    criticalIssues.push(
      `Budget Overrun: Total mission cost ($${totalCostM.toFixed(1)}M) exceeds allocated budget ($${budgetLimitM}M)`
    );
  }

  return {
    totalMassKg,
    payloadMassKg,
    busDryMassKg,
    maxLaunchCapacityKg,
    massMarginKg,
    massMarginPercent,
    isMassFeasible,

    daylightPowerGenW,
    daylightPowerConsumedW,
    daylightPowerBalanceW,
    eclipsePowerConsumedW,
    eclipseEnergyRequiredWh,
    batteryCapacityWh: battery.capacityWh,
    batteryDoDPercent,
    isPowerFeasible,

    dailyDataGenGb,
    dailyDownlinkCapacityGb,
    dataBufferHeadroomGb,
    isDataFeasible,

    spacecraftPointingDeg,
    pointingDemandedDeg,
    isPointingFeasible,

    spacecraftCostM,
    launchCostM,
    opsCostM,
    totalCostM,
    budgetLimitM,
    isCostFeasible,
    isBudgetUnlimited: unlimitedBudget,

    environmentCompatible,
    solarFluxMultiplier,
    rawPowerOutputW,
    criticalIssues,
    warnings
  };
}
