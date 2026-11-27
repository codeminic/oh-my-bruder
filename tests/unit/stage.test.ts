import { describe, expect, it } from 'vitest';
import { dwellProgress, layoutStage, snapTarget, stageTime } from '../../src/lib/stage';

// Three steps: a short one, a tall one (200px extra), a short one. 100px of scroll between steps.
const layout = layoutStage([0, 200, 0], 100);

describe('layoutStage', () => {
  it('places each step after the previous step and one transition', () => {
    expect(layout.starts).toEqual([0, 100, 400]);
    expect(layout.ends).toEqual([0, 300, 400]);
    expect(layout.total).toBe(400);
  });

  it('treats negative dwell as none', () => {
    expect(layoutStage([0, -50], 100).ends).toEqual([0, 100]);
  });
});

describe('stageTime', () => {
  it('advances by one per transition and holds still during a dwell', () => {
    expect(stageTime(0, layout)).toBe(0);
    expect(stageTime(50, layout)).toBe(0.5);
    expect(stageTime(100, layout)).toBe(1);
    expect(stageTime(250, layout)).toBe(1);
    expect(stageTime(300, layout)).toBe(1);
    expect(stageTime(350, layout)).toBe(1.5);
    expect(stageTime(400, layout)).toBe(2);
  });

  it('clamps outside the stage', () => {
    expect(stageTime(-30, layout)).toBe(0);
    expect(stageTime(900, layout)).toBe(2);
  });
});

describe('dwellProgress', () => {
  it('is 0 to 1 across a tall step and pinned outside it', () => {
    expect(dwellProgress(1, 50, layout)).toBe(0);
    expect(dwellProgress(1, 200, layout)).toBe(0.5);
    expect(dwellProgress(1, 380, layout)).toBe(1);
  });

  it('is always 0 for a step without dwell', () => {
    expect(dwellProgress(0, 50, layout)).toBe(0);
  });
});

describe('snapTarget', () => {
  it('leaves rest positions and tall steps alone', () => {
    expect(snapTarget(100, layout, 0)).toBe(100);
    expect(snapTarget(220, layout, 1)).toBe(220);
  });

  it('settles on the nearest step when not moving', () => {
    expect(snapTarget(30, layout, 0)).toBe(0);
    expect(snapTarget(70, layout, 0)).toBe(100);
    expect(snapTarget(330, layout, 0)).toBe(300);
  });

  it('follows the scroll direction once it has moved a little', () => {
    expect(snapTarget(25, layout, 1)).toBe(100);
    expect(snapTarget(5, layout, 1)).toBe(0);
    expect(snapTarget(75, layout, -1)).toBe(0);
    expect(snapTarget(395, layout, -1)).toBe(400);
  });

  it('does not snap before the start or past the end (the footer lives there)', () => {
    expect(snapTarget(-5, layout, -1)).toBe(0);
    expect(snapTarget(450, layout, 1)).toBe(450);
  });
});
