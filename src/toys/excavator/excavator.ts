// A mini Technic excavator seen from the side. All coordinates are in the toy's SVG space (y points down) and all
// angles are absolute, in degrees, measured from +x (negative = upwards).

export const PIVOT = { x: 165, y: 165 } as const;
export const BOOM_LEN = 130;
export const STICK_LEN = 90;
/** Lift at which the bucket tips and the bricks fall out. */
export const DUMP_AT = 0.92;
/** Lift below which an empty bucket scoops up a fresh load. */
export const LOAD_AT = 0.08;

export interface Pose {
  boom: number;
  stick: number;
  bucket: number;
}
export interface Point {
  x: number;
  y: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Arm angles for a lift from 0 (bucket in the brick pile) to 1 (raised and tipped). */
export function pose(lift: number): Pose {
  const l = clamp01(lift);
  const carry = Math.min(l / DUMP_AT, 1);
  const tip = Math.max(0, (l - DUMP_AT) / (1 - DUMP_AT));
  return {
    boom: lerp(-8, -58, l),
    stick: lerp(33, -12, l),
    // The bucket curls up to hold its load while lifting, then tips forward at the top.
    bucket: lerp(60, 0, carry) + tip * 115,
  };
}

/** Where the bucket hangs (the end of the stick) for a pose. */
export function stickEnd(p: Pose): Point {
  const bx = PIVOT.x + BOOM_LEN * Math.cos(rad(p.boom));
  const by = PIVOT.y + BOOM_LEN * Math.sin(rad(p.boom));
  return { x: bx + STICK_LEN * Math.cos(rad(p.stick)), y: by + STICK_LEN * Math.sin(rad(p.stick)) };
}

const rotate = (p: Point, deg: number): Point => {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
};

/** Where each linear actuator is pinned, in the local space of the part it is drawn in. */
export const ACTUATOR_PINS = {
  /** Body (SVG space) to a bracket under the boom (boom space). */
  boom: { base: { x: 185, y: 195 }, grip: { x: 58, y: -2 } },
  /** Boom elbow (boom space) to the stick's tail (stick space). */
  stick: { base: { x: 70, y: -34 }, grip: { x: -14, y: -14 } },
  /** Top of the stick (stick space) to the bucket's lever (bucket space). */
  bucket: { base: { x: 14, y: -12 }, grip: { x: -8, y: -8 } },
} as const;

export interface Segment {
  a: Point;
  b: Point;
}

/**
 * The three cylinders for a pose. The boom cylinder is in SVG space, the stick cylinder in boom space and the bucket
 * cylinder in stick space, so each can be drawn inside the group of the part it is mounted on.
 */
export function actuators(p: Pose): { boom: Segment; stick: Segment; bucket: Segment } {
  const g = rotate(ACTUATOR_PINS.boom.grip, p.boom);
  const s = rotate(ACTUATOR_PINS.stick.grip, p.stick - p.boom);
  const b = rotate(ACTUATOR_PINS.bucket.grip, p.bucket - p.stick);
  return {
    boom: { a: ACTUATOR_PINS.boom.base, b: { x: PIVOT.x + g.x, y: PIVOT.y + g.y } },
    stick: { a: ACTUATOR_PINS.stick.base, b: { x: BOOM_LEN + s.x, y: s.y } },
    bucket: { a: ACTUATOR_PINS.bucket.base, b: { x: STICK_LEN + b.x, y: b.y } },
  };
}

const SAMPLES = 200;
const path = Array.from({ length: SAMPLES + 1 }, (_, i) => stickEnd(pose(i / SAMPLES)));

/** The lift that brings the bucket closest to a pointer. Pointers beyond the reach clamp to the nearest end. */
export function nearestLift(pt: Point): number {
  let best = 0;
  let bestD = Infinity;
  path.forEach((q, i) => {
    const d = (q.x - pt.x) ** 2 + (q.y - pt.y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best / SAMPLES;
}

/** Lift, load and completion. Completion (the first dump) is permanent. */
export class Excavator {
  private l = 0;
  private full = true;
  private done = false;

  set(lift: number): 'dumped' | 'loaded' | null {
    if (!Number.isFinite(lift)) return null;
    this.l = clamp01(lift);
    if (this.full && this.l >= DUMP_AT) {
      this.full = false;
      this.done = true;
      return 'dumped';
    }
    if (!this.full && this.l <= LOAD_AT) {
      this.full = true;
      return 'loaded';
    }
    return null;
  }

  get lift(): number {
    return this.l;
  }
  get loaded(): boolean {
    return this.full;
  }
  get completed(): boolean {
    return this.done;
  }
}

/** How far the excavator can drive from where it starts (SVG units), staying on the baseplate. */
export const DRIVE = { min: -24, max: 60 } as const;

export function clampDrive(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(DRIVE.max, Math.max(DRIVE.min, x));
}

/** Degrees a wheel of radius `r` turns when it rolls `distance` units. */
export function wheelTurn(distance: number, r: number): number {
  return (distance / r) * (180 / Math.PI);
}
