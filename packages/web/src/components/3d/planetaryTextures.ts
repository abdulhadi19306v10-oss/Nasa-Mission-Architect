import * as THREE from 'three';
import { CelestialBodyId } from '@sim/index';

export interface BodyVisualSpec {
  radius: number;
  surfaceRadius: number;
  defaultOrbitRadius: number;
  atmosphereColor: string | null;
  atmosphereOpacity: number;
  secondaryHazeColor?: string;
  secondaryHazeOpacity?: number;
  ringColor: string;
  roughness: number;
  metalness: number;
  bumpScale: number;
  cloudColor?: string;
  cloudOpacity?: number;
  cloudSpeed?: number;
}

export const BODY_VISUAL_SPECS: Record<CelestialBodyId, BodyVisualSpec> = {
  earth: {
    radius: 2.0,
    surfaceRadius: 2.04,
    defaultOrbitRadius: 3.7,
    atmosphereColor: '#38bdf8',
    atmosphereOpacity: 0.2,
    ringColor: '#00e5ff',
    roughness: 0.56,
    metalness: 0.08,
    bumpScale: 0.05,
    cloudColor: '#ffffff',
    cloudOpacity: 0.72,
    cloudSpeed: 0.03
  },
  mars: {
    radius: 1.88,
    surfaceRadius: 1.92,
    defaultOrbitRadius: 3.6,
    atmosphereColor: '#f97316',
    atmosphereOpacity: 0.12,
    ringColor: '#fb923c',
    roughness: 0.92,
    metalness: 0.02,
    bumpScale: 0.09
  },
  venus: {
    radius: 1.98,
    surfaceRadius: 2.04,
    defaultOrbitRadius: 3.75,
    atmosphereColor: '#fde047',
    atmosphereOpacity: 0.24,
    ringColor: '#facc15',
    roughness: 0.78,
    metalness: 0.0,
    bumpScale: 0.015,
    cloudColor: '#fef3c7',
    cloudOpacity: 0.52,
    cloudSpeed: -0.065
  },
  moon: {
    radius: 1.85,
    surfaceRadius: 1.88,
    defaultOrbitRadius: 3.3,
    atmosphereColor: null,
    atmosphereOpacity: 0,
    ringColor: '#94a3b8',
    roughness: 0.96,
    metalness: 0.0,
    bumpScale: 0.1
  },
  europa: {
    radius: 1.82,
    surfaceRadius: 1.85,
    defaultOrbitRadius: 3.45,
    atmosphereColor: '#bae6fd',
    atmosphereOpacity: 0.11,
    ringColor: '#7dd3fc',
    roughness: 0.3,
    metalness: 0.08,
    bumpScale: 0.065
  },
  titan: {
    radius: 1.92,
    surfaceRadius: 2.0,
    defaultOrbitRadius: 3.95,
    atmosphereColor: '#ea580c',
    atmosphereOpacity: 0.28,
    secondaryHazeColor: '#7dd3fc',
    secondaryHazeOpacity: 0.16,
    ringColor: '#fbbf24',
    roughness: 0.88,
    metalness: 0.0,
    bumpScale: 0.02
  },
  asteroid: {
    radius: 1.55,
    surfaceRadius: 1.9,
    defaultOrbitRadius: 3.55,
    atmosphereColor: null,
    atmosphereOpacity: 0,
    ringColor: '#cbd5e1',
    roughness: 0.36,
    metalness: 0.74,
    bumpScale: 0.11
  },
  lagrange: {
    radius: 2.0,
    surfaceRadius: 2.15,
    defaultOrbitRadius: 3.8,
    atmosphereColor: '#38bdf8',
    atmosphereOpacity: 0.12,
    ringColor: '#fbbf24',
    roughness: 0.6,
    metalness: 0.1,
    bumpScale: 0.02
  }
};

function hash2D(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function hash3D(x: number, y: number, z: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

function smoothNoise3D(x: number, y: number, z: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const w = fz * fz * (3 - 2 * fz);

  const n000 = hash3D(ix, iy, iz);
  const n100 = hash3D(ix + 1, iy, iz);
  const n010 = hash3D(ix, iy + 1, iz);
  const n110 = hash3D(ix + 1, iy + 1, iz);
  const n001 = hash3D(ix, iy, iz + 1);
  const n101 = hash3D(ix + 1, iy, iz + 1);
  const n011 = hash3D(ix, iy + 1, iz + 1);
  const n111 = hash3D(ix + 1, iy + 1, iz + 1);

  const nx00 = n000 * (1 - u) + n100 * u;
  const nx10 = n010 * (1 - u) + n110 * u;
  const nx01 = n001 * (1 - u) + n101 * u;
  const nx11 = n011 * (1 - u) + n111 * u;

  const nxy0 = nx00 * (1 - v) + nx10 * v;
  const nxy1 = nx01 * (1 - v) + nx11 * v;
  return nxy0 * (1 - w) + nxy1 * w;
}

function fbm3D(x: number, y: number, z: number, octaves = 5): number {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    value += amp * smoothNoise3D(x * freq, y * freq, z * freq);
    freq *= 2.04;
    amp *= 0.5;
  }
  return value;
}

/** Maps equirectangular image coordinates (px, py) onto unit sphere (nx, ny, nz). */
function uvToSphereDir(u: number, v: number): [number, number, number] {
  const lon = u * Math.PI * 2;
  const lat = (0.5 - v) * Math.PI;
  const cosLat = Math.cos(lat);
  return [cosLat * Math.cos(lon), Math.sin(lat), cosLat * Math.sin(lon)];
}

/** Angular great-circle distance on unit sphere between two (lon, lat) pairs. */
function angularDist(lonA: number, latA: number, lonB: number, latB: number): number {
  const dLon = lonA - lonB;
  const cosD =
    Math.sin(latA) * Math.sin(latB) + Math.cos(latA) * Math.cos(latB) * Math.cos(dLon);
  return Math.acos(Math.max(-1, Math.min(1, cosD)));
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function makeCanvasTexture(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  w = 512,
  h = 256,
  isColor = true
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  if (isColor) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.needsUpdate = true;
  return tex;
}

function createGrayscaleCanvasTexture(
  values: Uint8ClampedArray,
  w: number,
  h: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const val = values[i];
    const p = i * 4;
    img.data[p] = val;
    img.data[p + 1] = val;
    img.data[p + 2] = val;
    img.data[p + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------------------
// 1. EARTH (Rich oceans, continents, snow peaks, polar caps, swirls clouds)
// ---------------------------------------------------------------------------
export function createEarthTextures(): {
  dayMap: THREE.CanvasTexture;
  cloudMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const w = 768;
  const h = 384;
  const bumpBuf = new Uint8ClampedArray(w * h);

  const dayMap = makeCanvasTexture(
    (ctx) => {
      const img = ctx.createImageData(w, h);
      const data = img.data;

      for (let py = 0; py < h; py++) {
        const v = py / h;
        const lat = (0.5 - v) * Math.PI;
        const absLat = Math.abs(lat) / (Math.PI / 2);

        for (let px = 0; px < w; px++) {
          const u = px / w;
          const [sx, sy, sz] = uvToSphereDir(u, v);

          const base = fbm3D(sx * 1.9 + 3.4, sy * 1.9 + 1.2, sz * 1.9 + 5.7, 5);
          const detail = fbm3D(sx * 5.2 + 11.1, sy * 5.2 + 4.3, sz * 5.2 + 7.9, 3);
          const elevation = base * 0.78 + detail * 0.22;

          const idx = (py * w + px) * 4;
          const bIdx = py * w + px;

          if (absLat > 0.85 - detail * 0.08) {
            data[idx] = 235;
            data[idx + 1] = 244;
            data[idx + 2] = 255;
            bumpBuf[bIdx] = 175;
          } else if (elevation > 0.51) {
            const hNorm = Math.min(1, (elevation - 0.51) / 0.26);
            bumpBuf[bIdx] = clampByte(132 + hNorm * 118);
            const aridity = fbm3D(sx * 2.5 + 19, sy * 2.5 + 8, sz * 2.5 + 3, 3);
            if (hNorm > 0.74) {
              data[idx] = 224;
              data[idx + 1] = 230;
              data[idx + 2] = 238;
            } else if (absLat < 0.48 && aridity > 0.53) {
              data[idx] = clampByte(206 - hNorm * 32);
              data[idx + 1] = clampByte(170 - hNorm * 30);
              data[idx + 2] = clampByte(106 - hNorm * 22);
            } else if (absLat > 0.68) {
              data[idx] = clampByte(98 + hNorm * 45);
              data[idx + 1] = clampByte(122 + hNorm * 36);
              data[idx + 2] = clampByte(94 + hNorm * 28);
            } else {
              data[idx] = clampByte(32 + hNorm * 58);
              data[idx + 1] = clampByte(126 + hNorm * 34);
              data[idx + 2] = clampByte(62 + hNorm * 24);
            }
          } else {
            bumpBuf[bIdx] = 95;
            const depth = Math.max(0, (0.51 - elevation) / 0.34);
            const shallow = Math.max(0, 1 - depth * 4.5);
            data[idx] = clampByte(10 + shallow * 30);
            data[idx + 1] = clampByte(64 + shallow * 102 - depth * 26);
            data[idx + 2] = clampByte(158 + shallow * 54 - depth * 42);
          }
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    w,
    h,
    true
  );

  const cloudMap = makeCanvasTexture(
    (ctx) => {
      const img = ctx.createImageData(w, h);
      const data = img.data;
      for (let py = 0; py < h; py++) {
        const v = py / h;
        for (let px = 0; px < w; px++) {
          const u = px / w;
          const [sx, sy, sz] = uvToSphereDir(u, v);
          const swirl = Math.sin(sy * 5.0) * 0.25;
          const n = fbm3D(sx * 3.1 + 14.2 + swirl, sy * 3.8 + 3.1, sz * 3.1 + 9.4, 4);
          const alpha = clampByte((n - 0.5) * 520);
          const idx = (py * w + px) * 4;
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;
          data[idx + 3] = alpha;
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    w,
    h,
    false
  );

  const bumpMap = createGrayscaleCanvasTexture(bumpBuf, w, h);
  return { dayMap, cloudMap, bumpMap };
}

// ---------------------------------------------------------------------------
// 2. MARS (Valles Marineris chasm, Olympus Mons shield, dark maria, polar caps)
// ---------------------------------------------------------------------------
export function createMarsTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const w = 512;
  const h = 256;
  const bumpBuf = new Uint8ClampedArray(w * h);

  const map = makeCanvasTexture(
    (ctx) => {
      const img = ctx.createImageData(w, h);
      const data = img.data;

      // Iconic landmarks shifted toward u=0.22..0.44 (+Z camera hemisphere!)
      const olympusLon = 0.22 * Math.PI * 2;
      const olympusLat = 0.32;
      const hellasLon = 0.52 * Math.PI * 2;
      const hellasLat = -0.58;
      const syrtisLon = 0.42 * Math.PI * 2;
      const syrtisLat = 0.14;

      for (let py = 0; py < h; py++) {
        const v = py / h;
        const lat = (0.5 - v) * Math.PI;
        const absLat = Math.abs(lat) / (Math.PI / 2);

        for (let px = 0; px < w; px++) {
          const u = px / w;
          const lon = u * Math.PI * 2;
          const [sx, sy, sz] = uvToSphereDir(u, v);

          const base = fbm3D(sx * 2.4 + 6.1, sy * 2.4 + 2.3, sz * 2.4 + 9.4, 5);
          const micro = fbm3D(sx * 8.5 + 1.9, sy * 8.5 + 7.2, sz * 8.5 + 3.1, 3);
          const terrain = base * 0.78 + micro * 0.22;

          let heightVal = 115 + terrain * 75;
          const idx = (py * w + px) * 4;
          const bIdx = py * w + px;

          // Valles Marineris giant rift canyon across front equator (lon ~ 1.45 .. 2.75 rad)
          const vmCenterLat = -0.14 + Math.sin(lon * 3.0) * 0.045;
          const inVmLon = lon > 1.38 && lon < 2.72;
          const vmDist = Math.abs(lat - vmCenterLat);
          const inVallesMarineris = inVmLon && vmDist < 0.052 + (micro - 0.5) * 0.03;

          // Olympus Mons volcano cone + caldera
          const dOlympus = angularDist(lon, lat, olympusLon, olympusLat);
          const dHellas = angularDist(lon, lat, hellasLon, hellasLat);
          const dSyrtis = angularDist(lon, lat, syrtisLon, syrtisLat);

          // Polar CO2/H2O caps (slightly asymmetric)
          if (absLat > 0.84 - micro * 0.09) {
            data[idx] = 244;
            data[idx + 1] = 240;
            data[idx + 2] = 236;
            heightVal = 215;
          } else if (dOlympus < 0.16) {
            // Giant Martian shield volcano + dark summit caldera
            const caldera = dOlympus < 0.036;
            const ringFactor = Math.max(0, 1 - dOlympus / 0.16);
            heightVal = caldera ? 140 : 195 + ringFactor * 55;
            data[idx] = caldera ? 105 : clampByte(208 + ringFactor * 26);
            data[idx + 1] = caldera ? 44 : clampByte(112 + ringFactor * 26);
            data[idx + 2] = caldera ? 30 : clampByte(66 + ringFactor * 16);
          } else if (inVallesMarineris) {
            heightVal = 24 + (vmDist / 0.06) * 45;
            data[idx] = 92;
            data[idx + 1] = 35;
            data[idx + 2] = 22;
          } else if (dHellas < 0.28) {
            // Dusty pale impact basin
            heightVal = 45 + (dHellas / 0.28) * 65;
            data[idx] = clampByte(218 - terrain * 28);
            data[idx + 1] = clampByte(142 - terrain * 24);
            data[idx + 2] = clampByte(96 - terrain * 18);
          } else if (dSyrtis < 0.29 + (terrain - 0.5) * 0.25 || terrain < 0.45) {
            // Dark Syrtis Major / Acidalia basaltic plains
            heightVal = 90 + terrain * 55;
            data[idx] = clampByte(118 + terrain * 46);
            data[idx + 1] = clampByte(48 + terrain * 34);
            data[idx + 2] = clampByte(30 + terrain * 22);
          } else {
            // Iconic butterscotch-ochre highlands
            data[idx] = clampByte(192 + terrain * 56);
            data[idx + 1] = clampByte(94 + terrain * 52);
            data[idx + 2] = clampByte(48 + terrain * 32);
          }

          bumpBuf[bIdx] = clampByte(heightVal);
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);

      // Sharp Martian craters on albedo + rim rings
      for (let i = 0; i < 48; i++) {
        const cx = hash2D(i, 2.7) * w;
        const cy = (0.14 + hash2D(i, 6.2) * 0.72) * h;
        const r = 3 + hash2D(i, 8.9) * 11;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(110, 42, 24, 0.34)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(235, 160, 112, 0.36)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    },
    w,
    h,
    true
  );

  const bumpMap = createGrayscaleCanvasTexture(bumpBuf, w, h);
  return { map, bumpMap };
}

export function createMarsTexture(): THREE.CanvasTexture {
  return createMarsTextures().map;
}

// ---------------------------------------------------------------------------
// 3. VENUS (Pale sulfur-cream clouds + Mariner/Akatsuki Y-chevron bands)
// ---------------------------------------------------------------------------
export function createVenusTextures(): {
  map: THREE.CanvasTexture;
  cloudMap: THREE.CanvasTexture;
} {
  const w = 512;
  const h = 256;

  const map = makeCanvasTexture(
    (ctx) => {
      const img = ctx.createImageData(w, h);
      const data = img.data;
      for (let py = 0; py < h; py++) {
        const v = py / h;
        const lat = (0.5 - v) * Math.PI;
        const absLat = Math.abs(lat) / (Math.PI / 2);

        for (let px = 0; px < w; px++) {
          const u = px / w;
          const lon = u * Math.PI * 2;
          // Distinct pale sulfuric cream/gold with dark V/Y equatorial chevron absorption!
          const chevronPhase = lon - absLat * 3.4;
          const [sx, sy, sz] = uvToSphereDir(chevronPhase / (Math.PI * 2), v);
          const streak = fbm3D(sx * 2.2 + 5.1, sy * 7.5 + 1.4, sz * 2.2 + 3.8, 4);
          const yBand = 0.5 + 0.5 * Math.sin(chevronPhase * 2.0 + streak * 2.8);
          const polarBright = Math.max(0, (absLat - 0.62) / 0.38);

          const lum = streak * 0.6 + yBand * 0.25 + polarBright * 0.28;
          const idx = (py * w + px) * 4;
          data[idx] = clampByte(208 + lum * 45);
          data[idx + 1] = clampByte(174 + lum * 56);
          data[idx + 2] = clampByte(96 + lum * 72);
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    w,
    h,
    true
  );

  const cloudMap = makeCanvasTexture(
    (ctx) => {
      const img = ctx.createImageData(w, h);
      const data = img.data;
      for (let py = 0; py < h; py++) {
        const v = py / h;
        const absLat = Math.abs(v - 0.5) * 2;
        for (let px = 0; px < w; px++) {
          const u = px / w;
          const chevron = u - absLat * 0.22;
          const [sx, sy, sz] = uvToSphereDir(chevron, v);
          const n = fbm3D(sx * 3.2 + 9.2, sy * 9.0 + 4.1, sz * 3.2 + 2.7, 4);
          const alpha = clampByte((n - 0.42) * 380);
          const idx = (py * w + px) * 4;
          data[idx] = 254;
          data[idx + 1] = 244;
          data[idx + 2] = 198;
          data[idx + 3] = alpha;
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    w,
    h,
    false
  );

  return { map, cloudMap };
}

export function createVenusTexture(): THREE.CanvasTexture {
  return createVenusTextures().map;
}

// ---------------------------------------------------------------------------
// 4. MOON (High-contrast basalt Maria basins, Tycho ejecta rays, deep craters)
// ---------------------------------------------------------------------------
export function createMoonTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const w = 512;
  const h = 256;
  const bumpBuf = new Uint8ClampedArray(w * h);

  // Near-side Mare clusters centered around u = 0.25 (+Z front camera view!)
  const mariaCircles = [
    { lon: 0.22 * Math.PI * 2, lat: 0.46, r: 0.34 }, // Mare Imbrium
    { lon: 0.31 * Math.PI * 2, lat: 0.34, r: 0.24 }, // Mare Serenitatis
    { lon: 0.38 * Math.PI * 2, lat: 0.14, r: 0.25 }, // Mare Tranquillitatis
    { lon: 0.14 * Math.PI * 2, lat: 0.15, r: 0.36 }, // Oceanus Procellarum
    { lon: 0.45 * Math.PI * 2, lat: 0.22, r: 0.16 }, // Mare Crisium
    { lon: 0.34 * Math.PI * 2, lat: -0.18, r: 0.2 } // Mare Nectaris
  ];

  const map = makeCanvasTexture(
    (ctx) => {
      const img = ctx.createImageData(w, h);
      const data = img.data;
      for (let py = 0; py < h; py++) {
        const v = py / h;
        const lat = (0.5 - v) * Math.PI;
        for (let px = 0; px < w; px++) {
          const u = px / w;
          const lon = u * Math.PI * 2;
          const [sx, sy, sz] = uvToSphereDir(u, v);

          const rock = fbm3D(sx * 3.8 + 4.1, sy * 3.8 + 9.2, sz * 3.8 + 1.5, 5);
          const fine = fbm3D(sx * 12.0 + 2.3, sy * 12.0 + 6.4, sz * 12.0 + 8.1, 3);

          let mareBlend = 0;
          for (const m of mariaCircles) {
            const d = angularDist(lon, lat, m.lon, m.lat);
            const warpedR = m.r * (0.85 + rock * 0.35);
            if (d < warpedR) {
              mareBlend = Math.max(mareBlend, Math.min(1, (warpedR - d) / 0.08));
            }
          }

          const highlandShade = 166 + rock * 56 + (fine - 0.5) * 28;
          const mareShade = 72 + rock * 28 + (fine - 0.5) * 18;
          const shade = highlandShade * (1 - mareBlend) + mareShade * mareBlend;

          const idx = (py * w + px) * 4;
          data[idx] = clampByte(shade);
          data[idx + 1] = clampByte(shade + 1);
          data[idx + 2] = clampByte(shade + 3);
          data[idx + 3] = 255;

          bumpBuf[py * w + px] = clampByte((1 - mareBlend) * (135 + fine * 55) + mareBlend * (85 + fine * 20));
        }
      }
      ctx.putImageData(img, 0, 0);

      // Iconic bright white Tycho & Copernicus ejecta ray craters on sunlit side!
      const rayCraters = [
        { cx: w * 0.25, cy: h * 0.72, rays: 18, len: 68, r: 9 }, // Tycho
        { cx: w * 0.21, cy: h * 0.44, rays: 14, len: 46, r: 8 } // Copernicus
      ];
      for (const rc of rayCraters) {
        for (let a = 0; a < rc.rays; a++) {
          const ang = (a / rc.rays) * Math.PI * 2 + hash2D(a, rc.cx) * 0.25;
          const rayLen = rc.len * (0.6 + hash2D(a, rc.cy) * 0.7);
          const grad = ctx.createLinearGradient(
            rc.cx,
            rc.cy,
            rc.cx + Math.cos(ang) * rayLen,
            rc.cy + Math.sin(ang) * rayLen
          );
          grad.addColorStop(0, 'rgba(248, 250, 252, 0.78)');
          grad.addColorStop(1, 'rgba(248, 250, 252, 0)');
          ctx.beginPath();
          ctx.moveTo(rc.cx, rc.cy);
          ctx.lineTo(rc.cx + Math.cos(ang) * rayLen, rc.cy + Math.sin(ang) * rayLen);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }
      }

      // Craters stamped cleanly on both color and bump buffer
      for (let i = 0; i < 95; i++) {
        const cx = hash2D(i, 1.3) * w;
        const cy = (0.1 + hash2D(i, 4.7) * 0.8) * h;
        const r = 3 + hash2D(i, 9.1) * 14;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(58, 62, 70, 0.44)';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(236, 240, 245, 0.52)';
        ctx.stroke();

        // Carve crater depression + bright rim directly into bumpBuf
        const minX = Math.max(0, Math.floor(cx - r - 2));
        const maxX = Math.min(w - 1, Math.ceil(cx + r + 2));
        const minY = Math.max(0, Math.floor(cy - r - 2));
        const maxY = Math.min(h - 1, Math.ceil(cy + r + 2));
        for (let py = minY; py <= maxY; py++) {
          for (let px = minX; px <= maxX; px++) {
            const dist = Math.hypot(px - cx, py - cy);
            const bIdx = py * w + px;
            if (dist < r * 0.78) {
              bumpBuf[bIdx] = clampByte(bumpBuf[bIdx] - 58 * (1 - dist / (r * 0.78)));
            } else if (dist <= r + 1.8) {
              bumpBuf[bIdx] = clampByte(bumpBuf[bIdx] + 46);
            }
          }
        }
      }
    },
    w,
    h,
    true
  );

  const bumpMap = createGrayscaleCanvasTexture(bumpBuf, w, h);
  return { map, bumpMap };
}

export function createMoonTexture(): THREE.CanvasTexture {
  return createMoonTextures().map;
}

// ---------------------------------------------------------------------------
// 5. EUROPA (Glacial white-blue ice shell, russet triple-band lineae + Chaos)
// ---------------------------------------------------------------------------
export function createEuropaTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const w = 512;
  const h = 256;
  const bumpBuf = new Uint8ClampedArray(w * h);

  const map = makeCanvasTexture(
    (ctx) => {
      const img = ctx.createImageData(w, h);
      const data = img.data;
      const chaosLon = 0.28 * Math.PI * 2;
      const chaosLat = 0.08;

      for (let py = 0; py < h; py++) {
        const v = py / h;
        const lat = (0.5 - v) * Math.PI;
        for (let px = 0; px < w; px++) {
          const u = px / w;
          const lon = u * Math.PI * 2;
          const [sx, sy, sz] = uvToSphereDir(u, v);

          const ice = fbm3D(sx * 3.0 + 11, sy * 3.0 + 4, sz * 3.0 + 8, 4);
          const dChaos = angularDist(lon, lat, chaosLon, chaosLat);
          const inChaos = dChaos < 0.34 + (ice - 0.5) * 0.25 && ice > 0.49;

          const idx = (py * w + px) * 4;
          const bIdx = py * w + px;
          if (inChaos) {
            // Conamara Chaos reddish-ochre salt evaporite disrupted ice matrix
            data[idx] = clampByte(174 + ice * 38);
            data[idx + 1] = clampByte(120 + ice * 36);
            data[idx + 2] = clampByte(92 + ice * 32);
            bumpBuf[bIdx] = clampByte(175 + ice * 60);
          } else {
            data[idx] = clampByte(216 + ice * 36);
            data[idx + 1] = clampByte(228 + ice * 24);
            data[idx + 2] = clampByte(242 + ice * 12);
            bumpBuf[bIdx] = clampByte(115 + ice * 35);
          }
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);

      // Bold triple-band reddish-brown hydrated salt fracture lineae across ice!
      for (let i = 0; i < 34; i++) {
        const y1 = hash2D(i, 1.1) * h;
        const y2 = hash2D(i, 3.3) * h;
        const cx1 = w * (0.28 + hash2D(i, 2.2) * 0.14);
        const cy1 = hash2D(i, 5.5) * h;
        const cx2 = w * (0.62 + hash2D(i, 4.4) * 0.14);
        const cy2 = hash2D(i, 7.7) * h;
        const width = 2.0 + hash2D(i, 9.9) * 2.4;

        ctx.beginPath();
        ctx.moveTo(0, y1);
        ctx.bezierCurveTo(cx1, cy1, cx2, cy2, w, y2);
        ctx.strokeStyle = i % 2 === 0 ? 'rgba(138, 66, 36, 0.72)' : 'rgba(166, 94, 58, 0.58)';
        ctx.lineWidth = width;
        ctx.stroke();

        // Bright fresh-ice central medial trough (classic Europa double-ridge signature)
        ctx.beginPath();
        ctx.moveTo(0, y1);
        ctx.bezierCurveTo(cx1, cy1, cx2, cy2, w, y2);
        ctx.strokeStyle = 'rgba(244, 249, 255, 0.78)';
        ctx.lineWidth = Math.max(0.8, width * 0.34);
        ctx.stroke();
      }
    },
    w,
    h,
    true
  );

  // Sync bump relief slightly from painted canvas luminance so lineae cast glint
  const ctx = (map.image as HTMLCanvasElement).getContext('2d')!;
  const pixels = ctx.getImageData(0, 0, w, h).data;
  for (let i = 0; i < w * h; i++) {
    const r = pixels[i * 4];
    const b = pixels[i * 4 + 2];
    if (r > b + 20) {
      bumpBuf[i] = 215; // Raised russet salt ridge
    }
  }
  const bumpMap = createGrayscaleCanvasTexture(bumpBuf, w, h);
  return { map, bumpMap };
}

export function createEuropaTexture(): THREE.CanvasTexture {
  return createEuropaTextures().map;
}

// ---------------------------------------------------------------------------
// 6. TITAN (Velvety burnt-tangerine photochemical smog + dark Kraken polar lakes)
// ---------------------------------------------------------------------------
export function createTitanTexture(): THREE.CanvasTexture {
  return makeCanvasTexture((ctx, w, h) => {
    const img = ctx.createImageData(w, h);
    const data = img.data;
    for (let py = 0; py < h; py++) {
      const v = py / h;
      const lat = (0.5 - v) * Math.PI;
      for (let px = 0; px < w; px++) {
        const u = px / w;
        const [sx, sy, sz] = uvToSphereDir(u, v);
        const band = fbm3D(sx * 1.4 + 16, sy * 6.0 + 2, sz * 1.4 + 16, 4);
        const polarLake = v < 0.24 && fbm3D(sx * 4.5 + 8, sy * 4.5, sz * 4.5 + 12, 4) < 0.45;
        const hood = lat > 1.05 ? 0.84 : 1.0;

        const idx = (py * w + px) * 4;
        if (polarLake) {
          data[idx] = 68;
          data[idx + 1] = 42;
          data[idx + 2] = 20;
        } else {
          data[idx] = clampByte((198 + band * 48) * hood);
          data[idx + 1] = clampByte((108 + band * 42) * hood);
          data[idx + 2] = clampByte((24 + band * 26) * hood);
        }
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
}

// ---------------------------------------------------------------------------
// 7. 16 PSYCHE (Metallic iron-nickel asteroid: craggy geometry + cratered steel map)
// ---------------------------------------------------------------------------
interface AsteroidCraterSpec {
  dir: [number, number, number];
  angularRadius: number;
  depth: number;
}

const PSYCHE_CRATERS: AsteroidCraterSpec[] = [
  { dir: [0.35, 0.22, 0.91], angularRadius: 0.44, depth: 0.24 }, // Huge front Meroe/Psyche bowl
  { dir: [-0.62, 0.14, 0.77], angularRadius: 0.34, depth: 0.2 },
  { dir: [0.82, -0.18, 0.54], angularRadius: 0.3, depth: 0.18 },
  { dir: [-0.25, -0.58, -0.77], angularRadius: 0.38, depth: 0.22 },
  { dir: [0.42, 0.65, -0.63], angularRadius: 0.28, depth: 0.16 },
  { dir: [-0.88, 0.32, -0.35], angularRadius: 0.36, depth: 0.2 },
  { dir: [0.1, -0.78, 0.61], angularRadius: 0.3, depth: 0.17 }
];

export function samplePsycheVertexOffset(dir: THREE.Vector3): THREE.Vector3 {
  const ux = dir.x;
  const uy = dir.y;
  const uz = dir.z;

  // Triaxial potato/dumbbell envelope + pinched middle saddle + planar shear facets
  let radial =
    1.0 +
    0.18 * Math.sin(ux * 2.9 + 0.4) * Math.cos(uy * 2.3) +
    0.11 * Math.cos(uz * 3.8 - 0.5) -
    0.16 * Math.exp(-ux * ux * 6.5) * (0.4 + 0.6 * Math.max(0, uy));

  // Carve spherical concave impact crater bowls with slightly raised rims
  for (const c of PSYCHE_CRATERS) {
    const dot = ux * c.dir[0] + uy * c.dir[1] + uz * c.dir[2];
    const ang = Math.acos(Math.max(-1, Math.min(1, dot)));
    if (ang < c.angularRadius) {
      const t = ang / c.angularRadius;
      // Concave parabola inside, slight raised rim near t=0.85..1.0
      const bowl = t < 0.8 ? -c.depth * (1 - (t / 0.8) ** 2) : c.depth * 0.18 * Math.sin(((t - 0.8) / 0.2) * Math.PI);
      radial += bowl;
    }
  }

  return new THREE.Vector3(ux * radial * 1.48, uy * radial * 0.72, uz * radial * 0.96).multiplyScalar(1.42);
}

/**
 * Generates a deterministically sculpted irregular potato/dumbbell metallic geometry for 16 Psyche.
 */
export function createPsycheAsteroidGeometry(): THREE.BufferGeometry {
  const geom = new THREE.SphereGeometry(1, 64, 48);
  const pos = geom.attributes.position;
  const dir = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    dir.fromBufferAttribute(pos, i).normalize();
    const sculpted = samplePsycheVertexOffset(dir);
    pos.setXYZ(i, sculpted.x, sculpted.y, sculpted.z);
  }
  geom.computeVertexNormals();
  return geom;
}

export function createAsteroidTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const w = 512;
  const h = 256;
  const bumpBuf = new Uint8ClampedArray(w * h);

  const map = makeCanvasTexture(
    (ctx) => {
      const img = ctx.createImageData(w, h);
      const data = img.data;
      const tmpDir = new THREE.Vector3();

      for (let py = 0; py < h; py++) {
        const v = py / h;
        const lat = (0.5 - v) * Math.PI;
        for (let px = 0; px < w; px++) {
          const u = px / w;
          const [sx, sy, sz] = uvToSphereDir(u, v);
          tmpDir.set(sx, sy, sz);

          const iron = fbm3D(sx * 4.5 + 21, sy * 4.5 + 5, sz * 4.5 + 11, 5);
          const vein = fbm3D(sx * 11.0 + 3, sy * 11.0 + 18, sz * 11.0 + 9, 3);

          // Highlight exposed silvery iron-nickel metallic rims around large craters
          let craterRimBoost = 0;
          let inCrater = 0;
          for (const c of PSYCHE_CRATERS) {
            const dot = sx * c.dir[0] + sy * c.dir[1] + sz * c.dir[2];
            const ang = Math.acos(Math.max(-1, Math.min(1, dot)));
            if (ang < c.angularRadius) {
              const t = ang / c.angularRadius;
              if (t > 0.72) craterRimBoost = Math.max(craterRimBoost, 1 - Math.abs(t - 0.88) * 5);
              else inCrater = Math.max(inCrater, 1 - t);
            }
          }

          const base = 76 + iron * 78 + (vein - 0.5) * 32 + craterRimBoost * 58 - inCrater * 24;
          const bronzeTint = iron > 0.6 ? 10 : 0;
          const idx = (py * w + px) * 4;
          data[idx] = clampByte(base + bronzeTint);
          data[idx + 1] = clampByte(base + 2 + bronzeTint * 0.4);
          data[idx + 2] = clampByte(base + 8);
          data[idx + 3] = 255;

          const bVal = 95 + vein * 95 + craterRimBoost * 55 - inCrater * 55;
          bumpBuf[py * w + px] = clampByte(bVal);

          // Subtle silicate dark patches
          if (lat > -0.6 && iron < 0.34) {
            data[idx] = clampByte(base * 0.78);
            data[idx + 1] = clampByte(base * 0.75);
            data[idx + 2] = clampByte(base * 0.74);
          }
        }
      }
      ctx.putImageData(img, 0, 0);

      for (let i = 0; i < 42; i++) {
        const cx = hash2D(i, 4.1) * w;
        const cy = (0.12 + hash2D(i, 8.2) * 0.76) * h;
        const r = 2.5 + hash2D(i, 11.3) * 10;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34, 38, 44, 0.48)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(218, 226, 236, 0.42)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    },
    w,
    h,
    true
  );

  const bumpMap = createGrayscaleCanvasTexture(bumpBuf, w, h);
  return { map, bumpMap };
}

export function createAsteroidTexture(): THREE.CanvasTexture {
  return createAsteroidTextures().map;
}

// ---------------------------------------------------------------------------
// 8. BACKDROP GIANT PLANETS (Jupiter + GRS for Europa, Saturn + Rings for Titan)
// ---------------------------------------------------------------------------
export function createJupiterTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(
    (ctx, w, h) => {
      for (let py = 0; py < h; py++) {
        const v = py / h;
        const belt =
          Math.sin(v * 24) * 0.42 + Math.cos(v * 46) * 0.28 + Math.sin(v * 9) * 0.3;
        const t = belt * 0.5 + 0.5;
        const r = clampByte(154 + t * 92);
        const g = clampByte(104 + t * 104);
        const b = clampByte(66 + t * 96);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, py, w, 1);
      }
      // Subtle atmospheric eddies
      ctx.fillStyle = 'rgba(248, 232, 206, 0.25)';
      for (let i = 0; i < 16; i++) {
        ctx.beginPath();
        ctx.ellipse(
          hash2D(i, 1.7) * w,
          (0.2 + hash2D(i, 5.1) * 0.6) * h,
          14 + hash2D(i, 8.3) * 20,
          3,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      // Great Red Spot positioned at u = 0.26 (+Z facing Europa & camera!)
      const grsGrad = ctx.createRadialGradient(w * 0.26, h * 0.62, 4, w * 0.26, h * 0.62, 26);
      grsGrad.addColorStop(0, '#dc2626');
      grsGrad.addColorStop(0.55, '#c2410c');
      grsGrad.addColorStop(1, 'rgba(194, 65, 12, 0)');
      ctx.fillStyle = grsGrad;
      ctx.beginPath();
      ctx.ellipse(w * 0.26, h * 0.62, 26, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    },
    256,
    128
  );
}

export function createSaturnTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(
    (ctx, w, h) => {
      for (let py = 0; py < h; py++) {
        const v = py / h;
        const band = Math.sin(v * 20) * 0.5 + Math.cos(v * 38) * 0.22 + 0.5;
        const r = clampByte(198 + band * 44);
        const g = clampByte(174 + band * 44);
        const b = clampByte(120 + band * 42);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, py, w, 1);
      }
    },
    256,
    128
  );
}

export function createSunTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(
    (ctx, w, h) => {
      const img = ctx.createImageData(w, h);
      const data = img.data;
      for (let py = 0; py < h; py++) {
        const v = py / h;
        for (let px = 0; px < w; px++) {
          const u = px / w;
          const [sx, sy, sz] = uvToSphereDir(u, v);
          const plasma = fbm3D(sx * 6.5 + 1.3, sy * 6.5 + 4.2, sz * 6.5 + 2.1, 4);
          const flare = fbm3D(sx * 14.0 + 9.0, sy * 14.0 + 3.0, sz * 14.0 + 7.0, 3);
          const hot = plasma * 0.65 + flare * 0.35;
          const idx = (py * w + px) * 4;
          data[idx] = 255;
          data[idx + 1] = clampByte(150 + hot * 105);
          data[idx + 2] = clampByte(25 + hot * 120);
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    256,
    128
  );
}

export function createSaturnRingTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(
    (ctx, w, h) => {
      // Horizontal axis represents radial distance from inner C-ring (x=0) to outer A-ring (x=w)
      for (let px = 0; px < w; px++) {
        const t = px / (w - 1);
        let alpha = 0;
        let lum = 225;
        if (t < 0.12) {
          alpha = (t / 0.12) * 0.28; // Faint C-ring
          lum = 175;
        } else if (t < 0.54) {
          alpha = 0.72 + Math.sin(t * 70) * 0.14; // Dense bright B-ring
          lum = 232 + Math.sin(t * 95) * 18;
        } else if (t < 0.63) {
          alpha = 0.06; // Crisp Cassini Division gap!
          lum = 90;
        } else if (t < 0.94) {
          const encke = t > 0.83 && t < 0.855 ? 0.12 : 0.62;
          alpha = encke + Math.sin(t * 90) * 0.08; // Outer A-ring
          lum = 212;
        } else {
          alpha = Math.max(0, 1 - (t - 0.94) / 0.06) * 0.25;
          lum = 195;
        }
        ctx.fillStyle = `rgba(${clampByte(lum)}, ${clampByte(lum * 0.91)}, ${clampByte(lum * 0.72)}, ${alpha.toFixed(3)})`;
        ctx.fillRect(px, 0, 1, h);
      }
    },
    256,
    32
  );
}

// ---------------------------------------------------------------------------
// 9. CACHED MINIATURE THUMBNAIL RENDERER (True World Swatches for Body Picker)
// ---------------------------------------------------------------------------
const thumbnailCache = new Map<CelestialBodyId, string>();

export function getBodyThumbnailUrl(bodyId: CelestialBodyId): string {
  const existing = thumbnailCache.get(bodyId);
  if (existing) return existing;

  const size = 96;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  if (bodyId === 'lagrange') {
    // Huge blazing Sun dwarfing Earth & Moon on L2 axis
    const sunHalo = ctx.createRadialGradient(14, 16, 4, 14, 16, 36);
    sunHalo.addColorStop(0, '#fef9c3');
    sunHalo.addColorStop(0.42, '#f59e0b');
    sunHalo.addColorStop(0.7, 'rgba(249, 115, 22, 0.35)');
    sunHalo.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = sunHalo;
    ctx.beginPath();
    ctx.arc(14, 16, 36, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(14, 16, 20, 0, Math.PI * 2);
    ctx.fill();

    // Small Earth
    const earthGrad = ctx.createRadialGradient(48, 49, 1, 50, 50, 9);
    earthGrad.addColorStop(0, '#38bdf8');
    earthGrad.addColorStop(0.65, '#1d4ed8');
    earthGrad.addColorStop(1, '#020617');
    ctx.fillStyle = earthGrad;
    ctx.beginPath();
    ctx.arc(50, 50, 8.5, 0, Math.PI * 2);
    ctx.fill();

    // Tiny Moon
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(41, 61, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // L2 Halo Orbit ellipse + golden L2 beacon
    ctx.strokeStyle = '#fbbf24';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(73, 66, 13, 8, -0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(73, 66, 3.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (bodyId === 'asteroid') {
    // Sculpted irregular dumbbell potato asteroid with dark iron-nickel shading & craters
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(14, 52);
    ctx.bezierCurveTo(10, 30, 32, 22, 47, 29);
    ctx.bezierCurveTo(56, 33, 66, 23, 80, 30);
    ctx.bezierCurveTo(90, 38, 86, 62, 72, 68);
    ctx.bezierCurveTo(58, 73, 50, 64, 38, 68);
    ctx.bezierCurveTo(22, 73, 15, 62, 14, 52);
    ctx.closePath();
    const astGrad = ctx.createRadialGradient(34, 38, 6, 48, 48, 42);
    astGrad.addColorStop(0, '#cbd5e1');
    astGrad.addColorStop(0.45, '#64748b');
    astGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = astGrad;
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.clip();

    const craters: [number, number, number][] = [
      [38, 44, 9],
      [64, 42, 7],
      [52, 57, 6],
      [27, 55, 5]
    ];
    for (const [x, y, r] of craters) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.55)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.restore();
  } else {
    // Draw Saturn backdrop first for Titan, Jupiter backdrop first for Europa!
    if (bodyId === 'titan') {
      ctx.fillStyle = '#e7d4a5';
      ctx.beginPath();
      ctx.arc(70, 26, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(70, 26, 20, 5.5, -0.32, 0, Math.PI * 2);
      ctx.stroke();
    } else if (bodyId === 'europa') {
      const jGrad = ctx.createLinearGradient(54, 14, 86, 44);
      jGrad.addColorStop(0, '#f5deb3');
      jGrad.addColorStop(0.5, '#b45309');
      jGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = jGrad;
      ctx.beginPath();
      ctx.arc(70, 26, 15, 0, Math.PI * 2);
      ctx.fill();
    }

    const r = 30;
    const sphereX = bodyId === 'titan' || bodyId === 'europa' ? 40 : cx;
    const sphereY = bodyId === 'titan' || bodyId === 'europa' ? 54 : cy;

    ctx.save();
    ctx.beginPath();
    ctx.arc(sphereX, sphereY, r, 0, Math.PI * 2);
    ctx.clip();

    if (bodyId === 'earth') {
      ctx.fillStyle = '#0c4a9e';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#228b4c';
      ctx.beginPath();
      ctx.ellipse(sphereX - 9, sphereY - 6, 12, 15, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(sphereX + 12, sphereY + 7, 10, 12, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(sphereX - r, sphereY - r, r * 2, 6);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillRect(sphereX - 24, sphereY - 10, 32, 4);
      ctx.fillRect(sphereX - 6, sphereY + 8, 28, 3);
    } else if (bodyId === 'mars') {
      ctx.fillStyle = '#c85a32';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#6d2a16';
      ctx.beginPath();
      ctx.ellipse(sphereX + 8, sphereY - 4, 11, 14, 0.2, 0, Math.PI * 2);
      ctx.fill();
      // Valles Marineris scar
      ctx.strokeStyle = '#4c1b0e';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(sphereX - 20, sphereY + 3);
      ctx.quadraticCurveTo(sphereX, sphereY + 8, sphereX + 16, sphereY + 2);
      ctx.stroke();
      // White Polar cap
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(sphereX, sphereY - r + 3, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (bodyId === 'venus') {
      const vGrad = ctx.createLinearGradient(0, sphereY - r, 0, sphereY + r);
      vGrad.addColorStop(0, '#fef9c3');
      vGrad.addColorStop(0.5, '#eab308');
      vGrad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = vGrad;
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = 'rgba(254, 249, 195, 0.65)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sphereX - 28, sphereY - 12);
      ctx.quadraticCurveTo(sphereX + 8, sphereY, sphereX - 28, sphereY + 12);
      ctx.stroke();
    } else if (bodyId === 'moon') {
      ctx.fillStyle = '#b6bcc6';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#5b616d';
      ctx.beginPath();
      ctx.arc(sphereX - 7, sphereY - 8, 12, 0, Math.PI * 2);
      ctx.arc(sphereX + 10, sphereY - 2, 9, 0, Math.PI * 2);
      ctx.fill();
      // Tycho crater + rays
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.72)';
      ctx.lineWidth = 1.2;
      for (let a = 0; a < 8; a++) {
        const ang = (a / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(sphereX, sphereY + 14);
        ctx.lineTo(sphereX + Math.cos(ang) * 16, sphereY + 14 + Math.sin(ang) * 16);
        ctx.stroke();
      }
    } else if (bodyId === 'europa') {
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = '#9a4626';
      ctx.lineWidth = 2;
      for (const [x1, y1, x2, y2] of [
        [-28, -14, 28, 12],
        [-24, 18, 26, -16],
        [-10, -28, 18, 28],
        [-28, 4, 28, 8]
      ]) {
        ctx.beginPath();
        ctx.moveTo(sphereX + x1, sphereY + y1);
        ctx.lineTo(sphereX + x2, sphereY + y2);
        ctx.stroke();
      }
    } else if (bodyId === 'titan') {
      const tGrad = ctx.createRadialGradient(sphereX - 8, sphereY - 8, 4, sphereX, sphereY, r);
      tGrad.addColorStop(0, '#fb923c');
      tGrad.addColorStop(0.7, '#d97706');
      tGrad.addColorStop(1, '#7c2d12');
      ctx.fillStyle = tGrad;
      ctx.fillRect(0, 0, size, size);
    }

    // Terminator spherical shadow overlay
    const shade = ctx.createRadialGradient(sphereX - 11, sphereY - 12, 4, sphereX + 6, sphereY + 6, r * 1.25);
    shade.addColorStop(0, 'rgba(255,255,255,0.16)');
    shade.addColorStop(0.65, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(2,6,23,0.72)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, size, size);
    ctx.restore();

    if (bodyId === 'titan') {
      // Iconic thin pale-blue detached upper haze ring
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.7)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(sphereX, sphereY, r + 1.8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  const dataUrl = canvas.toDataURL('image/png');
  thumbnailCache.set(bodyId, dataUrl);
  return dataUrl;
}


// ---------------------------------------------------------------------------
// 10. MODULE-LEVEL LAZY TEXTURE & GEOMETRY CACHE (Zero rebuilds on tab switch)
// ---------------------------------------------------------------------------
let earthCache: ReturnType<typeof createEarthTextures> | null = null;
let marsCache: ReturnType<typeof createMarsTextures> | null = null;
let venusCache: ReturnType<typeof createVenusTextures> | null = null;
let moonCache: ReturnType<typeof createMoonTextures> | null = null;
let europaCache: ReturnType<typeof createEuropaTextures> | null = null;
let titanCache: THREE.CanvasTexture | null = null;
let asteroidCache: ReturnType<typeof createAsteroidTextures> | null = null;
let jupiterCache: THREE.CanvasTexture | null = null;
let saturnCache: THREE.CanvasTexture | null = null;
let saturnRingCache: THREE.CanvasTexture | null = null;
let sunCache: THREE.CanvasTexture | null = null;
let psycheGeomCache: THREE.BufferGeometry | null = null;

export const getCachedEarthTextures = () => (earthCache ??= createEarthTextures());
export const getCachedMarsTextures = () => (marsCache ??= createMarsTextures());
export const getCachedVenusTextures = () => (venusCache ??= createVenusTextures());
export const getCachedMoonTextures = () => (moonCache ??= createMoonTextures());
export const getCachedEuropaTextures = () => (europaCache ??= createEuropaTextures());
export const getCachedTitanTexture = () => (titanCache ??= createTitanTexture());
export const getCachedAsteroidTextures = () => (asteroidCache ??= createAsteroidTextures());
export const getCachedJupiterTexture = () => (jupiterCache ??= createJupiterTexture());
export const getCachedSaturnTexture = () => (saturnCache ??= createSaturnTexture());
export const getCachedSaturnRingTexture = () => (saturnRingCache ??= createSaturnRingTexture());
export const getCachedSunTexture = () => (sunCache ??= createSunTexture());
export const getCachedPsycheGeometry = () => (psycheGeomCache ??= createPsycheAsteroidGeometry());
