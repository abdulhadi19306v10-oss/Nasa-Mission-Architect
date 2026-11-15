import { DataRegistry } from '@sim/index';
import instrumentsJson from '../../../../data/instruments.json';
import subsystemsJson from '../../../../data/subsystems.json';
import launchVehiclesJson from '../../../../data/launch-vehicles.json';
import orbitsJson from '../../../../data/orbits.json';
import scenariosJson from '../../../../data/scenarios.json';
import realMissionsJson from '../../../../data/real-missions.json';

export const gameData: DataRegistry = {
  structures: subsystemsJson.structures as any,
  powerGeneration: subsystemsJson.powerGeneration as any,
  energyStorage: subsystemsJson.energyStorage as any,
  adcs: subsystemsJson.adcs as any,
  communications: subsystemsJson.communications as any,
  obc: subsystemsJson.obc as any,
  thermal: subsystemsJson.thermal as any,
  instruments: instrumentsJson as any,
  launchVehicles: launchVehiclesJson as any,
  orbits: orbitsJson as any,
  scenarios: scenariosJson as any
};

export const realMissions = realMissionsJson as any;
