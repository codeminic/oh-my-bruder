import { describe, expect, it } from 'vitest';
import {
  buildStory,
  findMissingTranslations,
  yearsOfExperience,
  type ChapterData,
  type EraData,
} from '../../src/lib/story';

const eras: EraData[] = [
  { id: 'software', order: 3, title: { en: 'Software', de: 'Software' }, toy: 'code' },
  { id: 'lego', order: 1, title: { en: 'Bricks', de: 'Steine' }, toy: 'excavator' },
  { id: 'electronics', order: 2, title: { en: 'Circuits', de: 'Schaltungen' }, toy: 'breadboard' },
];

function chapter(partial: Partial<ChapterData> & Pick<ChapterData, 'id' | 'era' | 'order'>): ChapterData {
  return {
    years: '2000',
    title: { en: `T ${partial.id}`, de: `T-de ${partial.id}` },
    story: { en: `S ${partial.id}`, de: `S-de ${partial.id}` },
    ...partial,
  };
}

describe('buildStory', () => {
  it('orders eras and the chapters inside them', () => {
    const chapters = [
      chapter({ id: 'b', era: 'lego', order: 2 }),
      chapter({ id: 'a', era: 'lego', order: 1 }),
      chapter({ id: 'c', era: 'software', order: 1 }),
    ];
    const story = buildStory(eras, chapters, 'en');
    expect(story.map((e) => e.id)).toEqual(['lego', 'electronics', 'software']);
    expect(story[0].chapters.map((c) => c.id)).toEqual(['a', 'b']);
    expect(story[1].chapters).toEqual([]);
    expect(story[0].title).toBe('Bricks');
    expect(story[0].toy).toBe('excavator');
  });

  it('falls back to English when German is missing', () => {
    const ch = chapter({ id: 'x', era: 'lego', order: 1, title: { en: 'Only EN' }, story: { en: 'EN story' } });
    const de = buildStory(eras, [ch], 'de')[0].chapters[0];
    expect(de.title).toBe('Only EN');
    expect(de.story).toBe('EN story');
    expect(de.fallback).toBe(true);
    const en = buildStory(eras, [ch], 'en')[0].chapters[0];
    expect(en.fallback).toBe(false);
  });

  it('uses German when present', () => {
    const de = buildStory(eras, [chapter({ id: 'x', era: 'lego', order: 1 })], 'de')[0].chapters[0];
    expect(de.title).toBe('T-de x');
    expect(de.fallback).toBe(false);
  });

  it('defaults optional lists to empty arrays', () => {
    const c = buildStory(eras, [chapter({ id: 'x', era: 'lego', order: 1 })], 'en')[0].chapters[0];
    expect(c.photos).toEqual([]);
    expect(c.links).toEqual([]);
    expect(c.projects).toEqual([]);
    expect(c.facts).toBeUndefined();
  });

  it('marks a chapter as fallback when a project summary lacks German', () => {
    const ch = chapter({
      id: 'p',
      era: 'software',
      order: 1,
      projects: [{ name: 'liberoCloud', years: '2015–2017', summary: { en: 'Cold chain' } }],
    });
    const c = buildStory(eras, [ch], 'de')[2].chapters[0];
    expect(c.projects[0]).toEqual({ name: 'liberoCloud', years: '2015–2017', summary: 'Cold chain', url: undefined });
    expect(c.fallback).toBe(true);
  });

  it('localizes facts', () => {
    const ch = chapter({
      id: 'f',
      era: 'software',
      order: 1,
      facts: { role: { en: 'Architect', de: 'Architekt' }, org: 'Bühler', tech: ['.NET'] },
    });
    expect(buildStory(eras, [ch], 'de')[2].chapters[0].facts).toEqual({ role: 'Architekt', org: 'Bühler', tech: ['.NET'] });
  });

  it('throws on an unknown era', () => {
    expect(() => buildStory(eras, [chapter({ id: 'z', era: 'space', order: 1 })], 'en')).toThrow(
      'Chapter "z" references unknown era "space"',
    );
  });

  it('builds the anchor from the id', () => {
    expect(buildStory(eras, [chapter({ id: 'apprenticeship', era: 'electronics', order: 1 })], 'en')[1].chapters[0].anchor).toBe(
      'ch-apprenticeship',
    );
  });
});

describe('findMissingTranslations', () => {
  it('lists missing German fields by chapter', () => {
    const chapters = [
      chapter({ id: 'ch-a', era: 'lego', order: 1, story: { en: 'only en' } }),
      chapter({
        id: 'b',
        era: 'lego',
        order: 2,
        projects: [{ name: 'P', years: '1', summary: { en: 'x' } }],
        links: [{ label: { en: 'L' }, url: 'https://example.com' }],
      }),
      chapter({ id: 'ok', era: 'lego', order: 3 }),
    ];
    expect(findMissingTranslations(chapters)).toEqual(['ch-a: story', 'b: links[0].label', 'b: projects[0].summary']);
  });
});

describe('yearsOfExperience', () => {
  it('counts whole calendar years since the start year', () => {
    expect(yearsOfExperience(2015, new Date('2026-11-24'))).toBe(11);
  });
});
