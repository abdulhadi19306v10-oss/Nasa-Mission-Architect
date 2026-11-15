import React from 'react';
import { ResourceBudget, Scenario, isBudgetUnlimited } from '@sim/index';
import {
  Weight,
  Zap,
  DollarSign,
  Radio,
  Compass,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  ArrowRight,
  Info
} from 'lucide-react';

interface TelemetryHUDProps {
  budget: ResourceBudget;
  scenario: Scenario;
  onProceedToLaunch: () => void;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({
  budget,
  scenario,
  onProceedToLaunch
}) => {
  const hasCriticalIssues = budget.criticalIssues.length > 0;

  // Percentage calculations for visual progress bars
  const massRatio = budget.maxLaunchCapacityKg > 0 ? (budget.totalMassKg / budget.maxLaunchCapacityKg) * 100 : 100;
  const powerBalanceColor = budget.daylightPowerBalanceW >= 0 ? 'text-emerald-400' : 'text-rose-400';
  const dodColor = budget.batteryDoDPercent <= 70 ? 'text-cyan-400' : 'text-rose-400';
  const unlimitedBudget = Boolean(budget.isBudgetUnlimited || isBudgetUnlimited(budget.budgetLimitM));
  const costRatio = unlimitedBudget
    ? 25
    : scenario.budgetM > 0
    ? (budget.totalCostM / scenario.budgetM) * 100
    : 100;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4">
      {/* HUD Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="text-xs font-mono text-cyan-400">PHASE 4: FLIGHT READINESS REVIEW (FRR)</div>
          <h2 className="text-2xl font-bold text-white hud-heading">
            Live Telemetry & Resource Budget Dashboard
          </h2>
          <p className="text-xs text-slate-400">
            Real-time verification of mass margin, daylight power balance, eclipse battery health, downlink capacity, and pointing stability.
          </p>
        </div>

        <button
          onClick={onProceedToLaunch}
          disabled={hasCriticalIssues}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-lg ${
            hasCriticalIssues
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black shadow-emerald-500/25'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{hasCriticalIssues ? 'Launch Aborted (Errors Exist)' : 'Authorize Launch Sequence'}</span>
        </button>
      </div>

      {/* Critical Issues Banner */}
      {hasCriticalIssues && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold uppercase">
            <XCircle className="w-4 h-4" />
            <span>Launch Constraints Violated ({budget.criticalIssues.length} Critical Faults)</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-rose-200 font-mono">
            {budget.criticalIssues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings Banner */}
      {budget.warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase">
            <AlertTriangle className="w-4 h-4" />
            <span>NASA Engineering Advisories ({budget.warnings.length} Warnings)</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-amber-200 font-mono">
            {budget.warnings.map((warn, idx) => (
              <li key={idx}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 5 Main Telemetry Gauges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. MASS BUDGET GAUGE */}
        <div className="hud-panel p-5 rounded-xl border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Weight className="w-4 h-4 text-cyan-400" />
              <span>Mass Budget</span>
            </div>
            {budget.isMassFeasible ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                FEASIBLE
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                OVERWEIGHT
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold font-mono text-white">
              {budget.totalMassKg.toFixed(1)} <span className="text-xs text-slate-400">/ {budget.maxLaunchCapacityKg.toLocaleString()} kg</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-space-950 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 ${
                  massRatio > 100 ? 'bg-rose-500' : massRatio > 80 ? 'bg-amber-400' : 'bg-cyan-500'
                }`}
                style={{ width: `${Math.min(100, massRatio)}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px] font-mono text-slate-300">
            <div className="flex justify-between">
              <span>Bus Dry Mass:</span>
              <span className="text-white font-medium">{budget.busDryMassKg.toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between">
              <span>Payload Instruments:</span>
              <span className="text-white font-medium">{budget.payloadMassKg.toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between">
              <span>AIAA Design Margin:</span>
              <span className={budget.massMarginPercent >= 20 ? 'text-emerald-400' : 'text-amber-400'}>
                {budget.massMarginPercent.toFixed(1)}% (Req: ≥20%)
              </span>
            </div>
          </div>
        </div>

        {/* 2. POWER BALANCE GAUGE */}
        <div className="hud-panel p-5 rounded-xl border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Power & Battery</span>
            </div>
            {budget.isPowerFeasible ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                BALANCED
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                DEFICIT
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-2xl font-bold text-white">
                {budget.daylightPowerGenW} W
              </span>
              <span className={`text-xs font-bold ${powerBalanceColor}`}>
                {budget.daylightPowerBalanceW >= 0 ? `+${budget.daylightPowerBalanceW.toFixed(0)}W Net` : `${budget.daylightPowerBalanceW.toFixed(0)}W Deficit`}
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Daylight Load: {budget.daylightPowerConsumedW.toFixed(0)} W
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px] font-mono text-slate-300">
            <div className="flex justify-between">
              <span>Eclipse Energy Required:</span>
              <span className="text-white">{budget.eclipseEnergyRequiredWh.toFixed(1)} Wh</span>
            </div>
            <div className="flex justify-between">
              <span>Battery Capacity:</span>
              <span className="text-white">{budget.batteryCapacityWh} Wh</span>
            </div>
            <div className="flex justify-between">
              <span>Eclipse DoD:</span>
              <span className={dodColor}>
                {budget.batteryDoDPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* 3. FINANCIAL BUDGET GAUGE */}
        <div className="hud-panel p-5 rounded-xl border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Mission Cost Model</span>
            </div>
            {budget.isCostFeasible ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                ON BUDGET
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                OVERRUN
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold font-mono text-white">
              ${budget.totalCostM.toFixed(1)}M{' '}
              <span className="text-xs text-emerald-300">
                / {unlimitedBudget ? '∞ Unlimited' : `$${budget.budgetLimitM}M`}
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-space-950 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 ${
                  costRatio > 100 ? 'bg-rose-500' : costRatio > 85 ? 'bg-amber-400' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, costRatio)}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px] font-mono text-slate-300">
            <div className="flex justify-between">
              <span>Spacecraft Hardware:</span>
              <span className="text-white">${budget.spacecraftCostM.toFixed(1)}M</span>
            </div>
            <div className="flex justify-between">
              <span>Launch Vehicle:</span>
              <span className="text-white">${budget.launchCostM.toFixed(1)}M</span>
            </div>
            <div className="flex justify-between">
              <span>Operations ({scenario.targetLifetimeYears} yrs):</span>
              <span className="text-white">${budget.opsCostM.toFixed(1)}M</span>
            </div>
          </div>
        </div>

        {/* 4. DATA & COMMS GAUGE */}
        <div className="hud-panel p-5 rounded-xl border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Radio className="w-4 h-4 text-sky-400" />
              <span>Data Link Budget</span>
            </div>
            {budget.isDataFeasible ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                CLEAR
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                BOTTLENECK
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold font-mono text-white">
              {budget.dailyDownlinkCapacityGb.toFixed(0)} <span className="text-xs text-slate-400">GB/day downlink</span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Daily Science Generated: {budget.dailyDataGenGb.toFixed(1)} GB/day
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px] font-mono text-slate-300">
            <div className="flex justify-between">
              <span>Buffer Margin:</span>
              <span className={budget.dataBufferHeadroomGb >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {budget.dataBufferHeadroomGb >= 0 ? `+${budget.dataBufferHeadroomGb.toFixed(1)} GB` : `${budget.dataBufferHeadroomGb.toFixed(1)} GB (Overflow)`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Scenario Minimum:</span>
              <span className="text-white">{scenario.requiredCapabilities.minDataRateDailyGb} GB/day</span>
            </div>
          </div>
        </div>

        {/* 5. POINTING STABILITY GAUGE */}
        <div className="hud-panel p-5 rounded-xl border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Pointing Stability</span>
            </div>
            {budget.isPointingFeasible ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                ALIGNED
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                JITTER ERROR
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold font-mono text-white">
              ±{budget.spacecraftPointingDeg}° <span className="text-xs text-slate-400">ADCS Accuracy</span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Instrument Demanded: ±{budget.pointingDemandedDeg}°
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-300">
            {budget.isPointingFeasible ? (
              <div className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Spacecraft ADCS delivers sufficient stability to maintain optical focus.</span>
              </div>
            ) : (
              <div className="text-rose-400 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                <span>ADCS jitter is too high. Optical images or laser comms will blur.</span>
              </div>
            )}
          </div>
        </div>

        {/* 6. FLIGHT READINESS SUMMARY */}
        <div className="hud-panel p-5 rounded-xl border space-y-4 bg-gradient-to-br from-space-900 to-space-850">
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
            NASA Flight Readiness Verdict
          </div>

          <div className="text-sm font-medium text-slate-200 leading-relaxed">
            {hasCriticalIssues ? (
              <span className="text-rose-400 font-bold">
                NO-GO FOR LAUNCH: Architecture violates fundamental engineering boundaries. Return to Phase 2 to resolve critical issues.
              </span>
            ) : budget.warnings.length > 0 ? (
              <span className="text-amber-300">
                GO WITH ADVISORY: Systems are functionally viable, though operations team must monitor tight subsystem margins.
              </span>
            ) : (
              <span className="text-emerald-400 font-bold">
                GO FOR LAUNCH: All NASA engineering gates passed with healthy margins. Ready for countdown.
              </span>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Telemetry verified against NASA SST-SoA (2024) models.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
