import { describe, expect, it } from 'vitest';
import { GEAR_TEETH, GearProgress, propagateRotation } from '../../src/toys/gears/gears';

describe('propagateRotation', () => {
  it('turns meshing gears in opposite directions by tooth ratio', () => {
    expect(propagateRotation(90, [24, 12, 36])).toEqual([90, -180, 60]);
  });
  it('mirrors for backwards rotation', () => {
    expect(propagateRotation(-90, [24, 12, 36])).toEqual([-90, 180, -60]);
  });
  it('uses the shipped gear train by default shape', () => {
    expect(GEAR_TEETH).toEqual([24, 12, 36]);
  });
});

describe('GearProgress', () => {
  it('counts rotation in either direction', () => {
    const p = new GearProgress();
    p.add(200);
    p.add(-200);
    expect(p.completed).toBe(true);
  });
  it('is not complete before a full turn', () => {
    const p = new GearProgress();
    p.add(359);
    expect(p.completed).toBe(false);
  });
  it('stays complete and survives huge input', () => {
    const p = new GearProgress();
    p.add(360);
    expect(() => p.add(1e9)).not.toThrow();
    p.add(-5);
    expect(p.completed).toBe(true);
  });
  it('ignores non-finite input', () => {
    const p = new GearProgress();
    p.add(Number.NaN);
    p.add(Number.POSITIVE_INFINITY);
    expect(p.completed).toBe(false);
  });
});
