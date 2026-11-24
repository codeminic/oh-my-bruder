import { getCollection } from 'astro:content';
import type { ImageMetadata } from 'astro';
import type { Lang } from '../i18n/lang';
import { buildStory, type ChapterData, type EraData, type StoryEra } from './story';

export async function loadStory(lang: Lang): Promise<StoryEra<ImageMetadata>[]> {
  const eras: EraData[] = (await getCollection('eras')).map((e) => e.data);
  const chapters: ChapterData<ImageMetadata>[] = (await getCollection('chapters')).map((c) => ({
    ...c.data,
    id: c.id,
    era: c.data.era.id,
  }));
  return buildStory(eras, chapters, lang);
}

export async function loadProfile() {
  const [entry] = await getCollection('profile');
  if (!entry) throw new Error('Missing src/content/profile/profile.yaml');
  return entry.data;
}

export type Profile = Awaited<ReturnType<typeof loadProfile>>;
