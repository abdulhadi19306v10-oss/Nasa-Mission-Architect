import {
  SpacecraftDesign,
  ResourceBudget,
  MissionReport,
  MissionEvent,
  Scenario,
  Instrument,
  Orbit,
  RealMission
} from '../types';
import { evaluateMissionDesign } from './scorer';

export interface SimulationStepUpdate {
  currentDay: number;
  totalDays: number;
  activeEvents: MissionEvent[];
  batteryHealthPercent: number;
  solarArrayEfficiency: number;
  cumulativeScienceGb: number;
  isComplete: boolean;
}

export function generateMissionTimelineEvents(
  design: SpacecraftDesign,
  budget: ResourceBudget,
  orbit: Orbit
): MissionEvent[] {
  const events: MissionEvent[] = [];

  // Milestone 1: Day 1 - Launch & Separation
  events.push({
    id: 'evt-separation',
    day: 1,
    title: 'Spacecraft Separation & Solar Array Deployment',
    description: 'Launch vehicle second stage has shut down. Payload clamp bands released. Solar panel actuators energized.',
    severity: 'info',
    resolved: true,
    impactDescription: 'Solar arrays deployed successfully. Primary power bus energized.'
  });

  // Milestone 2: Day 14 - Commissioning & First Light
  events.push({
    id: 'evt-first-light',
    day: 14,
    title: 'Subsystem Commissioning & First Light',
    description: 'All primary instruments underwent calibration tests and optical alignment.',
    severity: 'info',
    resolved: true,
    impactDescription: 'Initial calibration confirmed nominal sensor response.'
  });

  // Anomaly 1: Orbit-dependent event
  if (orbit.radiationLevel === 'high' || orbit.radiationLevel === 'cosmic-rays') {
    events.push({
      id: 'evt-solar-storm',
      day: 95,
      title: 'Class-X Solar Flare & Particle Flux Event',
      description: 'Intense flux of energetic solar protons intercepted by the spacecraft magnetometer and payload sensors.',
      severity: 'anomaly',
      resolved: false,
      impactDescription: 'High risk of Single Event Upsets (SEU) in flight computer memory.',
      choice: {
        prompt: 'Select spacecraft defensive posture during particle flux event:',
        options: [
          {
            label: 'Enter Protective Safe Mode (Power down non-critical instruments for 48 hours)',
            outcomeText: 'Spacecraft survived intact with 0 memory upsets. Minor 2-day loss of science data.',
            scienceEfficiencyMult: 0.98
          },
          {
            label: 'Keep Instruments Active (Attempt continuous observation)',
            outcomeText: 'Memory errors caused flight computer watchdog reset and sensor reboot.',
            scienceEfficiencyMult: 0.90
          }
        ]
      }
    });
  } else {
    events.push({
      id: 'evt-micrometeorite',
      day: 120,
      title: 'Orbital Debris / Micro-Meteoroid Proximity',
      description: 'Space Surveillance Network alerted mission control to a close pass with orbital debris.',
      severity: 'warning',
      resolved: true,
      impactDescription: 'Passed safely at 420m distance. No avoidance burn necessary.'
    });
  }

  // Anomaly 2: Reaction wheel or power anomaly around Day 300
  if (design.adcsId === 'adcs-reaction-wheels' || design.adcsId === 'adcs-star-tracker-precision') {
    events.push({
      id: 'evt-wheel-jitter',
      day: 280,
      title: 'Reaction Wheel Bearing Friction Anomaly',
      description: 'Telemetry indicates elevated temperature and current draw on Reaction Wheel #2.',
      severity: 'warning',
      resolved: false,
      impactDescription: 'Attitude control stability fluctuating slightly.',
      choice: {
        prompt: 'Select attitude control mitigation command:',
        options: [
          {
            label: 'Re-distribute momentum using Magnetic Torquers / RCS thrusters',
            outcomeText: 'Bearing load relieved. Pointing accuracy restored to nominal.',
            scienceEfficiencyMult: 1.0
          },
          {
            label: 'Increase wheel torque to force through resistance',
            outcomeText: 'Wheel bearing temperature rose, increasing pointing jitter by 15%.',
            scienceEfficiencyMult: 0.92
          }
        ]
      }
    });
  }

  // Anomaly 3: Ground station pass glitch
  events.push({
    id: 'evt-downlink-glitch',
    day: 450,
    title: 'Severe Atmospheric Rain Fade at Primary Ground Station',
    description: 'Heavy typhoon at Svalbard ground station prevented Ka/X-band downlink contact.',
    severity: 'warning',
    resolved: true,
    impactDescription: budget.dataBufferHeadroomGb > 0
      ? 'Onboard solid-state recorder buffered data until next contact window. Zero data loss.'
      : 'Onboard buffer filled to capacity; oldest uncompressed frames were overwritten.'
  });

  return events;
}

export function runFullMissionSimulation(
  design: SpacecraftDesign,
  budget: ResourceBudget,
  scenario: Scenario,
  instruments: Instrument[],
  orbit: Orbit,
  realMissions: RealMission[]
): MissionReport {
  const baseReport = evaluateMissionDesign(design, budget, scenario, instruments, orbit, realMissions);
  const events = generateMissionTimelineEvents(design, budget, orbit);
  return {
    ...baseReport,
    eventsEncountered: events
  };
}
