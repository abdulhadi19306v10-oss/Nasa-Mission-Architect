import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  StructureSubsystem,
  PowerGenSubsystem,
  CommsSubsystem,
  Instrument,
  isNuclearRtgPower
} from '@sim/index';

export interface SpacecraftAssemblyProps {
  structure: StructureSubsystem;
  powerGen: PowerGenSubsystem;
  comms: CommsSubsystem;
  selectedInstruments: Instrument[];
  isScanning?: boolean;
  isDownlinking?: boolean;
}

interface BusMetrics {
  halfH: number;
  deckY: number;
  flatZ: number;
  sideWallX: number;
  cornerR: number;
}

function getBusMetrics(shape: StructureSubsystem['shape']): BusMetrics {
  if (shape === 'hexagonal') {
    return {
      halfH: 0.93,
      deckY: 0.975,
      flatZ: 1.11,
      sideWallX: 1.28,
      cornerR: 1.28
    };
  }
  if (shape === 'octagonal') {
    return {
      halfH: 0.68,
      deckY: 0.71,
      flatZ: 0.835,
      sideWallX: 0.835,
      cornerR: 0.92
    };
  }
  return {
    halfH: 0.63,
    deckY: 0.65,
    flatZ: 0.39,
    sideWallX: 0.39,
    cornerR: 0.54
  };
}

function createSolarTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0f2d7a';
  ctx.fillRect(0, 0, 256, 128);

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  for (let x = 0; x <= 256; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 128);
    ctx.stroke();
  }
  for (let y = 0; y <= 128; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  ctx.lineWidth = 0.8;
  for (let x = 8; x < 256; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 128);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Distinct CAD geometry for each top-deck scientific instrument, resting with base at y = 0. */
function DeckInstrumentModel({
  id,
  whiteMat,
  darkMat,
  goldMat,
  lensMat
}: {
  id: string;
  whiteMat: THREE.Material;
  darkMat: THREE.Material;
  goldMat: THREE.Material;
  lensMat: THREE.Material;
}) {
  if (id === 'inst-lunar-lidar') {
    return (
      <group>
        <mesh position={[0, 0.04, 0]} material={darkMat}>
          <boxGeometry args={[0.3, 0.08, 0.24]} />
        </mesh>
        {/* Main receiver telescope barrel */}
        <mesh position={[-0.04, 0.24, 0]} castShadow material={whiteMat}>
          <cylinderGeometry args={[0.095, 0.1, 0.32, 16]} />
        </mesh>
        <mesh position={[-0.04, 0.405, 0]} rotation={[-Math.PI / 2, 0, 0]} material={lensMat}>
          <circleGeometry args={[0.078, 16]} />
        </mesh>
        {/* Parallel active green/cyan laser emitter tube */}
        <mesh position={[0.09, 0.21, 0]} castShadow material={goldMat}>
          <cylinderGeometry args={[0.04, 0.042, 0.26, 12]} />
        </mesh>
        <mesh position={[0.09, 0.345, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.03, 12]} />
          <meshBasicMaterial color="#34d399" />
        </mesh>
      </group>
    );
  }

  if (id === 'inst-hyperspectral') {
    return (
      <group>
        <mesh position={[0, 0.04, 0]} material={darkMat}>
          <boxGeometry args={[0.32, 0.08, 0.24]} />
        </mesh>
        <mesh position={[0, 0.18, 0]} castShadow material={whiteMat}>
          <boxGeometry args={[0.28, 0.2, 0.2]} />
        </mesh>
        {/* Gold radiator cooling wing */}
        <mesh position={[0, 0.18, -0.125]} material={goldMat}>
          <boxGeometry args={[0.24, 0.16, 0.03]} />
        </mesh>
        {/* Wide-slit optical baffle */}
        <mesh position={[0, 0.31, 0.02]} material={darkMat}>
          <boxGeometry args={[0.22, 0.07, 0.12]} />
        </mesh>
        <mesh position={[0, 0.348, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.18, 0.07]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      </group>
    );
  }

  if (id === 'inst-neutron-spectrometer') {
    return (
      <group>
        <mesh position={[0, 0.04, 0]} material={darkMat}>
          <boxGeometry args={[0.28, 0.08, 0.28]} />
        </mesh>
        <mesh position={[0, 0.17, 0]} castShadow material={goldMat}>
          <boxGeometry args={[0.24, 0.18, 0.24]} />
        </mesh>
        {/* Ribbed boron neutron shield fins */}
        {[-0.08, 0, 0.08].map((fx) => (
          <mesh key={fx} position={[fx, 0.29, 0]} material={darkMat}>
            <boxGeometry args={[0.028, 0.09, 0.22]} />
          </mesh>
        ))}
      </group>
    );
  }

  if (id === 'inst-radiometer') {
    return (
      <group>
        <mesh position={[0, 0.07, 0]} material={darkMat}>
          <cylinderGeometry args={[0.085, 0.11, 0.14, 16]} />
        </mesh>
        <group position={[0, 0.15, 0]} rotation={[0.35, 0, 0]}>
          <mesh position={[0, 0.2, 0]} rotation={[Math.PI, 0, 0]} castShadow>
            <sphereGeometry args={[0.2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2.8]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.78} roughness={0.18} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.14, 0]} material={goldMat}>
            <coneGeometry args={[0.03, 0.08, 12]} />
          </mesh>
        </group>
      </group>
    );
  }

  // Default / inst-multispectral: Twin-aperture pushbroom optical imager
  return (
    <group>
      <mesh position={[0, 0.04, 0]} material={darkMat}>
        <boxGeometry args={[0.3, 0.08, 0.22]} />
      </mesh>
      <mesh position={[0, 0.19, 0]} castShadow material={whiteMat}>
        <boxGeometry args={[0.26, 0.22, 0.18]} />
      </mesh>
      {[-0.065, 0.065].map((ox) => (
        <group key={ox} position={[ox, 0.31, 0]}>
          <mesh material={goldMat}>
            <cylinderGeometry args={[0.052, 0.056, 0.06, 16]} />
          </mesh>
          <mesh position={[0, 0.032, 0]} rotation={[-Math.PI / 2, 0, 0]} material={lensMat}>
            <circleGeometry args={[0.044, 16]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export const SpacecraftAssembly: React.FC<SpacecraftAssemblyProps> = ({
  structure,
  powerGen,
  comms,
  selectedInstruments,
  isScanning = false,
  isDownlinking = false
}) => {
  const trackingWingLRef = useRef<THREE.Group>(null);
  const trackingWingRRef = useRef<THREE.Group>(null);
  const scanBeamRef = useRef<THREE.Mesh>(null);

  const metrics = getBusMetrics(structure.shape);
  const { halfH, deckY, flatZ, sideWallX, cornerR } = metrics;

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    if (
      powerGen.sunTracking ||
      powerGen.id === 'pwr-articulated-tracking' ||
      powerGen.id === 'pwr-mega-outer-solar'
    ) {
      const pitch = Math.sin(t * 0.45) * 0.35;
      if (trackingWingLRef.current) trackingWingLRef.current.rotation.x = pitch;
      if (trackingWingRRef.current) trackingWingRRef.current.rotation.x = pitch;
    }
    if (scanBeamRef.current && isScanning) {
      scanBeamRef.current.rotation.y += delta * 2.5;
      const mat = scanBeamRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.28 + Math.sin(t * 10) * 0.1;
    }
  });

  const solarTex = useMemo(() => createSolarTexture(), []);
  const boxEdgesGeom = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(0.78, 1.26, 0.78)), []);

  const goldMliMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color('#f59e0b'), metalness: 0.85, roughness: 0.22 }),
    []
  );
  const whiteHullMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color('#e2e8f0'), metalness: 0.3, roughness: 0.42 }),
    []
  );
  const darkFrameMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color('#1e293b'), metalness: 0.72, roughness: 0.34 }),
    []
  );
  const nasaBlueDecal = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color('#0b3d91'), metalness: 0.4, roughness: 0.35 }),
    []
  );
  const nasaRedDecal = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color('#fc3d21'), metalness: 0.35, roughness: 0.4 }),
    []
  );
  const solarCellMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ map: solarTex, metalness: 0.65, roughness: 0.16 }),
    [solarTex]
  );
  const glowingLensMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#38bdf8'),
        emissive: new THREE.Color('#00e5ff'),
        emissiveIntensity: 0.9,
        metalness: 0.9,
        roughness: 0.08
      }),
    []
  );

  // Wing mount starts cleanly outside sideWallX via a visible solar drive boom
  const hingeLength = 0.44;
  const wingStartX = sideWallX + hingeLength;

  // Separate side-mounted instruments from top-deck instruments so nothing contends on +Y!
  const hasTelescope = selectedInstruments.some((i) => i.id === 'inst-space-telescope');
  const hasSar = selectedInstruments.some((i) => i.id === 'inst-sar-radar');
  const hasMagBoom = selectedInstruments.some((i) => i.id === 'inst-magnetometer-boom');
  const deckInstruments = selectedInstruments.filter(
    (i) => i.id !== 'inst-space-telescope' && i.id !== 'inst-sar-radar' && i.id !== 'inst-magnetometer-boom'
  );

  // Calibrated telescope barrel size per bus so it never overhangs small CubeSat walls
  const teleRadius = structure.shape === 'hexagonal' ? 0.48 : structure.shape === 'octagonal' ? 0.38 : 0.27;
  const teleHeight = structure.shape === 'hexagonal' ? 1.42 : structure.shape === 'octagonal' ? 1.15 : 0.88;

  // Dedicated anchor corners for top-deck Comms hardware (disjoint from center & from each other!)
  // Rear-left corner shoulder for Ka-Band HGA Dish boom:
  const hgaShoulderX = -Math.min(sideWallX * 0.7, cornerR * 0.56);
  const hgaShoulderZ = -Math.min(flatZ * 0.72, cornerR * 0.56);
  const hgaElbowX = hgaShoulderX - 0.56;
  const hgaElbowZ = hgaShoulderZ - 0.56;
  const hgaPivotY = deckY + 0.72;
  const hgaDishRadius = structure.shape === 'box' ? 0.42 : 0.54;

  // Front-left exterior sponson for X-Band Horn:
  const xBandX = -Math.min(0.68, sideWallX * 0.86);
  const xBandZ = flatZ + 0.18;

  // Front-right exterior sponson for Optical Laser DSOC:
  const laserX = Math.min(0.68, sideWallX * 0.86);
  const laserZ = flatZ + 0.18;

  const hgaElbowTransform = useMemo(() => {
    const start = new THREE.Vector3(hgaShoulderX, deckY + 0.54, hgaShoulderZ);
    const end = new THREE.Vector3(hgaElbowX, hgaPivotY, hgaElbowZ);
    const delta = end.clone().sub(start);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      delta.clone().normalize()
    );
    return { mid, quat, len: delta.length() };
  }, [hgaShoulderX, deckY, hgaShoulderZ, hgaElbowX, hgaPivotY, hgaElbowZ]);

  const rtgBoomTransform = useMemo(() => {
    const start = new THREE.Vector3(0, -halfH * 0.48, -flatZ * 0.92);
    const end = new THREE.Vector3(0, -halfH * 0.82, -(flatZ + 0.76));
    const delta = end.clone().sub(start);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      delta.clone().normalize()
    );
    return { mid, end, quat, len: delta.length() };
  }, [halfH, flatZ]);

  const magBoomTransform = useMemo(() => {
    const anchor = new THREE.Vector3(sideWallX * 0.68, -halfH * 0.45, -flatZ * 0.68);
    const dir = new THREE.Vector3(0.62, -0.34, -0.71).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return { anchor, quat };
  }, [sideWallX, halfH, flatZ]);

  // Compute collision-free top-deck coordinates [x, z, outriggerFrom] for every deck instrument
  const deckPlacements = useMemo(() => {
    const count = deckInstruments.length;
    if (count === 0) return [];

    if (hasTelescope) {
      // Orbit around outer rim outside telescope cylinder!
      const ringR = teleRadius + 0.38;
      return deckInstruments.map((_, idx) => {
        // Place along right/front/back arcs leaving [-3*PI/4] clear for rear-left HGA dish pylon
        const startAng = -Math.PI * 0.32;
        const endAng = Math.PI * 0.9;
        const frac = count === 1 ? 0.32 : idx / (count - 1);
        const ang = startAng + frac * (endAng - startAng);
        return {
          x: Math.cos(ang) * ringR,
          z: Math.sin(ang) * ringR,
          needsBracket: ringR > flatZ * 0.72
        };
      });
    }

    if (count === 1) {
      return [{ x: 0, z: 0, needsBracket: false }];
    }

    // Ring radius chosen so min chord separation >= 0.48 even with multiple compact instruments
    const ringR =
      structure.shape === 'box'
        ? count <= 2
          ? 0.3
          : 0.44
        : structure.shape === 'octagonal'
        ? 0.48
        : 0.62;

    return deckInstruments.map((_, idx) => {
      // Distribute nicely across central deck away from front comms & rear-left HGA corner
      const ang = (idx / count) * Math.PI * 2 + 0.35;
      const x = Math.cos(ang) * ringR;
      const z = Math.sin(ang) * ringR;
      return {
        x,
        z,
        needsBracket: Math.hypot(x, z) > flatZ * 0.78
      };
    });
  }, [deckInstruments.length, hasTelescope, teleRadius, flatZ, structure.shape]);

  return (
    <group>
      {/* 1. PRIMARY STRUCTURE BUS */}
      {structure.shape === 'box' && (
        <group>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.78, 1.26, 0.78]} />
            <primitive object={whiteHullMaterial} attach="material" />
          </mesh>
          <mesh position={[0, -0.04, 0.394]}>
            <planeGeometry args={[0.62, 1.0]} />
            <primitive object={goldMliMaterial} attach="material" />
          </mesh>
          <mesh position={[-0.394, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[0.12, 1.15]} />
            <primitive object={nasaRedDecal} attach="material" />
          </mesh>
          <mesh position={[-0.394, 0, 0.16]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[0.06, 1.15]} />
            <primitive object={nasaBlueDecal} attach="material" />
          </mesh>
          <mesh position={[0, deckY - 0.01, 0]}>
            <boxGeometry args={[0.82, 0.04, 0.82]} />
            <primitive object={darkFrameMaterial} attach="material" />
          </mesh>
          <lineSegments geometry={boxEdgesGeom}>
            <lineBasicMaterial color="#00e5ff" />
          </lineSegments>
        </group>
      )}

      {structure.shape === 'octagonal' && (
        <group>
          <mesh castShadow receiveShadow rotation={[0, Math.PI / 8, 0]}>
            <cylinderGeometry args={[0.9, 0.9, 1.36, 8]} />
            <primitive object={goldMliMaterial} attach="material" />
          </mesh>
          <mesh position={[0, 0.69, 0]} rotation={[0, Math.PI / 8, 0]}>
            <cylinderGeometry args={[0.94, 0.94, 0.05, 8]} />
            <primitive object={whiteHullMaterial} attach="material" />
          </mesh>
          <mesh position={[0, -0.69, 0]} rotation={[0, Math.PI / 8, 0]}>
            <cylinderGeometry args={[0.94, 0.94, 0.05, 8]} />
            <primitive object={darkFrameMaterial} attach="material" />
          </mesh>
        </group>
      )}

      {structure.shape === 'hexagonal' && (
        <group>
          <mesh castShadow receiveShadow rotation={[0, Math.PI / 6, 0]}>
            <cylinderGeometry args={[1.28, 1.28, 1.86, 6]} />
            <primitive object={whiteHullMaterial} attach="material" />
          </mesh>
          {[0, 60, 120, 180, 240, 300].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            return (
              <mesh
                key={deg}
                position={[Math.sin(rad) * 1.115, 0, Math.cos(rad) * 1.115]}
                rotation={[0, rad, 0]}
              >
                <planeGeometry args={[1.05, 1.56]} />
                <primitive object={goldMliMaterial} attach="material" />
              </mesh>
            );
          })}
          <mesh position={[0, 0.95, 0]} rotation={[0, Math.PI / 6, 0]}>
            <cylinderGeometry args={[1.32, 1.32, 0.06, 6]} />
            <primitive object={darkFrameMaterial} attach="material" />
          </mesh>
        </group>
      )}

      {/* AFT PROPULSION ADAPTER RING & RCS THRUSTER NOZZLE (-Y bottom) */}
      <group position={[0, -halfH - 0.03, 0]}>
        <mesh material={darkFrameMaterial}>
          <cylinderGeometry args={[0.24, 0.28, 0.08, 16]} />
        </mesh>
        <mesh position={[0, -0.13, 0]}>
          <cylinderGeometry args={[0.1, 0.19, 0.2, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.22} />
        </mesh>
      </group>

      {/* 2. SOLAR WINGS / BODY CELLS / CANTILEVERED RTGs */}
      {powerGen.id === 'pwr-body-panels' && (
        <group>
          {structure.shape === 'hexagonal' ? (
            [60, 120, 240, 300].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              return (
                <mesh
                  key={deg}
                  position={[Math.sin(rad) * 1.128, 0, Math.cos(rad) * 1.128]}
                  rotation={[0, rad, 0]}
                >
                  <planeGeometry args={[0.88, 1.32]} />
                  <primitive object={solarCellMaterial} attach="material" />
                </mesh>
              );
            })
          ) : structure.shape === 'octagonal' ? (
            [45, 135, 225, 315].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              return (
                <mesh
                  key={deg}
                  position={[Math.sin(rad) * 0.848, 0, Math.cos(rad) * 0.848]}
                  rotation={[0, rad, 0]}
                >
                  <planeGeometry args={[0.56, 1.05]} />
                  <primitive object={solarCellMaterial} attach="material" />
                </mesh>
              );
            })
          ) : (
            <>
              <mesh position={[0, 0, -(flatZ + 0.012)]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[0.6, 1.02]} />
                <primitive object={solarCellMaterial} attach="material" />
              </mesh>
              <mesh position={[sideWallX + 0.012, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[0.6, 1.02]} />
                <primitive object={solarCellMaterial} attach="material" />
              </mesh>
            </>
          )}
        </group>
      )}

      {powerGen.id === 'pwr-deployable-fixed' && (
        <group>
          {[-1, 1].map((dir) => {
            const panelLen = 1.8;
            const centerX = dir * (wingStartX + panelLen / 2);
            return (
              <group key={dir}>
                {/* Drive flange + root strut anchored solidly to bus wall */}
                <mesh position={[dir * (sideWallX + hingeLength / 2), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.045, 0.055, hingeLength + 0.06, 12]} />
                  <primitive object={darkFrameMaterial} attach="material" />
                </mesh>
                <group position={[centerX, 0, 0]}>
                  <mesh castShadow>
                    <boxGeometry args={[panelLen, 0.9, 0.036]} />
                    <primitive object={solarCellMaterial} attach="material" />
                  </mesh>
                  <mesh position={[0, 0, -0.021]} rotation={[0, Math.PI, 0]}>
                    <planeGeometry args={[panelLen - 0.04, 0.86]} />
                    <primitive object={goldMliMaterial} attach="material" />
                  </mesh>
                </group>
              </group>
            );
          })}
        </group>
      )}

      {(powerGen.id === 'pwr-articulated-tracking' || powerGen.id === 'pwr-mega-outer-solar') && (
        <group>
          {[-1, 1].map((dir) => {
            const isMega = powerGen.id === 'pwr-mega-outer-solar';
            const panelLen = isMega ? 4.0 : 2.75;
            const panelWid = isMega ? 1.52 : 1.28;
            const centerX = dir * (wingStartX + panelLen / 2);
            const hingeLocalX = -dir * (panelLen / 2 + hingeLength / 2);
            return (
              <group
                key={dir}
                ref={dir < 0 ? trackingWingLRef : trackingWingRRef}
                position={[centerX, 0, 0]}
              >
                <mesh castShadow>
                  <boxGeometry args={[panelLen, panelWid, 0.04]} />
                  <primitive object={solarCellMaterial} attach="material" />
                </mesh>
                <mesh position={[0, 0, -0.024]} rotation={[0, Math.PI, 0]}>
                  <planeGeometry args={[panelLen - 0.04, panelWid - 0.04]} />
                  <primitive object={goldMliMaterial} attach="material" />
                </mesh>
                {/* SADAP rotary solar drive actuator bridging cleanly back into sideWallX */}
                <mesh position={[hingeLocalX, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.068, 0.068, hingeLength + 0.1, 14]} />
                  <primitive object={nasaRedDecal} attach="material" />
                </mesh>
              </group>
            );
          })}
        </group>
      )}

      {/* Cantilevered Rear-Lower MMRTG Boom (zero overlap with thruster nozzle, bus, or fins) */}
      {isNuclearRtgPower(powerGen.id) && (
        <group>
          <mesh position={rtgBoomTransform.mid} quaternion={rtgBoomTransform.quat} material={darkFrameMaterial}>
            <cylinderGeometry args={[0.04, 0.055, rtgBoomTransform.len, 12]} />
          </mesh>
          <group position={rtgBoomTransform.end} rotation={[0.42, 0, 0]}>
            {powerGen.id === 'pwr-multi-rtg' && (
              <mesh rotation={[0, 0, Math.PI / 2]} material={darkFrameMaterial}>
                <cylinderGeometry args={[0.035, 0.035, 1.06, 12]} />
              </mesh>
            )}
            {(powerGen.id === 'pwr-multi-rtg' ? [-0.46, 0, 0.46] : [0]).map((offsetX, idx) => (
              <group key={idx} position={[offsetX, -0.22, 0]}>
                <mesh castShadow material={darkFrameMaterial}>
                  <cylinderGeometry args={[0.14, 0.16, 0.62, 16]} />
                </mesh>
                {[0, 45, 90, 135].map((angle) => (
                  <mesh key={angle} rotation={[0, (angle * Math.PI) / 180, 0]}>
                    <boxGeometry args={[0.42, 0.52, 0.02]} />
                    <meshStandardMaterial
                      color="#f97316"
                      metalness={0.6}
                      roughness={0.3}
                      emissive="#9a3412"
                      emissiveIntensity={0.42}
                    />
                  </mesh>
                ))}
              </group>
            ))}
          </group>
        </group>
      )}

      {/* 3. COMMUNICATIONS (Dedicated Exterior Stanchions & Corrected Dish Pivot) */}
      {comms.id === 'comm-sband-patch' && (
        <group position={[0, halfH * 0.58, flatZ + 0.025]}>
          <mesh material={darkFrameMaterial}>
            <boxGeometry args={[0.32, 0.24, 0.04]} />
          </mesh>
          <mesh position={[0, 0, 0.022]} material={goldMliMaterial}>
            <boxGeometry args={[0.25, 0.17, 0.015]} />
          </mesh>
        </group>
      )}

      {comms.id === 'comm-xband-horn' && (
        <group position={[xBandX, deckY, xBandZ]}>
          {/* Cantilevered sponson bracket anchoring back onto bus front rim */}
          <mesh position={[0, -0.02, -0.14]} material={darkFrameMaterial}>
            <boxGeometry args={[0.14, 0.05, 0.32]} />
          </mesh>
          {/* Stanchion collar on sponson */}
          <mesh position={[0, 0.09, 0]} material={darkFrameMaterial}>
            <cylinderGeometry args={[0.06, 0.085, 0.18, 14]} />
          </mesh>
          {/* Corrugated upward-flaring waveguide horn */}
          <group position={[0, 0.17, 0]} rotation={[0.38, 0, 0.18]}>
            <mesh position={[0, 0.17, 0]} castShadow material={whiteHullMaterial}>
              <cylinderGeometry args={[0.17, 0.055, 0.34, 20]} />
            </mesh>
            <mesh position={[0, 0.34, 0]} rotation={[-Math.PI / 2, 0, 0]} material={goldMliMaterial}>
              <ringGeometry args={[0.13, 0.175, 20]} />
            </mesh>
          </group>
        </group>
      )}

      {comms.id === 'comm-kaband-dish' && (
        <group>
          {/* Vertical HGA Mast on rear-left corner */}
          <mesh position={[hgaShoulderX, deckY + 0.27, hgaShoulderZ]} material={darkFrameMaterial}>
            <cylinderGeometry args={[0.045, 0.065, 0.54, 14]} />
          </mesh>
          <mesh position={[hgaShoulderX, deckY + 0.54, hgaShoulderZ]} material={darkFrameMaterial}>
            <sphereGeometry args={[0.065, 12, 12]} />
          </mesh>
          {/* Elbow truss extending CLEAR of bus perimeter to gimbal pivot */}
          <mesh position={hgaElbowTransform.mid} quaternion={hgaElbowTransform.quat} material={nasaBlueDecal}>
            <cylinderGeometry args={[0.036, 0.042, hgaElbowTransform.len, 12]} />
          </mesh>
          {/* Articulated Parabolic Dish: apex sits EXACTLY at local [0,0,0], rim rises toward +Y */}
          <group position={[hgaElbowX, hgaPivotY, hgaElbowZ]} rotation={[-0.42, 0, 0.3]}>
            <mesh position={[0, -0.04, 0]} material={darkFrameMaterial}>
              <cylinderGeometry args={[0.08, 0.1, 0.1, 14]} />
            </mesh>
            {/* Parabolic bowl translated by +dishRadius after flip so apex touches gimbal [0,0,0] */}
            <mesh castShadow position={[0, hgaDishRadius, 0]} rotation={[Math.PI, 0, 0]}>
              <sphereGeometry args={[hgaDishRadius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 3.1]} />
              <meshStandardMaterial color="#f8fafc" metalness={0.84} roughness={0.14} side={THREE.DoubleSide} />
            </mesh>
            {/* Central feed mast + Ka-band subreflector above bowl */}
            <mesh position={[0, 0.22, 0]} material={darkFrameMaterial}>
              <cylinderGeometry args={[0.025, 0.035, 0.44, 12]} />
            </mesh>
            <mesh position={[0, 0.44, 0]} rotation={[Math.PI, 0, 0]} material={goldMliMaterial}>
              <coneGeometry args={[0.075, 0.12, 14]} />
            </mesh>
          </group>
        </group>
      )}

      {comms.id === 'comm-optical-laser' && (
        <group position={[laserX, deckY, laserZ]}>
          <mesh position={[0, -0.02, -0.14]} material={darkFrameMaterial}>
            <boxGeometry args={[0.14, 0.05, 0.32]} />
          </mesh>
          <mesh position={[0, 0.08, 0]} material={darkFrameMaterial}>
            <cylinderGeometry args={[0.07, 0.095, 0.16, 14]} />
          </mesh>
          <group position={[0, 0.15, 0]} rotation={[0.26, 0, -0.18]}>
            <mesh position={[0, 0.2, 0]} castShadow material={whiteHullMaterial}>
              <cylinderGeometry args={[0.135, 0.145, 0.4, 18]} />
            </mesh>
            <mesh position={[0, 0.405, 0]} rotation={[-Math.PI / 2, 0, 0]} material={glowingLensMaterial}>
              <circleGeometry args={[0.115, 16]} />
            </mesh>
          </group>
        </group>
      )}

      {/* 4. SCIENTIFIC INSTRUMENTS (Zero-Overlap Structural Allocation) */}
      {hasTelescope && (
        <group position={[0, deckY, 0]}>
          {/* Stepped adapter collar */}
          <mesh position={[0, 0.06, 0]} material={darkFrameMaterial}>
            <cylinderGeometry args={[teleRadius + 0.04, Math.min(flatZ * 0.9, teleRadius + 0.09), 0.12, 24]} />
          </mesh>
          {/* Main Optical Tube Assembly */}
          <mesh position={[0, 0.12 + teleHeight / 2, 0]} castShadow material={whiteHullMaterial}>
            <cylinderGeometry args={[teleRadius, teleRadius + 0.02, teleHeight, 28]} />
          </mesh>
          {/* Aperture baffle lip */}
          <mesh position={[0, 0.125 + teleHeight, 0]} rotation={[-Math.PI / 2, 0, 0]} material={darkFrameMaterial}>
            <ringGeometry args={[teleRadius * 0.82, teleRadius + 0.02, 28]} />
          </mesh>
          {/* Gold-beryllium recessed primary mirror */}
          <mesh position={[0, 0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[teleRadius * 0.88, 24]} />
            <meshStandardMaterial
              color="#fbbf24"
              metalness={0.98}
              roughness={0.05}
              emissive="#b45309"
              emissiveIntensity={0.35}
            />
          </mesh>
        </group>
      )}

      {/* Phased-Array SAR Radar Wing on +Z with twin deployment scissor trusses */}
      {hasSar && (
        <group position={[0, -0.06, flatZ]}>
          {[-0.36, 0.36].map((tx) => (
            <mesh key={tx} position={[tx, 0, 0.32]} material={darkFrameMaterial}>
              <boxGeometry args={[0.07, 0.1, 0.64]} />
            </mesh>
          ))}
          <group position={[0, 0, 0.66]}>
            <mesh castShadow>
              <boxGeometry args={[structure.shape === 'box' ? 1.5 : 2.3, structure.shape === 'box' ? 0.68 : 0.9, 0.07]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.65} roughness={0.28} />
            </mesh>
            <mesh position={[0, 0, 0.044]}>
              <planeGeometry args={[structure.shape === 'box' ? 1.42 : 2.2, structure.shape === 'box' ? 0.6 : 0.82]} />
              <meshBasicMaterial color="#00e5ff" wireframe />
            </mesh>
          </group>
        </group>
      )}

      {/* Deployable Magnetometer Boom on lower right-rear diagonal (away from HGA & Solar!) */}
      {hasMagBoom && (
        <group position={magBoomTransform.anchor} quaternion={magBoomTransform.quat}>
          <mesh position={[0, 0.16, 0]} material={darkFrameMaterial}>
            <cylinderGeometry args={[0.055, 0.075, 0.32, 12]} />
          </mesh>
          <mesh position={[0, 1.32, 0]} material={nasaBlueDecal}>
            <cylinderGeometry args={[0.024, 0.032, 2.2, 10]} />
          </mesh>
          <mesh position={[0, 2.46, 0]} material={goldMliMaterial}>
            <boxGeometry args={[0.18, 0.18, 0.18]} />
          </mesh>
        </group>
      )}

      {/* Top-Deck Compact Instruments (Each placed on its own slot / cantilevered bracket) */}
      {deckInstruments.map((inst, idx) => {
        const slot = deckPlacements[idx];
        if (!slot) return null;
        const { x, z, needsBracket } = slot;
        const dist = Math.hypot(x, z);
        const angleY = Math.atan2(x, z);
        return (
          <group key={inst.id}>
            {needsBracket && dist > 0.05 && (
              <group position={[x / 2, deckY + 0.025, z / 2]} rotation={[0, angleY, 0]}>
                <mesh material={darkFrameMaterial}>
                  <boxGeometry args={[0.14, 0.05, dist + 0.18]} />
                </mesh>
              </group>
            )}
            <group position={[x, deckY + (needsBracket ? 0.045 : 0), z]}>
              <DeckInstrumentModel
                id={inst.id}
                whiteMat={whiteHullMaterial}
                darkMat={darkFrameMaterial}
                goldMat={goldMliMaterial}
                lensMat={glowingLensMaterial}
              />
            </group>
          </group>
        );
      })}

      {/* 5. ACTIVE SENSOR HOLOGRAPHIC SCAN BEAM */}
      {isScanning && (
        <group position={[0, deckY + 2.25, 0]}>
          <mesh ref={scanBeamRef} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[1.45, 3.8, 32, 1, true]} />
            <meshBasicMaterial color="#00e5ff" transparent opacity={0.35} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 1.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.1, 1.38, 32]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* 6. ACTIVE DOWNLINK TELEMETRY BEAM */}
      {isDownlinking && (
        <group position={[0, deckY + 2.45, 0]}>
          <mesh>
            <cylinderGeometry args={[0.045, 0.08, 4.6, 12]} />
            <meshBasicMaterial color="#10b981" transparent opacity={0.85} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.14, 0.14, 4.6, 12]} />
            <meshBasicMaterial color="#34d399" transparent opacity={0.22} />
          </mesh>
        </group>
      )}
    </group>
  );
};
