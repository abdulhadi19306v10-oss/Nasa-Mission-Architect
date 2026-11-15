import React, { useEffect, useState } from 'react';
import { MissionReport, SpacecraftDesign, Scenario, Orbit, ResourceBudget } from '@sim/index';
import { triggerConfetti } from '../../utils/confetti';
import { MissionGoalsSummary } from '../../game/missionGoals';
import { AssistDifficulty } from '../../game/knowledge';
import { getNasaMissionFunFacts } from '../../game/nasaFunFacts';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Wrench,
  Star,
  Sparkles,
  Rocket,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface PreviousBestRun {
  overallScore: number;
  totalCostM: number;
  totalMassKg: number;
  letterGrade: string;
  stars: number;
}

interface DebriefReportProps {
  report: MissionReport;
  design: SpacecraftDesign;
  scenario: Scenario;
  orbit: Orbit;
  missionId?: string;
  budget?: ResourceBudget;
  previousBestRun?: PreviousBestRun | null;
  goalsSummary?: MissionGoalsSummary;
  assistDifficulty?: AssistDifficulty;
  starsEarned?: number;
  flightBonusXp?: number;
  orbitalScienceXp?: number;
  onBackToHangar?: () => void;
  onRedesign: () => void;
  onNextMission?: () => void;
  onOpenFieldGuide?: () => void;
  hasNextMission?: boolean;
  isCampaign?: boolean;
}

export const DebriefReport: React.FC<DebriefReportProps> = ({
  report,
  design,
  scenario,
  orbit,
  missionId,
  goalsSummary,
  starsEarned = 0,
  flightBonusXp = 0,
  orbitalScienceXp = 0,
  onBackToHangar,
  onRedesign,
  onNextMission,
  hasNextMission = false,
  isCampaign = false
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const funEntry = getNasaMissionFunFacts({
    missionId,
    orbitId: orbit.id,
    centralBody: orbit.centralBody,
    matchedRealMission: report.matchedRealMission
  });

  useEffect(() => {
    if (report.status === 'SUCCESS' || report.status === 'PARTIAL_SUCCESS') {
      triggerConfetti();
    }
  }, [report.status]);

  const goalBonus = goalsSummary?.earnedBonusXp ?? 0;
  const totalRunXp = Math.round(orbitalScienceXp + flightBonusXp + goalBonus + report.overallScore * 5);

  const isFailed = report.status === 'MISSION_FAILURE';
  const statusBadge = isFailed
    ? {
        label: 'MISSION INCOMPLETE',
        icon: XCircle,
        cls: 'bg-rose-950/80 text-rose-300 border-rose-500/60'
      }
    : report.status === 'PARTIAL_SUCCESS'
    ? {
        label: 'DATA RECEIVED ON EARTH',
        icon: AlertTriangle,
        cls: 'bg-amber-950/80 text-amber-300 border-amber-500/60'
      }
    : {
        label: 'MISSION COMPLETE',
        icon: CheckCircle,
        cls: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60'
      };

  const StatusIcon = statusBadge.icon;

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-5">
      {/* 1. CLEAN CELEBRATION CARD */}
      <div className="hud-panel p-6 sm:p-8 rounded-2xl border border-sky-400/40 text-center space-y-4">
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full border font-mono text-xs font-bold uppercase tracking-wider ${statusBadge.cls}`}
        >
          <StatusIcon className="w-4 h-4" />
          <span>{statusBadge.label}</span>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-white hud-heading">
            {scenario.title}
          </h2>
          <p className="text-xs font-mono text-slate-400">
            Spacecraft: <strong className="text-sky-200">{design.name}</strong> &bull; Orbit:{' '}
            <strong className="text-cyan-300">{orbit.name}</strong>
          </p>
        </div>

        {/* Simple Star + Score + Total XP strip */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
          {isCampaign && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-space-950/75 border border-slate-800">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  className={`w-5 h-5 ${
                    s <= starsEarned
                      ? 'text-amber-400 fill-current drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                      : 'text-slate-700'
                  }`}
                />
              ))}
            </div>
          )}

          <div className="px-3.5 py-1.5 rounded-xl bg-space-950/75 border border-slate-800 font-mono text-xs text-slate-300">
            Grade <strong className="text-emerald-300 text-sm">{report.letterGrade}</strong> ({report.overallScore}/100)
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-amber-950/50 border border-amber-500/40 font-mono text-xs text-amber-200 font-bold">
            +{totalRunXp.toLocaleString()} XP Earned
          </div>
        </div>
      </div>

      {/* 2. NASA REAL MISSION FUN FACTS (HERO FOCAL PANEL) */}
      <div className="hud-panel p-6 rounded-2xl border border-cyan-400/40 bg-gradient-to-b from-[#0b3d91]/35 to-space-950/90 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/90 pb-3">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-sky-300" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold">
                How NASA Actually Did This Mission
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                {funEntry.realMissionName}
              </h3>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-space-950/90 border border-sky-500/40 text-sky-200">
            {funEntry.agencyYear}
          </span>
        </div>

        <div className="space-y-3">
          {funEntry.facts.map((fact, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-space-950/75 border border-slate-800/90 flex items-start gap-3 text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-[#0b3d91] border border-sky-400/50 text-sky-200 font-mono font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                #{idx + 1}
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {fact}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Optional compact telemetry disclosure (closed by default to keep screen simple) */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-sky-300 transition-colors"
        >
          {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{showDetails ? 'Hide Mission Telemetry' : 'View Mission Telemetry'}</span>
        </button>

        {showDetails && (
          <div className="mt-3 hud-panel p-4 rounded-xl border border-slate-800 text-left font-mono text-xs space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded bg-space-950/80 border border-slate-800">
                <div className="text-[9px] text-slate-400">SCIENCE</div>
                <div className="text-sky-300 font-bold">{report.scienceScore}%</div>
              </div>
              <div className="p-2 rounded bg-space-950/80 border border-slate-800">
                <div className="text-[9px] text-slate-400">EFFICIENCY</div>
                <div className="text-cyan-300 font-bold">{report.efficiencyScore}%</div>
              </div>
              <div className="p-2 rounded bg-space-950/80 border border-slate-800">
                <div className="text-[9px] text-slate-400">RELIABILITY</div>
                <div className="text-emerald-300 font-bold">{report.reliabilityScore}%</div>
              </div>
              <div className="p-2 rounded bg-space-950/80 border border-slate-800">
                <div className="text-[9px] text-slate-400">BUDGET</div>
                <div className="text-amber-300 font-bold">{report.budgetScore}%</div>
              </div>
            </div>

            {goalsSummary && (
              <div className="space-y-1.5">
                <div className="text-[10px] text-sky-300 font-bold uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Contract Goals ({goalsSummary.totalCompletedCount}/{goalsSummary.goals.length})
                </div>
                {goalsSummary.goals.map((g) => (
                  <div key={g.id} className="flex items-center justify-between text-[11px] px-2 py-1 rounded bg-space-950/70">
                    <span className={g.completed ? 'text-emerald-300' : 'text-slate-400'}>
                      {g.completed ? '✓' : '○'} {g.title}
                    </span>
                    <span className={g.completed ? 'text-amber-300 font-bold' : 'text-slate-600'}>
                      {g.completed ? `+${g.xpBonus} XP` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. CLEAN ACTION FOOTER */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1 pb-4">
        <button
          onClick={onBackToHangar || onRedesign}
          className="game-chip flex items-center gap-2 px-5 py-3 bg-space-900 border border-slate-700 hover:border-cyan-400 text-slate-200 font-mono font-bold text-xs uppercase tracking-wider transition-all"
        >
          <Wrench className="w-4 h-4 text-cyan-400" />
          <span>VAB Hangar</span>
        </button>

        {isCampaign && (
          <button
            onClick={onRedesign}
            className="game-chip flex items-center gap-2 px-5 py-3 bg-space-900 border border-cyan-500/50 hover:bg-space-850 text-cyan-300 font-mono font-bold text-xs uppercase tracking-wider transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Starmap</span>
          </button>
        )}

        {hasNextMission && onNextMission && (
          <button
            onClick={onNextMission}
            className="game-blade flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:brightness-110 text-black font-mono font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/25"
          >
            <span>Next Mission</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
