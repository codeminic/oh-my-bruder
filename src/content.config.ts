import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const localized = z.object({ en: z.string().min(1), de: z.string().min(1).optional() });

const eras = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/eras' }),
  schema: z.object({
    id: z.enum(['lego', 'electronics', 'software']),
    order: z.number(),
    title: localized,
    toy: z.enum(['gears', 'breadboard', 'code']),
  }),
});

const chapters = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/chapters' }),
  schema: ({ image }) =>
    z.object({
      era: reference('eras'),
      order: z.number(),
      years: z.string().min(1),
      title: localized,
      story: localized,
      photos: z.array(z.object({ src: image(), alt: localized })).optional(),
      facts: z
        .object({ role: localized.optional(), org: z.string().optional(), tech: z.array(z.string()).optional() })
        .optional(),
      links: z.array(z.object({ label: localized, url: z.url() })).optional(),
      projects: z
        .array(z.object({ name: z.string(), years: z.string(), summary: localized, url: z.url().optional() }))
        .optional(),
    }),
});

const profile = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/profile' }),
  schema: z.object({
    name: z.string(),
    careerStartYear: z.number().int(),
    role: localized,
    tagline: localized,
    email: z.email(),
    skills: z.array(z.object({ group: localized, items: z.array(z.string()) })),
    certifications: z.array(z.object({ year: z.number().int(), name: z.string() })),
    languages: z.array(z.object({ name: localized, level: localized })),
    interests: z.array(z.object({ name: localized, text: localized })),
    impressum: z.object({ name: z.string(), email: z.email() }),
  }),
});

export const collections = { eras, chapters, profile };
