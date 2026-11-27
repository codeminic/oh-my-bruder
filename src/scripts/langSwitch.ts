import { LANG_STORAGE_KEY } from '../i18n/lang';

/** Keeps the language switch pointing at the chapter currently being read, and remembers the choice. */
export function initLangSwitch(): void {
  const link = document.querySelector<HTMLAnchorElement>('.lang-switch');
  if (!link) return;
  const base = link.getAttribute('href')!.split('#')[0];

  const visible = new Map<Element, number>();
  const chapters = document.querySelectorAll('[data-chapter], #contact');
  if (chapters.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        // On the scroll stage every step is on screen; the stage reports the current one instead.
        if (document.documentElement.classList.contains('is-stage')) return;
        for (const e of entries) visible.set(e.target, e.isIntersecting ? e.intersectionRatio : 0);
        let best: Element | null = null;
        let bestRatio = 0;
        for (const [el, ratio] of visible) {
          if (ratio > bestRatio) {
            best = el;
            bestRatio = ratio;
          }
        }
        link.setAttribute('href', best ? `${base}#${best.id}` : base);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    chapters.forEach((c) => observer.observe(c));
  }

  document.addEventListener('cv:step', (e) => {
    const anchor = (e as CustomEvent<{ anchor: string }>).detail.anchor;
    link.setAttribute('href', anchor ? `${base}#${anchor}` : base);
  });

  link.addEventListener('click', () => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, link.hreflang);
    } catch {
      /* storage unavailable: the link still works */
    }
  });
}
