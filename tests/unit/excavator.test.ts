import { describe, expect, it } from 'vitest';
import { DRIVE, Excavator, actuators, clampDrive, nearestLift, pose, stickEnd, wheelTurn } from '../../src/toys/excavator/excavator';

describe('pose', () => {
  it('rests the bucket in the brick pile and lifts it high at the top', () => {
    expect(stickEnd(pose(0)).y).toBeGreaterThan(185);
    expect(stickEnd(pose(1)).y).toBeLessThan(80);
  });

  it('raises the boom steadily as the lift grows', () => {
    const booms = [0, 0.25, 0.5, 0.75, 1].map((l) => pose(l).boom);
    for (let i = 1; i < booms.length; i++) expect(booms[i]).toBeLessThan(booms[i - 1]);
  });

  it('clamps lift outside 0 to 1', () => {
    expect(pose(-1)).toEqual(pose(0));
    expect(pose(2)).toEqual(pose(1));
  });
});

describe('nearestLift', () => {
  it('finds the lift that puts the bucket where the pointer is', () => {
    for (const l of [0, 0.3, 0.7, 1]) expect(nearestLift(stickEnd(pose(l)))).toBeCloseTo(l, 1);
  });

  it('clamps pointers far beyond either end of the reach', () => {
    expect(nearestLift({ x: 320, y: 900 })).toBe(0);
    expect(nearestLift({ x: 320, y: -900 })).toBe(1);
  });
});

describe('Excavator', () => {
  it('starts loaded, dumps at the top and stays completed', () => {
    const ex = new Excavator();
    expect(ex.loaded).toBe(true);
    expect(ex.completed).toBe(false);
    expect(ex.set(0.5)).toBeNull();
    expect(ex.set(0.95)).toBe('dumped');
    expect(ex.loaded).toBe(false);
    expect(ex.completed).toBe(true);
    expect(ex.set(0.99)).toBeNull();
  });

  it('reloads when the empty bucket goes back into the pile', () => {
    const ex = new Excavator();
    ex.set(1);
    expect(ex.set(0.5)).toBeNull();
    expect(ex.set(0.05)).toBe('loaded');
    expect(ex.loaded).toBe(true);
    expect(ex.completed).toBe(true);
  });

  it('ignores non-numbers', () => {
    const ex = new Excavator();
    expect(ex.set(Number.NaN)).toBeNull();
    expect(ex.lift).toBe(0);
  });
});

describe('actuators', () => {
  const len = (s: { a: { x: number; y: number }; b: { x: number; y: number } }) => Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y);

  it('extends the boom cylinder as the boom rises', () => {
    expect(len(actuators(pose(1)).boom)).toBeGreaterThan(len(actuators(pose(0)).boom) + 15);
  });

  it('extends the bucket cylinder as the bucket tips to dump', () => {
    expect(len(actuators(pose(1)).bucket)).toBeGreaterThan(len(actuators(pose(0.9)).bucket));
  });
});

describe('driving', () => {
  it('keeps the excavator on the baseplate', () => {
    expect(clampDrive(-500)).toBe(DRIVE.min);
    expect(clampDrive(500)).toBe(DRIVE.max);
    expect(clampDrive(10)).toBe(10);
    expect(clampDrive(Number.NaN)).toBe(0);
  });

  it('turns a wheel by the distance rolled over its radius', () => {
    expect(wheelTurn(2 * Math.PI * 10, 10)).toBeCloseTo(360);
    expect(wheelTurn(-Math.PI * 10, 10)).toBeCloseTo(-180);
  });
});
