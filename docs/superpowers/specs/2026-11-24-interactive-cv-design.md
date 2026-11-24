# Interactive CV: Design

Date: 2026-11-24
Status: Approved (2026-11-24)

## Intent and the why

A personal website that tells the owner's life story as one continuous thread, personal and professional together: building with Lego Technic as a kid, a lifelong fascination with computers and technology, an apprenticeship as an electronics engineer, and then a career in software engineering. The message is *"I've always been someone who builds things."*

The owner is **not actively job hunting**. The site is meant to help them **stand out over the long term**: a memorable profile to point people to (contacts, future employers, people who find them online) whenever opportunities come up. It will grow over the years as new chapters are added.

## Goals

- Tell the life story as a **scroll-driven narrative**, chapter by chapter.
- **The world changes with each era.** Each era has its own visual world, and scrolling morphs one into the next:
  - Lego era (childhood): bright yellow and primary colours, bricks and gears; pieces snap together on scroll. **This era also covers the early fascination with computers.** No separate world for it (owner's decision).
  - Electronics era: green PCB with copper traces that "light up" as you scroll.
  - Software era: dark code-editor look, with text that types itself.
  - The story ends with **Today + contact**: who the owner is now, skills, certifications, the personal side "off the keyboard" (climbing, photography, coffee) and an email link.
- **One hands-on toy per era**, always optional:
  - Lego: a gear train. Rotating the first gear spins the whole mechanism.
  - Electronics: a breadboard. Placing the last wire closes the circuit, an LED lights up, and that lights the way to the next chapter.
  - Software: a tiny editor. Visitors change a line of code and see the result change live.
- **English and German**, with a language switch.
- **Works well on desktop and mobile.** Toys work with touch as well as a mouse.
- **Cheap to extend.** Adding a chapter (or a sub-chapter within an era) means editing content files, not rewriting the animation code.

## Non-goals

- Not a classic CV layout or a PDF generator. A downloadable PDF CV link is fine, but generating one is out of scope.
- No backend, CMS, accounts or analytics dashboard.
- No blog.

## Anti-goals (would count as failure even if it works)

- The story only comes across if you play with the toys. **Scrolling alone must tell the full story.**
- Janky or slow on a mid-range phone.
- Content is so tangled with the visuals that adding a chapter years from now becomes a mini-rebuild.
- Gimmicky to the point where visitors can't quickly find who the owner is and how to contact them.

## Constraints

- Static site with free static hosting (Netlify, Vercel or GitHub Pages).
- **Owner is based in Switzerland.** Include a simple Impressum and a privacy page, in both languages, linked from a permanent footer. Self-host fonts, don't embed third-party content, use no tracking, and keep third-party requests to a minimum.
- Mobile-first performance: animations must stay smooth on mid-range phones.
- Accessibility: respect `prefers-reduced-motion`; all text readable without animation; toys keyboard-operable on desktop; sensible contrast in every era's palette.
- Content is bilingual (EN/DE); each translatable string has both languages side by side.
- **Content arrives later.** The owner will share an older CV plus extra details. Until then the build uses clearly marked placeholder content, and the real EN/DE text will be drafted from the CV afterwards.

## Approaches considered

| Approach | Trade-offs |
|---|---|
| **Astro + GSAP (chosen)** | Static, very little JS shipped (only the toy islands and the scroll script), built-in i18n routing (`/en`, `/de`), content collections for structured content. GSAP ScrollTrigger handles scroll-driven morphing and works on touch; GSAP Draggable gives touch and mouse toys. The cost is one light framework to learn. |
| Next.js + Framer Motion | Familiar if you use React daily, but heavier than this page needs. More JS on mobile and more setup for what is essentially one page. |
| Plain HTML/JS + GSAP | No build step, but languages and the content file have to be handled by hand. That gets messy as chapters accumulate, which works against the long-term goal. |

The owner asked for a recommendation that works on desktop and mobile. **Astro + GSAP** was chosen because it keeps the JS payload minimal on phones while supporting all the interactivity.

## Decisions

Decided by the owner:
- Scroll-driven story (not an explorable world, terminal or clickable timeline).
- Visual direction A, "the world changes with you": a distinct look per era that morphs into the next.
- One toy per era.
- English + German.
- Must work on desktop and mobile.
- Three worlds: the computer fascination lives inside the Lego/childhood era.
- Based in Switzerland: Impressum and privacy page.

Claude's calls, which the owner can correct:
- Tech: Astro + GSAP (ScrollTrigger, Draggable). Toy components in vanilla TS or a light island framework, left to the builder.
- Toy designs as listed in Goals (gear train, breadboard, live code line).
- **Mobile:** on phones the code toy uses a few tappable choices instead of free typing. The breadboard wire can be tapped or dragged into place. Era transitions are simplified on small screens.
- **Reduced motion:** era transitions become simple crossfades and auto-playing animations stop. Toys still work.
- **Chapter contents:** a title, a years range and a short story (EN/DE). Optional: photos (shown as framed "snapshots" styled to fit the era's world, so real photos don't clash with the illustrations, plus an image pipeline via Astro assets), CV facts (role, organisation, tech stack), links and a **projects list** (name, years, short localized text, optional link), because several chapters bundle 2–3 projects.
- **Today + contact** stays in the software world's palette but calmer, so the page ends in the present day.
- **Content model:** the eras and chapters live in content files (e.g. Astro content collections in YAML/MD), with EN/DE fields side by side. Each chapter references an era, and the era decides its visual world. New chapters slot into an existing era without touching code. A brand-new era (a new visual world) does need code, which is accepted.
- The story ends with a Today + contact section. No contact form, since there's no backend.

## Content (from the owner's CV, Dec 2024, plus updates)

Owner: **Dominic Baumgartner**. Only the surname Baumgartner is used, with no mention of the birth name.

**Public personal data (owner's decision): email only** (`dominic@baumgartner.rocks`). No phone, street address, birthday or LinkedIn link. The Impressum shows name + email. *(Note for the owner: if the site is ever judged commercial under Swiss UWG, a postal address may be required.)*

Chapter list:

| Era | Chapter id | Content |
|---|---|---|
| lego | `lego-technic` | Childhood Lego Technic. *Owner to provide story.* |
| lego | `first-computer` | The fascination with computers. *Owner to provide story.* |
| electronics | `apprenticeship` | Grossenbacher Systeme AG, 2009–2013. Electronics engineer apprenticeship (GBS St. Gallen): design, build and repair circuits, then microcontrollers, PLCs and small desktop apps. Discovered software in the last year. |
| electronics | `test-automation` | Grossenbacher engineering team, 2013–2015. Test automation for IPCs, PLCs and I/O cards. No code feedback or collaboration, so moved on, which is the transition into software. |
| software | `solve-and-studies` | Solve Engineering GmbH from 2015, part-time while studying at ZbW St. Gallen (HF Software Engineering, 2015–2019). Projects: liberoCloud / Elpro (2015–17), Thyssen Krupp traceability (2017–20), Wenzel WM Quartis 3D-arm driver in C# (2017). |
| software | `platforms` | Bühler Insights (2018–21): globally distributed team, architecture + development of three Azure microservices. |
| software | `devops-and-leading` | Convinced management to invest in DevOps (2018) and ran the platform (2019–24). Innovation team: Software Development Lead (2020–24), covering trainings, monthly dev meetings and sales support. |
| software | `highlights` | Medical-device ultrasound app (2022–23), FDA-approved and used by NASA on the ISS. SPL Sense (2021–24), noise measurement certified by Swiss authorities. Steinemann IoT platform for printing lines (2021–24): architecture, development and project lead. |
| software | `buehler-today` | Back at Bühler (whose Insights platform the owner helped build 2018–21), now employed directly as **System Architect / Senior Software Engineer**, since early 2025 (exact month: `PLACEHOLDER`). The brief Swiss Life stint (2 months) is left out on purpose. |

**Today:** the tagline "anti-dogmatic .NET / Azure software engineer with a passion for pragmatic and effective solutions" (years of experience are computed from 2015, not hard-coded). Skills grouped as on the CV. Certifications: iSAQB CPSA-F (2020), CPSA-A Requirements for Architects (2023), AZ-204 (2022). Languages: German (native) and English (proficient). Off the keyboard: climbing, photography, coffee.
- Language: the site detects the browser language on the first visit and defaults to English. The switch is always visible and keeps the reader's position in the story.

## Left to the builder

- Project structure, component breakdown and the exact animation choreography.
- Whether toys use vanilla TS, Svelte or Preact islands.
- The precise art: SVG vs CSS-drawn bricks and boards, illustration detail.
- Hosting provider choice and deployment setup.
- Testing approach (at minimum: build passes, both locales render, a smoke test on mobile viewport sizes, reduced-motion path works).
