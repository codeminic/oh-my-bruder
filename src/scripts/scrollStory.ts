import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getMotionMode, type MotionMode } from '../lib/motion';
import { initStage } from './stage';

gsap.registerPlugin(ScrollTrigger);

const SKY: Record<string, string> = {
  lego: '#f4c20d',
  electronics: '#0b5d3b',
  software: '#0f1115',
  today: '#161a21',
};

/**
 * Adds the era morphing on top of the readable page. Chapter text is never animated from hidden:
 * only decorative world elements move, so the story stays readable if this never runs.
 */
export function initScrollStory(root: HTMLElement, mode: MotionMode): () => void {
  const ctx = gsap.context(() => {
    const sections = gsap.utils.toArray<HTMLElement>('.era, .today', root);

    const sky = document.createElement('div');
    sky.id = 'world-sky';
    document.body.prepend(sky);
    document.documentElement.classList.add('has-sky');

    sections.forEach((section, i) => {
      const era = section.dataset.era!;
      const prevEra = i === 0 ? 'lego' : sections[i - 1].dataset.era!;

      // Era enter/leave events for toys and anyone else listening.
      ScrollTrigger.create({
        trigger: section,
        start: 'top 60%',
        end: 'bottom 60%',
        onToggle: (self) => {
          if (!self.isActive) return;
          document.documentElement.dataset.currentEra = era;
          document.dispatchEvent(new CustomEvent('cv:era-enter', { detail: { era } }));
        },
      });

      // The sky colour morph across each boundary.
      if (mode === 'full') {
        gsap.fromTo(
          sky,
          { backgroundColor: SKY[prevEra] },
          {
            backgroundColor: SKY[era],
            ease: 'none',
            immediateRender: false,
            scrollTrigger: { trigger: section, start: 'top bottom', end: 'top 35%', scrub: true },
          },
        );
      } else {
        ScrollTrigger.create({
          trigger: section,
          start: 'top 50%',
          end: 'bottom 50%',
          onToggle: (self) => {
            if (!self.isActive) return;
            if (mode === 'reduced') gsap.set(sky, { backgroundColor: SKY[era] });
            else gsap.to(sky, { backgroundColor: SKY[era], duration: 0.5, overwrite: true });
          },
        });
      }
    });

    if (mode !== 'full') return;

    // Lego: bricks drop and gears turn as you scroll.
    gsap.utils.toArray<SVGGElement>('.lego-brick', root).forEach((brick) => {
      gsap.from(brick, {
        yPercent: -400,
        opacity: 0,
        ease: 'bounce.out',
        scrollTrigger: { trigger: brick, start: 'top 95%', end: 'top 60%', scrub: 0.6 },
      });
    });
    gsap.utils.toArray<SVGGElement>('.lego-gear', root).forEach((gear, i) => {
      gsap.to(gear.firstElementChild, {
        rotation: i % 2 ? -360 : 360,
        svgOrigin: '0 0',
        ease: 'none',
        scrollTrigger: { trigger: '#era-lego', start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    // Electronics: copper traces draw themselves in.
    gsap.utils.toArray<SVGPathElement>('.pcb-trace', root).forEach((trace) => {
      gsap.fromTo(
        trace,
        { strokeDasharray: 1, strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: { trigger: '#era-electronics', start: 'top 80%', end: 'bottom 70%', scrub: true },
        },
      );
    });

    // Software: the code line types itself.
    const typing = root.querySelector<HTMLElement>('.typing-text');
    if (typing) {
      const full = typing.textContent ?? '';
      const state = { n: 0 };
      gsap.to(state, {
        n: full.length,
        ease: 'none',
        onUpdate: () => (typing.textContent = full.slice(0, Math.round(state.n))),
        scrollTrigger: { trigger: '#era-software', start: 'top 70%', end: 'top 10%', scrub: true },
      });
    }
  }, root);

  return () => ctx.revert();
}

export function startScrollStory(): void {
  const root = document.querySelector<HTMLElement>('main');
  if (!root) return;
  const mode = getMotionMode({
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    viewportWidth: innerWidth,
  });
  document.documentElement.dataset.motion = mode;
  let stageStarted = false;
  if (mode !== 'reduced') {
    try {
      initStage(mode);
      stageStarted = true;
    } catch (err) {
      // The stage has put the page back; fall back to the readable long page.
      console.error(err);
    }
  }
  if (!stageStarted) initScrollStory(root, mode);
  document.addEventListener('cv:toy-complete', (e) => {
    if ((e as CustomEvent<{ toy: string }>).detail.toy === 'breadboard') {
      document.getElementById('era-electronics')?.classList.add('is-lit');
    }
  });
}
