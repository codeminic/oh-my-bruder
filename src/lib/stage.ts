/**
 * Layout maths for the scroll stage: where each step rests on the scroll axis, how scroll maps to
 * "step time" (1 unit = one step), and where scrolling should settle. Pure, so it is unit-tested.
 */
export interface StageLayout {
  /** Scroll position where each step arrives. */
  starts: number[];
  /** Scroll position where each step starts to leave (start + dwell for tall steps). */
  ends: number[];
  /** Scroll length between one step's end and the next step's start. */
  transition: number;
  /** Scroll position of the last step's end. */
  total: number;
}

/** How far a scroll has to go into a transition before a directional snap carries on to the next step. */
const DIRECTIONAL_THRESHOLD = 0.08;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function layoutStage(dwells: number[], transition: number): StageLayout {
  const starts: number[] = [];
  const ends: number[] = [];
  let y = 0;
  dwells.forEach((dwell, i) => {
    if (i > 0) y += transition;
    starts.push(y);
    y += Math.max(0, dwell);
    ends.push(y);
  });
  return { starts, ends, transition, total: y };
}

/** Index of the transition `y` falls in (between step i and i + 1), or -1 if it rests inside a step. */
function transitionAt(y: number, l: StageLayout): number {
  for (let i = 0; i < l.starts.length - 1; i++) {
    if (y > l.ends[i] && y < l.starts[i + 1]) return i;
  }
  return -1;
}

export function stageTime(y: number, l: StageLayout): number {
  const last = l.starts.length - 1;
  if (y <= 0) return 0;
  if (y >= l.total) return last;
  const i = transitionAt(y, l);
  if (i >= 0) return i + (y - l.ends[i]) / l.transition;
  return l.starts.findIndex((s, k) => y >= s && y <= l.ends[k]);
}

/** 0..1 progress through a tall step's extra scroll; 0 for steps that fit the screen. */
export function dwellProgress(step: number, y: number, l: StageLayout): number {
  const dwell = l.ends[step] - l.starts[step];
  if (dwell <= 0) return 0;
  return clamp01((y - l.starts[step]) / dwell);
}

/** Where scrolling should come to rest. `direction` is the last scroll direction (1 down, -1 up, 0 unknown). */
export function snapTarget(y: number, l: StageLayout, direction: number): number {
  if (y <= 0) return 0;
  if (y >= l.total) return y;
  const i = transitionAt(y, l);
  if (i < 0) return y;
  const from = l.ends[i];
  const to = l.starts[i + 1];
  const frac = (y - from) / l.transition;
  if (direction > 0 && frac > DIRECTIONAL_THRESHOLD) return to;
  if (direction < 0 && frac < 1 - DIRECTIONAL_THRESHOLD) return from;
  return frac < 0.5 ? from : to;
}
