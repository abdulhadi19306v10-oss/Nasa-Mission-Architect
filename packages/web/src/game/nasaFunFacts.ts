import { CelestialBodyId, RealMission } from '@sim/index';

export interface NasaMissionFunFactEntry {
  realMissionName: string;
  agencyYear: string;
  facts: [string, string];
}

const FUN_FACTS_BY_MISSION_ID: Record<string, NasaMissionFunFactEntry> = {
  'mission-1-first-orbit': {
    realMissionName: 'NASA GPM Core & Explorer SmallSat Heritage',
    agencyYear: 'NASA Goddard & JAXA • LEO 400 km',
    facts: [
      'Orbiting Earth every 92.5 minutes at ~27,600 km/h, a satellite in LEO witnesses 16 sunrises and 16 sunsets every single day—meaning solar panels blast from blazing sunlight into freezing shadow every ~45 minutes.',
      'Modern NASA small rockets like Rocket Lab Electron shrank atmospheric & weather monitors from bus-sized payloads down to compact ESPA SmallSats, letting Earth-watch missions launch in weeks instead of decades.'
    ]
  },
  'mission-2-climate-sentinel': {
    realMissionName: 'Landsat 9 & PACE Earth Observatories',
    agencyYear: 'NASA Goddard & USGS • Sun-Synchronous 705 km',
    facts: [
      'Landsat 9 flies in a tilted 98.2° Sun-Synchronous orbit that crosses every city and rainforest at almost the exact same ~10:00 AM local solar time on every repeat pass, keeping shadows identical for 50+ years of climate comparisons.',
      'From 705 km above Earth, Landsat 9’s thermal infrared sensor can spot a wildfire hot spot smaller than half a backyard swimming pool while mapping global deforestation and glacier retreat.'
    ]
  },
  'mission-5-geo-stormwatch': {
    realMissionName: 'GOES-19 (GOES-U) Geostationary Sentinel',
    agencyYear: 'NASA Goddard & NOAA • 35,786 km GEO',
    facts: [
      'Hovering 35,786 km above the equator matches Earth’s 24-hour spin so precisely that GOES weather satellites look frozen in one spot in the sky—allowing continuous non-stop hurricane tracking.',
      'Living inside Earth’s outer Van Allen radiation belt forces GEO satellites to use ultra-expensive radiation-hardened computers and giant batteries to survive 70-minute equinox eclipses without losing data.'
    ]
  },
  'mission-3-moon-scout': {
    realMissionName: 'Lunar Reconnaissance Orbiter (LRO)',
    agencyYear: 'NASA Goddard • Launched 2009 (Active)',
    facts: [
      'Inside deep craters at the Moon’s South Pole like Shackleton, sunlight has not reached the crater floor in over 2 billion years—making them colder than Pluto (-230 °C) and trapping the ancient water ice Artemis astronauts need.',
      'LRO’s laser altimeter and cameras mapped the Moon in such crisp 3D detail that NASA scientists literally spotted the Apollo Moon buggies, American flags, and astronaut footprints still sitting on the surface!'
    ]
  },
  'mission-6-venus-magellan': {
    realMissionName: 'NASA Magellan Venus Radar Mapper',
    agencyYear: 'NASA JPL • Deployed 1989 from Space Shuttle Atlantis',
    facts: [
      'Thick sulfuric acid clouds hide 100% of Venus’s ground from regular cameras, so Magellan fired Synthetic Aperture Radar pulses right through the clouds to map 98% of the planet’s giant volcanoes in 3D.',
      'At the end of its mission in 1993, Magellan pioneered "aerobraking"—deliberately dipping into Venus’s blistering upper atmosphere to circularize its orbit using air drag instead of scarce rocket fuel.'
    ]
  },
  'mission-7-mars-recon': {
    realMissionName: 'Mars Reconnaissance Orbiter (MRO)',
    agencyYear: 'NASA JPL • Launched 2005 (Still Operating)',
    facts: [
      'MRO’s 0.5-meter HiRISE telescope is so sharp that NASA engineers timed an orbit perfectly to photograph both the Curiosity and Perseverance rovers hanging from supersonic parachutes mid-landing!',
      'With sunlight at Mars falling to just 43% of Earth’s brightness, MRO uses twin 20 m² solar wings and has beamed home more science data than every other interplanetary NASA mission combined.'
    ]
  },
  'mission-4-cosmic-eye': {
    realMissionName: 'James Webb Space Telescope (JWST)',
    agencyYear: 'NASA Goddard / ESA / CSA • Sun-Earth L2 (1.5M km)',
    facts: [
      'Stationed 1.5 million km beyond Earth at Sun-Earth L2, JWST unfolds a 5-layer tennis-court-sized sunshield that drops temperatures from +110 °C on the sunny side down to -233 °C behind the shield.',
      'To photograph exoplanet atmospheres, JWST holds its aim as steady as pointing a laser from New York City onto a moving dime in Los Angeles without flinching.'
    ]
  },
  'mission-8-psyche-core': {
    realMissionName: 'NASA Psyche Asteroid Orbiter + DSOC Laser',
    agencyYear: 'NASA JPL • Launched 2023 (2.9 AU Belt)',
    facts: [
      'Asteroid 16 Psyche appears to be the exposed iron-nickel core of a shattered protoplanet—meaning NASA’s orbiter is studying frozen metallic craters and fossil magnetic fields from a baby world’s heart.',
      'Flying aboard Psyche, NASA’s DSOC optical laser transceiver set a deep-space record by streaming a 4K cat video ("Taters") back to Earth from ~31 million km away—80 times further than the Moon!'
    ]
  },
  'mission-9-europa-clipper': {
    realMissionName: 'NASA Europa Clipper Flagship',
    agencyYear: 'NASA JPL & Johns Hopkins APL • Launched 2024 (5.2 AU)',
    facts: [
      'At Jupiter, sunlight is only 3.7% as strong as at Earth—so Europa Clipper unfolds colossal basketball-court-sized 30-meter solar wings, making it the largest planetary spacecraft NASA has ever built.',
      'Jupiter’s belts flood Europa with millions of chest X-rays’ worth of radiation every day, forcing NASA to lock Clipper’s flight computer inside a thick titanium-aluminum "Radiation Vault."'
    ]
  },
  'mission-10-titan-cassini': {
    realMissionName: 'NASA Cassini–Huygens Saturn/Titan Explorer',
    agencyYear: 'NASA JPL / ESA / ASI • 1997–2017 (9.5 AU)',
    facts: [
      'Because sunlight at Saturn is a dim 1.1% of Earth’s brightness, solar panels would have to be ridiculously huge—so Cassini ran for 13 years off heat from three Plutonium-238 nuclear RTGs.',
      'Cassini’s radar pierced Titan’s orange methane smog and discovered Kraken Mare: an icy hydrocarbon sea larger than Earth’s Caspian Sea, complete with rainclouds, rivers, islands, and surface waves!'
    ]
  }
};

const FUN_FACTS_BY_ORBIT_ID: Record<string, NasaMissionFunFactEntry> = {
  'orbit-leo-400': FUN_FACTS_BY_MISSION_ID['mission-1-first-orbit'],
  'orbit-sso-700': FUN_FACTS_BY_MISSION_ID['mission-2-climate-sentinel'],
  'orbit-geo-35786': FUN_FACTS_BY_MISSION_ID['mission-5-geo-stormwatch'],
  'orbit-lunar-polar-100': FUN_FACTS_BY_MISSION_ID['mission-3-moon-scout'],
  'orbit-venus-cloud-300': FUN_FACTS_BY_MISSION_ID['mission-6-venus-magellan'],
  'orbit-mars-science-380': FUN_FACTS_BY_MISSION_ID['mission-7-mars-recon'],
  'orbit-lagrange-l2': FUN_FACTS_BY_MISSION_ID['mission-4-cosmic-eye'],
  'orbit-psyche-metal-120': FUN_FACTS_BY_MISSION_ID['mission-8-psyche-core'],
  'orbit-europa-polar-200': FUN_FACTS_BY_MISSION_ID['mission-9-europa-clipper'],
  'orbit-titan-haze-1200': FUN_FACTS_BY_MISSION_ID['mission-10-titan-cassini']
};

const FUN_FACTS_BY_BODY: Record<CelestialBodyId, NasaMissionFunFactEntry> = {
  earth: FUN_FACTS_BY_MISSION_ID['mission-2-climate-sentinel'],
  moon: FUN_FACTS_BY_MISSION_ID['mission-3-moon-scout'],
  venus: FUN_FACTS_BY_MISSION_ID['mission-6-venus-magellan'],
  mars: FUN_FACTS_BY_MISSION_ID['mission-7-mars-recon'],
  lagrange: FUN_FACTS_BY_MISSION_ID['mission-4-cosmic-eye'],
  asteroid: FUN_FACTS_BY_MISSION_ID['mission-8-psyche-core'],
  europa: FUN_FACTS_BY_MISSION_ID['mission-9-europa-clipper'],
  titan: FUN_FACTS_BY_MISSION_ID['mission-10-titan-cassini']
};

export function getNasaMissionFunFacts(params: {
  missionId?: string;
  orbitId?: string;
  centralBody: CelestialBodyId;
  matchedRealMission?: RealMission;
}): NasaMissionFunFactEntry {
  const { missionId, orbitId, centralBody, matchedRealMission } = params;
  if (missionId && FUN_FACTS_BY_MISSION_ID[missionId]) {
    return FUN_FACTS_BY_MISSION_ID[missionId];
  }
  if (orbitId && FUN_FACTS_BY_ORBIT_ID[orbitId]) {
    return FUN_FACTS_BY_ORBIT_ID[orbitId];
  }
  if (centralBody && FUN_FACTS_BY_BODY[centralBody]) {
    return FUN_FACTS_BY_BODY[centralBody];
  }
  if (matchedRealMission) {
    return {
      realMissionName: matchedRealMission.name,
      agencyYear: `${matchedRealMission.agency} • Launched ${matchedRealMission.launchYear}`,
      facts: [
        matchedRealMission.keyLesson,
        `NASA operated ${matchedRealMission.name} in ${matchedRealMission.orbit} using ${matchedRealMission.primaryInstruments.slice(0, 2).join(' and ')}.`
      ]
    };
  }
  return FUN_FACTS_BY_MISSION_ID['mission-1-first-orbit'];
}
