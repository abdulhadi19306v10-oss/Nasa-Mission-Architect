import React, { useState } from 'react';
import {
  Orbit,
  CommsSubsystem,
  ResourceBudget,
  CelestialBodyId,
  CELESTIAL_BODY_LIST,
  getCelestialBodyMeta,
  calculateOrbitalPeriod,
  calculateOrbitalSpeed,
  calculateEclipseMinutes,
  calculateDailyDownlinkCapacityGb
} from '@sim/index';
import {
  CODEX_TOPICS,
  SYNERGY_COMBOS,
  ACHIEVEMENT_DEFS,
  CareerStats,
  getCareerRank
} from '../../game/knowledge';
import { SpacecraftDesign } from '@sim/index';
import { X, BookOpen, Calculator, Sparkles, Award, CheckCircle, Lock } from 'lucide-react';

interface FieldGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  orbit: Orbit;
  comms: CommsSubsystem;
  budget: ResourceBudget;
  design: SpacecraftDesign;
  careerXp: number;
  careerStats: CareerStats;
  completedMissions: Record<string, number>;
}

export const FieldGuideModal: React.FC<FieldGuideModalProps> = ({
  isOpen,
  onClose,
  orbit,
  comms,
  budget,
  design,
  careerXp,
  careerStats,
  completedMissions
}) => {
  const [section, setSection] = useState<'physics' | 'synergies' | 'career'>('physics');
  const [calcBody, setCalcBody] = useState<CelestialBodyId>(orbit.centralBody);
  const [calcAltKm, setCalcAltKm] = useState<number>(orbit.altitudeKm);

  if (!isOpen) return null;

  const calcMeta = getCelestialBodyMeta(calcBody);
  const periodMin = calculateOrbitalPeriod(calcAltKm, calcBody) / 60;
  const speedKmS = calculateOrbitalSpeed(calcAltKm, calcBody);
  const eclipseMin = calculateEclipseMinutes(calcAltKm, calcBody);
  const sampleDailyGb = calculateDailyDownlinkCapacityGb(
    comms.downlinkRateMbps,
    orbit.groundStationContactsPerDay,
    orbit.avgPassDurationMinutes
  );

  const rank = getCareerRank(careerXp);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="game-frame max-w-3xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto font-mono">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pr-8">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white hud-heading">
              NASA Aerospace Field Guide &amp; Physics Lab
            </h3>
            <p className="text-xs text-slate-400">
              Learn the orbital mechanics, link budgets, and subsystem synergies powering your spacecraft
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 text-xs">
          {[
            { id: 'physics', label: 'Physics & Interactive Lab', icon: Calculator },
            { id: 'synergies', label: 'Hardware Synergies', icon: Sparkles },
            { id: 'career', label: 'Career Rank & Badges', icon: Award }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = section === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSection(tab.id as 'physics' | 'synergies' | 'career')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                  active
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                    : 'bg-space-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {section === 'physics' && (
          <div className="space-y-4">
            {/* Live Interactive Orbital Simulator Sandbox */}
            <div className="p-4 rounded-xl bg-space-950 border border-cyan-500/30 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-cyan-300 uppercase">
                  Live Keplerian Orbit &amp; Downlink Sandbox
                </div>
                <div className="flex flex-wrap items-center gap-1 text-[10px]">
                  {CELESTIAL_BODY_LIST.map((body) => (
                    <button
                      key={body.id}
                      onClick={() => {
                        setCalcBody(body.id);
                        if (body.id === 'moon' || body.id === 'asteroid' || body.id === 'europa') setCalcAltKm(150);
                        else if (body.id === 'titan') setCalcAltKm(1200);
                        else if (body.id === 'lagrange') setCalcAltKm(1500000);
                        else setCalcAltKm(450);
                      }}
                      className={`px-2 py-1 rounded border uppercase font-bold ${
                        calcBody === body.id
                          ? 'bg-sky-400 text-black border-sky-300'
                          : 'bg-space-900 border-slate-700 text-slate-300 hover:border-sky-500'
                      }`}
                    >
                      {body.shortName}
                    </button>
                  ))}
                </div>
              </div>

              {calcBody !== 'lagrange' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>Test Altitude ({calcMeta.name} &bull; Solar Flux {(calcMeta.solarFluxMultiplier * 100).toFixed(1)}%)</span>
                    <strong className="text-sky-300">{calcAltKm.toLocaleString()} km</strong>
                  </div>
                  <input
                    type="range"
                    min={calcBody === 'moon' || calcBody === 'asteroid' || calcBody === 'europa' ? 50 : 200}
                    max={calcBody === 'earth' ? 35786 : 4000}
                    step={calcBody === 'earth' ? 50 : 25}
                    value={calcAltKm}
                    onChange={(e) => setCalcAltKm(Number(e.target.value))}
                    className="w-full accent-sky-400"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs pt-1">
                <div className="p-2.5 rounded-lg bg-space-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Orbital Speed</div>
                  <div className="text-base font-bold text-cyan-300">{speedKmS.toFixed(2)} km/s</div>
                </div>
                <div className="p-2.5 rounded-lg bg-space-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Orbit Period</div>
                  <div className="text-base font-bold text-white">
                    {periodMin > 1000 ? `${(periodMin / 1440).toFixed(1)} d` : `${periodMin.toFixed(1)} m`}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-space-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Shadow Eclipse</div>
                  <div className="text-base font-bold text-amber-300">{eclipseMin.toFixed(1)} min</div>
                </div>
                <div className="p-2.5 rounded-lg bg-space-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">{comms.name.split(' ')[0]} Link</div>
                  <div className="text-base font-bold text-sky-300">{sampleDailyGb.toFixed(0)} GB/d</div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400">
                Current Design Snapshot: generating <strong className="text-amber-300">{budget.dailyDataGenGb.toFixed(1)} GB/day</strong> vs downlink cap{' '}
                <strong className="text-emerald-300">{budget.dailyDownlinkCapacityGb.toFixed(1)} GB/day</strong> • Battery DoD{' '}
                <strong className={budget.batteryDoDPercent > 70 ? 'text-rose-400' : 'text-cyan-300'}>
                  {budget.batteryDoDPercent.toFixed(0)}%
                </strong>
              </div>
            </div>

            {/* Reference Topics */}
            <div className="space-y-3">
              {CODEX_TOPICS.map((topic) => (
                <div
                  key={topic.id}
                  className="p-4 rounded-xl bg-space-950/80 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-white text-sm">{topic.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                      {topic.tag}
                    </span>
                  </div>
                  <p className="text-slate-300 font-sans leading-relaxed">{topic.summary}</p>
                  <div className="px-3 py-1.5 rounded-lg bg-space-900 border border-slate-800 text-cyan-300 font-bold text-[11px]">
                    {topic.equation}
                  </div>
                  <div className="text-[11px] text-amber-200">
                    <strong>In Mission Architect:</strong> {topic.whyItMatters}
                  </div>
                  <div className="text-[11px] text-emerald-300">
                    <strong>Real NASA Benchmark:</strong> {topic.realExample}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'synergies' && (
          <div className="space-y-3 text-xs">
            <p className="text-slate-300 font-sans">
              Combine complementary NASA payloads and subsystems in the VAB to trigger live Science Yield multipliers and bandwidth boosts during Orbital Command!
            </p>
            {SYNERGY_COMBOS.map((syn) => {
              const unlocked = syn.check(design);
              return (
                <div
                  key={syn.id}
                  className={`p-4 rounded-xl border space-y-1.5 ${
                    unlocked
                      ? 'bg-emerald-950/35 border-emerald-500/60'
                      : 'bg-space-950/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-white">
                      {unlocked ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-amber-400" />
                      )}
                      <span>{syn.title}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        unlocked
                          ? 'bg-emerald-900/60 text-emerald-300 border-emerald-500/50'
                          : 'bg-[#0b3d91]/60 text-sky-200 border-sky-500/50'
                      }`}
                    >
                      {unlocked ? `ACTIVE (${syn.bonusLabel})` : syn.bonusLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans">{syn.explanation}</p>
                </div>
              );
            })}
          </div>
        )}

        {section === 'career' && (
          <div className="space-y-4 text-xs">
            <div className="game-chip p-4 bg-gradient-to-r from-[#0b3d91]/70 to-sky-950/60 border border-sky-400/50 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[10px] text-cyan-400 uppercase font-bold">Current NASA Rank</div>
                <div className="text-xl font-extrabold text-white">{rank.title}</div>
                <div className="text-[11px] text-slate-300">
                  Career Total: <strong className="text-amber-300">{careerXp.toLocaleString()} XP</strong>
                  {rank.nextXp !== null ? ` • Next Promotion at ${rank.nextXp.toLocaleString()} XP` : ' • MAX RANK ACHIEVED'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400">Flights Completed</div>
                <div className="text-2xl font-black text-emerald-400">{careerStats.missionsCompleted}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ACHIEVEMENT_DEFS.map((ach) => {
                const earned = ach.check(careerStats, completedMissions);
                const Icon = earned ? CheckCircle : Lock;
                return (
                  <div
                    key={ach.id}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                      earned
                        ? 'bg-amber-950/25 border-amber-500/50'
                        : 'bg-space-950/60 border-slate-800 opacity-60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${earned ? 'text-amber-400' : 'text-slate-500'}`} />
                    <div>
                      <div className="font-bold text-white">{ach.title}</div>
                      <div className="text-[11px] text-slate-400 font-sans mt-0.5">{ach.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
