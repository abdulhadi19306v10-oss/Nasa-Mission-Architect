export type TutorialScreenRequirement = 'hangar' | 'flight_arcade' | 'orbital_command';

export type TutorialBuilderTab =
  | 'payload'
  | 'power_bus'
  | 'systems'
  | 'launch'
  | 'structure'
  | 'power'
  | 'adcs'
  | 'comms'
  | 'avionics'
  | 'trajectory';

export interface TutorialStepDef {
  id: string;
  stepNumber: number;
  screen: TutorialScreenRequirement;
  callsign: string;
  title: string;
  instruction: string;
  scienceTip: string;
  checkLabel: string;
  suggestedTab?: TutorialBuilderTab;
}

export const TUTORIAL_STEPS: TutorialStepDef[] = [
  {
    id: 'select-world',
    stepNumber: 1,
    screen: 'hangar',
    callsign: 'CAPCOM // LESSON 01 / 08',
    title: 'Choose Planet, Moon, or Deep-Space Target',
    instruction:
      'Click "DEST: ..." in the top Flight Control bar (or switch to 04 ROCKET & ORBIT below) to explore all 8 worlds: Earth, Mars, Venus, Moon, Europa, Titan, 16 Psyche, or Sun-Earth L2.',
    scienceTip:
      'Sunlight follows the 1/r² inverse-square law: Mars gets 43% of Earth solar flux, Europa just 3.7%, and Titan only 1.1%!',
    checkLabel: 'Open the World Selector or switch to ROCKET & ORBIT tab',
    suggestedTab: 'launch'
  },
  {
    id: 'mount-payload',
    stepNumber: 2,
    screen: 'hangar',
    callsign: 'PAYLOAD OPS // LESSON 02 / 08',
    title: 'Mount a Science Instrument',
    instruction:
      'Select 01 SENSORS in the workbench dock and mount instruments matching the Mission Goals checklist on the left (SAR Radar pierces clouds; Lidar maps rocky moons).',
    scienceTip:
      'Every sensor draws continuous power, generates thermal heat, and fills onboard SSD memory with science GB every orbit.',
    checkLabel: 'At least 1 science instrument mounted on bus',
    suggestedTab: 'payload'
  },
  {
    id: 'go-nogo-balance',
    stepNumber: 3,
    screen: 'hangar',
    callsign: 'SYSTEMS // LESSON 03 / 08',
    title: 'Complete Build Goals & Clear Any Red Faults',
    instruction:
      'Watch the Mission Goals checklist on the left turn green! Open 02 BODY & POWER or 03 GUIDANCE & COMMS if any red fault banner asks for bigger solar panels, batteries, or Star Trackers.',
    scienceTip:
      'Moon, Mars, Venus, Europa, Titan, 16 Psyche & L2 lack an Earth-like dipole magnetic field, so Magnetorquers cannot generate torque there.',
    checkLabel: 'Clear all preflight faults so craft is READY TO LAUNCH',
    suggestedTab: 'power_bus'
  },
  {
    id: 'inspect-and-launch',
    stepNumber: 4,
    screen: 'hangar',
    callsign: 'LAUNCH CONTROL // LESSON 04 / 08',
    title: 'Inspect 3D Spacecraft & Ignite Booster',
    instruction:
      'Drag the 3D scene to inspect your custom spacecraft, pick your booster in 04 ROCKET & ORBIT if overloaded, then press the bright LAUNCH MISSION button.',
    scienceTip:
      'Swapping structures, antennas, solar wings, or RTG fins updates your 3D CAD assembly and center-of-mass geometry in real time.',
    checkLabel: 'Press LAUNCH MISSION to begin ascent',
    suggestedTab: 'launch'
  },
  {
    id: 'ascent-corridor',
    stepNumber: 5,
    screen: 'flight_arcade',
    callsign: 'ASCENT GUIDANCE // LESSON 05 / 08',
    title: 'Steer Rocket Through Glowing 3D Rings',
    instruction:
      'Hold A / D (or Left / Right Arrow keys, or click STEER buttons) like driving a car to steer along the skyway track cleanly through the glowing 3D rings, and hold W/S around Max-Q!',
    scienceTip:
      'Launching east uses Earth’s 465 m/s rotational boost while aerodynamic dynamic pressure peaks mid-ascent at Max-Q.',
    checkLabel: 'Fly cleanly through skyway ascent rings'
  },
  {
    id: 'stage-separation',
    stepNumber: 6,
    screen: 'flight_arcade',
    callsign: 'STAGE OFFICER // LESSON 06 / 08',
    title: 'Command Stage Separation [SPACE]',
    instruction:
      'When the golden STAGE WINDOW cue flashes during ascent, press [SPACE] (or click STAGE NOW) inside the green timing marker for clean separation and a +20% Score Boost.',
    scienceTip:
      'Dumping empty booster propellant tanks obeys the Tsiolkovsky Rocket Equation—dramatically increasing upper-stage ΔV.',
    checkLabel: 'Complete orbital insertion to enter Orbital Command'
  },
  {
    id: 'orbital-scan',
    stepNumber: 7,
    screen: 'orbital_command',
    callsign: 'SCIENCE OPS // LESSON 07 / 08',
    title: 'Steer POV Reticle & Scan One Marker [SPACE]',
    instruction:
      'Use A/D to aim your reticle over a glowing marker (or click it), then press [SPACE] (or ANALYZE) to record its science telemetry before uploading.',
    scienceTip:
      'Spacecraft transmit each observation packet home before starting the next high-rate science capture.',
    checkLabel: 'Scan a Marker in Satellite POV'
  },
  {
    id: 'orbital-downlink',
    stepNumber: 8,
    screen: 'orbital_command',
    callsign: 'FLIGHT DIRECTOR // LESSON 08 / 08',
    title: 'Upload Packet to Earth [E], Then Scan Again',
    instruction:
      'Fly through any green Earth Link / DSN Cone and press [E] (or click UPLOAD TO EARTH) to send your scanned packet home. Once uploaded, you can scan the next marker—repeat for all 4 markers!',
    scienceTip:
      'Scanning once, uploading once, and repeating across all 4 markers completes the mission and unlocks your real NASA debrief.',
    checkLabel: 'Upload scanned data back to Earth [E]'
  }
];
