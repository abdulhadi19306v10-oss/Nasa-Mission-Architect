import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { SpacecraftDesign, StructureSubsystem, PowerGenSubsystem, CommsSubsystem, Instrument } from '@sim/index';
import { SpacecraftAssembly } from './SpacecraftAssembly';

interface SpacecraftViewerProps {
  design: SpacecraftDesign;
  structure: StructureSubsystem;
  powerGen: PowerGenSubsystem;
  comms: CommsSubsystem;
  selectedInstruments: Instrument[];
}

function SpacecraftModel({
  structure,
  powerGen,
  comms,
  selectedInstruments
}: Omit<SpacecraftViewerProps, 'design'>) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      <SpacecraftAssembly
        structure={structure}
        powerGen={powerGen}
        comms={comms}
        selectedInstruments={selectedInstruments}
      />
    </group>
  );
}

export const SpacecraftViewer: React.FC<SpacecraftViewerProps> = ({
  structure,
  powerGen,
  comms,
  selectedInstruments
}) => {
  return (
    <div className="relative w-full h-full min-h-[380px] rounded-xl overflow-hidden bg-space-900 border border-cyan-500/30 shadow-2xl">
      <Canvas
        shadows
        camera={{ position: [3.2, 2.3, 3.8], fov: 42 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[6, 5, 5]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-4, -3, -4]} intensity={0.55} color="#06b6d4" />

        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

        <SpacecraftModel
          structure={structure}
          powerGen={powerGen}
          comms={comms}
          selectedInstruments={selectedInstruments}
        />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          minDistance={1.5}
          maxDistance={10}
          makeDefault
        />
      </Canvas>

      <div className="absolute top-3 left-3 bg-space-950/80 backdrop-blur border border-cyan-500/20 px-3 py-1.5 rounded-lg text-xs pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="text-slate-300 font-mono font-medium">{structure.name}</span>
        </div>
      </div>

      <div className="absolute bottom-3 right-3 text-[11px] text-slate-400 bg-space-950/70 px-2 py-1 rounded border border-slate-700/50 pointer-events-none font-mono">
        Orbit: Left Click Drag | Zoom: Scroll
      </div>
    </div>
  );
};
