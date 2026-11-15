import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Orbit } from '@sim/index';
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
  getCachedPsycheGeometry
} from './planetaryTextures';

interface OrbitViewerProps {
  orbit: Orbit;
}

function OrbitScene({ orbit }: OrbitViewerProps) {
  const satelliteRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  const downlinkLine = React.useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const mat = new THREE.LineBasicMaterial({ color: '#22c55e', linewidth: 2 });
    const line = new THREE.Line(geom, mat);
    line.visible = false;
    return line;
  }, []);

  // Ground station coordinates on Earth sphere (radius = 2.0)
  // Wallops (USA), Svalbard (Norway), Canberra (Australia)
  const groundStations = [
    { name: 'Wallops', lat: 37.9, lon: -75.4 },
    { name: 'Svalbard', lat: 78.2, lon: 15.6 },
    { name: 'Canberra', lat: -35.3, lon: 149.1 }
  ].map((st) => {
    const phi = (90 - st.lat) * (Math.PI / 180);
    const theta = (st.lon + 180) * (Math.PI / 180);
    const r = 2.02;
    return {
      name: st.name,
      pos: new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      )
    };
  });

  const bodySpec = BODY_VISUAL_SPECS[orbit.centralBody] || BODY_VISUAL_SPECS.earth;
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

  // Calculate orbit ring radius relative to body visual radius
  let orbitRadius = bodySpec.defaultOrbitRadius * 0.82;
  if (orbit.id === 'orbit-sso-700') orbitRadius = 2.7;
  else if (orbit.id === 'orbit-geo-35786') orbitRadius = 4.8;
  else if (orbit.id === 'orbit-lunar-polar-100') orbitRadius = 3.2;
  else if (orbit.id === 'orbit-lagrange-l2') orbitRadius = 5.4;

  const inclinationRad = (orbit.inclinationDeg * Math.PI) / 180;

  // Orbit loop animation
  useFrame((_, delta) => {
    timeRef.current += delta * 0.8;
    const angle = timeRef.current;

    const x = Math.cos(angle) * orbitRadius;
    const y = Math.sin(angle) * Math.sin(inclinationRad) * orbitRadius;
    const z = Math.sin(angle) * Math.cos(inclinationRad) * orbitRadius;

    if (satelliteRef.current) {
      satelliteRef.current.position.set(x, y, z);
    }

    // Check line of sight to closest ground station
    if (downlinkLine && satelliteRef.current) {
      const satPos = satelliteRef.current.position;
      let closestStation = groundStations[0];
      let minDistance = 999;
      for (const st of groundStations) {
        const d = satPos.distanceTo(st.pos);
        if (d < minDistance) {
          minDistance = d;
          closestStation = st;
        }
      }

      // If within contact horizon
      if (minDistance < (orbitRadius - 2.0) * 1.8 + 1.2) {
        downlinkLine.visible = true;
        const positions = new Float32Array([
          satPos.x, satPos.y, satPos.z,
          closestStation.pos.x, closestStation.pos.y, closestStation.pos.z
        ]);
        downlinkLine.geometry.setAttribute(
          'position',
          new THREE.BufferAttribute(positions, 3)
        );
      } else {
        downlinkLine.visible = false;
      }
    }
  });

  return (
    <group>
      {/* 1. CENTRAL CELESTIAL BODY */}
      {orbit.centralBody === 'earth' ? (
        <group key="earth">
          <mesh>
            <sphereGeometry args={[2.0, 48, 48]} />
            <meshStandardMaterial
              map={earthTex.dayMap}
              bumpMap={earthTex.bumpMap}
              bumpScale={0.05}
              roughness={0.56}
              metalness={0.08}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[2.03, 40, 40]} />
            <meshStandardMaterial map={earthTex.cloudMap} transparent opacity={0.7} depthWrite={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[2.13, 32, 32]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.18} side={THREE.BackSide} />
          </mesh>
          {groundStations.map((st) => (
            <group key={st.name} position={st.pos}>
              <mesh>
                <sphereGeometry args={[0.04, 12, 12]} />
                <meshBasicMaterial color="#22c55e" />
              </mesh>
            </group>
          ))}
        </group>
      ) : orbit.centralBody === 'lagrange' ? (
        <group key="lagrange">
          <mesh>
            <sphereGeometry args={[0.14, 20, 20]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
          <mesh rotation={[0.45, 0.25, 0]}>
            <torusGeometry args={[1.65, 0.015, 8, 64]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} />
          </mesh>
          <group position={[-4.2, 0.85, -8.0]}>
            <mesh>
              <sphereGeometry args={[0.68, 32, 32]} />
              <meshStandardMaterial map={earthTex.dayMap} roughness={0.6} />
            </mesh>
            <mesh position={[1.35, 0.25, 0.45]}>
              <sphereGeometry args={[0.19, 20, 20]} />
              <meshStandardMaterial map={moonTex.map} roughness={0.94} />
            </mesh>
          </group>
          <group position={[7.2, 2.7, -14.0]}>
            <mesh>
              <sphereGeometry args={[3.2, 36, 36]} />
              <meshBasicMaterial map={sunTex} />
            </mesh>
            <mesh>
              <sphereGeometry args={[3.9, 32, 32]} />
              <meshBasicMaterial color="#fbbf24" transparent opacity={0.22} side={THREE.BackSide} />
            </mesh>
          </group>
        </group>
      ) : orbit.centralBody === 'asteroid' ? (
        <mesh key="asteroid" geometry={psycheGeom}>
          <meshStandardMaterial
            map={asteroidTex.map}
            bumpMap={asteroidTex.bumpMap}
            bumpScale={0.11}
            roughness={0.36}
            metalness={0.74}
          />
        </mesh>
      ) : (
        <group key={orbit.centralBody}>
          <mesh>
            <sphereGeometry args={[bodySpec.radius * 0.88, 48, 48]} />
            <meshStandardMaterial
              map={
                orbit.centralBody === 'mars'
                  ? marsTex.map
                  : orbit.centralBody === 'venus'
                  ? venusTex.map
                  : orbit.centralBody === 'europa'
                  ? europaTex.map
                  : orbit.centralBody === 'titan'
                  ? titanTex
                  : moonTex.map
              }
              bumpMap={
                orbit.centralBody === 'mars'
                  ? marsTex.bumpMap
                  : orbit.centralBody === 'europa'
                  ? europaTex.bumpMap
                  : orbit.centralBody === 'moon'
                  ? moonTex.bumpMap
                  : undefined
              }
              bumpScale={bodySpec.bumpScale}
              roughness={bodySpec.roughness}
              metalness={bodySpec.metalness}
            />
          </mesh>
          {bodySpec.atmosphereColor && (
            <mesh>
              <sphereGeometry args={[bodySpec.radius * 0.94, 32, 32]} />
              <meshBasicMaterial
                color={bodySpec.atmosphereColor}
                transparent
                opacity={bodySpec.atmosphereOpacity}
                side={THREE.BackSide}
              />
            </mesh>
          )}
          {orbit.centralBody === 'europa' && (
            <mesh position={[-5.8, 1.8, -9.5]}>
              <sphereGeometry args={[2.8, 36, 36]} />
              <meshStandardMaterial map={jupiterTex} roughness={0.72} />
            </mesh>
          )}
          {orbit.centralBody === 'titan' && (
            <group position={[-6.0, 2.0, -9.8]} rotation={[0.42, 0.18, -0.3]}>
              <mesh>
                <sphereGeometry args={[2.0, 36, 36]} />
                <meshStandardMaterial map={saturnTex} roughness={0.72} />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[2.6, 4.6, 64]} />
                <meshStandardMaterial map={saturnRingTex} transparent opacity={0.88} side={THREE.DoubleSide} />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* 2. ORBIT TRAJECTORY RING */}
      <group rotation={[inclinationRad, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[orbitRadius - 0.02, orbitRadius + 0.02, 64]} />
          <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} transparent opacity={0.65} />
        </mesh>
      </group>

      {/* 3. SATELLITE VEHICLE */}
      <group ref={satelliteRef}>
        <mesh>
          <boxGeometry args={[0.15, 0.15, 0.15]} />
          <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={0.5} />
        </mesh>
        {/* Solar panels */}
        <mesh position={[0.2, 0, 0]}>
          <boxGeometry args={[0.2, 0.08, 0.01]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <mesh position={[-0.2, 0, 0]}>
          <boxGeometry args={[0.2, 0.08, 0.01]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </group>

      {/* 4. ACTIVE DOWNLINK TELEMETRY BEAM */}
      <primitive object={downlinkLine} />
    </group>
  );
}

export const OrbitViewer: React.FC<OrbitViewerProps> = ({ orbit }) => {
  return (
    <div className="relative w-full h-full min-h-[380px] rounded-xl overflow-hidden bg-space-950 border border-cyan-500/30 shadow-2xl">
      <Canvas
        camera={{ position: [5.0, 4.0, 6.0], fov: 45 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <ambientLight intensity={0.25} />
        {/* Sun light with day/night shadow */}
        <directionalLight position={[10, 2, 8]} intensity={2.0} />
        <pointLight position={[-8, -5, -8]} intensity={0.2} color="#1e3a8a" />

        <Stars radius={120} depth={60} count={3500} factor={4} saturation={0} fade speed={0.5} />

        <OrbitScene orbit={orbit} />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          minDistance={3}
          maxDistance={15}
          makeDefault
        />
      </Canvas>

      {/* Orbit info badge */}
      <div className="absolute top-3 left-3 bg-space-900/90 backdrop-blur border border-cyan-500/20 px-3.5 py-2 rounded-lg text-xs space-y-1 pointer-events-none">
        <div className="font-mono text-cyan-400 font-semibold">{orbit.name}</div>
        <div className="text-[11px] text-slate-300 flex items-center gap-3">
          <span>Alt: <strong className="text-white">{orbit.altitudeKm.toLocaleString()} km</strong></span>
          <span>Inc: <strong className="text-white">{orbit.inclinationDeg}°</strong></span>
          <span>Period: <strong className="text-white">{orbit.periodMinutes} min</strong></span>
        </div>
      </div>

      <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-space-900/80 px-2.5 py-1 rounded border border-slate-700/60 text-[11px] text-slate-400 pointer-events-none font-mono">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        Green Vector = Line-of-Sight Ground Station Downlink
      </div>
    </div>
  );
};
