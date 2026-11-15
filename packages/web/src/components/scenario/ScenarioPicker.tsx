import React from 'react';
import { Scenario, isBudgetUnlimited } from '@sim/index';
import { Target, DollarSign, Clock, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

interface ScenarioPickerProps {
  scenarios: Scenario[];
  selectedScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  onProceed: () => void;
}

export const ScenarioPicker: React.FC<ScenarioPickerProps> = ({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  onProceed
}) => {
  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6">
      {/* Intro Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>PHASE 1: MISSION REQUIREMENTS & ARCHITECTURE SELECTION</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white hud-heading">
          Select Your Space Mission Profile
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm">
          Every space mission begins with a scientific requirement and a bounded budget. Choose a flight objective to establish your mass, power, communication, and orbital constraints.
        </p>
      </div>

      {/* Grid of Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {scenarios.map((sc) => {
          const isSelected = sc.id === selectedScenarioId;
          const difficultyColors = {
            Beginner: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30',
            Intermediate: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/30',
            Advanced: 'border-amber-500/40 text-amber-400 bg-amber-950/30',
            Sandbox: 'border-sky-400/50 text-sky-300 bg-[#0b3d91]/40'
          };

          return (
            <div
              key={sc.id}
              onClick={() => onSelectScenario(sc.id)}
              className={`cursor-pointer rounded-xl p-5 border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-space-900 border-cyan-400 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/50'
                  : 'bg-space-900/60 border-slate-800 hover:border-slate-700 hover:bg-space-900'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${
                      difficultyColors[sc.difficulty]
                    }`}
                  >
                    {sc.difficulty}
                  </span>
                  <span className="text-xs font-mono text-slate-500">{sc.badge}</span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-cyan-400">
                  {sc.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {sc.tagline}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 mt-4 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Budget:
                  </span>
                  <span className="font-bold text-white">
                    {sc.difficulty === 'Sandbox' || isBudgetUnlimited(sc.budgetM)
                      ? '∞ Unlimited'
                      : `$${sc.budgetM}M`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" /> Target Life:
                  </span>
                  <span>{sc.targetLifetimeYears} yrs</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Briefing Card for the Selected Scenario */}
      <div className="hud-panel p-6 rounded-2xl border border-cyan-500/30 space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
              MISSION DIRECTIVE BRIEFING
            </div>
            <h3 className="text-xl font-bold text-white mt-1">
              {selectedScenario.title}
            </h3>
          </div>
          <button
            onClick={onProceed}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-sm transition-all shadow-lg shadow-cyan-500/25"
          >
            <span>Configure Spacecraft Bus</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          {selectedScenario.briefing}
        </p>

        {/* Requirements & Target Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-space-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>Target Science Domains</span>
            </div>
            <div className="text-xs font-semibold text-white">
              {selectedScenario.requiredCapabilities.targetScienceDomains.length > 0
                ? selectedScenario.requiredCapabilities.targetScienceDomains.join(', ')
                : 'All Domains (Sandbox)'}
            </div>
          </div>

          <div className="bg-space-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Recommended Orbits</span>
            </div>
            <div className="text-xs font-semibold text-white">
              {selectedScenario.targetOrbits.map((o) => o.replace('orbit-', '').toUpperCase()).join(', ')}
            </div>
          </div>

          <div className="bg-space-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Daily Downlink Minimum</span>
            </div>
            <div className="text-xs font-semibold text-white">
              ≥ {selectedScenario.requiredCapabilities.minDataRateDailyGb} GB / Day
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
