# Interactive CV

A scroll-driven life story, from Lego Technic to electronics to software, in English and German.
Built with Astro and GSAP.

## Requirements

- Node 24 (`nvm use`, see `.nvmrc`)

## Run it

```bash
npm install
npm run dev            # http://localhost:4321
npm test               # unit tests
npx playwright install chromium   # once
npm run e2e            # end-to-end tests (builds and previews the site)
npm run check:content  # missing translations and remaining placeholders
```

## Content

All text lives in `src/content/`. No code changes are needed to edit the story.

| What | Where |
|---|---|
| Chapters | `src/content/chapters/<id>.yaml` |
| Eras (the three worlds) | `src/content/eras/*.yaml` |
| Name, tagline, skills, interests, contact, Impressum | `src/content/profile/profile.yaml` |
| Photos | `src/content/chapters/images/` |

### Add a chapter

1. Copy an existing chapter YAML. The file name becomes the chapter id and its link anchor (`#ch-<id>`).
2. Set `era` (`lego`, `electronics` or `software`) and `order` (its position inside that era).
3. Fill in `years`, `title` and `story`, each with `en` and `de`.
4. Optional: `facts`, `projects`, `links` and `photos` (see other chapters for the format).
5. Run `npm run check:content` to see any missing German text.

Missing German text falls back to English, so the page never breaks.

### Add a photo

Put the image in `src/content/chapters/images/` and reference it from a chapter:

```yaml
photos:
  - src: ./images/my-photo.jpg
    alt: { en: What the photo shows, de: Was das Foto zeigt }
```

Photos are optimised at build time and framed to match each era.

### Placeholders

Text that still needs writing starts with `PLACEHOLDER:`. `npm run check:content` lists every one.

### A new era

A new era is a new visual world, so it needs code: a `World.astro` in `src/worlds/`, a toy in `src/toys/`,
and the new id added to `EraId` in `src/lib/story.ts` and the schema in `src/content.config.ts`.
