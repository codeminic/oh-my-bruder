# Scroll stage: design

Date: 2026-11-26. Follows `2026-11-24-interactive-cv-design.md`.

## Why

The owner found the built CV "cool but way less fancy than anticipated". What they had in mind: scrolling does not
move the page down, it is how you move through the sections and the timeline. The screen is a stage, and scrolling
plays the story forward and back.

## Decisions

- **Feel (owner picked from prototypes A/B/C): continuous + snap.** The scene follows the scroll exactly, and when
  scrolling stops it settles on the nearest chapter, so text always comes to rest fully readable.
- **Visuals (owner handed these to Claude, "give it a go"):**
  - Hero → Lego: the name lifts away while bricks rain down into the Lego world.
  - Lego world: bricks drift at different depths (parallax), gears turn with the scroll.
  - Lego → electronics: the camera dives into the brick-built computer's screen; bricks scatter, the sky turns
    green, the circuit board comes up from inside the screen and its copper traces draw themselves in.
  - Electronics world: small pulses of current run along the traces.
  - Electronics → software: a CRT power-on. A bright line opens up into the dark code world.
  - Software world: code drifts past with the scroll, and the prompt line types itself.
  - Chapter cards rise in from below with a slight 3D tilt, and leave upwards.
  - A timeline bar along the bottom (era segments, one dot per chapter, progress fill). Every dot is a real link to
    the chapter.
- **Toys are stops** on the timeline: one step each, after the era's chapters.

## How it works

- Progressive enhancement. The HTML stays the readable long page from the first spec. JS switches on the stage by
  adding `html.is-stage` only after it has finished setting up, so a JS failure leaves the normal page.
- Stage mode: `main` becomes a fixed, clipped full-screen stage. Every step (hero, chapter, toy, contact) is
  absolutely positioned on it. A spacer gives the document its scroll length. Native scrolling stays, so trackpads,
  touch, keyboard (space, arrows, Page Down), and the scrollbar keep working.
- One GSAP timeline in "step time" (1 unit = one step) holds all the world and card animation. Scroll position maps
  to step time. Steps whose content is taller than the screen get extra scroll length ("dwell"), during which their
  content scrolls up inside the stage, without step time advancing.
- Snapping: a ScrollTrigger snap function settles on the nearest rest position. Inside a tall step it doesn't snap.
- Deep links (`#ch-…`, `#toy-…`, `#contact`), the timeline links and keyboard focus moving into a step all move the
  stage to that step. The language switch keeps pointing at the current step.
- Pure layout maths (step positions, progress, snap targets) live in `src/lib/stage.ts` and are unit-tested.

## Modes

- `full` (desktop) and `simple` (phones): both get the stage. `simple` drops the ambient effects (the current pulses).
- `reduced` (prefers-reduced-motion) and no JS: the normal long page, as before.

## A deliberate change to an earlier rule

The first spec said chapter text is never animated from hidden. In stage mode only the current step is shown, which
the owner asked for. The rule's purpose is kept: text never depends on JS (no JS or reduced motion gives the full
page), the stage only switches on once it's ready, and the text of every step is fully opaque when the stage rests on
it (an e2e test checks this).

## Non-goals

- No WebGL or 3D engine. GSAP + SVG/CSS only, staying under the 200 KB JS budget with zero third-party requests.
- No new content and no changes to the content files.
