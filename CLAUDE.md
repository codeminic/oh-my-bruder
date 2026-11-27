# Interactive CV: project memory

Dominic Baumgartner's interactive CV. A scroll-driven life story (Lego Technic → electronics apprenticeship →
software engineering) in English and German. Built and merged to `main` on 2026-11-24.

- Design (the source of truth): `docs/superpowers/specs/2026-11-24-interactive-cv-design.md`
- Implementation plan (done): `docs/superpowers/plans/2026-11-24-interactive-cv.md`
- How to edit content: `README.md`

## Stack and commands

Astro 7 (static) + GSAP (ScrollTrigger, Draggable) + TypeScript strict. **Node 24 is required** (`nvm use`, see `.nvmrc`).

```bash
npm run dev            # http://localhost:4321
npm test               # vitest unit tests (tests/unit)
npm run check          # astro check, should be 0 errors
npm run e2e            # Playwright: desktop, Pixel 7, 320px narrow (builds + previews on port 4399)
npm run check:content  # missing German text + every remaining PLACEHOLDER (content and pages)
```

At last run: 38 unit tests, 79 e2e tests, 0 type errors.

Gotchas:
- `astro preview` in Astro 7 uses a lock file. Something on this machine kept an orphaned preview running on 4321,
  so Playwright uses port 4399 with `--ignore-lock` and `reuseExistingServer: false`.
- Install Playwright browsers once with `npx playwright install chromium`.
- npm 11 blocks install scripts. esbuild works anyway.

## Where things live

- Content (no code changes needed): `src/content/chapters/*.yaml`, `src/content/eras/*.yaml`,
  `src/content/profile/profile.yaml`. The schemas are in `src/content.config.ts`.
- Story logic (pure, unit-tested): `src/lib/story.ts` (`buildStory`, EN fallback, `findMissingTranslations`,
  `yearsOfExperience`). `src/lib/content.ts` loads the collections.
- UI strings: `src/i18n/ui.ts`. Language helpers: `src/i18n/lang.ts`.
- Worlds (era backdrops): `src/worlds/{lego,electronics,software}/World.astro`. Scroll choreography:
  `src/scripts/scrollStory.ts`. Motion modes (`full` / `simple` / `reduced`): `src/lib/motion.ts`.
- Toys, each with pure logic in a `.ts` file plus a component: `src/toys/excavator`, `src/toys/breadboard`, `src/toys/code`.
- Legal pages: `src/pages/[lang]/impressum.astro`, `src/pages/[lang]/privacy.astro`.

## Owner's decisions (don't undo without asking)

- **Public personal data: email only** (`dominic@baumgartner.rocks`). No phone, street address, birthday or
  LinkedIn. The Impressum shows name + email. (If the site is ever judged commercial under Swiss UWG, a postal
  address may be needed.)
- Owner is in Switzerland, so: Impressum + privacy page in both languages, self-hosted fonts, no tracking,
  zero third-party requests (an e2e test enforces this).
- Surname **Baumgartner** only. No mention of the birth name.
- The 2-month Swiss Life stint (Dec 2024) is deliberately left out. Current job: **Bühler, System Architect /
  Senior Software Engineer, since 2025**.
- Visual direction: "the world changes with you", one toy per era, the computer fascination lives inside the Lego
  era (three worlds, not four).
- Story text must never depend on JS or toys. Chapter text is never animated from hidden.

## Open items: content the owner still has to supply

These are marked `PLACEHOLDER:`, and `npm run check:content` lists them all:
1. The Lego Technic story (`lego-technic.yaml`: years, title, story, photo alt)
2. The first-computer story (`first-computer.yaml`)
3. The exact Bühler start month and what the owner works on now (`buehler-today.yaml`)
4. The hosting provider and server-log retention (`privacy.astro`, both languages)
5. Real photos. The Lego chapter has a placeholder image at `src/content/chapters/images/placeholder-lego.png`.

When the owner sends text, write both EN and DE, keep the tone first person, short and pragmatic, and run
`npm run check:content`.

## Calls made on the owner's behalf (worth confirming)

- `careerStartYear: 2014` (the spec said 2015). The CV counted "10 years" in Dec 2024. Years of experience are
  computed at build time.
- The EN/DE chapter texts were drafted from the CV by Claude, so the owner should read them in their own voice.
- The breadboard row buttons shrink to about 29px on 320px screens to avoid overlapping (still above WCAG's 24px).

## Not done yet (deferred, owner to decide)

- Hosting/deploy is not set up and there is no git remote yet.
- Colour contrast and iOS Safari haven't been checked on a real device.
- Minor review leftovers:
  - Chapter `years` must be a quoted string. `z.coerce.string()` would allow bare numbers.
  - A partly translated chapter gets `lang="en"` on the whole article, not just on the fallback fields.
  - Without JS the toys render but do nothing (`.toy-slot` could be hidden until JS is ready).
  - The DE fallback e2e test only covers the all-translated case (the fallback itself is unit-tested).

## Working conventions

- TDD: write the failing test first. Unit tests for pure logic, Playwright for behaviour.
- Commit messages end with a `Co-Authored-By` line for Claude.
