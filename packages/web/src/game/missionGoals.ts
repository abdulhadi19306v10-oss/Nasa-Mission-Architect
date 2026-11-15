import {
  SpacecraftDesign,
  ResourceBudget,
  Orbit,
  Scenario,
  MissionReport,
  isNuclearRtgPower,
  getCelestialBodyMeta
} from '@sim/index';
import { CampaignMission } from './campaign';
import { evaluateSynergies } from './knowledge';

export type GoalPhaseTag = 'BUILD' | 'FLIGHT' | 'ORBIT';
export type GoalSuggestedTab = 'payload' | 'power_bus' | 'systems' | 'launch';

export interface MissionGoalEval {
  id: string;
  phase: GoalPhaseTag;
  title: string;
  detail: string;
  xpBonus: number;
  completed: boolean;
  suggestedTab?: GoalSuggestedTab;
  progressLabel?: string;
}

export interface FlightGoalTelemetry {
  gatesHit: number;
  totalGates: number;
  maxQMastered: boolean;
  precisionStages: number;
  perfectApexCount?: number;
}

export interface OrbitalGoalTelemetry {
  sciencePoints: number;
  anomaliesSolved: number;
  eclipseSurvived: boolean;
  markersAnalyzed?: number;
  markersTransmitted?: number;
  totalMarkers?: number;
}

export interface MissionGoalsSummary {
  goals: MissionGoalEval[];
  buildCompletedCount: number;
  buildTotalCount: number;
  totalCompletedCount: number;
  earnedBonusXp: number;
}

function getAllPreflightChecksOk(design: SpacecraftDesign, budget: ResourceBudget): boolean {
  return (
    design.instrumentIds.length > 0 &&
    budget.isMassFeasible &&
    budget.isPowerFeasible &&
    budget.isPointingFeasible &&
    budget.isDataFeasible &&
    budget.environmentCompatible &&
    budget.isCostFeasible &&
    budget.criticalIssues.length === 0
  );
}

/**
 * Evaluate live Mission Goals across Hangar construction, 3D Ring Ascent, and Orbital Science Ops.
 * Works for all 10 campaign missions and deep-space World Explorer free-flights.
 */
export function evaluateMissionGoals(params: {
  mission: CampaignMission | null;
  design: SpacecraftDesign;
  budget: ResourceBudget;
  orbit: Orbit;
  scenario: Scenario;
  targetSciencePoints: number;
  flight?: FlightGoalTelemetry;
  orbital?: OrbitalGoalTelemetry;
}): MissionGoalsSummary {
  const { mission, design, budget, orbit, scenario, targetSciencePoints, flight, orbital } = params;
  const synergies = evaluateSynergies(design);
  const bodyMeta = getCelestialBodyMeta(orbit.centralBody);
  const preflightGo = getAllPreflightChecksOk(design, budget);
  const hasInst = (id: string) => design.instrumentIds.includes(id);

  const gatesHit = flight?.gatesHit ?? 0;
  const totalGates = flight?.totalGates ?? 8;
  const ringThreshold = Math.max(5, Math.ceil(totalGates * 0.65));
  const scienceXp = orbital?.sciencePoints ?? 0;
  const allMarkersRelayed = Boolean(
    orbital?.totalMarkers &&
      orbital.markersTransmitted !== undefined &&
      orbital.markersTransmitted >= orbital.totalMarkers
  );

  let goals: MissionGoalEval[] = [];

  if (!mission) {
    // Deep-Space Free-Flight / Selected World Goals (always engaging even in sandbox!)
    const targetInstMatch = design.instrumentIds.some((id) => scenario.scoringBonusInstruments.includes(id));
    const goal1Done = design.instrumentIds.length >= 2 || (design.instrumentIds.length >= 1 && synergies.active.length > 0);
    const goal2Done =
      preflightGo &&
      (orbit.centralBody === 'titan'
        ? isNuclearRtgPower(design.powerGenId)
        : !bodyMeta.hasMagnetosphere
        ? design.adcsId !== 'adcs-magnetorquer'
        : true);
    const goal3Done = Boolean(flight && (gatesHit >= ringThreshold || (flight.maxQMastered && flight.precisionStages >= 1)));
    const goal4Done = allMarkersRelayed || scienceXp >= targetSciencePoints;

    goals = [
      {
        id: 'sbx-payload',
        phase: 'BUILD',
        title: `Science Rig for ${bodyMeta.shortName}`,
        detail: targetInstMatch
          ? 'Mount 2+ instruments (or trigger a Synergy Combo)'
          : `Equip a ${bodyMeta.shortName} science sensor + 1 companion payload`,
        xpBonus: 160,
        completed: goal1Done,
        suggestedTab: 'payload',
        progressLabel: `${design.instrumentIds.length}/2 sensors`
      },
      {
        id: 'sbx-env',
        phase: 'BUILD',
        title: `${bodyMeta.shortName} Hazard Hardened`,
        detail:
          orbit.centralBody === 'titan'
            ? 'Run Pu-238 Nuclear RTG & pass all flight checks'
            : `Clear all preflight GO checks for ${(bodyMeta.solarFluxMultiplier * 100).toFixed(0)}% flux`,
        xpBonus: 180,
        completed: goal2Done,
        suggestedTab: 'power_bus',
        progressLabel: goal2Done ? 'CERTIFIED' : 'CHECK BUS/PWR'
      },
      {
        id: 'sbx-flight',
        phase: 'FLIGHT',
        title: `Skyway Pilot (${ringThreshold}/${totalGates} Rings)`,
        detail: `Steer through ${ringThreshold}+ ascent rings or nail Max-Q + hot-stage`,
        xpBonus: 200,
        completed: goal3Done,
        suggestedTab: 'launch',
        progressLabel: flight ? `${gatesHit}/${totalGates} rings` : `0/${totalGates} rings`
      },
      {
        id: 'sbx-orbit',
        phase: 'ORBIT',
        title: `Log ${targetSciencePoints.toLocaleString()} Science XP`,
        detail: `Scan ${bodyMeta.shortName} beacons & downlink via DSN`,
        xpBonus: 240,
        completed: goal4Done,
        progressLabel: orbital ? `${scienceXp}/${targetSciencePoints} XP` : `0/${targetSciencePoints} XP`
      }
    ];
  } else {
    // Custom tailored contract goals per campaign mission #1..#10
    switch (mission.id) {
      case 'mission-1-first-orbit': {
        const g1 = design.instrumentIds.length >= 2 || synergies.active.some((s) => s.id === 'syn-climate-twin');
        const g2 = preflightGo && budget.totalMassKg <= 165;
        const g3 = Boolean(flight && (gatesHit >= ringThreshold || flight.precisionStages >= 2));
        const g4 = allMarkersRelayed || scienceXp >= targetSciencePoints;
        goals = [
          {
            id: 'm1-twin',
            phase: 'BUILD',
            title: 'Dual Earth Sensor Suite',
            detail: 'Mount Radiometer + Multispectral for +20% Synergy',
            xpBonus: 140,
            completed: g1,
            suggestedTab: 'payload',
            progressLabel: `${design.instrumentIds.length}/2 sensors`
          },
          {
            id: 'm1-light',
            phase: 'BUILD',
            title: 'SmallSat Mass Diet (<= 165 kg)',
            detail: `Keep launch mass under 165 kg with all checks GO (now ${Math.round(budget.totalMassKg)} kg)`,
            xpBonus: 160,
            completed: g2,
            suggestedTab: 'power_bus',
            progressLabel: `${Math.round(budget.totalMassKg)}/165 kg`
          },
          {
            id: 'm1-flight',
            phase: 'FLIGHT',
            title: `Coastal Arc Pilot (${ringThreshold}/${totalGates} Rings)`,
            detail: 'Steer cleanly through the skyway rings on ascent',
            xpBonus: 180,
            completed: g3,
            suggestedTab: 'launch',
            progressLabel: `${gatesHit}/${totalGates} rings`
          },
          {
            id: 'm1-orbit',
            phase: 'ORBIT',
            title: `Beacon Archive (${targetSciencePoints} XP)`,
            detail: 'Scan Earth storms & downlink to Wallops / Svalbard',
            xpBonus: 200,
            completed: g4,
            progressLabel: `${scienceXp}/${targetSciencePoints} XP`
          }
        ];
        break;
      }

      case 'mission-2-climate-sentinel': {
        const g1 = hasInst('inst-hyperspectral') || synergies.active.some((s) => s.id === 'syn-climate-twin');
        const g2 = preflightGo && budget.dailyDownlinkCapacityGb >= 25;
        const g3 = Boolean(flight && gatesHit >= ringThreshold);
        const g4 = allMarkersRelayed || scienceXp >= targetSciencePoints;
        goals = [
          {
            id: 'm2-hyper',
            phase: 'BUILD',
            title: 'Hyperspectral / Twin Climate Eye',
            detail: 'Equip Hyperspectral Imager OR Multi-Band Optical + Radiometer',
            xpBonus: 170,
            completed: g1,
            suggestedTab: 'payload',
            progressLabel: g1 ? 'READY' : 'ADD SENSOR'
          },
          {
            id: 'm2-link',
            phase: 'BUILD',
            title: 'High-Throughput Link (>= 25 GB/d)',
            detail: `Upgrade dish/buffer for 25+ GB/day downlink (now ${Math.round(budget.dailyDownlinkCapacityGb)} GB/d)`,
            xpBonus: 180,
            completed: g2,
            suggestedTab: 'systems',
            progressLabel: `${Math.round(budget.dailyDownlinkCapacityGb)}/25 GB`
          },
          {
            id: 'm2-flight',
            phase: 'FLIGHT',
            title: `Polar SSO Corridor (${ringThreshold}/${totalGates} Rings)`,
            detail: 'Hold the SSO trajectory rings through Max-Q',
            xpBonus: 200,
            completed: g3,
            suggestedTab: 'launch',
            progressLabel: `${gatesHit}/${totalGates} rings`
          },
          {
            id: 'm2-orbit',
            phase: 'ORBIT',
            title: `Wildfire & Ocean Scan (${targetSciencePoints} XP)`,
            detail: 'Capture climate anomalies & beam telemetry down',
            xpBonus: 220,
            completed: g4,
            progressLabel: `${scienceXp}/${targetSciencePoints} XP`
          }
        ];
        break;
      }

      case 'mission-5-geo-stormwatch': {
        const g1 = hasInst('inst-radiometer') && (design.commsId === 'comm-kaband-dish' || design.commsId === 'comm-optical-laser');
        const g2 = preflightGo && design.energyStorageId === 'bat-heavy-1800wh' && design.obcId === 'obc-radhard-fpga';
        const g3 = Boolean(flight && gatesHit >= ringThreshold);
        const g4 = allMarkersRelayed || scienceXp >= targetSciencePoints;
        goals = [
          {
            id: 'm3-storm',
            phase: 'BUILD',
            title: 'GEO Storm Sensor + High-Gain Link',
            detail: 'Pair Microwave Radiometer with Ka-Band Dish or Laser Comms',
            xpBonus: 190,
            completed: g1,
            suggestedTab: 'systems',
            progressLabel: g1 ? 'LOCKED' : 'UPGRADE'
          },
          {
            id: 'm3-eclipse',
            phase: 'BUILD',
            title: 'Van Allen Belt Armor',
            detail: 'Equip Heavy 1800Wh Battery + Rad-Hard FPGA Computer & GTO Rocket',
            xpBonus: 210,
            completed: g2,
            suggestedTab: 'power_bus',
            progressLabel: g2 ? 'ARMORED' : 'UPGRADE'
          },
          {
            id: 'm3-flight',
            phase: 'FLIGHT',
            title: `Geosync Corridor (${ringThreshold}/${totalGates} Rings)`,
            detail: 'Fly the high-energy GTO skyway curve smoothly',
            xpBonus: 210,
            completed: g3,
            suggestedTab: 'launch',
            progressLabel: `${gatesHit}/${totalGates} rings`
          },
          {
            id: 'm3-orbit',
            phase: 'ORBIT',
            title: `Hurricane Watch (${targetSciencePoints} XP)`,
            detail: 'Track storm eyes and resolve orbital anomalies',
            xpBonus: 240,
            completed: g4,
            progressLabel: `${scienceXp}/${targetSciencePoints} XP`
          }
        ];
        break;
      }

      case 'mission-3-moon-scout': {
        const g1 = hasInst('inst-lunar-lidar') && hasInst('inst-neutron-spectrometer');
        const g2 =
          preflightGo &&
          design.adcsId === 'adcs-star-tracker-precision' &&
          (design.energyStorageId === 'bat-heavy-1800wh' || isNuclearRtgPower(design.powerGenId));
        const g3 = Boolean(flight && gatesHit >= ringThreshold);
        const g4 = allMarkersRelayed || scienceXp >= targetSciencePoints;
        goals = [
          {
            id: 'm4-artemis',
            phase: 'BUILD',
            title: 'Artemis Volatile Hunter (+25%)',
            detail: 'Mount BOTH Lunar LIDAR + Neutron Spectrometer',
            xpBonus: 220,
            completed: g1,
            suggestedTab: 'payload',
            progressLabel: `${Number(hasInst('inst-lunar-lidar')) + Number(hasInst('inst-neutron-spectrometer'))}/2`
          },
          {
            id: 'm4-night',
            phase: 'BUILD',
            title: '48m Lunar Shadow Spec',
            detail: 'Use Precision Star Trackers + Heavy 1800Wh Bat (or RTG) with GO status',
            xpBonus: 200,
            completed: g2,
            suggestedTab: 'systems',
            progressLabel: g2 ? 'SHADOW SAFE' : 'CHECK ADCS/BAT'
          },
          {
            id: 'm4-flight',
            phase: 'FLIGHT',
            title: `Trans-Lunar Highway (${ringThreshold}/${totalGates} Rings)`,
            detail: 'Thread the Trans-Lunar Skyway & trigger crisp stage separation',
            xpBonus: 220,
            completed: g3,
            suggestedTab: 'launch',
            progressLabel: `${gatesHit}/${totalGates} rings`
          },
          {
            id: 'm4-orbit',
            phase: 'ORBIT',
            title: `Polar Ice Map (${targetSciencePoints} XP)`,
            detail: 'Scan Shackleton Crater ice traps & transmit telemetry',
            xpBonus: 260,
            completed: g4,
            progressLabel: `${scienceXp}/${targetSciencePoints} XP`
          }
        ];
        break;
      }

      case 'mission-6-venus-magellan': {
        const g1 = hasInst('inst-sar-radar') && design.structureId === 'bus-flagship-hex';
        const g2 = preflightGo && design.thermalId === 'thm-active-heaters-louvers' && design.energyStorageId === 'bat-heavy-1800wh';
        const g3 = Boolean(flight && gatesHit >= ringThreshold);
        const g4 = allMarkersRelayed || scienceXp >= targetSciencePoints;
        goals = [
          {
            id: 'm5-sar',
            phase: 'BUILD',
            title: 'Sub-Cloud SAR Radar Bus',
            detail: 'Mount L-Band SAR Radar on Flagship Hex Bus',
            xpBonus: 220,
            completed: g1,
            suggestedTab: 'payload',
            progressLabel: g1 ? 'MOUNTED' : 'NEED SAR+HEX'
          },
          {
            id: 'm5-therm',
            phase: 'BUILD',
            title: '191% Sunlight Cooling Loop',
            detail: 'Equip Active Cooling Louvers + Heavy 1800Wh Battery',
            xpBonus: 220,
            completed: g2,
            suggestedTab: 'systems',
            progressLabel: g2 ? 'COOLED' : 'ADD LOUVERS'
          },
          {
            id: 'm5-flight',
            phase: 'FLIGHT',
            title: `Venus Cloud Sweep (${ringThreshold}/${totalGates} Rings)`,
            detail: 'Navigate the skyway gates smoothly',
            xpBonus: 220,
            completed: g3,
            suggestedTab: 'launch',
            progressLabel: `${gatesHit}/${totalGates} rings`
          },
          {
            id: 'm5-orbit',
            phase: 'ORBIT',
            title: `Maxwell Montes Survey (${targetSciencePoints} XP)`,
            detail: 'Pierce sulfuric clouds & downlink radar strips',
            xpBonus: 260,
            completed: g4,
            progressLabel: `${scienceXp}/${targetSciencePoints} XP`
          }
        ];
        break;
      }

      case 'mission-7-mars-recon': {
        const g1 = design.instrumentIds.length >= 2 && (hasInst('inst-multispectral') || hasInst('inst-hyperspectral'));
        const g2 = preflightGo && budget.daylightPowerBalanceW >= 40;
        const g3 = Boolean(flight && gatesHit >= ringThreshold);
        const g4 = allMarkersRelayed || scienceXp >= targetSciencePoints;
        goals = [
          {
            id: 'm6-suite',
            phase: 'BUILD',
            title: 'Multi-Spectral Mars Suite',
            detail: 'Equip 2+ sensors including Multispectral or Hyperspectral',
            xpBonus: 220,
            completed: g1,
            suggestedTab: 'payload',
            progressLabel: `${design.instrumentIds.length}/2 sensors`
          },
          {
            id: 'm6-solar',
            phase: 'BUILD',
            title: '1.52 AU Solar Headroom (+40W)',
            detail: `Survive 43% sunlight with Clipper Mega Solar & +40W net surplus`,
            xpBonus: 240,
            completed: g2,
            suggestedTab: 'power_bus',
            progressLabel: `${budget.daylightPowerBalanceW >= 0 ? '+' : ''}${Math.round(budget.daylightPowerBalanceW)}W`
          },
          {
            id: 'm6-flight',
            phase: 'FLIGHT',
            title: `Ares Corridor Pilot (${ringThreshold}/${totalGates} Rings)`,
            detail: 'Guide launch through skyway rings into Mars escape',
            xpBonus: 240,
            completed: g3,
            suggestedTab: 'launch',
            progressLabel: `${gatesHit}/${totalGates} rings`
          },
          {
            id: 'm6-orbit',
            phase: 'ORBIT',
            title: `Jezero & Polar Ice (${targetSciencePoints} XP)`,
            detail: 'Capture canyon targets & beam data to Goldstone DSN',
            xpBonus: 280,
            completed: g4,
            progressLabel: `${scienceXp}/${targetSciencePoints} XP`
          }
        ];
        break;
      }

      case 'mission-4-cosmic-eye': {
        const g1 = hasInst('inst-space-telescope') && design.adcsId === 'adcs-star-tracker-precision';
        const g2 = preflightGo && synergies.active.some((s) => s.id === 'syn-deep-field');
        const g3 = Boolean(flight && gatesHit >= ringThreshold);
        const g4 = allMarkersRelayed || scienceXp >= targetSciencePoints;
        goals = [
          {
            id: 'm7-tel',
            phase: 'BUILD',
            title: '0.8m Exoplanet Telescope + Star Tracker',
            detail: 'Pair Space Telescope with ±0.002° Precision Star Trackers',
            xpBonus: 250,
            completed: g1,
            suggestedTab: 'payload',
            progressLabel: g1 ? 'LOCKED' : 'NEED SCOPE'
          },
          {
            id: 'm7-syn',
            phase: 'BUILD',
            title: 'Cryogenic Laser Synergy (+25%)',
            detail: 'Add Active Louvers + Optical Laser Comms for Deep-Field Synergy',
            xpBonus: 260,
            completed: g2,
            suggestedTab: 'systems',
            progressLabel: g2 ? '+25% ACTIVE' : 'LOUVERS+LASER'
          },
          {
            id: 'm7-flight',
            phase: 'FLIGHT',
            title: `L2 Halo Highway (${ringThreshold}/${totalGates} Rings)`,
            detail: 'Steer cleanly past gravity-turn skyway gates',
            xpBonus: 240,
            completed: g3,
            suggestedTab: 'launch',
            progressLabel: `${gatesHit}/${totalGates} rings`
          },
          {
            id: 'm7-orbit',
            phase: 'ORBIT',
            title: `Exoplanet Spectra (${targetSciencePoints} XP)`,
            detail: 'Scan TRAPPIST-1e & deep-field targets at Sun-Earth L2',
            xpBonus: 300,
            completed: g4,
            progressLabel: `${scienceXp}/${targetSciencePoints} XP`
          }
        ];
        break;
      }

      case 'mission-8-psyche-core': {
        const g1 = hasInst('inst-magnetometer-boom') && hasInst('inst-neutron-spectrometer');
        const g2 =
          preflightGo &&
          design.commsId === 'comm-optical-laser' &&
          design.adcsId === 'adcs-star-tracker-precision';
        const g3 = Boolean(flight && gatesHit >= ringThreshold);
        const g4 = allMarkersRelayed || scienceXp >= targetSciencePoints;
        goals = [
          {
            id: 'm8-core',
            phase: 'BUILD',
            title: 'Core Magnetometer + Neutron Pair',
            detail: 'Mount Fluxgate Boom + Neutron Spectrometer (add Multispectral for max yield)',
            xpBonus: 250,
            completed: g1,
            suggestedTab: 'payload',
            progressLabel: g1 ? 'EQUIPPED' : 'ADD SENSORS'
          },
          {
            id: 'm8-dsoc',
            phase: 'BUILD',
            title: '2.9 AU DSOC Optical Link Spec',
            detail: 'Power subsystems on 12% sunlight with Optical Laser + Star Trackers',
            xpBonus: 280,
            completed: g2,
            suggestedTab: 'systems',
            progressLabel: g2 ? 'DSOC READY' : 'LASER+TRACKER'
          },
          {
            id: 'm8-flight',
            phase: 'FLIGHT',
            title: `Belt Skyway Run (${ringThreshold}/${totalGates} Rings)`,
            detail: 'Hold course through the 16 Psyche ascent circuit',
            xpBonus: 250,
            completed: g3,
            suggestedTab: 'launch',
            progressLabel: `${gatesHit}/${totalGates} rings`
          },
          {
            id: 'm8-orbit',
            phase: 'ORBIT',
            title: `Iron-Nickel Core Survey (${targetSciencePoints} XP)`,
            detail: 'Scan core metal outcrops & beam laser telemetry to DSN',
            xpBonus: 300,
            completed: g4,
            progressLabel: `${scienceXp}/${targetSciencePoints} XP`
          }
        ];
        break;
      }

      case 'mission-9-europa-clipper': {
        const g1 = hasInst('inst-magnetometer-boom') && design.instrumentIds.length >= 2;
        const g2 = preflightGo && design.obcId === 'obc-radhard-fpga' && design.thermalId === 'thm-active-heaters-louvers';
        const g3 = Boolean(flight && gatesHit >= ringThreshold);
        const g4 = allMarkersRelayed || scienceXp >= targetSciencePoints;
        goals = [
          {
            id: 'm9-ocean',
            phase: 'BUILD',
            title: 'Europa Ocean Probe Suite',
            detail: 'Mount Magnetometer Boom + 1 Optical/Radar Ocean Sensor',
            xpBonus: 260,
            completed: g1,
            suggestedTab: 'payload',
            progressLabel: `${design.instrumentIds.length}/2 sensors`
          },
          {
            id: 'm9-vault',
            phase: 'BUILD',
            title: 'Jovian Radiation Vault (3.7% Flux)',
            detail: 'Survive 3.7% sunlight & Jupiter belts via Rad-Hard FPGA + Active Louvers',
            xpBonus: 300,
            completed: g2,
            suggestedTab: 'power_bus',
            progressLabel: g2 ? 'VAULT SEALED' : 'FPGA+LOUVERS'
          },
          {
            id: 'm9-flight',
            phase: 'FLIGHT',
            title: `Jovian Sweep (${ringThreshold}/${totalGates} Rings)`,
            detail: 'Clear ascent rings aboard ULA Vulcan Centaur',
            xpBonus: 270,
            completed: g3,
            suggestedTab: 'launch',
            progressLabel: `${gatesHit}/${totalGates} rings`
          },
          {
            id: 'm9-orbit',
            phase: 'ORBIT',
            title: `Ice-Shell & Plume Scan (${targetSciencePoints} XP)`,
            detail: 'Measure induced ocean B-field & icy plume vents',
            xpBonus: 320,
            completed: g4,
            progressLabel: `${scienceXp}/${targetSciencePoints} XP`
          }
        ];
        break;
      }

      case 'mission-10-titan-cassini':
      default: {
        const g1 = hasInst('inst-sar-radar') && hasInst('inst-magnetometer-boom');
        const g2 = preflightGo && isNuclearRtgPower(design.powerGenId) && design.obcId === 'obc-radhard-fpga';
        const g3 = Boolean(flight && gatesHit >= Math.min(totalGates, ringThreshold + 1));
        const g4 = allMarkersRelayed || scienceXp >= targetSciencePoints;
        goals = [
          {
            id: 'm10-radar',
            phase: 'BUILD',
            title: 'Cassini-Titan Radar & Magnetometer',
            detail: 'Equip L-Band SAR Radar + Fluxgate Magnetometer Boom',
            xpBonus: 300,
            completed: g1,
            suggestedTab: 'payload',
            progressLabel: g1 ? 'EQUIPPED' : 'SAR + MAG'
          },
          {
            id: 'm10-nuke',
            phase: 'BUILD',
            title: '9.5 AU Pu-238 Nuclear Spec',
            detail: 'Replace failing solar wings with Quad-MMRTG Nuclear Power',
            xpBonus: 350,
            completed: g2,
            suggestedTab: 'power_bus',
            progressLabel: isNuclearRtgPower(design.powerGenId) ? 'MMRTG ONLINE' : 'NEED RTG'
          },
          {
            id: 'm10-flight',
            phase: 'FLIGHT',
            title: `Saturnian Apex (${Math.min(totalGates, ringThreshold + 1)}/${totalGates} Rings)`,
            detail: 'Master the flagship Vulcan Centaur ascent corridor',
            xpBonus: 300,
            completed: g3,
            suggestedTab: 'launch',
            progressLabel: `${gatesHit}/${totalGates} rings`
          },
          {
            id: 'm10-orbit',
            phase: 'ORBIT',
            title: `Kraken Mare Legacy (${targetSciencePoints} XP)`,
            detail: 'Map Titan hydrocarbon seas beneath methane haze',
            xpBonus: 400,
            completed: g4,
            progressLabel: `${scienceXp}/${targetSciencePoints} XP`
          }
        ];
        break;
      }
    }
  }

  const buildGoals = goals.filter((g) => g.phase === 'BUILD');
  const buildCompletedCount = buildGoals.filter((g) => g.completed).length;
  const totalCompletedCount = goals.filter((g) => g.completed).length;
  const earnedBonusXp = goals.reduce((sum, g) => sum + (g.completed ? g.xpBonus : 0), 0);

  return {
    goals,
    buildCompletedCount,
    buildTotalCount: buildGoals.length,
    totalCompletedCount,
    earnedBonusXp
  };
}

/**
 * Unified 1-to-3 Star calculation tying Build Goals + Ascent Skyway Gates + Orbital Science together.
 */
export function computeMissionStars(params: {
  status: MissionReport['status'];
  overallScore: number;
  scienceXp: number;
  targetSciencePoints: number;
  goalsSummary: MissionGoalsSummary;
}): number {
  const { status, overallScore, scienceXp, targetSciencePoints, goalsSummary } = params;
  if (status === 'MISSION_FAILURE') return 0;

  const totalCount = goalsSummary.goals.length;
  const doneCount = goalsSummary.totalCompletedCount;

  if (
    doneCount >= totalCount &&
    (overallScore >= 80 || scienceXp >= Math.round(targetSciencePoints * 1.4))
  ) {
    return 3;
  }

  if (
    (doneCount >= 3 && overallScore >= 68) ||
    (scienceXp >= Math.round(targetSciencePoints * 1.35) && overallScore >= 72)
  ) {
    return 2;
  }

  if (scienceXp >= targetSciencePoints || doneCount >= 2) {
    return 1;
  }

  return 0;
}
