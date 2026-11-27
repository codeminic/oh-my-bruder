import type { Lang } from '../i18n/lang';

export type EraId = 'lego' | 'electronics' | 'software';
export type ToyId = 'excavator' | 'breadboard' | 'code';
export type Localized = { en: string; de?: string };

export type EraData = { id: EraId; order: number; title: Localized; toy: ToyId };

export type ChapterData<TImage = unknown> = {
  id: string;
  era: string;
  order: number;
  years: string;
  title: Localized;
  story: Localized;
  photos?: { src: TImage; alt: Localized }[];
  facts?: { role?: Localized; org?: string; tech?: string[] };
  links?: { label: Localized; url: string }[];
  projects?: { name: string; years: string; summary: Localized; url?: string }[];
};

export type StoryChapter<TImage = unknown> = {
  id: string;
  anchor: string;
  years: string;
  title: string;
  story: string;
  photos: { src: TImage; alt: string }[];
  facts?: { role?: string; org?: string; tech?: string[] };
  links: { label: string; url: string }[];
  projects: { name: string; years: string; summary: string; url?: string }[];
  fallback: boolean;
};

export type StoryEra<TImage = unknown> = {
  id: EraId;
  title: string;
  toy: ToyId;
  chapters: StoryChapter<TImage>[];
};

export const chapterAnchor = (id: string) => `ch-${id}`;

function localizer(lang: Lang) {
  let fallback = false;
  const pick = (value: Localized): string => {
    if (lang === 'en') return value.en;
    if (value.de) return value.de;
    fallback = true;
    return value.en;
  };
  return { pick, usedFallback: () => fallback };
}

export function localize(value: Localized, lang: Lang): string {
  return localizer(lang).pick(value);
}

function buildChapter<TImage>(chapter: ChapterData<TImage>, lang: Lang): StoryChapter<TImage> {
  const { pick, usedFallback } = localizer(lang);
  const built: Omit<StoryChapter<TImage>, 'fallback'> = {
    id: chapter.id,
    anchor: chapterAnchor(chapter.id),
    years: chapter.years,
    title: pick(chapter.title),
    story: pick(chapter.story),
    photos: (chapter.photos ?? []).map((p) => ({ src: p.src, alt: pick(p.alt) })),
    facts: chapter.facts && {
      ...(chapter.facts.role && { role: pick(chapter.facts.role) }),
      ...(chapter.facts.org && { org: chapter.facts.org }),
      ...(chapter.facts.tech && { tech: chapter.facts.tech }),
    },
    links: (chapter.links ?? []).map((l) => ({ label: pick(l.label), url: l.url })),
    projects: (chapter.projects ?? []).map((p) => ({ name: p.name, years: p.years, summary: pick(p.summary), url: p.url })),
  };
  return { ...built, fallback: usedFallback() };
}

export function buildStory<TImage>(eras: EraData[], chapters: ChapterData<TImage>[], lang: Lang): StoryEra<TImage>[] {
  const known = new Set<string>(eras.map((e) => e.id));
  for (const c of chapters) {
    if (!known.has(c.era)) throw new Error(`Chapter "${c.id}" references unknown era "${c.era}"`);
  }
  return [...eras]
    .sort((a, b) => a.order - b.order)
    .map((era) => ({
      id: era.id,
      title: localize(era.title, lang),
      toy: era.toy,
      chapters: chapters
        .filter((c) => c.era === era.id)
        .sort((a, b) => a.order - b.order)
        .map((c) => buildChapter(c, lang)),
    }));
}

export function findMissingTranslations(chapters: ChapterData[]): string[] {
  const missing: string[] = [];
  for (const c of chapters) {
    const check = (value: Localized | undefined, field: string) => {
      if (value && !value.de) missing.push(`${c.id}: ${field}`);
    };
    check(c.title, 'title');
    check(c.story, 'story');
    c.photos?.forEach((p, i) => check(p.alt, `photos[${i}].alt`));
    check(c.facts?.role, 'facts.role');
    c.links?.forEach((l, i) => check(l.label, `links[${i}].label`));
    c.projects?.forEach((p, i) => check(p.summary, `projects[${i}].summary`));
  }
  return missing;
}

export function yearsOfExperience(careerStartYear: number, now: Date): number {
  return now.getFullYear() - careerStartYear;
}
