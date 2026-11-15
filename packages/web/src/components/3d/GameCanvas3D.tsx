import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import {
  SpacecraftDesign,
  StructureSubsystem,
  PowerGenSubsystem,
  CommsSubsystem,
  Instrument,
  Orbit,
  LaunchVehicle
} from '@sim/index';
import {
  BODY_VISUAL_SPECS,
  getCachedEarthTextures,
  getCachedMarsTextures,
  getCachedVenusTextures,
  getCachedMoonTextures,
  getCachedEuropaTextures,
  getCachedTitanTexture,
  getCachedAsteroidTextures,
  getCachedJupiterTexture,
  getCachedSaturnTexture,
  getCachedSaturnRingTexture,
  getCachedSunTexture,
  getCachedPsycheGeometry,
  samplePsycheVertexOffset
} from './planetaryTextures';
import { SpacecraftAssembly } from './SpacecraftAssembly';
import {
  getFlightCourseForOrbit,
  sampleSpineYZ,
  sampleCourseLaneX,
  getCourseCenterPoint,
  getCourseTangent
} from '../../game/flightCourse';

export type ViewportMode = 'hangar' | 'orbit' | 'launch';

export interface LaunchMotionRefState {
  progressPercent: number;
  steerLaneX: number;
  steerVelX: number;
  throttle: number;
}

export interface LaunchVisualState {
  progressPercent: number;
  phase: string;
  pitchAngleDeg: number;
  throttle: number;
  stageSeparated: boolean;
  fairingDeployed: boolean;
  maxQStress: boolean;
  cameraAngle?: 'chase' | 'side' | 'pad';
  gateResults?: ('pending' | 'hit' | 'miss')[];
  steerLaneX?: number;
  steerVelX?: number;
}

export interface OrbitalMotionRefState {
  orbitAngleRad: number;
  slewDeg: number;
  thrusting: number; // -1 retro, 0 coast, +1 prograde
}

interface SatOrbitalFrame {
  satPos: THREE.Vector3;
  radial: THREE.Vector3;
  tangent: THREE.Vector3;
  crossVec: THREE.Vector3;
  slewDeg: number;
  orbitRadius: number;
  surfaceRadius: number;
}

export interface OrbitalTarget3D {
  id: string;
  name: string;
  category: string;
  phaseAngleRad: number;
  crossTrackDeg: number;
  isMatch: boolean;
  isLocked: boolean;
  urgencyPct: number;
}

export interface OrbitalGroundCone3D {
  id: string;
  name: string;
  phaseAngleRad: number;
  crossTrackDeg: number;
  inRange: boolean;
}

export interface OrbitalGameplayState {
  targets: OrbitalTarget3D[];
  groundStations: OrbitalGroundCone3D[];
  scanningTargetPos?: { phaseAngleRad: number; crossTrackDeg: number } | null;
  downlinkingStationPos?: { phaseAngleRad: number; crossTrackDeg: number } | null;
}

interface GameCanvas3DProps {
  mode: ViewportMode;
  design: SpacecraftDesign;
  structure: StructureSubsystem;
  powerGen: PowerGenSubsystem;
  comms: CommsSubsystem;
  selectedInstruments: Instrument[];
  orbit: Orbit;
  launchVehicle: LaunchVehicle;
  launchProgressPercent?: number;
  launchState?: LaunchVisualState;
  isScanning?: boolean;
  isDownlinking?: boolean;
  isEclipse?: boolean;
  isLandingShowcase?: boolean;
  camFocus?: 'satellite' | 'global';
  orbitalMotionRef?: React.MutableRefObject<OrbitalMotionRefState>;
  launchMotionRef?: React.MutableRefObject<LaunchMotionRefState>;
  orbitalGameplay?: OrbitalGameplayState;
  onSelectOrbitalTarget?: (targetId: string) => void;
  onClickDownlinkCone?: () => void;
}

// -------------------------------------------------------------
// 1. COSMIC BACKGROUND & DYNAMIC ATMOSPHERE DOME
// -------------------------------------------------------------
function CosmicBackdrop({
  mode,
  launchProgress = 0,
  isStatic = false
}: {
  mode: ViewportMode;
  launchProgress?: number;
  isStatic?: boolean;
}) {
  const starsRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (starsRef.current && !isStatic) {
      starsRef.current.rotation.y += delta * 0.005;
    }
  });

  // Always keep stars active; in launch mode dial up star density & sharpness so the ascent corridor feels truly cosmic
  const isLaunch = mode === 'launch';

  return (
    <group ref={starsRef}>
      <Stars
        radius={isLaunch ? 190 : 240}
        depth={95}
        count={isLaunch ? 11000 : 6000}
        factor={isLaunch ? 7.2 : 5.5}
        saturation={isLaunch ? 0.9 : 0.75}
        fade={!isLaunch}
        speed={isStatic ? 0 : isLaunch ? 0.45 : 0.8}
      />
    </group>
  );
}

// -------------------------------------------------------------
// 2. AUTHENTIC CELESTIAL BODY RENDERER (Used in Orbit + Hangar Horizon)
// -------------------------------------------------------------
function CelestialBodySystem({
  centralBody,
  isEclipse = false,
  planetRef,
  cloudsRef,
  showEarthStations = false,
  earthStations = [],
  includeBackdropCompanions = true
}: {
  centralBody: Orbit['centralBody'];
  isEclipse?: boolean;
  planetRef?: React.RefObject<THREE.Mesh>;
  cloudsRef?: React.RefObject<THREE.Mesh>;
  showEarthStations?: boolean;
  earthStations?: { name: string; pos: THREE.Vector3 }[];
  includeBackdropCompanions?: boolean;
}) {
  const earthTex = useMemo(() => getCachedEarthTextures(), []);
  const moonTex = useMemo(() => getCachedMoonTextures(), []);
  const marsTex = useMemo(() => getCachedMarsTextures(), []);
  const venusTex = useMemo(() => getCachedVenusTextures(), []);
  const europaTex = useMemo(() => getCachedEuropaTextures(), []);
  const titanTex = useMemo(() => getCachedTitanTexture(), []);
  const asteroidTex = useMemo(() => getCachedAsteroidTextures(), []);
  const jupiterTex = useMemo(() => getCachedJupiterTexture(), []);
  const saturnTex = useMemo(() => getCachedSaturnTexture(), []);
  const saturnRingTex = useMemo(() => getCachedSaturnRingTexture(), []);
  const sunTex = useMemo(() => getCachedSunTexture(), []);
  const psycheGeom = useMemo(() => getCachedPsycheGeometry(), []);

  const bodySpec = BODY_VISUAL_SPECS[centralBody] || BODY_VISUAL_SPECS.earth;

  if (centralBody === 'lagrange') {
    return (
      <group key="lagrange">
        {/* Sun-Earth L2 Gravitational Saddle Node & Lissajous Halo Orbit Paths */}
        <mesh>
          <sphereGeometry args={[0.14, 24, 24]} />
          <meshBasicMaterial color="#fde047" />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.28, 24, 24]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.28} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.38, 0.43, 48]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.58} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[0.45, 0.25, 0]}>
          <torusGeometry args={[1.65, 0.014, 8, 72]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.28} />
        </mesh>
        <mesh rotation={[-0.55, 0.6, 0.4]}>
          <torusGeometry args={[1.95, 0.012, 8, 72]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.22} />
        </mesh>

        {includeBackdropCompanions && (
          <>
            {/* Earth + tiny Moon along L2 anti-sun axis — clearly dwarfed by the huge Sun! */}
            <group position={[-4.5, 0.9, -8.2]}>
              <mesh>
                <sphereGeometry args={[0.72, 36, 36]} />
                <meshStandardMaterial map={earthTex.dayMap} bumpMap={earthTex.bumpMap} bumpScale={0.03} roughness={0.55} />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.735, 32, 32]} />
                <meshStandardMaterial map={earthTex.cloudMap} transparent opacity={0.68} depthWrite={false} />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.79, 32, 32]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.24} side={THREE.BackSide} />
              </mesh>
              <mesh position={[1.45, 0.28, 0.55]}>
                <sphereGeometry args={[0.21, 24, 24]} />
                <meshStandardMaterial map={moonTex.map} bumpMap={moonTex.bumpMap} bumpScale={0.04} roughness={0.94} />
              </mesh>
            </group>

            {/* Massive Blazing Solar Star dwarfing Earth & Moon along the sunward axis */}
            <group position={[7.6, 2.9, -14.2]}>
              <mesh>
                <sphereGeometry args={[3.5, 48, 48]} />
                <meshBasicMaterial map={sunTex} />
              </mesh>
              <mesh>
                <sphereGeometry args={[4.15, 36, 36]} />
                <meshBasicMaterial color="#fbbf24" transparent opacity={0.22} side={THREE.BackSide} />
              </mesh>
              <mesh>
                <sphereGeometry args={[4.9, 32, 32]} />
                <meshBasicMaterial color="#f97316" transparent opacity={0.1} side={THREE.BackSide} />
              </mesh>
            </group>
          </>
        )}
      </group>
    );
  }

  if (centralBody === 'asteroid') {
    return (
      <group key="asteroid">
        <mesh ref={planetRef} geometry={psycheGeom} castShadow receiveShadow>
          <meshStandardMaterial
            map={asteroidTex.map}
            bumpMap={asteroidTex.bumpMap}
            bumpScale={bodySpec.bumpScale}
            roughness={bodySpec.roughness}
            metalness={bodySpec.metalness}
            emissive="#090b10"
            emissiveIntensity={0.08}
          />
        </mesh>
      </group>
    );
  }

  const albedoMap =
    centralBody === 'mars'
      ? marsTex.map
      : centralBody === 'venus'
      ? venusTex.map
      : centralBody === 'europa'
      ? europaTex.map
      : centralBody === 'titan'
      ? titanTex
      : centralBody === 'moon'
      ? moonTex.map
      : earthTex.dayMap;

  const bumpMap =
    centralBody === 'mars'
      ? marsTex.bumpMap
      : centralBody === 'moon'
      ? moonTex.bumpMap
      : centralBody === 'europa'
      ? europaTex.bumpMap
      : centralBody === 'earth'
      ? earthTex.bumpMap
      : undefined;

  const emissiveTint =
    centralBody === 'mars'
      ? '#1a0803'
      : centralBody === 'venus'
      ? '#211805'
      : centralBody === 'titan'
      ? '#241002'
      : centralBody === 'moon'
      ? '#07090d'
      : centralBody === 'earth'
      ? isEclipse
        ? '#0c1938'
        : '#040b1a'
      : '#050b14';

  return (
    <group key={centralBody}>
      <mesh ref={planetRef} receiveShadow>
        <sphereGeometry args={[bodySpec.radius, 64, 64]} />
        <meshStandardMaterial
          map={albedoMap}
          bumpMap={bumpMap}
          bumpScale={bumpMap ? bodySpec.bumpScale : 0}
          roughness={bodySpec.roughness}
          metalness={bodySpec.metalness}
          emissive={new THREE.Color(emissiveTint)}
          emissiveIntensity={centralBody === 'earth' && isEclipse ? 0.42 : 0.14}
        />
      </mesh>

      {/* Earth or Venus animated rotating upper cloud shroud */}
      {(centralBody === 'earth' || centralBody === 'venus') && (
        <mesh ref={cloudsRef}>
          <sphereGeometry args={[bodySpec.radius * 1.018, 48, 48]} />
          <meshStandardMaterial
            map={centralBody === 'earth' ? earthTex.cloudMap : venusTex.cloudMap}
            color={bodySpec.cloudColor || '#ffffff'}
            transparent
            opacity={bodySpec.cloudOpacity || 0.6}
            depthWrite={false}
            roughness={0.85}
          />
        </mesh>
      )}

      {centralBody === 'earth' &&
        showEarthStations &&
        earthStations.map((st) => (
          <group key={st.name} position={st.pos}>
            <mesh>
              <sphereGeometry args={[0.045, 12, 12]} />
              <meshBasicMaterial color="#10b981" />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.09, 12, 12]} />
              <meshBasicMaterial color="#10b981" transparent opacity={0.28} />
            </mesh>
          </group>
        ))}

      {/* Atmospheric rim halo */}
      {bodySpec.atmosphereColor && (
        <mesh>
          <sphereGeometry args={[bodySpec.radius * 1.068, 48, 48]} />
          <meshBasicMaterial
            color={bodySpec.atmosphereColor}
            transparent
            opacity={bodySpec.atmosphereOpacity}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Titan's authentic Cassini detached blue high-altitude nitrile haze halo */}
      {bodySpec.secondaryHazeColor && (
        <mesh>
          <sphereGeometry args={[bodySpec.radius * 1.11, 48, 48]} />
          <meshBasicMaterial
            color={bodySpec.secondaryHazeColor}
            transparent
            opacity={bodySpec.secondaryHazeOpacity || 0.15}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Companion celestial landmarks positioned inside clear camera FOV */}
      {includeBackdropCompanions && centralBody === 'mars' && (
        <mesh position={[4.5, 1.05, -6.2]} scale={[1.35, 0.85, 0.95]}>
          <dodecahedronGeometry args={[0.2, 1]} />
          <meshStandardMaterial map={asteroidTex.map} roughness={0.95} metalness={0.05} />
        </mesh>
      )}

      {includeBackdropCompanions && centralBody === 'moon' && (
        <group position={[6.2, 2.3, -10.5]}>
          <mesh>
            <sphereGeometry args={[1.15, 36, 36]} />
            <meshStandardMaterial map={earthTex.dayMap} bumpMap={earthTex.bumpMap} bumpScale={0.03} roughness={0.55} />
          </mesh>
          <mesh>
            <sphereGeometry args={[1.17, 32, 32]} />
            <meshStandardMaterial map={earthTex.cloudMap} transparent opacity={0.68} depthWrite={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[1.24, 32, 32]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.24} side={THREE.BackSide} />
          </mesh>
        </group>
      )}

      {includeBackdropCompanions && centralBody === 'europa' && (
        <group position={[-6.2, 1.9, -9.8]}>
          <mesh rotation={[0.08, 0, -0.05]}>
            <sphereGeometry args={[3.0, 48, 48]} />
            <meshStandardMaterial map={jupiterTex} roughness={0.72} metalness={0.04} />
          </mesh>
        </group>
      )}

      {includeBackdropCompanions && centralBody === 'titan' && (
        <group position={[-6.6, 2.2, -10.2]} rotation={[0.42, 0.18, -0.3]}>
          <mesh>
            <sphereGeometry args={[2.1, 48, 48]} />
            <meshStandardMaterial map={saturnTex} roughness={0.72} metalness={0.04} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.75, 4.95, 96]} />
            <meshStandardMaterial
              map={saturnRingTex}
              transparent
              opacity={0.9}
              roughness={0.65}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

// -------------------------------------------------------------
// 3. VAB HANGAR MODE (Pedestal, Grid & Spotlights)
// -------------------------------------------------------------
function HangarScene({
  structure,
  powerGen,
  comms,
  selectedInstruments,
  orbit
}: {
  structure: StructureSubsystem;
  powerGen: PowerGenSubsystem;
  comms: CommsSubsystem;
  selectedInstruments: Instrument[];
  orbit: Orbit;
}) {
  const craftRef = useRef<THREE.Group>(null);
  const popScaleRef = useRef(1);
  const assemblyKey = `${structure.id}|${powerGen.id}|${comms.id}|${selectedInstruments.map((i) => i.id).join(',')}`;

  useEffect(() => {
    popScaleRef.current = 0.88;
  }, [assemblyKey]);

  useFrame((_, delta) => {
    if (craftRef.current) {
      craftRef.current.rotation.y += delta * 0.22;
      popScaleRef.current = THREE.MathUtils.lerp(popScaleRef.current, 1.0, Math.min(1, delta * 12));
      craftRef.current.scale.setScalar(popScaleRef.current);
    }
  });

  const pedestalOffsetY = structure.shape === 'hexagonal' ? 0.65 : 0.45;

  return (
    <group>
      {/* Distant Destination World preview visible in deep-space backdrop */}
      <group position={[-2.2, 2.7, -13.5]} scale={0.72}>
        <CelestialBodySystem centralBody={orbit.centralBody} includeBackdropCompanions={false} />
      </group>

      {/* NASA VAB HIGH-BAY STRUCTURAL GANTRY ARCH (Backdrop framing) */}
      <group position={[0, -1.25, -4.6]}>
        {/* Left & Right Steel Gantry Columns */}
        {[-3.9, 3.9].map((gx) => (
          <group key={gx} position={[gx, 3.0, 0]}>
            <mesh>
              <boxGeometry args={[0.38, 6.2, 0.38]} />
              <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.3} />
            </mesh>
            <mesh position={[0, 1.4, 0.2]}>
              <boxGeometry args={[0.42, 0.26, 0.05]} />
              <meshBasicMaterial color="#0b3d91" />
            </mesh>
            <mesh position={[0, 1.15, 0.2]}>
              <boxGeometry args={[0.42, 0.08, 0.05]} />
              <meshBasicMaterial color="#fc3d21" />
            </mesh>
          </group>
        ))}
        {/* Overhead Bridge Crane Truss */}
        <mesh position={[0, 5.75, 0]}>
          <boxGeometry args={[8.5, 0.48, 0.6]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh position={[0, 5.45, 0.31]}>
          <boxGeometry args={[7.4, 0.14, 0.04]} />
          <meshBasicMaterial color="#105bd8" />
        </mesh>
        <mesh position={[0, 5.33, 0.31]}>
          <boxGeometry args={[7.4, 0.05, 0.04]} />
          <meshBasicMaterial color="#fc3d21" />
        </mesh>
      </group>

      {/* Integration Turntable Platform */}
      <group position={[0, -1.25, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.1, 2.24, 64]} />
          <meshBasicMaterial color="#105bd8" side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.95, 3.04, 64]} />
          <meshBasicMaterial color="#fc3d21" side={THREE.DoubleSide} transparent opacity={0.72} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
          <circleGeometry args={[4.8, 48]} />
          <meshStandardMaterial color="#0a162b" roughness={0.55} metalness={0.45} />
        </mesh>
        <gridHelper args={[18, 24, '#105bd8', '#162642']} position={[0, 0.01, 0]} />
      </group>

      <group ref={craftRef} position={[0, pedestalOffsetY, 0]}>
        <SpacecraftAssembly
          structure={structure}
          powerGen={powerGen}
          comms={comms}
          selectedInstruments={selectedInstruments}
        />
      </group>
    </group>
  );
}

// Helper to map (orbitAngle, crossTrackDeg) onto planetary surface / orbit frame
function computeOrbitFrame(angleRad: number, incRad: number, orbitRadius: number) {
  const x = Math.cos(angleRad) * orbitRadius;
  const y = Math.sin(angleRad) * Math.sin(incRad) * orbitRadius;
  const z = Math.sin(angleRad) * Math.cos(incRad) * orbitRadius;
  const satPos = new THREE.Vector3(x, y, z);
  const radial = satPos.clone().normalize();
  const tangent = new THREE.Vector3(
    -Math.sin(angleRad),
    Math.cos(angleRad) * Math.sin(incRad),
    Math.cos(angleRad) * Math.cos(incRad)
  ).normalize();
  const crossVec = new THREE.Vector3().crossVectors(tangent, radial).normalize();
  return { satPos, radial, tangent, crossVec };
}

function computeSurfaceBeaconPos(
  angleRad: number,
  crossTrackDeg: number,
  incRad: number,
  orbitRadius: number,
  surfaceRadius: number,
  centralBody?: Orbit['centralBody']
): THREE.Vector3 {
  const { radial, crossVec } = computeOrbitFrame(angleRad, incRad, orbitRadius);
  const crossRad = (crossTrackDeg * Math.PI) / 180;
  const dir = radial
    .clone()
    .multiplyScalar(Math.cos(crossRad))
    .add(crossVec.clone().multiplyScalar(Math.sin(crossRad)))
    .normalize();
  if (centralBody === 'asteroid') {
    const surfacePt = samplePsycheVertexOffset(dir);
    return dir.multiplyScalar(surfacePt.length() + 0.05);
  }
  return dir.multiplyScalar(surfaceRadius);
}

function LandingHalfEarthScene() {
  const size = useThree((s) => s.size);
  const earthTex = useMemo(() => getCachedEarthTextures(), []);
  const earthSpec = BODY_VISUAL_SPECS.earth;

  // Compute exact frustum at z = 0 for static telephoto camera [0, 0, 18.0], fov = 28°
  // and size Earth to cover the right side completely (~100% height at right edge) with
  // its sunlit horizon reaching ~50% across the middle of the screen.
  const camZ = 18.0;
  const aspect = Math.max(0.7, size.width / Math.max(1, size.height));
  const frustumHeight = 2 * camZ * Math.tan((28 * Math.PI) / 360);
  const frustumWidth = frustumHeight * aspect;
  const centerX = frustumWidth * 0.5;
  const radius = frustumWidth * 0.47;

  return (
    <group position={[centerX, 0, 0]}>
      <group rotation={[0.22, 0.52, -0.15]}>
        <mesh>
          <sphereGeometry args={[radius, 96, 96]} />
          <meshStandardMaterial
            map={earthTex.dayMap}
            bumpMap={earthTex.bumpMap}
            bumpScale={0.06}
            roughness={earthSpec.roughness}
            metalness={earthSpec.metalness}
            emissive="#040c1d"
            emissiveIntensity={0.14}
          />
        </mesh>
        <mesh rotation={[0, 0.3, 0]}>
          <sphereGeometry args={[radius * 1.012, 80, 80]} />
          <meshStandardMaterial
            map={earthTex.cloudMap}
            color="#ffffff"
            transparent
            opacity={0.76}
            depthWrite={false}
            roughness={0.85}
          />
        </mesh>
      </group>

      {/* Atmospheric blue limb halo */}
      <mesh>
        <sphereGeometry args={[radius * 1.045, 80, 80]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.22} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 1.08, 64, 64]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.09} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

// -------------------------------------------------------------
// 4. ORBIT FLIGHT MODE (Interactive 3D Targets, Gimbal Reticle & Ground Cones)
// -------------------------------------------------------------
function OrbitFlightScene({
  structure,
  powerGen,
  comms,
  selectedInstruments,
  orbit,
  isScanning,
  isDownlinking,
  isEclipse,
  satWorldPosRef,
  satFrameRef,
  orbitalMotionRef,
  orbitalGameplay,
  onSelectOrbitalTarget,
  onClickDownlinkCone
}: {
  structure: StructureSubsystem;
  powerGen: PowerGenSubsystem;
  comms: CommsSubsystem;
  selectedInstruments: Instrument[];
  orbit: Orbit;
  isScanning?: boolean;
  isDownlinking?: boolean;
  isEclipse?: boolean;
  satWorldPosRef: React.MutableRefObject<THREE.Vector3>;
  satFrameRef: React.MutableRefObject<SatOrbitalFrame>;
  orbitalMotionRef?: React.MutableRefObject<OrbitalMotionRefState>;
  orbitalGameplay?: OrbitalGameplayState;
  onSelectOrbitalTarget?: (targetId: string) => void;
  onClickDownlinkCone?: () => void;
}) {
  const satOrbitGroupRef = useRef<THREE.Group>(null);
  const satBankGroupRef = useRef<THREE.Group>(null);
  const reticleGroupRef = useRef<THREE.Group>(null);
  const gimbalBeamRef = useRef<THREE.Mesh>(null);
  const planetRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0.15);

  const bodySpec = BODY_VISUAL_SPECS[orbit.centralBody] || BODY_VISUAL_SPECS.earth;
  let orbitRadius = bodySpec.defaultOrbitRadius;
  if (orbit.id === 'orbit-sso-700') orbitRadius = 4.1;
  else if (orbit.id === 'orbit-geo-35786') orbitRadius = 5.6;

  const incRad = (orbit.inclinationDeg * Math.PI) / 180;
  const isLagrange = orbit.centralBody === 'lagrange';
  const surfaceRadius = bodySpec.surfaceRadius;

  const decorativeGroundStations = useMemo(() => {
    const r = 2.02;
    return [
      { name: 'Wallops', lat: 37.9, lon: -75.4 },
      { name: 'Svalbard', lat: 78.2, lon: 15.6 },
      { name: 'Canberra', lat: -35.3, lon: 149.1 },
      { name: 'Goldstone', lat: 35.4, lon: -116.8 }
    ].map((st) => {
      const phi = (90 - st.lat) * (Math.PI / 180);
      const theta = (st.lon + 180) * (Math.PI / 180);
      return {
        name: st.name,
        pos: new THREE.Vector3(
          -r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta)
        )
      };
    });
  }, []);

  useFrame((_, delta) => {
    let angle = timeRef.current;
    let slewDeg = 0;

    if (orbitalMotionRef) {
      angle = orbitalMotionRef.current.orbitAngleRad;
      slewDeg = orbitalMotionRef.current.slewDeg;
    } else {
      timeRef.current += delta * (isLagrange ? 0.25 : 0.42);
      angle = timeRef.current;
    }

    const { satPos, radial, tangent, crossVec } = computeOrbitFrame(angle, incRad, orbitRadius);

    satFrameRef.current.satPos.copy(satPos);
    satFrameRef.current.radial.copy(radial);
    satFrameRef.current.tangent.copy(tangent);
    satFrameRef.current.crossVec.copy(crossVec);
    satFrameRef.current.slewDeg = slewDeg;
    satFrameRef.current.orbitRadius = orbitRadius;
    satFrameRef.current.surfaceRadius = surfaceRadius;

    if (satOrbitGroupRef.current) {
      satOrbitGroupRef.current.position.copy(satPos);
      satWorldPosRef.current.copy(satPos);
      satOrbitGroupRef.current.lookAt(0, 0, 0);
    }

    if (satBankGroupRef.current) {
      const bankRad = (slewDeg * Math.PI) / 180;
      satBankGroupRef.current.rotation.set(Math.PI / 2, 0, -bankRad * 0.85);
    }

    if (reticleGroupRef.current && orbitalGameplay) {
      const reticlePos = computeSurfaceBeaconPos(
        angle,
        slewDeg,
        incRad,
        orbitRadius,
        surfaceRadius + 0.04,
        orbit.centralBody
      );
      reticleGroupRef.current.position.copy(reticlePos);
      reticleGroupRef.current.lookAt(0, 0, 0);
      reticleGroupRef.current.rotation.z += delta * 1.8;

      if (gimbalBeamRef.current) {
        const activePos = orbitalGameplay.scanningTargetPos
          ? computeSurfaceBeaconPos(
              orbitalGameplay.scanningTargetPos.phaseAngleRad,
              orbitalGameplay.scanningTargetPos.crossTrackDeg,
              incRad,
              orbitRadius,
              surfaceRadius,
              orbit.centralBody
            )
          : reticlePos;
        const mid = satPos.clone().add(activePos).multiplyScalar(0.5);
        const len = satPos.distanceTo(activePos);
        gimbalBeamRef.current.position.copy(mid);
        gimbalBeamRef.current.lookAt(activePos);
        gimbalBeamRef.current.rotateX(Math.PI / 2);
        gimbalBeamRef.current.scale.set(1, len, 1);
      }
    }

    if (planetRef.current) {
      planetRef.current.rotation.y += delta * (orbit.centralBody === 'asteroid' ? 0.06 : 0.02);
    }
    if (cloudsRef.current) {
      const cloudVel = bodySpec.cloudSpeed ?? 0.032;
      cloudsRef.current.rotation.y += delta * cloudVel;
    }
  });

  const hasLockedTarget = Boolean(orbitalGameplay?.targets.some((t) => t.isLocked));

  return (
    <group position={[0, 0, 0]}>
      {/* 1. CENTRAL ASTRONOMICAL BODY */}
      <CelestialBodySystem
        centralBody={orbit.centralBody}
        isEclipse={isEclipse}
        planetRef={planetRef}
        cloudsRef={cloudsRef}
        showEarthStations={!orbitalGameplay}
        earthStations={decorativeGroundStations}
        includeBackdropCompanions={true}
      />

      {/* 2. EXACT ALIGNED ORBITAL TRAJECTORY RING */}
      <group rotation={[incRad, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[orbitRadius - 0.025, orbitRadius + 0.025, 128]} />
          <meshBasicMaterial
            color={bodySpec.ringColor}
            transparent
            opacity={0.78}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 2B. INTERACTIVE 3D GROUND STATION COMM CONES & TARGET BEACONS */}
      {orbitalGameplay && (
        <group>
          {/* Live Ground Station Link Cones */}
          {orbitalGameplay.groundStations.map((gs) => {
            const gsPos = computeSurfaceBeaconPos(
              gs.phaseAngleRad,
              gs.crossTrackDeg,
              incRad,
              orbitRadius,
              surfaceRadius,
              orbit.centralBody
            );
            const normal = gsPos.clone().normalize();
            const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
            return (
              <group
                key={gs.id}
                position={gsPos}
                quaternion={quat}
                onClick={(e) => {
                  e.stopPropagation();
                  if (gs.inRange && onClickDownlinkCone) onClickDownlinkCone();
                }}
              >
                <mesh position={[0, 0.08, 0]}>
                  <sphereGeometry args={[0.1, 14, 14]} />
                  <meshBasicMaterial color={gs.inRange ? '#34d399' : '#10b981'} />
                </mesh>
                <mesh position={[0, 0.54, 0]} rotation={[Math.PI, 0, 0]}>
                  <coneGeometry args={[0.52, 1.08, 24, 1, true]} />
                  <meshBasicMaterial
                    color={gs.inRange ? '#34d399' : '#10b981'}
                    transparent
                    opacity={gs.inRange ? 0.4 : 0.16}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              </group>
            );
          })}

          {/* Live 3D Science Target Beacons On Planet / Field */}
          {orbitalGameplay.targets.map((tgt) => {
            const tgtPos = computeSurfaceBeaconPos(
              tgt.phaseAngleRad,
              tgt.crossTrackDeg,
              incRad,
              orbitRadius,
              surfaceRadius + 0.03,
              orbit.centralBody
            );
            const normal = tgtPos.clone().normalize();
            const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
            const beaconColor = tgt.isLocked
              ? '#fbbf24'
              : tgt.isMatch
              ? '#34d399'
              : '#38bdf8';
            return (
              <group
                key={tgt.id}
                position={tgtPos}
                quaternion={quat}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectOrbitalTarget?.(tgt.id);
                }}
              >
                {/* Core glowing marker diamond */}
                <mesh position={[0, 0.14, 0]}>
                  <octahedronGeometry args={[tgt.isLocked ? 0.2 : 0.15, 0]} />
                  <meshBasicMaterial color={beaconColor} />
                </mesh>
                {/* Ground pulse ring */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                  <ringGeometry args={[0.2, tgt.isLocked ? 0.38 : 0.28, 26]} />
                  <meshBasicMaterial color={beaconColor} transparent opacity={tgt.isLocked ? 0.95 : 0.72} side={THREE.DoubleSide} />
                </mesh>
                {/* Tall vertical signal pillar visible over horizon in Satellite POV */}
                <mesh position={[0, 0.42, 0]}>
                  <cylinderGeometry args={[0.025, 0.055, 0.78, 10]} />
                  <meshBasicMaterial color={beaconColor} transparent opacity={tgt.isLocked ? 0.9 : 0.58} />
                </mesh>
                <mesh position={[0, 0.84, 0]}>
                  <sphereGeometry args={[tgt.isLocked ? 0.095 : 0.065, 10, 10]} />
                  <meshBasicMaterial color={beaconColor} />
                </mesh>
              </group>
            );
          })}

          {/* Live Cross-Track Aiming Reticle & Sensor Sweeper Ray */}
          <group ref={reticleGroupRef}>
            <mesh>
              <ringGeometry args={[0.2, 0.25, 4]} />
              <meshBasicMaterial
                color={hasLockedTarget ? '#fbbf24' : '#22d3ee'}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh>
              <ringGeometry args={[0.31, 0.34, 24]} />
              <meshBasicMaterial
                color={hasLockedTarget ? '#fbbf24' : '#38bdf8'}
                transparent
                opacity={0.55}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>

          {/* Gimbal Aiming Sight Line from Satellite to Surface Reticle */}
          <mesh ref={gimbalBeamRef}>
            <cylinderGeometry args={[isScanning ? 0.075 : 0.014, isScanning ? 0.18 : 0.022, 1, 10]} />
            <meshBasicMaterial
              color={isScanning ? '#38bdf8' : hasLockedTarget ? '#fbbf24' : '#0ea5e9'}
              transparent
              opacity={isScanning ? 0.72 : hasLockedTarget ? 0.55 : 0.22}
            />
          </mesh>
        </group>
      )}

      {/* 3. SPACECRAFT ORBITING IN SPACE */}
      <group ref={satOrbitGroupRef} scale={0.42}>
        <group ref={satBankGroupRef} rotation={[Math.PI / 2, 0, 0]}>
          <SpacecraftAssembly
            structure={structure}
            powerGen={powerGen}
            comms={comms}
            selectedInstruments={selectedInstruments}
            isScanning={isScanning}
            isDownlinking={isDownlinking}
          />
        </group>
      </group>
    </group>
  );
}

// -------------------------------------------------------------
// 5. LAUNCH PAD & ASCENT SCENE (Vehicle-specific + Stage Sep + Fairing + Sky!)
// -------------------------------------------------------------
function LaunchPadScene({
  orbit,
  launchVehicle,
  progress = 0,
  launchState,
  launchMotionRef,
  structure,
  powerGen,
  comms,
  selectedInstruments,
  rocketPosRef
}: {
  orbit: Orbit;
  launchVehicle: LaunchVehicle;
  progress?: number;
  launchState?: LaunchVisualState;
  launchMotionRef?: React.MutableRefObject<LaunchMotionRefState>;
  structure: StructureSubsystem;
  powerGen: PowerGenSubsystem;
  comms: CommsSubsystem;
  selectedInstruments: Instrument[];
  rocketPosRef: React.MutableRefObject<THREE.Vector3>;
}) {
  const rocketGroupRef = useRef<THREE.Group>(null);
  const skyDomeRef = useRef<THREE.Mesh>(null);
  const skyDomeMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const stageSepGroupRef = useRef<THREE.Group>(null);
  const fairingLeftRef = useRef<THREE.Group>(null);
  const fairingRightRef = useRef<THREE.Group>(null);
  const plumeOuterRef = useRef<THREE.Mesh>(null);
  const plumeInnerRef = useRef<THREE.Mesh>(null);
  const sepElapsedRef = useRef(0);
  const fairingElapsedRef = useRef(0);

  const course = useMemo(() => getFlightCourseForOrbit(orbit.id), [orbit.id]);

  const effectiveProgress = launchState ? launchState.progressPercent : progress;
  const pitchDeg = launchState ? launchState.pitchAngleDeg : 90;
  const throttle = launchState ? launchState.throttle : 100;
  const stageSeparated = launchState ? launchState.stageSeparated : effectiveProgress > 46;
  const fairingDeployed = launchState ? launchState.fairingDeployed : effectiveProgress > 70;
  const phase = launchState ? launchState.phase : effectiveProgress > 0 ? 'BOOSTER_ASCENT' : 'PAD';

  const initialYZ = sampleSpineYZ(effectiveProgress);
  const initialX = launchState?.steerLaneX ?? 0;

  const isElectron = launchVehicle.id === 'lv-electron';
  const isSLS = launchVehicle.id === 'lv-nasa-sls';
  const isVulcan = launchVehicle.id === 'lv-vulcan-centaur';

  const coreColor = isElectron ? '#18181b' : isSLS ? '#ea580c' : isVulcan ? '#dc2626' : '#f8fafc';
  const accentColor = isElectron ? '#f8fafc' : isSLS ? '#1e293b' : isVulcan ? '#f8fafc' : '#0f172a';
  const coreRadius = isElectron ? 0.34 : isSLS ? 0.56 : 0.44;
  const hasSideBoosters = isSLS || isVulcan;

  // Build visible glowing 3D Skyway Track (center racing line + left/right guardrails + crossbars)
  const skywayData = useMemo(() => {
    const centerPts: THREE.Vector3[] = [];
    const leftPts: THREE.Vector3[] = [];
    const rightPts: THREE.Vector3[] = [];
    const railHalfW = course.gateRadius * 0.88;
    const trackDrop = course.gateRadius * 0.56;

    for (let i = 0; i <= 76; i++) {
      const p = 1.5 + (i / 76) * 97.5;
      const pt = getCourseCenterPoint(course, p);
      const tang = getCourseTangent(course, p, false);
      const camUp = new THREE.Vector3(0, -tang.z, tang.y).normalize();
      const deckPos = pt.clone().addScaledVector(camUp, -trackDrop);
      centerPts.push(deckPos);
      leftPts.push(deckPos.clone().add(new THREE.Vector3(-railHalfW, 0, 0)));
      rightPts.push(deckPos.clone().add(new THREE.Vector3(railHalfW, 0, 0)));
    }

    const centerGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(centerPts), 96, 0.085, 8, false);
    const leftRailGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(leftPts), 96, 0.055, 8, false);
    const rightRailGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rightPts), 96, 0.055, 8, false);

    const chevrons: { pos: [number, number, number]; quat: THREE.Quaternion; width: number }[] = [];
    const zAxis = new THREE.Vector3(0, 0, 1);
    for (let p = 6; p <= 96; p += 5) {
      const pt = getCourseCenterPoint(course, p);
      const tang = getCourseTangent(course, p, true);
      const camUp = new THREE.Vector3(0, -tang.z, tang.y).normalize();
      const deckPos = pt.clone().addScaledVector(camUp, -trackDrop);
      const q = new THREE.Quaternion().setFromUnitVectors(zAxis, tang);
      chevrons.push({
        pos: [deckPos.x, deckPos.y, deckPos.z],
        quat: q,
        width: railHalfW * 2
      });
    }

    return { centerGeo, leftRailGeo, rightRailGeo, chevrons };
  }, [course]);

  useEffect(() => {
    return () => {
      skywayData.centerGeo.dispose();
      skywayData.leftRailGeo.dispose();
      skywayData.rightRailGeo.dispose();
    };
  }, [skywayData]);

  // Precomputed orientation for each flight gate perpendicular to the slalom skyway
  const gateVisuals = useMemo(() => {
    const zAxis = new THREE.Vector3(0, 0, 1);
    return course.gates.map((gate) => {
      const center = getCourseCenterPoint(course, gate.progress);
      const tang = getCourseTangent(course, gate.progress, true);
      const quat = new THREE.Quaternion().setFromUnitVectors(zAxis, tang);
      return { gate, center, quat };
    });
  }, [course]);

  const mathScratch = useMemo(
    () => ({
      qSpine: new THREE.Quaternion(),
      qYaw: new THREE.Quaternion(),
      qRoll: new THREE.Quaternion(),
      xAxis: new THREE.Vector3(1, 0, 0),
      yAxis: new THREE.Vector3(0, 1, 0),
      zAxis: new THREE.Vector3(0, 0, 1)
    }),
    []
  );

  // Sky transition color (deep starry coastal twilight -> upper cobalt -> obsidian deep space)
  const skyColor = useMemo(() => {
    const lowSky = new THREE.Color('#0c2c66');
    const midSky = new THREE.Color('#06163a');
    const spaceSky = new THREE.Color('#020617');
    if (effectiveProgress < 30) {
      return lowSky.clone().lerp(midSky, effectiveProgress / 30);
    }
    return midSky.clone().lerp(spaceSky, Math.min(1, (effectiveProgress - 30) / 35));
  }, [effectiveProgress]);

  useEffect(() => {
    if (!stageSeparated) sepElapsedRef.current = 0;
  }, [stageSeparated]);

  useEffect(() => {
    if (!fairingDeployed) fairingElapsedRef.current = 0;
  }, [fairingDeployed]);

  useFrame(({ clock }, delta) => {
    const liveP = launchMotionRef ? launchMotionRef.current.progressPercent : effectiveProgress;
    const liveLaneX = launchMotionRef
      ? launchMotionRef.current.steerLaneX
      : launchState?.steerLaneX ?? 0;
    const liveVelX = launchMotionRef
      ? launchMotionRef.current.steerVelX
      : launchState?.steerVelX ?? 0;
    const liveThrottle = launchMotionRef ? launchMotionRef.current.throttle : throttle;

    const yz = sampleSpineYZ(liveP);
    rocketPosRef.current.set(liveLaneX, yz.y, yz.z);

    if (skyDomeRef.current) {
      skyDomeRef.current.position.set(liveLaneX, yz.y, yz.z);
      const skyAlpha = Math.max(0, 0.72 * (1 - Math.min(1, liveP / 52)));
      skyDomeRef.current.visible = skyAlpha > 0.01;
      if (skyDomeMatRef.current) {
        skyDomeMatRef.current.opacity = skyAlpha;
      }
    }

    if (rocketGroupRef.current) {
      rocketGroupRef.current.position.set(liveLaneX, yz.y, yz.z);
      const tang = getCourseTangent(course, liveP, false);
      const spinePitchRad = Math.atan2(tang.z, tang.y);
      const manualPitchBias = liveP > 0 ? ((90 - pitchDeg) * 0.08 * Math.PI) / 180 : 0;
      const yawAngle = liveP > 0.3 ? THREE.MathUtils.clamp(liveVelX * 0.045, -0.34, 0.34) : 0;
      const bankAngle = liveP > 0.3 ? THREE.MathUtils.clamp(liveVelX * 0.095, -0.68, 0.68) : 0;

      mathScratch.qSpine.setFromAxisAngle(mathScratch.xAxis, spinePitchRad - manualPitchBias);
      mathScratch.qYaw.setFromAxisAngle(mathScratch.zAxis, -yawAngle);
      mathScratch.qRoll.setFromAxisAngle(mathScratch.yAxis, bankAngle);
      rocketGroupRef.current.quaternion
        .copy(mathScratch.qSpine)
        .multiply(mathScratch.qYaw)
        .multiply(mathScratch.qRoll);
    }

    // Animate flickering flame plume
    if (plumeOuterRef.current && plumeInnerRef.current) {
      const flicker = 0.88 + Math.sin(clock.elapsedTime * 38) * 0.14;
      const tScale = Math.max(0.35, liveThrottle / 100);
      plumeOuterRef.current.scale.set(1, flicker * tScale, 1);
      plumeInnerRef.current.scale.set(1, (flicker + 0.1) * tScale, 1);
    }

    // Animate Stage 1 falling away after separation
    if (stageSeparated && stageSepGroupRef.current) {
      sepElapsedRef.current += delta;
      const t = sepElapsedRef.current;
      stageSepGroupRef.current.position.y = -t * 4.5 - t * t * 1.4;
      stageSepGroupRef.current.position.x = -t * 0.9;
      stageSepGroupRef.current.rotation.z = t * 0.45;
      stageSepGroupRef.current.visible = t < 6;
    } else if (stageSepGroupRef.current) {
      stageSepGroupRef.current.position.set(0, 0, 0);
      stageSepGroupRef.current.rotation.set(0, 0, 0);
      stageSepGroupRef.current.visible = true;
    }

    // Animate Fairing halves splitting apart
    if (fairingDeployed && fairingLeftRef.current && fairingRightRef.current) {
      fairingElapsedRef.current += delta;
      const t = fairingElapsedRef.current;
      fairingLeftRef.current.position.set(-t * 2.1, -t * 1.6, 0);
      fairingLeftRef.current.rotation.z = t * 0.9;
      fairingLeftRef.current.visible = t < 5;

      fairingRightRef.current.position.set(t * 2.1, -t * 1.6, 0);
      fairingRightRef.current.rotation.z = -t * 0.9;
      fairingRightRef.current.visible = t < 5;
    } else if (fairingLeftRef.current && fairingRightRef.current) {
      fairingLeftRef.current.position.set(0, 0, 0);
      fairingLeftRef.current.rotation.set(0, 0, 0);
      fairingLeftRef.current.visible = true;
      fairingRightRef.current.position.set(0, 0, 0);
      fairingRightRef.current.rotation.set(0, 0, 0);
      fairingRightRef.current.visible = true;
    }
  });

  const isThrusting =
    phase === 'BOOSTER_ASCENT' ||
    phase === 'UPPER_STAGE' ||
    (effectiveProgress > 0 && phase !== 'COUNTDOWN' && phase !== 'MECO_PROMPT' && phase !== 'ORBIT_SUCCESS');

  const padSteamClouds = useMemo(
    () => [
      [-1.4, 0.4, 0.8, 1.0],
      [1.5, 0.35, -0.7, 1.1],
      [0.2, 0.5, 1.6, 0.95],
      [-0.8, 0.45, -1.4, 1.05],
      [2.1, 0.3, 0.6, 0.85]
    ],
    []
  );

  const cloudLayer = useMemo(
    () => [
      [-12, 16, -6, 3.2],
      [11, 22, -10, 3.8],
      [-13, 28, -14, 2.9],
      [13, 35, -20, 4.1],
      [-10, 42, -25, 3.4]
    ],
    []
  );

  const swingAngle = effectiveProgress > 0.5 ? Math.min(Math.PI / 2.2, effectiveProgress * 0.12) : 0;

  return (
    <group>
      {/* Dynamic Semi-Transparent Atmospheric Twilight Veil (lets stars shine through from liftoff!) */}
      <mesh ref={skyDomeRef} position={[initialX, initialYZ.y, initialYZ.z]} renderOrder={-10}>
        <sphereGeometry args={[145, 24, 24]} />
        <meshBasicMaterial
          ref={skyDomeMatRef}
          color={skyColor}
          transparent
          opacity={0.72}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Coastal Launchpad Terrain & Service Tower (World Ground y = 0) */}
      <group position={[0, 0, 0]}>
        {/* Coastal Grass / Sand Island */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]} receiveShadow>
          <circleGeometry args={[36, 48]} />
          <meshStandardMaterial color="#14532d" roughness={0.95} />
        </mesh>
        {/* Atlantic Ocean Surrounding */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]}>
          <ringGeometry args={[36, 110, 48]} />
          <meshStandardMaterial color="#0369a1" roughness={0.4} metalness={0.2} />
        </mesh>
        {/* Concrete Launch Pad Deck */}
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <boxGeometry args={[6.4, 0.3, 6.4]} />
          <meshStandardMaterial color="#475569" roughness={0.85} />
        </mesh>
        {/* Blast Trench */}
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[2.2, 0.08, 2.8]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        {/* Red Umbilical Launch Tower */}
        <group position={[-2.1, 0, 0]}>
          <mesh position={[0, 3.2, 0]} castShadow>
            <boxGeometry args={[0.75, 6.4, 0.75]} />
            <meshStandardMaterial color="#dc2626" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0, 6.5, 0]}>
            <boxGeometry args={[0.95, 0.2, 0.95]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          {/* Retracting Swing Arms */}
          <group position={[0.38, 4.4, 0]} rotation={[0, swingAngle, 0]}>
            <mesh position={[0.85, 0, 0]}>
              <boxGeometry args={[1.7, 0.14, 0.18]} />
              <meshStandardMaterial color="#e2e8f0" />
            </mesh>
          </group>
          <group position={[0.38, 2.7, 0]} rotation={[0, -swingAngle, 0]}>
            <mesh position={[0.85, 0, 0]}>
              <boxGeometry args={[1.7, 0.14, 0.18]} />
              <meshStandardMaterial color="#e2e8f0" />
            </mesh>
          </group>
        </group>

        {/* Pad Exhaust Steam Clouds during Ignition / Liftoff */}
        {effectiveProgress > 0 && effectiveProgress < 16 && (
          <group>
            {padSteamClouds.map(([x, y, z, s], i) => (
              <mesh
                key={i}
                position={[x * (1 + effectiveProgress * 0.12), y + effectiveProgress * 0.06, z * (1 + effectiveProgress * 0.12)]}
                scale={s * (0.8 + effectiveProgress * 0.15)}
              >
                <sphereGeometry args={[0.85, 12, 12]} />
                <meshStandardMaterial color="#f8fafc" transparent opacity={Math.max(0, 0.65 - effectiveProgress * 0.04)} roughness={1} />
              </mesh>
            ))}
          </group>
        )}
      </group>

      {/* Passing Atmospheric Clouds (Gives visceral speed sensation!) */}
      {cloudLayer.map(([x, y, z, s], idx) => (
        <group key={idx} position={[x, y, z]} scale={s}>
          <mesh>
            <sphereGeometry args={[1, 12, 12]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.45} roughness={1} />
          </mesh>
          <mesh position={[0.9, -0.15, 0.2]} scale={0.75}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.4} roughness={1} />
          </mesh>
        </group>
      ))}

      {/* Curved Earth Horizon below when high in space */}
      {effectiveProgress > 42 && (
        <group position={[0, -56, -42]}>
          <mesh>
            <sphereGeometry args={[52, 48, 32]} />
            <meshStandardMaterial color="#1d4ed8" roughness={0.6} />
          </mesh>
          <mesh>
            <sphereGeometry args={[52.5, 48, 32]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} side={THREE.BackSide} />
          </mesh>
        </group>
      )}

      {/* 3D GLOWING SKYWAY FLIGHT PATH TRACK (Centerline + Left/Right Guardrails + Chevrons) */}
      <group>
        <mesh geometry={skywayData.centerGeo}>
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.78} />
        </mesh>
        <mesh geometry={skywayData.leftRailGeo}>
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.42} />
        </mesh>
        <mesh geometry={skywayData.rightRailGeo}>
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.42} />
        </mesh>
        {skywayData.chevrons.map((ch, idx) => (
          <group key={idx} position={ch.pos} quaternion={ch.quat}>
            <mesh>
              <boxGeometry args={[ch.width, 0.04, 0.22]} />
              <meshBasicMaterial color="#0284c7" transparent opacity={0.34} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 3D ORIENTED FLIGHT GATES / RINGS ALONG SLALOM SKYWAY */}
      {gateVisuals.map(({ gate, center, quat }, idx) => {
        const res = launchState?.gateResults?.[idx] || 'pending';
        const isNext =
          res === 'pending' &&
          gate.progress >= effectiveProgress - 2.5 &&
          course.gates
            .slice(0, idx)
            .every((_, prevIdx) => (launchState?.gateResults?.[prevIdx] || 'pending') !== 'pending');
        const ringColor =
          res === 'hit'
            ? '#34d399'
            : res === 'miss'
            ? '#fb7185'
            : isNext
            ? '#facc15'
            : '#38bdf8';
        return (
          <group key={gate.index} position={[center.x, center.y, center.z]} quaternion={quat}>
            {/* Main Outer Gate Ring */}
            <mesh>
              <torusGeometry args={[gate.radius, isNext ? 0.14 : 0.095, 14, 42]} />
              <meshBasicMaterial
                color={ringColor}
                transparent
                opacity={res === 'pending' ? (isNext ? 0.98 : 0.65) : 0.5}
              />
            </mesh>
            {/* Inner Bullseye Apex Guide Ring for upcoming targets */}
            {res === 'pending' && (
              <mesh>
                <torusGeometry args={[gate.radius * 0.42, isNext ? 0.05 : 0.032, 10, 28]} />
                <meshBasicMaterial
                  color={isNext ? '#22d3ee' : '#0ea5e9'}
                  transparent
                  opacity={isNext ? 0.85 : 0.28}
                />
              </mesh>
            )}
            {/* Subtle Center Target Beacon Dot */}
            {isNext && (
              <mesh>
                <sphereGeometry args={[0.16, 12, 12]} />
                <meshBasicMaterial color="#fde047" transparent opacity={0.85} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* THE ASCENDING LAUNCH VEHICLE ASSEMBLY */}
      <group ref={rocketGroupRef} position={[initialX, initialYZ.y, initialYZ.z]}>
        <group position={[0, -2.2, 0]}>
        {/* STAGE 1 BOOSTER + SIDE BOOSTERS (Separates at MECO!) */}
        <group ref={stageSepGroupRef}>
          {/* Main Stage 1 Core */}
          <mesh castShadow position={[0, 2.05, 0]}>
            <cylinderGeometry args={[coreRadius, coreRadius, 3.6, 24]} />
            <meshStandardMaterial color={coreColor} metalness={0.45} roughness={0.32} />
          </mesh>
          {/* Interstage Band */}
          <mesh position={[0, 3.65, 0]}>
            <cylinderGeometry args={[coreRadius + 0.01, coreRadius + 0.01, 0.45, 24]} />
            <meshStandardMaterial color={accentColor} metalness={0.5} roughness={0.4} />
          </mesh>
          {/* Engine Nozzle Skirt */}
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[coreRadius * 0.72, coreRadius * 0.95, 0.32, 16]} />
            <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.25} />
          </mesh>

          {/* Falcon 9 Folded Landing Legs */}
          {!isElectron && !hasSideBoosters && [0, 90, 180, 270].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            return (
              <mesh
                key={deg}
                position={[Math.cos(rad) * (coreRadius + 0.05), 0.75, Math.sin(rad) * (coreRadius + 0.05)]}
              >
                <boxGeometry args={[0.07, 1.15, 0.14]} />
                <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
              </mesh>
            );
          })}

          {/* Twin Side Solid Rocket Boosters (SLS / Vulcan) */}
          {hasSideBoosters && [-1, 1].map((side) => (
            <group key={side} position={[side * (coreRadius + 0.34), 1.65, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.24, 0.24, 3.0, 16]} />
                <meshStandardMaterial color="#f8fafc" metalness={0.35} roughness={0.35} />
              </mesh>
              <mesh position={[0, 1.75, 0]}>
                <coneGeometry args={[0.24, 0.55, 16]} />
                <meshStandardMaterial color={isSLS ? '#f8fafc' : '#dc2626'} metalness={0.4} roughness={0.3} />
              </mesh>
              <mesh position={[0, -1.6, 0]}>
                <cylinderGeometry args={[0.14, 0.22, 0.28, 12]} />
                <meshStandardMaterial color="#334155" metalness={0.8} />
              </mesh>
            </group>
          ))}

          {/* Stage 1 Thruster Plume */}
          {isThrusting && !stageSeparated && (
            <group position={[0, -0.1, 0]}>
              <mesh ref={plumeOuterRef} position={[0, -1.4, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[coreRadius * 1.45, 3.2, 16]} />
                <meshBasicMaterial color="#f97316" transparent opacity={0.88} />
              </mesh>
              <mesh ref={plumeInnerRef} position={[0, -1.0, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[coreRadius * 0.85, 2.3, 16]} />
                <meshBasicMaterial color="#fef08a" transparent opacity={0.96} />
              </mesh>
            </group>
          )}
        </group>

        {/* STAGE 2 UPPER STAGE */}
        <group position={[0, 3.9, 0]}>
          <mesh castShadow position={[0, 0.45, 0]}>
            <cylinderGeometry args={[coreRadius * 0.96, coreRadius * 0.96, 0.9, 24]} />
            <meshStandardMaterial color={isElectron ? '#18181b' : '#f1f5f9'} metalness={0.45} roughness={0.3} />
          </mesh>
          {/* Upper Stage Vacuum Engine Bell (Visible after MECO!) */}
          <mesh position={[0, -0.12, 0]}>
            <cylinderGeometry args={[coreRadius * 0.35, coreRadius * 0.55, 0.32, 16]} />
            <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.2} />
          </mesh>

          {/* Upper Stage Vacuum Plume (Ionized Cyan/Blue after MECO!) */}
          {isThrusting && stageSeparated && (
            <group position={[0, -0.3, 0]}>
              <mesh ref={plumeOuterRef} position={[0, -1.1, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[coreRadius * 1.3, 2.4, 16]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.8} />
              </mesh>
              <mesh ref={plumeInnerRef} position={[0, -0.8, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[coreRadius * 0.65, 1.7, 16]} />
                <meshBasicMaterial color="#e0f2fe" transparent opacity={0.95} />
              </mesh>
            </group>
          )}

          {/* Supersonic Max-Q Condensation Vapor Cone */}
          {(launchState?.maxQStress || (effectiveProgress >= 14 && effectiveProgress <= 36 && isThrusting)) && !fairingDeployed && (
            <group position={[0, 1.55, 0]}>
              <mesh rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[coreRadius * 3.1, 1.4, 24, 1, true]} />
                <meshBasicMaterial color="#e0f2fe" transparent opacity={launchState?.maxQStress ? 0.34 : 0.16} side={THREE.DoubleSide} />
              </mesh>
              <mesh position={[0, -0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[coreRadius * 1.15, coreRadius * 2.8, 24]} />
                <meshBasicMaterial color="#bae6fd" transparent opacity={launchState?.maxQStress ? 0.32 : 0.15} side={THREE.DoubleSide} />
              </mesh>
            </group>
          )}

          {/* PAYLOAD SPACECRAFT INSIDE FAIRING (Revealed when Fairing deploys!) */}
          <group position={[0, 1.3, 0]} scale={0.28}>
            <SpacecraftAssembly
              structure={structure}
              powerGen={powerGen}
              comms={comms}
              selectedInstruments={selectedInstruments}
            />
          </group>

          {/* CLAMSHELL PAYLOAD FAIRING HALVES */}
          <group position={[0, 1.4, 0]}>
            <group ref={fairingLeftRef}>
              <mesh castShadow position={[0, 0, 0]}>
                <cylinderGeometry
                  args={[coreRadius * 1.12, coreRadius * 1.0, 1.1, 16, 1, false, Math.PI / 2, Math.PI]}
                />
                <meshStandardMaterial color="#f8fafc" metalness={0.35} roughness={0.25} side={THREE.DoubleSide} />
              </mesh>
              <mesh position={[0, 0.9, 0]}>
                <coneGeometry args={[coreRadius * 1.12, 0.8, 16, 1, false, Math.PI / 2, Math.PI]} />
                <meshStandardMaterial color={isVulcan ? '#dc2626' : '#f8fafc'} metalness={0.4} roughness={0.25} side={THREE.DoubleSide} />
              </mesh>
            </group>

            <group ref={fairingRightRef}>
              <mesh castShadow position={[0, 0, 0]}>
                <cylinderGeometry
                  args={[coreRadius * 1.12, coreRadius * 1.0, 1.1, 16, 1, false, -Math.PI / 2, Math.PI]}
                />
                <meshStandardMaterial color="#f8fafc" metalness={0.35} roughness={0.25} side={THREE.DoubleSide} />
              </mesh>
              <mesh position={[0, 0.9, 0]}>
                <coneGeometry args={[coreRadius * 1.12, 0.8, 16, 1, false, -Math.PI / 2, Math.PI]} />
                <meshStandardMaterial color={isVulcan ? '#dc2626' : '#f8fafc'} metalness={0.4} roughness={0.25} side={THREE.DoubleSide} />
              </mesh>
            </group>
          </group>
        </group>
        </group>
      </group>
    </group>
  );
}

// -------------------------------------------------------------
// 6. DYNAMIC CAMERA RIG (Always frames Hangar / Orbit / Ascending Rocket!)
// -------------------------------------------------------------
function getResolvedOrbitRadius(orbit: Orbit): number {
  const spec = BODY_VISUAL_SPECS[orbit.centralBody] || BODY_VISUAL_SPECS.earth;
  if (orbit.id === 'orbit-sso-700') return 4.1;
  if (orbit.id === 'orbit-geo-35786') return 5.6;
  return spec.defaultOrbitRadius;
}

function computeSatPovPose(frame: SatOrbitalFrame) {
  const { satPos, radial, tangent, crossVec, slewDeg, orbitRadius } = frame;
  const slewRad = (slewDeg * Math.PI) / 180;
  // Mount POV aft & above the spacecraft solar wings so the satellite never smashes into the camera
  const backDist = 2.55;
  const upDist = 1.24;
  const sideLag = -Math.sin(slewRad) * 0.28;

  const camPos = satPos
    .clone()
    .addScaledVector(tangent, -backDist)
    .addScaledVector(radial, upDist)
    .addScaledVector(crossVec, sideLag);

  // Look ahead over the spacecraft toward the forward swath, markers, and curved planet horizon
  const nadirPull = 1.38 + Math.max(0, orbitRadius - 3.7) * 0.42;
  const lookTarget = satPos
    .clone()
    .addScaledVector(tangent, 2.75)
    .addScaledVector(radial, -nadirPull)
    .addScaledVector(crossVec, Math.sin(slewRad) * 1.35);

  const upVec = radial
    .clone()
    .addScaledVector(crossVec, -Math.sin(slewRad) * 0.14)
    .normalize();

  return { camPos, lookTarget, upVec };
}

function CameraRig({
  mode,
  orbit,
  camFocus = 'satellite',
  isLandingShowcase = false,
  launchState,
  launchMotionRef,
  orbitalMotionRef,
  rocketPosRef,
  satWorldPosRef,
  satFrameRef
}: {
  mode: ViewportMode;
  orbit: Orbit;
  camFocus: 'satellite' | 'global';
  isLandingShowcase?: boolean;
  launchState?: LaunchVisualState;
  launchMotionRef?: React.MutableRefObject<LaunchMotionRefState>;
  orbitalMotionRef?: React.MutableRefObject<OrbitalMotionRefState>;
  rocketPosRef: React.MutableRefObject<THREE.Vector3>;
  satWorldPosRef: React.MutableRefObject<THREE.Vector3>;
  satFrameRef: React.MutableRefObject<SatOrbitalFrame>;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const prevRocketPosRef = useRef(new THREE.Vector3(0, 0, 0));
  const smoothTargetRef = useRef(new THREE.Vector3(0, 4.5, -1.0));
  const smoothOrbitalTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const course = useMemo(() => getFlightCourseForOrbit(orbit.id), [orbit.id]);

  const computeChasePose = (p: number, laneX: number) => {
    const yz = sampleSpineYZ(p);
    const rp = new THREE.Vector3(laneX, yz.y, yz.z);
    const tang = getCourseTangent(course, p, false);
    const camUp = new THREE.Vector3(0, -tang.z, tang.y).normalize();

    const behindPos = rp
      .clone()
      .addScaledVector(tang, -10.6)
      .addScaledVector(camUp, 4.4);
    behindPos.x = laneX * 0.88;
    behindPos.y = Math.max(2.3, behindPos.y);

    const padPos = new THREE.Vector3(laneX * 0.35, 3.6, 12.2);
    const tRamp = THREE.MathUtils.smoothstep(p, 0, 14);
    const camPos = padPos.lerp(behindPos, tRamp);

    const aheadP = Math.min(100, p + 14);
    const aheadYZ = sampleSpineYZ(aheadP);
    const aheadCourseX = sampleCourseLaneX(course, aheadP);
    const aheadPt = new THREE.Vector3(
      THREE.MathUtils.lerp(laneX, aheadCourseX, 0.35),
      aheadYZ.y,
      aheadYZ.z
    );
    const desiredTarget = rp
      .clone()
      .multiplyScalar(0.56)
      .addScaledVector(aheadPt, 0.44)
      .addScaledVector(camUp, 0.65);

    return { rp, camPos, desiredTarget };
  };

  const isLaunchChase = mode === 'launch' && (launchState?.cameraAngle || 'chase') === 'chase';
  const isSatPov = mode === 'orbit' && !isLandingShowcase && camFocus === 'satellite';

  // Snap camera gracefully whenever mode, orbit, or camFocus changes
  useEffect(() => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;

    if (camera instanceof THREE.PerspectiveCamera) {
      const targetFov =
        mode === 'orbit' && isLandingShowcase ? 28 : isSatPov ? 54 : 46;
      if (camera.fov !== targetFov) {
        camera.fov = targetFov;
        camera.updateProjectionMatrix();
      }
    }

    if (mode === 'hangar') {
      camera.up.set(0, 1, 0);
      camera.position.set(4.1, 2.1, 5.1);
      ctrl.target.set(0, -0.35, 0);
      ctrl.minDistance = 2.2;
      ctrl.maxDistance = 12.0;
      ctrl.update();
    } else if (mode === 'orbit') {
      if (isLandingShowcase) {
        // Lock camera straight-on so static Half-Earth on the right edge never shifts or spins
        camera.position.set(0, 0, 18.0);
        camera.up.set(0, 1, 0);
        ctrl.target.set(0, 0, 0);
        ctrl.minDistance = 18.0;
        ctrl.maxDistance = 18.0;
        ctrl.update();
      } else if (camFocus === 'satellite') {
        // Seed exact initial orbital frame so Satellite POV snaps cleanly on frame 0
        const initOrbitRadius = getResolvedOrbitRadius(orbit);
        const initIncRad = (orbit.inclinationDeg * Math.PI) / 180;
        const initAngle = orbitalMotionRef?.current.orbitAngleRad ?? 0.15;
        const initSlew = orbitalMotionRef?.current.slewDeg ?? 0;
        const initFrame = computeOrbitFrame(initAngle, initIncRad, initOrbitRadius);
        const spec = BODY_VISUAL_SPECS[orbit.centralBody] || BODY_VISUAL_SPECS.earth;
        satFrameRef.current = {
          satPos: initFrame.satPos.clone(),
          radial: initFrame.radial.clone(),
          tangent: initFrame.tangent.clone(),
          crossVec: initFrame.crossVec.clone(),
          slewDeg: initSlew,
          orbitRadius: initOrbitRadius,
          surfaceRadius: spec.surfaceRadius
        };
        const { camPos, lookTarget, upVec } = computeSatPovPose(satFrameRef.current);
        camera.up.copy(upVec);
        camera.position.copy(camPos);
        smoothOrbitalTargetRef.current.copy(lookTarget);
        camera.lookAt(smoothOrbitalTargetRef.current);
      } else {
        camera.up.set(0, 1, 0);
        const orbitR = getResolvedOrbitRadius(orbit);
        let orbitDist = 9.0;
        if (orbit.id === 'orbit-geo-35786') orbitDist = 12.4;
        else if (orbit.id === 'orbit-sso-700') orbitDist = 9.6;
        else if (orbit.id === 'orbit-lunar-polar-100' || orbit.centralBody === 'asteroid' || orbit.centralBody === 'europa') {
          orbitDist = 8.4;
        } else if (orbit.centralBody === 'titan') {
          orbitDist = 9.6;
        }
        camera.position.set(orbitDist * 0.28, orbitDist * 0.78, orbitDist * 0.92);
        ctrl.target.set(0, 0, 0);
        // Keep Orbit Map camera comfortably outside the satellite orbital ring so craft never collides with viewer
        ctrl.minDistance = orbitR + 2.6;
        ctrl.maxDistance = 24.0;
        ctrl.update();
      }
    } else if (mode === 'launch') {
      const liveP = launchMotionRef
        ? launchMotionRef.current.progressPercent
        : launchState?.progressPercent ?? 0;
      const liveLaneX = launchMotionRef
        ? launchMotionRef.current.steerLaneX
        : launchState?.steerLaneX ?? 0;
      const yz = sampleSpineYZ(liveP);
      rocketPosRef.current.set(liveLaneX, yz.y, yz.z);
      const rp = rocketPosRef.current;
      prevRocketPosRef.current.copy(rp);

      camera.up.set(0, 1, 0);
      const angle = launchState?.cameraAngle || 'chase';
      if (angle === 'side') {
        camera.position.set(rp.x + 11.2, rp.y + 1.4, rp.z + 2.8);
        ctrl.target.set(rp.x, rp.y + 0.5, rp.z);
        ctrl.minDistance = 3.5;
        ctrl.maxDistance = 42.0;
        ctrl.update();
      } else if (angle === 'pad') {
        camera.position.set(10.5, 2.8, 12.6);
        ctrl.target.set(rp.x, rp.y + 0.6, rp.z);
        ctrl.minDistance = 3.5;
        ctrl.maxDistance = 85.0;
        ctrl.update();
      } else {
        const { camPos, desiredTarget } = computeChasePose(liveP, liveLaneX);
        camera.position.copy(camPos);
        smoothTargetRef.current.copy(desiredTarget);
        camera.lookAt(smoothTargetRef.current);
      }
    }
  }, [
    mode,
    orbit,
    camFocus,
    isLandingShowcase,
    isSatPov,
    launchState?.cameraAngle,
    camera,
    rocketPosRef,
    satWorldPosRef,
    satFrameRef,
    orbitalMotionRef
  ]);

  // Continuous live tracking in Launch mode and Orbit Satellite POV
  useFrame(({ clock }, delta) => {
    const ctrl = controlsRef.current;

    if (mode === 'launch') {
      const liveP = launchMotionRef
        ? launchMotionRef.current.progressPercent
        : launchState?.progressPercent ?? 0;
      const liveLaneX = launchMotionRef
        ? launchMotionRef.current.steerLaneX
        : launchState?.steerLaneX ?? 0;
      const yz = sampleSpineYZ(liveP);
      const rp = rocketPosRef.current;
      rp.set(liveLaneX, yz.y, yz.z);
      const angle = launchState?.cameraAngle || 'chase';

      if (angle === 'chase') {
        const { camPos, desiredTarget } = computeChasePose(liveP, liveLaneX);
        const lerpAlpha = 1 - Math.exp(-Math.min(0.1, delta) * 11);
        camera.position.lerp(camPos, lerpAlpha);
        smoothTargetRef.current.lerp(desiredTarget, lerpAlpha);

        if (launchState?.maxQStress) {
          camera.position.x += Math.sin(clock.elapsedTime * 55) * 0.032;
          camera.position.y += Math.cos(clock.elapsedTime * 61) * 0.032;
        }
        camera.lookAt(smoothTargetRef.current);
      } else if (ctrl) {
        const dx = rp.x - prevRocketPosRef.current.x;
        const dy = rp.y - prevRocketPosRef.current.y;
        const dz = rp.z - prevRocketPosRef.current.z;

        if (angle !== 'pad') {
          camera.position.x += dx;
          camera.position.y += dy;
          camera.position.z += dz;
        }
        ctrl.target.set(rp.x, rp.y + 0.5, rp.z);

        if (launchState?.maxQStress) {
          camera.position.x += Math.sin(clock.elapsedTime * 55) * 0.03;
          camera.position.y += Math.cos(clock.elapsedTime * 61) * 0.03;
        }
        ctrl.update();
      }

      prevRocketPosRef.current.copy(rp);
    } else if (isSatPov) {
      const { camPos, lookTarget, upVec } = computeSatPovPose(satFrameRef.current);
      const povAlpha = 1 - Math.exp(-Math.min(0.1, delta) * 14);
      camera.position.lerp(camPos, povAlpha);
      smoothOrbitalTargetRef.current.lerp(lookTarget, povAlpha);
      camera.up.lerp(upVec, povAlpha).normalize();
      camera.lookAt(smoothOrbitalTargetRef.current);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={!isLandingShowcase && !isLaunchChase && !isSatPov}
      enablePan={!isLandingShowcase && mode !== 'launch' && !isSatPov}
      enableZoom={!isLandingShowcase && !isLaunchChase && !isSatPov}
      enableDamping={!isLandingShowcase && !isLaunchChase && !isSatPov}
      dampingFactor={0.07}
      makeDefault
    />
  );
}

// -------------------------------------------------------------
// MAIN 3D COMPOSER
// -------------------------------------------------------------
export const GameCanvas3D: React.FC<GameCanvas3DProps> = ({
  mode,
  structure,
  powerGen,
  comms,
  selectedInstruments,
  orbit,
  launchVehicle,
  launchProgressPercent = 0,
  launchState,
  isScanning = false,
  isDownlinking = false,
  isEclipse = false,
  isLandingShowcase = false,
  camFocus = 'satellite',
  orbitalMotionRef,
  launchMotionRef,
  orbitalGameplay,
  onSelectOrbitalTarget,
  onClickDownlinkCone
}) => {
  const rocketPosRef = useRef(new THREE.Vector3(0, 0, 0));
  const satWorldPosRef = useRef(new THREE.Vector3(3.7, 0, 0));
  const satFrameRef = useRef<SatOrbitalFrame>({
    satPos: new THREE.Vector3(3.7, 0, 0),
    radial: new THREE.Vector3(1, 0, 0),
    tangent: new THREE.Vector3(0, 0, 1),
    crossVec: new THREE.Vector3(0, 1, 0),
    slewDeg: 0,
    orbitRadius: 3.7,
    surfaceRadius: 2.04
  });
  const effectiveProgress = launchState ? launchState.progressPercent : launchProgressPercent;

  return (
    <div
      className={`absolute inset-0 w-full h-full ${
        isLandingShowcase ? 'pointer-events-none' : 'pointer-events-auto'
      }`}
    >
      <Canvas
        shadows
        camera={{
          position: isLandingShowcase ? [0, 0, 18.0] : [0, 4.5, 8.2],
          fov: isLandingShowcase ? 28 : 46,
          near: 0.1,
          far: 450
        }}
        className={`w-full h-full ${isLandingShowcase ? '' : 'cursor-grab active:cursor-grabbing'}`}
      >
        <color attach="background" args={['#020617']} />
        <ambientLight
          intensity={
            mode === 'launch' && effectiveProgress < 35
              ? 0.9
              : isLandingShowcase
              ? 0.18
              : mode === 'orbit'
              ? 0.3
              : 0.6
          }
        />
        <directionalLight
          position={isLandingShowcase ? [-12, 4, 10] : [12, 9, 10]}
          intensity={isLandingShowcase ? 3.25 : mode === 'orbit' ? 3.15 : 2.5}
          castShadow
          color="#fffbeb"
        />
        <pointLight
          position={isLandingShowcase ? [2, -4, 8] : [-10, -4, -8]}
          intensity={isLandingShowcase ? 0.22 : mode === 'orbit' ? 0.36 : 1.0}
          color={mode === 'orbit' ? '#e2e8f0' : '#38bdf8'}
        />
        <pointLight
          position={[6, -6, 5]}
          intensity={mode === 'hangar' ? 0.85 : 0.22}
          color={mode === 'hangar' ? '#105bd8' : '#fef3c7'}
        />

        <CosmicBackdrop mode={mode} launchProgress={effectiveProgress} isStatic={isLandingShowcase} />

        {mode === 'hangar' && (
          <HangarScene
            structure={structure}
            powerGen={powerGen}
            comms={comms}
            selectedInstruments={selectedInstruments}
            orbit={orbit}
          />
        )}

        {mode === 'orbit' && isLandingShowcase && <LandingHalfEarthScene />}

        {mode === 'orbit' && !isLandingShowcase && (
          <OrbitFlightScene
            structure={structure}
            powerGen={powerGen}
            comms={comms}
            selectedInstruments={selectedInstruments}
            orbit={orbit}
            isScanning={isScanning}
            isDownlinking={isDownlinking}
            isEclipse={isEclipse}
            satWorldPosRef={satWorldPosRef}
            satFrameRef={satFrameRef}
            orbitalMotionRef={orbitalMotionRef}
            orbitalGameplay={orbitalGameplay}
            onSelectOrbitalTarget={onSelectOrbitalTarget}
            onClickDownlinkCone={onClickDownlinkCone}
          />
        )}

        {mode === 'launch' && (
          <LaunchPadScene
            orbit={orbit}
            launchVehicle={launchVehicle}
            progress={effectiveProgress}
            launchState={launchState}
            launchMotionRef={launchMotionRef}
            structure={structure}
            powerGen={powerGen}
            comms={comms}
            selectedInstruments={selectedInstruments}
            rocketPosRef={rocketPosRef}
          />
        )}

        <CameraRig
          mode={mode}
          orbit={orbit}
          camFocus={camFocus}
          isLandingShowcase={isLandingShowcase}
          launchState={launchState}
          launchMotionRef={launchMotionRef}
          orbitalMotionRef={orbitalMotionRef}
          rocketPosRef={rocketPosRef}
          satWorldPosRef={satWorldPosRef}
          satFrameRef={satFrameRef}
        />
      </Canvas>
    </div>
  );
};
