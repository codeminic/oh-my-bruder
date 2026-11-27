import { gsap } from 'gsap';
import type { MotionMode } from '../lib/motion';
import { dwellProgress, layoutStage, snapTarget, stageTime, type StageLayout } from '../lib/stage';

/**
 * The scroll stage: the screen stays put and scrolling plays the story. The readable long page underneath is
 * untouched until everything here is ready; `html.is-stage` switches the stage CSS on.
 */

const SKY = {
  hero: '#121419',
  lego: '#f4c20d',
  electronics: '#0b5d3b',
  software: '#0f1115',
  today: '#161a21',
};

interface Step {
  /** The positioned element the timeline moves. */
  el: HTMLElement;
  /** What scrolls inside a tall step. */
  content: HTMLElement;
  /** What links and focus point at. */
  anchor: HTMLElement;
  era: string;
  overflow: number;
  link: HTMLAnchorElement | null;
}

const INTERACTIVE = 'input, textarea, select, button, [role="slider"], [contenteditable]';

export function initStage(mode: MotionMode): () => void {
  const undo: (() => void)[] = [];
  try {
    return setupStage(mode, undo);
  } catch (err) {
    // Put the readable page back exactly as it was, then let the caller fall back.
    for (const f of undo.reverse()) {
      try {
        f();
      } catch {
        /* best effort */
      }
    }
    throw err;
  }
}

function setupStage(mode: MotionMode, undo: (() => void)[]): () => void {
  const root = document.documentElement;
  const main = document.querySelector<HTMLElement>('main')!;
  const hero = main.querySelector<HTMLElement>('.hero')!;
  const contact = main.querySelector<HTMLElement>('#contact')!;
  const nav = main.querySelector<HTMLElement>('.stage-timeline')!;
  const track = nav.querySelector<HTMLElement>('.tl-track')!;
  const fill = nav.querySelector<HTMLElement>('.tl-fill')!;

  // ---------- DOM: wrap each step, add the sky, the CRT line and the scroll spacer ----------
  const wrap = (node: HTMLElement) => {
    const w = document.createElement('div');
    w.className = 'stage-step';
    node.before(w);
    w.append(node);
    undo.push(() => w.replaceWith(node));
    return w;
  };
  const linkTo = (id: string) => nav.querySelector<HTMLAnchorElement>(`a[href="#${id}"]`);

  const steps: Step[] = [{ el: hero, content: hero, anchor: hero, era: 'lego', overflow: 0, link: null }];
  for (const section of main.querySelectorAll<HTMLElement>('section.era')) {
    for (const node of section.querySelectorAll<HTMLElement>('[data-chapter], .toy-slot')) {
      steps.push({ el: wrap(node), content: node, anchor: node, era: section.dataset.era!, overflow: 0, link: linkTo(node.id) });
    }
  }
  const contactInner = contact.querySelector<HTMLElement>('.era-inner')!;
  steps.push({ el: wrap(contactInner), content: contactInner, anchor: contact, era: 'today', overflow: 0, link: linkTo('contact') });
  const last = steps.length - 1;

  const sky = document.createElement('div');
  sky.className = 'stage-sky';
  main.prepend(sky);
  const crt = document.createElement('div');
  crt.className = 'stage-crt';
  main.append(crt);
  const spacer = document.createElement('div');
  spacer.id = 'stage-spacer';
  main.after(spacer);
  undo.push(() => [sky, crt, spacer].forEach((n) => n.remove()));

  // The typing prompt sits under the era label rather than inside the moving world.
  const softwareSection = main.querySelector<HTMLElement>('#era-software');
  const typingLine = softwareSection?.querySelector<HTMLElement>('.typing-line');
  if (softwareSection && typingLine) {
    const home = typingLine.parentElement!;
    softwareSection.append(typingLine);
    undo.push(() => home.append(typingLine));
  }

  // The hero name drops in letter by letter, like bricks snapping on.
  const h1 = hero.querySelector('h1');
  if (h1) {
    const name = h1.textContent ?? '';
    h1.setAttribute('aria-label', name);
    h1.textContent = '';
    let i = 0;
    name.split(' ').forEach((word, w) => {
      if (w > 0) h1.append(' ');
      const wordEl = document.createElement('span');
      wordEl.style.display = 'inline-block';
      wordEl.setAttribute('aria-hidden', 'true');
      for (const ch of word) {
        const s = document.createElement('span');
        s.className = 'hero-letter';
        s.style.setProperty('--i', String(i++));
        s.textContent = ch;
        wordEl.append(s);
      }
      h1.append(wordEl);
    });
    undo.push(() => {
      h1.textContent = name;
      h1.removeAttribute('aria-label');
    });
  }

  // Electricity running along the copper traces (not on phones).
  if (mode === 'full') {
    main.querySelectorAll<SVGPathElement>('.pcb-trace').forEach((trace, i) => {
      const pulse = trace.cloneNode() as SVGPathElement;
      pulse.setAttribute('class', 'pcb-pulse');
      pulse.style.setProperty('--d', `${3 + ((i * 7) % 5)}s`);
      pulse.style.setProperty('--delay', `${-((i * 1.3) % 4)}s`);
      trace.after(pulse);
      undo.push(() => pulse.remove());
    });
  }

  root.classList.add('is-stage');
  undo.push(() => root.classList.remove('is-stage'));
  history.scrollRestoration = 'manual';

  // ---------- Layout ----------
  let layout: StageLayout = layoutStage([0], 1);
  let dotX: number[] = [];

  function measure() {
    const vh = innerHeight;
    const narrow = innerWidth <= 600;
    const top = narrow ? 60 : 72;
    const bottom = narrow ? 76 : 92;
    const avail = vh - top - bottom;
    steps.forEach((s, i) => {
      if (i === 0) return;
      s.el.classList.remove('is-tall');
      s.el.style.height = '';
      s.content.style.transform = '';
      const h = s.el.offsetHeight;
      if (h <= avail) {
        s.el.style.top = `${top + (avail - h) / 2}px`;
        s.overflow = 0;
      } else {
        s.el.style.top = `${top}px`;
        s.el.style.height = `${avail}px`;
        s.el.classList.add('is-tall');
        s.overflow = h - avail + 32;
      }
    });
    layout = layoutStage(
      steps.map((s) => s.overflow),
      Math.round(Math.max(vh, 480) * 0.9),
    );
    spacer.style.height = `${layout.total + vh}px`;

    const t0 = track.getBoundingClientRect();
    dotX = steps.map((s) => {
      if (!s.link) return 0;
      const r = s.link.getBoundingClientRect();
      return r.left + r.width / 2 - t0.left;
    });
  }

  // ---------- The timeline of everything that moves, in step time ----------
  const eraRange = (era: string) => {
    const idx = steps.flatMap((s, i) => (s.era === era && i > 0 ? [i] : []));
    return { first: idx[0], last: idx[idx.length - 1] };
  };
  const L = eraRange('lego');
  const E = eraRange('electronics');
  const S = eraRange('software');

  const world = (era: string) => main.querySelector<HTMLElement>(`#era-${era} .era-world`)!;
  const panOf = (el: Element) => Math.max(0, (el as HTMLElement).getBoundingClientRect().height - innerHeight);
  const label = (era: string) => main.querySelector(`#era-${era} .era-label`);

  let tl: gsap.core.Timeline;
  let ctx: gsap.Context;

  function build() {
    ctx = gsap.context(() => {
      tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
      tl.set({}, {}, last);

      // Steps: rise in from below with a tilt, leave upwards.
      tl.to(hero, { y: -160, scale: 1.12, opacity: 0, duration: 0.55, ease: 'power1.in' }, 0);
      steps.forEach((s, i) => {
        if (i === 0) return;
        tl.fromTo(
          s.el,
          { opacity: 0, y: 140, rotationX: -22, scale: 0.94, transformPerspective: 1000, transformOrigin: '50% 100%' },
          { opacity: 1, y: 0, rotationX: 0, scale: 1, duration: 0.5, ease: 'power2.out' },
          i - 0.5,
        );
        if (i < last) tl.to(s.el, { opacity: 0, y: -120, rotationX: 14, scale: 0.96, duration: 0.5, ease: 'power1.in' }, i);
      });

      // Sky
      tl.fromTo(sky, { backgroundColor: SKY.hero }, { backgroundColor: SKY.lego, duration: 0.6 }, 0.15);
      tl.to(sky, { backgroundColor: SKY.electronics, duration: 0.5 }, L.last + 0.3);
      tl.to(sky, { backgroundColor: SKY.software, duration: 0.2 }, E.last + 0.75);
      tl.to(sky, { backgroundColor: SKY.today, duration: 0.6 }, S.last + 0.2);

      // Era labels
      for (const [era, r] of [['lego', L], ['electronics', E], ['software', S]] as const) {
        const targets = [label(era), era === 'software' ? typingLine : null].filter(Boolean);
        tl.fromTo(targets, { opacity: 0 }, { opacity: 1, duration: 0.3 }, r.first - 0.3);
        tl.to(targets, { opacity: 0, duration: 0.3 }, r.last + 0.15);
      }

      // Lego: bricks rain down, gears pop in and turn, the world pans; then the camera dives in and it all scatters.
      const lego = world('lego');
      const legoSvg = lego.querySelector('.world')!;
      const bricks = gsap.utils.toArray<SVGGElement>('.lego-brick, .lego-computer', lego);
      const rnd = mulberry(11);
      bricks.forEach((b) => {
        tl.from(b, { y: -1500 - rnd() * 600, rotation: (rnd() - 0.5) * 90, opacity: 0, duration: 0.5, ease: 'bounce.out' }, 0.1 + rnd() * 0.5);
      });
      gsap.utils.toArray<SVGGElement>('.lego-gear', lego).forEach((g, i) => {
        tl.from(g, { scale: 0, transformOrigin: '50% 50%', duration: 0.4, ease: 'back.out(2.2)' }, 0.45 + i * 0.12);
        tl.to(g.firstElementChild, { rotation: i % 2 ? -540 : 540, svgOrigin: '0 0', duration: L.last + 1 }, 0);
      });
      tl.fromTo(legoSvg, { y: 0 }, { y: -panOf(legoSvg) * 0.45, duration: L.last + 1 }, 0);
      bricks.forEach((b, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        tl.to(b, { x: side * (500 + rnd() * 700), y: `-=${200 + rnd() * 900}`, rotation: `+=${side * (90 + rnd() * 200)}`, duration: 0.8, ease: 'power2.in' }, L.last + rnd() * 0.2);
      });
      tl.to(lego, { scale: 3.2, opacity: 0, duration: 0.75, ease: 'power2.in' }, L.last + 0.1);

      // Electronics: the board rises out of the screen, traces draw themselves in, chips drop on.
      const elec = world('electronics');
      const elecSvg = elec.querySelector('.world')!;
      const D = Math.max(0.6, E.last - L.last - 0.4);
      tl.fromTo(elec, { opacity: 0, scale: 0.35 }, { opacity: 1, scale: 1, duration: 0.65, ease: 'power2.out' }, L.last + 0.35);
      tl.fromTo(
        gsap.utils.toArray('.pcb-trace', elec),
        { strokeDasharray: 1, strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 0.6, stagger: { amount: 0.9 }, ease: 'power1.inOut' },
        L.last + 0.4,
      );
      tl.from(gsap.utils.toArray('.pcb-via', elec), { scale: 0, transformOrigin: '50% 50%', duration: 0.2, stagger: { amount: D * 0.5 } }, L.last + 0.55);
      tl.from(gsap.utils.toArray('.pcb-chip', elec), { y: -90, opacity: 0, duration: 0.4, stagger: 0.15, ease: 'back.out(1.8)' }, L.last + 0.6);
      tl.fromTo(elecSvg, { y: 0 }, { y: -panOf(elecSvg) * 0.5, duration: E.last - L.last + 1 }, L.last + 0.35);

      // Electronics → software: a CRT powers on.
      const soft = world('software');
      const softWorld = soft.querySelector<HTMLElement>('.world')!;
      tl.to(crt, { opacity: 1, scaleX: 1, duration: 0.35, ease: 'power3.out' }, E.last + 0.05);
      tl.to(elec, { opacity: 0, scale: 1.12, duration: 0.4, ease: 'power1.in' }, E.last + 0.25);
      tl.fromTo(softWorld, { clipPath: 'inset(50% 0% 50% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.4, ease: 'power2.inOut' }, E.last + 0.45);
      tl.to(crt, { opacity: 0, scaleY: 6, duration: 0.3 }, E.last + 0.55);
      tl.fromTo(softWorld, { y: 0 }, { y: -panOf(softWorld) * 0.6, duration: S.last - E.last + 1 }, E.last + 0.45);
      const typing = typingLine?.querySelector<HTMLElement>('.typing-text');
      if (typing) {
        const full = typing.dataset.full ?? typing.textContent ?? '';
        typing.dataset.full = full;
        const state = { n: 0 };
        tl.to(state, { n: full.length, duration: 0.4, onUpdate: () => (typing.textContent = full.slice(0, Math.round(state.n))) }, E.last + 0.55);
      }
      tl.to(soft, { opacity: 0.35, duration: 0.6 }, S.last + 0.2);
    }, main);
  }

  // ---------- Rendering ----------
  let current = -1;
  let currentEra = '';
  function setCurrent(i: number) {
    current = i;
    steps.forEach((s, k) => {
      s.el.classList.toggle('is-active', k === i);
      if (s.link) {
        s.link.classList.toggle('is-passed', k <= i);
        if (k === i) s.link.setAttribute('aria-current', 'step');
        else s.link.removeAttribute('aria-current');
      }
    });
    const era = steps[i].era;
    nav.querySelectorAll('.tl-era').forEach((e) => e.classList.toggle('is-current', (e as HTMLElement).dataset.era === era));
    if (era !== currentEra) {
      currentEra = era;
      root.dataset.currentEra = era;
      document.dispatchEvent(new CustomEvent('cv:era-enter', { detail: { era } }));
    }
    document.dispatchEvent(new CustomEvent('cv:step', { detail: { anchor: i === 0 ? '' : steps[i].anchor.id } }));
  }

  function render() {
    const y = scrollY;
    const time = stageTime(y, layout);
    tl.time(time);
    steps.forEach((s, i) => {
      if (s.overflow) s.content.style.transform = `translateY(${-s.overflow * dwellProgress(i, y, layout)}px)`;
    });
    const i = Math.round(time);
    if (i !== current) setCurrent(i);
    const a = Math.floor(time);
    const b = Math.min(last, a + 1);
    const x = dotX[a] + (dotX[b] - dotX[a]) * (time - a);
    fill.style.width = `${Math.max(0, x)}px`;
    if (main.scrollTop || main.scrollLeft) main.scrollTo(0, 0);
  }

  let frame = 0;
  const requestRender = () => {
    if (!frame) frame = requestAnimationFrame(() => ((frame = 0), render()));
  };

  // ---------- Travel: links, hashes, focus, keys ----------
  let travel: gsap.core.Tween | null = null;
  let travelTo = -1;
  const stopTravel = () => {
    travel?.kill();
    travel = null;
    travelTo = -1;
  };
  /** Animated scroll to `target`; the stage follows because it renders from the scroll position. */
  function glide(target: number, duration: number, step = -1) {
    stopTravel();
    travelTo = step;
    const proxy = { y: scrollY };
    travel = gsap.to(proxy, {
      y: target,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => window.scrollTo(0, proxy.y),
      onComplete: () => {
        travel = null;
        travelTo = -1;
      },
    });
  }
  function goTo(i: number, animate = true) {
    const step = Math.max(0, Math.min(last, i));
    const target = layout.starts[step];
    if (!animate) {
      stopTravel();
      window.scrollTo(0, target);
      render();
      return;
    }
    glide(target, Math.min(1.6, 0.45 + Math.abs(target - scrollY) / 5000), step);
  }

  // Snapping: once scrolling stops (and no finger is down), settle on the nearest rest position.
  let snapTimer = 0;
  let touching = false;
  const doSnap = () => {
    if (travel || touching) return;
    const y = scrollY;
    const target = snapTarget(y, layout, direction);
    if (Math.abs(target - y) > 1) glide(target, Math.min(0.7, 0.25 + Math.abs(target - y) / 2500));
  };
  const scheduleSnap = () => {
    clearTimeout(snapTimer);
    snapTimer = window.setTimeout(doSnap, 160);
  };
  const onUserInput = () => stopTravel();
  const onTouchStart = () => {
    touching = true;
    stopTravel();
  };
  const onTouchEnd = () => {
    touching = false;
    scheduleSnap();
  };

  const stepIndexFor = (el: Element | null) =>
    el ? steps.findIndex((s) => s.anchor === el || s.el.contains(el) || el.contains(s.el)) : -1;
  const fromHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    return id ? stepIndexFor(document.getElementById(id)) : -1;
  };

  const onHash = () => {
    const i = fromHash();
    if (i >= 0) goTo(i);
    main.scrollTo(0, 0);
  };
  const onClick = (e: MouseEvent) => {
    const a = (e.target as Element).closest?.('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const id = a.getAttribute('href')!.slice(1);
    const i = stepIndexFor(document.getElementById(id));
    if (i < 0) return;
    e.preventDefault();
    history.replaceState(null, '', `#${id}`);
    goTo(i);
  };
  const onFocus = (e: FocusEvent) => {
    main.scrollTo(0, 0);
    const i = stepIndexFor(e.target as Element);
    if (i >= 0 && i !== current && i !== travelTo) goTo(i);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if ((e.target as Element).closest?.(INTERACTIVE)) return;
    const down = e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey);
    const up = e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey);
    const from = travelTo >= 0 ? travelTo : current;
    let next = -1;
    if (down || up) {
      // Inside a tall step, read on before moving to the next one.
      const y = scrollY;
      if (travelTo < 0 && down && y < layout.ends[from] - 2) {
        e.preventDefault();
        window.scrollTo({ top: Math.min(layout.ends[from], y + innerHeight * 0.6), behavior: 'smooth' });
        return;
      }
      if (travelTo < 0 && up && y > layout.starts[from] + 2) {
        e.preventDefault();
        window.scrollTo({ top: Math.max(layout.starts[from], y - innerHeight * 0.6), behavior: 'smooth' });
        return;
      }
      next = from + (down ? 1 : -1);
    } else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    if (next < 0 || next > last) return;
    e.preventDefault();
    goTo(next);
  };

  let lastY = scrollY;
  let direction = 0;
  const onScroll = () => {
    const y = scrollY;
    if (y !== lastY) direction = Math.sign(y - lastY);
    lastY = y;
    requestRender();
    if (!travel) scheduleSnap();
  };

  /** Re-measure (fonts loaded, screen resized) and rebuild the choreography, staying on the same step. */
  function rebuild() {
    const at = Math.round(stageTime(scrollY, layout));
    ctx.revert();
    measure();
    build();
    goTo(at, false);
  }
  let lastW = innerWidth;
  let lastH = innerHeight;
  let resizeTimer = 0;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (innerWidth === lastW && Math.abs(innerHeight - lastH) < 120) return;
      lastW = innerWidth;
      lastH = innerHeight;
      rebuild();
    }, 200);
  };
  // The browser may jump to the #hash after load; put the stage back on that step.
  const onLoad = () => goTo(Math.max(0, fromHash()), false);

  // ---------- Go ----------
  measure();
  build();
  undo.push(() => ctx.revert());
  goTo(Math.max(0, fromHash()), false);
  if (document.readyState !== 'complete') addEventListener('load', onLoad, { once: true });
  document.fonts?.ready.then(() => document.documentElement.classList.contains('is-stage') && rebuild());

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onResize);
  addEventListener('hashchange', onHash);
  addEventListener('keydown', onKey);
  document.addEventListener('click', onClick);
  main.addEventListener('focusin', onFocus);
  addEventListener('wheel', onUserInput, { passive: true });
  addEventListener('touchstart', onTouchStart, { passive: true });
  addEventListener('touchend', onTouchEnd, { passive: true });
  addEventListener('touchcancel', onTouchEnd, { passive: true });

  return () => {
    stopTravel();
    clearTimeout(snapTimer);
    ctx?.revert();
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', onResize);
    removeEventListener('hashchange', onHash);
    removeEventListener('keydown', onKey);
    document.removeEventListener('click', onClick);
    main.removeEventListener('focusin', onFocus);
    removeEventListener('wheel', onUserInput);
    removeEventListener('touchstart', onTouchStart);
    removeEventListener('touchend', onTouchEnd);
    removeEventListener('touchcancel', onTouchEnd);
    steps.forEach((s) => {
      s.el.style.cssText = '';
      s.content.style.transform = '';
    });
    undo.reverse().forEach((f) => f());
  };
}

/** Small seeded random so the choreography is the same on every visit. */
function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
