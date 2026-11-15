import React, { useState } from 'react';
import { CAMPAIGN_MISSIONS, CampaignMission } from '../../game/campaign';
import { AssistDifficulty, DIFFICULTY_PROFILES } from '../../game/knowledge';
import { sound } from '../../utils/soundEngine';
import { ArrowLeft, Star, ArrowRight, Trophy, Shield, Crosshair, Target } from 'lucide-react';
import { NasaCrest } from '../common/NasaCrest';

interface CampaignScreenProps {
  onSelectMission: (mission: CampaignMission) => void;
  onBack: () => void;
  completedMissions: Record<string, number>;
  bestScores?: Record<string, number>;
  bestGrades?: Record<string, string>;
  assistDifficulty?: AssistDifficulty;
  onChangeAssistDifficulty?: (difficulty: AssistDifficulty) => void;
}

const TRAJECTORY_PATH_D = CAMPAIGN_MISSIONS.map((m, idx) =>
  idx === 0 ? `M ${m.starmapX} ${m.starmapY}` : `L ${m.starmapX} ${m.starmapY}`
).join(' ');

export const CampaignScreen: React.FC<CampaignScreenProps> = ({
  onSelectMission,
  onBack,
  completedMissions,
  bestScores = {},
  bestGrades = {},
  assistDifficulty = 'Intermediate',
  onChangeAssistDifficulty
}) => {
  const [selectedId, setSelectedId] = useState<string>(CAMPAIGN_MISSIONS[0].id);
  const selectedMission = CAMPAIGN_MISSIONS.find((m) => m.id === selectedId) || CAMPAIGN_MISSIONS[0];

  const totalStarsEarned = Object.values(completedMissions).reduce((sum, s) => sum + s, 0);
  const totalStarsPossible = CAMPAIGN_MISSIONS.length * 3;
  const careerScore = Object.values(bestScores).reduce((sum, s) => sum + s, 0);
  const selectedStars = completedMissions[selectedMission.id] || 0;
  const selectedBestXp = bestScores[selectedMission.id] || 0;
  const selectedGrade = bestGrades[selectedMission.id];
  const activeDiff = DIFFICULTY_PROFILES[assistDifficulty];

  return (
    <div className="absolute inset-0 z-40 bg-space-950/94 backdrop-blur-md hud-grid-bg overflow-y-auto p-4 sm:p-8 pointer-events-auto select-none flex flex-col justify-between gap-4 font-mono">
      {/* TOP NASA MISSION CONTROL BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 max-w-6xl mx-auto w-full border-b border-sky-500/25 pb-3">
        <button
          onClick={() => {
            sound.playClick(500);
            onBack();
          }}
          className="game-chip flex items-center gap-2 px-3.5 py-2 bg-space-900 border border-slate-700 hover:border-sky-400 text-slate-300 hover:text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>FLIGHT MENU</span>
        </button>

        <div className="text-center flex flex-col items-center">
          <div className="flex items-center gap-2">
            <NasaCrest size={28} />
            <div className="text-left">
              <div className="text-[10px] text-[#fc3d21] tracking-[0.22em] uppercase font-black">
                NASA MISSION CONTROL // CAMPAIGN STARMAP
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white hud-heading">SELECT FLIGHT CONTRACT</h2>
            </div>
          </div>
          <div className="nasa-chevron-bar w-48 mt-1.5" />
        </div>

        <div className="flex items-center gap-2 text-xs">
          {careerScore > 0 && (
            <div className="game-chip px-3 py-1.5 bg-[#0b3d91]/60 border border-sky-400/40 text-sky-200 font-bold flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-sky-300" />
              <span>{careerScore.toLocaleString()} XP</span>
            </div>
          )}
          <div className="game-chip px-3 py-1.5 bg-amber-950/70 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>
              {totalStarsEarned}/{totalStarsPossible}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN STARMAP + MISSION CONTRACT DOSSIER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-6xl mx-auto w-full flex-1 items-stretch">
        {/* LEFT 7 COLS: INTERACTIVE ORBITAL TRANSFER STARMAP */}
        <div className="lg:col-span-7 game-frame p-4 sm:p-6 relative min-h-[340px] flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between text-[10px] text-sky-300 tracking-widest z-10 font-bold">
            <span>NASA TRAJECTORY PROGRESSION</span>
            <span>CLICK ANY NODE TO INSPECT GOALS</span>
          </div>

          {/* Orbital Transfer Arcs SVG (Zero Purple — Emerald -> NASA Blue/Sky -> Gold -> NASA Red) */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
          >
            <defs>
              <linearGradient id="nasaTrajGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
                <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.9" />
                <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#fc3d21" stopOpacity="0.95" />
              </linearGradient>
            </defs>
            <path
              d={TRAJECTORY_PATH_D}
              fill="none"
              stroke="url(#nasaTrajGrad)"
              strokeWidth="0.65"
              strokeDasharray="2 1.2"
              strokeLinejoin="round"
            />
            {CAMPAIGN_MISSIONS.map((m) => (
              <circle
                key={m.id}
                cx={m.starmapX}
                cy={m.starmapY}
                r={m.id === selectedMission.id ? '9' : '6.5'}
                fill="none"
                stroke={m.starmapColor}
                strokeOpacity={m.id === selectedMission.id ? '0.45' : '0.2'}
                strokeWidth="0.35"
              />
            ))}
          </svg>

          {/* Clickable Sector Nodes */}
          <div className="relative flex-1 my-4 min-h-[260px]">
            {CAMPAIGN_MISSIONS.map((m) => {
              const active = m.id === selectedMission.id;
              const stars = completedMissions[m.id] || 0;
              const numLabel = String(m.number).padStart(2, '0');
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    sound.playClick(780);
                    setSelectedId(m.id);
                  }}
                  style={{ left: `${m.starmapX}%`, top: `${m.starmapY}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none z-10"
                >
                  <div className="relative flex flex-col items-center">
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border-2 transition-all ${
                        active
                          ? 'scale-115 bg-[#0b3d91] border-white shadow-[0_0_24px_rgba(56,189,248,0.65)]'
                          : 'bg-space-950/90 border-slate-600 hover:border-sky-400 hover:scale-105'
                      }`}
                      style={{ borderColor: active ? '#ffffff' : m.starmapColor }}
                    >
                      {active ? (
                        <Crosshair className="w-5 h-5 text-white animate-spin" style={{ animationDuration: '8s' }} />
                      ) : (
                        <span className="text-xs font-black text-white">{numLabel}</span>
                      )}
                    </div>
                    <div
                      className={`mt-1 px-1.5 py-0.5 game-chip text-[9px] font-black tracking-wider border whitespace-nowrap ${
                        active
                          ? 'bg-[#fc3d21] text-white border-red-300'
                          : 'bg-space-950/95 text-slate-200 border-slate-700'
                      }`}
                    >
                      {m.starmapCode}
                    </div>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-2.5 h-2.5 ${s <= stars ? 'text-amber-400 fill-current' : 'text-slate-700'}`}
                        />
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Starmap Bottom Quick Selector (2 rows x 5 missions) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 z-10">
            {CAMPAIGN_MISSIONS.map((m) => {
              const active = m.id === selectedMission.id;
              const numLabel = String(m.number).padStart(2, '0');
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    sound.playClick(780);
                    setSelectedId(m.id);
                  }}
                  className={`game-chip py-1.5 px-2 text-[10px] font-bold border transition-all truncate ${
                    active
                      ? 'bg-[#0b3d91] border-sky-400 text-white'
                      : 'bg-space-950/80 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {numLabel}: {m.starmapCode}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT 5 COLS: SELECTED MISSION CONTRACT + CRYSTAL-CLEAR OBJECTIVES */}
        <div className="lg:col-span-5 game-frame p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="nasa-crest px-2.5 py-0.5 text-white text-[10px] font-black uppercase">
                CONTRACT {String(selectedMission.number).padStart(2, '0')} &bull; {selectedMission.difficulty}
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s <= selectedStars ? 'text-amber-400 fill-current' : 'text-slate-700'}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-black text-white hud-heading">{selectedMission.title}</h3>
              <div className="text-xs text-sky-400">{selectedMission.subtitle}</div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
              <div className="game-chip p-2 bg-space-950 border border-slate-800">
                <div className="text-[9px] text-slate-500">BUDGET CAP</div>
                <div className="text-emerald-400 font-black">${selectedMission.budgetLimitM}M</div>
              </div>
              <div className="game-chip p-2 bg-space-950 border border-slate-800">
                <div className="text-[9px] text-slate-500">WIN QUOTA (1★)</div>
                <div className="text-sky-300 font-black">{selectedMission.targetSciencePoints} XP</div>
              </div>
              <div className="game-chip p-2 bg-space-950 border border-slate-800">
                <div className="text-[9px] text-slate-500">BEST FLIGHT</div>
                <div className="text-amber-300 font-black">
                  {selectedBestXp > 0 ? `${selectedBestXp} (${selectedGrade || 'OK'})` : 'UNFLOWN'}
                </div>
              </div>
            </div>

            {/* HOW TO COMPLETE THIS CONTRACT (3-Phase Clear Goals) */}
            <div className="game-chip p-3 bg-[#0b3d91]/25 border border-sky-400/35 space-y-1.5 text-[11px]">
              <div className="text-[10px] text-sky-300 uppercase font-black flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-red-400" />
                <span>MISSION OBJECTIVES TO COMPLETE</span>
              </div>
              {selectedMission.primaryGoals.map((g, i) => (
                <div key={i} className="text-slate-100 flex items-start gap-2 leading-snug">
                  <span className="text-sky-400 font-black">0{i + 1}.</span>
                  <span>{g}</span>
                </div>
              ))}
            </div>

            <div className="p-2.5 bg-space-950/75 border-l-2 border-red-500 text-[11px] text-slate-300 leading-relaxed font-sans">
              {selectedMission.briefing}
            </div>

            {/* Difficulty Toggle */}
            {onChangeAssistDifficulty && (
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-sky-400" /> FLIGHT ASSISTANCE MODE
                  </span>
                  <span className="text-sky-300 font-bold">{activeDiff.xpMultiplier.toFixed(2)}x XP</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Beginner', 'Intermediate', 'Advanced'] as AssistDifficulty[]).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => {
                        sound.playClick(820);
                        onChangeAssistDifficulty(lvl);
                      }}
                      className={`game-chip py-1.5 text-[10px] font-black border transition-all ${
                        assistDifficulty === lvl
                          ? lvl === 'Beginner'
                            ? 'bg-emerald-500 text-black border-emerald-300'
                            : lvl === 'Intermediate'
                            ? 'bg-[#105bd8] text-white border-sky-300'
                            : 'bg-[#fc3d21] text-white border-red-300'
                          : 'bg-space-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              sound.playEquip();
              onSelectMission(selectedMission);
            }}
            className="game-blade nasa-btn-primary w-full py-3.5 px-6 hover:brightness-115 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all"
          >
            <span>ENTER VAB HANGAR TO BUILD</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
