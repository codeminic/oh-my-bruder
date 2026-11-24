# Interactive CV Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A bilingual (EN/DE), scroll-driven life-story site whose visual world morphs from Lego → electronics → software, with one optional toy per era. It works on desktop and mobile.

**Architecture:** An Astro static site. Eras and chapters live in content collections (YAML) with EN/DE fields side by side, and a pure `buildStory()` turns them into a localized, ordered story. The page is fully readable as plain HTML. One GSAP ScrollTrigger script adds the era morphing on top. Each toy is a self-contained Astro component with its logic in a pure TS module, so the logic can be unit-tested.

**Tech Stack:** Astro 7, TypeScript (strict), GSAP 3.15 (ScrollTrigger, Draggable), Vitest 5, Playwright 1.65, @fontsource (self-hosted fonts).

**Spec:** `docs/superpowers/specs/2026-11-24-interactive-cv-design.md`

## Global Constraints

- Node ≥ 22.23.4, which Astro 7 requires. The machine currently has v20.20.0: install Node 24 LTS (e.g. `nvm install 24`) and commit `.nvmrc` containing `24`.
- Static output only (`output: 'static'`). No backend, no contact form, no CMS, no analytics, no blog.
- Locales `en` and `de`, both URL-prefixed (`/en/`, `/de/`). English is the default and the fallback.
- Owner is in Switzerland: an Impressum and a privacy page in both languages, linked from a permanent footer. Fonts are self-hosted, with no third-party embeds, no tracking and **zero runtime requests to other origins**.
- **Scrolling alone must tell the full story.** Toys are optional, and no chapter text may depend on a toy or on JS running.
- Respect `prefers-reduced-motion: reduce`: era transitions become crossfades, autoplay stops, toys still work.
- On small screens (`max-width: 767px`) era transitions are simplified, the code toy uses tappable choices instead of free typing, and the breadboard wire can be tapped into place.
- Toys must be operable by touch, mouse and keyboard.
- Adding a chapter to an existing era must require **no code changes**, only a YAML file in `src/content/chapters/`.
- Placeholder content is marked with the literal prefix `PLACEHOLDER:` so it's easy to find and replace.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Missing German translation:** a chapter with only `en` text renders its English text on `/de/` instead of crashing or showing blank, and `npm run check:content` lists it. Covered in Task 2.
2. **JS disabled or failing:** every chapter title and story is visible (not stuck at opacity 0 by animation start states). Covered in Task 3 (no-JS) and Task 4 (after scroll and under reduced motion).
3. **Narrow phone (320px wide):** no horizontal page scroll in any era, and the toys fit. Covered in Task 3, with each toy task re-checking its own section.
4. **Language switch mid-story:** switching on chapter N lands on chapter N in the other language. Covered in Task 3.
5. **Toy misuse:** spinning the gear backwards or far past 360°, dropping the wire on a wrong slot, or entering an empty or very long string in the code toy never leaves a broken or unrecoverable state. Covered in Tasks 5–7.

---

## File Structure

```
astro.config.mjs              i18n + static config
vitest.config.ts
playwright.config.ts          desktop + "Pixel 7" + 320px projects
src/
  content.config.ts           collections: eras, chapters, profile (zod schemas)
  content/eras/*.yaml         lego, electronics, software
  content/chapters/*.yaml     one file per chapter (+ images/)
  content/profile/profile.yaml  name, tagline, contact links, impressum data
  i18n/lang.ts                Lang type, detectPreferredLang, localizedPath, t()
  i18n/ui.ts                  UI strings {en, de}
  lib/story.ts                buildStory, findMissingTranslations
  lib/motion.ts               getMotionMode
  layouts/BaseLayout.astro    html shell, fonts, tokens, footer
  components/                 Story, EraSection, Chapter, Snapshot, ContactSection, LangSwitch, Footer
  worlds/{lego,electronics,software}/World.astro   era backdrop art (SVG/CSS)
  scripts/scrollStory.ts      GSAP ScrollTrigger choreography
  scripts/langSwitch.ts       keeps the switch link's #hash on the current chapter
  toys/gears/{GearTrain.astro,gears.ts}
  toys/breadboard/{Breadboard.astro,breadboard.ts}
  toys/code/{CodeToy.astro,codeToy.ts}
  pages/index.astro           language redirect
  pages/[lang]/index.astro, impressum.astro, privacy.astro
scripts/check-content.ts      prints missing translations + remaining PLACEHOLDERs
tests/unit/*.test.ts
tests/e2e/*.spec.ts
README.md                     how to add a chapter / translate / run
```

---

### Task 1: Scaffold, i18n routing, language detection

**Files:**
- Create: `.nvmrc`, `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `src/i18n/lang.ts`, `src/i18n/ui.ts`, `src/layouts/BaseLayout.astro`, `src/pages/index.astro`, `src/pages/[lang]/index.astro`
- Test: `tests/unit/lang.test.ts`, `tests/e2e/routing.spec.ts`

**Interfaces:**
- Produces:
  - `type Lang = 'en' | 'de'`; `const LANGS: readonly Lang[]`
  - `detectPreferredLang(languages: readonly string[], stored?: string | null): Lang`: a valid `stored` value wins, otherwise the first entry whose primary subtag is `de` or `en`, otherwise `'en'`
  - `localizedPath(lang: Lang, path?: string, hash?: string): string`, e.g. `('de','impressum')` → `/de/impressum/`, `('en','', 'ch-apprenticeship')` → `/en/#ch-apprenticeship`
  - `t(lang: Lang, key: UiKey): string`, with `UiKey` the keys of `ui.ts`
  - `BaseLayout` props: `{ lang: Lang; title: string; description?: string }`. It sets `<html lang>` and loads self-hosted fonts via `@fontsource` imports.
  - Storage key for the chosen language: `localStorage['cv-lang']`

- [ ] **Step 1:** `nvm install 24 && nvm use 24`. Run `npm create astro@latest . -- --template minimal --typescript strict --no-git --install`, then add `gsap@3.15.1`, the dev dependencies `vitest@5.1.1` and `@playwright/test@1.65.1`, plus one `@fontsource/*` body font and one mono font (builder's choice). Add the scripts `dev`, `build`, `preview`, `test` (vitest run), `e2e` (playwright test --trace off) and `check:content`.
- [ ] **Step 2:** In `astro.config.mjs` set `i18n: { locales: ['en','de'], defaultLocale: 'en', routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false } }` and `output: 'static'`. Configure Playwright with a `webServer` that runs `npm run build && npm run preview`, and three projects: `desktop` (1280×800), `mobile` (`devices['Pixel 7']`) and `narrow` (320×640).
- [ ] **Step 3: Write failing unit tests** in `tests/unit/lang.test.ts`:
  ```ts
  expect(detectPreferredLang(['de-CH','en'])).toBe('de');
  expect(detectPreferredLang(['fr-CH','en-GB'])).toBe('en');
  expect(detectPreferredLang(['fr','it'])).toBe('en');
  expect(detectPreferredLang([])).toBe('en');
  expect(detectPreferredLang(['de'], 'en')).toBe('en');
  expect(detectPreferredLang(['de'], 'xx')).toBe('de');
  expect(localizedPath('de','impressum')).toBe('/de/impressum/');
  expect(localizedPath('en','', 'ch-x')).toBe('/en/#ch-x');
  ```
- [ ] **Step 4:** Run `npm test`. Expected: FAIL (module not found).
- [ ] **Step 5:** Implement `src/i18n/lang.ts` and `src/i18n/ui.ts` (initial keys: `skipToStory`, `switchLanguage`, `impressum`, `privacy`, `contact`, plus one key per toy prompt as toys are added). Run `npm test`. Expected: PASS.
- [ ] **Step 6: Write failing e2e** `tests/e2e/routing.spec.ts`: `/en/` has `html[lang=en]` and `/de/` has `html[lang=de]`. Visiting `/` with context `locale: 'de-CH'` ends on `/de/`, and with `locale: 'fr-FR'` ends on `/en/`. `/` contains a `<noscript>` link to `/en/`.
- [ ] **Step 7:** Implement `src/pages/index.astro`: a minimal page with an inline script calling `location.replace(localizedPath(detectPreferredLang(navigator.languages, localStorage cv-lang)))`, with try/catch around storage, and a `<noscript>` link. `[lang]/index.astro` uses `getStaticPaths` over `LANGS` and renders `BaseLayout` with a placeholder heading. Run `npm run e2e`. Expected: PASS on all three projects.
- [ ] **Step 8:** Commit `chore: scaffold Astro site with EN/DE routing`.

---

### Task 2: Content model, story builder, placeholder content, README

**Files:**
- Create: `src/content.config.ts`, `src/content/eras/{lego,electronics,software}.yaml`, `src/content/chapters/*.yaml` (placeholders), `src/content/profile/profile.yaml`, `src/lib/story.ts`, `scripts/check-content.ts`, `README.md`
- Test: `tests/unit/story.test.ts`

**Interfaces:**
- Consumes: `Lang` (Task 1)
- Produces:
  - Schema `localized = z.object({ en: z.string().min(1), de: z.string().optional() })`
  - `eras` entry: `{ id: 'lego'|'electronics'|'software', order: number, title: localized, toy: 'gears'|'breadboard'|'code' }`
  - `chapters` entry: `{ era: reference('eras'), order: number, years: string, title: localized, story: localized, photos?: { src: image(), alt: localized }[], facts?: { role?: localized, org?: string, tech?: string[] }, links?: { label: localized, url: string (url) }[], projects?: { name: string, years: string, summary: localized, url?: string }[] }`. The entry `id` (the file name) becomes the anchor `ch-<id>`.
  - `profile`: `{ name: string, careerStartYear: number, tagline: localized, email: string, skills: { group: localized, items: string[] }[], certifications: { year: number, name: string }[], languages: { name: localized, level: localized }[], interests: { name: localized, text: localized }[], impressum: { name: string, email: string } }`. There's no phone, address or birthday field, by the owner's decision.
  - `yearsOfExperience(careerStartYear: number, now: Date): number`, i.e. `now.getFullYear() - careerStartYear`, used in the tagline
  - `type StoryChapter = { id: string; anchor: string; years: string; title: string; story: string; photos: {src: ImageMetadata; alt: string}[]; facts?: {...localized → string}; links: {label: string; url: string}[]; projects: {name: string; years: string; summary: string; url?: string}[]; fallback: boolean }`
  - `type StoryEra = { id: EraId; title: string; toy: ToyId; chapters: StoryChapter[] }`
  - `buildStory(eras: EraData[], chapters: ChapterData[], lang: Lang): StoryEra[]`: eras sorted by `order` and chapters sorted by `order` within each era. `de` falls back to `en` and sets `fallback: true`. Throws `Error('Chapter "<id>" references unknown era "<era>"')`.
  - `findMissingTranslations(chapters: ChapterData[]): string[]`, returning entries like `"<chapter-id>: title"` or `"<chapter-id>: story"`

- [ ] **Step 1: Write failing tests** in `tests/unit/story.test.ts` using plain fixture objects (no Astro runtime):
  - Eras given out of order come back as `['lego','electronics','software']`, and chapters within an era are sorted by `order`.
  - A chapter with `de` missing, built for `'de'`, has English `title` and `fallback === true`. Built for `'en'`, it has `fallback === false`.
  - A chapter with no `photos`, `facts`, `links` or `projects` builds with `photos: []`, `links: []` and `projects: []`.
  - A project whose `summary.de` is missing, built for `'de'`, uses the English summary and sets the chapter's `fallback === true`. `findMissingTranslations` reports it as `'<id>: projects[0].summary'`.
  - `yearsOfExperience(2015, new Date('2026-11-24')) === 11`.
  - An unknown era throws the exact message above.
  - `findMissingTranslations` returns `['ch-a: story']` for a chapter whose `story.de` is missing.
  - `anchor === 'ch-' + id`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement `src/lib/story.ts`. `EraData` and `ChapterData` are plain types mirroring the schemas, with `era` as a string id, so the module doesn't depend on `astro:content`. Run `npm test`. Expected: PASS.
- [ ] **Step 4:** Write `src/content.config.ts` with `glob`/`file` loaders and the three era YAMLs. Create the nine chapters and `profile.yaml` exactly per the spec's **Content** table. Write real EN + DE text drafted from the CV facts in that table: first person, short (2–4 sentences per story), plain and pragmatic in tone. Chapters still waiting on the owner (`lego-technic`, `first-computer`) and the exact start month in `buehler-today` get text starting with `PLACEHOLDER:`. Give one chapter a placeholder photo in `src/content/chapters/images/`.
- [ ] **Step 5:** Implement `scripts/check-content.ts`, run via `npm run check:content` (`tsx` or `node --experimental-strip-types`). It reads the YAML files, prints missing translations and every remaining `PLACEHOLDER:` occurrence with its file, and always exits with code 0. Expected output for the placeholder content: no missing translations and a list of placeholders.
- [ ] **Step 6:** Write `README.md`: requirements (Node 24), running locally, **how to add a chapter** (copy a YAML, set `era` and `order`, add `de`), adding a photo, running `check:content`, and a note that a new era needs code (a world, a toy and `EraId`).
- [ ] **Step 7:** Run `npm test && npm run build`. Expected: both pass (the build validates the schemas). Commit `feat: content model and story builder with placeholder content`.

---

### Task 3: Story markup, language switch, legal pages, footer (no JS needed)

**Files:**
- Create: `src/components/{Story,EraSection,Chapter,Snapshot,ContactSection,LangSwitch,Footer}.astro`, `src/scripts/langSwitch.ts`, `src/pages/[lang]/impressum.astro`, `src/pages/[lang]/privacy.astro`
- Modify: `src/pages/[lang]/index.astro`, `src/layouts/BaseLayout.astro`
- Test: `tests/e2e/story.spec.ts`

**Interfaces:**
- Consumes: `buildStory`, `StoryEra`, `localizedPath`, `t`, `profile`
- Produces (DOM contract for Tasks 4–7):
  - `<section class="era" data-era="<id>" id="era-<id>">` contains `<div class="era-world">` (the backdrop slot), the `<article class="chapter" id="ch-<id>" data-chapter>` elements and `<div class="toy-slot" data-toy="<toyId>">`.
  - `<section id="contact" data-era="today">` is the Today + contact section.
  - `<a class="lang-switch" hreflang="de|en">` links to the other locale. It is `position: fixed` so it's always visible, and the e2e test asserts it's in the viewport after scrolling to `#contact`.
  - `<footer>` links to the impressum and privacy pages.
  - Chapters with `fallback: true` get `lang="en"` on the article.

- [ ] **Step 1: Write failing e2e** `tests/e2e/story.spec.ts`:
  - With `javaScriptEnabled: false` on `/en/` and `/de/`: every `[data-chapter]` and its `h2` is visible, there are 3 `.era` sections in the order lego, electronics, software, `#contact` is visible, and the contact section has a `mailto:` link.
  - Language switch: on `/en/`, scroll `#ch-apprenticeship` into view and click `.lang-switch`. The URL is `/de/#ch-apprenticeship` and that chapter is in the viewport. Clicking also sets `localStorage['cv-lang'] === 'de'`.
  - Footer: `/de/` → impressum link resolves to `/de/impressum/` with status 200 and contains the profile's impressum name. Same for privacy, and for `/en/`.
  - `narrow` project: `document.documentElement.scrollWidth <= window.innerWidth` on `/en/` and `/de/`, scrolled through to the bottom.
  - Third-party requests: collect `page.on('request')` across a full scroll of `/en/`. Every URL's origin equals `baseURL`'s origin.
- [ ] **Step 2:** Run `npm run e2e -- tests/e2e/story.spec.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement the components using semantic HTML (one `h1` with the profile name and tagline, an `h2` per chapter). `Snapshot` renders photos with `astro:assets` `<Image>` inside a frame element classed `snapshot snapshot--<era>`. Facts render as a `<dl>`, links as a list, and projects as a compact list (name · years, summary, optional link). `ContactSection` renders the tagline (with `yearsOfExperience`), skills, certifications, languages, an "off the keyboard" interests block and a `mailto:` link. The e2e test asserts that no `tel:` link or birthday appears anywhere. The legal pages render `profile.impressum` (name + email only) and a short privacy text (in `ui.ts` or a localized Markdown file) stating that there's no tracking, no cookies and self-hosted fonts, plus the hosting provider's server logs left as a `PLACEHOLDER:`.
- [ ] **Step 4:** Implement `src/scripts/langSwitch.ts`: an `IntersectionObserver` over `[data-chapter]` updates `.lang-switch`'s `href` hash to the most visible chapter, and on click it writes `cv-lang` (try/catch). Without JS the link still points to the other locale's root.
- [ ] **Step 5:** Run `npm run e2e`. Expected: PASS on all projects. Commit `feat: readable story markup, language switch and legal pages`.

---

### Task 4: Era worlds and scroll choreography

**Files:**
- Create: `src/worlds/{lego,electronics,software}/World.astro`, `src/lib/motion.ts`, `src/scripts/scrollStory.ts`, `src/styles/tokens.css`
- Modify: `src/components/EraSection.astro` (renders the matching `World`), `src/layouts/BaseLayout.astro`
- Test: `tests/unit/motion.test.ts`, `tests/e2e/motion.spec.ts`

**Interfaces:**
- Consumes: DOM contract from Task 3
- Produces:
  - `type MotionMode = 'full' | 'simple' | 'reduced'`
  - `getMotionMode(opts: { reducedMotion: boolean; viewportWidth: number }): MotionMode`: `reduced` if `reducedMotion`, else `simple` if `viewportWidth < 768`, else `full`
  - `initScrollStory(root: HTMLElement, mode: MotionMode): () => void` (returns cleanup)
  - `<html data-motion="full|simple|reduced">` is set by an inline script before first paint
  - CSS custom properties per era on `[data-era]`: `--era-bg`, `--era-fg`, `--era-accent`, plus `--era-mix` (0–1), which ScrollTrigger animates across each era boundary
  - Event `cv:era-enter` (`detail: { era }`) dispatched on `document`

- [ ] **Step 1: Write failing unit tests**: `getMotionMode({reducedMotion:true, viewportWidth:1400}) === 'reduced'`, `({false, 400}) === 'simple'`, `({false, 767}) === 'simple'`, `({false, 768}) === 'full'`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL. Implement `motion.ts` and run again. Expected: PASS.
- [ ] **Step 3: Write failing e2e** `tests/e2e/motion.spec.ts`:
  - `desktop` with `reducedMotion: 'reduce'`: `html[data-motion=reduced]`, and right after load (no scrolling) every chapter `h2` and paragraph has computed `opacity === '1'`.
  - `desktop` with default motion: scroll to the bottom in steps and wait 1s. Every chapter `h2` has `opacity === '1'`, and `html[data-motion=full]`.
  - `mobile`: `html[data-motion=simple]`.
  - Entering `#era-electronics` fires `cv:era-enter` with `era: 'electronics'` (listen via `page.evaluate`).
  - JS budget: the sum of transferred `.js` response bytes on `/en/` is below 200 KB uncompressed. This measures this task's baseline, and later toy tasks keep the test green.
- [ ] **Step 4:** Build the three worlds as inline SVG/CSS backdrops behind the chapter text, keeping text contrast ≥ 4.5:1 against each world.
  - **Lego:** yellow ground (`#f4c20d` family) with brick rows. In `full` mode the bricks snap down into place on enter. The world can include a chunky retro "first computer" built from bricks for the `first-computer` chapter.
  - **Electronics:** PCB green (`#0b5d3b` family) with copper traces (`#c8a24a`) drawn with SVG `stroke-dashoffset` that light up with scroll progress.
  - **Software:** an editor-dark background (`#0f1115`) where a code line types itself in.
  - **Today + contact:** the software palette, calmer, with no moving parts.
- [ ] **Step 5:** Implement `scrollStory.ts` with `gsap.registerPlugin(ScrollTrigger)`:
  - `full`: scrubbed morphs of `--era-mix` and the backdrop elements across each boundary, plus per-world enter animations.
  - `simple`: no scrub, just a short crossfade of the backdrop on era enter.
  - `reduced`: backdrops crossfade instantly, nothing auto-plays.
  - **Never animate chapter text *from* hidden.** Use `gsap.from` only on decorative backdrop elements, so text is visible if JS is slow or missing.
  - Load it from `[lang]/index.astro` as a `<script>` (Astro bundles it).
- [ ] **Step 6:** Run `npm test && npm run e2e`. Expected: PASS on all projects, including Task 3's narrow and third-party tests. Commit `feat: era worlds and scroll-driven morphing`.

---

### Task 5: Lego toy: gear train

**Files:**
- Create: `src/toys/gears/gears.ts`, `src/toys/gears/GearTrain.astro`
- Modify: `src/components/EraSection.astro` (mount the toy in `.toy-slot[data-toy=gears]`), `src/i18n/ui.ts` (`toyGearsHint`, `toyGearsDone`)
- Test: `tests/unit/gears.test.ts`, `tests/e2e/toys.spec.ts`

**Interfaces:**
- Produces:
  - `const GEAR_TEETH = [24, 12, 36] as const`
  - `propagateRotation(driverDeg: number, teeth: readonly number[]): number[]`: gear 0 = `driverDeg`, and each next gear `= -prev * (teeth[i-1] / teeth[i])`
  - `class GearProgress { add(deltaDeg: number): void; get completed(): boolean }`. It counts absolute rotation, completes at ≥ 360° total, and once completed stays completed.
  - Dispatches `cv:toy-complete` (`detail: { toy: 'gears' }`) on first completion.

- [ ] **Step 1: Write failing tests**:
  - `propagateRotation(90, [24,12,36])` deep-equals `[90, -180, 60]`.
  - `propagateRotation(-90, ...)` mirrors the signs.
  - `GearProgress`: `add(200); add(-200)` → completed (rotation counts in either direction). `add(359)` → not completed. Add more after completion → still completed, with no throw on `add(1e9)`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL. Implement `gears.ts` and run again. Expected: PASS.
- [ ] **Step 3: Write failing e2e** (in `toys.spec.ts`, desktop + mobile):
  - The driver gear `[data-gear="0"]` is a focusable element with `role="slider"` and an `aria-label` from `toyGearsHint`. Pressing `ArrowRight` 24 times (15° each) completes it: `[data-toy=gears]` gets `data-complete="true"` and the `toyGearsDone` text is visible.
  - On mobile, a touch drag in a circle around the driver's centre rotates gear 1 (its `transform` changes).
- [ ] **Step 4:** Implement `GearTrain.astro`: SVG gears in Lego Technic colours. GSAP `Draggable.create(driver, { type: 'rotation' })` `onDrag` feeds deltas into `GearProgress` and applies `propagateRotation` to the other gears. Keyboard arrows rotate ±15°. In `reduced` mode nothing auto-spins, but dragging still works. Run `npm test && npm run e2e`. Expected: PASS, including the narrow and JS-budget tests. Commit `feat: gear train toy for the Lego era`.

---

### Task 6: Electronics toy: breadboard

**Files:**
- Create: `src/toys/breadboard/breadboard.ts`, `src/toys/breadboard/Breadboard.astro`
- Modify: `src/components/EraSection.astro`, `src/i18n/ui.ts` (`toyBreadboardHint`, `toyBreadboardWrong`, `toyBreadboardDone`), `src/scripts/scrollStory.ts` (listens for completion)
- Test: `tests/unit/breadboard.test.ts`, `tests/e2e/toys.spec.ts`

**Interfaces:**
- Produces:
  - `type SlotId = 'a' | 'b' | 'c'`; `const CORRECT_SLOT: SlotId = 'b'`
  - `type BoardState = { wire: 'tray' | SlotId; closed: boolean }`; `initialBoard(): BoardState`
  - `placeWire(state: BoardState, slot: SlotId): { state: BoardState; result: 'closed' | 'wrong' | 'already-closed' }`. A wrong slot returns the wire to `'tray'`. Once closed, the board is immutable.
  - Dispatches `cv:toy-complete` (`detail: { toy: 'breadboard' }`). `scrollStory` reacts by adding `.is-lit` to `#era-electronics`, which brightens the traces leading down to the software era (decorative only).

- [ ] **Step 1: Write failing tests**: `placeWire(initial,'a')` → `result 'wrong'`, `state.wire === 'tray'`, `closed false`. Then `'b'` → `'closed'`, `closed true`. Then `'c'` on the closed board → `'already-closed'`, with the state unchanged (`wire 'b'`).
- [ ] **Step 2:** Run `npm test`. Expected: FAIL. Implement and run again. Expected: PASS.
- [ ] **Step 3: Write failing e2e** (desktop + mobile):
  - The three slots are `<button data-slot>` elements. Tap/click slot `a` shows `toyBreadboardWrong` in a `role="status"` live region and the wire stays in the tray. Tap `b` makes `[data-led]` get `data-on="true"`, `#era-electronics` get class `is-lit`, and `toyBreadboardDone` visible.
  - On desktop, keyboard Tab to slot `b` and press Enter gives the same closed result.
- [ ] **Step 4:** Implement `Breadboard.astro`: an SVG breadboard with a battery, resistor, LED and a gap. The wire can be dragged (GSAP Draggable, snapping to the nearest slot on release, then `placeWire`) or a slot button can be tapped. Run `npm test && npm run e2e`. Expected: PASS. Commit `feat: breadboard toy for the electronics era`.

---

### Task 7: Software toy: live code line

**Files:**
- Create: `src/toys/code/codeToy.ts`, `src/toys/code/CodeToy.astro`
- Modify: `src/components/EraSection.astro`, `src/i18n/ui.ts` (`toyCodeHint`, `toyCodeChoices` as 3 short strings per language, `toyCodeOutputPrefix`)
- Test: `tests/unit/codeToy.test.ts`, `tests/e2e/toys.spec.ts`

**Interfaces:**
- Produces:
  - `const CODE_MAX_LEN = 24`
  - `normalizeInput(raw: string, fallback: string): string`: trims, collapses whitespace, truncates to `CODE_MAX_LEN`, and returns `fallback` for an empty result
  - `formatOutput(prefix: string, value: string): string` returns `` `${prefix} ${value}` ``
  - The shown snippet is fixed: `build("<value>")`, with the output rendered below. Output is set via `textContent` only, so nothing is ever evaluated.

- [ ] **Step 1: Write failing tests**:
  - `normalizeInput('  robots  ', 'x') === 'robots'`; `normalizeInput('   ', 'things') === 'things'`
  - `normalizeInput('a'.repeat(40), 'x').length === 24`
  - `normalizeInput('<img src=x onerror=alert(1)>', 'x')` returns the raw string truncated, unchanged otherwise (escaping is the DOM's job; test the rendered side in e2e).
  - `formatOutput('Building', 'robots') === 'Building robots'`
- [ ] **Step 2:** Run `npm test`. Expected: FAIL. Implement and run again. Expected: PASS.
- [ ] **Step 3: Write failing e2e**:
  - **Desktop:** the `<input>` labelled by `toyCodeHint` (`maxlength=24`). Typing `robots` makes the output read `<prefix> robots`. Typing `<b>x</b>` makes the output contain no `b` element and show the literal text. Clearing the input shows the fallback.
  - **Mobile:** no text input is visible, there are three `<button data-choice>` elements, and tapping the second updates the output to that choice.
- [ ] **Step 4:** Implement `CodeToy.astro`: editor styling that matches the software world, with the input/chips chosen by CSS media query (`max-width: 767px`) so no JS is needed for the switch. Run `npm test && npm run e2e`. Expected: PASS on all projects, including the narrow, third-party and JS-budget tests. Commit `feat: live code toy for the software era`.
- [ ] **Step 5: Final verification:** run `npm test && npm run e2e && npm run check:content && npm run build`. Expected: all pass, and `check:content` lists only the `PLACEHOLDER:` entries. Manually open `npm run preview` on a phone-sized viewport and with reduced motion enabled. Commit any fixes.
