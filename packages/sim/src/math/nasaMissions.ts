import { CelestialBodyId, SpacecraftDesign } from '../types';

export interface NasaHardwareSpecItem {
  slot: 'PAYLOAD' | 'STRUCTURE' | 'POWER' | 'BATTERY' | 'ADCS' | 'COMMS' | 'AVIONICS' | 'THERMAL' | 'ROCKET';
  realNasaItem: string;
  purpose: string;
  simItemId: string;
}

export interface NasaWorldMissionProfile {
  bodyId: CelestialBodyId;
  satelliteName: string;
  shortCallsign: string;
  agencyAndYear: string;
  realOrbitSummary: string;
  realLaunchVehicle: string;
  realCostNote: string;
  missionSummary: string;
  hardwareItems: NasaHardwareSpecItem[];
  simPresetDesign: SpacecraftDesign;
}

export const NASA_WORLD_MISSIONS: Record<CelestialBodyId, NasaWorldMissionProfile> = {
  earth: {
    bodyId: 'earth',
    satelliteName: 'Landsat 9 (NASA / USGS)',
    shortCallsign: 'LANDSAT 9',
    agencyAndYear: 'NASA Goddard & USGS • Launched 2021',
    realOrbitSummary: 'Sun-Synchronous Polar Orbit (705 km, 98.2°)',
    realLaunchVehicle: 'ULA Atlas V 401 (Vandenberg SLC-3E)',
    realCostNote: '$880M real mission (Free-Flight Simulation: ∞ Budget)',
    missionSummary:
      'Monitors global forests, water use, glaciers, and coastal coral reefs every 16 days with radiometrically calibrated multispectral & thermal imaging.',
    hardwareItems: [
      {
        slot: 'PAYLOAD',
        realNasaItem: 'OLI-2 (9-Band Land Imager) + TIRS-2 (Thermal IR Sensor)',
        purpose: '15–100 m multispectral & thermal Earth surface mapping',
        simItemId: 'inst-multispectral + inst-hyperspectral'
      },
      {
        slot: 'STRUCTURE',
        realNasaItem: 'Northrop Grumman LEOStar-3 Hexagonal Bus',
        purpose: '3-axis stabilized carbon-composite modular platform',
        simItemId: 'bus-espa-smallsat'
      },
      {
        slot: 'POWER',
        realNasaItem: 'Single-Wing GaAs Articulated Solar Array (~3.8 kW)',
        purpose: 'Continuously slews toward sunlight across 98° polar passes',
        simItemId: 'pwr-articulated-tracking'
      },
      {
        slot: 'BATTERY',
        realNasaItem: 'ABS / Li-Ion Rechargeable Battery Pack',
        purpose: 'Sustains sensors through 32-minute nightside eclipses',
        simItemId: 'bat-medium-600wh'
      },
      {
        slot: 'ADCS',
        realNasaItem: 'Dual Star Trackers + 4 Reaction Wheels + IRU Gyro',
        purpose: 'Precision arcsecond nadir alignment for image registration',
        simItemId: 'adcs-star-tracker-precision'
      },
      {
        slot: 'COMMS',
        realNasaItem: 'X-Band Direct Science Transmitter + S-Band TT&C',
        purpose: 'Streams high-rate Earth imagery to USGS ground stations',
        simItemId: 'comm-kaband-dish'
      },
      {
        slot: 'AVIONICS',
        realNasaItem: 'RAD750 Flight Computer + 4 Tb Solid-State Recorder',
        purpose: 'Stores & manages global land imagery packets',
        simItemId: 'obc-radhard-fpga'
      },
      {
        slot: 'THERMAL',
        realNasaItem: 'Active Cryocooler + MLI Blankets + Thermal Louvers',
        purpose: 'Keeps TIRS-2 infrared focal plane cryogenically stable',
        simItemId: 'thm-active-heaters-louvers'
      }
    ],
    simPresetDesign: {
      name: 'Landsat-9-NASA',
      scenarioId: 'scenario-sandbox',
      orbitId: 'orbit-sso-700',
      launchVehicleId: 'lv-falcon9-dedicated',
      structureId: 'bus-espa-smallsat',
      powerGenId: 'pwr-articulated-tracking',
      energyStorageId: 'bat-medium-600wh',
      adcsId: 'adcs-star-tracker-precision',
      commsId: 'comm-kaband-dish',
      obcId: 'obc-radhard-fpga',
      thermalId: 'thm-active-heaters-louvers',
      instrumentIds: ['inst-multispectral', 'inst-hyperspectral']
    }
  },

  mars: {
    bodyId: 'mars',
    satelliteName: 'Mars Reconnaissance Orbiter (MRO)',
    shortCallsign: 'MRO',
    agencyAndYear: 'NASA JPL • Launched 2005 (Operational)',
    realOrbitSummary: 'Mars Near-Polar Orbit (255 × 320 km, 92.6°)',
    realLaunchVehicle: 'ULA Atlas V 401 (Cape Canaveral)',
    realCostNote: '$720M real mission (Free-Flight Simulation: ∞ Budget)',
    missionSummary:
      'NASA’s sharpest eye at Mars—surveys landing sites, tracks dust storms, maps ancient water minerals, and relays data for Curiosity & Perseverance.',
    hardwareItems: [
      {
        slot: 'PAYLOAD',
        realNasaItem: 'HiRISE 0.5m Telescope + CRISM Spectrometer + MCS Radiometer',
        purpose: 'Sub-meter surface geology, clay minerals & climate profiles',
        simItemId: 'inst-multispectral + inst-hyperspectral + inst-radiometer'
      },
      {
        slot: 'STRUCTURE',
        realNasaItem: 'Lockheed Graphite-Epoxy & Titanium Honeycomb Bus',
        purpose: 'High-strength deep-space orbiter frame surviving aerobraking',
        simItemId: 'bus-flagship-hex'
      },
      {
        slot: 'POWER',
        realNasaItem: 'Twin 20 m² Independent Articulated Solar Wings',
        purpose: 'Compensates for 43% Martian sunlight (1.52 AU inverse-square)',
        simItemId: 'pwr-mega-outer-solar'
      },
      {
        slot: 'BATTERY',
        realNasaItem: 'Dual 50 Ah Nickel-Hydrogen Battery Banks',
        purpose: 'Powers instruments across 42-minute Martian eclipses',
        simItemId: 'bat-heavy-1800wh'
      },
      {
        slot: 'ADCS',
        realNasaItem: '4 Reaction Wheels + Dual Star Trackers + Inertial Unit',
        purpose: 'Precision target slewing over Jezero Crater & Valles Marineris',
        simItemId: 'adcs-star-tracker-precision'
      },
      {
        slot: 'COMMS',
        realNasaItem: '3.0 m Ka/X-Band High-Gain Dish + Electra UHF Relay',
        purpose: 'High-rate Deep Space Network uplink/downlink back to Earth',
        simItemId: 'comm-kaband-dish'
      },
      {
        slot: 'AVIONICS',
        realNasaItem: 'BAE RAD750 Rad-Hard Computer + 160 Gb SSR',
        purpose: 'Processes huge HiRISE mosaics autonomously',
        simItemId: 'obc-radhard-fpga'
      },
      {
        slot: 'THERMAL',
        realNasaItem: 'Survival Heaters + Reflective MLI + Louver Panels',
        purpose: 'Prevents propulsion & focal-plane freezing in cold Mars orbit',
        simItemId: 'thm-active-heaters-louvers'
      }
    ],
    simPresetDesign: {
      name: 'MRO-Mars-NASA',
      scenarioId: 'scenario-sandbox',
      orbitId: 'orbit-mars-science-380',
      launchVehicleId: 'lv-vulcan-centaur',
      structureId: 'bus-flagship-hex',
      powerGenId: 'pwr-mega-outer-solar',
      energyStorageId: 'bat-heavy-1800wh',
      adcsId: 'adcs-star-tracker-precision',
      commsId: 'comm-kaband-dish',
      obcId: 'obc-radhard-fpga',
      thermalId: 'thm-active-heaters-louvers',
      instrumentIds: ['inst-multispectral', 'inst-hyperspectral', 'inst-radiometer']
    }
  },

  venus: {
    bodyId: 'venus',
    satelliteName: 'Magellan Venus Radar Mapper (VERITAS Heritage)',
    shortCallsign: 'MAGELLAN',
    agencyAndYear: 'NASA JPL • Deployed 1989 (STS-30 Atlantis)',
    realOrbitSummary: 'Venus Cloud-Top Polar Mapping Orbit (~300 km, 85.5°)',
    realLaunchVehicle: 'Space Shuttle Atlantis + Inertial Upper Stage',
    realCostNote: '$680M real mission (Free-Flight Simulation: ∞ Budget)',
    missionSummary:
      'Mapped 98% of Venus’s hidden volcanic plains beneath thick sulfuric acid cloud decks using synthetic aperture radar & microwave altimetry.',
    hardwareItems: [
      {
        slot: 'PAYLOAD',
        realNasaItem: 'S-Band Synthetic Aperture Radar (SAR) + Microwave Radiometer',
        purpose: 'Penetrates opaque CO2/sulfuric clouds to image lava domes & faults',
        simItemId: 'inst-sar-radar + inst-radiometer'
      },
      {
        slot: 'STRUCTURE',
        realNasaItem: 'Voyager/Galileo-Heritage Octagonal Aluminum Bus',
        purpose: 'Rigid chassis supporting large 3.7 m SAR/comms dish',
        simItemId: 'bus-flagship-hex'
      },
      {
        slot: 'POWER',
        realNasaItem: 'Dual Sun-Tracking Solar Panels (0.72 AU Inner Solar System)',
        purpose: 'Harvests 191% Earth solar intensity to drive high-wattage SAR',
        simItemId: 'pwr-articulated-tracking'
      },
      {
        slot: 'BATTERY',
        realNasaItem: 'Dual 26.5 Ah NiCd Deep-Cycle Battery Modules',
        purpose: 'Sustains radar & heaters through 37-minute Venusian eclipses',
        simItemId: 'bat-heavy-1800wh'
      },
      {
        slot: 'ADCS',
        realNasaItem: '3-Axis Reaction Wheels + Star Scanners (Zero Planetary B-Field)',
        purpose: 'Rotates spacecraft between radar mapping passes & Earth downlink',
        simItemId: 'adcs-reaction-wheels'
      },
      {
        slot: 'COMMS',
        realNasaItem: '3.7 m High-Gain Dish (Dual X/S-Band SAR & DSN)',
        purpose: 'Sends high-volume radar backscatter sweeps to DSN Goldstone',
        simItemId: 'comm-kaband-dish'
      },
      {
        slot: 'AVIONICS',
        realNasaItem: 'Dual Redundant Flight Computers + Digital Tape Recorders',
        purpose: 'Buffers radar strips during limb occultations',
        simItemId: 'obc-radhard-fpga'
      },
      {
        slot: 'THERMAL',
        realNasaItem: 'Active Louver Arrays + White/Gold Thermal Control Blankets',
        purpose: 'Rejects intense 191% sunlight & Venusian cloud-top infrared heat',
        simItemId: 'thm-active-heaters-louvers'
      }
    ],
    simPresetDesign: {
      name: 'Magellan-Venus',
      scenarioId: 'scenario-sandbox',
      orbitId: 'orbit-venus-cloud-300',
      launchVehicleId: 'lv-vulcan-centaur',
      structureId: 'bus-flagship-hex',
      powerGenId: 'pwr-articulated-tracking',
      energyStorageId: 'bat-heavy-1800wh',
      adcsId: 'adcs-reaction-wheels',
      commsId: 'comm-kaband-dish',
      obcId: 'obc-radhard-fpga',
      thermalId: 'thm-active-heaters-louvers',
      instrumentIds: ['inst-sar-radar', 'inst-radiometer']
    }
  },

  moon: {
    bodyId: 'moon',
    satelliteName: 'Lunar Reconnaissance Orbiter (LRO)',
    shortCallsign: 'LRO',
    agencyAndYear: 'NASA Goddard • Launched 2009 (Active)',
    realOrbitSummary: 'Low Lunar Polar Orbit (50–100 km, 90°)',
    realLaunchVehicle: 'ULA Atlas V 401 (Centaur Cislunar Injection)',
    realCostNote: '$504M real mission (Free-Flight Simulation: ∞ Budget)',
    missionSummary:
      'Prospects permanently shadowed lunar South Pole craters for Artemis water-ice reserves and builds sub-meter 3D topographic landing maps.',
    hardwareItems: [
      {
        slot: 'PAYLOAD',
        realNasaItem: 'LOLA (Pulsed Laser Altimeter) + LEND (Neutron) + LROC Cameras',
        purpose: 'Maps 3D polar crater walls & detects buried hydrogen/water ice',
        simItemId: 'inst-lunar-lidar + inst-neutron-spectrometer + inst-multispectral'
      },
      {
        slot: 'STRUCTURE',
        realNasaItem: 'Aluminum Honeycomb Octagonal Spacecraft Frame',
        purpose: 'Supports nadir-pointing LIDAR optical bench over rough poles',
        simItemId: 'bus-espa-smallsat'
      },
      {
        slot: 'POWER',
        realNasaItem: '2-Axis Articulated Solar Array Wing (685 W)',
        purpose: 'Maintains peak output over steep 90° polar lighting angles',
        simItemId: 'pwr-articulated-tracking'
      },
      {
        slot: 'BATTERY',
        realNasaItem: '80 Ah High-Capacity Li-Ion Battery Bank',
        purpose: 'Bridges 48-minute lunar eclipses without brownouts',
        simItemId: 'bat-heavy-1800wh'
      },
      {
        slot: 'ADCS',
        realNasaItem: 'Miniature IMU + Star Trackers + 4 Reaction Wheels (No Mag Field)',
        purpose: 'Counteracts lunar mass-concentration (mascon) gravity bumps',
        simItemId: 'adcs-star-tracker-precision'
      },
      {
        slot: 'COMMS',
        realNasaItem: 'Gimbaled Ka-Band High-Gain Dish (100 Mbps White Sands Link)',
        purpose: 'Streams high-density LROC & LOLA lidar terrain cubes home',
        simItemId: 'comm-kaband-dish'
      },
      {
        slot: 'AVIONICS',
        realNasaItem: 'RAD750 Cislunar Flight Computer',
        purpose: 'Resilient to solar flares outside Earth’s magnetosphere',
        simItemId: 'obc-radhard-fpga'
      },
      {
        slot: 'THERMAL',
        realNasaItem: 'Active Survival Heaters + Louvers + MLI',
        purpose: 'Survives +/- 150 °C temperature swings over sunlit vs dark poles',
        simItemId: 'thm-active-heaters-louvers'
      }
    ],
    simPresetDesign: {
      name: 'LRO-Artemis-NASA',
      scenarioId: 'scenario-sandbox',
      orbitId: 'orbit-lunar-polar-100',
      launchVehicleId: 'lv-falcon9-dedicated',
      structureId: 'bus-espa-smallsat',
      powerGenId: 'pwr-articulated-tracking',
      energyStorageId: 'bat-heavy-1800wh',
      adcsId: 'adcs-star-tracker-precision',
      commsId: 'comm-kaband-dish',
      obcId: 'obc-radhard-fpga',
      thermalId: 'thm-active-heaters-louvers',
      instrumentIds: ['inst-lunar-lidar', 'inst-neutron-spectrometer', 'inst-multispectral']
    }
  },

  europa: {
    bodyId: 'europa',
    satelliteName: 'Europa Clipper (NASA Flagship)',
    shortCallsign: 'CLIPPER',
    agencyAndYear: 'NASA JPL & Johns Hopkins APL • Launched Oct 2024',
    realOrbitSummary: 'Jovian / Europa Science Sweeps (200 km belt environment)',
    realLaunchVehicle: 'SpaceX Falcon Heavy (5.2 AU Direct Transfer)',
    realCostNote: '$5.2B flagship mission (Free-Flight Simulation: ∞ Budget)',
    missionSummary:
      'Investigates whether Jupiter’s icy moon Europa harbors a habitable global saltwater ocean beneath its fractured ice shell despite brutal Jovian radiation.',
    hardwareItems: [
      {
        slot: 'PAYLOAD',
        realNasaItem: 'ECM Boom Magnetometer + EIS Optical Imager (+ REASON Radar)',
        purpose: 'Measures Jupiter-induced magnetic ocean currents & ice plumes',
        simItemId: 'inst-magnetometer-boom + inst-multispectral'
      },
      {
        slot: 'STRUCTURE',
        realNasaItem: 'Titanium-Aluminum Radiation-Shielded Electronics Vault Bus',
        purpose: 'Shields core avionics from Jupiter’s extreme synchrotron belts',
        simItemId: 'bus-flagship-hex'
      },
      {
        slot: 'POWER',
        realNasaItem: 'Giant Dual 5-Panel Outer-Solar Wings (102 m² Span, 3.6 kW+ @ 1 AU)',
        purpose: 'Captures weak 3.7% sunlight at 5.2 AU (~133 W sim baseline)',
        simItemId: 'pwr-mega-outer-solar'
      },
      {
        slot: 'BATTERY',
        realNasaItem: 'Heavy Deep-Cycle Jovian Eclipse Battery Bank',
        purpose: 'Carries science sweeps through Jupiter/Europa occultations',
        simItemId: 'bat-heavy-1800wh'
      },
      {
        slot: 'ADCS',
        realNasaItem: '4 Reaction Wheels + Star Trackers (Boom Isolation)',
        purpose: 'Stabilizes giant 30-meter solar wings & science cameras',
        simItemId: 'adcs-reaction-wheels'
      },
      {
        slot: 'COMMS',
        realNasaItem: '3.0 m High-Gain Dish (X/Ka-Band Deep Space Network)',
        purpose: 'Transmits icy-shell data across 780 million km to Earth',
        simItemId: 'comm-xband-horn'
      },
      {
        slot: 'AVIONICS',
        realNasaItem: 'Rad-Hard Vault Flight Computer (Dual String)',
        purpose: 'Withstands Jovian Single Event Upsets (SEUs)',
        simItemId: 'obc-radhard-fpga'
      },
      {
        slot: 'THERMAL',
        realNasaItem: 'Vault Thermal Heat Redistribution & MLI Insulation',
        purpose: 'Conserves electronics waste heat in 5.2 AU deep-space cold',
        simItemId: 'thm-passive-mli'
      }
    ],
    simPresetDesign: {
      name: 'Europa-Clipper',
      scenarioId: 'scenario-sandbox',
      orbitId: 'orbit-europa-polar-200',
      launchVehicleId: 'lv-nasa-sls',
      structureId: 'bus-flagship-hex',
      powerGenId: 'pwr-mega-outer-solar',
      energyStorageId: 'bat-heavy-1800wh',
      adcsId: 'adcs-reaction-wheels',
      commsId: 'comm-xband-horn',
      obcId: 'obc-radhard-fpga',
      thermalId: 'thm-passive-mli',
      instrumentIds: ['inst-magnetometer-boom', 'inst-multispectral']
    }
  },

  titan: {
    bodyId: 'titan',
    satelliteName: 'Cassini–Huygens Saturn/Titan Orbiter',
    shortCallsign: 'CASSINI',
    agencyAndYear: 'NASA JPL / ESA / ASI • Launched 1997 (13-Yr Tour)',
    realOrbitSummary: 'Titan Methane-Sea Mapping Orbit (1,200 km)',
    realLaunchVehicle: 'Titan IVB / Centaur Heavy Booster',
    realCostNote: '$3.9B real mission (Free-Flight Simulation: ∞ Budget)',
    missionSummary:
      'Used Ku-band synthetic aperture radar and plutonium nuclear batteries to peer through Titan’s thick orange smog and discover liquid hydrocarbon seas.',
    hardwareItems: [
      {
        slot: 'PAYLOAD',
        realNasaItem: 'Cassini RADAR (Ku-Band SAR) + Dual Boom Magnetometer (MAG)',
        purpose: 'Penetrates nitrogen-methane haze to image Kraken Mare seas',
        simItemId: 'inst-sar-radar + inst-magnetometer-boom'
      },
      {
        slot: 'STRUCTURE',
        realNasaItem: 'Heavy 2.5-Ton Cylindrical/Hex Flagship Saturn Probe Bus',
        purpose: 'Houses high-power radar electronics, RTGs & propellant tanks',
        simItemId: 'bus-flagship-hex'
      },
      {
        slot: 'POWER',
        realNasaItem: 'Pu-238 Nuclear RTG Cluster (3x GPHS-RTG / Quad-MMRTG Heritage)',
        purpose: 'Solar is only 1.1% at 9.5 AU—Plutonium decay gives 650W 24/7',
        simItemId: 'pwr-multi-rtg'
      },
      {
        slot: 'BATTERY',
        realNasaItem: 'Peak-Load Deep-Cycle Bus Power Storage',
        purpose: 'Smooths high-power SAR radar pulses during lake flybys',
        simItemId: 'bat-heavy-1800wh'
      },
      {
        slot: 'ADCS',
        realNasaItem: '3-Axis Reaction Wheels + Stellar Reference Unit',
        purpose: 'Steers whole spacecraft to sweep SAR radar beams across lakes',
        simItemId: 'adcs-reaction-wheels'
      },
      {
        slot: 'COMMS',
        realNasaItem: '4.0 m High-Gain Dish (X/Ka-Band DSN 70 m Goldstone Link)',
        purpose: 'Crosses 1.4 billion km across outer Solar System',
        simItemId: 'comm-kaband-dish'
      },
      {
        slot: 'AVIONICS',
        realNasaItem: 'Rad-Hard Dual Attitude/Command Computers + SSR',
        purpose: 'Autonomous fault protection across 80-minute one-way light time',
        simItemId: 'obc-radhard-fpga'
      },
      {
        slot: 'THERMAL',
        realNasaItem: 'Active Louvers + 117 Radioisotope Heater Units (RHUs)',
        purpose: 'Keeps optics & propulsion warm in -180 °C Saturn space',
        simItemId: 'thm-active-heaters-louvers'
      }
    ],
    simPresetDesign: {
      name: 'Cassini-Titan',
      scenarioId: 'scenario-sandbox',
      orbitId: 'orbit-titan-haze-1200',
      launchVehicleId: 'lv-nasa-sls',
      structureId: 'bus-flagship-hex',
      powerGenId: 'pwr-multi-rtg',
      energyStorageId: 'bat-heavy-1800wh',
      adcsId: 'adcs-reaction-wheels',
      commsId: 'comm-kaband-dish',
      obcId: 'obc-radhard-fpga',
      thermalId: 'thm-active-heaters-louvers',
      instrumentIds: ['inst-sar-radar', 'inst-magnetometer-boom']
    }
  },

  asteroid: {
    bodyId: 'asteroid',
    satelliteName: 'Psyche Metallic Core Orbiter',
    shortCallsign: 'PSYCHE',
    agencyAndYear: 'NASA JPL & Arizona State • Launched Oct 2023',
    realOrbitSummary: '16 Psyche Metallic Asteroid Polar Orbit (120 km)',
    realLaunchVehicle: 'SpaceX Falcon Heavy (KSC LC-39A)',
    realCostNote: '$1.2B Discovery mission (Free-Flight Simulation: ∞ Budget)',
    missionSummary:
      'Rendezvous with exposed iron-nickel protoplanet core 16 Psyche at 2.9 AU while pioneering NASA’s Deep Space Optical Laser Communications (DSOC).',
    hardwareItems: [
      {
        slot: 'PAYLOAD',
        realNasaItem: 'Dual Boom Magnetometers + Multispectral Imager + GRNS Neutron',
        purpose: 'Detects fossil core magnetic fields, metal-silicate mix & craters',
        simItemId: 'inst-magnetometer-boom + inst-multispectral + inst-neutron-spectrometer'
      },
      {
        slot: 'STRUCTURE',
        realNasaItem: 'Maxar 1300 Solar-Electric Deep Space Chassis',
        purpose: 'Lightweight high-strength frame supporting Hall thrusters',
        simItemId: 'bus-flagship-hex'
      },
      {
        slot: 'POWER',
        realNasaItem: 'Twin 5-Panel Cross-Shaped Mega Solar Arrays (75 m²)',
        purpose: 'Captures 12% asteroid-belt sunlight to power spacecraft + laser',
        simItemId: 'pwr-mega-outer-solar'
      },
      {
        slot: 'BATTERY',
        realNasaItem: 'High-Capacity Deep-Cycle Li-Ion Battery Pack',
        purpose: 'Runs science & laser terminals through asteroid shadow passes',
        simItemId: 'bat-heavy-1800wh'
      },
      {
        slot: 'ADCS',
        realNasaItem: 'Star Trackers + Reaction Wheels (±0.002° DSOC Laser Pointing)',
        purpose: 'Holds sub-arcsecond lock so laser beam hits Earth optical receiver',
        simItemId: 'adcs-star-tracker-precision'
      },
      {
        slot: 'COMMS',
        realNasaItem: 'DSOC Deep Space Optical Laser Transceiver + 2m X-Band Dish',
        purpose: 'Pioneering 1 Gbps infrared laser comms from Main Asteroid Belt',
        simItemId: 'comm-optical-laser'
      },
      {
        slot: 'AVIONICS',
        realNasaItem: 'Rad-Hard Flight Computer & Optical Flight Electronics',
        purpose: 'Endures unshielded cosmic rays across 2.9 AU cruise',
        simItemId: 'obc-radhard-fpga'
      },
      {
        slot: 'THERMAL',
        realNasaItem: 'Active Louvers + Heaters + High-Emissivity Radiators',
        purpose: 'Balances laser amplifier heat rejection & cold belt shadows',
        simItemId: 'thm-active-heaters-louvers'
      }
    ],
    simPresetDesign: {
      name: 'Psyche-DSOC-NASA',
      scenarioId: 'scenario-sandbox',
      orbitId: 'orbit-psyche-metal-120',
      launchVehicleId: 'lv-vulcan-centaur',
      structureId: 'bus-flagship-hex',
      powerGenId: 'pwr-mega-outer-solar',
      energyStorageId: 'bat-heavy-1800wh',
      adcsId: 'adcs-star-tracker-precision',
      commsId: 'comm-optical-laser',
      obcId: 'obc-radhard-fpga',
      thermalId: 'thm-active-heaters-louvers',
      instrumentIds: [
        'inst-magnetometer-boom',
        'inst-multispectral',
        'inst-neutron-spectrometer'
      ]
    }
  },

  lagrange: {
    bodyId: 'lagrange',
    satelliteName: 'James Webb Space Telescope (JWST)',
    shortCallsign: 'JWST',
    agencyAndYear: 'NASA Goddard / ESA / CSA • Launched Dec 2021',
    realOrbitSummary: 'Sun-Earth L2 Halo Orbit (1.5 Million km)',
    realLaunchVehicle: 'Ariane 5 ECA (Direct L2 Transfer)',
    realCostNote: '$10.0B flagship observatory (Free-Flight Simulation: ∞ Budget)',
    missionSummary:
      'Operates in perpetual L2 sunlight behind a tennis-court sunshield to image first galaxies & probe habitable exoplanet atmospheres with milliarcsecond stability.',
    hardwareItems: [
      {
        slot: 'PAYLOAD',
        realNasaItem: '6.5 m Gold Beryllium Primary Mirror + NIRCam / NIRSpec / MIRI',
        purpose: 'Cryogenic infrared spectroscopy of early galaxies & exoplanets',
        simItemId: 'inst-space-telescope'
      },
      {
        slot: 'STRUCTURE',
        realNasaItem: 'Cryogenic Carbon-Composite Optical Bench + 5-Layer Sunshield',
        purpose: 'Isolates cold 40 K telescope optics from warm spacecraft bus',
        simItemId: 'bus-flagship-hex'
      },
      {
        slot: 'POWER',
        realNasaItem: 'Articulated Sun-Side 2 kW GaAs Solar Array Wing',
        purpose: 'Continuous 100% L2 sunlight with zero planetary eclipses',
        simItemId: 'pwr-articulated-tracking'
      },
      {
        slot: 'BATTERY',
        realNasaItem: 'High-Reliability Li-Ion Conditioning Battery',
        purpose: 'Stabilizes peak reaction-wheel slew & transmitter power',
        simItemId: 'bat-medium-600wh'
      },
      {
        slot: 'ADCS',
        realNasaItem: 'Fine Guidance Sensor + Dual Star Trackers + Micro-Wheels',
        purpose: 'Locks onto distant stars within 0.002° / milliarcsecond jitter',
        simItemId: 'adcs-star-tracker-precision'
      },
      {
        slot: 'COMMS',
        realNasaItem: 'Ka-Band Gimbaled High-Gain Dish (DSN 28 Mbps Daily Dump)',
        purpose: 'Downloads 57+ GB of deep-field science images every day',
        simItemId: 'comm-kaband-dish'
      },
      {
        slot: 'AVIONICS',
        realNasaItem: 'RAD750 Command & Data Handling + 68 GB SSR',
        purpose: 'Cosmic-ray tolerant observatory sequencer at 1.5M km',
        simItemId: 'obc-radhard-fpga'
      },
      {
        slot: 'THERMAL',
        realNasaItem: 'Pulse-Tube Cryocooler + Sunshield & Thermal Louvers',
        purpose: 'Holds MIRI detector at 6.7 K while bus stays at room temperature',
        simItemId: 'thm-active-heaters-louvers'
      }
    ],
    simPresetDesign: {
      name: 'JWST-L2-NASA',
      scenarioId: 'scenario-sandbox',
      orbitId: 'orbit-lagrange-l2',
      launchVehicleId: 'lv-vulcan-centaur',
      structureId: 'bus-flagship-hex',
      powerGenId: 'pwr-articulated-tracking',
      energyStorageId: 'bat-medium-600wh',
      adcsId: 'adcs-star-tracker-precision',
      commsId: 'comm-kaband-dish',
      obcId: 'obc-radhard-fpga',
      thermalId: 'thm-active-heaters-louvers',
      instrumentIds: ['inst-space-telescope']
    }
  }
};

export const NASA_WORLD_MISSION_LIST: NasaWorldMissionProfile[] = Object.values(NASA_WORLD_MISSIONS);

const EARTH_ORBIT_OVERRIDES: Partial<Record<string, Partial<NasaWorldMissionProfile>>> = {
  'orbit-leo-400': {
    satelliteName: 'GPM Core Observatory (NASA / JAXA)',
    shortCallsign: 'GPM CORE',
    agencyAndYear: 'NASA Goddard & JAXA • Launched 2014',
    realOrbitSummary: 'Low-Inclination Tropical Orbit (407 km, 65°)',
    realLaunchVehicle: 'H-IIA 202 (Tanegashima Space Center)',
    missionSummary:
      'Circles mid-latitudes every 92.5 minutes with microwave radiometers & precipitation radar to measure global rainfall and hurricane structures.'
  },
  'orbit-geo-35786': {
    satelliteName: 'GOES-19 / GOES-U Weather Sentinel (NASA / NOAA)',
    shortCallsign: 'GOES-19',
    agencyAndYear: 'NASA Goddard & NOAA • Launched 2024',
    realOrbitSummary: 'Geostationary Orbit (35,786 km, 0.0°)',
    realLaunchVehicle: 'SpaceX Falcon Heavy (KSC LC-39A)',
    missionSummary:
      'Hovers fixed above Earth’s western hemisphere inside the outer radiation belt to monitor solar storms, hurricanes, and continuous weather.'
  }
};

/**
 * Returns the authentic NASA flagship mission & hardware inventory for a given body/orbit.
 */
export function getNasaMissionProfile(
  bodyId: CelestialBodyId = 'earth',
  orbitId?: string
): NasaWorldMissionProfile {
  const base = NASA_WORLD_MISSIONS[bodyId] || NASA_WORLD_MISSIONS.earth;
  const override = orbitId ? EARTH_ORBIT_OVERRIDES[orbitId] : undefined;
  const merged = override ? { ...base, ...override } : base;

  if (!orbitId || merged.simPresetDesign.orbitId === orbitId) {
    return merged;
  }

  return {
    ...merged,
    simPresetDesign: {
      ...merged.simPresetDesign,
      orbitId
    }
  };
}
