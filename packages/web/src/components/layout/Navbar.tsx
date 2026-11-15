import React from 'react';
import { Rocket, Orbit as OrbitIcon, Cpu, Gauge, Play, Award, Users, RotateCcw } from 'lucide-react';
import { NasaCrest } from '../common/NasaCrest';

export type AppPhase = 'scenario' | 'builder' | 'trajectory' | 'telemetry' | 'launch' | 'operations' | 'debrief';

interface NavbarProps {
  currentPhase: AppPhase;
  onSelectPhase: (phase: AppPhase) => void;
  onOpenMultiplayer: () => void;
  onResetDesign: () => void;
  activeRole?: string;
  roomCode?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPhase,
  onSelectPhase,
  onOpenMultiplayer,
  onResetDesign,
  activeRole,
  roomCode
}) => {
  const navItems: { phase: AppPhase; label: string; icon: React.ReactNode; num: string }[] = [
    { phase: 'scenario', label: 'Scenario', icon: <Rocket className="w-4 h-4" />, num: '01' },
    { phase: 'builder', label: 'Spacecraft', icon: <Cpu className="w-4 h-4" />, num: '02' },
    { phase: 'trajectory', label: 'Trajectory', icon: <OrbitIcon className="w-4 h-4" />, num: '03' },
    { phase: 'telemetry', label: 'Telemetry', icon: <Gauge className="w-4 h-4" />, num: '04' },
    { phase: 'launch', label: 'Launch', icon: <Play className="w-4 h-4" />, num: '05' },
    { phase: 'operations', label: 'Operations', icon: <Play className="w-4 h-4" />, num: '06' },
    { phase: 'debrief', label: 'Debrief', icon: <Award className="w-4 h-4" />, num: '07' }
  ];

  return (
    <header className="border-b border-cyan-500/20 bg-space-950/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <NasaCrest size={38} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                NASA Space Apps
              </span>
              <span className="text-[10px] text-slate-400 font-mono">CML-SIM v1.0</span>
            </div>
            <h1 className="text-lg font-bold tracking-wider text-white hud-heading">
              MISSION <span className="text-cyan-400">ARCHITECT</span>
            </h1>
          </div>
        </div>

        {/* Navigation Step Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-space-900/90 p-1 rounded-xl border border-slate-800">
          {navItems.map((item) => {
            const isActive = currentPhase === item.phase;
            return (
              <button
                key={item.phase}
                onClick={() => onSelectPhase(item.phase)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-space-850'
                }`}
              >
                <span className="font-mono text-[10px] opacity-60">{item.num}</span>
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Multiplayer Button */}
          <button
            onClick={onOpenMultiplayer}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              roomCode
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : 'bg-space-900 border-slate-700 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="font-mono">
              {roomCode ? `ROOM: ${roomCode}` : 'Team Mode'}
            </span>
            {activeRole && (
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-emerald-900 text-emerald-200 text-[10px]">
                {activeRole}
              </span>
            )}
          </button>

          {/* Reset Design */}
          <button
            onClick={onResetDesign}
            title="Reset Spacecraft Design"
            className="p-2 rounded-lg bg-space-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
