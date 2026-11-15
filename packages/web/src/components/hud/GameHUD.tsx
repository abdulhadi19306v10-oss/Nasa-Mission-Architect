import React, { useState, useMemo } from 'react';
import {
  SpacecraftDesign,
  ResourceBudget,
  Scenario,
  Orbit,
  LaunchVehicle,
  DataRegistry,
  evaluateMissionDesign,
  isNuclearRtgPower,
  getCelestialBodyMeta,
  getLaunchCapacityForOrbit,
  isBudgetUnlimited,
  getNasaMissionProfile,
  CELESTIAL_BODY_LIST,
  CelestialBodyId
} from '@sim/index';
import {
  Compass as WorldCompass,
  GraduationCap as AcademyCap,
  Satellite as NasaSatIcon,
  Wrench as EquipWrench,
  Layers,
  Zap,
  Compass,
  Globe,
  DollarSign,
  Weight,
  Volume2,
  VolumeX,
  Play,
  CheckCircle,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Users,
  Wand2,
  BookOpen,
  Sparkles,
  Lock,
  Target,
  ArrowRight,
  Eye
} from 'lucide-react';
import { realMissions } from '../../data';
import { ViewportMode } from '../3d/GameCanvas3D';
import { NasaCrest } from '../common/NasaCrest';
import { sound } from '../../utils/soundEngine';
import { CampaignMission } from '../../game/campaign';
import { evaluateMissionGoals } from '../../game/missionGoals';
import {
  AssistDifficulty,
  DIFFICULTY_PROFILES,
  evaluateSynergies,
  TAB_EDUCATIONAL_GUIDES,
  TEAM_ROLE_TABS,
  TEAM_ROLE_GOALS
} from '../../game/knowledge';
import { TeamRole } from '../multiplayer/MultiplayerModal';

interface GameHUDProps {
  design: SpacecraftDesign;
  budget: ResourceBudget;
  scenario: Scenario;
  orbit: Orbit;
  launchVehicle: LaunchVehicle;
  data: DataRegistry;
  mission?: CampaignMission | null;
  viewportMode: ViewportMode;
  onChangeViewportMode: (mode: ViewportMode) => void;
  onChangeDesign: (updater: (prev: SpacecraftDesign) => SpacecraftDesign) => void;
  onLaunch: () => void;
  onReset: () => void;
  onAutoFitBlueprint?: () => void;
  onOpenMultiplayer: () => void;
  onOpenScenarioPicker: () => void;
  onOpenFieldGuide?: () => void;
  onOpenBodySelector?: () => void;
  onEquipNasaMission?: () => void;
  onOpenTutorial?: () => void;
  requestedTab?: string | null;
  onConsumeRequestedTab?: () => void;
  onTabChange?: (tab: string) => void;
  assistDifficulty?: AssistDifficulty;
  strictRoleLock?: boolean;
  targetSciencePoints?: number;
  missionNumber?: number;
  roomCode?: string;
  activeRole?: string;
}

export type DockTab = 'payload' | 'power_bus' | 'systems' | 'launch';

function normalizeTab(raw?: string | null): DockTab {
  if (!raw) return 'payload';
  if (raw === 'payload') return 'payload';
  if (raw === 'power_bus' || raw === 'structure' || raw === 'power' || raw === 'battery') {
    return 'power_bus';
  }
  if (raw === 'systems' || raw === 'adcs' || raw === 'comms' || raw === 'avionics') {
    return 'systems';
  }
  if (raw === 'launch' || raw === 'trajectory') return 'launch';
  return 'payload';
}

function guessFixTab(issue: string): DockTab {
  const low = issue.toLowerCase();
  if (low.includes('launch capacity') || low.includes('exceeds') || low.includes('budget')) {
    return 'launch';
  }
  if (low.includes('payload mass') || low.includes('power') || low.includes('battery') || low.includes('discharge')) {
    return 'power_bus';
  }
  if (
    low.includes('pointing') ||
    low.includes('geomagnetic') ||
    low.includes('data') ||
    low.includes('downlink') ||
    low.includes('radiation')
  ) {
    return 'systems';
  }
  return 'payload';
}

export const GameHUD: React.FC<GameHUDProps> = ({
  design,
  budget,
  scenario,
  orbit,
  launchVehicle,
  data,
  mission = null,
  viewportMode,
  onChangeViewportMode,
  onChangeDesign,
  onLaunch,
  onReset,
  onAutoFitBlueprint,
  onOpenMultiplayer,
  onOpenScenarioPicker,
  onOpenFieldGuide,
  onOpenBodySelector,
  onEquipNasaMission,
  onOpenTutorial,
  requestedTab,
  onConsumeRequestedTab,
  onTabChange,
  assistDifficulty = 'Intermediate',
  strictRoleLock = false,
  targetSciencePoints = 850,
  missionNumber,
  roomCode,
  activeRole
}) => {
  const [activeTab, setActiveTab] = useState<DockTab>('payload');
  const [trajectoryBodyFilter, setTrajectoryBodyFilter] = useState<'all' | CelestialBodyId>('all');
  const [isDockExpanded, setIsDockExpanded] = useState(true);
  const [isGoalsOpen, setIsGoalsOpen] = useState(true);
  const [showNasaDossier, setShowNasaDossier] = useState(false);
  const [sfxEnabled, setSfxEnabled] = useState(sound.enabled);

  const bodyMeta = getCelestialBodyMeta(orbit.centralBody);
  const unlimitedBudget = Boolean(budget.isBudgetUnlimited || isBudgetUnlimited(budget.budgetLimitM));
  const nasaMission = getNasaMissionProfile(orbit.centralBody, orbit.id);

  React.useEffect(() => {
    if (!requestedTab) return;
    setActiveTab(normalizeTab(requestedTab));
    setIsDockExpanded(true);
    onConsumeRequestedTab?.();
  }, [requestedTab, onConsumeRequestedTab]);

  React.useEffect(() => {
    onTabChange?.(activeTab);
  }, [activeTab, onTabChange]);

  const toggleSfx = () => {
    sound.enabled = !sound.enabled;
    setSfxEnabled(sound.enabled);
    if (sound.enabled) sound.playClick(900);
  };

  const diffProfile = DIFFICULTY_PROFILES[assistDifficulty];
  const synergies = useMemo(() => evaluateSynergies(design), [design]);
  const roleKey = activeRole as TeamRole | undefined;
  const ownedTabs = roleKey ? TEAM_ROLE_TABS[roleKey] : undefined;
  const isRoleLockedOut = Boolean(
    roomCode && roleKey && strictRoleLock && ownedTabs && !ownedTabs.includes(activeTab)
  );
  const activeGuide = TAB_EDUCATIONAL_GUIDES[activeTab];

  const currentStructure = data.structures.find((s) => s.id === design.structureId) || data.structures[0];
  const currentAdcs = data.adcs.find((a) => a.id === design.adcsId) || data.adcs[0];
  const selectedInstruments = data.instruments.filter((i) => design.instrumentIds.includes(i.id));

  const projectedReport = useMemo(
    () => evaluateMissionDesign(design, budget, scenario, data.instruments, orbit, realMissions),
    [design, budget, scenario, data.instruments, orbit]
  );

  const goalsEval = useMemo(
    () =>
      evaluateMissionGoals({
        mission,
        design,
        budget,
        orbit,
        scenario,
        targetSciencePoints
      }),
    [mission, design, budget, orbit, scenario, targetSciencePoints]
  );

  const toggleInstrument = (instId: string) => {
    if (isRoleLockedOut) {
      sound.playAlarm();
      return;
    }
    onChangeDesign((prev) => {
      const exists = prev.instrumentIds.includes(instId);
      if (exists) {
        sound.playClick(600);
        return {
          ...prev,
          instrumentIds: prev.instrumentIds.filter((id) => id !== instId)
        };
      }
      sound.playEquip();
      return {
        ...prev,
        instrumentIds: [...prev.instrumentIds, instId]
      };
    });
  };

  const handleSelectSubsystem = (key: keyof SpacecraftDesign, value: string) => {
    if (isRoleLockedOut) {
      sound.playAlarm();
      return;
    }
    sound.playEquip();
    onChangeDesign((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const frameOk = budget.payloadMassKg <= currentStructure.maxPayloadMassKg;
  const powerOk = budget.daylightPowerBalanceW >= 0 && budget.isPowerFeasible;
  const adcsOk = budget.isPointingFeasible && budget.environmentCompatible;
  const commsOk = budget.isDataFeasible;
  const launchOk = budget.isMassFeasible && budget.isCostFeasible;

  const tabHealth: Record<DockTab, boolean> = {
    payload: selectedInstruments.length > 0,
    power_bus: frameOk && powerOk,
    systems: adcsOk && commsOk,
    launch: launchOk
  };

  const readinessFaults: { label: string; fixLabel: string; tab: DockTab }[] = [];
  if (selectedInstruments.length === 0) {
    readinessFaults.push({
      label: 'No Science Sensors equipped',
      fixLabel: 'Add Sensor',
      tab: 'payload'
    });
  }
  if (!frameOk) {
    readinessFaults.push({
      label: `Payload (${Math.round(budget.payloadMassKg)}kg) exceeds Frame max (${currentStructure.maxPayloadMassKg}kg)`,
      fixLabel: 'Upgrade Frame',
      tab: 'power_bus'
    });
  }
  if (!powerOk) {
    readinessFaults.push({
      label:
        budget.daylightPowerBalanceW < 0
          ? `Daylight power deficit (${Math.round(budget.daylightPowerBalanceW)}W)`
          : `Eclipse battery depth high (${budget.batteryDoDPercent.toFixed(0)}% DoD)`,
      fixLabel: 'Fix Power/Bat',
      tab: 'power_bus'
    });
  }
  if (!adcsOk) {
    readinessFaults.push({
      label: !budget.environmentCompatible
        ? `Check ADCS / Radiation protection for ${bodyMeta.shortName}`
        : `Aiming ±${budget.spacecraftPointingDeg}° too loose for payload`,
      fixLabel: 'Fix Systems',
      tab: 'systems'
    });
  }
  if (!commsOk) {
    readinessFaults.push({
      label: `Daily data (${budget.dailyDataGenGb.toFixed(0)}GB) > downlink (${budget.dailyDownlinkCapacityGb.toFixed(0)}GB)`,
      fixLabel: 'Upgrade Dish',
      tab: 'systems'
    });
  }
  if (!budget.isMassFeasible) {
    readinessFaults.push({
      label: `Craft (${Math.round(budget.totalMassKg)}kg) > Rocket cap (${budget.maxLaunchCapacityKg}kg)`,
      fixLabel: 'Bigger Rocket',
      tab: 'launch'
    });
  }
  if (!budget.isCostFeasible) {
    readinessFaults.push({
      label: `Over budget ($${budget.totalCostM.toFixed(1)}M / $${budget.budgetLimitM}M)`,
      fixLabel: 'Trim Cost',
      tab: 'launch'
    });
  }

  const primaryFault = readinessFaults[0];
  const hasCritical = readinessFaults.length > 0 || budget.criticalIssues.length > 0;

  const tabsMeta: { id: DockTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'payload',
      label: '01 SENSORS',
      icon: <Layers className="w-3.5 h-3.5" />,
      badge: selectedInstruments.length > 0 ? `${selectedInstruments.length}` : '0'
    },
    { id: 'power_bus', label: '02 BODY & POWER', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'systems', label: '03 GUIDANCE & COMMS', icon: <Compass className="w-3.5 h-3.5" /> },
    { id: 'launch', label: '04 ROCKET & ORBIT', icon: <Globe className="w-3.5 h-3.5" /> }
  ];

  const handleActionClick = () => {
    if (primaryFault) {
      sound.playClick(780);
      setActiveTab(primaryFault.tab);
      setIsDockExpanded(true);
    } else if (budget.criticalIssues.length > 0) {
      sound.playClick(780);
      setActiveTab(guessFixTab(budget.criticalIssues[0]));
      setIsDockExpanded(true);
    } else {
      sound.playCountdownBeep(true);
      onLaunch();
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-4 select-none overflow-hidden">
      {/* 1. SINGLE CLEAN TOP FLIGHT CONTROL STRIP */}
      <div className="pointer-events-auto max-w-[1440px] mx-auto w-full flex flex-wrap items-center justify-between gap-2">
        {/* Left: Contract & Destination Identity */}
        <div className="game-frame px-3 py-1.5 flex items-center gap-2.5">
          <button
            onClick={() => {
              sound.playClick();
              onOpenScenarioPicker();
            }}
            title="Back to NASA Starmap"
            className="hover:scale-105 transition-transform shrink-0"
          >
            <NasaCrest size={30} />
          </button>

          <div className="min-w-0 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="nasa-crest text-[9px] px-1.5 py-0.5 text-white font-black uppercase">
                {missionNumber ? `M${String(missionNumber).padStart(2, '0')}` : 'EXPLORE'}
              </span>
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenScenarioPicker();
                }}
                className="text-xs font-black text-white tracking-wider hover:text-sky-300 truncate max-w-[190px] uppercase"
              >
                {scenario.title}
              </button>
              <input
                type="text"
                value={design.name}
                maxLength={20}
                onChange={(e) => onChangeDesign((prev) => ({ ...prev, name: e.target.value }))}
                aria-label="Spacecraft name"
                className="hidden sm:inline-block bg-space-950/80 border border-slate-700/80 focus:border-sky-400 px-1.5 py-0.5 text-[10px] text-sky-200 font-bold w-24 focus:outline-none uppercase"
              />
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
              {onOpenBodySelector ? (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick(920);
                    onOpenBodySelector();
                  }}
                  className="inline-flex items-center gap-1 text-sky-300 hover:text-white font-bold tracking-wider"
                >
                  <WorldCompass className="w-3 h-3 text-amber-300" />
                  <span>{bodyMeta.shortName.toUpperCase()} &bull; {orbit.name} ▾</span>
                </button>
              ) : (
                <span>{bodyMeta.shortName} &bull; {orbit.name}</span>
              )}
            </div>
          </div>
        </div>

        {/* Center/Right: 3 Core Gauges + Crisp Utility Buttons */}
        <div className="game-frame flex items-center gap-2 overflow-x-auto px-3 py-1.5 font-mono text-xs">
          <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-800 shrink-0">
            <Weight className="w-3.5 h-3.5 text-sky-400" />
            <div>
              <div className="text-[8px] text-slate-400">MASS</div>
              <div className={`font-black text-[11px] ${budget.isMassFeasible ? 'text-white' : 'text-red-400'}`}>
                {budget.totalMassKg.toFixed(0)}/{budget.maxLaunchCapacityKg}kg
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-800 shrink-0">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <div>
              <div className="text-[8px] text-slate-400">POWER</div>
              <div className={`font-black text-[11px] ${powerOk ? 'text-emerald-400' : 'text-red-400'}`}>
                {budget.daylightPowerBalanceW >= 0 ? `+${budget.daylightPowerBalanceW.toFixed(0)}W` : `${budget.daylightPowerBalanceW.toFixed(0)}W`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-800 shrink-0">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <div>
              <div className="text-[8px] text-slate-400">COST</div>
              <div className={`font-black text-[11px] ${budget.isCostFeasible ? (unlimitedBudget ? 'text-emerald-300' : 'text-white') : 'text-red-400'}`}>
                {unlimitedBudget ? `$${budget.totalCostM.toFixed(0)}M/∞` : `$${budget.totalCostM.toFixed(0)}M/${budget.budgetLimitM}M`}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playClick(840);
              setShowNasaDossier((v) => !v);
            }}
            className={`game-chip px-2 py-1 border text-[10px] font-black flex items-center gap-1 shrink-0 ${
              showNasaDossier
                ? 'bg-[#0b3d91] border-sky-300 text-white'
                : 'bg-space-950 border-sky-500/40 text-sky-300 hover:border-sky-300'
            }`}
            title={`Inspect exact NASA reference satellite (${nasaMission.satelliteName})`}
          >
            <NasaSatIcon className="w-3 h-3 text-amber-300" />
            <span>{nasaMission.shortCallsign}</span>
          </button>

          {onOpenTutorial && (
            <button
              type="button"
              onClick={() => {
                sound.playClick(940);
                onOpenTutorial();
              }}
              className="game-chip px-2 py-1 bg-[#fc3d21]/20 border border-[#fc3d21]/65 text-amber-200 hover:bg-[#fc3d21]/35 text-[10px] font-black flex items-center gap-1 shrink-0"
            >
              <AcademyCap className="w-3 h-3" />
              <span className="hidden sm:inline">LEARN</span>
            </button>
          )}

          {onOpenFieldGuide && (
            <button
              onClick={() => {
                sound.playClick(860);
                onOpenFieldGuide();
              }}
              className="game-chip px-2 py-1 bg-[#0b3d91]/70 border border-sky-400/40 text-sky-100 hover:brightness-125 text-[10px] font-black flex items-center gap-1 shrink-0"
            >
              <BookOpen className="w-3 h-3" />
              <span className="hidden sm:inline">GUIDE</span>
            </button>
          )}

          <button
            onClick={() => {
              sound.playClick();
              onOpenMultiplayer();
            }}
            className={`game-chip px-2 py-1 border text-[10px] font-black flex items-center gap-1 shrink-0 ${
              roomCode
                ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                : 'bg-space-950 border-slate-700 text-slate-300 hover:border-sky-400'
            }`}
          >
            <Users className="w-3 h-3" />
            <span className="hidden sm:inline">{roomCode || 'CO-OP'}</span>
          </button>

          <button
            onClick={toggleSfx}
            aria-label={sfxEnabled ? 'Mute SFX' : 'Enable SFX'}
            className="game-chip p-1.5 bg-space-950 border border-slate-700 hover:border-sky-400 text-slate-300 shrink-0"
          >
            {sfxEnabled ? <Volume2 className="w-3.5 h-3.5 text-sky-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* 2. OPEN 3D HANGAR CENTER + COMPACT LEFT MISSION GOALS CHECKLIST */}
      <div className="flex-1 relative flex items-start justify-between gap-3 py-2 pointer-events-none">
        {/* Left: Live Interactive Mission Contract Checklist */}
        <div className="pointer-events-auto game-frame w-72 sm:w-80 overflow-hidden font-mono text-xs shadow-2xl">
          <button
            type="button"
            onClick={() => {
              sound.playClick(760);
              setIsGoalsOpen((v) => !v);
            }}
            className="w-full px-3 py-2 bg-space-950/90 border-b border-slate-800 flex items-center justify-between gap-2 text-left"
          >
            <div className="flex items-center gap-1.5">
              <Target className={`w-3.5 h-3.5 ${hasCritical ? 'text-[#fc3d21]' : 'text-emerald-400'}`} />
              <span className="text-[10px] font-black text-white tracking-wider uppercase">
                MISSION GOALS ({goalsEval.buildCompletedCount}/{goalsEval.buildTotalCount} BUILD)
              </span>
            </div>
            <span className="text-[10px] text-sky-300 font-bold flex items-center gap-1">
              <span>{projectedReport.letterGrade}</span>
              {isGoalsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>

          {isGoalsOpen && (
            <div className="p-2.5 space-y-2 max-h-[38vh] overflow-y-auto">
              <div className="space-y-1.5">
                {goalsEval.goals.map((goal) => {
                  const canJump = Boolean(goal.suggestedTab);
                  const isBuild = goal.phase === 'BUILD';
                  return (
                    <button
                      type="button"
                      key={goal.id}
                      onClick={() => {
                        if (!canJump) return;
                        sound.playClick(780);
                        setActiveTab(goal.suggestedTab!);
                        setIsDockExpanded(true);
                      }}
                      className={`w-full text-left px-2 py-1.5 border transition-colors ${
                        goal.completed
                          ? 'bg-emerald-950/45 border-emerald-500/45'
                          : isBuild
                          ? 'bg-space-950/90 border-slate-800 hover:border-sky-500/60'
                          : 'bg-space-950/55 border-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {goal.completed ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <span
                              className={`text-[8px] font-black px-1 py-0.2 border shrink-0 ${
                                isBuild
                                  ? 'border-sky-500/50 text-sky-300 bg-sky-950/40'
                                  : goal.phase === 'FLIGHT'
                                  ? 'border-amber-500/50 text-amber-300 bg-amber-950/30'
                                  : 'border-emerald-500/40 text-emerald-300 bg-emerald-950/20'
                              }`}
                            >
                              {goal.phase}
                            </span>
                          )}
                          <span
                            className={`text-[11px] font-bold truncate ${
                              goal.completed ? 'text-emerald-200' : 'text-white'
                            }`}
                          >
                            {goal.title}
                          </span>
                        </div>
                        <span className="text-[9px] text-amber-300 font-black shrink-0">
                          +{goal.xpBonus}XP
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans mt-0.5 leading-snug">
                        {goal.detail}
                      </div>
                    </button>
                  );
                })}
              </div>

              {synergies.active.length > 0 && (
                <div className="px-2 py-1 bg-amber-950/35 border border-amber-500/45 flex items-center justify-between text-[10px]">
                  <span className="text-amber-300 font-black flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {synergies.active[0].title}
                  </span>
                  <span className="text-emerald-300 font-bold">
                    +{Math.round((synergies.totalYieldMultiplier - 1) * 100)}% YIELD
                  </span>
                </div>
              )}

              {/* Only show preflight fault box if something blocks launch */}
              {primaryFault ? (
                <button
                  type="button"
                  onClick={handleActionClick}
                  className="w-full px-2.5 py-2 bg-[#fc3d21]/20 border border-[#fc3d21] text-left flex items-center justify-between gap-2 hover:bg-[#fc3d21]/30 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-[9px] font-black text-red-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" /> PREFLIGHT BLOCKER ({readinessFaults.length})
                    </div>
                    <div className="text-[10px] text-white font-sans truncate">{primaryFault.label}</div>
                  </div>
                  <span className="px-2 py-1 bg-[#fc3d21] text-white text-[9px] font-black shrink-0 flex items-center gap-1">
                    {primaryFault.fixLabel} <ArrowRight className="w-3 h-3" />
                  </span>
                </button>
              ) : (
                <div className="px-2.5 py-1.5 bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-[10px] font-black flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> FLIGHT CERTIFIED
                  </span>
                  <span className="text-white">READY &rarr;</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Optional Toggleable Right Drawer: Exact NASA Reference Hardware */}
        {showNasaDossier ? (
          <div className="pointer-events-auto game-frame w-72 sm:w-80 p-3 space-y-2 font-mono text-xs shadow-2xl max-h-[38vh] flex flex-col">
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2 shrink-0">
              <div className="min-w-0">
                <div className="text-[9px] font-black text-sky-400 tracking-widest uppercase">
                  NASA SPEC // {bodyMeta.shortName}
                </div>
                <div className="font-black text-white text-xs truncate">{nasaMission.satelliteName}</div>
                <div className="text-[10px] text-slate-400 truncate">{nasaMission.agencyAndYear}</div>
              </div>
              <button
                type="button"
                onClick={() => setShowNasaDossier(false)}
                className="text-slate-400 hover:text-white text-[10px] shrink-0"
              >
                [CLOSE]
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 text-[10px] bg-space-950/90 border border-slate-800 px-2 py-1 shrink-0">
              <span className="text-slate-300 truncate">
                LV: <strong className="text-white">{nasaMission.realLaunchVehicle}</strong>
              </span>
              {unlimitedBudget && (
                <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-black text-[9px] shrink-0">
                  ∞ BUDGET
                </span>
              )}
            </div>

            <div className="overflow-y-auto space-y-1.5 pr-1 flex-1 min-h-0">
              {nasaMission.hardwareItems.map((item) => (
                <div
                  key={item.slot}
                  className="bg-space-950/85 border border-slate-800/90 px-2 py-1.5 space-y-0.5"
                >
                  <div className="flex items-center justify-between gap-1 text-[9px] font-black">
                    <span className="text-amber-300">{item.slot}</span>
                    <span className="text-sky-300/90 truncate max-w-[140px]">{item.simItemId}</span>
                  </div>
                  <div className="text-[11px] font-bold text-white leading-tight">{item.realNasaItem}</div>
                </div>
              ))}
            </div>

            {onEquipNasaMission && (
              <button
                type="button"
                onClick={() => {
                  sound.playEquip();
                  onEquipNasaMission();
                }}
                className="game-chip w-full py-1.5 px-2.5 nasa-btn-primary text-[10px] font-black tracking-wider flex items-center justify-center gap-1.5 shrink-0"
              >
                <EquipWrench className="w-3.5 h-3.5 text-[#fc3d21]" />
                <span>LOAD {nasaMission.shortCallsign} BUILD</span>
              </button>
            )}
          </div>
        ) : (
          <div />
        )}
      </div>

      {/* 3. STREAMLINED 4-STEP BOTTOM ASSEMBLY DOCK */}
      <div className="pointer-events-auto max-w-[1440px] mx-auto w-full game-frame overflow-hidden">
        {/* Clean 4-Tab Bar + Primary Launch Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-slate-800 bg-space-950/90 font-mono">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {tabsMeta.map((tab) => {
              const isActive = activeTab === tab.id && isDockExpanded;
              const healthy = tabHealth[tab.id];
              const isOwned = Boolean(ownedTabs && ownedTabs.includes(tab.id));
              const isLocked = Boolean(roomCode && ownedTabs && strictRoleLock && !isOwned);
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    sound.playClick(760);
                    setActiveTab(tab.id);
                    setIsDockExpanded(true);
                  }}
                  className={`game-chip flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black border transition-all shrink-0 ${
                    isActive
                      ? 'bg-[#0b3d91] border-sky-300 text-white'
                      : !healthy
                      ? 'bg-red-950/55 border-red-400 text-red-200'
                      : 'bg-space-900/90 border-slate-800 text-slate-300 hover:border-sky-500/50 hover:text-white'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      healthy ? 'bg-emerald-400' : 'bg-[#fc3d21] animate-ping'
                    }`}
                  />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="px-1 bg-space-950/80 text-[9px] text-sky-300">{tab.badge}</span>
                  )}
                  {isLocked && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                sound.playClick();
                onChangeViewportMode(viewportMode === 'orbit' ? 'hangar' : 'orbit');
              }}
              className="hidden sm:flex game-chip px-2.5 py-1.5 bg-space-900 border border-slate-700 hover:border-sky-400 text-sky-300 text-[10px] font-black items-center gap-1"
              title="Toggle between VAB Hangar and Orbit Preview"
            >
              <Eye className="w-3 h-3" />
              <span>{viewportMode === 'orbit' ? 'VAB VIEW' : 'ORBIT VIEW'}</span>
            </button>

            {onAutoFitBlueprint && diffProfile.allowAutoFit && (
              <button
                onClick={() => {
                  sound.playEquip();
                  onAutoFitBlueprint();
                }}
                title="Auto-equip recommended NASA build"
                className="game-chip px-2.5 py-1.5 bg-[#0b3d91]/80 border border-sky-400/50 text-sky-100 hover:brightness-125 text-[10px] font-black flex items-center gap-1"
              >
                <Wand2 className="w-3 h-3 text-amber-300" />
                <span className="hidden sm:inline">AUTO-FIT</span>
              </button>
            )}

            <button
              onClick={() => {
                sound.playClick(500);
                onReset();
              }}
              title="Reset Craft"
              className="game-chip p-1.5 bg-space-900 border border-slate-700 text-slate-400 hover:text-red-400"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsDockExpanded((v) => !v)}
              title={isDockExpanded ? 'Minimize Tray' : 'Expand Tray'}
              className="game-chip p-1.5 bg-space-900 border border-slate-700 text-slate-300 hover:text-white"
            >
              {isDockExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            <button
              onClick={handleActionClick}
              className={`game-blade px-5 py-2 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                hasCritical
                  ? 'bg-red-950/90 border-l-4 border-[#fc3d21] text-red-100 hover:bg-red-900'
                  : 'nasa-btn-launch hover:brightness-110 hover:scale-[1.03]'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>
                {primaryFault ? primaryFault.fixLabel : hasCritical ? 'FIX FAULT' : 'LAUNCH MISSION'}
              </span>
            </button>
          </div>
        </div>

        {/* Clean Airy Part Cards Container */}
        {isDockExpanded && (
          <div className="p-3 space-y-2.5">
            {roomCode && roleKey && TEAM_ROLE_GOALS[roleKey] && (
              <div className="text-[10px] font-mono px-2.5 py-1 bg-[#0b3d91]/35 border border-sky-400/35 text-sky-100">
                <strong>{roleKey.toUpperCase()}:</strong>{' '}
                {isRoleLockedOut ? 'Tab locked by another squad role' : TEAM_ROLE_GOALS[roleKey]}
              </div>
            )}

            <div
              className={`max-h-[210px] overflow-y-auto pr-1 space-y-3 ${
                isRoleLockedOut ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              {/* TAB 1: SENSORS (PAYLOAD) */}
              {activeTab === 'payload' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {data.instruments.map((inst) => {
                    const isMounted = design.instrumentIds.includes(inst.id);
                    const isBonus = scenario.scoringBonusInstruments.includes(inst.id);
                    const pointingErr = inst.minPointingAccuracyDeg < currentAdcs.pointingAccuracyDeg;
                    return (
                      <button
                        type="button"
                        key={inst.id}
                        onClick={() => toggleInstrument(inst.id)}
                        className={`text-left p-2.5 game-chip flex flex-col justify-between gap-1.5 font-mono ${
                          isMounted ? 'nasa-card-active' : 'nasa-card'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-black text-white text-xs leading-tight">{inst.name}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 font-black shrink-0 ${
                                isMounted ? 'bg-emerald-400 text-black' : 'bg-space-950 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {isMounted ? 'ARMED' : '+ EQUIP'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300/85 font-sans line-clamp-1 mt-0.5">
                            {inst.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-700/60 text-slate-300">
                          <div className="flex items-center gap-2">
                            <span>{inst.massKg}kg</span>
                            <span className="text-amber-300">{inst.powerWatts}W</span>
                            <span className="text-emerald-300 font-bold">${inst.costM}M</span>
                          </div>
                          {isBonus ? (
                            <span className="text-[9px] text-emerald-300 font-black">★ GOAL MATCH</span>
                          ) : pointingErr ? (
                            <span className="text-[9px] text-amber-300 font-bold">±{inst.minPointingAccuracyDeg}°</span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: BODY & POWER (FRAME + POWER SOURCE + BATTERY) */}
              {activeTab === 'power_bus' && (
                <div className="space-y-3 font-mono">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-black mb-1.5">
                      <span className="text-sky-300">A. SPACECRAFT FRAME (MAX PAYLOAD {currentStructure.maxPayloadMassKg}kg)</span>
                      <span className={frameOk ? 'text-emerald-400' : 'text-red-400'}>
                        {frameOk ? '✓ FITS PAYLOAD' : '⚠ TOO SMALL'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {data.structures.map((st) => {
                        const sel = st.id === design.structureId;
                        const fits = budget.payloadMassKg <= st.maxPayloadMassKg;
                        return (
                          <button
                            type="button"
                            key={st.id}
                            onClick={() => handleSelectSubsystem('structureId', st.id)}
                            className={`text-left p-2.5 game-chip flex flex-col justify-between gap-1 ${
                              sel ? 'nasa-card-active' : 'nasa-card'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-black text-white text-xs">{st.name}</span>
                              <span className="text-[10px] text-emerald-300 font-black">${st.costM}M</span>
                            </div>
                            <div className="flex justify-between text-[10px] pt-1 border-t border-slate-700/60">
                              <span className="text-slate-300">Dry {st.dryMassKg}kg</span>
                              <span className={fits ? 'text-sky-300 font-bold' : 'text-red-400 font-bold'}>
                                Max {st.maxPayloadMassKg}kg
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[10px] font-black mb-1.5">
                      <span className="text-amber-300">B. SOLAR ARRAYS &amp; NUCLEAR RTG ({Math.round(bodyMeta.solarFluxMultiplier * 100)}% SUNLIGHT AT {bodyMeta.shortName.toUpperCase()})</span>
                      <span className={budget.daylightPowerBalanceW >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        NET {budget.daylightPowerBalanceW >= 0 ? `+${Math.round(budget.daylightPowerBalanceW)}W` : `${Math.round(budget.daylightPowerBalanceW)}W`}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {data.powerGeneration.map((pwr) => {
                        const sel = pwr.id === design.powerGenId;
                        const rtg = isNuclearRtgPower(pwr.id);
                        return (
                          <button
                            type="button"
                            key={pwr.id}
                            onClick={() => handleSelectSubsystem('powerGenId', pwr.id)}
                            className={`text-left p-2.5 game-chip flex flex-col justify-between gap-1 ${
                              sel ? 'nasa-card-active' : 'nasa-card'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-black text-white text-xs">{pwr.name}</span>
                              <span className="text-[10px] text-amber-300 font-black">{pwr.powerOutputWatts}W</span>
                            </div>
                            <div className="flex justify-between text-[10px] pt-1 border-t border-slate-700/60">
                              <span className="text-sky-300">{rtg ? 'Pu-238 Nuclear' : pwr.sunTracking ? 'Tracking Solar' : 'Fixed Solar'}</span>
                              <span className="text-emerald-300 font-bold">${pwr.costM}M</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[10px] font-black mb-1.5">
                      <span className="text-emerald-300">C. ECLIPSE BATTERY BANK ({orbit.eclipseMinutes}m SHADOW PER ORBIT)</span>
                      <span className={budget.isPowerFeasible ? 'text-emerald-400' : 'text-red-400'}>
                        {budget.batteryDoDPercent.toFixed(0)}% DoD
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {data.energyStorage.map((bat) => {
                        const sel = bat.id === design.energyStorageId;
                        return (
                          <button
                            type="button"
                            key={bat.id}
                            onClick={() => handleSelectSubsystem('energyStorageId', bat.id)}
                            className={`text-left p-2.5 game-chip flex flex-col justify-between gap-1 ${
                              sel ? 'nasa-card-active' : 'nasa-card'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-black text-white text-xs">{bat.name}</span>
                              <span className="text-[10px] text-amber-300 font-black">{bat.capacityWh}Wh</span>
                            </div>
                            <div className="flex justify-between text-[10px] pt-1 border-t border-slate-700/60">
                              <span className="text-slate-300">{bat.massKg}kg</span>
                              <span className="text-emerald-300 font-bold">${bat.costM}M</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: GUIDANCE & COMMS (ADCS + ANTENNA + OBC/THERMAL) */}
              {activeTab === 'systems' && (
                <div className="space-y-3 font-mono">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-black mb-1.5">
                      <span className="text-sky-300">A. POINTING &amp; STABILIZATION (ADCS)</span>
                      <span className={adcsOk ? 'text-emerald-400' : 'text-red-400'}>
                        {adcsOk ? `✓ ±${budget.spacecraftPointingDeg}° OK` : '⚠ NEEDS UPGRADE'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {data.adcs.map((item) => {
                        const sel = item.id === design.adcsId;
                        const noGeo = item.requiresMagneticField && !bodyMeta.hasMagnetosphere;
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => handleSelectSubsystem('adcsId', item.id)}
                            className={`text-left p-2.5 game-chip flex flex-col justify-between gap-1 ${
                              sel ? 'nasa-card-active' : 'nasa-card'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-black text-white text-xs">{item.name}</span>
                              <span className="text-[10px] text-sky-300 font-black">±{item.pointingAccuracyDeg}°</span>
                            </div>
                            <div className="flex justify-between text-[10px] pt-1 border-t border-slate-700/60">
                              <span className={noGeo ? 'text-red-400 font-bold' : 'text-amber-300'}>
                                {noGeo ? 'No B-Field Here' : `${item.powerWatts}W`}
                              </span>
                              <span className="text-emerald-300 font-bold">${item.costM}M</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[10px] font-black mb-1.5">
                      <span className="text-sky-300">B. DOWNLINK ANTENNA &amp; RADIO</span>
                      <span className={commsOk ? 'text-emerald-400' : 'text-red-400'}>
                        {budget.dailyDownlinkCapacityGb.toFixed(0)} GB/day
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {data.communications.map((comm) => {
                        const sel = comm.id === design.commsId;
                        return (
                          <button
                            type="button"
                            key={comm.id}
                            onClick={() => handleSelectSubsystem('commsId', comm.id)}
                            className={`text-left p-2.5 game-chip flex flex-col justify-between gap-1 ${
                              sel ? 'nasa-card-active' : 'nasa-card'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-black text-white text-xs">{comm.name}</span>
                              <span className="text-[10px] text-sky-300 font-black">{comm.downlinkRateMbps} Mbps</span>
                            </div>
                            <div className="flex justify-between text-[10px] pt-1 border-t border-slate-700/60">
                              <span className="text-amber-300">{comm.powerWatts}W</span>
                              <span className="text-emerald-300 font-bold">${comm.costM}M</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-black text-amber-300 mb-1.5">
                      C. FLIGHT COMPUTER (OBC) &amp; THERMAL CONTROL
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {data.obc.map((item) => {
                        const sel = item.id === design.obcId;
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => handleSelectSubsystem('obcId', item.id)}
                            className={`text-left p-2.5 game-chip flex flex-col justify-between gap-1 ${
                              sel ? 'nasa-card-active' : 'nasa-card'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-black text-white text-xs">{item.name}</span>
                              <span className="text-[10px] text-sky-300 font-bold">{item.storageGb}GB</span>
                            </div>
                            <div className="flex justify-between text-[10px] pt-1 border-t border-slate-700/60">
                              <span className="text-slate-400">CPU</span>
                              <span className="text-emerald-300 font-bold">${item.costM}M</span>
                            </div>
                          </button>
                        );
                      })}
                      {data.thermal.map((thm) => {
                        const sel = thm.id === design.thermalId;
                        return (
                          <button
                            type="button"
                            key={thm.id}
                            onClick={() => handleSelectSubsystem('thermalId', thm.id)}
                            className={`text-left p-2.5 game-chip flex flex-col justify-between gap-1 ${
                              sel ? 'nasa-card-active' : 'nasa-card'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-black text-white text-xs">{thm.name}</span>
                              <span className="text-[10px] text-amber-300 font-bold">{thm.powerWatts}W</span>
                            </div>
                            <div className="flex justify-between text-[10px] pt-1 border-t border-slate-700/60">
                              <span className="text-slate-400">THERMAL</span>
                              <span className="text-emerald-300 font-bold">${thm.costM}M</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ROCKET & ORBIT */}
              {activeTab === 'launch' && (
                <div className="space-y-3 font-mono">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-black mb-1.5">
                      <span className="text-red-400">A. LAUNCH VEHICLE (CRAFT MASS: {Math.round(budget.totalMassKg)} kg)</span>
                      <span className={budget.isMassFeasible ? 'text-emerald-400' : 'text-red-400'}>
                        {budget.isMassFeasible ? `✓ ${budget.massMarginPercent.toFixed(0)}% LIFT MARGIN` : '⚠ OVERWEIGHT'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {data.launchVehicles.map((l) => {
                        const sel = l.id === design.launchVehicleId;
                        const cap = getLaunchCapacityForOrbit(l, orbit);
                        return (
                          <button
                            type="button"
                            key={l.id}
                            onClick={() => handleSelectSubsystem('launchVehicleId', l.id)}
                            className={`text-left p-2.5 game-chip flex flex-col justify-between gap-1 ${
                              sel ? 'nasa-card-active' : 'nasa-card'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-black text-white text-xs">{l.name}</span>
                              <span className="text-[10px] text-emerald-300 font-black">${l.costM}M</span>
                            </div>
                            <div className="flex justify-between text-[10px] pt-1 border-t border-slate-700/60">
                              <span className={cap >= budget.totalMassKg ? 'text-sky-300 font-bold' : 'text-red-400 font-bold'}>
                                {cap > 0 ? `Lift ${cap.toLocaleString()}kg` : 'NO REACH'}
                              </span>
                              <span className="text-slate-400">{(l.reliabilityRating * 100).toFixed(0)}%</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-black text-sky-300">B. TARGET ORBIT &amp; DESTINATION WORLD</span>
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setTrajectoryBodyFilter('all')}
                          className={`px-1.5 py-0.5 text-[9px] font-black border ${
                            trajectoryBodyFilter === 'all'
                              ? 'bg-[#105bd8] border-sky-400 text-white'
                              : 'bg-space-950 border-slate-700 text-slate-400'
                          }`}
                        >
                          ALL
                        </button>
                        {CELESTIAL_BODY_LIST.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setTrajectoryBodyFilter(b.id)}
                            className={`px-1.5 py-0.5 text-[9px] font-black border uppercase ${
                              trajectoryBodyFilter === b.id
                                ? 'bg-[#105bd8] border-sky-400 text-white'
                                : 'bg-space-950 border-slate-700 text-slate-400'
                            }`}
                          >
                            {b.shortName}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {data.orbits
                        .filter((o) => trajectoryBodyFilter === 'all' || o.centralBody === trajectoryBodyFilter)
                        .map((o) => {
                          const sel = o.id === design.orbitId;
                          const rec = scenario.targetOrbits.includes(o.id);
                          const orbBody = getCelestialBodyMeta(o.centralBody);
                          return (
                            <button
                              type="button"
                              key={o.id}
                              onClick={() => handleSelectSubsystem('orbitId', o.id)}
                              className={`text-left p-2.5 game-chip flex flex-col justify-between gap-1 ${
                                sel ? 'nasa-card-active' : 'nasa-card'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-black text-white text-xs truncate">{o.name}</span>
                                {rec && (
                                  <span className="text-[8px] px-1 bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-black shrink-0">
                                    GOAL
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-300 pt-1 border-t border-slate-700/60">
                                {orbBody.shortName} &bull; Flux {Math.round(orbBody.solarFluxMultiplier * 100)}% &bull; {o.eclipseMinutes}m Ecl
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {diffProfile.showEngineeringHints && activeGuide && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-800/80 text-[10px] font-mono text-slate-300">
                <div>
                  <strong className="text-sky-300">TIP:</strong> {activeGuide.tradeOffTip}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
