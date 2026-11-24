import { describe, expect, it } from 'vitest';
import { CORRECT_SLOT, initialBoard, placeWire } from '../../src/toys/breadboard/breadboard';

describe('placeWire', () => {
  it('sends the wire back to the tray on a wrong slot', () => {
    const { state, result } = placeWire(initialBoard(), 'a');
    expect(result).toBe('wrong');
    expect(state).toEqual({ wire: 'tray', closed: false });
  });
  it('closes the circuit on the correct slot', () => {
    expect(CORRECT_SLOT).toBe('b');
    const { state, result } = placeWire(placeWire(initialBoard(), 'a').state, 'b');
    expect(result).toBe('closed');
    expect(state).toEqual({ wire: 'b', closed: true });
  });
  it('keeps a closed board unchanged', () => {
    const closed = placeWire(initialBoard(), 'b').state;
    const { state, result } = placeWire(closed, 'c');
    expect(result).toBe('already-closed');
    expect(state).toEqual({ wire: 'b', closed: true });
  });
  it('does not mutate the input state', () => {
    const start = initialBoard();
    placeWire(start, 'b');
    expect(start).toEqual({ wire: 'tray', closed: false });
  });
});
