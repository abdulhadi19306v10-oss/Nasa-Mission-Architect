import { SpacecraftDesign, isNuclearRtgPower } from '@sim/index';
import { TeamRole } from '../components/multiplayer/MultiplayerModal';

export type AssistDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface DifficultyProfile {
  id: AssistDifficulty;
  badge: string;
  tagline: string;
  xpMultiplier: number;
  allowAutoFit: boolean;
  showEngineeringHints: boolean;
  thermalLoadFactor: number;
  anomalyPaceFactor: number;
}

export const DIFFICULTY_PROFILES: Record<AssistDifficulty, DifficultyProfile> = {
  Beginner: {
    id: 'Beginner',
    badge: 'CADET ASSIST',
    tagline: 'Interactive NASA engineering hints, Auto-Fit blueprint helper, and forgiving thermal margins.',
    xpMultiplier: 1.0,
    allowAutoFit: true,
    showEngineeringHints: true,
    thermalLoadFactor: 0.72,
    anomalyPaceFactor: 0.85
  },
  Intermediate: {
    id: 'Intermediate',
    badge: 'FLIGHT ENGINEER',
    tagline: 'Balanced mission constraints, real-time thermal & ground-pass timing, +15% Career XP bonus.',
    xpMultiplier: 1.15,
    allowAutoFit: true,
    showEngineeringHints: true,
    thermalLoadFactor: 1.0,
    anomalyPaceFactor: 1.0
  },
  Advanced: {
    id: 'Advanced',
    badge: 'JPL DIRECTOR',
    tagline: 'No Auto-Fit shortcuts, sharper thermal swings & strict anomalies, +35% Career XP multiplier.',
    xpMultiplier: 1.35,
    allowAutoFit: false,
    showEngineeringHints: false,
    thermalLoadFactor: 1.28,
    anomalyPaceFactor: 1.15
  }
};

// -------------------------------------------------------------
// SUBSYSTEM SYNERGIES (Rewarding smart NASA engineering combinations)
// -------------------------------------------------------------
export interface SynergyCombo {
  id: string;
  title: string;
  bonusLabel: string;
  scanMultiplierBoost: number; // e.g., 0.2 = +20%
  explanation: string;
  check: (d: SpacecraftDesign) => boolean;
}

export const SYNERGY_COMBOS: SynergyCombo[] = [
  {
    id: 'syn-climate-twin',
    title: 'Multi-Band Earth Twin',
    bonusLabel: '+20% Scan Yield',
    scanMultiplierBoost: 0.2,
    explanation: 'Pairing Optical Imager + Microwave Radiometer penetrates cloud cover to measure moisture & thermal plumes simultaneously.',
    check: (d) =>
      d.instrumentIds.includes('inst-radiometer') &&
      (d.instrumentIds.includes('inst-multispectral') || d.instrumentIds.includes('inst-hyperspectral'))
  },
  {
    id: 'syn-artemis-ice',
    title: 'Artemis Volatile Hunter',
    bonusLabel: '+25% Polar Scan Yield',
    scanMultiplierBoost: 0.25,
    explanation: 'LIDAR laser topography pinpoints permanently shadowed crater floors while Neutron Spectroscopy detects subsurface hydrogen.',
    check: (d) =>
      d.instrumentIds.includes('inst-lunar-lidar') &&
      d.instrumentIds.includes('inst-neutron-spectrometer')
  },
  {
    id: 'syn-deep-field',
    title: 'Cryogenic Deep-Field Link',
    bonusLabel: '+25% Observatory Yield',
    scanMultiplierBoost: 0.25,
    explanation: 'Active thermal louvers stabilize optic mirrors while Optical Laser Downlink streams full high-bit-depth transit spectra.',
    check: (d) =>
      d.instrumentIds.includes('inst-space-telescope') &&
      d.thermalId === 'thm-active-heaters-louvers' &&
      d.commsId === 'comm-optical-laser'
  },
  {
    id: 'syn-edge-cloud',
    title: 'Autonomous Cloud Filter',
    bonusLabel: '-60% Data Bandwidth',
    scanMultiplierBoost: 0.12,
    explanation: 'Neuromorphic Edge AI rejects cloud-blocked frames onboard before transmission, maximizing ground pass efficiency.',
    check: (d) => d.obcId === 'obc-edge-ai-payload' && d.instrumentIds.length >= 1
  },
  {
    id: 'syn-rtg-night',
    title: 'Continuous Nuclear Power',
    bonusLabel: '100% Eclipse Immunity',
    scanMultiplierBoost: 0.1,
    explanation: 'Pu-238 Radioisotope Thermoelectric Generator delivers steady wattage across deep planetary shadows.',
    check: (d) => isNuclearRtgPower(d.powerGenId)
  }
];

export function evaluateSynergies(design: SpacecraftDesign): {
  active: SynergyCombo[];
  totalYieldMultiplier: number;
} {
  const active = SYNERGY_COMBOS.filter((s) => s.check(design));
  const totalYieldMultiplier = 1 + active.reduce((acc, s) => acc + s.scanMultiplierBoost, 0);
  return { active, totalYieldMultiplier };
}

// -------------------------------------------------------------
// VAB SUBSYSTEM EDUCATIONAL PRIMERS
// -------------------------------------------------------------
export interface TabGuide {
  title: string;
  principle: string;
  tradeOffTip: string;
}

export const TAB_EDUCATIONAL_GUIDES: Record<string, TabGuide> = {
  payload: {
    title: 'Why Payload Comes First',
    principle: 'Your instruments define everything downstream: every watt, kilogram, and Mbps you mount forces bigger buses, panels, and rockets.',
    tradeOffTip: 'Notice how mounting 2+ heavy instruments cascades cost into Structure, Power, ADCS, and Launch Vehicle.'
  },
  structure: {
    title: 'Spacecraft Bus & Structural Mass',
    principle: 'Aluminum honeycomb frames hold instruments under 6G launch vibration and carry mounting faces for solar wings and dishes.',
    tradeOffTip: 'Small CubeSats save dry mass and cost, but physically cannot carry heavy SAR radars or flagship optics.'
  },
  power: {
    title: 'Inverse-Square Solar Flux vs Nuclear RTGs',
    principle: 'Sunlight falls with 1/r² (43% at Mars, 3.7% at Europa, 1.1% at Titan) and drops to 0 W in eclipses—unless powered by Pu-238 RTGs.',
    tradeOffTip: 'Use Articulated/Mega Arrays for Mars/Psyche, or equip RTG / Quad-MMRTG for shadowed Moon, Europa & Saturnian worlds.'
  },
  battery: {
    title: 'Depth of Discharge (DoD)',
    principle: 'Li-ion cells lose cycle life rapidly if drained deep every 90-minute orbit. NASA caps routine LEO Depth-of-Discharge near 40–60%.',
    tradeOffTip: 'Higher eclipse duration or nighttime Overclocking demands larger Wh capacity.'
  },
  adcs: {
    title: 'Pointing Stability & Actuators',
    principle: 'Star trackers photograph constellations to steer within thousandths of a degree; magnetorquers push against Earth’s magnetic field.',
    tradeOffTip: 'Magnetorquers fail at the Moon or L2! Optical Laser Comms and Telescopes need ≤ ±0.005° precision.'
  },
  comms: {
    title: 'Link Budget & Antenna Gain',
    principle: 'Higher frequency dishes & lasers pack far more Mbps per pass, but narrow beams demand tighter attitude control.',
    tradeOffTip: 'If daily data GB exceeds ground-station pass capacity, onboard storage overflows unless Edge AI compresses data.'
  },
  avionics: {
    title: 'Radiation Hardening & Thermal Control',
    principle: 'Beyond LEO, solar storms flip bits in unshielded RAM (SEUs). Meanwhile electronics roast in sunlight and freeze in eclipse shadow.',
    tradeOffTip: 'Active louvers vent heat during Overclock bursts and keep optics stable inside 48m lunar nights.'
  },
  power_bus: {
    title: 'Frame Capacity, Solar Flux & Eclipse Batteries',
    principle: 'Match a Bus Frame heavy enough for your payload, size Solar or Pu-238 RTG power for your orbit sunlight %, and buffer eclipses cleanly.',
    tradeOffTip: 'Use Clipper Mega Solar or RTGs for Mars, Europa & Titan; step up to Heavy 1800 Wh battery for long eclipses.'
  },
  systems: {
    title: 'Pointing Stability, Downlink Dish, CPU & Cooling',
    principle: 'Star trackers steer lasers and telescopes to ±0.002°; Ka-Band or Laser Comms prevent storage bottlenecks; Active Louvers protect optics.',
    tradeOffTip: 'Magnetorquers fail outside Earth! Pair Reaction Wheels/Star Trackers for deep space.'
  },
  launch: {
    title: 'Destination Orbit & Rocket Lift Capacity',
    principle: 'Higher-energy orbits (GEO, Moon, Mars, Europa, Titan) slash booster lift capacity sharply under the Rocket Equation.',
    tradeOffTip: 'Keep spacecraft mass under the rocket cap or upgrade to Falcon 9 / ULA Vulcan Centaur.'
  },
  trajectory: {
    title: 'The Tyranny of the Rocket Equation',
    principle: 'Reaching higher energy orbits (SSO, GEO, Lunar Polar, L2) burns exponentially more propellant—sharply reducing rocket payload mass.',
    tradeOffTip: 'Always maintain ≥20% mass reserve above launch cutoff so slight design growth won’t ground the mission.'
  }
};

// -------------------------------------------------------------
// AEROSPACE FIELD GUIDE TOPICS
// -------------------------------------------------------------
export interface CodexTopic {
  id: string;
  title: string;
  tag: string;
  summary: string;
  equation: string;
  whyItMatters: string;
  realExample: string;
}

export const CODEX_TOPICS: CodexTopic[] = [
  {
    id: 'orbits',
    title: 'Keplerian Orbits & Eclipse Duty Cycles',
    tag: 'ORBITAL MECHANICS',
    summary:
      'Low orbits move fast (~7.7 km/s, ~93 min period) and duck into Earth’s shadow for ~36 min each lap. Distant L2 halo orbits receive continuous sunlight 24/7.',
    equation: 'T = 2π √(a³ / μ)   •   v = √(μ / r)',
    whyItMatters:
      'Every minute spent inside Earth/Moon shadow cuts solar power to 0W—forcing your battery and thermal heaters to carry the load.',
    realExample: 'Landsat 9 flies Sun-Synchronous Polar (700 km) so solar lighting angles stay identical year-round.'
  },
  {
    id: 'rockets',
    title: 'Tsiolkovsky Rocket Equation & Staging',
    tag: 'ASCENT & PROPULSION',
    summary:
      'Rockets must shed empty Stage 1 tanks at MECO and aerodynamic payload fairings above the atmosphere (~100 km) so upper stages aren’t accelerating dead steel.',
    equation: 'Δv = Isp · g₀ · ln(m₀ / m_f)',
    whyItMatters:
      'Throttling down around Max-Q (~25% ascent) protects the vehicle when atmospheric density × velocity² peaks.',
    realExample: 'Falcon 9 lifts 22,800 kg to LEO, yet only ~4,000 kg when pushing payloads past escape velocity toward L2.'
  },
  {
    id: 'power',
    title: 'Power Budgets & Battery Cycle Life',
    tag: 'EPS ENGINEERING',
    summary:
      'Size solar arrays for daylight instruments PLUS battery recharge. Size batteries from (Eclipse Watts × Eclipse Hours) ÷ Safe Depth-of-Discharge.',
    equation: 'DoD% = (P_eclipse · t_eclipse) / Capacity_Wh × 100',
    whyItMatters:
      'Deep >70% discharges ruin Li-ion chemistry inside months. RTGs generate steady Pu-238 heat power uninterrupted through shadow.',
    realExample: 'Curiosity & Perseverance rovers use MMRTGs so winter/night temperatures never freeze core avionics.'
  },
  {
    id: 'comms',
    title: 'ADCS Pointing, Thermal & Data Link Budgets',
    tag: 'GNC & COMMS',
    summary:
      'Sensors & laser terminals require sub-arcsecond pointing (star trackers), active louvers to dump waste heat, and high-gain dishes sized for ground-pass minutes.',
    equation: 'Capacity_GB = Mbps × Contacts × Pass_Min × 60 / 1000',
    whyItMatters:
      'Collecting 200 GB/day is wasted if your S-Band antenna only downlinks 2 GB during 8 daily ground passes.',
    realExample: 'JWST communicates from 1.5M km at L2 via NASA’s Deep Space Network with active sunshield thermal control.'
  },
  {
    id: 'cml',
    title: 'NASA Concept Maturity Levels (CML 1–6)',
    tag: 'SYSTEMS ENGINEERING',
    summary:
      'JPL & NASA Mission Design Labs advance concepts from Cocktail-Napkin Idea (CML 1) through Trade Space (CML 3), Preliminary Design (CML 5), to Flight-Ready (CML 6).',
    equation: 'Score = 0.40·Science + 0.25·Efficiency + 0.20·Reliability + 0.15·Budget',
    whyItMatters:
      'There is no single “correct” spacecraft—winning teams balance competing goals between Science ambition and mass/budget reality.',
    realExample: 'NASA’s Discovery & Explorer competitions evaluate cost realism and engineering margin just as strictly as instrument novelty.'
  }
];

// -------------------------------------------------------------
// CAREER RANKS & ACHIEVEMENTS
// -------------------------------------------------------------
export interface CareerStats {
  missionsCompleted: number;
  maxQMasteredCount: number;
  eclipseSurvivedCount: number;
  anomaliesSolvedCount: number;
  threeStarCount: number;
  highestGrade: string;
}

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  check: (stats: CareerStats, stars: Record<string, number>) => boolean;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: 'ach-first-light',
    title: 'First Light',
    desc: 'Complete any campaign or sandbox flight successfully',
    check: (s) => s.missionsCompleted >= 1
  },
  {
    id: 'ach-maxq-ace',
    title: 'Max-Q Throttle Ace',
    desc: 'Throttle cleanly through aerodynamic peak pressure',
    check: (s) => s.maxQMasteredCount >= 1
  },
  {
    id: 'ach-anomaly-hero',
    title: 'Steely-Eyed Missile Man',
    desc: 'Resolve 3+ live in-orbit NASA flight anomalies safely',
    check: (s) => s.anomaliesSolvedCount >= 3
  },
  {
    id: 'ach-grade-a',
    title: 'CDR Flight Certified',
    desc: 'Achieve an A or A+ rating (NASA CML 5–6)',
    check: (s) => s.highestGrade === 'A' || s.highestGrade === 'A+'
  },
  {
    id: 'ach-master-12',
    title: 'NASA Chief Architect',
    desc: 'Earn 24+ stars across the 10-Contract Career Starmap',
    check: (_, stars) => Object.values(stars).reduce((a, b) => a + b, 0) >= 24
  }
];

export function getCareerRank(totalXp: number): { title: string; nextXp: number | null } {
  if (totalXp >= 10000) return { title: 'JPL Chief Architect', nextXp: null };
  if (totalXp >= 6000) return { title: 'Flight Director', nextXp: 10000 };
  if (totalXp >= 3000) return { title: 'Lead Systems Engineer', nextXp: 6000 };
  if (totalXp >= 1200) return { title: 'Orbital Operations Officer', nextXp: 3000 };
  return { title: 'VAB Engineering Cadet', nextXp: 1200 };
}

// -------------------------------------------------------------
// TEAM CO-OP ROLE MAPPING
// -------------------------------------------------------------
export const TEAM_ROLE_TABS: Record<TeamRole, string[]> = {
  'Mission Planner': ['launch'],
  'Spacecraft Engineer': ['power_bus', 'systems'],
  'Science Lead': ['payload'],
  'Communications & Budget Lead': ['systems', 'launch']
};

export const TEAM_ROLE_GOALS: Record<TeamRole, string> = {
  'Mission Planner': 'Own Orbit & Launch Vehicle — ensure target inclination & ≥20% rocket mass margin.',
  'Spacecraft Engineer': 'Own Bus, Power, Battery, ADCS & Thermal — keep daylight power +20..+100W and safe DoD.',
  'Science Lead': 'Own Payload Instruments — maximize science domains & unlock hardware synergies!',
  'Communications & Budget Lead': 'Own Downlink Comms, OBC Buffer & Total Cost — avoid data bottlenecks and stay under cap.'
};

// -------------------------------------------------------------
// SHAREABLE DESIGN CODE (MA1:...)
// -------------------------------------------------------------
export function encodeDesignCode(design: SpacecraftDesign): string {
  const json = JSON.stringify(design);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return `MA1:${btoa(bin)}`;
}

export function decodeDesignCode(code: string): SpacecraftDesign | null {
  try {
    const trimmed = code.trim();
    const b64 = trimmed.startsWith('MA1:') ? trimmed.slice(4) : trimmed;
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (
      parsed &&
      typeof parsed.name === 'string' &&
      typeof parsed.scenarioId === 'string' &&
      typeof parsed.orbitId === 'string' &&
      Array.isArray(parsed.instrumentIds)
    ) {
      return parsed as SpacecraftDesign;
    }
    return null;
  } catch {
    return null;
  }
}
