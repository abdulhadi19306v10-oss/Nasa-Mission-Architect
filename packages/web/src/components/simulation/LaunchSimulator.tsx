import React, { useState, useEffect } from 'react';
import { SpacecraftDesign, LaunchVehicle, Orbit } from '@sim/index';
import { sound } from '../../utils/soundEngine';
import { triggerConfetti } from '../../utils/confetti';
import { Rocket, Flame, CheckCircle, ShieldAlert, Zap, ArrowRight, Gauge } from 'lucide-react';

interface LaunchSimulatorProps {
  design: SpacecraftDesign;
  launchVehicle: LaunchVehicle;
  orbit: Orbit;
  onLaunchComplete: () => void;
}

export const LaunchSimulator: React.FC<LaunchSimulatorProps> = ({
  design,
  launchVehicle,
  orbit,
  onLaunchComplete
}) => {
  const [stage, setStage] = useState<'PAD' | 'COUNTDOWN' | 'ASCENT' | 'STAGE_SEP_PROMPT' | 'FAIRING_PROMPT' | 'ORBIT_INSERTED'>('PAD');
  const [countdown, setCountdown] = useState(5);
  const [throttle, setThrottle] = useState(100);
  const [altitudeKm, setAltitudeKm] = useState(0);
  const [velocityKmS, setVelocityKmS] = useState(0);
  const [dynamicPressureQ, setDynamicPressureQ] = useState(0);
  const [isShaking, setIsShaking] = useState(false);

  // Countdown timer
  useEffect(() => {
    let timer: any;
    if (stage === 'COUNTDOWN') {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            sound.playCountdownBeep(true);
            sound.playRocketRumble(4.0);
            setStage('ASCENT');
            setIsShaking(true);
            return 0;
          }
          sound.playCountdownBeep(false);
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [stage]);

  // Ascent physics loop
  useEffect(() => {
    let interval: any;
    if (stage === 'ASCENT') {
      interval = setInterval(() => {
        setAltitudeKm((prevAlt) => {
          const nextAlt = prevAlt + (throttle / 100) * 12;

          setVelocityKmS((prevV) => {
            const nextV = Math.min(7.68, prevV + (throttle / 100) * 0.45);
            return nextV;
          });

          // Dynamic pressure bell curve around 20-30km
          if (nextAlt < 45) {
            setDynamicPressureQ(Math.round(Math.sin((nextAlt / 45) * Math.PI) * 100));
          } else {
            setDynamicPressureQ(0);
          }

          // Trigger Stage 1 separation prompt
          if (nextAlt >= 65 && stage === 'ASCENT') {
            sound.playAlarm();
            setStage('STAGE_SEP_PROMPT');
          }

          return nextAlt;
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [stage, throttle]);

  const handleStageSeparation = () => {
    sound.playEquip();
    setStage('ASCENT');
    // Continue upper stage climb
    setTimeout(() => {
      sound.playAlarm();
      setStage('FAIRING_PROMPT');
    }, 2000);
  };

  const handleFairingJettison = () => {
    sound.playEquip();
    setAltitudeKm(orbit.altitudeKm);
    setVelocityKmS(7.67);
    setIsShaking(false);
    setStage('ORBIT_INSERTED');
    sound.playVictory();
    triggerConfetti();
  };

  return (
    <div className={`relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-space-950/95 border-2 border-cyan-500 shadow-2xl space-y-6 ${
      isShaking ? 'animate-bounce' : ''
    }`}>
      {/* Flight Director Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold uppercase">
            NASA Flight Director Mode
          </span>
          <h2 className="text-2xl font-black text-white hud-heading mt-1">
            {launchVehicle.name} Manual Flight Control
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Target Orbit: {orbit.name} ({orbit.altitudeKm}km, {orbit.inclinationDeg}°)
          </p>
        </div>

        {/* Flight Staging Indicator */}
        <div className="flex items-center gap-2">
          {stage === 'ORBIT_INSERTED' ? (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-600 font-mono text-xs font-bold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> ORBIT ACHIEVED
            </span>
          ) : stage !== 'PAD' ? (
            <span className="px-3 py-1.5 rounded-xl bg-amber-950 text-amber-400 border border-amber-600 font-mono text-xs font-bold animate-pulse flex items-center gap-1.5">
              <Flame className="w-4 h-4 fill-current" /> ASCENT BURN ACTIVE
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-space-900 text-slate-400 border border-slate-700 font-mono text-xs">
              HOLD ON PAD
            </span>
          )}
        </div>
      </div>

      {/* Main Arcade Flight HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Left: Altitude & Velocity Flight Needles */}
        <div className="space-y-4 bg-space-900/80 p-5 rounded-2xl border border-slate-800 font-mono">
          <div className="space-y-1">
            <div className="text-xs text-slate-400 uppercase">Altitude</div>
            <div className="text-3xl font-extrabold text-cyan-400">
              {altitudeKm.toFixed(0)} <span className="text-sm text-slate-500">km</span>
            </div>
            <div className="w-full h-2 rounded-full bg-space-950 overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                style={{ width: `${Math.min(100, (altitudeKm / orbit.altitudeKm) * 100)}%` }}
              />
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-800">
            <div className="text-xs text-slate-400 uppercase">Orbital Speed</div>
            <div className="text-3xl font-extrabold text-white">
              {velocityKmS.toFixed(2)} <span className="text-sm text-slate-500">km/s</span>
            </div>
            <div className="w-full h-2 rounded-full bg-space-950 overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500"
                style={{ width: `${Math.min(100, (velocityKmS / 7.67) * 100)}%` }}
              />
            </div>
          </div>

          {dynamicPressureQ > 0 && (
            <div className="pt-2 border-t border-slate-800">
              <div className="flex justify-between text-[11px] text-amber-400">
                <span>Max-Q Dynamic Pressure:</span>
                <span className="font-bold">{dynamicPressureQ}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Center: Stage Action Prompts & Big Countdown */}
        <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
          {stage === 'PAD' && (
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto shadow-xl shadow-cyan-500/20">
                <Rocket className="w-10 h-10 text-black transform -rotate-45" />
              </div>
              <div className="text-sm font-bold text-white font-mono">
                FLIGHT SYSTEMS ARMED
              </div>
              <button
                onClick={() => {
                  sound.playClick();
                  setStage('COUNTDOWN');
                }}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 hover:scale-105 active:scale-95 text-black font-extrabold font-mono text-sm tracking-wider uppercase transition-all shadow-xl shadow-cyan-500/30"
              >
                Ignite Main Booster
              </button>
            </div>
          )}

          {stage === 'COUNTDOWN' && (
            <div className="space-y-2">
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest animate-pulse">
                COUNTDOWN TO IGNITION
              </div>
              <div className="text-8xl font-black font-mono text-white tracking-widest">
                {countdown}
              </div>
            </div>
          )}

          {stage === 'STAGE_SEP_PROMPT' && (
            <div className="p-5 rounded-2xl bg-amber-950/80 border-2 border-amber-500 shadow-xl space-y-3 animate-pulse">
              <div className="text-xs font-mono text-amber-400 font-bold uppercase">
                BOOSTER BURNOUT — MECO
              </div>
              <p className="text-xs text-white font-mono">
                First stage fuel depleted! Release pneumatic clamps now.
              </p>
              <button
                onClick={handleStageSeparation}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-mono font-bold text-xs uppercase tracking-wider shadow-lg"
              >
                JETTISON STAGE 1 (MECO)
              </button>
            </div>
          )}

          {stage === 'FAIRING_PROMPT' && (
            <div className="p-5 rounded-2xl bg-cyan-950/80 border-2 border-cyan-400 shadow-xl space-y-3 animate-pulse">
              <div className="text-xs font-mono text-cyan-400 font-bold uppercase">
                VACUUM REACHED — 100 KM
              </div>
              <p className="text-xs text-white font-mono">
                Atmosphere cleared. Jettison protective payload fairing!
              </p>
              <button
                onClick={handleFairingJettison}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-mono font-bold text-xs uppercase tracking-wider shadow-lg"
              >
                DEPLOY FAIRING HALVES
              </button>
            </div>
          )}

          {stage === 'ORBIT_INSERTED' && (
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40">
                <CheckCircle className="w-12 h-12 text-black" />
              </div>
              <div className="space-y-1">
                <div className="text-xl font-bold font-mono text-emerald-400">
                  ORBITAL INSERTION CONFIRMED!
                </div>
                <div className="text-xs text-slate-300 font-mono">
                  Spacecraft separated into {orbit.name}. All instruments online!
                </div>
              </div>
              <button
                onClick={onLaunchComplete}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 hover:scale-105 active:scale-95 text-black font-mono font-extrabold text-xs uppercase tracking-wider shadow-xl shadow-cyan-500/30 mx-auto"
              >
                <span>Enter Science Operations Mode</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Manual Throttle Control Slider */}
        <div className="bg-space-900/80 p-5 rounded-2xl border border-slate-800 font-mono space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-cyan-400" /> Engine Throttle
            </span>
            <span className="text-emerald-400 font-bold">{throttle}%</span>
          </div>

          <div className="h-40 flex items-center justify-center">
            <input
              type="range"
              min="20"
              max="100"
              value={throttle}
              disabled={stage === 'PAD' || stage === 'ORBIT_INSERTED'}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setThrottle(val);
                sound.playClick(400 + val * 4);
              }}
              className="h-32 -rotate-90 w-32 cursor-pointer accent-cyan-400"
            />
          </div>

          <div className="text-[11px] text-slate-400 text-center">
            Drag to modulate thrust. Reduce during Max-Q to prevent structural stress.
          </div>
        </div>
      </div>
    </div>
  );
};
