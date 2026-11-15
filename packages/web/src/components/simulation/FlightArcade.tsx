import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SpacecraftDesign, LaunchVehicle, Orbit } from '@sim/index';
import { LaunchVisualState, LaunchMotionRefState } from '../3d/GameCanvas3D';
import {
  getFlightCourseForOrbit,
  COURSE_LANE_LIMIT,
  sampleCourseLaneX
} from '../../game/flightCourse';
import { sound } from '../../utils/soundEngine';
import { triggerConfetti } from '../../utils/confetti';
import { NasaCrest } from '../common/NasaCrest';
import {
  Flame,
  CheckCircle,
  ArrowRight,
  Zap,
  Camera
} from 'lucide-react';

type LaunchPhase = 'COUNTDOWN' | 'BOOSTER_ASCENT' | 'UPPER_STAGE' | 'ORBIT_SUCCESS';
type GateResult = 'pending' | 'hit' | 'miss';

export interface FlightOutcomeMeta {
  maxQMastered: boolean;
  precisionStages: number;
  gatesHit: number;
  totalGates: number;
  perfectApexCount: number;
}

interface FlightArcadeProps {
  design: SpacecraftDesign;
  launchVehicle: LaunchVehicle;
  orbit: Orbit;
  onAscentSuccess: (flightBonusXp: number, meta: FlightOutcomeMeta) => void;
  onAbort: () => void;
  onProgressUpdate: (progressPercent: number) => void;
  onLaunchStateChange?: (state: LaunchVisualState) => void;
  launchMotionRef?: React.MutableRefObject<LaunchMotionRefState>;
  onOpenTutorial?: () => void;
}

export const FlightArcade: React.FC<FlightArcadeProps> = ({
  design,
  launchVehicle,
  orbit,
  onAscentSuccess,
  onAbort,
  onProgressUpdate,
  onLaunchStateChange,
  launchMotionRef,
  onOpenTutorial
}) => {
  const course = useMemo(() => getFlightCourseForOrbit(orbit.id), [orbit.id]);

  const [phase, setPhase] = useState<LaunchPhase>('COUNTDOWN');
  const [countdown, setCountdown] = useState(3);
  const [progress, setProgress] = useState(0);
  const [pitchAngleDeg, setPitchAngleDeg] = useState(90);
  const [laneX, setLaneX] = useState(0);
  const [nextTargetX, setNextTargetX] = useState(() => course.gates[0]?.targetX ?? 0);
  const [throttle, setThrottle] = useState(100);
  const [qPressure, setQPressure] = useState(0);
  const [flightScore, setFlightScore] = useState(150);
  const [streak, setStreak] = useState(1);
  const [gatesHit, setGatesHit] = useState(0);
  const [maxQMastered, setMaxQMastered] = useState(false);
  const [stageSeparated, setStageSeparated] = useState(false);
  const [fairingDeployed, setFairingDeployed] = useState(false);
  const [stageArmedLabel, setStageArmedLabel] = useState<string | null>(null);
  const [callout, setCallout] = useState<string | null>(null);
  const [cameraAngle, setCameraAngle] = useState<'chase' | 'side' | 'pad'>('chase');
  const [precisionStages, setPrecisionStages] = useState(0);

  const phaseRef = useRef<LaunchPhase>('COUNTDOWN');
  const progressRef = useRef(0);
  const pitchRef = useRef(90);
  const laneXRef = useRef(0);
  const laneVelXRef = useRef(0);
  const throttleRef = useRef(100);
  const scoreRef = useRef(150);
  const streakCountRef = useRef(0);
  const maxQSafeTicksRef = useRef(0);
  const maxQRewardedRef = useRef(false);
  const precisionStagesRef = useRef(0);
  const perfectApexCountRef = useRef(0);
  const cameraAngleRef = useRef<'chase' | 'side' | 'pad'>('chase');
  const stageSepRef = useRef(false);
  const fairingRef = useRef(false);
  const gateResultsRef = useRef<GateResult[]>(course.gates.map(() => 'pending'));
  const keysRef = useRef({ left: false, right: false, up: false, down: false });

  useEffect(() => {
    gateResultsRef.current = course.gates.map(() => 'pending');
    laneXRef.current = 0;
    laneVelXRef.current = 0;
    setLaneX(0);
    setNextTargetX(course.gates[0]?.targetX ?? 0);
  }, [course]);

  const flashCallout = useCallback((msg: string) => {
    setCallout(msg);
  }, []);

  useEffect(() => {
    if (!callout) return;
    const t = setTimeout(() => setCallout(null), 1900);
    return () => clearTimeout(t);
  }, [callout]);

  const emitVisualState = useCallback(
    (prog: number, ph: LaunchPhase, pitch: number, thr: number, sep: boolean, fair: boolean, stress: boolean) => {
      onProgressUpdate(prog);
      onLaunchStateChange?.({
        progressPercent: prog,
        phase: ph,
        pitchAngleDeg: pitch,
        throttle: thr,
        stageSeparated: sep,
        fairingDeployed: fair,
        maxQStress: stress,
        cameraAngle: cameraAngleRef.current,
        gateResults: [...gateResultsRef.current],
        steerLaneX: laneXRef.current,
        steerVelX: laneVelXRef.current
      });
    },
    [onProgressUpdate, onLaunchStateChange]
  );

  // Non-blocking mid-flight [SPACE] staging / jettison trigger
  const triggerLiveStage = useCallback(() => {
    const p = progressRef.current;
    if (phaseRef.current === 'COUNTDOWN' || phaseRef.current === 'ORBIT_SUCCESS') return;

    if (!stageSepRef.current && p >= 34 && p <= 53) {
      stageSepRef.current = true;
      setStageSeparated(true);
      phaseRef.current = 'UPPER_STAGE';
      setPhase('UPPER_STAGE');
      sound.playStageSep();
      sound.playRocketRumble(3.2);
      const hotWindow = p >= 40 && p <= 49;
      if (hotWindow) {
        precisionStagesRef.current += 1;
        setPrecisionStages(precisionStagesRef.current);
      }
      const bonus = hotWindow ? 260 : 140;
      scoreRef.current += bonus;
      setFlightScore(scoreRef.current);
      flashCallout(hotWindow ? `HOT-STAGE MECO! +${bonus} XP` : `STAGE 1 JETTISONED +${bonus} XP`);
      return;
    }

    if (stageSepRef.current && !fairingRef.current && p >= 64 && p <= 83) {
      fairingRef.current = true;
      setFairingDeployed(true);
      sound.playStageSep();
      const crispWindow = p >= 68 && p <= 77;
      if (crispWindow) {
        precisionStagesRef.current += 1;
        setPrecisionStages(precisionStagesRef.current);
      }
      const bonus = crispWindow ? 240 : 120;
      scoreRef.current += bonus;
      setFlightScore(scoreRef.current);
      flashCallout(crispWindow ? `KARMAN FAIRING SEP! +${bonus} XP` : `FAIRINGS DEPLOYED +${bonus} XP`);
    }
  }, [flashCallout]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysRef.current.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = true;
      if (e.code === 'Space') {
        e.preventDefault();
        triggerLiveStage();
      }
      if (e.key === 'c' || e.key === 'C') {
        setCameraAngle((prev) => {
          const next = prev === 'chase' ? 'side' : prev === 'side' ? 'pad' : 'chase';
          cameraAngleRef.current = next;
          return next;
        });
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysRef.current.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [triggerLiveStage]);

  // Fast T-3 Countdown -> Continuous Liftoff
  useEffect(() => {
    if (phase !== 'COUNTDOWN') return;
    sound.playCountdownBeep(false);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          sound.playCountdownBeep(true);
          sound.playRocketRumble(5.5);
          phaseRef.current = 'BOOSTER_ASCENT';
          setPhase('BOOSTER_ASCENT');
          flashCallout('LIFTOFF — STEER THROUGH FLIGHT GATES');
          return 0;
        }
        sound.playCountdownBeep(false);
        return prev - 1;
      });
    }, 750);
    return () => clearInterval(timer);
  }, [phase, flashCallout]);

  // Continuous 60fps Ascent Physics & Gate Loop (Zero Stops!)
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let uiSyncAccum = 0;

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const curPhase = phaseRef.current;

      if (curPhase === 'BOOSTER_ASCENT' || curPhase === 'UPPER_STAGE') {
        const steerInput = (keysRef.current.right ? 1 : 0) - (keysRef.current.left ? 1 : 0);
        laneVelXRef.current += steerInput * 32.0 * dt;
        laneVelXRef.current *= Math.exp(-6.2 * dt);
        laneXRef.current += laneVelXRef.current * dt;
        if (laneXRef.current < -COURSE_LANE_LIMIT) {
          laneXRef.current = -COURSE_LANE_LIMIT;
          laneVelXRef.current = Math.max(0, laneVelXRef.current);
        } else if (laneXRef.current > COURSE_LANE_LIMIT) {
          laneXRef.current = COURSE_LANE_LIMIT;
          laneVelXRef.current = Math.min(0, laneVelXRef.current);
        }

        if (keysRef.current.up) throttleRef.current = Math.min(100, throttleRef.current + 65 * dt);
        if (keysRef.current.down) throttleRef.current = Math.max(40, throttleRef.current - 65 * dt);

        const baseRate = curPhase === 'BOOSTER_ASCENT' ? 4.3 : 5.2;
        const throttleFactor = 0.45 + (throttleRef.current / 100) * 0.68;
        const nextProg = Math.min(100, progressRef.current + baseRate * throttleFactor * dt);
        progressRef.current = nextProg;

        const targetPitch = Math.max(12, 90 - Math.pow(nextProg / 100, 0.85) * 78);
        pitchRef.current = targetPitch;

        if (launchMotionRef) {
          launchMotionRef.current.progressPercent = nextProg;
          launchMotionRef.current.steerLaneX = laneXRef.current;
          launchMotionRef.current.steerVelX = laneVelXRef.current;
          launchMotionRef.current.throttle = throttleRef.current;
        }

        // Max-Q aerodynamic envelope
        let q = 0;
        if (nextProg >= 8 && nextProg <= 42) {
          q = Math.round(Math.sin(((nextProg - 8) / 34) * Math.PI) * (throttleRef.current / 100) * 105);
        }
        const inMaxQZone = nextProg >= 16 && nextProg <= 36;
        const maxQOverstressed = inMaxQZone && throttleRef.current > 86;

        if (inMaxQZone && throttleRef.current >= 50 && throttleRef.current <= 84) {
          maxQSafeTicksRef.current += dt;
          if (maxQSafeTicksRef.current > 1.2 && !maxQRewardedRef.current) {
            maxQRewardedRef.current = true;
            setMaxQMastered(true);
            scoreRef.current += 250;
            sound.playComboChime(3);
            flashCallout('MAX-Q THROTTLE ACE! +250 XP');
          }
        }

        // Check real 3D slalom ring passage by lateral alignment distance
        course.gates.forEach((gate, idx) => {
          if (gateResultsRef.current[idx] === 'pending' && nextProg >= gate.progress) {
            const dist = Math.abs(laneXRef.current - gate.targetX);
            const hit = dist <= gate.radius;
            const apex = dist <= gate.radius * 0.42;
            gateResultsRef.current[idx] = hit ? 'hit' : 'miss';
            if (hit) {
              streakCountRef.current += 1;
              if (apex) perfectApexCountRef.current += 1;
              const mult = Math.min(4, 1 + Math.floor(streakCountRef.current / 2));
              const pts = (apex ? 140 : 90) * mult;
              scoreRef.current += pts;
              setGatesHit((g) => g + 1);
              sound.playComboChime(apex ? Math.min(4, mult + 1) : mult);
              flashCallout(
                apex
                  ? `${gate.label} PERFECT APEX! +${pts} XP (x${mult})`
                  : `${gate.label} CLEAN! +${pts} XP`
              );
            } else {
              streakCountRef.current = 0;
              sound.playAlarm();
              flashCallout(
                `${gate.label} WIDE — ${laneXRef.current < gate.targetX ? 'STEER RIGHT [D]' : 'STEER LEFT [A]'}`
              );
            }
          }
        });

        // Smooth failsafe auto-staging if player ignores manual stage trigger
        if (!stageSepRef.current && nextProg >= 53) {
          stageSepRef.current = true;
          setStageSeparated(true);
          phaseRef.current = 'UPPER_STAGE';
          setPhase('UPPER_STAGE');
          sound.playStageSep();
          flashCallout('AUTO-STAGE MECO (NO BONUS)');
        }
        if (stageSepRef.current && !fairingRef.current && nextProg >= 83) {
          fairingRef.current = true;
          setFairingDeployed(true);
          sound.playStageSep();
          flashCallout('AUTO-FAIRING DEPLOY (NO BONUS)');
        }

        // Reach orbit cleanly at 100%
        if (nextProg >= 100) {
          sound.playStageSep();
          sound.playVictory();
          triggerConfetti();
          precisionStagesRef.current += 1;
          setPrecisionStages(precisionStagesRef.current);
          scoreRef.current += 300;
          phaseRef.current = 'ORBIT_SUCCESS';
          setPhase('ORBIT_SUCCESS');
        }

        uiSyncAccum += dt;
        if (uiSyncAccum >= 0.05 || nextProg >= 100) {
          uiSyncAccum = 0;
          const nextGate = course.gates.find((_, i) => gateResultsRef.current[i] === 'pending');
          setProgress(nextProg);
          setPitchAngleDeg(Math.round(pitchRef.current));
          setLaneX(laneXRef.current);
          setNextTargetX(nextGate ? nextGate.targetX : sampleCourseLaneX(course, nextProg));
          setThrottle(Math.round(throttleRef.current));
          setQPressure(q);
          setFlightScore(scoreRef.current);
          setStreak(Math.min(4, 1 + Math.floor(streakCountRef.current / 2)));

          if (!stageSepRef.current && nextProg >= 36) {
            setStageArmedLabel('[SPACE] STAGE 1 MECO');
          } else if (stageSepRef.current && !fairingRef.current && nextProg >= 66) {
            setStageArmedLabel('[SPACE] JETTISON FAIRINGS');
          } else {
            setStageArmedLabel(null);
          }

          emitVisualState(
            nextProg,
            phaseRef.current,
            pitchRef.current,
            throttleRef.current,
            stageSepRef.current,
            fairingRef.current,
            maxQOverstressed
          );
        }
      } else {
        if (launchMotionRef) {
          launchMotionRef.current.progressPercent = progressRef.current;
          launchMotionRef.current.steerLaneX = laneXRef.current;
          launchMotionRef.current.steerVelX = laneVelXRef.current;
          launchMotionRef.current.throttle = throttleRef.current;
        }
        uiSyncAccum += dt;
        if (uiSyncAccum >= 0.1) {
          uiSyncAccum = 0;
          emitVisualState(
            progressRef.current,
            curPhase,
            pitchRef.current,
            throttleRef.current,
            stageSepRef.current,
            fairingRef.current,
            false
          );
        }
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [course, emitVisualState, flashCallout, launchMotionRef]);

  const setHoldKey = (dir: 'left' | 'right', active: boolean) => {
    keysRef.current[dir] = active;
  };

  const setThrottlePreset = (val: number) => {
    sound.playClick(420 + val * 4);
    throttleRef.current = val;
    setThrottle(val);
  };

  const isDeepSpaceEscape = orbit.centralBody !== 'earth';
  const displayAltKm = isDeepSpaceEscape
    ? progress < 70
      ? (progress / 70) * 185
      : 185 + ((progress - 70) / 30) * 4200
    : orbit.id === 'orbit-geo-35786'
    ? progress < 70
      ? (progress / 70) * 185
      : 185 + Math.pow((progress - 70) / 30, 1.5) * 35601
    : (progress / 100) * orbit.altitudeKm;

  const targetSpeedKmS = isDeepSpaceEscape
    ? 10.9 + (orbit.centralBody === 'mars' || orbit.centralBody === 'venus' ? 0.6 : orbit.centralBody === 'europa' || orbit.centralBody === 'titan' ? 2.8 : 0)
    : orbit.id === 'orbit-geo-35786'
    ? 10.2
    : orbit.deltaVRequiredKmS || 7.67;
  const displayVelocityKmS = Math.min(targetSpeedKmS, (progress / 100) * targetSpeedKmS);
  const stage1FuelPct = stageSeparated ? 0 : Math.max(0, Math.round(100 - (progress / 47) * 100));
  const totalGates = course.gates.length;
  const laneDelta = nextTargetX - laneX;
  const isGateAligned = Math.abs(laneDelta) <= course.gateRadius;
  const isApexAligned = Math.abs(laneDelta) <= course.gateRadius * 0.42;
  const inMaxQZone = progress >= 16 && progress <= 36;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 select-none font-mono text-xs z-40">
      {/* TOP FLIGHT TELEMETRY & OBJECTIVES BAR */}
      <div className="space-y-2 pointer-events-auto">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="game-frame px-4 py-2 flex items-center gap-3">
            <NasaCrest size={30} />
            <div>
              <div className="text-[10px] text-sky-400 font-bold tracking-widest uppercase">
                {launchVehicle.name} &rarr; {orbit.name} ({course.name})
              </div>
              <div className="text-white font-black text-sm tracking-wider">
                {design.name.toUpperCase()} // ASCENT {progress.toFixed(0)}% &bull; GATE {gatesHit}/{totalGates}
              </div>
            </div>
          </div>

          {/* Telemetry Readout Strip */}
          <div className="game-frame px-4 py-2 flex items-center gap-5">
            <div>
              <div className="text-[9px] text-slate-400">ALTITUDE</div>
              <div className="text-sm font-black text-sky-300">{displayAltKm.toFixed(0)} KM</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-400">VELOCITY</div>
              <div className="text-sm font-black text-white">{displayVelocityKmS.toFixed(2)} KM/S</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-400">DYN-Q</div>
              <div className={`text-sm font-black ${inMaxQZone && throttle > 86 ? 'text-rose-400 animate-pulse' : 'text-amber-300'}`}>
                {qPressure} kPa
              </div>
            </div>
            <div>
              <div className="text-[9px] text-slate-400">FLIGHT XP</div>
              <div className="text-sm font-black text-emerald-400">+{flightScore}</div>
            </div>
          </div>

          {/* Camera & Abort Controls */}
          <div className="flex items-center gap-2">
            {onOpenTutorial && (
              <button
                onClick={() => {
                  sound.playClick(840);
                  onOpenTutorial();
                }}
                className="game-chip px-3 py-2 bg-[#0b3d91] border border-amber-400/60 text-amber-200 hover:brightness-125 font-bold uppercase text-[10px]"
              >
                ? TUTORIAL
              </button>
            )}
            <button
              onClick={() => {
                sound.playClick(780);
                const next = cameraAngle === 'chase' ? 'side' : cameraAngle === 'side' ? 'pad' : 'chase';
                cameraAngleRef.current = next;
                setCameraAngle(next);
              }}
              className="game-chip px-3 py-2 bg-space-950/90 border border-sky-500/40 text-sky-300 hover:border-sky-300 font-bold uppercase text-[10px] flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>CAM:{cameraAngle}</span>
            </button>
            <button
              onClick={() => {
                sound.playClick(400);
                onAbort();
              }}
              className="game-chip px-3 py-2 bg-rose-950/80 border border-red-500/60 text-red-200 hover:bg-red-900 font-bold uppercase text-[10px]"
            >
              ABORT TO VAB
            </button>
          </div>
        </div>

        {/* LIVE ASCENT GOALS TRACKER (IMPOSSIBLE TO MISS) */}
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          <div className="game-chip px-3 py-1 bg-[#0b3d91]/60 border border-sky-400/40 text-white font-bold flex items-center gap-3 flex-wrap">
            <span className="text-red-400 font-black">ASCENT GOALS:</span>
            <span className={gatesHit >= Math.ceil(totalGates * 0.65) ? 'text-emerald-300' : 'text-slate-200'}>
              [{gatesHit}/{totalGates}] Steer skyway rings [A/D or &larr;/&rarr;]
            </span>
            <span className="text-slate-500">&bull;</span>
            <span className={maxQMastered ? 'text-emerald-300' : inMaxQZone ? 'text-amber-300 animate-pulse' : 'text-slate-300'}>
              {maxQMastered ? '[DONE]' : '[16-36%]'} Hold 72% Q [W/S]
            </span>
            <span className="text-slate-500">&bull;</span>
            <span className={stageSeparated && fairingDeployed ? 'text-emerald-300' : 'text-slate-300'}>
              [SPACE] Stage ({stageSeparated ? '1/2' : '0/2'} / {fairingDeployed ? '2/2' : stageSeparated ? '1/2' : '0/2'})
            </span>
          </div>
        </div>
      </div>

      {/* CENTER: T-3 IGNITION OR CALLOUT FLASH ONLY (CLEAR 3D SKY VIEW) */}
      <div className="relative flex-1 flex items-center justify-center pointer-events-none">
        {phase === 'COUNTDOWN' && (
          <div className="text-center space-y-2 animate-pulse">
            <div className="text-[11px] font-bold text-cyan-400 tracking-[0.35em]">MAIN ENGINE START</div>
            <div className="text-8xl font-black text-white hud-glow-text">T-{countdown}</div>
          </div>
        )}

        {callout && phase !== 'COUNTDOWN' && (
          <div className="game-blade px-7 py-2.5 bg-cyan-950/90 border-y-2 border-cyan-400 text-white font-black text-sm tracking-widest uppercase shadow-2xl">
            {callout}
          </div>
        )}
      </div>

      {/* BOTTOM TACTICAL FLIGHT COCKPIT STRIP */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-3 pointer-events-auto">
        {/* Left: Propellant & Throttle Deck */}
        <div className="game-frame p-3.5 w-full lg:w-80 space-y-2.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400">STAGE 1 LOX/RP-1 FUEL</span>
            <span className={stage1FuelPct <= 15 && !stageSeparated ? 'text-amber-300 font-black animate-pulse' : 'text-cyan-300 font-bold'}>
              {stageSeparated ? 'STAGE 2 BURNING' : `${stage1FuelPct}%`}
            </span>
          </div>
          <div className="grid grid-cols-10 gap-1 h-2.5">
            {Array.from({ length: 10 }).map((_, i) => {
              const active = stageSeparated ? progress < 100 && i < 10 - Math.floor((progress - 45) / 5.5) : i < Math.ceil(stage1FuelPct / 10);
              return (
                <div
                  key={i}
                  className={`transition-colors ${
                    stageSeparated
                      ? active
                        ? 'bg-sky-400'
                        : 'bg-slate-900'
                      : active
                      ? stage1FuelPct < 20
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                      : 'bg-slate-900'
                  }`}
                />
              );
            })}
          </div>

          {/* Clickable Throttle Detents */}
          <div className="space-y-1 pt-1 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">THRUST [W/S]</span>
              <span className={inMaxQZone && throttle > 86 ? 'text-rose-400 font-black' : 'text-emerald-400 font-bold'}>
                {throttle}% {inMaxQZone ? (throttle <= 84 ? '• MAX-Q OK' : '• THROTTLE DOWN!') : ''}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-[10px]">
              {[50, 72, 85, 100].map((val) => (
                <button
                  key={val}
                  onClick={() => setThrottlePreset(val)}
                  className={`game-chip py-1.5 font-black border transition-all ${
                    Math.abs(throttle - val) <= 6
                      ? val === 72 && inMaxQZone
                        ? 'bg-amber-400 text-black border-amber-200'
                        : 'bg-cyan-400 text-black border-cyan-200'
                      : 'bg-space-900/80 text-slate-300 border-slate-700 hover:border-cyan-400'
                  }`}
                >
                  {val === 72 ? '72% Q' : `${val}%`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Non-Blocking Live Stage Trigger or Orbit Complete */}
        <div className="flex-1 flex flex-col items-center justify-end gap-2">
          {phase === 'ORBIT_SUCCESS' ? (
            <div className="game-frame p-4 border-emerald-400 flex flex-col sm:flex-row items-center gap-4 w-full max-w-xl">
              <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />
              <div className="flex-1 text-center sm:text-left">
                <div className="text-sm font-black text-emerald-300 tracking-wider">ORBITAL INSERTION CONFIRMED</div>
                <div className="text-[11px] text-slate-300">
                  {gatesHit}/{totalGates} Flight Gates &bull; {precisionStages}/3 Precision Stages &bull; +{flightScore} XP
                </div>
              </div>
              <button
                onClick={() => {
                  sound.playEquip();
                  onAscentSuccess(flightScore, {
                    maxQMastered,
                    precisionStages,
                    gatesHit,
                    totalGates,
                    perfectApexCount: perfectApexCountRef.current
                  });
                }}
                className="game-chip px-5 py-2.5 bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-black uppercase tracking-wider flex items-center gap-1.5 hover:brightness-110 shrink-0"
              >
                <span>COMMAND ORBIT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : stageArmedLabel ? (
            <button
              onClick={triggerLiveStage}
              className="game-blade px-8 py-3 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-black font-black text-sm uppercase tracking-widest shadow-2xl shadow-amber-500/40 animate-bounce flex items-center gap-2"
            >
              {stageSeparated ? <Zap className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
              <span>{stageArmedLabel}</span>
            </button>
          ) : (
            <div className="game-chip px-5 py-1.5 bg-space-950/85 border border-cyan-500/30 text-[10px] text-slate-300 tracking-wider">
              <strong className="text-cyan-300">[A/D or &larr;/&rarr;]</strong> STEER RINGS &bull;{' '}
              <strong className="text-amber-300">[W/S]</strong> THROTTLE &bull;{' '}
              <strong className="text-emerald-300">[SPACE]</strong> STAGE AT FUEL EMPTY
            </div>
          )}
        </div>

        {/* Right: Car-Style Skyway Steering Alignment Radar */}
        <div className="game-frame p-3.5 w-full lg:w-80 space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-bold uppercase tracking-wider">
              SKYWAY RADAR &bull; {course.difficultyLabel}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">PITCH {pitchAngleDeg}&deg;</span>
              <span className="px-1.5 py-0.5 bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-black">
                x{streak}
              </span>
            </div>
          </div>

          {/* Live Horizontal Lane Radar Bar */}
          <div className="relative h-8 bg-space-950/90 border border-slate-700/80 rounded overflow-hidden">
            {/* Center centerline */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-700/80" />

            {/* Next Gate Catch Zone Bracket */}
            <div
              className={`absolute top-1 bottom-1 rounded border-2 transition-all duration-75 ${
                isApexAligned
                  ? 'bg-emerald-400/25 border-emerald-300'
                  : isGateAligned
                  ? 'bg-cyan-400/20 border-cyan-300'
                  : 'bg-amber-400/20 border-amber-400'
              }`}
              style={{
                left: `${((nextTargetX + COURSE_LANE_LIMIT) / (2 * COURSE_LANE_LIMIT)) * 100}%`,
                width: `${(course.gateRadius / COURSE_LANE_LIMIT) * 100}%`,
                transform: 'translateX(-50%)'
              }}
            />

            {/* Player Rocket Position Indicator */}
            <div
              className={`absolute top-1.5 bottom-1.5 w-2.5 rounded-sm shadow-lg transition-all duration-75 ${
                isGateAligned ? 'bg-emerald-400 shadow-emerald-400/70' : 'bg-white shadow-white/50'
              }`}
              style={{
                left: `${((laneX + COURSE_LANE_LIMIT) / (2 * COURSE_LANE_LIMIT)) * 100}%`,
                transform: 'translateX(-50%)'
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px]">
            <span
              className={`font-black tracking-wider ${
                isApexAligned
                  ? 'text-emerald-400'
                  : isGateAligned
                  ? 'text-cyan-300'
                  : laneDelta > 0
                  ? 'text-amber-300'
                  : 'text-sky-300'
              }`}
            >
              {isApexAligned
                ? 'PERFECT APEX ✓'
                : isGateAligned
                ? 'INSIDE RING ✓'
                : laneDelta > 0
                ? 'STEER RIGHT [D] →'
                : '← STEER LEFT [A]'}
            </span>
            <span className="text-slate-400">
              OFFSET {laneDelta >= 0 ? '+' : ''}
              {laneDelta.toFixed(1)}m
            </span>
          </div>

          <div className="flex gap-1.5">
            <button
              onPointerDown={() => setHoldKey('left', true)}
              onPointerUp={() => setHoldKey('left', false)}
              onPointerLeave={() => setHoldKey('left', false)}
              onPointerCancel={() => setHoldKey('left', false)}
              className="flex-1 py-2 game-chip bg-space-900 border border-slate-700 hover:border-cyan-400 text-white font-black text-[11px] active:scale-95"
            >
              &larr; STEER (A)
            </button>
            <button
              onPointerDown={() => setHoldKey('right', true)}
              onPointerUp={() => setHoldKey('right', false)}
              onPointerLeave={() => setHoldKey('right', false)}
              onPointerCancel={() => setHoldKey('right', false)}
              className="flex-1 py-2 game-chip bg-space-900 border border-slate-700 hover:border-cyan-400 text-white font-black text-[11px] active:scale-95"
            >
              (D) STEER &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
