import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  SpacecraftDesign,
  ResourceBudget,
  Orbit,
  Scenario,
  Instrument,
  PowerGenSubsystem,
  CommsSubsystem,
  ObcSubsystem,
  MissionEvent,
  CelestialBodyId,
  generateMissionTimelineEvents,
  isNuclearRtgPower
} from '@sim/index';
import { OrbitalMotionRefState, OrbitalGameplayState } from '../3d/GameCanvas3D';
import { sound } from '../../utils/soundEngine';
import { triggerConfetti } from '../../utils/confetti';
import { NasaCrest } from '../common/NasaCrest';
import { evaluateSynergies, DIFFICULTY_PROFILES, AssistDifficulty } from '../../game/knowledge';
import {
  Radio,
  AlertTriangle,
  Award,
  Sparkles,
  Camera,
  CheckCircle,
  Star,
  Thermometer
} from 'lucide-react';

interface WorldTarget {
  id: string;
  name: string;
  category: string;
  rewardScience: number;
  dataSizeGb: number;
  phaseAngleRad: number;
  crossTrackDeg: number;
  remainingSeconds: number;
  maxSeconds: number;
  matchInstIds: string[];
}

interface GroundStationNode {
  id: string;
  name: string;
  phaseAngleRad: number;
  crossTrackDeg: number;
}

interface OrbitalCommandProps {
  design: SpacecraftDesign;
  budget: ResourceBudget;
  orbit: Orbit;
  scenario: Scenario;
  selectedInstruments: Instrument[];
  powerGen: PowerGenSubsystem;
  comms: CommsSubsystem;
  obc: ObcSubsystem;
  targetSciencePoints: number;
  flightBonusXp: number;
  assistDifficulty?: AssistDifficulty;
  camFocus: 'satellite' | 'global';
  onChangeCamFocus: (focus: 'satellite' | 'global') => void;
  orbitalMotionRef: React.MutableRefObject<OrbitalMotionRefState>;
  onOrbitalGameplayChange: (state: OrbitalGameplayState | undefined) => void;
  targetClickHandlerRef?: React.MutableRefObject<((id: string) => void) | null>;
  downlinkClickHandlerRef?: React.MutableRefObject<(() => void) | null>;
  onMissionAccomplished: (
    finalScienceXp: number,
    resolvedEvents: MissionEvent[],
    opsMeta: {
      anomaliesSolved: number;
      eclipseSurvived: boolean;
      markersAnalyzed: number;
      markersTransmitted: number;
      totalMarkers: number;
    }
  ) => void;
  onReturnToHangar: () => void;
  onTriggerScanEffect: (active: boolean) => void;
  onTriggerDownlinkEffect: (active: boolean) => void;
  onEclipseChange?: (eclipse: boolean) => void;
  onTutorialScanDone?: () => void;
  onTutorialDownlinkDone?: () => void;
  onOpenTutorial?: () => void;
}

type PowerMode = 'ECO' | 'NOMINAL' | 'OVERCLOCK';

function wrapAngleRad(diff: number): number {
  let d = diff % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

type TargetTemplate = Omit<
  WorldTarget,
  'id' | 'phaseAngleRad' | 'crossTrackDeg' | 'remainingSeconds' | 'maxSeconds'
>;

const TARGET_TEMPLATES_BY_BODY: Record<CelestialBodyId, TargetTemplate[]> = {
  moon: [
    {
      name: 'Shackleton Crater Ice',
      category: 'LUNAR PSR',
      rewardScience: 290,
      dataSizeGb: 18,
      matchInstIds: ['inst-lunar-lidar', 'inst-neutron-spectrometer']
    },
    {
      name: 'Artemis Landing Recon',
      category: 'TOPOGRAPHY',
      rewardScience: 260,
      dataSizeGb: 24,
      matchInstIds: ['inst-lunar-lidar']
    },
    {
      name: 'Regolith Hydrogen Core',
      category: 'SPECTROSCOPY',
      rewardScience: 240,
      dataSizeGb: 12,
      matchInstIds: ['inst-neutron-spectrometer']
    },
    {
      name: 'Marius Lava Tube Rim',
      category: 'GEOLOGY',
      rewardScience: 310,
      dataSizeGb: 28,
      matchInstIds: ['inst-lunar-lidar', 'inst-sar-radar']
    }
  ],
  mars: [
    {
      name: 'Jezero Paleolake Delta',
      category: 'ASTROBIOLOGY',
      rewardScience: 320,
      dataSizeGb: 24,
      matchInstIds: ['inst-multispectral', 'inst-hyperspectral']
    },
    {
      name: 'Valles Marineris Fault',
      category: 'TECTONICS',
      rewardScience: 340,
      dataSizeGb: 28,
      matchInstIds: ['inst-sar-radar', 'inst-lunar-lidar']
    },
    {
      name: 'Olympus Mons Caldera',
      category: 'VOLCANISM',
      rewardScience: 300,
      dataSizeGb: 22,
      matchInstIds: ['inst-multispectral', 'inst-radiometer']
    },
    {
      name: 'South Polar Ice Aquifer',
      category: 'WATER ICE',
      rewardScience: 360,
      dataSizeGb: 30,
      matchInstIds: ['inst-sar-radar', 'inst-neutron-spectrometer']
    }
  ],
  venus: [
    {
      name: 'Maxwell Montes Shield',
      category: 'RADAR MAPPING',
      rewardScience: 350,
      dataSizeGb: 34,
      matchInstIds: ['inst-sar-radar']
    },
    {
      name: 'Sulfuric Cloud Vortex',
      category: 'ATMOSPHERE',
      rewardScience: 290,
      dataSizeGb: 22,
      matchInstIds: ['inst-radiometer', 'inst-hyperspectral']
    },
    {
      name: 'Maat Mons Rift Plume',
      category: 'VOLCANISM',
      rewardScience: 330,
      dataSizeGb: 26,
      matchInstIds: ['inst-sar-radar', 'inst-hyperspectral']
    },
    {
      name: 'D/H Upper Cloud Isotopes',
      category: 'SPECTROSCOPY',
      rewardScience: 310,
      dataSizeGb: 20,
      matchInstIds: ['inst-hyperspectral', 'inst-radiometer']
    }
  ],
  europa: [
    {
      name: 'Thera Macula Chaos Ice',
      category: 'ICE TECTONICS',
      rewardScience: 380,
      dataSizeGb: 28,
      matchInstIds: ['inst-sar-radar', 'inst-lunar-lidar']
    },
    {
      name: 'Ocean Induced B-Field',
      category: 'OCEAN DEPTH',
      rewardScience: 360,
      dataSizeGb: 14,
      matchInstIds: ['inst-magnetometer-boom']
    },
    {
      name: 'Europa Water Plume Vent',
      category: 'ASTROBIOLOGY',
      rewardScience: 410,
      dataSizeGb: 32,
      matchInstIds: ['inst-hyperspectral', 'inst-neutron-spectrometer']
    },
    {
      name: 'Conamara Brine Lineae',
      category: 'GEOCHEMISTRY',
      rewardScience: 340,
      dataSizeGb: 24,
      matchInstIds: ['inst-multispectral', 'inst-hyperspectral']
    }
  ],
  titan: [
    {
      name: 'Kraken Mare Hydrocarbon Sea',
      category: 'LIQUID SEAS',
      rewardScience: 400,
      dataSizeGb: 36,
      matchInstIds: ['inst-sar-radar']
    },
    {
      name: 'Organic Tholin Sand Dunes',
      category: 'PREBIOTIC CHEM',
      rewardScience: 350,
      dataSizeGb: 24,
      matchInstIds: ['inst-hyperspectral', 'inst-radiometer']
    },
    {
      name: 'Doom Mons Cryovolcano',
      category: 'GEOPHYSICS',
      rewardScience: 370,
      dataSizeGb: 28,
      matchInstIds: ['inst-sar-radar', 'inst-lunar-lidar']
    },
    {
      name: 'Saturn Plasma Interaction',
      category: 'MAGNETOSPHERE',
      rewardScience: 320,
      dataSizeGb: 16,
      matchInstIds: ['inst-magnetometer-boom']
    }
  ],
  asteroid: [
    {
      name: 'Exposed Iron-Nickel Core',
      category: 'CORE GEOLOGY',
      rewardScience: 390,
      dataSizeGb: 20,
      matchInstIds: ['inst-magnetometer-boom', 'inst-neutron-spectrometer']
    },
    {
      name: 'Psyche Gravity Anomaly',
      category: 'INTERIOR MASS',
      rewardScience: 340,
      dataSizeGb: 16,
      matchInstIds: ['inst-lunar-lidar', 'inst-multispectral']
    },
    {
      name: 'Silicate Crater Rim',
      category: 'MINERALOGY',
      rewardScience: 330,
      dataSizeGb: 24,
      matchInstIds: ['inst-hyperspectral', 'inst-multispectral']
    },
    {
      name: 'Solar Wind Metal Sputter',
      category: 'SPACE WX',
      rewardScience: 310,
      dataSizeGb: 14,
      matchInstIds: ['inst-magnetometer-boom', 'inst-neutron-spectrometer']
    }
  ],
  lagrange: [
    {
      name: 'TRAPPIST-1e Transit',
      category: 'EXOPLANET',
      rewardScience: 380,
      dataSizeGb: 26,
      matchInstIds: ['inst-space-telescope']
    },
    {
      name: 'Supernova Shock UV',
      category: 'ASTROPHYSICS',
      rewardScience: 340,
      dataSizeGb: 32,
      matchInstIds: ['inst-space-telescope']
    },
    {
      name: 'Solar Wind Mag Pulse',
      category: 'SPACE WX',
      rewardScience: 250,
      dataSizeGb: 10,
      matchInstIds: ['inst-magnetometer-boom']
    },
    {
      name: 'Protoplanetary IR Dust',
      category: 'COSMOLOGY',
      rewardScience: 360,
      dataSizeGb: 28,
      matchInstIds: ['inst-space-telescope', 'inst-hyperspectral']
    }
  ],
  earth: [
    {
      name: 'Amazon Thermal Front',
      category: 'DISASTER',
      rewardScience: 250,
      dataSizeGb: 22,
      matchInstIds: ['inst-multispectral', 'inst-hyperspectral']
    },
    {
      name: 'Cat-5 Hurricane Eye',
      category: 'ATMOSPHERE',
      rewardScience: 290,
      dataSizeGb: 26,
      matchInstIds: ['inst-radiometer', 'inst-sar-radar']
    },
    {
      name: 'Arctic Ice Calving',
      category: 'CRYOSPHERE',
      rewardScience: 310,
      dataSizeGb: 34,
      matchInstIds: ['inst-sar-radar', 'inst-multispectral']
    },
    {
      name: 'Methane Plume Spike',
      category: 'CLIMATE',
      rewardScience: 330,
      dataSizeGb: 30,
      matchInstIds: ['inst-hyperspectral', 'inst-radiometer']
    },
    {
      name: 'Coastal Algae Bloom',
      category: 'OCEAN',
      rewardScience: 240,
      dataSizeGb: 20,
      matchInstIds: ['inst-multispectral', 'inst-hyperspectral']
    }
  ]
};

function buildTargetTemplates(orbit: Orbit) {
  return TARGET_TEMPLATES_BY_BODY[orbit.centralBody] || TARGET_TEMPLATES_BY_BODY.earth;
}

function buildGroundStations(orbit: Orbit): GroundStationNode[] {
  const isDeepSpace = orbit.centralBody !== 'earth' && orbit.centralBody !== 'moon';
  if (isDeepSpace) {
    return [
      { id: 'gs-goldstone', name: 'GOLDSTONE DSN', phaseAngleRad: 1.75, crossTrackDeg: 0 },
      { id: 'gs-madrid', name: 'MADRID DSN', phaseAngleRad: 3.55, crossTrackDeg: 0 },
      { id: 'gs-canberra', name: 'CANBERRA DSN', phaseAngleRad: 5.85, crossTrackDeg: 0 }
    ];
  }
  return [
    { id: 'gs-wallops', name: 'WALLOPS USA', phaseAngleRad: 1.75, crossTrackDeg: 2 },
    { id: 'gs-svalbard', name: 'SVALBARD ARCTIC', phaseAngleRad: 3.55, crossTrackDeg: -4 },
    { id: 'gs-canberra', name: 'CANBERRA AUS', phaseAngleRad: 5.85, crossTrackDeg: 4 }
  ];
}

export const OrbitalCommand: React.FC<OrbitalCommandProps> = ({
  design,
  budget,
  orbit,
  selectedInstruments,
  powerGen,
  comms,
  obc,
  targetSciencePoints,
  flightBonusXp,
  assistDifficulty = 'Intermediate',
  camFocus,
  onChangeCamFocus,
  orbitalMotionRef,
  onOrbitalGameplayChange,
  targetClickHandlerRef,
  downlinkClickHandlerRef,
  onMissionAccomplished,
  onReturnToHangar,
  onTriggerScanEffect,
  onTriggerDownlinkEffect,
  onEclipseChange,
  onTutorialScanDone,
  onTutorialDownlinkDone,
  onOpenTutorial
}) => {
  const diffProfile = DIFFICULTY_PROFILES[assistDifficulty];
  const synergies = useMemo(() => evaluateSynergies(design), [design]);
  const targetTemplates = useMemo(() => buildTargetTemplates(orbit), [orbit]);
  const groundStations = useMemo(() => buildGroundStations(orbit), [orbit]);
  const initialTimelineEvents = useMemo(
    () => generateMissionTimelineEvents(design, budget, orbit),
    [design, budget, orbit]
  );

  const TOTAL_MARKERS = 4;
  const [sciencePoints, setSciencePoints] = useState(Math.round(flightBonusXp * 0.2));
  const [bufferGb, setBufferGb] = useState(0);
  const [queuedPackets, setQueuedPackets] = useState(0);
  const [analyzedCount, setAnalyzedCount] = useState(0);
  const [transmittedCount, setTransmittedCount] = useState(0);
  const [earthRelayDone, setEarthRelayDone] = useState(false);
  const [comboMultiplier, setComboMultiplier] = useState(1.0);
  const [batteryPct, setBatteryPct] = useState(100);
  const [spacecraftTempC, setSpacecraftTempC] = useState(22);
  const [powerMode, setPowerMode] = useState<PowerMode>('NOMINAL');
  const [isEclipse, setIsEclipse] = useState(false);
  const [anomaliesSolved, setAnomaliesSolved] = useState(0);
  const [slewDeg, setSlewDeg] = useState(0);
  const [orbitAngleUi, setOrbitAngleUi] = useState(0.15);
  const [isScanningNow, setIsScanningNow] = useState(false);
  const [isDownlinkActive, setIsDownlinkActive] = useState(false);
  const [scanningTargetPos, setScanningTargetPos] = useState<{ phaseAngleRad: number; crossTrackDeg: number } | null>(
    null
  );
  const [callout, setCallout] = useState<string | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<MissionEvent[]>(initialTimelineEvents);
  const [activeAnomaly, setActiveAnomaly] = useState<MissionEvent | null>(null);

  // Finite set of 4 curated analysis markers spaced clearly around the orbit (no endless respawn)
  const [targets, setTargets] = useState<WorldTarget[]>(() =>
    [0, 1, 2, 3].map((idx) => {
      const tpl = targetTemplates[idx % targetTemplates.length];
      return {
        ...tpl,
        id: `tgt-marker-${idx + 1}`,
        phaseAngleRad: [0.95, 2.35, 3.85, 5.25][idx],
        crossTrackDeg: [-14, 15, -18, 12][idx],
        remainingSeconds: 999,
        maxSeconds: 999
      };
    })
  );

  const keysRef = useRef({ left: false, right: false, up: false, down: false });
  const comboDecayRef = useRef(0);
  const triggeredAnomaliesRef = useRef<Set<string>>(new Set());
  const eclipseSurvivedRef = useRef(orbit.eclipseMinutes === 0);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const downlinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sciencePointsRef = useRef(sciencePoints);
  sciencePointsRef.current = sciencePoints;
  const bufferGbRef = useRef(0);
  const queuedPacketsRef = useRef(0);
  const transmittedCountRef = useRef(0);
  const analyzedCountRef = useRef(0);
  const earthRelayDoneRef = useRef(false);
  const isScanningRef = useRef(false);
  const isDownlinkingRef = useRef(false);
  const hasPendingUploadRef = useRef(false);
  const scannedTargetIdsRef = useRef<Set<string>>(new Set());
  const timelineEventsRef = useRef(timelineEvents);
  timelineEventsRef.current = timelineEvents;
  const anomaliesSolvedRef = useRef(anomaliesSolved);
  anomaliesSolvedRef.current = anomaliesSolved;
  const onMissionAccomplishedRef = useRef(onMissionAccomplished);
  onMissionAccomplishedRef.current = onMissionAccomplished;

  const hasPendingUpload = queuedPackets > 0 || bufferGb > 0.1 || analyzedCount > transmittedCount;

  const isRtg = isNuclearRtgPower(powerGen.id);
  const hasEdgeAi = obc.id === 'obc-edge-ai-payload';
  const hasRadHard = obc.id === 'obc-radhard-fpga';
  const hasActiveThermal = design.thermalId === 'thm-active-heaters-louvers';
  const maxStorageGb = obc.storageGb;
  const star1Target = targetSciencePoints;
  const star2Target = Math.round(targetSciencePoints * 1.45);
  const star3Target = Math.round(targetSciencePoints * 2.0);
  const currentStars = sciencePoints >= star3Target ? 3 : sciencePoints >= star2Target ? 2 : sciencePoints >= star1Target ? 1 : 0;

  const isOverheated = spacecraftTempC >= 75;
  const isColdSoaked = spacecraftTempC <= -18;
  const thermalThrottlePenalty = isOverheated || isColdSoaked ? 0.68 : 1.0;

  // Initialize motion ref cleanly at entry
  useEffect(() => {
    orbitalMotionRef.current = { orbitAngleRad: 0.15, slewDeg: 0, thrusting: 0 };
    return () => {
      onOrbitalGameplayChange(undefined);
      onTriggerScanEffect(false);
      onTriggerDownlinkEffect(false);
      onEclipseChange?.(false);
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
      if (downlinkTimeoutRef.current) clearTimeout(downlinkTimeoutRef.current);
      if (completionTimeoutRef.current) clearTimeout(completionTimeoutRef.current);
    };
  }, [orbitalMotionRef, onOrbitalGameplayChange, onTriggerScanEffect, onTriggerDownlinkEffect, onEclipseChange]);

  useEffect(() => {
    if (!callout) return;
    const t = setTimeout(() => setCallout(null), 1850);
    return () => clearTimeout(t);
  }, [callout]);

  // Compute Locked Targets & In-Range Ground Station Cone
  const lockedTarget = useMemo(() => {
    if (earthRelayDone || isScanningNow || isDownlinkActive || hasPendingUpload) {
      return null;
    }
    let best: WorldTarget | null = null;
    let bestDist = Infinity;
    for (const t of targets) {
      const angDiff = Math.abs(wrapAngleRad(orbitalMotionRef.current.orbitAngleRad - t.phaseAngleRad));
      const crossDiff = Math.abs(slewDeg - t.crossTrackDeg);
      if (angDiff <= 0.42 && crossDiff <= 15.0) {
        const d = angDiff * 25 + crossDiff;
        if (d < bestDist) {
          bestDist = d;
          best = t;
        }
      }
    }
    return best;
  }, [targets, slewDeg, orbitAngleUi, orbitalMotionRef, earthRelayDone, isScanningNow, isDownlinkActive, hasPendingUpload]);

  const inRangeStation = useMemo(() => {
    const continuousEarthLink = orbit.id === 'orbit-geo-35786' || orbit.centralBody === 'lagrange';
    const rangeRad = continuousEarthLink ? Math.PI : 0.58;
    for (const gs of groundStations) {
      if (Math.abs(wrapAngleRad(orbitalMotionRef.current.orbitAngleRad - gs.phaseAngleRad)) <= rangeRad) {
        return gs;
      }
    }
    return null;
  }, [groundStations, orbit.id, orbit.centralBody, orbitAngleUi, orbitalMotionRef]);

  const inRangeStationRef = useRef(inRangeStation);
  inRangeStationRef.current = inRangeStation;

  // Sync live 3D beacons & ground cones to GameCanvas3D
  useEffect(() => {
    const instIds = selectedInstruments.map((i) => i.id);
    const continuousEarthLink = orbit.id === 'orbit-geo-35786' || orbit.centralBody === 'lagrange';
    const rangeRad = continuousEarthLink ? Math.PI : 0.58;
    const curAngle = orbitalMotionRef.current.orbitAngleRad;

    onOrbitalGameplayChange({
      targets: targets.map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        phaseAngleRad: t.phaseAngleRad,
        crossTrackDeg: t.crossTrackDeg,
        isMatch: t.matchInstIds.some((id) => instIds.includes(id)),
        isLocked: lockedTarget?.id === t.id,
        urgencyPct: 100
      })),
      groundStations: groundStations.map((gs) => ({
        id: gs.id,
        name: gs.name,
        phaseAngleRad: gs.phaseAngleRad,
        crossTrackDeg: gs.crossTrackDeg,
        inRange: Math.abs(wrapAngleRad(curAngle - gs.phaseAngleRad)) <= rangeRad
      })),
      scanningTargetPos,
      downlinkingStationPos: isDownlinkActive && inRangeStation ? inRangeStation : null
    });
  }, [
    targets,
    groundStations,
    lockedTarget,
    scanningTargetPos,
    isDownlinkActive,
    inRangeStation,
    selectedInstruments,
    orbit.id,
    orbit.centralBody,
    orbitalMotionRef,
    onOrbitalGameplayChange
  ]);

  // 60fps Continuous Spacecraft Navigation Loop (WASD / Arrows + Slewing!)
  useEffect(() => {
    let rafId = 0;
    let last = performance.now();
    let hudAccum = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const motion = orbitalMotionRef.current;
      const baseOmega = orbit.centralBody === 'lagrange' ? 0.24 : orbit.id === 'orbit-geo-35786' ? 0.28 : 0.42;
      const thrustMult = keysRef.current.up ? 2.0 : keysRef.current.down ? 0.35 : 1.0;
      const thrustVal = keysRef.current.up ? 1 : keysRef.current.down ? -1 : 0;

      motion.orbitAngleRad = (motion.orbitAngleRad + baseOmega * thrustMult * dt) % (Math.PI * 2);
      motion.thrusting = thrustVal;

      if (keysRef.current.left) {
        motion.slewDeg = Math.max(-26, motion.slewDeg - 44 * dt);
      }
      if (keysRef.current.right) {
        motion.slewDeg = Math.min(26, motion.slewDeg + 44 * dt);
      }

      hudAccum += dt;
      if (hudAccum >= 0.06) {
        hudAccum = 0;
        setSlewDeg(Math.round(motion.slewDeg));
        setOrbitAngleUi(motion.orbitAngleRad);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [orbit.centralBody, orbit.id, orbitalMotionRef]);

  // Eclipse Cycle
  useEffect(() => {
    if (orbit.eclipseMinutes === 0) {
      setIsEclipse(false);
      onEclipseChange?.(false);
      return;
    }
    const sunMs = 15000;
    const eclMs = Math.max(7000, Math.round(24000 * orbit.eclipseFraction));
    let timeoutId: ReturnType<typeof setTimeout>;
    const toggle = (currentlyEclipse: boolean) => {
      timeoutId = setTimeout(() => {
        const next = !currentlyEclipse;
        if (!next) eclipseSurvivedRef.current = true;
        setIsEclipse(next);
        onEclipseChange?.(next);
        if (next) sound.playAlarm();
        toggle(next);
      }, currentlyEclipse ? eclMs : sunMs);
    };
    toggle(false);
    return () => clearTimeout(timeoutId);
  }, [orbit.eclipseMinutes, orbit.eclipseFraction, onEclipseChange]);

  // 1s Simulation Loop (Battery, Thermal, Combo, Target Replenish)
  useEffect(() => {
    const timer = setInterval(() => {
      setBatteryPct((prev) => {
        const capScale = Math.max(150, budget.batteryCapacityWh) / 600;
        const modeMult = powerMode === 'OVERCLOCK' ? 1.5 : powerMode === 'ECO' ? 0.45 : 1.0;
        const thrustDrain = orbitalMotionRef.current.thrusting !== 0 ? 0.8 : 0;
        if (isEclipse) {
          if (isRtg) return Math.min(100, prev + 1.5);
          const drain = (3.3 / Math.sqrt(capScale)) * modeMult + thrustDrain;
          return Math.max(5, Number((prev - drain).toFixed(1)));
        }
        const surplus = Math.max(0.4, (budget.daylightPowerBalanceW + 60) / 140);
        const charge = (5.2 * surplus) / Math.sqrt(capScale) - thrustDrain;
        return Math.max(5, Math.min(100, Number((prev + charge).toFixed(1))));
      });

      setSpacecraftTempC((prev) => {
        const pace = diffProfile.thermalLoadFactor;
        let nextTemp = prev;
        if (powerMode === 'OVERCLOCK') {
          nextTemp += (hasActiveThermal ? 1.4 : 3.6) * pace;
        } else if (isEclipse && !isRtg) {
          nextTemp -= (hasActiveThermal ? 0.5 : 2.3) * pace;
        } else if (powerMode === 'ECO') {
          nextTemp += (22 - prev) * (hasActiveThermal ? 0.28 : 0.16);
        } else {
          const targetNominal = isEclipse ? 14 : 32;
          nextTemp += (targetNominal - prev) * (hasActiveThermal ? 0.25 : 0.12);
        }
        return Math.max(-35, Math.min(92, Math.round(nextTemp)));
      });

      if (comboDecayRef.current <= 1) {
        comboDecayRef.current = 0;
        setComboMultiplier(1.0);
      } else {
        comboDecayRef.current -= 1;
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    isEclipse,
    isRtg,
    hasActiveThermal,
    powerMode,
    budget.batteryCapacityWh,
    budget.daylightPowerBalanceW,
    diffProfile.thermalLoadFactor,
    orbitalMotionRef
  ]);

  // Anomaly Gates (Non-Blocking Top Tactical Strip!)
  useEffect(() => {
    if (activeAnomaly) return;
    const progressPct = (sciencePoints / star1Target) * 100;
    const choiceEvents = timelineEvents.filter((e) => !e.resolved && e.choice);
    const nextGate = anomaliesSolved === 0 ? 35 : 70;
    if (progressPct >= nextGate && choiceEvents.length > 0) {
      const nextEvt = choiceEvents[0];
      if (!triggeredAnomaliesRef.current.has(nextEvt.id)) {
        triggeredAnomaliesRef.current.add(nextEvt.id);
        sound.playAlarm();
        setActiveAnomaly(nextEvt);
      }
    }
  }, [sciencePoints, star1Target, timelineEvents, activeAnomaly, anomaliesSolved]);

  const showUploadRequiredCallout = useCallback(() => {
    sound.playAlarm();
    setCallout(
      isDownlinkingRef.current
        ? 'UPLOAD IN PROGRESS — WAIT FOR EARTH LINK'
        : inRangeStationRef.current
        ? 'UPLOAD SCANNED DATA FIRST — PRESS [E] TO SEND TO EARTH'
        : 'UPLOAD SCANNED DATA FIRST — ENTER GREEN CONE & PRESS [E]'
    );
  }, []);

  const isUploadRequiredNow = useCallback(() => {
    return (
      hasPendingUploadRef.current ||
      queuedPacketsRef.current > 0 ||
      bufferGbRef.current > 0.1 ||
      analyzedCountRef.current > transmittedCountRef.current
    );
  }, []);

  const executeScan = useCallback(
    (target: WorldTarget) => {
      if (earthRelayDoneRef.current || isScanningRef.current) return;

      if (isDownlinkingRef.current || isUploadRequiredNow()) {
        showUploadRequiredCallout();
        return;
      }

      if (scannedTargetIdsRef.current.has(target.id)) return;

      if (batteryPct < 10) {
        sound.playAlarm();
        setCallout('LOW BATTERY — SWITCH ECO');
        return;
      }

      if (bufferGbRef.current >= maxStorageGb) {
        showUploadRequiredCallout();
        return;
      }

      const instIds = selectedInstruments.map((i) => i.id);
      const isMatch = target.matchInstIds.some((id) => instIds.includes(id));
      const matchMult = isMatch ? 1.35 : 1.0;
      const modeMult = powerMode === 'OVERCLOCK' ? 1.45 : powerMode === 'ECO' ? 0.7 : 1.0;
      const aiBonus = hasEdgeAi ? 1.15 : 1.0;
      const nextCombo = Math.min(3.5, Number((comboMultiplier + 0.25).toFixed(2)));

      const earnedPts = Math.round(
        target.rewardScience *
          matchMult *
          synergies.totalYieldMultiplier *
          modeMult *
          aiBonus *
          diffProfile.xpMultiplier *
          thermalThrottlePenalty *
          comboMultiplier
      );

      const rawGb = target.dataSizeGb * (hasEdgeAi ? 0.4 : 1.0);
      const scanMs = powerMode === 'OVERCLOCK' ? 480 : powerMode === 'ECO' ? 820 : 620;
      const batteryCost = powerMode === 'OVERCLOCK' ? 6.0 : powerMode === 'ECO' ? 2.0 : 3.8;

      isScanningRef.current = true;
      scannedTargetIdsRef.current.add(target.id);
      sound.playScanSweep();
      setIsScanningNow(true);
      onTriggerScanEffect(true);
      setScanningTargetPos({ phaseAngleRad: target.phaseAngleRad, crossTrackDeg: target.crossTrackDeg });
      setBatteryPct((prev) => Math.max(5, Number((prev - batteryCost).toFixed(1))));
      setTargets((prev) => prev.filter((t) => t.id !== target.id));

      scanTimeoutRef.current = setTimeout(() => {
        const nextBufferGb = Math.min(maxStorageGb, Number((bufferGbRef.current + rawGb).toFixed(1)));
        const nextAnalyzed = Math.min(TOTAL_MARKERS, analyzedCountRef.current + 1);
        const nextQueued = queuedPacketsRef.current + 1;

        isScanningRef.current = false;
        hasPendingUploadRef.current = true;
        bufferGbRef.current = nextBufferGb;
        analyzedCountRef.current = nextAnalyzed;
        queuedPacketsRef.current = nextQueued;

        onTriggerScanEffect(false);
        setIsScanningNow(false);
        setScanningTargetPos(null);
        setSciencePoints((prev) => prev + earnedPts);
        setBufferGb(nextBufferGb);
        setAnalyzedCount(nextAnalyzed);
        setQueuedPackets(nextQueued);
        setComboMultiplier(nextCombo);
        comboDecayRef.current = 12;
        sound.playComboChime(nextCombo);
        setCallout(`ANALYZED ${target.name.toUpperCase()}: +${earnedPts} XP${isMatch ? ' (SENSOR MATCH!)' : ''} — UPLOAD [E]`);
        onTutorialScanDone?.();
      }, scanMs);
    },
    [
      batteryPct,
      selectedInstruments,
      powerMode,
      hasEdgeAi,
      maxStorageGb,
      comboMultiplier,
      synergies.totalYieldMultiplier,
      diffProfile.xpMultiplier,
      thermalThrottlePenalty,
      onTriggerScanEffect,
      onTutorialScanDone,
      isUploadRequiredNow,
      showUploadRequiredCallout
    ]
  );

  const executeDownlink = useCallback(() => {
    if (earthRelayDoneRef.current || isDownlinkingRef.current) return;

    if (isScanningRef.current) {
      sound.playAlarm();
      setCallout('SCAN IN PROGRESS — WAIT FOR SCAN TO FINISH');
      return;
    }

    if (!isUploadRequiredNow()) {
      return;
    }

    if (!inRangeStationRef.current) {
      sound.playAlarm();
      setCallout('ENTER GREEN EARTH CONE TO UPLOAD [E]');
      return;
    }

    isDownlinkingRef.current = true;
    sound.playDownlinkPing();
    setIsDownlinkActive(true);
    onTriggerDownlinkEffect(true);

    const packetsToSend = Math.max(1, queuedPacketsRef.current);
    const payloadGb = Math.max(12, bufferGbRef.current);
    const rateFactor = Math.min(2.2, Math.max(0.75, Math.log10(comms.downlinkRateMbps + 1) * 0.75));
    const durationMs = comms.downlinkRateMbps >= 200 ? 600 : comms.downlinkRateMbps >= 25 ? 950 : 1350;
    const bonusXp = Math.round(payloadGb * 6.5 * rateFactor * diffProfile.xpMultiplier * comboMultiplier);

    downlinkTimeoutRef.current = setTimeout(() => {
      const nextTransmitted = Math.min(TOTAL_MARKERS, transmittedCountRef.current + packetsToSend);
      const isFinalRelay =
        analyzedCountRef.current >= TOTAL_MARKERS && nextTransmitted >= TOTAL_MARKERS;

      isDownlinkingRef.current = false;
      hasPendingUploadRef.current = false;
      bufferGbRef.current = 0;
      queuedPacketsRef.current = 0;
      transmittedCountRef.current = nextTransmitted;
      if (isFinalRelay) earthRelayDoneRef.current = true;

      setIsDownlinkActive(false);
      onTriggerDownlinkEffect(false);
      setBufferGb(0);
      setQueuedPackets(0);
      setTransmittedCount(nextTransmitted);

      const completionBonus = isFinalRelay ? Math.max(250, Math.round(star1Target * 0.25)) : 0;
      const finalXp = sciencePointsRef.current + bonusXp + completionBonus;

      setSciencePoints(finalXp);
      comboDecayRef.current = 12;
      onTutorialDownlinkDone?.();

      if (isFinalRelay) {
        setEarthRelayDone(true);
        sound.playVictory();
        triggerConfetti();
        setCallout(`ALL ${TOTAL_MARKERS}/${TOTAL_MARKERS} MARKERS RECEIVED BY EARTH!`);
        completionTimeoutRef.current = setTimeout(() => {
          onMissionAccomplishedRef.current(finalXp, timelineEventsRef.current, {
            anomaliesSolved: anomaliesSolvedRef.current,
            eclipseSurvived: eclipseSurvivedRef.current,
            markersAnalyzed: TOTAL_MARKERS,
            markersTransmitted: TOTAL_MARKERS,
            totalMarkers: TOTAL_MARKERS
          });
        }, 1150);
      } else {
        sound.playComboChime(comboMultiplier + 0.5);
        setCallout(
          `UPLOADED ${nextTransmitted}/${TOTAL_MARKERS} (${payloadGb.toFixed(0)} GB) → +${bonusXp} XP — READY FOR NEXT SCAN`
        );
      }
    }, durationMs);
  }, [
    comms.downlinkRateMbps,
    diffProfile.xpMultiplier,
    comboMultiplier,
    star1Target,
    onTriggerDownlinkEffect,
    onTutorialDownlinkDone,
    isUploadRequiredNow
  ]);

  // Register 3D direct click handlers so clicking a glowing beacon in Earth space scans it immediately!
  useEffect(() => {
    if (targetClickHandlerRef) {
      targetClickHandlerRef.current = (targetId: string) => {
        const hit = targets.find((t) => t.id === targetId);
        if (hit) {
          if (!isScanningRef.current && !isDownlinkingRef.current && !isUploadRequiredNow()) {
            orbitalMotionRef.current.slewDeg = Math.max(-26, Math.min(26, hit.crossTrackDeg));
          }
          executeScan(hit);
        }
      };
    }
    if (downlinkClickHandlerRef) {
      downlinkClickHandlerRef.current = () => {
        executeDownlink();
      };
    }
  }, [targetClickHandlerRef, downlinkClickHandlerRef, targets, orbitalMotionRef, executeScan, executeDownlink, isUploadRequiredNow]);

  const resolveAnomaly = useCallback(
    (optionIdx: number, radHardBypass = false) => {
      if (!activeAnomaly) return;
      sound.playEquip();
      setAnomaliesSolved((prev) => prev + 1);

      if (radHardBypass) {
        setTimelineEvents((prev) =>
          prev.map((e) =>
            e.id === activeAnomaly.id
              ? { ...e, resolved: true, impactDescription: 'Rad-Hard FPGA auto-shield absorbed proton spike!' }
              : e
          )
        );
        setSciencePoints((prev) => prev + 220);
        setCallout('RAD-HARD AUTO-SHIELD! +220 XP');
      } else if (activeAnomaly.choice) {
        const opt = activeAnomaly.choice.options[optionIdx];
        setTimelineEvents((prev) =>
          prev.map((e) =>
            e.id === activeAnomaly.id
              ? { ...e, resolved: true, chosenOptionIndex: optionIdx, impactDescription: opt.outcomeText }
              : e
          )
        );
        const scienceDelta = Math.round(((opt.scienceEfficiencyMult ?? 1.0) - 0.8) * 320 + 60);
        const batDeltaPct = opt.batteryImpactWh
          ? (opt.batteryImpactWh / Math.max(150, budget.batteryCapacityWh)) * 100
          : -8;
        setSciencePoints((prev) => Math.max(0, prev + scienceDelta));
        setBatteryPct((prev) => Math.max(10, Math.min(100, prev + batDeltaPct)));
        setCallout(opt.outcomeText.toUpperCase());
      }
      setActiveAnomaly(null);
    },
    [activeAnomaly, budget.batteryCapacityWh]
  );

  // Full Keyboard Controls
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keysRef.current.left = true;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keysRef.current.right = true;
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keysRef.current.up = true;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keysRef.current.down = true;

      if (e.code === 'Space') {
        e.preventDefault();
        if (isScanningRef.current) return;
        if (isDownlinkingRef.current || isUploadRequiredNow()) {
          if (!earthRelayDoneRef.current) showUploadRequiredCallout();
          return;
        }
        if (lockedTarget) executeScan(lockedTarget);
      } else if (e.key === 'e' || e.key === 'E') {
        executeDownlink();
      } else if (e.key === 'q' || e.key === 'Q') {
        setPowerMode((m) => (m === 'ECO' ? 'NOMINAL' : m === 'NOMINAL' ? 'OVERCLOCK' : 'ECO'));
      } else if (e.key === 'f' || e.key === 'F') {
        onChangeCamFocus(camFocus === 'global' ? 'satellite' : 'global');
      } else if (activeAnomaly && activeAnomaly.choice) {
        if (e.key === '1') resolveAnomaly(0);
        if (e.key === '2' && activeAnomaly.choice.options[1]) resolveAnomaly(1);
        if (e.key === 'r' && hasRadHard && activeAnomaly.id === 'evt-solar-storm') resolveAnomaly(0, true);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keysRef.current.left = false;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keysRef.current.right = false;
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keysRef.current.up = false;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keysRef.current.down = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [
    lockedTarget,
    executeScan,
    executeDownlink,
    onChangeCamFocus,
    camFocus,
    activeAnomaly,
    hasRadHard,
    resolveAnomaly,
    isUploadRequiredNow,
    showUploadRequiredCallout
  ]);

  const missionProgressPct = Math.min(
    100,
    Math.round(((analyzedCount + transmittedCount) / (TOTAL_MARKERS * 2)) * 100)
  );
  const bufferPct = Math.min(100, Math.round((bufferGb / maxStorageGb) * 100));

  const nextDirective = useMemo(() => {
    if (earthRelayDone || transmittedCount >= TOTAL_MARKERS) {
      return 'ALL DATA RECEIVED BY EARTH! COMPLETING MISSION...';
    }
    if (activeAnomaly) {
      return `ANOMALY ALERT: PRESS [1] / [2]${hasRadHard && activeAnomaly.id === 'evt-solar-storm' ? ' OR [R] SHIELD' : ''}`;
    }
    if (isDownlinkActive) {
      return 'UPLOADING SCANNED DATA TO EARTH — STANDBY...';
    }
    if (isScanningNow) {
      return 'SCANNING MARKER — STANDBY...';
    }
    if (hasPendingUpload) {
      return inRangeStation
        ? `IN ${inRangeStation.name} — PRESS [E] TO UPLOAD DATA BEFORE NEXT SCAN`
        : 'DATA QUEUED — FLY INTO GREEN CONE & PRESS [E] TO UPLOAD BEFORE NEXT SCAN';
    }
    if (lockedTarget) {
      return `MARKER LOCKED (${lockedTarget.name.toUpperCase()}) — PRESS [SPACE] TO SCAN`;
    }
    if (targets.length > 0) {
      let bestTgt = targets[0];
      let bestFwd = Infinity;
      for (const t of targets) {
        let diff = wrapAngleRad(t.phaseAngleRad - orbitAngleUi);
        if (diff < -0.2) diff += Math.PI * 2;
        if (diff < bestFwd) {
          bestFwd = diff;
          bestTgt = t;
        }
      }
      const slewDelta = bestTgt.crossTrackDeg - slewDeg;
      const aimHint =
        Math.abs(slewDelta) <= 8
          ? 'AIM ALIGNED'
          : slewDelta < 0
          ? `STEER LEFT [A] (${Math.round(bestTgt.crossTrackDeg)}°)`
          : `STEER RIGHT [D] (${Math.round(bestTgt.crossTrackDeg)}°)`;
      return `MARKER ${analyzedCount + 1}/${TOTAL_MARKERS}: ${bestTgt.name.toUpperCase()} — ${aimHint}`;
    }
    return 'SCAN MARKERS [SPACE] & UPLOAD DATA TO EARTH [E]';
  }, [
    earthRelayDone,
    transmittedCount,
    activeAnomaly,
    hasRadHard,
    isDownlinkActive,
    isScanningNow,
    hasPendingUpload,
    lockedTarget,
    inRangeStation,
    targets,
    analyzedCount,
    orbitAngleUi,
    slewDeg
  ]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 select-none font-mono text-xs z-40">
      {/* TOP NASA ORBITAL OPS TELEMETRY STRIP */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
          <div className="game-frame px-4 py-2 flex items-center gap-3">
            <NasaCrest size={30} />
            <div>
              <div className="text-[10px] text-sky-400 font-bold uppercase tracking-widest">
                {orbit.name} &bull; {assistDifficulty}
              </div>
              <div className="text-sm font-black text-white flex items-center gap-2">
                <span>{sciencePoints.toLocaleString()} XP</span>
                <span className="text-[10px] text-amber-300">x{comboMultiplier.toFixed(2)}</span>
                {synergies.active.length > 0 && (
                  <span className="game-chip px-1.5 py-0.5 bg-amber-950/90 border border-amber-400/60 text-[9px] text-amber-200 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                    +{Math.round((synergies.totalYieldMultiplier - 1) * 100)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Limited Markers Analyzed & Earth Return Telemetry Progress Bar */}
          <div className="game-frame px-4 py-2 min-w-[250px] flex-1 max-w-md space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-200 font-bold">
                MARKERS: <strong className="text-cyan-300">{analyzedCount}/{TOTAL_MARKERS}</strong> ANALYZED &bull;{' '}
                <strong className="text-emerald-300">{transmittedCount}/{TOTAL_MARKERS}</strong> SENT TO EARTH
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                {[1, 2, 3].map((s) => (
                  <Star key={s} className={`w-3.5 h-3.5 ${s <= currentStars ? 'fill-current' : 'opacity-25'}`} />
                ))}
              </span>
            </div>
            <div className="w-full h-2 bg-space-950 border border-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#105bd8] via-cyan-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${missionProgressPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenTutorial && (
              <button
                onClick={() => {
                  sound.playClick(840);
                  onOpenTutorial();
                }}
                className="game-chip px-3 py-2 bg-[#0b3d91] border border-amber-400/60 text-amber-200 hover:brightness-125 font-bold text-[10px]"
              >
                ? TUTORIAL
              </button>
            )}
            <button
              onClick={() => {
                sound.playClick(800);
                onChangeCamFocus(camFocus === 'global' ? 'satellite' : 'global');
              }}
              className="game-chip px-3 py-2 bg-space-950/90 border border-sky-500/40 text-sky-300 hover:border-sky-300 font-bold text-[10px] flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>CAM [F]: {camFocus === 'satellite' ? 'SAT POV' : 'ORBIT MAP'}</span>
            </button>
            <button
              onClick={() => {
                sound.playClick(400);
                onReturnToHangar();
              }}
              className="game-chip px-3 py-2 bg-space-950/90 border border-slate-700 text-slate-300 hover:border-red-400 hover:text-red-300 font-bold text-[10px]"
            >
              VAB BAY
            </button>
          </div>
        </div>

        {/* CLEAR LIVE MISSION OBJECTIVE & NEXT-ACTION DIRECTOR */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
          <div className="game-chip px-3 py-1.5 bg-[#0b3d91]/65 border border-sky-400/45 text-white font-bold flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-[#fc3d21] text-white font-black text-[9px]">NEXT STEP</span>
            <span className="text-sky-100">{nextDirective}</span>
          </div>

          <div className="hidden md:flex game-chip px-3 py-1.5 bg-space-950/85 border border-slate-800 text-slate-300 items-center gap-3">
            <span
              className={
                analyzedCount >= TOTAL_MARKERS
                  ? 'text-emerald-300 font-bold'
                  : !hasPendingUpload && !isDownlinkActive
                  ? 'text-cyan-300 font-bold'
                  : 'text-slate-400'
              }
            >
              1. Scan Marker [SPACE] ({analyzedCount}/{TOTAL_MARKERS})
            </span>
            <span className="text-slate-600">&rarr;</span>
            <span
              className={
                transmittedCount >= TOTAL_MARKERS
                  ? 'text-emerald-300 font-bold'
                  : hasPendingUpload || isDownlinkActive
                  ? 'text-emerald-300 font-bold'
                  : 'text-slate-400'
              }
            >
              2. Upload to Earth [E] ({transmittedCount}/{TOTAL_MARKERS})
            </span>
          </div>
        </div>

        {/* Non-Blocking Live Anomaly Countermeasure Bar */}
        {activeAnomaly && activeAnomaly.choice && (
          <div className="game-frame-amber max-w-3xl mx-auto p-3 flex flex-wrap items-center justify-between gap-2 pointer-events-auto shadow-2xl">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
              <div>
                <div className="text-[11px] font-black text-amber-300 uppercase">ALERT: {activeAnomaly.title}</div>
                <div className="text-[10px] text-amber-100/90 truncate max-w-md">{activeAnomaly.choice.prompt}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {hasRadHard && activeAnomaly.id === 'evt-solar-storm' && (
                <button
                  onClick={() => resolveAnomaly(0, true)}
                  className="game-chip px-2.5 py-1.5 bg-emerald-500 text-black font-black text-[10px] flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" /> [R] FPGA SHIELD
                </button>
              )}
              {activeAnomaly.choice.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => resolveAnomaly(idx)}
                  className="game-chip px-2.5 py-1.5 bg-space-950 border border-amber-400/70 hover:bg-amber-400 hover:text-black text-amber-200 font-bold text-[10px] transition-colors"
                >
                  [{idx + 1}] {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CENTER: TARGET LOCK / COMPLETION / CALLOUT RETICLE */}
      <div className="relative flex-1 flex flex-col items-center justify-center pointer-events-none gap-2">
        {callout && (
          <div className="game-blade px-6 py-2 bg-cyan-950/90 border-y-2 border-cyan-400 text-white font-black text-xs tracking-widest uppercase shadow-2xl">
            {callout}
          </div>
        )}

        {earthRelayDone && (
          <div className="game-blade px-8 py-3 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-500 text-black font-black text-xs sm:text-sm uppercase tracking-widest shadow-2xl flex items-center gap-2">
            <Award className="w-5 h-5" />
            <span>EARTH RELAY CONFIRMED — MISSION COMPLETE!</span>
          </div>
        )}

        {!earthRelayDone && lockedTarget && !isScanningNow && !isDownlinkActive && !hasPendingUpload && (
          <button
            onClick={() => executeScan(lockedTarget)}
            className="pointer-events-auto game-blade px-7 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-300 text-black font-black text-xs uppercase tracking-widest shadow-2xl shadow-amber-500/40 animate-pulse"
          >
            ANALYZE MARKER: {lockedTarget.name.toUpperCase()} — [SPACE]
          </button>
        )}

        {!earthRelayDone && hasPendingUpload && inRangeStation && !isDownlinkActive && !isScanningNow && (
          <button
            onClick={executeDownlink}
            className="pointer-events-auto game-blade px-7 py-2.5 bg-gradient-to-r from-emerald-400 to-cyan-300 text-black font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-500/40 animate-pulse"
          >
            UPLOAD TO EARTH ({inRangeStation.name}) — [E]
          </button>
        )}
      </div>

      {/* BOTTOM TACTICAL ORBITAL PILOT COCKPIT */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-3 pointer-events-auto">
        {/* Left: Swath Radar Scope + Gimbal/Thruster Controls */}
        <div className="game-frame p-3.5 w-full lg:w-80 space-y-2.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-cyan-400 font-bold tracking-wider">SWATH MARKER RADAR</span>
            <span className="text-slate-300">SLEW {slewDeg >= 0 ? `+${slewDeg}°` : `${slewDeg}°`}</span>
          </div>

          {/* 2D Swath Radar: horizontal = Cross-Track Slew (-28°..+28°), vertical = Orbit Ahead (0..π rad) */}
          <div className="relative h-24 w-full bg-space-950 border border-cyan-500/30 hud-grid-bg overflow-hidden">
            {/* Cross-track center line */}
            <div className="absolute inset-y-0 left-1/2 w-px bg-cyan-500/25" />
            {/* Player reticle */}
            <div
              className="absolute bottom-2 w-4 h-4 -ml-2 border-2 border-cyan-300 rotate-45 transition-all duration-75"
              style={{ left: `${((slewDeg + 28) / 56) * 100}%` }}
            />
            {/* Ground station green diamonds */}
            {groundStations.map((gs) => {
              const fwd = wrapAngleRad(gs.phaseAngleRad - orbitAngleUi);
              const yPct = 88 - ((fwd + Math.PI) / (2 * Math.PI)) * 78;
              const xPct = ((gs.crossTrackDeg + 28) / 56) * 100;
              return (
                <div
                  key={gs.id}
                  title={gs.name}
                  className="absolute w-2.5 h-2.5 -ml-1 -mt-1 bg-emerald-400/80 rotate-45"
                  style={{ left: `${xPct}%`, top: `${yPct}%` }}
                />
              );
            })}
            {/* Limited Target Markers */}
            {targets.map((t) => {
              const fwd = wrapAngleRad(t.phaseAngleRad - orbitAngleUi);
              const yPct = 88 - ((fwd + Math.PI) / (2 * Math.PI)) * 78;
              const xPct = ((t.crossTrackDeg + 28) / 56) * 100;
              const isLock = lockedTarget?.id === t.id;
              const scanBlocked = hasPendingUpload || isScanningNow || isDownlinkActive;
              return (
                <button
                  key={t.id}
                  onClick={() => executeScan(t)}
                  title={
                    scanBlocked
                      ? 'Upload your scanned data before scanning the next marker'
                      : `${t.name} (+${t.rewardScience} XP)`
                  }
                  className={`absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full transition-all ${
                    scanBlocked
                      ? 'bg-slate-500/60 hover:bg-slate-400/80'
                      : isLock
                      ? 'bg-amber-300 scale-125 ring-2 ring-amber-400'
                      : 'bg-cyan-400 hover:scale-125'
                  }`}
                  style={{ left: `${xPct}%`, top: `${yPct}%` }}
                />
              );
            })}
          </div>

          {/* Flight Steering Pad */}
          <div className="grid grid-cols-4 gap-1 text-[10px] font-black">
            <button
              onPointerDown={() => (keysRef.current.left = true)}
              onPointerUp={() => (keysRef.current.left = false)}
              onPointerLeave={() => (keysRef.current.left = false)}
              className="game-chip py-1.5 bg-space-900 border border-slate-700 hover:border-cyan-400 text-white active:scale-95"
            >
              &larr; A
            </button>
            <button
              onPointerDown={() => (keysRef.current.up = true)}
              onPointerUp={() => (keysRef.current.up = false)}
              onPointerLeave={() => (keysRef.current.up = false)}
              className="game-chip py-1.5 bg-space-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 active:scale-95"
            >
              BOOST W
            </button>
            <button
              onPointerDown={() => (keysRef.current.down = true)}
              onPointerUp={() => (keysRef.current.down = false)}
              onPointerLeave={() => (keysRef.current.down = false)}
              className="game-chip py-1.5 bg-space-900 border border-slate-700 hover:border-cyan-400 text-amber-300 active:scale-95"
            >
              RETRO S
            </button>
            <button
              onPointerDown={() => (keysRef.current.right = true)}
              onPointerUp={() => (keysRef.current.right = false)}
              onPointerLeave={() => (keysRef.current.right = false)}
              className="game-chip py-1.5 bg-space-900 border border-slate-700 hover:border-cyan-400 text-white active:scale-95"
            >
              D &rarr;
            </button>
          </div>
        </div>

        {/* Center: Clean control legend & queued Earth packets readout */}
        <div className="flex-1 flex flex-col items-center justify-end gap-2">
          <div className="game-chip px-4 py-1.5 bg-space-950/85 border border-cyan-500/30 text-[10px] text-slate-300">
            <strong className="text-cyan-300">[W/S]</strong> SPEED &bull;{' '}
            <strong className="text-amber-300">[A/D]</strong> AIM RETICLE &bull;{' '}
            <strong className="text-emerald-300">[SPACE]</strong> ANALYZE MARKER &bull;{' '}
            <strong className="text-emerald-400">[E]</strong> SEND TO EARTH
          </div>
        </div>

        {/* Right: EPS Power, Thermal, OBC Buffer & Earth Link */}
        <div className="game-frame p-3.5 w-full lg:w-80 space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400">
              BAT <strong className={batteryPct < 25 ? 'text-rose-400' : 'text-white'}>{batteryPct.toFixed(0)}%</strong>
              {' '}({isRtg ? 'RTG' : isEclipse ? 'ECLIPSE' : 'SUN'})
            </span>
            <span
              className={`flex items-center gap-1 font-bold ${
                isOverheated ? 'text-rose-400 animate-pulse' : isColdSoaked ? 'text-sky-300 animate-pulse' : 'text-emerald-300'
              }`}
            >
              <Thermometer className="w-3 h-3" /> {spacecraftTempC}°C
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 text-[10px]">
            {(['ECO', 'NOMINAL', 'OVERCLOCK'] as PowerMode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  sound.playClick(700);
                  setPowerMode(m);
                }}
                className={`game-chip py-1 font-black border ${
                  powerMode === m
                    ? 'bg-amber-400 text-black border-amber-200'
                    : 'bg-space-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {m === 'OVERCLOCK' ? 'BOOST' : m}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80">
            <span className="text-slate-400">
              DATA QUEUE ({queuedPackets} PKT{queuedPackets === 1 ? '' : 'S'}) {bufferGb.toFixed(0)}/{maxStorageGb}GB
            </span>
            <span className={bufferPct >= 90 ? 'text-rose-400 font-bold' : 'text-sky-300'}>{bufferPct}%</span>
          </div>
          <div className="w-full h-1.5 bg-space-950 border border-slate-800 overflow-hidden">
            <div className="h-full bg-sky-400 transition-all" style={{ width: `${bufferPct}%` }} />
          </div>

          <button
            onClick={executeDownlink}
            disabled={earthRelayDone || !inRangeStation || isDownlinkActive || isScanningNow || !hasPendingUpload}
            className={`game-chip w-full py-2 font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              !earthRelayDone && inRangeStation && hasPendingUpload && !isDownlinkActive && !isScanningNow
                ? 'bg-emerald-400 text-black shadow-lg shadow-emerald-500/30 hover:brightness-110'
                : 'bg-space-900 text-slate-500 border border-slate-800 cursor-not-allowed'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>
              {isDownlinkActive
                ? 'UPLOADING TO EARTH...'
                : inRangeStation
                ? hasPendingUpload
                  ? '[E] UPLOAD TO EARTH (1 PKT)'
                  : `${inRangeStation.name} READY (SCAN FIRST)`
                : hasPendingUpload
                ? 'UPLOAD QUEUED — SEEK GREEN CONE'
                : 'SCAN A MARKER FIRST [SPACE]'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
