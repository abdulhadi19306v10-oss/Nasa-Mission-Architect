import React, { useEffect } from 'react';
import {
  Rocket,
  Play,
  Award,
  Users,
  Volume2,
  VolumeX,
  Trophy,
  BookOpen,
  ChevronRight,
  GraduationCap,
  Compass
} from 'lucide-react';
import { NasaCrest } from '../common/NasaCrest';
import { CAMPAIGN_MISSIONS } from '../../game/campaign';
import { sound } from '../../utils/soundEngine';

interface TitleScreenProps {
  onStartCampaign: () => void;
  onStartSandbox: () => void;
  onStartTutorial?: () => void;
  onOpenBodySelector?: () => void;
  onOpenMultiplayer: () => void;
  onOpenFieldGuide?: () => void;
  sfxEnabled: boolean;
  onToggleSfx: () => void;
  starsEarned: number;
  totalStars: number;
  bestScore?: number;
  careerRankTitle?: string;
  tutorialCompleted?: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartCampaign,
  onStartSandbox,
  onStartTutorial,
  onOpenBodySelector,
  onOpenMultiplayer,
  onOpenFieldGuide,
  sfxEnabled,
  onToggleSfx,
  starsEarned,
  totalStars,
  bestScore = 0,
  careerRankTitle,
  tutorialCompleted = false
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        sound.playEquip();
        onStartCampaign();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStartCampaign]);

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between px-6 py-5 sm:px-10 sm:py-7 pointer-events-none select-none overflow-y-auto bg-gradient-to-r from-[#030812]/88 via-[#030812]/30 to-transparent">
      {/* Subtle Top Utility Header (Minimal, unboxed chrome) */}
      <header className="relative z-10 flex items-center justify-between gap-4 pointer-events-auto">
        <div className="flex items-center gap-3">
          <NasaCrest size={30} label="FLIGHT DIRECTORATE" />
          {careerRankTitle && (
            <span className="hidden md:inline-block text-[11px] font-mono font-semibold text-sky-300/80 border-l border-slate-700/80 pl-3 tracking-wider uppercase">
              {careerRankTitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 font-mono text-xs text-slate-300">
          {bestScore > 0 && (
            <div className="flex items-center gap-1.5 text-sky-300 font-semibold">
              <Trophy className="w-3.5 h-3.5 text-sky-400" />
              <span>{bestScore.toLocaleString()} XP</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#071124]/75 border border-slate-800/90 text-amber-300 font-bold">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {starsEarned}/{totalStars}
            </span>
          </div>
          <button
            onClick={onToggleSfx}
            aria-label={sfxEnabled ? 'Mute Sound Effects' : 'Unmute Sound Effects'}
            className="p-2 rounded bg-[#071124]/75 border border-slate-800/90 hover:border-sky-400/60 text-slate-300 hover:text-sky-300 transition-colors"
          >
            {sfxEnabled ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </header>

      {/* Center-Left Hero Column — Compact framing keeps Earth & spacecraft unobstructed */}
      <main className="relative z-10 flex-1 flex flex-col justify-center max-w-sm space-y-6 py-4">
        {/* Clean Title Block */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[#fc3d21] tracking-[0.26em] uppercase">
            <span className="w-5 h-0.5 bg-[#fc3d21]" />
            <span>SPACECRAFT ENGINEERING SIM</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white hud-heading tracking-wider leading-[0.95]">
            MISSION
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-200 to-sky-400">
              ARCHITECT
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed">
            Engineer flight-ready satellites, fly orbital ascents, and command deep-space science.
          </p>
        </div>

        {/* Focused Primary Actions */}
        <div className="space-y-3 pointer-events-auto font-mono">
          {/* 1. Hero Primary CTA */}
          <button
            onClick={() => {
              sound.playEquip();
              onStartCampaign();
            }}
            className="nasa-btn-primary game-frame w-full px-5 py-4 flex items-center justify-between group transition-all hover:brightness-110"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded bg-white/10 flex items-center justify-center">
                <Play className="w-4 h-4 fill-current text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black tracking-widest text-white uppercase">
                  {starsEarned > 0 ? 'Continue Campaign' : 'Launch Campaign'}
                </div>
                <div className="text-[11px] text-sky-100/80 font-sans">
                  {CAMPAIGN_MISSIONS.length} NASA missions &bull; Press Enter
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/90 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* 2. Balanced 2-Column Mode Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                sound.playEquip();
                onStartSandbox();
              }}
              className="px-4 py-3 bg-[#071226]/85 hover:bg-[#0d2248]/95 border border-slate-700/80 hover:border-sky-400/70 rounded text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-wider text-white uppercase">Sandbox</span>
                <Rocket className="w-3.5 h-3.5 text-sky-400 -rotate-45 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Free build &bull; &infin; budget</div>
            </button>

            {onOpenBodySelector && (
              <button
                onClick={() => {
                  sound.playClick(920);
                  onOpenBodySelector();
                }}
                className="px-4 py-3 bg-[#071226]/85 hover:bg-[#0c273b]/95 border border-slate-700/80 hover:border-cyan-400/70 rounded text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black tracking-wider text-white uppercase">8 Worlds</span>
                  <Compass className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-45 transition-transform" />
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Planets, moons &amp; L2</div>
              </button>
            )}
          </div>

          {/* 3. Subtle Tutorial Strip */}
          {onStartTutorial && (
            <button
              onClick={() => {
                sound.playEquip();
                onStartTutorial();
              }}
              className="w-full px-4 py-2.5 bg-[#071226]/70 hover:bg-[#0b234d]/85 border border-slate-800 hover:border-amber-400/60 rounded flex items-center justify-between text-slate-200 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-bold tracking-wider uppercase">Flight Academy Tutorial</span>
              </div>
              <div className="flex items-center gap-2">
                {!tutorialCompleted && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#fc3d21] text-white font-black tracking-wider">
                    START HERE
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          )}
        </div>
      </main>

      {/* Clean Minimal Bottom Bar (Quiet secondary links + orbit hint) */}
      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-2 text-[11px] font-mono">
        <div className="flex items-center gap-5 pointer-events-auto">
          <button
            onClick={() => {
              sound.playClick();
              onOpenMultiplayer();
            }}
            className="flex items-center gap-1.5 text-slate-300 hover:text-emerald-300 transition-colors font-semibold uppercase tracking-wider"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Team Co-Op</span>
          </button>

          {onOpenFieldGuide && (
            <button
              onClick={() => {
                sound.playClick(860);
                onOpenFieldGuide();
              }}
              className="flex items-center gap-1.5 text-slate-300 hover:text-amber-300 transition-colors font-semibold uppercase tracking-wider"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Field Guide</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};
