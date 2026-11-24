// Lists missing German translations and remaining PLACEHOLDER markers (content and pages). Always exits 0.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { findMissingTranslations, type ChapterData } from '../src/lib/story';
import { findPlaceholders } from './placeholders';

const repo = join(import.meta.dirname, '..');
const chaptersDir = join(repo, 'src', 'content', 'chapters');

const chapters: ChapterData[] = readdirSync(chaptersDir)
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => ({ id: f.replace(/\.yaml$/, ''), ...parse(readFileSync(join(chaptersDir, f), 'utf8')) }));

const missing = findMissingTranslations(chapters);
console.log(missing.length ? `Missing German translations (${missing.length}):` : 'Missing German translations: none');
for (const m of missing) console.log(`  - ${m}`);

const placeholders = findPlaceholders(repo, ['src/content', 'src/pages']).map(
  (h) => `${h.file}:${h.line}  ${h.text}`,
);
console.log(placeholders.length ? `\nPlaceholders left (${placeholders.length}):` : '\nPlaceholders left: none');
for (const p of placeholders) console.log(`  - ${p}`);
