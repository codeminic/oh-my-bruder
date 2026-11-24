export const GEAR_TEETH = [24, 12, 36] as const;
export const FULL_TURN = 360;

/** Rotation of every gear in a simple train, given the driver's rotation. Meshing gears counter-rotate. */
export function propagateRotation(driverDeg: number, teeth: readonly number[]): number[] {
  const angles = [driverDeg];
  for (let i = 1; i < teeth.length; i++) {
    // `+ 0` normalises -0 so a resting train reports 0, not -0.
    angles.push(-angles[i - 1] * (teeth[i - 1] / teeth[i]) + 0);
  }
  return angles;
}

/** Tracks how far the driver has been turned, in either direction. Completion is permanent. */
export class GearProgress {
  private total = 0;
  private done = false;

  add(deltaDeg: number): void {
    if (this.done || !Number.isFinite(deltaDeg)) return;
    this.total += Math.abs(deltaDeg);
    if (this.total >= FULL_TURN) this.done = true;
  }

  get completed(): boolean {
    return this.done;
  }
}
