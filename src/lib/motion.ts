export type MotionMode = 'full' | 'simple' | 'reduced';

export const SMALL_SCREEN_MAX = 767;

export function getMotionMode(opts: { reducedMotion: boolean; viewportWidth: number }): MotionMode {
  if (opts.reducedMotion) return 'reduced';
  if (opts.viewportWidth <= SMALL_SCREEN_MAX) return 'simple';
  return 'full';
}
