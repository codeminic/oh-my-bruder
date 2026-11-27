# Excavator toy (replaces the gear train): design

Approved 2026-11-27.

## Why

The owner found the Lego era's toy (three flat gears) too plain. A Lego Technic era should have a small machine you
can actually work: a mini excavator whose bucket you lift.

## Goals, non-goals

- Goal: a side view of a Technic excavator. It has tracks, a cab, and an arm of studded beams with pin holes and a
  hydraulic cylinder. You lift the bucket out of a brick pile; at the top it tips and the bricks tumble out.
- Goal: one control. You drag the bucket (the arm and the bucket's tilt follow); the arrow keys do the same. It
  works at 320px.
- Non-goal: separate levers for the boom, stick and bucket.
- Anti-goal: the toy stopping the page from scrolling on touch screens. Only the bucket captures touch.

## Approaches

1. **One drag handle on the bucket. Picked.** It is simplest to find and works on phones.
2. Three levers like a real excavator. More authentic, but fiddly on small screens.
3. A crank gear that drives the arm. Keeps the gear theme, but you lift the bucket only indirectly.

## Design

- The toy id `gears` becomes `excavator`, and the anchor becomes `#toy-excavator`. The gear toy is removed. The
  Lego world's background gears stay.
- Pure logic lives in `src/toys/excavator/excavator.ts`:
  - `pose(lift)` maps lift 0–1 to the absolute angles of the boom, stick and bucket.
  - `stickEnd(pose)` is the forward kinematics.
  - `nearestLift(point)` turns a pointer position into a lift value, using the nearest sample on the bucket's path.
  - The `Excavator` state is `lift`, `loaded` and `completed`. It dumps at the top and is completed for good after
    the first dump. Lowering the bucket into the pile reloads it.
- The SVG is drawn as nested groups (boom › stick › bucket), so a render only sets three rotations. A small gear at
  the boom pivot turns with the boom. The cylinder is redrawn between its two anchor points.
- Accessibility: the bucket is a `role="slider"` with `aria-valuenow` from 0 to 100. Up/Right lift it, Down/Left
  lower it, and Home/End jump to either end.
- On completion it dispatches `cv:toy-complete` and shows the "done" text, the same as the other toys.

## Left to the builder

The exact angles, colours and brick bounce, and the EN/DE wording of the hint and done text (Claude drafts it; the
owner reviews it).
