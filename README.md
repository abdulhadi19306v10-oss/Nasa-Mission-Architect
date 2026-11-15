# Mission Architect — Space Mission Design Game

> Built for the **2026 NASA Space Apps Challenge**.

**Mission Architect** is an interactive 3D spacecraft engineering and orbital operations game where you design a complete space mission from requirements to launch and science operations, balance real aerospace subsystem trade-offs, fly the ascent corridor, and downlink orbital science back to Earth.

---

## Development & SI Attribution

> **All code authoring, system architecture, and debugging for this project were done through the use of SI (Synthetic Intelligence / AI).**

Every TypeScript module, simulation physics equation, 3D Three.js spacecraft/planetary scene, React UI component, multiplayer WebSocket server, automated test suite, and bug fix (including orbital scan/upload state synchronization and local network hosting) was written, reviewed, and debugged using SI workflows, grounded in public NASA systems-engineering references documented in [sources.txt](sources.txt).

---

## Gameplay Overview

Mission Architect models the full mission lifecycle across four connected phases:

1. **Vehicle Assembly Bay (VAB Hangar)**
   - Assemble modular spacecraft in a live 3D CAD viewport (`Three.js` / `react-three-fiber`).
   - Select **Science Instruments** (8 options), **Structure Bus** (3), **Power Generation** (6 solar & Pu-238 nuclear RTGs), **Energy Storage** (3), **Attitude Control / ADCS** (3), **Communications** (4, up to Optical Laser), **Onboard Computer / OBC** (3, including Edge AI & Rad-Hard FPGA), **Thermal Control** (2), **Launch Vehicle** (5), and **Target Orbit** (10).
   - Monitor live **Go / No-Go** engineering margins: launch mass vs. rocket TLI/GTO/LEO/SSO capacity, daylight and eclipse power balance, battery Depth of Discharge (DoD), pointing stability (`deg`), daily downlink capacity vs. onboard storage, magnetosphere compatibility, and mission budget.
   - Discover **5 Subsystem Synergy Combos** (e.g. *Multi-Band Earth Twin*, *Artemis Volatile Hunter*, *Cryogenic Deep-Field Link*, *Autonomous Cloud Filter*, *Continuous Nuclear Power*).

2. **3D Ascent Flight (`FlightArcade`)**
   - Steer your chosen rocket along a 3D skyway trajectory through glowing ascent rings (`[A]/[D]` or Arrow keys).
   - Manage throttle (`[W]/[S]`) through **Max-Q** aerodynamic stress and command precision **Stage Separation** and fairing deployment (`[SPACE]`).

3. **Orbital Command (`OrbitalCommand`)**
   - Pilot your spacecraft around the target body, slew the cross-track aiming reticle (`[A]/[D]`), control orbital speed (`[W]/[S]`), and switch power modes (`ECO` / `NOMINAL` / `BOOST` via `[Q]`) while tracking battery charge, eclipses, and thermal state.
   - Complete orbital science tasks via an alternating **Scan (`[SPACE]`) -> Upload (`[E]`) -> Scan** loop across 4 science markers—scanning one target at a time and downlinking it inside a green ground-station / DSN link cone before scanning the next—while resolving mid-mission orbital anomalies.

4. **Post-Mission Debrief (`DebriefReport`)**
   - Review engineering breakdowns, earn a **1–3 Star** mission rating and **NASA Concept Maturity Level (CML 1–6)** score, and compare your build against **10 real NASA missions** (such as *Landsat 9*, *JWST*, *LRO*, *Magellan*, *MRO*, *Psyche*, *Europa Clipper*, and *Cassini*).

---

## Destinations, Campaign & Modes

### 8 Celestial Worlds & 10 Orbits
Physics calculations model Keplerian orbital periods and speeds, eclipse durations, planetary magnetospheres, and **1/r² inverse-square solar irradiance**:
- **Earth:** LEO (400 km), Sun-Synchronous Polar (700 km), Geostationary (35,786 km)
- **The Moon:** Low Lunar Polar Orbit (100 km) — 48-minute eclipses & no global dipole field
- **Venus:** Cloud-Top Polar Orbit (300 km) — 191% solar flux & opaque sulfuric clouds requiring SAR radar
- **Mars:** Polar Science Orbit (380 km) — 43% solar flux
- **Sun-Earth L2:** Halo Orbit (1.5M km) — continuous sunlight & DSN communications
- **16 Psyche:** Metallic Asteroid Orbit (120 km) — 2.92 AU, 12% solar flux, microgravity
- **Europa:** Icy Ocean Polar Orbit (200 km) — 5.2 AU, 3.7% solar flux, severe Jovian radiation
- **Titan:** Methane Sea Orbit (1,200 km) — 9.54 AU, 1.1% solar flux requiring Pu-238 RTG power

### Modes & Difficulty
- **10-Mission Campaign:** Progress from *Project Beacon: First Light* to *Cassini Legacy: Titan Sea Explorer*.
- **Deep-Space Free Flight (Sandbox):** Unlimited budget across any destination with one-click NASA flagship reference presets.
- **3 Difficulty Levels:** `Beginner` (Cadet Assist), `Intermediate` (Flight Engineer), and `Advanced` (JPL Director).
- **8-Lesson Flight Academy Tutorial:** Interactive non-blocking coach guiding players from VAB assembly through orbital downlink.

---

## Team Co-op Mode (Up to 4 Players)

Collaborate in real time over WebSockets or share encoded `MA1:...` spacecraft blueprints across four engineering stations:

| Role | Responsibility |
|---|---|
| **Mission Planner** | Scenario objectives, target orbit, and launch vehicle |
| **Spacecraft Engineer** | Structure, solar/RTG power, batteries, and thermal control |
| **Science Lead** | Payload instruments and multi-sensor synergy combos |
| **Communications & Budget Lead** | Antennas, OBC storage, downlink capacity, and budget limits |

---

## Tech Stack & Project Structure

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Front End | React 18, Tailwind CSS, Lucide Icons |
| 3D Graphics | Three.js (`@react-three/fiber`, `@react-three/drei`) |
| Simulation Engine | Standalone TypeScript package (`@mission-architect/sim`) |
| Multiplayer Server | Node.js WebSocket room server (`ws`) |
| Build & Testing | Vite, Vitest |

```text
├── data/                        # Instruments, subsystems, launch vehicles, orbits, scenarios, real NASA missions
├── packages/
│   ├── sim/                     # Pure TS orbital math, resource budgets, simulation, scoring & Vitest suite
│   ├── web/                     # React + Three.js game client, VAB HUD, 3D ascent & orbital command
│   └── server/                  # WebSocket multiplayer room server (default port 3001)
├── sources.txt                  # NASA technical and 3D model references
├── package.json                 # Workspace scripts
└── tsconfig.base.json
```

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Install & Run Locally

```bash
# Install workspace dependencies
npm install

# Run simulation unit tests (packages/sim)
npm test

# Build all packages (sim, web, server)
npm run build

# Start the web client (http://localhost:5173)
npm run dev

# Start the multiplayer WebSocket server (port 3001)
npm run server
```

### Hosting on a Local Network (LAN)

To let other devices on your Wi-Fi/LAN play and join Team Mode rooms:

```bash
# 1. Start the multiplayer WebSocket server (listens on port 3001)
npm run server

# 2. Build and serve the web client bound to all network interfaces
npm run build
npm run preview --workspace=packages/web -- --host 0.0.0.0 --port 5173
```

Open `http://<your-lan-ip>:5173` on other devices on the same network. The client automatically connects to `ws://<window.location.hostname>:3001` (overrideable via `VITE_WS_URL`). Ensure inbound TCP ports `5173` and `3001` are permitted in your firewall.

---

## Data & References

Spacecraft, instrument, launch vehicle, and orbital parameters are simplified educational approximations calibrated against public NASA references listed in [sources.txt](sources.txt) (including NASA *Small Spacecraft Technology State-of-the-Art*, Launch Services Program data, NTRS documents, and NASA 3D Resources). Not intended for real flight engineering. NASA does not endorse this project.

## License

Licensed under the [MIT License](package.json).
