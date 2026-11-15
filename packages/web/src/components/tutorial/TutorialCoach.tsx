import React, { useState } from 'react';
import {
  TUTORIAL_STEPS,
  TutorialBuilderTab,
  TutorialScreenRequirement
} from '../../game/tutorial';
import {
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Compass,
  Wrench,
  Sparkles,
  X,
  ArrowLeftRight,
  ListChecks
} from 'lucide-react';
import { sound } from '../../utils/soundEngine';

interface TutorialCoachProps {
  isOpen: boolean;
  currentScreen: TutorialScreenRequirement;
  stepIndex: number;
  isStepCompleted: boolean;
  completedStepIds: Record<string, boolean>;
  onSelectStep: (index: number) => void;
  onClose: () => void;
  onFinishTutorial: () => void;
  onSuggestedTab?: (tab: TutorialBuilderTab) => void;
  onOpenWorldSelector?: () => void;
  onAutoFixCraft?: () => void;
  needsAutoFix?: boolean;
}

const SCREEN_LABELS: Record<TutorialScreenRequirement, string> = {
  hangar: 'VAB HANGAR',
  flight_arcade: 'ASCENT FLIGHT',
  orbital_command: 'ORBITAL COMMAND'
};

export const TutorialCoach: React.FC<TutorialCoachProps> = ({
  isOpen,
  currentScreen,
  stepIndex,
  isStepCompleted,
  completedStepIds,
  onSelectStep,
  onClose,
  onFinishTutorial,
  onSuggestedTab,
  onOpenWorldSelector,
  onAutoFixCraft,
  needsAutoFix = false
}) => {
  const [minimized, setMinimized] = useState(false);
  const [showAllLessons, setShowAllLessons] = useState(false);
  const [dockSide, setDockSide] = useState<'right' | 'left'>('right');

  if (!isOpen) return null;

  const clampedIndex = Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, stepIndex));
  const step = TUTORIAL_STEPS[clampedIndex];
  const isLastStep = clampedIndex === TUTORIAL_STEPS.length - 1;
  const mismatchScreen = step.screen !== currentScreen;
  const completedCount = TUTORIAL_STEPS.filter((s) => completedStepIds[s.id]).length;

  const positionClass =
    dockSide === 'right' ? 'top-20 right-3 sm:right-4' : 'top-20 left-3 sm:left-4';

  if (minimized) {
    return (
      <div className={`fixed ${positionClass} z-40 pointer-events-none`}>
        <div className="pointer-events-auto game-frame-amber px-3 py-2 flex items-center gap-2.5 shadow-2xl">
          <GraduationCap className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="text-[11px] font-black text-white tracking-wider">
            ACADEMY {clampedIndex + 1}/{TUTORIAL_STEPS.length}
          </div>
          <span className="text-[10px] font-mono text-amber-300 hidden sm:inline">
            {completedCount}/8 DONE
          </span>
          <button
            type="button"
            onClick={() => {
              sound.playClick(860);
              setMinimized(false);
            }}
            className="px-2 py-0.5 bg-[#0b3d91] border border-sky-400/50 text-white text-[10px] font-black flex items-center gap-1 hover:brightness-125"
          >
            <span>EXPAND</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tutorial"
            className="text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed ${positionClass} z-40 w-[calc(100vw-1.5rem)] max-w-[360px] pointer-events-none`}>
      <div className="pointer-events-auto game-frame overflow-hidden shadow-2xl border-sky-400/50">
        {/* NASA Accent Bar */}
        <div className="nasa-chevron-bar" />

        {/* Header */}
        <div className="px-3.5 py-2.5 bg-[#07142b] border-b border-slate-700/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 bg-[#0b3d91] border border-sky-400/60 flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4 text-sky-300" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] font-black tracking-[0.16em] text-amber-400 truncate">
                {step.callsign}
              </div>
              <div className="text-xs font-black text-white truncate uppercase">
                FLIGHT ACADEMY COACH
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              title="Switch tutorial corner (Left / Right)"
              onClick={() => {
                sound.playClick(760);
                setDockSide((prev) => (prev === 'right' ? 'left' : 'right'));
              }}
              className="p-1.5 bg-space-950 border border-slate-700 text-slate-300 hover:text-white"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Toggle all 8 lessons list"
              onClick={() => {
                sound.playClick(820);
                setShowAllLessons((prev) => !prev);
              }}
              className={`p-1.5 border text-xs ${
                showAllLessons
                  ? 'bg-[#105bd8] border-sky-400 text-white'
                  : 'bg-space-950 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Minimize coach"
              onClick={() => {
                sound.playClick(740);
                setMinimized(true);
              }}
              className="p-1.5 bg-space-950 border border-slate-700 text-slate-300 hover:text-white"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Exit tutorial"
              onClick={() => {
                sound.playClick(660);
                onClose();
              }}
              className="p-1.5 bg-space-950 border border-slate-700 text-slate-300 hover:text-red-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Step Progress Segments */}
        <div className="px-3.5 pt-2.5 bg-[#050d1e]">
          <div className="grid grid-cols-8 gap-1">
            {TUTORIAL_STEPS.map((s, idx) => {
              const isCurrent = idx === clampedIndex;
              const done = completedStepIds[s.id];
              return (
                <button
                  key={s.id}
                  type="button"
                  title={`Lesson ${s.stepNumber}: ${s.title}`}
                  onClick={() => {
                    sound.playClick(840);
                    onSelectStep(idx);
                    if (s.suggestedTab && s.screen === currentScreen) {
                      onSuggestedTab?.(s.suggestedTab);
                    }
                  }}
                  className={`h-1.5 transition-all ${
                    isCurrent
                      ? 'bg-[#fc3d21]'
                      : done
                      ? 'bg-emerald-400'
                      : 'bg-slate-700 hover:bg-slate-500'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Optional Quick Index of All 8 Lessons */}
        {showAllLessons && (
          <div className="mx-3.5 mt-2.5 p-2 bg-space-950 border border-slate-700 max-h-44 overflow-y-auto space-y-1">
            {TUTORIAL_STEPS.map((s, idx) => {
              const active = idx === clampedIndex;
              const done = completedStepIds[s.id];
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    sound.playClick(880);
                    onSelectStep(idx);
                    setShowAllLessons(false);
                    if (s.suggestedTab && s.screen === currentScreen) {
                      onSuggestedTab?.(s.suggestedTab);
                    }
                  }}
                  className={`w-full text-left px-2 py-1.5 text-[11px] flex items-center gap-2 border transition-all ${
                    active
                      ? 'bg-[#0b3d91]/60 border-sky-400 text-white'
                      : 'bg-space-900/60 border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                  <span className="font-mono text-[10px] text-sky-300 shrink-0">
                    0{s.stepNumber}
                  </span>
                  <span className="truncate font-semibold">{s.title}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Active Lesson Body */}
        <div className="p-3.5 space-y-2.5 bg-[#050d1e]">
          {mismatchScreen && (
            <div className="px-2.5 py-1.5 bg-amber-950/45 border border-amber-500/50 text-[10px] font-bold text-amber-200 uppercase tracking-wide">
              APPLIES IN: {SCREEN_LABELS[step.screen]} (YOU ARE IN {SCREEN_LABELS[currentScreen]})
            </div>
          )}

          <h3 className="text-sm font-black text-white leading-snug">{step.title}</h3>
          <p className="text-xs text-slate-200 leading-relaxed">{step.instruction}</p>

          {/* Aerospace Principle Callout */}
          <div className="p-2.5 bg-[#091834] border-l-2 border-sky-400 text-[11px] text-sky-100 leading-relaxed">
            <div className="flex items-center gap-1 text-[9px] font-black text-sky-300 uppercase tracking-wider mb-0.5">
              <Sparkles className="w-3 h-3" />
              <span>HOW IT WORKS IN REAL NASA MISSIONS</span>
            </div>
            {step.scienceTip}
          </div>

          {/* Live Objective Status */}
          <div
            className={`px-2.5 py-2 border flex items-center gap-2 text-[11px] font-bold ${
              isStepCompleted
                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                : 'bg-space-950/90 border-slate-700 text-slate-300'
            }`}
          >
            {isStepCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{step.checkLabel}</span>
          </div>

          {/* Contextual Action Shortcuts (Never block controls, just help the player jump right in!) */}
          {currentScreen === 'hangar' && (
            <div className="flex flex-wrap gap-1.5">
              {step.id === 'select-world' && onOpenWorldSelector && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick(940);
                    onOpenWorldSelector();
                  }}
                  className="game-chip px-2.5 py-1.5 bg-[#105bd8] text-white hover:brightness-110 text-[10px] font-black tracking-wider flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>OPEN 8-WORLD PICKER</span>
                </button>
              )}

              {step.suggestedTab && onSuggestedTab && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick(860);
                    onSuggestedTab(step.suggestedTab!);
                  }}
                  className="game-chip px-2.5 py-1.5 bg-space-900 border border-sky-400/50 text-sky-300 hover:text-white text-[10px] font-black tracking-wider"
                >
                  OPEN {step.suggestedTab.toUpperCase()} TAB
                </button>
              )}

              {step.id === 'go-nogo-balance' && needsAutoFix && onAutoFixCraft && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick(980);
                    onAutoFixCraft();
                  }}
                  className="game-chip px-2.5 py-1.5 bg-amber-500/20 border border-amber-400/60 text-amber-200 hover:bg-amber-500/30 text-[10px] font-black tracking-wider flex items-center gap-1"
                >
                  <Wrench className="w-3 h-3" />
                  <span>AUTO-FIX TO 6/6 GO</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="px-3.5 py-2.5 bg-[#07142b] border-t border-slate-700/80 flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={clampedIndex === 0}
            onClick={() => {
              sound.playClick(740);
              const nextIdx = Math.max(0, clampedIndex - 1);
              onSelectStep(nextIdx);
              const prevStep = TUTORIAL_STEPS[nextIdx];
              if (prevStep.suggestedTab && prevStep.screen === currentScreen) {
                onSuggestedTab?.(prevStep.suggestedTab);
              }
            }}
            className="px-2.5 py-1.5 bg-space-950 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-35 text-[11px] font-black flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>PREV</span>
          </button>

          <span className="text-[10px] font-mono text-slate-400">
            {clampedIndex + 1} / {TUTORIAL_STEPS.length}
          </span>

          {isLastStep ? (
            <button
              type="button"
              onClick={() => {
                sound.playClick(1040);
                onFinishTutorial();
              }}
              className="game-chip px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black tracking-wider flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>COMPLETE TRAINING</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                sound.playClick(920);
                const nextIdx = Math.min(TUTORIAL_STEPS.length - 1, clampedIndex + 1);
                onSelectStep(nextIdx);
                const nextStep = TUTORIAL_STEPS[nextIdx];
                if (nextStep.suggestedTab && nextStep.screen === currentScreen) {
                  onSuggestedTab?.(nextStep.suggestedTab);
                }
              }}
              className="game-chip px-3 py-1.5 nasa-btn-primary text-[11px] font-black tracking-wider flex items-center gap-1"
            >
              <span>NEXT</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
