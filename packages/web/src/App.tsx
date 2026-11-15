import React, { useState, useMemo, useEffect, useRef } from 'react';
import { gameData, realMissions } from './data';
import {
  SpacecraftDesign,
  calculateResourceBudget,
  runFullMissionSimulation,
  MissionReport,
  MissionEvent,
  getNasaMissionProfile
} from '@sim/index';
import {
  GameCanvas3D,
  ViewportMode,
  LaunchVisualState,
  LaunchMotionRefState,
  OrbitalMotionRefState,
  OrbitalGameplayState
} from './components/3d/GameCanvas3D';
import { GameHUD } from './components/hud/GameHUD';
import { FieldGuideModal } from './components/hud/FieldGuideModal';
import { BodySelectorModal } from './components/hud/BodySelectorModal';
import { TutorialCoach } from './components/tutorial/TutorialCoach';
import { TUTORIAL_STEPS } from './game/tutorial';
import { TitleScreen } from './components/screens/TitleScreen';
import { CampaignScreen } from './components/screens/CampaignScreen';
import { FlightArcade, FlightOutcomeMeta } from './components/simulation/FlightArcade';
import { OrbitalCommand } from './components/simulation/OrbitalCommand';
import { DebriefReport, PreviousBestRun } from './components/report/DebriefReport';
import { MultiplayerModal, TeamRole } from './components/multiplayer/MultiplayerModal';
import { CampaignMission, CAMPAIGN_MISSIONS } from './game/campaign';
import {
  evaluateMissionGoals,
  computeMissionStars,
  MissionGoalsSummary
} from './game/missionGoals';
import {
  AssistDifficulty,
  DIFFICULTY_PROFILES,
  CareerStats,
  getCareerRank
} from './game/knowledge';
import { multiplayerClient, PeerInfo, ServerStatus } from './utils/multiplayerClient';
import { sound } from './utils/soundEngine';

type GameScreen = 'title' | 'campaign' | 'hangar' | 'flight_arcade' | 'orbital_command' | 'debrief';

const STORAGE_KEY = 'mission-architect-progress-v1';

const DEFAULT_CAREER_STATS: CareerStats = {
  missionsCompleted: 0,
  maxQMasteredCount: 0,
  eclipseSurvivedCount: 0,
  anomaliesSolvedCount: 0,
  threeStarCount: 0,
  highestGrade: 'C'
};

const GRADE_ORDER = ['F', 'D', 'C', 'B', 'A', 'A+'];
function pickBetterGrade(a: string, b: string): string {
  return GRADE_ORDER.indexOf(b) > GRADE_ORDER.indexOf(a) ? b : a;
}

interface StoredProgress {
  stars: Record<string, number>;
  bestScores: Record<string, number>;
  bestRuns: Record<string, PreviousBestRun>;
  careerStats: CareerStats;
  assistDifficulty: AssistDifficulty;
  tutorialCompleted: boolean;
}

function loadStoredProgress(): StoredProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        stars: {},
        bestScores: {},
        bestRuns: {},
        careerStats: { ...DEFAULT_CAREER_STATS },
        assistDifficulty: 'Intermediate',
        tutorialCompleted: false
      };
    }
    const parsed = JSON.parse(raw);
    const diff = parsed?.assistDifficulty;
    return {
      stars: parsed && typeof parsed.stars === 'object' ? parsed.stars : {},
      bestScores: parsed && typeof parsed.bestScores === 'object' ? parsed.bestScores : {},
      bestRuns: parsed && typeof parsed.bestRuns === 'object' ? parsed.bestRuns : {},
      careerStats:
        parsed && typeof parsed.careerStats === 'object'
          ? { ...DEFAULT_CAREER_STATS, ...parsed.careerStats }
          : { ...DEFAULT_CAREER_STATS },
      assistDifficulty:
        diff === 'Beginner' || diff === 'Intermediate' || diff === 'Advanced' ? diff : 'Intermediate',
      tutorialCompleted: Boolean(parsed?.tutorialCompleted)
    };
  } catch {
    return {
      stars: {},
      bestScores: {},
      bestRuns: {},
      careerStats: { ...DEFAULT_CAREER_STATS },
      assistDifficulty: 'Intermediate',
      tutorialCompleted: false
    };
  }
}

const defaultDesign: SpacecraftDesign = CAMPAIGN_MISSIONS[0].starterDesign;

const sandboxDefaultDesign: SpacecraftDesign = {
  ...CAMPAIGN_MISSIONS[1].blueprintDesign,
  name: 'AstroCraft-X',
  scenarioId: 'scenario-sandbox',
  orbitId: 'orbit-sso-700',
  launchVehicleId: 'lv-falcon9-dedicated'
};

const INITIAL_LAUNCH_STATE: LaunchVisualState = {
  progressPercent: 0,
  phase: 'COUNTDOWN',
  pitchAngleDeg: 0,
  throttle: 100,
  stageSeparated: false,
  fairingDeployed: false,
  maxQStress: false,
  cameraAngle: 'chase',
  steerLaneX: 0,
  steerVelX: 0
};

export function App() {
  const [screen, setScreen] = useState<GameScreen>('title');
  const [viewportMode, setViewportMode] = useState<ViewportMode>('orbit');
  const [design, setDesign] = useState<SpacecraftDesign>(defaultDesign);
  const [currentMission, setCurrentMission] = useState<CampaignMission | null>(null);

  // Ascent progress & live rocket visual state for 3D Canvas
  const [ascentProgress, setAscentProgress] = useState(0);
  const [launchState, setLaunchState] = useState<LaunchVisualState>(INITIAL_LAUNCH_STATE);
  const [flightBonusXp, setFlightBonusXp] = useState(0);
  const [lastFlightMeta, setLastFlightMeta] = useState<FlightOutcomeMeta>({
    maxQMastered: false,
    precisionStages: 0,
    gatesHit: 0,
    totalGates: 8,
    perfectApexCount: 0
  });
  const [orbitalScienceXp, setOrbitalScienceXp] = useState(0);
  const [lastStarsEarned, setLastStarsEarned] = useState(0);
  const [lastGoalsSummary, setLastGoalsSummary] = useState<MissionGoalsSummary | undefined>(undefined);
  const [previousRunSnapshot, setPreviousRunSnapshot] = useState<PreviousBestRun | null>(null);

  // Active 3D visual FX & camera states
  const [is3DScanning, setIs3DScanning] = useState(false);
  const [is3DDownlinking, setIs3DDownlinking] = useState(false);
  const [isEclipse3D, setIsEclipse3D] = useState(false);
  const [camFocus, setCamFocus] = useState<'satellite' | 'global'>('satellite');
  const orbitalMotionRef = useRef<OrbitalMotionRefState>({ orbitAngleRad: 0.15, slewDeg: 0, thrusting: 0 });
  const launchMotionRef = useRef<LaunchMotionRefState>({
    progressPercent: 0,
    steerLaneX: 0,
    steerVelX: 0,
    throttle: 100
  });
  const [orbitalGameplay, setOrbitalGameplay] = useState<OrbitalGameplayState | undefined>(undefined);
  const targetClickHandlerRef = useRef<((id: string) => void) | null>(null);
  const downlinkClickHandlerRef = useRef<(() => void) | null>(null);

  // Persistent campaign progression, difficulty & career stats
  const initialProgress = useMemo(() => loadStoredProgress(), []);
  const [completedMissions, setCompletedMissions] = useState<Record<string, number>>(initialProgress.stars);
  const [bestScores, setBestScores] = useState<Record<string, number>>(initialProgress.bestScores);
  const [bestRuns, setBestRuns] = useState<Record<string, PreviousBestRun>>(initialProgress.bestRuns);
  const [careerStats, setCareerStats] = useState<CareerStats>(initialProgress.careerStats);
  const [assistDifficulty, setAssistDifficulty] = useState<AssistDifficulty>(initialProgress.assistDifficulty);
  const [tutorialCompleted, setTutorialCompleted] = useState<boolean>(initialProgress.tutorialCompleted);
  const [isFieldGuideOpen, setIsFieldGuideOpen] = useState(false);
  const [isBodySelectorOpen, setIsBodySelectorOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [requestedHangarTab, setRequestedHangarTab] = useState<string | null>(null);
  const [tutorialVisitedWorldPicker, setTutorialVisitedWorldPicker] = useState(false);
  const [tutorialLaunchedOnce, setTutorialLaunchedOnce] = useState(false);
  const [tutorialReachedOrbital, setTutorialReachedOrbital] = useState(false);
  const [tutorialScanDone, setTutorialScanDone] = useState(false);
  const [tutorialDownlinkDone, setTutorialDownlinkDone] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          stars: completedMissions,
          bestScores,
          bestRuns,
          careerStats,
          assistDifficulty,
          tutorialCompleted
        })
      );
    } catch {
      // Ignore storage quota / privacy mode errors
    }
  }, [completedMissions, bestScores, bestRuns, careerStats, assistDifficulty, tutorialCompleted]);

  const totalStarsPossible = CAMPAIGN_MISSIONS.length * 3;
  const starsEarned = useMemo(() => {
    return Object.values(completedMissions).reduce((acc, curr) => acc + curr, 0);
  }, [completedMissions]);
  const careerXp = useMemo(() => {
    return Object.values(bestScores).reduce((acc, curr) => acc + curr, 0);
  }, [bestScores]);
  const careerRank = useMemo(() => getCareerRank(careerXp), [careerXp]);
  const bestGrades = useMemo(() => {
    const out: Record<string, string> = {};
    Object.entries(bestRuns).forEach(([k, run]) => {
      out[k] = run.letterGrade;
    });
    return out;
  }, [bestRuns]);

  // Audio state
  const [sfxEnabled, setSfxEnabled] = useState(sound.enabled);
  const toggleSfx = () => {
    sound.enabled = !sound.enabled;
    setSfxEnabled(sound.enabled);
    if (sound.enabled) sound.playClick(900);
  };

  // Multiplayer & WebSocket state
  const [isMultiplayerOpen, setIsMultiplayerOpen] = useState(false);
  const [roomCode, setRoomCode] = useState<string | undefined>(undefined);
  const [activeRole, setActiveRole] = useState<TeamRole | undefined>(undefined);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('offline');
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [strictRoleLock, setStrictRoleLock] = useState(false);
  const skipBroadcastRef = useRef(false);

  useEffect(() => {
    multiplayerClient.setCallbacks({
      onStatusChange: (status) => setServerStatus(status),
      onPeersUpdated: (nextPeers) => setPeers(nextPeers),
      onRemoteDesign: (remoteDesign) => {
        skipBroadcastRef.current = true;
        setDesign(remoteDesign);
      }
    });
    return () => {
      multiplayerClient.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!roomCode) return;
    if (skipBroadcastRef.current) {
      skipBroadcastRef.current = false;
      return;
    }
    multiplayerClient.sendDesignUpdate(design);
  }, [design, roomCode]);

  // Inject campaign mission budget cap into data registry when a campaign mission is active
  const effectiveData = useMemo(() => {
    if (!currentMission) return gameData;
    return {
      ...gameData,
      scenarios: gameData.scenarios.map((s) =>
        s.id === currentMission.scenarioId ? { ...s, budgetM: currentMission.budgetLimitM } : s
      )
    };
  }, [currentMission]);

  // Active selections
  const effectiveScenario = useMemo(
    () => effectiveData.scenarios.find((s) => s.id === design.scenarioId) || effectiveData.scenarios[0],
    [effectiveData.scenarios, design.scenarioId]
  );

  const selectedOrbit = useMemo(
    () => effectiveData.orbits.find((o) => o.id === design.orbitId) || effectiveData.orbits[0],
    [effectiveData.orbits, design.orbitId]
  );

  const selectedLauncher = useMemo(
    () => effectiveData.launchVehicles.find((l) => l.id === design.launchVehicleId) || effectiveData.launchVehicles[0],
    [effectiveData.launchVehicles, design.launchVehicleId]
  );

  const currentStructure = useMemo(
    () => effectiveData.structures.find((s) => s.id === design.structureId) || effectiveData.structures[0],
    [effectiveData.structures, design.structureId]
  );

  const currentPowerGen = useMemo(
    () => effectiveData.powerGeneration.find((p) => p.id === design.powerGenId) || effectiveData.powerGeneration[0],
    [effectiveData.powerGeneration, design.powerGenId]
  );

  const currentComms = useMemo(
    () => effectiveData.communications.find((c) => c.id === design.commsId) || effectiveData.communications[0],
    [effectiveData.communications, design.commsId]
  );

  const currentObc = useMemo(
    () => effectiveData.obc.find((o) => o.id === design.obcId) || effectiveData.obc[0],
    [effectiveData.obc, design.obcId]
  );

  const selectedInstruments = useMemo(
    () => effectiveData.instruments.filter((i) => design.instrumentIds.includes(i.id)),
    [effectiveData.instruments, design.instrumentIds]
  );

  const budget = useMemo(() => {
    return calculateResourceBudget(design, effectiveData);
  }, [design, effectiveData]);

  const [missionReport, setMissionReport] = useState<MissionReport>(() => {
    return runFullMissionSimulation(
      defaultDesign,
      calculateResourceBudget(defaultDesign, gameData),
      gameData.scenarios[0],
      gameData.instruments,
      gameData.orbits[0],
      realMissions
    );
  });

  // Flow handlers
  const handleStartCampaign = () => {
    setScreen('campaign');
    setViewportMode('orbit');
    setIsEclipse3D(false);
    setCamFocus('global');
  };

  const handleStartSandbox = () => {
    setCurrentMission(null);
    setDesign({ ...sandboxDefaultDesign });
    setIsEclipse3D(false);
    setIs3DScanning(false);
    setIs3DDownlinking(false);
    setCamFocus('global');
    setScreen('hangar');
    setViewportMode('hangar');
  };

  const handleSelectCampaignMission = (mission: CampaignMission) => {
    setCurrentMission(mission);
    setDesign({ ...mission.starterDesign });
    setAscentProgress(0);
    setLaunchState(INITIAL_LAUNCH_STATE);
    launchMotionRef.current = {
      progressPercent: 0,
      steerLaneX: 0,
      steerVelX: 0,
      throttle: 100
    };
    setFlightBonusXp(0);
    setIsEclipse3D(false);
    setIs3DScanning(false);
    setIs3DDownlinking(false);
    setCamFocus('global');
    setScreen('hangar');
    setViewportMode('hangar');
  };

  const applyNasaPresetForOrbit = (orbitId: string): SpacecraftDesign => {
    const targetOrbit = gameData.orbits.find((o) => o.id === orbitId) || gameData.orbits[0];
    const profile = getNasaMissionProfile(targetOrbit.centralBody, targetOrbit.id);
    return {
      ...profile.simPresetDesign,
      scenarioId: 'scenario-sandbox',
      orbitId: targetOrbit.id
    };
  };

  const handleSelectWorldOrbit = (orbitId: string, equipNasaMissionSpec: boolean) => {
    setTutorialVisitedWorldPicker(true);
    // Selecting any planet/moon/body always launches in infinite-budget Deep-Space Free Flight
    setCurrentMission(null);

    if (equipNasaMissionSpec) {
      setDesign(applyNasaPresetForOrbit(orbitId));
    } else {
      setDesign((prev) => ({
        ...prev,
        scenarioId: 'scenario-sandbox',
        orbitId
      }));
    }

    if (screen === 'title' || screen === 'campaign') {
      setScreen('hangar');
      setViewportMode('hangar');
    }
  };

  const handleEquipNasaMissionInHangar = () => {
    setCurrentMission(null);
    setDesign((prev) => applyNasaPresetForOrbit(prev.orbitId));
  };

  const handleDesignChange = (
    updater: SpacecraftDesign | ((prev: SpacecraftDesign) => SpacecraftDesign)
  ) => {
    const next = typeof updater === 'function' ? updater(design) : updater;
    if (next.orbitId !== design.orbitId) {
      setTutorialVisitedWorldPicker(true);
      if (currentMission && !effectiveScenario.targetOrbits.includes(next.orbitId)) {
        setCurrentMission(null);
        setDesign({ ...next, scenarioId: 'scenario-sandbox' });
        return;
      }
    }
    setDesign(next);
  };

  const handleStartTutorial = () => {
    setIsTutorialOpen(true);
    if (screen === 'flight_arcade') {
      setTutorialStep(4);
      return;
    }
    if (screen === 'orbital_command') {
      setTutorialStep(6);
      return;
    }
    setTutorialStep(0);
    if (screen === 'title' || screen === 'campaign' || screen === 'debrief') {
      setCurrentMission(null);
      setDesign({ ...sandboxDefaultDesign });
      setIsEclipse3D(false);
      setIs3DScanning(false);
      setIs3DDownlinking(false);
      setCamFocus('global');
      setScreen('hangar');
      setViewportMode('hangar');
    }
  };

  const handleAutoFitBlueprint = () => {
    if (currentMission) {
      setDesign({ ...currentMission.blueprintDesign });
      return;
    }
    setDesign((prev) => applyNasaPresetForOrbit(prev.orbitId));
  };

  const handleLaunchInitiated = () => {
    setAscentProgress(0);
    setLaunchState(INITIAL_LAUNCH_STATE);
    launchMotionRef.current = {
      progressPercent: 0,
      steerLaneX: 0,
      steerVelX: 0,
      throttle: 100
    };
    setFlightBonusXp(0);
    setIsEclipse3D(false);
    setIs3DScanning(false);
    setIs3DDownlinking(false);
    setTutorialLaunchedOnce(true);
    if (isTutorialOpen && tutorialStep < 4) {
      setTutorialStep(4);
    }
    setScreen('flight_arcade');
    setViewportMode('launch');
  };

  const handleAscentSuccess = (bonusXp: number, meta: FlightOutcomeMeta) => {
    setFlightBonusXp(bonusXp);
    setLastFlightMeta(meta);
    setIsEclipse3D(false);
    setCamFocus('satellite');
    setTutorialReachedOrbital(true);
    if (isTutorialOpen && tutorialStep < 6) {
      setTutorialStep(6);
    }
    setScreen('orbital_command');
    setViewportMode('orbit');
  };

  const targetScienceQuota = useMemo(() => {
    if (currentMission) return currentMission.targetSciencePoints;
    const rawScience = selectedInstruments.reduce((sum, inst) => sum + inst.scienceValue, 0);
    return Math.min(1800, Math.max(750, Math.round(rawScience * 12)));
  }, [currentMission, selectedInstruments]);

  const handleMissionAccomplished = (
    finalScienceXp: number,
    resolvedEvents: MissionEvent[],
    opsMeta: {
      anomaliesSolved: number;
      eclipseSurvived: boolean;
      markersAnalyzed?: number;
      markersTransmitted?: number;
      totalMarkers?: number;
    }
  ) => {
    const freshReport = runFullMissionSimulation(
      design,
      budget,
      effectiveScenario,
      effectiveData.instruments,
      selectedOrbit,
      realMissions
    );

    const combinedEvents = resolvedEvents.length > 0 ? resolvedEvents : freshReport.eventsEncountered;
    const reportWithOps: MissionReport = {
      ...freshReport,
      eventsEncountered: combinedEvents
    };

    // Evaluate full 4-objective mission checklist (Build + Skyway Rings + Orbital Science)
    const goalsEval = evaluateMissionGoals({
      mission: currentMission,
      design,
      budget,
      orbit: selectedOrbit,
      scenario: effectiveScenario,
      targetSciencePoints: targetScienceQuota,
      flight: lastFlightMeta,
      orbital: {
        sciencePoints: finalScienceXp,
        anomaliesSolved: opsMeta.anomaliesSolved,
        eclipseSurvived: opsMeta.eclipseSurvived,
        markersAnalyzed: opsMeta.markersAnalyzed,
        markersTransmitted: opsMeta.markersTransmitted,
        totalMarkers: opsMeta.totalMarkers
      }
    });

    // Compute earned stars based on completed Mission Contract Goals + Simulation Score (1 to 3★)
    const stars = computeMissionStars({
      status: reportWithOps.status,
      overallScore: reportWithOps.overallScore,
      scienceXp: finalScienceXp,
      targetSciencePoints: targetScienceQuota,
      goalsSummary: goalsEval
    });

    const diffMultiplier = DIFFICULTY_PROFILES[assistDifficulty].xpMultiplier;
    const totalRunXp = Math.round(
      (finalScienceXp + flightBonusXp + goalsEval.earnedBonusXp + reportWithOps.overallScore * 5) *
        diffMultiplier
    );
    const runKey = currentMission ? currentMission.id : 'sandbox';
    const existingBestRun = bestRuns[runKey] || null;
    setPreviousRunSnapshot(existingBestRun);

    const nextBestRunCandidate: PreviousBestRun = {
      overallScore: reportWithOps.overallScore,
      totalCostM: Number(budget.totalCostM.toFixed(1)),
      totalMassKg: Math.round(budget.totalMassKg),
      letterGrade: reportWithOps.letterGrade,
      stars: Math.max(existingBestRun?.stars || 0, stars)
    };
    setBestRuns((prev) => {
      const prevEntry = prev[runKey];
      if (!prevEntry || nextBestRunCandidate.overallScore >= prevEntry.overallScore) {
        return { ...prev, [runKey]: nextBestRunCandidate };
      }
      return { ...prev, [runKey]: { ...prevEntry, stars: Math.max(prevEntry.stars, stars) } };
    });

    if (reportWithOps.status !== 'MISSION_FAILURE') {
      setCareerStats((prev) => ({
        missionsCompleted: prev.missionsCompleted + 1,
        maxQMasteredCount: prev.maxQMasteredCount + (lastFlightMeta.maxQMastered ? 1 : 0),
        eclipseSurvivedCount: prev.eclipseSurvivedCount + (opsMeta.eclipseSurvived ? 1 : 0),
        anomaliesSolvedCount: prev.anomaliesSolvedCount + opsMeta.anomaliesSolved,
        threeStarCount: prev.threeStarCount + (stars === 3 ? 1 : 0),
        highestGrade: pickBetterGrade(prev.highestGrade, reportWithOps.letterGrade)
      }));
    }

    if (currentMission) {
      setCompletedMissions((prev) => ({
        ...prev,
        [currentMission.id]: Math.max(prev[currentMission.id] || 0, stars)
      }));
      setBestScores((prev) => ({
        ...prev,
        [currentMission.id]: Math.max(prev[currentMission.id] || 0, totalRunXp)
      }));
    } else {
      setBestScores((prev) => ({
        ...prev,
        sandbox: Math.max(prev.sandbox || 0, totalRunXp)
      }));
    }

    setIs3DScanning(false);
    setIs3DDownlinking(false);
    setIsEclipse3D(false);
    setOrbitalScienceXp(finalScienceXp);
    setLastStarsEarned(stars);
    setLastGoalsSummary(goalsEval);
    setMissionReport(reportWithOps);
    setScreen('debrief');
  };

  const currentMissionIdx = currentMission
    ? CAMPAIGN_MISSIONS.findIndex((m) => m.id === currentMission.id)
    : -1;
  const nextMission =
    currentMissionIdx >= 0 && currentMissionIdx < CAMPAIGN_MISSIONS.length - 1
      ? CAMPAIGN_MISSIONS[currentMissionIdx + 1]
      : null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-space-950 font-sans select-none">
      {/* ------------------------------------------------------------- */}
      {/* 1. PERSISTENT 3D SPACE VIEWPORT (Real 3D World) */}
      {/* ------------------------------------------------------------- */}
      <GameCanvas3D
        mode={viewportMode}
        design={design}
        structure={currentStructure}
        powerGen={currentPowerGen}
        comms={currentComms}
        selectedInstruments={selectedInstruments}
        orbit={screen === 'title' ? (gameData.orbits.find((o) => o.centralBody === 'earth') || selectedOrbit) : selectedOrbit}
        launchVehicle={selectedLauncher}
        launchProgressPercent={ascentProgress}
        launchState={launchState}
        isScanning={is3DScanning}
        isDownlinking={is3DDownlinking}
        isEclipse={isEclipse3D}
        isLandingShowcase={screen === 'title'}
        camFocus={camFocus}
        orbitalMotionRef={screen === 'orbital_command' ? orbitalMotionRef : undefined}
        launchMotionRef={screen === 'flight_arcade' ? launchMotionRef : undefined}
        orbitalGameplay={screen === 'orbital_command' ? orbitalGameplay : undefined}
        onSelectOrbitalTarget={(id) => targetClickHandlerRef.current?.(id)}
        onClickDownlinkCone={() => downlinkClickHandlerRef.current?.()}
      />

      {/* ------------------------------------------------------------- */}
      {/* 2. TITLE SCREEN */}
      {/* ------------------------------------------------------------- */}
      {screen === 'title' && (
        <TitleScreen
          onStartCampaign={handleStartCampaign}
          onStartSandbox={handleStartSandbox}
          onStartTutorial={handleStartTutorial}
          onOpenBodySelector={() => {
            setTutorialVisitedWorldPicker(true);
            setIsBodySelectorOpen(true);
          }}
          onOpenMultiplayer={() => setIsMultiplayerOpen(true)}
          onOpenFieldGuide={() => setIsFieldGuideOpen(true)}
          sfxEnabled={sfxEnabled}
          onToggleSfx={toggleSfx}
          starsEarned={starsEarned}
          totalStars={totalStarsPossible}
          bestScore={careerXp}
          careerRankTitle={careerRank.title}
          tutorialCompleted={tutorialCompleted}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. CAMPAIGN MISSION SELECTOR */}
      {/* ------------------------------------------------------------- */}
      {screen === 'campaign' && (
        <CampaignScreen
          onSelectMission={handleSelectCampaignMission}
          onBack={() => setScreen('title')}
          completedMissions={completedMissions}
          bestScores={bestScores}
          bestGrades={bestGrades}
          assistDifficulty={assistDifficulty}
          onChangeAssistDifficulty={setAssistDifficulty}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. HANGAR VAB (BUILDER & HUD) */}
      {/* ------------------------------------------------------------- */}
      {screen === 'hangar' && (
        <GameHUD
          design={design}
          budget={budget}
          scenario={effectiveScenario}
          orbit={selectedOrbit}
          launchVehicle={selectedLauncher}
          data={effectiveData}
          mission={currentMission}
          viewportMode={viewportMode}
          onChangeViewportMode={(mode) => {
            setViewportMode(mode);
            if (mode !== 'launch') setLaunchState(INITIAL_LAUNCH_STATE);
          }}
          onChangeDesign={handleDesignChange}
          onLaunch={handleLaunchInitiated}
          onReset={() => setDesign(currentMission ? { ...currentMission.starterDesign } : { ...sandboxDefaultDesign })}
          onAutoFitBlueprint={handleAutoFitBlueprint}
          onEquipNasaMission={handleEquipNasaMissionInHangar}
          onOpenMultiplayer={() => setIsMultiplayerOpen(true)}
          onOpenFieldGuide={() => setIsFieldGuideOpen(true)}
          onOpenBodySelector={() => {
            setTutorialVisitedWorldPicker(true);
            setIsBodySelectorOpen(true);
          }}
          onOpenTutorial={handleStartTutorial}
          requestedTab={requestedHangarTab}
          onConsumeRequestedTab={() => setRequestedHangarTab(null)}
          onTabChange={(tab) => {
            if (tab === 'trajectory' || tab === 'launch') setTutorialVisitedWorldPicker(true);
          }}
          assistDifficulty={assistDifficulty}
          strictRoleLock={strictRoleLock}
          targetSciencePoints={targetScienceQuota}
          missionNumber={currentMission?.number}
          onOpenScenarioPicker={() => {
            if (currentMission) {
              setScreen('campaign');
              setViewportMode('orbit');
            } else {
              setScreen('title');
              setViewportMode('orbit');
            }
          }}
          roomCode={roomCode}
          activeRole={activeRole}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. MANUAL ASCENT FLIGHT ARCADE (Transparent 3D HUD) */}
      {/* ------------------------------------------------------------- */}
      {screen === 'flight_arcade' && (
        <FlightArcade
          design={design}
          launchVehicle={selectedLauncher}
          orbit={selectedOrbit}
          onAscentSuccess={handleAscentSuccess}
          onAbort={() => {
            setLaunchState(INITIAL_LAUNCH_STATE);
            launchMotionRef.current = {
              progressPercent: 0,
              steerLaneX: 0,
              steerVelX: 0,
              throttle: 100
            };
            setAscentProgress(0);
            setScreen('hangar');
            setViewportMode('hangar');
          }}
          onProgressUpdate={setAscentProgress}
          onLaunchStateChange={setLaunchState}
          launchMotionRef={launchMotionRef}
          onOpenTutorial={handleStartTutorial}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. ORBITAL COMMAND ARCADE (Live 3D Satellite Over Earth) */}
      {/* ------------------------------------------------------------- */}
      {screen === 'orbital_command' && (
        <OrbitalCommand
          design={design}
          budget={budget}
          orbit={selectedOrbit}
          scenario={effectiveScenario}
          selectedInstruments={selectedInstruments}
          powerGen={currentPowerGen}
          comms={currentComms}
          obc={currentObc}
          targetSciencePoints={targetScienceQuota}
          flightBonusXp={flightBonusXp}
          assistDifficulty={assistDifficulty}
          camFocus={camFocus}
          onChangeCamFocus={setCamFocus}
          orbitalMotionRef={orbitalMotionRef}
          onOrbitalGameplayChange={setOrbitalGameplay}
          targetClickHandlerRef={targetClickHandlerRef}
          downlinkClickHandlerRef={downlinkClickHandlerRef}
          onMissionAccomplished={handleMissionAccomplished}
          onReturnToHangar={() => {
            setIs3DScanning(false);
            setIs3DDownlinking(false);
            setIsEclipse3D(false);
            setOrbitalGameplay(undefined);
            setScreen('hangar');
            setViewportMode('hangar');
          }}
          onTriggerScanEffect={setIs3DScanning}
          onTriggerDownlinkEffect={setIs3DDownlinking}
          onEclipseChange={setIsEclipse3D}
          onTutorialScanDone={() => setTutorialScanDone(true)}
          onTutorialDownlinkDone={() => {
            setTutorialDownlinkDone(true);
            if (isTutorialOpen) setTutorialCompleted(true);
          }}
          onOpenTutorial={handleStartTutorial}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. POST-MISSION DEBRIEF & ACHIEVEMENTS */}
      {/* ------------------------------------------------------------- */}
      {screen === 'debrief' && (
        <div className="absolute inset-0 z-50 bg-space-950/90 backdrop-blur-md overflow-y-auto p-4 sm:p-8 flex items-start sm:items-center justify-center">
          <div className="w-full max-w-5xl my-auto">
            <DebriefReport
              report={missionReport}
              design={design}
              scenario={effectiveScenario}
              orbit={selectedOrbit}
              missionId={currentMission?.id}
              budget={budget}
              previousBestRun={previousRunSnapshot}
              goalsSummary={lastGoalsSummary}
              assistDifficulty={assistDifficulty}
              starsEarned={lastStarsEarned}
              flightBonusXp={flightBonusXp}
              orbitalScienceXp={orbitalScienceXp}
              isCampaign={Boolean(currentMission)}
              hasNextMission={Boolean(nextMission)}
              onOpenFieldGuide={() => setIsFieldGuideOpen(true)}
              onNextMission={
                nextMission
                  ? () => {
                      sound.playEquip();
                      handleSelectCampaignMission(nextMission);
                    }
                  : undefined
              }
              onBackToHangar={() => {
                sound.playClick();
                setScreen('hangar');
                setViewportMode('hangar');
              }}
              onRedesign={() => {
                sound.playClick();
                if (currentMission) {
                  setScreen('campaign');
                  setViewportMode('orbit');
                } else {
                  setScreen('hangar');
                  setViewportMode('hangar');
                }
              }}
            />
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 8. MULTIPLAYER CO-OP MODAL */}
      {/* ------------------------------------------------------------- */}
      <MultiplayerModal
        isOpen={isMultiplayerOpen}
        onClose={() => setIsMultiplayerOpen(false)}
        roomCode={roomCode}
        activeRole={activeRole}
        serverStatus={serverStatus}
        peers={peers}
        strictRoleLock={strictRoleLock}
        onToggleStrictLock={() => setStrictRoleLock((v) => !v)}
        design={design}
        onImportDesign={(imported) => {
          sound.playEquip();
          setDesign(imported);
          setIsMultiplayerOpen(false);
          if (screen === 'title' || screen === 'campaign') {
            setScreen('hangar');
            setViewportMode('hangar');
          }
        }}
        onJoinRoom={(code, role) => {
          sound.playEquip();
          setRoomCode(code);
          setActiveRole(role);
          multiplayerClient.joinRoom(code, role, design);
          setIsMultiplayerOpen(false);
          if (screen === 'title' || screen === 'campaign') {
            setScreen('hangar');
            setViewportMode('hangar');
          }
        }}
        onLeaveRoom={() => {
          sound.playClick(400);
          multiplayerClient.disconnect();
          setPeers([]);
          setRoomCode(undefined);
          setActiveRole(undefined);
        }}
      />

      {/* ------------------------------------------------------------- */}
      {/* 9. NASA AEROSPACE FIELD GUIDE & PHYSICS LAB MODAL */}
      {/* ------------------------------------------------------------- */}
      <FieldGuideModal
        isOpen={isFieldGuideOpen}
        onClose={() => setIsFieldGuideOpen(false)}
        orbit={selectedOrbit}
        comms={currentComms}
        budget={budget}
        design={design}
        careerXp={careerXp}
        careerStats={careerStats}
        completedMissions={completedMissions}
      />

      {/* ------------------------------------------------------------- */}
      {/* 10. PLANET, MOON & ASTEROID BODY SELECTOR MODAL */}
      {/* ------------------------------------------------------------- */}
      <BodySelectorModal
        isOpen={isBodySelectorOpen}
        orbits={effectiveData.orbits}
        currentOrbitId={design.orbitId}
        isCampaignMission={Boolean(currentMission)}
        onSelectOrbit={handleSelectWorldOrbit}
        onClose={() => setIsBodySelectorOpen(false)}
      />

      {/* ------------------------------------------------------------- */}
      {/* 11. NON-BLOCKING FLIGHT ACADEMY TUTORIAL COACH */}
      {/* ------------------------------------------------------------- */}
      {(screen === 'hangar' || screen === 'flight_arcade' || screen === 'orbital_command') && (() => {
        const allChecksGo =
          selectedInstruments.length > 0 &&
          budget.isMassFeasible &&
          budget.payloadMassKg <= currentStructure.maxPayloadMassKg &&
          budget.isPowerFeasible &&
          budget.isPointingFeasible &&
          budget.environmentCompatible &&
          budget.isDataFeasible &&
          budget.isCostFeasible;

        const completedStepIds: Record<string, boolean> = {
          'select-world': tutorialVisitedWorldPicker,
          'mount-payload': selectedInstruments.length > 0,
          'go-nogo-balance': allChecksGo,
          'inspect-and-launch':
            tutorialLaunchedOnce || screen === 'flight_arcade' || screen === 'orbital_command',
          'ascent-corridor': ascentProgress >= 25 || tutorialReachedOrbital,
          'stage-separation': launchState.stageSeparated || tutorialReachedOrbital,
          'orbital-scan': tutorialScanDone,
          'orbital-downlink': tutorialDownlinkDone
        };

        const activeStep = TUTORIAL_STEPS[Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, tutorialStep))];
        return (
          <TutorialCoach
            isOpen={isTutorialOpen}
            currentScreen={screen}
            stepIndex={tutorialStep}
            isStepCompleted={Boolean(completedStepIds[activeStep.id])}
            completedStepIds={completedStepIds}
            onSelectStep={setTutorialStep}
            onClose={() => setIsTutorialOpen(false)}
            onFinishTutorial={() => {
              setTutorialCompleted(true);
              setIsTutorialOpen(false);
              sound.playEquip();
            }}
            onSuggestedTab={(tab) => setRequestedHangarTab(tab)}
            onOpenWorldSelector={() => {
              setTutorialVisitedWorldPicker(true);
              setIsBodySelectorOpen(true);
            }}
            onAutoFixCraft={handleAutoFitBlueprint}
            needsAutoFix={!allChecksGo}
          />
        );
      })()}
    </div>
  );
}
