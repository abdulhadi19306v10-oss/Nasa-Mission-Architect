import React from 'react';
import { SpacecraftDesign, DataRegistry, getLaunchCapacityForOrbit } from '@sim/index';
import { OrbitViewer } from '../3d/OrbitViewer';
import { Rocket, Globe, Clock, ShieldAlert, ArrowRight, DollarSign } from 'lucide-react';

interface TrajectoryPickerProps {
  design: SpacecraftDesign;
  data: DataRegistry;
  onChangeDesign: (updater: (prev: SpacecraftDesign) => SpacecraftDesign) => void;
  onProceed: () => void;
}

export const TrajectoryPicker: React.FC<TrajectoryPickerProps> = ({
  design,
  data,
  onChangeDesign,
  onProceed
}) => {
  const selectedOrbit = data.orbits.find((o) => o.id === design.orbitId) || data.orbits[0];
  const selectedLauncher = data.launchVehicles.find((l) => l.id === design.launchVehicleId) || data.launchVehicles[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-cyan-400">PHASE 3: LAUNCH & ORBITAL MECHANICS</div>
          <h2 className="text-2xl font-bold text-white hud-heading">
            Launch Vehicle & Mission Orbit Selection
          </h2>
          <p className="text-xs text-slate-400">
            NASA Launch Services Program (LSP) performance matching. Ensure your launch vehicle can reach the targeted inclination and altitude.
          </p>
        </div>
        <button
          onClick={onProceed}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs font-mono transition-all shadow-lg shadow-cyan-500/25"
        >
          <span>Evaluate Live Telemetry</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Orbit & Launcher Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Orbit Selector */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300 uppercase tracking-wider">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Target Mission Orbit</span>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {data.orbits.map((orbit) => {
                const isSelected = orbit.id === design.orbitId;
                return (
                  <div
                    key={orbit.id}
                    onClick={() => onChangeDesign((prev) => ({ ...prev, orbitId: orbit.id }))}
                    className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                        : 'bg-space-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">{orbit.name}</h4>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-space-850 text-cyan-400 border border-cyan-900 capitalize">
                        {orbit.centralBody}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{orbit.description}</p>
                    <div className="flex items-center gap-4 mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-300">
                      <span>Alt: <strong className="text-cyan-400">{orbit.altitudeKm.toLocaleString()} km</strong></span>
                      <span>Inc: <strong className="text-white">{orbit.inclinationDeg}°</strong></span>
                      <span>Period: <strong className="text-white">{orbit.periodMinutes} min</strong></span>
                      <span>Eclipse: <strong className="text-amber-400">{orbit.eclipseMinutes} min</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Launch Vehicle Selector */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300 uppercase tracking-wider">
              <Rocket className="w-4 h-4 text-cyan-400" />
              <span>NASA LSP Launch Vehicle</span>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {data.launchVehicles.map((lv) => {
                const isSelected = lv.id === design.launchVehicleId;

                const capacity = getLaunchCapacityForOrbit(lv, selectedOrbit);

                return (
                  <div
                    key={lv.id}
                    onClick={() => onChangeDesign((prev) => ({ ...prev, launchVehicleId: lv.id }))}
                    className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                        : 'bg-space-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{lv.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400">({lv.provider})</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400">${lv.costM}M</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{lv.description}</p>
                    <div className="flex items-center gap-4 mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-300">
                      <span>Lift to Selected Orbit: <strong className={capacity > 0 ? 'text-cyan-400' : 'text-rose-400'}>
                        {capacity > 0 ? `${capacity.toLocaleString()} kg` : 'INCOMPATIBLE'}
                      </strong></span>
                      <span>Fairing: <strong className="text-white">Ø{lv.fairingDiameterM}m</strong></span>
                      <span>Reliability: <strong className="text-emerald-400">{(lv.reliabilityRating * 100).toFixed(0)}%</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: 3D Celestial Orbit Visualizer */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
          <div className="hud-panel p-3 rounded-2xl border border-cyan-500/30">
            <div className="flex items-center justify-between pb-2 px-1">
              <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">
                3D Orbital Simulation
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Ground Network Link Active
              </span>
            </div>
            <div className="h-[420px]">
              <OrbitViewer orbit={selectedOrbit} />
            </div>
          </div>

          {/* Quick Orbit Telemetry */}
          <div className="bg-space-900/80 p-3.5 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">Flight Profile Summary</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>Target Body: <span className="text-white capitalize">{selectedOrbit.centralBody}</span></div>
              <div>Ground Passes: <span className="text-cyan-400">{selectedOrbit.groundStationContactsPerDay} / day</span></div>
              <div>Pass Duration: <span className="text-white">{selectedOrbit.avgPassDurationMinutes} min</span></div>
              <div>Radiation Level: <span className="text-amber-400 uppercase">{selectedOrbit.radiationLevel}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
