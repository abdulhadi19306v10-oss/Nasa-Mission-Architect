import React, { useState, useEffect } from 'react';
import { SpacecraftDesign, ResourceBudget, MissionEvent, Orbit, Scenario } from '@sim/index';
import { sound } from '../../utils/soundEngine';
import { triggerConfetti } from '../../utils/confetti';
import {
  Play,
  Pause,
  Zap,
  Radio,
  Eye,
  Award,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  ShieldCheck,
  Send
} from 'lucide-react';

interface OperationsSimulatorProps {
  design: SpacecraftDesign;
  budget: ResourceBudget;
  orbit: Orbit;
  scenario: Scenario;
  events: MissionEvent[];
  onCompleteOperations: (finalEvents: MissionEvent[]) => void;
}

export const OperationsSimulator: React.FC<OperationsSimulatorProps> = ({
  design,
  budget,
  orbit,
  scenario,
  events: initialEvents,
  onCompleteOperations
}) => {
  const totalMissionDays = Math.round(scenario.targetLifetimeYears * 365);
  const [currentDay, setCurrentDay] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(10);
  const [events, setEvents] = useState<MissionEvent[]>(initialEvents);
  const [activeAnomaly, setActiveAnomaly] = useState<MissionEvent | null>(null);

  // Active Mini-game state
  const [sciencePoints, setSciencePoints] = useState(100);
  const [scienceDataGb, setScienceDataGb] = useState(0);
  const [isScanActive, setIsScanActive] = useState(false);
  const [groundPassAvailable, setGroundPassAvailable] = useState(false);
  const [payloadPowerMode, setPayloadPowerMode] = useState<'NOMINAL' | 'HIGH_POWER' | 'ECO'>('NOMINAL');

  // Trigger occasional ground passes
  useEffect(() => {
    const passInterval = setInterval(() => {
      if (Math.random() > 0.4) {
        setGroundPassAvailable(true);
        setTimeout(() => setGroundPassAvailable(false), 8000);
      }
    }, 12000);
    return () => clearInterval(passInterval);
  }, []);

  // Time-lapse loop
  useEffect(() => {
    if (!isPlaying || activeAnomaly) return;

    const intervalTime = 100;
    const daysPerStep = Math.max(1, Math.round((speedMultiplier * intervalTime) / 1000));

    const timer = setInterval(() => {
      setCurrentDay((prevDay) => {
        const nextDay = prevDay + daysPerStep;

        // Check if an anomaly triggers
        const triggered = events.find(
          (e) => !e.resolved && e.day >= prevDay && e.day <= nextDay && e.choice
        );

        if (triggered) {
          sound.playAlarm();
          setIsPlaying(false);
          setActiveAnomaly(triggered);
          return triggered.day;
        }

        if (nextDay >= totalMissionDays) {
          setIsPlaying(false);
          return totalMissionDays;
        }

        const mult = payloadPowerMode === 'HIGH_POWER' ? 1.5 : payloadPowerMode === 'ECO' ? 0.6 : 1.0;
        setScienceDataGb((prev) => prev + budget.dailyDataGenGb * daysPerStep * mult);
        return nextDay;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, speedMultiplier, activeAnomaly, totalMissionDays, events, budget.dailyDataGenGb, payloadPowerMode]);

  // Tactical Scan Action
  const handleTriggerScan = () => {
    sound.playEquip();
    setIsScanActive(true);
    setScienceDataGb((prev) => prev + 120);
    setSciencePoints((prev) => prev + 50);

    setTimeout(() => {
      setIsScanActive(false);
    }, 1500);
  };

  // Downlink Action during ground pass
  const handleInitiateDownlink = () => {
    sound.playClick(900);
    setSciencePoints((prev) => prev + Math.round(scienceDataGb * 0.4));
    setGroundPassAvailable(false);
  };

  // Anomaly decision
  const handleSelectOption = (optionIndex: number) => {
    if (!activeAnomaly || !activeAnomaly.choice) return;
    const option = activeAnomaly.choice.options[optionIndex];
    sound.playEquip();

    const updatedEvents = events.map((e) => {
      if (e.id === activeAnomaly.id) {
        return {
          ...e,
          resolved: true,
          impactDescription: `${option.label} → ${option.outcomeText}`
        };
      }
      return e;
    });

    setEvents(updatedEvents);
    setActiveAnomaly(null);
    setIsPlaying(true);
  };

  const progressPercent = Math.min(100, (currentDay / totalMissionDays) * 100);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4">
      {/* Flight Operations Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold uppercase">
            Active Flight Operations
          </span>
          <h2 className="text-2xl font-black text-white hud-heading mt-1">
            Orbital Science Operations & Telemetry
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Direct science observations, ground passes, and payload power scheduling.
          </p>
        </div>

        {currentDay >= totalMissionDays && (
          <button
            onClick={() => {
              triggerConfetti();
              onCompleteOperations(events);
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 hover:scale-105 active:scale-95 text-black font-extrabold font-mono text-xs uppercase tracking-wider shadow-xl shadow-cyan-500/30"
          >
            <Award className="w-4 h-4" />
            <span>Generate NASA Flight Debrief</span>
          </button>
        )}
      </div>

      {/* Main Operations Console */}
      <div className="p-6 rounded-3xl bg-space-950/95 border-2 border-cyan-500/40 shadow-2xl space-y-6">
        {/* Progress & Science Score Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-space-900/80 p-4 rounded-2xl border border-slate-800 space-y-1 font-mono">
            <div className="text-[10px] text-slate-400 uppercase">Mission Elapsed Time</div>
            <div className="text-2xl font-black text-white">
              Day {currentDay.toLocaleString()} <span className="text-xs text-slate-500">/ {totalMissionDays}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-space-950 overflow-hidden border border-slate-800 mt-2">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="bg-space-900/80 p-4 rounded-2xl border border-slate-800 space-y-1 font-mono">
            <div className="text-[10px] text-slate-400 uppercase">Science Data Collected</div>
            <div className="text-2xl font-black text-sky-400">
              {scienceDataGb.toFixed(0)} <span className="text-xs text-slate-500">GB</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Generating +{budget.dailyDataGenGb.toFixed(0)} GB / day
            </div>
          </div>

          <div className="bg-space-900/80 p-4 rounded-2xl border border-slate-800 space-y-1 font-mono">
            <div className="text-[10px] text-slate-400 uppercase">Mission Score XP</div>
            <div className="text-2xl font-black text-emerald-400">
              {sciencePoints.toLocaleString()} <span className="text-xs text-slate-500">PTS</span>
            </div>
            <div className="text-[11px] text-emerald-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> High Return Yield
            </div>
          </div>
        </div>

        {/* Tactical Minigame Action Dock */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Action 1: Science Scan */}
          <button
            onClick={handleTriggerScan}
            disabled={isScanActive}
            className={`p-4 rounded-2xl border transition-all text-left space-y-1 font-mono ${
              isScanActive
                ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                : 'bg-space-900/80 border-slate-800 hover:border-cyan-500/50 hover:bg-space-850'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-cyan-400" /> Observation Swath
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                +120 GB
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Project active sensor beam onto planet surface.
            </div>
          </button>

          {/* Action 2: Ground Downlink */}
          <button
            onClick={handleInitiateDownlink}
            disabled={!groundPassAvailable}
            className={`p-4 rounded-2xl border transition-all text-left space-y-1 font-mono ${
              groundPassAvailable
                ? 'bg-emerald-950/90 border-emerald-400 text-white animate-pulse shadow-lg shadow-emerald-500/20'
                : 'bg-space-900/60 border-slate-800 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-emerald-400" /> Ground Station Pass
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                {groundPassAvailable ? 'PASS ACTIVE' : 'NO CONTACT'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {groundPassAvailable ? 'Click to stream data home!' : 'Waiting for next station pass...'}
            </div>
          </button>

          {/* Action 3: Power Duty Cycle */}
          <div className="p-4 rounded-2xl bg-space-900/80 border border-slate-800 font-mono space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" /> Power Mode
              </span>
              <span className="text-[10px] text-amber-400">{payloadPowerMode}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              {(['ECO', 'NOMINAL', 'HIGH_POWER'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    sound.playClick(600);
                    setPayloadPowerMode(m);
                  }}
                  className={`flex-1 py-1 rounded-lg border transition-all ${
                    payloadPowerMode === m
                      ? 'bg-amber-500 text-black font-bold border-amber-400'
                      : 'bg-space-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center justify-between flex-wrap gap-4 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2 bg-space-900 p-1.5 rounded-2xl border border-slate-800 font-mono">
            <button
              onClick={() => {
                sound.playClick();
                setIsPlaying(!isPlaying);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-space-850 hover:bg-space-800 text-xs text-slate-200 border border-slate-700"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isPlaying ? 'Pause' : 'Resume'}</span>
            </button>

            {[1, 10, 50, 100].map((spd) => (
              <button
                key={spd}
                onClick={() => {
                  sound.playClick();
                  setSpeedMultiplier(spd);
                  setIsPlaying(true);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors ${
                  speedMultiplier === spd
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <div className="text-xs font-mono text-slate-400">
            Target Lifetime: <strong className="text-white">{scenario.targetLifetimeYears} years</strong>
          </div>
        </div>

        {/* Anomaly Decision Dialogue */}
        {activeAnomaly && activeAnomaly.choice && (
          <div className="p-6 rounded-2xl bg-amber-950/80 border-2 border-amber-500 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2 text-amber-400 font-mono text-sm font-bold uppercase">
              <AlertTriangle className="w-5 h-5" />
              <span>Mission Anomaly Intercepted (Day {activeAnomaly.day})</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white font-mono">{activeAnomaly.title}</h3>
              <p className="text-xs text-slate-300 font-mono leading-relaxed">
                {activeAnomaly.description}
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <div className="text-xs font-mono text-amber-300 uppercase tracking-wider">
                {activeAnomaly.choice.prompt}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeAnomaly.choice.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    className="p-4 rounded-xl bg-space-900 border border-amber-500/50 hover:border-amber-400 hover:bg-space-850 text-left transition-all space-y-1 font-mono"
                  >
                    <div className="text-xs font-bold text-white">{opt.label}</div>
                    <div className="text-[11px] text-slate-400">{opt.outcomeText}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Event History Log */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Flight Telemetry Log
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {events
              .filter((e) => e.day <= currentDay)
              .map((evt) => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-xl bg-space-900/60 border border-slate-800 text-xs font-mono flex items-center justify-between"
                >
                  <span className="text-slate-300">
                    <strong className="text-cyan-400">Day {evt.day}:</strong> {evt.title}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase">{evt.severity}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
