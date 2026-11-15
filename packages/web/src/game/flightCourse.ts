import * as THREE from 'three';

export const COURSE_LANE_LIMIT = 6.2;

export interface FlightGateWaypoint {
  index: number;
  progress: number;
  targetX: number;
  radius: number;
  label: string;
}

export interface FlightCourse {
  orbitId: string;
  name: string;
  difficultyLabel: string;
  gateRadius: number;
  gates: FlightGateWaypoint[];
}

interface CourseBlueprint {
  name: string;
  difficultyLabel: string;
  gateRadius: number;
  offsetsX: number[];
}

const DEFAULT_BLUEPRINT: CourseBlueprint = {
  name: 'LEO Coastal Arc',
  difficultyLabel: 'CADET TRACK',
  gateRadius: 2.65,
  offsetsX: [0.0, -1.0, -2.0, -2.2, -1.0, 0.8, 2.2, 1.6]
};

const COURSE_BLUEPRINTS: Record<string, CourseBlueprint> = {
  'orbit-leo-400': DEFAULT_BLUEPRINT,
  'orbit-sso-700': {
    name: 'Polar SSO Corridor',
    difficultyLabel: 'STANDARD TRACK',
    gateRadius: 2.55,
    offsetsX: [0.5, 1.8, 2.6, 2.0, 0.2, -1.6, -2.8, -2.2, -0.6]
  },
  'orbit-geo-35786': {
    name: 'Geosync Ascent Arc',
    difficultyLabel: 'STANDARD TRACK',
    gateRadius: 2.5,
    offsetsX: [-0.6, -2.0, -3.0, -2.2, -0.2, 1.8, 3.0, 2.4, 0.8]
  },
  'orbit-lunar-polar-100': {
    name: 'Trans-Lunar Highway',
    difficultyLabel: 'ADVANCED TRACK',
    gateRadius: 2.45,
    offsetsX: [0.4, 1.8, 3.0, 3.2, 1.6, -0.6, -2.6, -3.4, -1.8]
  },
  'orbit-venus-cloud-300': {
    name: 'Venusian Cloud Sweep',
    difficultyLabel: 'ADVANCED TRACK',
    gateRadius: 2.4,
    offsetsX: [-0.8, -2.4, -3.4, -2.6, -0.4, 1.8, 3.4, 3.0, 1.0]
  },
  'orbit-mars-science-380': {
    name: 'Ares Orbital Corridor',
    difficultyLabel: 'ADVANCED TRACK',
    gateRadius: 2.4,
    offsetsX: [0.6, 2.0, 3.2, 3.4, 1.8, -0.2, -2.2, -3.6, -2.8, -1.0]
  },
  'orbit-lagrange-l2': {
    name: 'L2 Halo Highway',
    difficultyLabel: 'FLAGSHIP CIRCUIT',
    gateRadius: 2.35,
    offsetsX: [-0.6, -2.2, -3.6, -3.8, -2.2, 0.0, 2.4, 3.8, 3.0, 1.0]
  },
  'orbit-psyche-metal-120': {
    name: 'Belt Trajectory 16-Psyche',
    difficultyLabel: 'FLAGSHIP CIRCUIT',
    gateRadius: 2.35,
    offsetsX: [0.8, 2.4, 3.8, 3.4, 1.4, -1.0, -3.2, -4.0, -2.8, -0.8]
  },
  'orbit-europa-polar-200': {
    name: 'Jovian Radiation Sweep',
    difficultyLabel: 'FLAGSHIP CIRCUIT',
    gateRadius: 2.3,
    offsetsX: [-0.8, -2.6, -4.0, -3.6, -1.4, 1.2, 3.4, 4.2, 2.8, 0.6]
  },
  'orbit-titan-haze-1200': {
    name: 'Saturnian Apex Arc',
    difficultyLabel: 'MASTER TRACK',
    gateRadius: 2.25,
    offsetsX: [0.8, 2.6, 4.2, 4.0, 1.8, -0.8, -3.2, -4.4, -3.2, -0.8]
  }
};

/** Build a deterministic 3D gate sequence along a broad, readable orbital corridor. */
export function getFlightCourseForOrbit(orbitId: string): FlightCourse {
  const bp = COURSE_BLUEPRINTS[orbitId] || DEFAULT_BLUEPRINT;
  const count = bp.offsetsX.length;
  const startP = 12;
  const endP = 94;
  const step = count > 1 ? (endP - startP) / (count - 1) : 0;

  const gates: FlightGateWaypoint[] = bp.offsetsX.map((targetX, idx) => ({
    index: idx,
    progress: Math.round((startP + idx * step) * 10) / 10,
    targetX,
    radius: bp.gateRadius,
    label: `RING ${idx + 1}`
  }));

  return {
    orbitId,
    name: bp.name,
    difficultyLabel: bp.difficultyLabel,
    gateRadius: bp.gateRadius,
    gates
  };
}

/** Longitudinal vertical (Y) and downrange (-Z) gravity-turn spine from 0% to 100%. */
export function sampleSpineYZ(progressPercent: number): { y: number; z: number } {
  const s = Math.max(0, Math.min(1, progressPercent / 100));
  return {
    y: s * 84.0 + 2.2,
    z: -Math.pow(s, 1.32) * 72.0
  };
}

/** C1-continuous Catmull-Rom lateral lane X centerline passing smoothly through every gate without artificial zigzags. */
export function sampleCourseLaneX(course: FlightCourse, progressPercent: number): number {
  const p = Math.max(0, Math.min(100, progressPercent));
  if (p <= 2) return 0;

  const lastX = course.gates[course.gates.length - 1]?.targetX ?? 0;
  const anchors: { p: number; x: number }[] = [
    { p: 2, x: 0 },
    ...course.gates.map((g) => ({ p: g.progress, x: g.targetX })),
    { p: 100, x: lastX * 0.5 }
  ];

  for (let i = 0; i < anchors.length - 1; i++) {
    const p1 = anchors[i];
    const p2 = anchors[i + 1];
    if (p >= p1.p && p <= p2.p) {
      const p0 = anchors[Math.max(0, i - 1)];
      const p3 = anchors[Math.min(anchors.length - 1, i + 2)];
      const span = Math.max(0.001, p2.p - p1.p);
      const t = (p - p1.p) / span;
      const t2 = t * t;
      const t3 = t2 * t;
      const v =
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      return THREE.MathUtils.clamp(v, -COURSE_LANE_LIMIT, COURSE_LANE_LIMIT);
    }
  }
  return lastX * 0.5;
}

/** Full 3D center point on the flight course for a given ascent percentage. */
export function getCourseCenterPoint(course: FlightCourse, progressPercent: number, out = new THREE.Vector3()): THREE.Vector3 {
  const { y, z } = sampleSpineYZ(progressPercent);
  const x = sampleCourseLaneX(course, progressPercent);
  return out.set(x, y, z);
}

/** Normalized forward tangent vector of the ascent spine (in YZ + course X) at a given percentage. */
export function getCourseTangent(course: FlightCourse, progressPercent: number, includeLateral = true): THREE.Vector3 {
  const p0 = Math.max(0, progressPercent - 0.5);
  const p1 = Math.min(100, progressPercent + 0.5);
  const a = includeLateral
    ? getCourseCenterPoint(course, p0, new THREE.Vector3())
    : (() => {
        const yz = sampleSpineYZ(p0);
        return new THREE.Vector3(0, yz.y, yz.z);
      })();
  const b = includeLateral
    ? getCourseCenterPoint(course, p1, new THREE.Vector3())
    : (() => {
        const yz = sampleSpineYZ(p1);
        return new THREE.Vector3(0, yz.y, yz.z);
      })();
  return b.sub(a).normalize();
}
