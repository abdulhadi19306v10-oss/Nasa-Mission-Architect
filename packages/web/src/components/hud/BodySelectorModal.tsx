import React, { useEffect, useMemo, useState } from 'react';
import {
  Orbit,
  CelestialBodyId,
  CelestialBodyCategory,
  CELESTIAL_BODY_LIST,
  getCelestialBodyMeta,
  getNasaMissionProfile
} from '@sim/index';
import {
  Globe,
  Orbit as OrbitIcon,
  Sun,
  Magnet,
  Rocket,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  X,
  Gauge,
  Compass,
  Satellite,
  Infinity as InfinityIcon
} from 'lucide-react';
import { sound } from '../../utils/soundEngine';
import { getBodyThumbnailUrl } from '../3d/planetaryTextures';

interface BodySelectorModalProps {
  isOpen: boolean;
  orbits: Orbit[];
  currentOrbitId: string;
  isCampaignMission: boolean;
  onSelectOrbit: (orbitId: string, autoEquipWorldSpec: boolean) => void;
  onClose: () => void;
}

type CategoryFilter = 'all' | CelestialBodyCategory;

const CATEGORY_LABELS: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'ALL BODIES (8)' },
  { id: 'planet', label: 'PLANETS' },
  { id: 'moon', label: 'MOONS' },
  { id: 'other', label: 'ASTEROID & L2' }
];

export const BodySelectorModal: React.FC<BodySelectorModalProps> = ({
  isOpen,
  orbits,
  currentOrbitId,
  isCampaignMission,
  onSelectOrbit,
  onClose
}) => {
  const currentOrbit = orbits.find((o) => o.id === currentOrbitId) || orbits[0];
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [selectedBodyId, setSelectedBodyId] = useState<CelestialBodyId>(
    currentOrbit?.centralBody || 'earth'
  );
  const [selectedOrbitId, setSelectedOrbitId] = useState<string>(currentOrbitId);
  const [autoEquipWorldSpec, setAutoEquipWorldSpec] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;
    const activeOrbit = orbits.find((o) => o.id === currentOrbitId) || orbits[0];
    if (activeOrbit) {
      setSelectedBodyId(activeOrbit.centralBody);
      setSelectedOrbitId(activeOrbit.id);
    }
  }, [isOpen, currentOrbitId, orbits]);

  const filteredBodies = useMemo(() => {
    if (filter === 'all') return CELESTIAL_BODY_LIST;
    return CELESTIAL_BODY_LIST.filter((b) => b.category === filter);
  }, [filter]);

  const bodyMeta = getCelestialBodyMeta(selectedBodyId);
  const bodyOrbits = useMemo(
    () => orbits.filter((o) => o.centralBody === selectedBodyId),
    [orbits, selectedBodyId]
  );

  const chosenOrbit =
    bodyOrbits.find((o) => o.id === selectedOrbitId) || bodyOrbits[0] || currentOrbit;

  const nasaProfile = getNasaMissionProfile(selectedBodyId, chosenOrbit?.id);

  if (!isOpen) return null;

  const handleChooseBody = (bodyId: CelestialBodyId) => {
    sound.playClick(880);
    setSelectedBodyId(bodyId);
    const matchingOrbits = orbits.filter((o) => o.centralBody === bodyId);
    const meta = getCelestialBodyMeta(bodyId);
    const preferred =
      matchingOrbits.find((o) => o.id === meta.defaultOrbitId) || matchingOrbits[0];
    if (preferred) {
      setSelectedOrbitId(preferred.id);
    }
  };

  const handleConfirm = () => {
    if (!chosenOrbit) return;
    sound.playClick(1040);
    onSelectOrbit(chosenOrbit.id, autoEquipWorldSpec);
    onClose();
  };

  const solarFluxPct = (bodyMeta.solarFluxMultiplier * 100).toFixed(
    bodyMeta.solarFluxMultiplier < 0.1 ? 1 : 0
  );
  const lowSolarWarning = bodyMeta.solarFluxMultiplier < 0.25;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="game-frame w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* NASA Chevron Top Bar */}
        <div className="nasa-chevron-bar shrink-0" />

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#07142b] border-b border-slate-700/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="nasa-crest w-9 h-9 flex items-center justify-center text-white">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black tracking-[0.2em] text-sky-400">
                SOLAR SYSTEM NAVIGATION // TRAJECTORY TARGETING
              </div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                Select Planet, Moon, or Astronomical Body
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-space-950/90 border border-slate-800 p-1">
              {CATEGORY_LABELS.map((cat) => {
                const active = filter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      sound.playClick(760);
                      setFilter(cat.id);
                    }}
                    className={`px-2.5 py-1 text-[10px] font-black tracking-wider transition-all ${
                      active
                        ? 'bg-[#105bd8] text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close celestial body selector"
              className="p-2 bg-space-950 border border-slate-700 text-slate-300 hover:text-white hover:border-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main 2-Column Content */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left: Body List */}
          <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-slate-800 overflow-y-auto p-3 space-y-2 bg-[#040a16]">
            {filteredBodies.map((body) => {
              const isSelected = body.id === selectedBodyId;
              const isCurrentOrbitBody = currentOrbit?.centralBody === body.id;
              const categoryBadge =
                body.category === 'planet'
                  ? 'PLANET'
                  : body.category === 'moon'
                  ? 'MOON'
                  : body.id === 'asteroid'
                  ? 'ASTEROID'
                  : 'L2 POINT';

              return (
                <button
                  key={body.id}
                  type="button"
                  onClick={() => handleChooseBody(body.id)}
                  className={`w-full text-left p-3 border transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'bg-[#0b3d91]/55 border-sky-400 shadow-lg shadow-sky-900/30'
                      : 'bg-space-900/75 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  {/* True Astronomical Body Preview */}
                  <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                    <img
                      src={getBodyThumbnailUrl(body.id)}
                      alt={body.name}
                      className="w-12 h-12 object-contain drop-shadow-[0_0_8px_rgba(14,165,233,0.35)]"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-white uppercase truncate">
                        {body.name}
                      </span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 bg-space-950 border border-slate-700 text-sky-300 shrink-0">
                        {categoryBadge}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 truncate mt-0.5">
                      {body.subtitle}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-slate-400">
                      <span>{body.solarDistanceAu.toFixed(2)} AU</span>
                      <span>Flux {Math.round(body.solarFluxMultiplier * 100)}%</span>
                      {isCurrentOrbitBody && (
                        <span className="text-emerald-400 font-bold ml-auto">ACTIVE</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Physics Telemetry & Target Orbit Picker */}
          <div className="md:col-span-7 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#060f22]">
            {/* World Overview */}
            <div className="p-3.5 bg-space-900/90 border border-slate-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 shrink-0 bg-space-950 border border-slate-700/80 flex items-center justify-center p-1">
                    <img
                      src={getBodyThumbnailUrl(bodyMeta.id)}
                      alt={bodyMeta.name}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
                      {bodyMeta.subtitle}
                    </div>
                    <h3 className="text-lg font-black text-white uppercase">
                      {bodyMeta.name}
                    </h3>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/50 text-[10px] font-black text-emerald-300 flex items-center gap-1">
                    <InfinityIcon className="w-3.5 h-3.5" />
                    <span>BUDGET: ∞ UNLIMITED</span>
                  </div>
                  <div className="px-2.5 py-1 bg-space-950 border border-sky-500/40 text-[10px] font-mono text-sky-300">
                    {bodyMeta.solarDistanceAu.toFixed(2)} AU
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{bodyMeta.description}</p>
            </div>

            {/* EXACT NASA FLAGSHIP SATELLITE & HARDWARE ITEMS USED */}
            <div className="p-3.5 bg-[#091834] border border-sky-400/50 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-700/70 pb-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 bg-[#0b3d91] border border-sky-400/70 flex items-center justify-center shrink-0 mt-0.5">
                    <Satellite className="w-4 h-4 text-sky-200" />
                  </div>
                  <div>
                    <div className="text-[9px] font-black tracking-[0.18em] text-sky-300 uppercase">
                      EXACT NASA FLAGSHIP SATELLITE // HARDWARE SPEC
                    </div>
                    <h4 className="text-sm font-black text-white uppercase">
                      {nasaProfile.satelliteName}
                    </h4>
                    <div className="text-[10px] font-mono text-slate-300">
                      {nasaProfile.agencyAndYear} &bull; Rocket: {nasaProfile.realLaunchVehicle}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-[#fc3d21]/20 border border-[#fc3d21]/60 text-[9px] font-black text-amber-200">
                  {nasaProfile.shortCallsign}
                </span>
              </div>

              <p className="text-[11px] text-slate-200 leading-relaxed">
                {nasaProfile.missionSummary}
              </p>

              <div className="space-y-1.5">
                <div className="text-[10px] font-black text-amber-300 uppercase tracking-wider">
                  NASA ITEMS &amp; SUBSYSTEMS USED FOR THIS MISSION:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {nasaProfile.hardwareItems.map((item) => (
                    <div
                      key={item.slot}
                      className="p-2 bg-space-950/90 border border-slate-800 space-y-0.5"
                    >
                      <div className="flex items-center justify-between gap-1 text-[9px] font-black">
                        <span className="text-sky-400">{item.slot}</span>
                        <span className="text-emerald-300/90 font-mono truncate max-w-[140px]">
                          {item.simItemId}
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-white leading-snug">
                        {item.realNasaItem}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight">
                        {item.purpose}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Engineering Telemetry */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 bg-space-950/90 border border-slate-800">
                <div className="flex items-center gap-1 text-[9px] text-slate-400 font-black">
                  <Sun className="w-3 h-3 text-amber-400" />
                  <span>SOLAR FLUX</span>
                </div>
                <div
                  className={`text-sm font-black font-mono mt-0.5 ${
                    lowSolarWarning ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {solarFluxPct}%
                </div>
                <div className="text-[9px] text-slate-500">vs Earth 1 AU</div>
              </div>

              <div className="p-2.5 bg-space-950/90 border border-slate-800">
                <div className="flex items-center gap-1 text-[9px] text-slate-400 font-black">
                  <Gauge className="w-3 h-3 text-sky-400" />
                  <span>SURFACE g</span>
                </div>
                <div className="text-sm font-black font-mono text-white mt-0.5">
                  {bodyMeta.gravitySurfaceMs2.toFixed(2)} m/s²
                </div>
                <div className="text-[9px] text-slate-500">
                  R = {bodyMeta.radiusKm.toLocaleString()} km
                </div>
              </div>

              <div className="p-2.5 bg-space-950/90 border border-slate-800">
                <div className="flex items-center gap-1 text-[9px] text-slate-400 font-black">
                  <Magnet className="w-3 h-3 text-cyan-400" />
                  <span>MAG FIELD</span>
                </div>
                <div
                  className={`text-sm font-black mt-0.5 ${
                    bodyMeta.hasMagnetosphere ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {bodyMeta.hasMagnetosphere ? 'PRESENT' : 'NONE'}
                </div>
                <div className="text-[9px] text-slate-500">
                  {bodyMeta.hasMagnetosphere ? 'Torquers work' : 'Use Reaction Wheels'}
                </div>
              </div>

              <div className="p-2.5 bg-space-950/90 border border-slate-800">
                <div className="flex items-center gap-1 text-[9px] text-slate-400 font-black">
                  <Rocket className="w-3 h-3 text-[#fc3d21]" />
                  <span>INJECTION</span>
                </div>
                <div className="text-sm font-black font-mono text-white mt-0.5">
                  {Math.round(bodyMeta.tliPayloadScale * 100)}% TLI
                </div>
                <div className="text-[9px] text-slate-500">Payload scaling</div>
              </div>
            </div>

            {/* Power / Design Engineering Tip */}
            <div
              className={`p-3 border text-xs flex items-start gap-2.5 ${
                lowSolarWarning
                  ? 'bg-amber-950/35 border-amber-500/50 text-amber-200'
                  : 'bg-sky-950/35 border-sky-500/40 text-sky-200'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider mb-0.5">
                  MISSION ENGINEERING NOTE
                </div>
                <div>{bodyMeta.recommendedPowerTip}</div>
              </div>
            </div>

            {/* Available Orbits at Selected Body */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-300 uppercase tracking-wider">
                <OrbitIcon className="w-3.5 h-3.5 text-sky-400" />
                <span>SELECT ORBIT AROUND {bodyMeta.shortName.toUpperCase()}</span>
              </div>

              <div className="space-y-2">
                {bodyOrbits.map((orb) => {
                  const selected = chosenOrbit?.id === orb.id;
                  return (
                    <button
                      key={orb.id}
                      type="button"
                      onClick={() => {
                        sound.playClick(920);
                        setSelectedOrbitId(orb.id);
                      }}
                      className={`w-full text-left p-3 border transition-all ${
                        selected
                          ? 'bg-[#0b3d91]/50 border-sky-400'
                          : 'bg-space-900/70 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-white uppercase">
                          {orb.name}
                        </span>
                        <span className="text-[10px] font-mono text-amber-300">
                          {orb.altitudeKm.toLocaleString()} km · {orb.inclinationDeg}° INC
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1">{orb.description}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] font-mono text-slate-400">
                        <span>ΔV {orb.deltaVRequiredKmS.toFixed(1)} km/s</span>
                        <span>•</span>
                        <span>Eclipse {orb.eclipseMinutes}m / {orb.periodMinutes}m</span>
                        <span>•</span>
                        <span
                          className={
                            orb.radiationLevel === 'high' || orb.radiationLevel === 'cosmic-rays'
                              ? 'text-red-400 font-bold'
                              : 'text-emerald-400'
                          }
                        >
                          RAD: {orb.radiationLevel.toUpperCase()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campaign vs Sandbox Notice */}
            {isCampaignMission && (
              <div className="p-2.5 bg-amber-950/35 border border-amber-500/50 text-[11px] text-amber-200 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Launching to any selected celestial body transitions cleanly into{' '}
                  <strong className="text-white">Free-Flight Exploration (∞ Infinite Budget)</strong>{' '}
                  while keeping your earned Campaign stars &amp; rank saved.
                </span>
              </div>
            )}

            {/* Auto-Equip Option */}
            <label className="flex items-start gap-2.5 p-2.5 bg-space-950/80 border border-emerald-500/40 cursor-pointer hover:border-emerald-400">
              <input
                type="checkbox"
                checked={autoEquipWorldSpec}
                onChange={(e) => setAutoEquipWorldSpec(e.target.checked)}
                className="mt-0.5 accent-[#105bd8]"
              />
              <div className="text-xs">
                <div className="font-bold text-white">
                  Deploy exact NASA satellite &amp; hardware items ({nasaProfile.satelliteName})
                </div>
                <div className="text-[11px] text-slate-400">
                  Pre-equips {nasaProfile.shortCallsign}’s matched science instruments, bus, power,
                  ADCS, deep-space comms, and rocket with{' '}
                  <span className="text-emerald-300 font-bold">∞ Budget</span>.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="px-4 sm:px-6 py-3 bg-[#07142b] border-t border-slate-700/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Globe className="w-4 h-4 text-sky-400" />
            <span>
              LOCKED TARGET:{' '}
              <strong className="text-white">{bodyMeta.name}</strong> —{' '}
              <span className="text-sky-300">{chosenOrbit?.name}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-space-950 border border-slate-700 text-slate-300 hover:text-white text-xs font-black tracking-wider"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="game-chip px-5 py-2 nasa-btn-launch text-xs font-black tracking-wider flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>SET DESTINATION ({bodyMeta.shortName.toUpperCase()})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
