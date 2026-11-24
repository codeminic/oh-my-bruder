import { describe, expect, it } from 'vitest';
import { getMotionMode } from '../../src/lib/motion';

describe('getMotionMode', () => {
  it('honours reduced motion on any screen', () => {
    expect(getMotionMode({ reducedMotion: true, viewportWidth: 1400 })).toBe('reduced');
    expect(getMotionMode({ reducedMotion: true, viewportWidth: 320 })).toBe('reduced');
  });
  it('simplifies below 768px', () => {
    expect(getMotionMode({ reducedMotion: false, viewportWidth: 400 })).toBe('simple');
    expect(getMotionMode({ reducedMotion: false, viewportWidth: 767 })).toBe('simple');
  });
  it('runs the full show from 768px', () => {
    expect(getMotionMode({ reducedMotion: false, viewportWidth: 768 })).toBe('full');
  });
});
