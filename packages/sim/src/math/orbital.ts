import { CelestialBodyId, CelestialBodyMeta } from '../types';

/**
 * Keplerian orbital mechanics and multi-body celestial catalog.
 */

export const MU_EARTH = 398600.4418; // km^3 / s^2
export const RADIUS_EARTH = 6371.0; // km
export const MU_MOON = 4904.8695; // km^3 / s^2
export const RADIUS_MOON = 1737.4; // km

export const CELESTIAL_BODIES: Record<CelestialBodyId, CelestialBodyMeta> = {
  earth: {
    id: 'earth',
    name: 'Earth',
    shortName: 'EARTH',
    category: 'planet',
    subtitle: 'Home World • Magnetosphere Protected',
    description:
      'Active ocean-atmosphere planet with Van Allen radiation belts, strong geomagnetic dipole for magnetorquers, and direct Near Space Network stations.',
    muKm3S2: MU_EARTH,
    radiusKm: RADIUS_EARTH,
    gravitySurfaceMs2: 9.81,
    solarDistanceAu: 1.0,
    solarFluxMultiplier: 1.0,
    hasMagnetosphere: true,
    tliPayloadScale: 1.0,
    defaultOrbitId: 'orbit-leo-400',
    recommendedPowerTip: '100% Solar Flux — deployable solar arrays are ideal.',
    accentColor: '#38bdf8'
  },
  mars: {
    id: 'mars',
    name: 'Mars',
    shortName: 'MARS',
    category: 'planet',
    subtitle: 'Red Planet • Dusty Canyons & Polar Ice',
    description:
      '1.52 AU rocky desert planet with thin CO2 atmosphere, polar water/CO2 caps, and global dust storms. Solar flux drops to 43% of Earth nominal.',
    muKm3S2: 42828.37,
    radiusKm: 3389.5,
    gravitySurfaceMs2: 3.72,
    solarDistanceAu: 1.52,
    solarFluxMultiplier: 0.43,
    hasMagnetosphere: false,
    tliPayloadScale: 0.72,
    defaultOrbitId: 'orbit-mars-science-380',
    recommendedPowerTip: '43% Solar Flux — use Articulated Tracking Arrays or RTG.',
    accentColor: '#f97316'
  },
  venus: {
    id: 'venus',
    name: 'Venus',
    shortName: 'VENUS',
    category: 'planet',
    subtitle: 'Cloud-Shrouded Terrestrial Twin',
    description:
      'Thick sulfuric acid cloud decks hide volcanic plains underneath. High 191% solar flux boosts PV output, but requires SAR radar to see through clouds.',
    muKm3S2: 324858.59,
    radiusKm: 6051.8,
    gravitySurfaceMs2: 8.87,
    solarDistanceAu: 0.72,
    solarFluxMultiplier: 1.91,
    hasMagnetosphere: false,
    tliPayloadScale: 0.75,
    defaultOrbitId: 'orbit-venus-cloud-300',
    recommendedPowerTip: '191% Solar Flux — huge PV power, pair SAR Radar + Active Thermal.',
    accentColor: '#eab308'
  },
  moon: {
    id: 'moon',
    name: 'The Moon (Luna)',
    shortName: 'MOON',
    category: 'moon',
    subtitle: 'Artemis Cislunar Proving Ground',
    description:
      'Airless basaltic & highland moon with permanently shadowed polar craters holding ancient water-ice. No global magnetic field.',
    muKm3S2: MU_MOON,
    radiusKm: RADIUS_MOON,
    gravitySurfaceMs2: 1.62,
    solarDistanceAu: 1.0,
    solarFluxMultiplier: 1.0,
    hasMagnetosphere: false,
    tliPayloadScale: 1.0,
    defaultOrbitId: 'orbit-lunar-polar-100',
    recommendedPowerTip: 'Long 48m eclipses & no B-field — use Reaction Wheels + Heavy Battery or RTG.',
    accentColor: '#cbd5e1'
  },
  europa: {
    id: 'europa',
    name: 'Europa (Jupiter Moon)',
    shortName: 'EUROPA',
    category: 'moon',
    subtitle: 'Galilean Ocean World • Severe Jovian Radiation',
    description:
      'Subsurface global saltwater ocean locked beneath fractured water-ice crust at 5.2 AU. Extreme Jovian radiation demands Rad-Hard avionics and Mega-Solar or RTG power.',
    muKm3S2: 3202.74,
    radiusKm: 1560.8,
    gravitySurfaceMs2: 1.31,
    solarDistanceAu: 5.2,
    solarFluxMultiplier: 0.037,
    hasMagnetosphere: false,
    tliPayloadScale: 0.35,
    defaultOrbitId: 'orbit-europa-polar-200',
    recommendedPowerTip: 'Only 3.7% sunlight! Equip Multi-MMRTG, RTG, or Clipper Mega Arrays + Rad-Hard CPU.',
    accentColor: '#7dd3fc'
  },
  titan: {
    id: 'titan',
    name: 'Titan (Saturn Moon)',
    shortName: 'TITAN',
    category: 'moon',
    subtitle: 'Orange Methane Haze & Hydrocarbon Seas',
    description:
      'Dense nitrogen-methane atmosphere and liquid ethane seas at 9.5 AU. Sunlight falls to 1.1%, making nuclear RTG power virtually mandatory.',
    muKm3S2: 8978.14,
    radiusKm: 2574.7,
    gravitySurfaceMs2: 1.35,
    solarDistanceAu: 9.54,
    solarFluxMultiplier: 0.011,
    hasMagnetosphere: false,
    tliPayloadScale: 0.25,
    defaultOrbitId: 'orbit-titan-haze-1200',
    recommendedPowerTip: '1.1% Sunlight at 9.5 AU — solar fails; equip RTG or Multi-MMRTG + Heavy Booster.',
    accentColor: '#f59e0b'
  },
  asteroid: {
    id: 'asteroid',
    name: '16 Psyche (Asteroid)',
    shortName: 'PSYCHE',
    category: 'other',
    subtitle: 'Metallic Protoplanet Core • Asteroid Belt',
    description:
      'Exposed iron-nickel planetary core orbiting at 2.9 AU. Tiny microgravity (0.08 km/s orbital speed!) and weak 12% sunlight.',
    muKm3S2: 1.53,
    radiusKm: 111.0,
    gravitySurfaceMs2: 0.14,
    solarDistanceAu: 2.92,
    solarFluxMultiplier: 0.12,
    hasMagnetosphere: false,
    tliPayloadScale: 0.55,
    defaultOrbitId: 'orbit-psyche-metal-120',
    recommendedPowerTip: '12% Solar Flux — equip Clipper Mega Arrays or RTG + Magnetometer Boom.',
    accentColor: '#94a3b8'
  },
  lagrange: {
    id: 'lagrange',
    name: 'Sun-Earth L2',
    shortName: 'SUN-L2',
    category: 'other',
    subtitle: 'Deep Space Halo Saddle Point • 1.5M km',
    description:
      'Gravitational balance point behind Earth with uninterrupted 24/7 solar illumination, zero eclipses, and clear sky view for flagship telescopes.',
    muKm3S2: 0,
    radiusKm: RADIUS_EARTH,
    gravitySurfaceMs2: 0,
    solarDistanceAu: 1.01,
    solarFluxMultiplier: 1.0,
    hasMagnetosphere: false,
    tliPayloadScale: 1.0,
    defaultOrbitId: 'orbit-lagrange-l2',
    recommendedPowerTip: 'Zero Eclipses & 100% Sun — ideal for Star Trackers + Thermal Louvers.',
    accentColor: '#fbbf24'
  }
};

export const CELESTIAL_BODY_LIST: CelestialBodyMeta[] = Object.values(CELESTIAL_BODIES);

export function getCelestialBodyMeta(bodyId: CelestialBodyId = 'earth'): CelestialBodyMeta {
  return CELESTIAL_BODIES[bodyId] || CELESTIAL_BODIES.earth;
}

/**
 * Checks whether a power generator is isotope-based (immune to solar distance & eclipses).
 */
export function isNuclearRtgPower(powerGenId: string): boolean {
  return powerGenId === 'pwr-deepspace-rtg' || powerGenId === 'pwr-multi-rtg';
}

/**
 * Calculates orbital period in seconds.
 * T = 2 * PI * sqrt(a^3 / mu)
 */
export function calculateOrbitalPeriod(
  altitudeKm: number,
  centralBody: CelestialBodyId = 'earth'
): number {
  if (centralBody === 'lagrange') {
    return 180 * 86400;
  }
  const meta = getCelestialBodyMeta(centralBody);
  const semiMajorAxis = meta.radiusKm + altitudeKm;
  return 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / meta.muKm3S2);
}

/**
 * Calculates circular orbital speed in km/s.
 * v = sqrt(mu / r)
 */
export function calculateOrbitalSpeed(
  altitudeKm: number,
  centralBody: CelestialBodyId = 'earth'
): number {
  if (centralBody === 'lagrange') return 0.2;
  const meta = getCelestialBodyMeta(centralBody);
  return Math.sqrt(meta.muKm3S2 / (meta.radiusKm + altitudeKm));
}

/**
 * Estimates eclipse duration (planetary shadow) in minutes for circular orbit.
 * Simplified cylindrical shadow approximation.
 */
export function calculateEclipseMinutes(
  altitudeKm: number,
  centralBody: CelestialBodyId = 'earth'
): number {
  if (centralBody === 'lagrange') return 0;
  const meta = getCelestialBodyMeta(centralBody);
  const r = meta.radiusKm + altitudeKm;
  const periodSeconds = calculateOrbitalPeriod(altitudeKm, centralBody);

  const theta = Math.asin(Math.min(1.0, meta.radiusKm / r));
  const eclipseFraction = theta / Math.PI;
  return (periodSeconds * eclipseFraction) / 60;
}

/**
 * Calculates daily downlink data capacity in Gigabits.
 * Based on contact passes per day, pass duration, and transmitter data rate.
 */
export function calculateDailyDownlinkCapacityGb(
  downlinkRateMbps: number,
  contactsPerDay: number,
  passDurationMinutes: number
): number {
  const totalContactSecondsPerDay = contactsPerDay * (passDurationMinutes * 60);
  const totalMegabits = totalContactSecondsPerDay * downlinkRateMbps;
  return totalMegabits / 1000; // Gigabits
}
