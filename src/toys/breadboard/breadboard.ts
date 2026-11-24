export type SlotId = 'a' | 'b' | 'c';
export const SLOTS: readonly SlotId[] = ['a', 'b', 'c'];
export const CORRECT_SLOT: SlotId = 'b';

export type BoardState = { wire: 'tray' | SlotId; closed: boolean };
export type PlaceResult = 'closed' | 'wrong' | 'already-closed';

export function initialBoard(): BoardState {
  return { wire: 'tray', closed: false };
}

export function placeWire(state: BoardState, slot: SlotId): { state: BoardState; result: PlaceResult } {
  if (state.closed) return { state, result: 'already-closed' };
  if (slot === CORRECT_SLOT) return { state: { wire: slot, closed: true }, result: 'closed' };
  return { state: { wire: 'tray', closed: false }, result: 'wrong' };
}
