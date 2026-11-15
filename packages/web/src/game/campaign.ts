import { SpacecraftDesign } from '@sim/index';

export interface CampaignMission {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  difficulty: 'TUTORIAL' | 'INTERMEDIATE' | 'ADVANCED' | 'FLAGSHIP';
  badge: string;
  starmapX: number;
  starmapY: number;
  starmapCode: string;
  starmapColor: string;
  briefing: string;
  scenarioId: string;
  targetOrbitId: string;
  budgetLimitM: number;
  targetSciencePoints: number;
  unlockedParts: string[];
  rewardStars: number;
  primaryGoals: string[];
  starterDesign: SpacecraftDesign;
  blueprintDesign: SpacecraftDesign;
}

export const CAMPAIGN_MISSIONS: CampaignMission[] = [
  {
    id: 'mission-1-first-orbit',
    number: 1,
    title: 'Project Beacon: First Light',
    subtitle: 'Orbital Insertion & Telemetry Verification',
    difficulty: 'TUTORIAL',
    badge: 'ORBIT_INITIATE',
    starmapX: 9,
    starmapY: 75,
    starmapCode: 'LEO-400',
    starmapColor: '#10b981',
    briefing:
      'Welcome to NASA Flight Systems. Your first assignment: assemble a lightweight atmospheric SmallSat, fly the coastal ascent corridor on Rocket Lab Electron into LEO 400 km, and stream science packets to ground stations.',
    scenarioId: 'scenario-earth-watch',
    targetOrbitId: 'orbit-leo-400',
    budgetLimitM: 65.0,
    targetSciencePoints: 650,
    unlockedParts: [
      'bus-espa-smallsat',
      'pwr-deployable-fixed',
      'bat-medium-600wh',
      'adcs-reaction-wheels',
      'comm-xband-horn',
      'inst-radiometer',
      'lv-electron'
    ],
    rewardStars: 3,
    primaryGoals: [
      'Keep spacecraft mass under 180 kg for Rocket Lab Electron',
      'Fly through the 3D ascent gates and achieve LEO 400 km',
      'Collect 650+ Science XP in orbit while preserving battery margin'
    ],
    starterDesign: {
      name: 'Beacon-1',
      scenarioId: 'scenario-earth-watch',
      orbitId: 'orbit-leo-400',
      launchVehicleId: 'lv-electron',
      structureId: 'bus-espa-smallsat',
      powerGenId: 'pwr-deployable-fixed',
      energyStorageId: 'bat-medium-600wh',
      adcsId: 'adcs-reaction-wheels',
      commsId: 'comm-xband-horn',
      obcId: 'obc-standard-radtol',
      thermalId: 'thm-passive-mli',
      instrumentIds: ['inst-radiometer']
    },
    blueprintDesign: {
      name: 'Beacon-1 Pro',
      scenarioId: 'scenario-earth-watch',
      orbitId: 'orbit-leo-400',
      launchVehicleId: 'lv-falcon9-rideshare',
      structureId: 'bus-espa-smallsat',
      powerGenId: 'pwr-deployable-fixed',
      energyStorageId: 'bat-medium-600wh',
      adcsId: 'adcs-reaction-wheels',
      commsId: 'comm-xband-horn',
      obcId: 'obc-standard-radtol',
      thermalId: 'thm-passive-mli',
      instrumentIds: ['inst-multispectral', 'inst-radiometer']
    }
  },
  {
    id: 'mission-2-climate-sentinel',
    number: 2,
    title: 'Climate Sentinel: Earth Watch',
    subtitle: 'Wildfire & Ocean Ecology Monitoring',
    difficulty: 'INTERMEDIATE',
    badge: 'EARTH_GUARDIAN',
    starmapX: 18,
    starmapY: 42,
    starmapCode: 'SSO-700',
    starmapColor: '#38bdf8',
    briefing:
      'Global climate monitoring programs require high-resolution optical and atmospheric data. Construct an Earth-observing satellite in Sun-Synchronous Orbit (SSO 700 km) to scan active wildfire anomalies and stream gigabits to polar ground stations.',
    scenarioId: 'scenario-earth-watch',
    targetOrbitId: 'orbit-sso-700',
    budgetLimitM: 120.0,
    targetSciencePoints: 950,
    unlockedParts: [
      'bus-espa-smallsat',
      'pwr-deployable-fixed',
      'pwr-articulated-tracking',
      'bat-medium-600wh',
      'adcs-reaction-wheels',
      'adcs-star-tracker-precision',
      'comm-xband-horn',
      'comm-kaband-dish',
      'obc-edge-ai-payload',
      'inst-multispectral',
      'inst-hyperspectral',
      'lv-falcon9-rideshare'
    ],
    rewardStars: 3,
    primaryGoals: [
      'Equip Multispectral or Hyperspectral sensor within $120M cap',
      'Steer through the Polar SSO Slalom rings to SSO 700 km',
      'Chain orbital observation combos and downlink 950+ Science XP'
    ],
    starterDesign: {
      name: 'Sentinel-2',
      scenarioId: 'scenario-earth-watch',
      orbitId: 'orbit-sso-700',
      launchVehicleId: 'lv-falcon9-rideshare',
      structureId: 'bus-espa-smallsat',
      powerGenId: 'pwr-deployable-fixed',
      energyStorageId: 'bat-medium-600wh',
      adcsId: 'adcs-reaction-wheels',
      commsId: 'comm-xband-horn',
      obcId: 'obc-standard-radtol',
      thermalId: 'thm-passive-mli',
      instrumentIds: ['inst-multispectral']
    },
    blueprintDesign: {
      name: 'Sentinel-2 Hyper',
      scenarioId: 'scenario-earth-watch',
      orbitId: 'orbit-sso-700',
      launchVehicleId: 'lv-falcon9-rideshare',
      structureId: 'bus-espa-smallsat',
      powerGenId: 'pwr-articulated-tracking',
      energyStorageId: 'bat-medium-600wh',
      adcsId: 'adcs-star-tracker-precision',
      commsId: 'comm-kaband-dish',
      obcId: 'obc-edge-ai-payload',
      thermalId: 'thm-passive-mli',
      instrumentIds: ['inst-multispectral', 'inst-hyperspectral']
    }
  },
  {
    id: 'mission-5-geo-stormwatch',
    number: 3,
    title: 'StormWatch GEO: Hurricane Eye',
    subtitle: 'Continuous Geostationary Weather Observatory',
    difficulty: 'INTERMEDIATE',
    badge: 'GEO_SENTINEL',
    starmapX: 27,
    starmapY: 73,
    starmapCode: 'GEO-35K',
    starmapColor: '#0ea5e9',
    briefing:
      'NASA and NOAA need a stationary eye hovering 35,786 km above Atlantic hurricane tracks. Only dedicated GTO-capable rockets can lift the bus here, and heavy radiation belts plus 70-minute equinox eclipses test battery and computer resilience.',
    scenarioId: 'scenario-geo-storm',
    targetOrbitId: 'orbit-geo-35786',
    budgetLimitM: 185.0,
    targetSciencePoints: 1100,
    unlockedParts: [
      'bus-espa-smallsat',
      'pwr-articulated-tracking',
      'bat-heavy-1800wh',
      'adcs-star-tracker-precision',
      'comm-kaband-dish',
      'obc-radhard-fpga',
      'thm-active-heaters-louvers',
      'inst-radiometer',
      'inst-multispectral',
      'lv-falcon9-dedicated'
    ],
    rewardStars: 3,
    primaryGoals: [
      'Select a GTO-capable booster (Falcon 9 Dedicated) under $185M',
      'Include Heavy 1800 Wh battery & Rad-Hard CPU for outer belts',
      'Track storm vortices in GEO for 1,100+ Science XP'
    ],
    starterDesign: {
      name: 'GOES-Scout',
      scenarioId: 'scenario-geo-storm',
      orbitId: 'orbit-geo-35786',
      launchVehicleId: 'lv-falcon9-dedicated',
      structureId: 'bus-espa-smallsat',
      powerGenId: 'pwr-deployable-fixed',
      energyStorageId: 'bat-medium-600wh',
      adcsId: 'adcs-reaction-wheels',
      commsId: 'comm-xband-horn',
      obcId: 'obc-standard-radtol',
      thermalId: 'thm-passive-mli',
      instrumentIds: ['inst-radiometer']
    },
    blueprintDesign: {
      name: 'GOES-19 Sentinel',
      scenarioId: 'scenario-geo-storm',
      orbitId: 'orbit-geo-35786',
      launchVehicleId: 'lv-falcon9-dedicated',
      structureId: 'bus-espa-smallsat',
      powerGenId: 'pwr-articulated-tracking',
      energyStorageId: 'bat-heavy-1800wh',
      adcsId: 'adcs-star-tracker-precision',
      commsId: 'comm-kaband-dish',
      obcId: 'obc-radhard-fpga',
      thermalId: 'thm-active-heaters-louvers',
      instrumentIds: ['inst-radiometer', 'inst-multispectral']
    }
  },
  {
    id: 'mission-3-moon-scout',
    number: 4,
    title: 'Selene Scout: Artemis Ice Hunter',
    subtitle: 'Lunar Polar Water-Ice Prospecting',
    difficulty: 'ADVANCED',
    badge: 'LUNAR_VOYAGER',
    starmapX: 37,
    starmapY: 36,
    starmapCode: 'LUNAR-100',
    starmapColor: '#cbd5e1',
    briefing:
      'Future Artemis human exploration bases require water-ice resources. Engineer a lunar orbiter capable of flying over permanently shadowed craters at the lunar south pole using LIDAR and neutron spectroscopy while surviving 48-minute lunar eclipses.',
    scenarioId: 'scenario-moon-scout',
    targetOrbitId: 'orbit-lunar-polar-100',
    budgetLimitM: 190.0,
    targetSciencePoints: 1250,
    unlockedParts: [
      'bus-espa-smallsat',
      'pwr-articulated-tracking',
      'bat-heavy-1800wh',
      'adcs-star-tracker-precision',
      'comm-kaband-dish',
      'obc-radhard-fpga',
      'thm-active-heaters-louvers',
      'inst-lunar-lidar',
      'inst-neutron-spectrometer',
      'lv-falcon9-dedicated'
    ],
    rewardStars: 3,
    primaryGoals: [
      'Mount Lunar LIDAR + Neutron Spectrometer with Star Tracker ADCS',
      'Include Rad-Hard FPGA OBC and heavy battery for 48m eclipses',
      'Survive lunar shadow passes and collect 1,250+ Science XP'
    ],
    starterDesign: {
      name: 'Selene-1',
      scenarioId: 'scenario-moon-scout',
      orbitId: 'orbit-lunar-polar-100',
      launchVehicleId: 'lv-falcon9-dedicated',
      structureId: 'bus-espa-smallsat',
      powerGenId: 'pwr-deployable-fixed',
      energyStorageId: 'bat-medium-600wh',
      adcsId: 'adcs-reaction-wheels',
      commsId: 'comm-xband-horn',
      obcId: 'obc-standard-radtol',
      thermalId: 'thm-passive-mli',
      instrumentIds: ['inst-neutron-spectrometer']
    },
    blueprintDesign: {
      name: 'Selene-1 Artemis',
      scenarioId: 'scenario-moon-scout',
      orbitId: 'orbit-lunar-polar-100',
      launchVehicleId: 'lv-falcon9-dedicated',
      structureId: 'bus-espa-smallsat',
      powerGenId: 'pwr-articulated-tracking',
      energyStorageId: 'bat-heavy-1800wh',
      adcsId: 'adcs-star-tracker-precision',
      commsId: 'comm-kaband-dish',
      obcId: 'obc-radhard-fpga',
      thermalId: 'thm-active-heaters-louvers',
      instrumentIds: ['inst-lunar-lidar', 'inst-neutron-spectrometer']
    }
  },
  {
    id: 'mission-6-venus-magellan',
    number: 5,
    title: 'Magellan Redux: Venus Cloud-Piercer',
    subtitle: 'Sub-Cloud Synthetic Aperture Radar Survey',
    difficulty: 'ADVANCED',
    badge: 'VENUS_MAPPER',
    starmapX: 46,
    starmapY: 72,
    starmapCode: 'VENUS-300',
    starmapColor: '#eab308',
    briefing:
      'Thick sulfuric clouds hide the entire surface of Venus from optical cameras while intense 0.72 AU sunlight floods solar arrays with 191% irradiance. Equip heavy L-Band SAR Radar on a flagship bus and manage peak thermal loads.',
    scenarioId: 'scenario-venus-radar',
    targetOrbitId: 'orbit-venus-cloud-300',
    budgetLimitM: 240.0,
    targetSciencePoints: 1350,
    unlockedParts: [
      'bus-flagship-hex',
      'pwr-articulated-tracking',
      'bat-heavy-1800wh',
      'adcs-reaction-wheels',
      'comm-kaband-dish',
      'obc-radhard-fpga',
      'thm-active-heaters-louvers',
      'inst-sar-radar',
      'inst-radiometer',
      'lv-falcon9-dedicated'
    ],
    rewardStars: 3,
    primaryGoals: [
      'Mount 160 kg SAR Radar (requires Heavy Flagship Hex Bus)',
      'Equip Active Louvers & Heavy Battery to sustain 450 W radar bursts',
      'Map volcanic ridges beneath Venus clouds for 1,350+ Science XP'
    ],
    starterDesign: {
      name: 'Magellan-II',
      scenarioId: 'scenario-venus-radar',
      orbitId: 'orbit-venus-cloud-300',
      launchVehicleId: 'lv-falcon9-dedicated',
      structureId: 'bus-flagship-hex',
      powerGenId: 'pwr-deployable-fixed',
      energyStorageId: 'bat-medium-600wh',
      adcsId: 'adcs-reaction-wheels',
      commsId: 'comm-xband-horn',
      obcId: 'obc-standard-radtol',
      thermalId: 'thm-passive-mli',
      instrumentIds: ['inst-sar-radar']
    },
    blueprintDesign: {
      name: 'Magellan-VERITAS',
      scenarioId: 'scenario-venus-radar',
      orbitId: 'orbit-venus-cloud-300',
      launchVehicleId: 'lv-falcon9-dedicated',
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
  {
    id: 'mission-7-mars-recon',
    number: 6,
    title: 'Ares Recon: Jezero Mineral Surveyor',
    subtitle: 'Inverse-Square Solar Engineering at 1.52 AU',
    difficulty: 'ADVANCED',
    badge: 'MARS_SURVEYOR',
    starmapX: 56,
    starmapY: 37,
    starmapCode: 'MARS-380',
    starmapColor: '#f97316',
    briefing:
      'Out at Mars, sunlight intensity drops to 43% of Earth nominal—standard solar arrays choke when running full imaging suites. Deploy outer-solar Mega Arrays, pair Multispectral + Hyperspectral + Radiometer payloads, and lock onto DSN passes.',
    scenarioId: 'scenario-mars-recon',
    targetOrbitId: 'orbit-mars-science-380',
    budgetLimitM: 275.0,
    targetSciencePoints: 1450,
    unlockedParts: [
      'bus-flagship-hex',
      'pwr-mega-outer-solar',
      'bat-heavy-1800wh',
      'adcs-star-tracker-precision',
      'comm-kaband-dish',
      'obc-radhard-fpga',
      'thm-active-heaters-louvers',
      'inst-multispectral',
      'inst-hyperspectral',
      'inst-radiometer',
      'lv-falcon9-dedicated'
    ],
    rewardStars: 3,
    primaryGoals: [
      'Solve 43% Mars solar flux drop using Clipper Mega Solar Arrays',
      'Navigate the Ares Canyon Run flight rings to interplanetary escape',
      'Scan Valles Marineris & polar ice caps for 1,450+ Science XP'
    ],
    starterDesign: {
      name: 'Ares-1',
      scenarioId: 'scenario-mars-recon',
      orbitId: 'orbit-mars-science-380',
      launchVehicleId: 'lv-falcon9-dedicated',
      structureId: 'bus-flagship-hex',
      powerGenId: 'pwr-articulated-tracking',
      energyStorageId: 'bat-medium-600wh',
      adcsId: 'adcs-reaction-wheels',
      commsId: 'comm-xband-horn',
      obcId: 'obc-radhard-fpga',
      thermalId: 'thm-passive-mli',
      instrumentIds: ['inst-multispectral', 'inst-hyperspectral']
    },
    blueprintDesign: {
      name: 'MRO-Ares-Flagship',
      scenarioId: 'scenario-mars-recon',
      orbitId: 'orbit-mars-science-380',
      launchVehicleId: 'lv-falcon9-dedicated',
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
  {
    id: 'mission-4-cosmic-eye',
    number: 7,
    title: 'Cosmic Eye: Exoplanet Hunter',
    subtitle: 'Deep Space Astrophysics at Lagrange Point 2',
    difficulty: 'FLAGSHIP',
    badge: 'COSMIC_SEEKER',
    starmapX: 66,
    starmapY: 69,
    starmapCode: 'SUN-L2',
    starmapColor: '#fc3d21',
    briefing:
      'NASA Astrophysics Division Announcement: Build a flagship observatory positioned 1.5 million km from Earth at Sun-Earth L2. Demands ±0.002° arcsecond pointing, optical laser downlink, thermal louvers, and a 0.8m cryogenic space telescope.',
    scenarioId: 'scenario-eye-universe',
    targetOrbitId: 'orbit-lagrange-l2',
    budgetLimitM: 280.0,
    targetSciencePoints: 1600,
    unlockedParts: [
      'bus-flagship-hex',
      'pwr-deepspace-rtg',
      'pwr-articulated-tracking',
      'bat-heavy-1800wh',
      'adcs-star-tracker-precision',
      'comm-optical-laser',
      'obc-radhard-fpga',
      'thm-active-heaters-louvers',
      'inst-space-telescope',
      'lv-falcon9-dedicated',
      'lv-vulcan-centaur'
    ],
    rewardStars: 3,
    primaryGoals: [
      'Mount 0.8m Space Telescope with Star Tracker (±0.002°)',
      'Inject into Sun-Earth Lagrange Point 2 Halo Orbit',
      'Capture exoplanet transits for 1,600+ Science XP'
    ],
    starterDesign: {
      name: 'CosmicEye-1',
      scenarioId: 'scenario-eye-universe',
      orbitId: 'orbit-lagrange-l2',
      launchVehicleId: 'lv-falcon9-dedicated',
      structureId: 'bus-flagship-hex',
      powerGenId: 'pwr-articulated-tracking',
      energyStorageId: 'bat-heavy-1800wh',
      adcsId: 'adcs-star-tracker-precision',
      commsId: 'comm-kaband-dish',
      obcId: 'obc-radhard-fpga',
      thermalId: 'thm-active-heaters-louvers',
      instrumentIds: ['inst-space-telescope']
    },
    blueprintDesign: {
      name: 'CosmicEye-Flagship',
      scenarioId: 'scenario-eye-universe',
      orbitId: 'orbit-lagrange-l2',
      launchVehicleId: 'lv-vulcan-centaur',
      structureId: 'bus-flagship-hex',
      powerGenId: 'pwr-articulated-tracking',
      energyStorageId: 'bat-heavy-1800wh',
      adcsId: 'adcs-star-tracker-precision',
      commsId: 'comm-optical-laser',
      obcId: 'obc-radhard-fpga',
      thermalId: 'thm-active-heaters-louvers',
      instrumentIds: ['inst-space-telescope']
    }
  },
  {
    id: 'mission-8-psyche-core',
    number: 8,
    title: 'Psyche DSOC: Metal Core Rendezvous',
    subtitle: '2.9 AU Asteroid Belt & Optical Laser Link',
    difficulty: 'FLAGSHIP',
    badge: 'CORE_EXPLORER',
    starmapX: 75,
    starmapY: 33,
    starmapCode: 'PSYCHE-120',
    starmapColor: '#94a3b8',
    briefing:
      'Rendezvous with exposed iron-nickel asteroid core 16 Psyche where sunlight falls to 12%. Pair a Fluxgate Magnetometer Boom, Neutron Spectrometer, and Optical Imager with DSOC Optical Laser Communications (±0.002° Star Trackers required!).',
    scenarioId: 'scenario-psyche-core',
    targetOrbitId: 'orbit-psyche-metal-120',
    budgetLimitM: 285.0,
    targetSciencePoints: 1700,
    unlockedParts: [
      'bus-flagship-hex',
      'pwr-mega-outer-solar',
      'bat-heavy-1800wh',
      'adcs-star-tracker-precision',
      'comm-optical-laser',
      'obc-radhard-fpga',
      'thm-active-heaters-louvers',
      'inst-magnetometer-boom',
      'inst-neutron-spectrometer',
      'inst-multispectral',
      'lv-vulcan-centaur'
    ],
    rewardStars: 3,
    primaryGoals: [
      'Power all subsystems on 12% sunlight using Mega Solar Arrays',
      'Pair Optical Laser Transceiver with ±0.002° Star Trackers',
      'Survey 16 Psyche anomalies to reach 1,700+ Science XP'
    ],
    starterDesign: {
      name: 'Psyche-Scout',
      scenarioId: 'scenario-psyche-core',
      orbitId: 'orbit-psyche-metal-120',
      launchVehicleId: 'lv-falcon9-dedicated',
      structureId: 'bus-flagship-hex',
      powerGenId: 'pwr-articulated-tracking',
      energyStorageId: 'bat-medium-600wh',
      adcsId: 'adcs-reaction-wheels',
      commsId: 'comm-kaband-dish',
      obcId: 'obc-radhard-fpga',
      thermalId: 'thm-passive-mli',
      instrumentIds: ['inst-magnetometer-boom', 'inst-neutron-spectrometer']
    },
    blueprintDesign: {
      name: 'Psyche-DSOC-Pro',
      scenarioId: 'scenario-psyche-core',
      orbitId: 'orbit-psyche-metal-120',
      launchVehicleId: 'lv-vulcan-centaur',
      structureId: 'bus-flagship-hex',
      powerGenId: 'pwr-mega-outer-solar',
      energyStorageId: 'bat-heavy-1800wh',
      adcsId: 'adcs-star-tracker-precision',
      commsId: 'comm-optical-laser',
      obcId: 'obc-radhard-fpga',
      thermalId: 'thm-active-heaters-louvers',
      instrumentIds: ['inst-magnetometer-boom', 'inst-multispectral', 'inst-neutron-spectrometer']
    }
  },
  {
    id: 'mission-9-europa-clipper',
    number: 9,
    title: 'Jovian Clipper: Europa Ocean Scout',
    subtitle: '5.2 AU Jovian Radiation & Ice-Shell Frontier',
    difficulty: 'FLAGSHIP',
    badge: 'EUROPA_CLIPPER',
    starmapX: 84,
    starmapY: 67,
    starmapCode: 'EUROPA-200',
    starmapColor: '#7dd3fc',
    briefing:
      'Orbiting Jupiter’s ocean moon Europa cuts sunlight to just 3.7% while pummeling avionics with brutal synchrotron radiation. Engineered like NASA Europa Clipper: massive solar wings (or Pu-238 RTG), Rad-Hard FPGA vault, and magnetometer/optical sensors.',
    scenarioId: 'scenario-europa-ocean',
    targetOrbitId: 'orbit-europa-polar-200',
    budgetLimitM: 340.0,
    targetSciencePoints: 1850,
    unlockedParts: [
      'bus-flagship-hex',
      'pwr-mega-outer-solar',
      'pwr-multi-rtg',
      'bat-heavy-1800wh',
      'adcs-reaction-wheels',
      'comm-xband-horn',
      'obc-radhard-fpga',
      'thm-active-heaters-louvers',
      'inst-magnetometer-boom',
      'inst-multispectral',
      'lv-vulcan-centaur'
    ],
    rewardStars: 3,
    primaryGoals: [
      'Keep C3 escape payload liftable on ULA Vulcan Centaur (0.35x TLI)',
      'Sustain positive daylight balance at 3.7% solar flux (133 W Mega PV)',
      'Thread Jovian Radiation Run gates and log 1,850+ Science XP'
    ],
    starterDesign: {
      name: 'Clipper-Test',
      scenarioId: 'scenario-europa-ocean',
      orbitId: 'orbit-europa-polar-200',
      launchVehicleId: 'lv-vulcan-centaur',
      structureId: 'bus-flagship-hex',
      powerGenId: 'pwr-articulated-tracking',
      energyStorageId: 'bat-medium-600wh',
      adcsId: 'adcs-reaction-wheels',
      commsId: 'comm-xband-horn',
      obcId: 'obc-standard-radtol',
      thermalId: 'thm-passive-mli',
      instrumentIds: ['inst-magnetometer-boom']
    },
    blueprintDesign: {
      name: 'Europa-Clipper-Flagship',
      scenarioId: 'scenario-europa-ocean',
      orbitId: 'orbit-europa-polar-200',
      launchVehicleId: 'lv-vulcan-centaur',
      structureId: 'bus-flagship-hex',
      powerGenId: 'pwr-mega-outer-solar',
      energyStorageId: 'bat-heavy-1800wh',
      adcsId: 'adcs-reaction-wheels',
      commsId: 'comm-xband-horn',
      obcId: 'obc-radhard-fpga',
      thermalId: 'thm-active-heaters-louvers',
      instrumentIds: ['inst-magnetometer-boom', 'inst-multispectral']
    }
  },
  {
    id: 'mission-10-titan-cassini',
    number: 10,
    title: 'Cassini Legacy: Titan Sea Explorer',
    subtitle: '9.5 AU Pu-238 Nuclear Outer-System Finale',
    difficulty: 'FLAGSHIP',
    badge: 'TITAN_VOYAGER',
    starmapX: 91,
    starmapY: 28,
    starmapCode: 'TITAN-1200',
    starmapColor: '#f59e0b',
    briefing:
      'Final Contract: Saturn’s moon Titan sits 9.54 AU from the Sun (1.1% sunlight—every solar array fails). Power an L-Band SAR Radar & Boom Magnetometer exclusively via Quad-MMRTG Plutonium-238 generators and pierce Kraken Mare’s orange methane haze.',
    scenarioId: 'scenario-titan-flagship',
    targetOrbitId: 'orbit-titan-haze-1200',
    budgetLimitM: 420.0,
    targetSciencePoints: 2000,
    unlockedParts: [
      'bus-flagship-hex',
      'pwr-multi-rtg',
      'bat-heavy-1800wh',
      'adcs-reaction-wheels',
      'comm-kaband-dish',
      'obc-radhard-fpga',
      'thm-active-heaters-louvers',
      'inst-sar-radar',
      'inst-magnetometer-boom',
      'lv-vulcan-centaur'
    ],
    rewardStars: 3,
    primaryGoals: [
      'Replace failing solar wings with Quad-MMRTG Nuclear Power (650 W)',
      'Master the Saturnian Apex flight circuit on ULA Vulcan Centaur',
      'Map Titan hydrocarbon seas via SAR Radar for 2,000+ Science XP'
    ],
    starterDesign: {
      name: 'Titan-Probe',
      scenarioId: 'scenario-titan-flagship',
      orbitId: 'orbit-titan-haze-1200',
      launchVehicleId: 'lv-vulcan-centaur',
      structureId: 'bus-flagship-hex',
      powerGenId: 'pwr-mega-outer-solar',
      energyStorageId: 'bat-heavy-1800wh',
      adcsId: 'adcs-reaction-wheels',
      commsId: 'comm-kaband-dish',
      obcId: 'obc-radhard-fpga',
      thermalId: 'thm-active-heaters-louvers',
      instrumentIds: ['inst-sar-radar', 'inst-magnetometer-boom']
    },
    blueprintDesign: {
      name: 'Cassini-Titan-Pro',
      scenarioId: 'scenario-titan-flagship',
      orbitId: 'orbit-titan-haze-1200',
      launchVehicleId: 'lv-vulcan-centaur',
      structureId: 'bus-flagship-hex',
      powerGenId: 'pwr-multi-rtg',
      energyStorageId: 'bat-heavy-1800wh',
      adcsId: 'adcs-reaction-wheels',
      commsId: 'comm-kaband-dish',
      obcId: 'obc-radhard-fpga',
      thermalId: 'thm-active-heaters-louvers',
      instrumentIds: ['inst-sar-radar', 'inst-magnetometer-boom']
    }
  }
];
