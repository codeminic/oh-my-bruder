# Excavator Toy Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace the Lego era's gear train toy with a mini Technic excavator that you work by lifting its bucket.

**Architecture:** Pure kinematics and state in `excavator.ts`. An Astro component draws an SVG with nested
boom › stick › bucket groups and wires up Draggable and the keyboard. The toy id changes from `gears` to `excavator`.

**Tech Stack:** Astro 7, GSAP Draggable, TypeScript strict, vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-27-excavator-toy-design.md`

## Global Constraints

- No third-party requests. JS stays under 200 KB.
- The story text doesn't depend on the toy.
- Only the bucket has `touch-action: none`.
- EN and DE strings for the hint and the done text.

## Review Focus

- The page is scrolled thousands of px on the stage: dragging must still map correctly. Covered by an e2e test
  (drag to the top completes).
- Dragging far outside the arm's reach: the lift clamps to 0–1. Covered by the unit test for `nearestLift`.
- Keyboard users: arrows, Home and End. Covered by an e2e test.
- Touch scrolling over the toy. Covered by an e2e test.

---

### Task 1: Kinematics and state (`src/toys/excavator/excavator.ts`, `tests/unit/excavator.test.ts`)

**Produces:**
- `pose(lift: number): { boom: number; stick: number; bucket: number }`, with absolute angles in degrees. The input is
  clamped to 0–1.
- `stickEnd(p: Pose): { x: number; y: number }`, in SVG coordinates.
- `nearestLift(pt: { x: number; y: number }): number`
- `class Excavator`:
  - `set(lift): 'dumped' | 'loaded' | null`
  - getters `lift`, `loaded` and `completed`
- Constants `PIVOT`, `BOOM_LEN`, `STICK_LEN`, `DUMP_AT = 0.92`, `LOAD_AT = 0.08`.

**Tests:**
- `pose(0)` puts the stick end in the pile (y > 200).
- `pose(1)` raises it above y < 80.
- The boom angle changes monotonically.
- `nearestLift(stickEnd(pose(x))) ≈ x` for x in {0, 0.3, 0.7, 1}.
- Far-away points clamp to 0 or 1.
- `Excavator`:
  - it starts loaded;
  - `set(0.95)` returns `'dumped'`, completes, and empties the bucket;
  - `set(0.5)` then returns null;
  - `set(0.05)` returns `'loaded'`;
  - it stays completed.

### Task 2: Component (`src/toys/excavator/Excavator.astro`) and the swap

- Remove `src/toys/gears/` and `tests/unit/gears.test.ts`.
- Toy enum and `ToyId`: `gears` → `excavator`. Update `lego.yaml`, `EraSection.astro` and `story.test.ts`.
- i18n: `toyGearsHint`/`toyGearsDone` → `toyExcavatorHint`/`toyExcavatorDone` (EN and DE).
- e2e (`toys.spec.ts`, replacing the gear block):
  - dragging the bucket up raises `aria-valuenow` above 90, sets `data-complete=true` and shows `.toy-done`;
  - the keyboard (End) completes it;
  - only the bucket has `touch-action: none`.
- Verify:
  - `npm test`, `npm run check` and `npm run e2e` all green;
  - look at it in the browser.
