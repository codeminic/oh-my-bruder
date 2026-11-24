// Lists missing German translations and remaining PLACEHOLDER markers. Always exits 0.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'yaml';
import { findMissingTranslations, type ChapterData } from '../src/lib/story';

const root = join(import.meta.dirname, '..', 'src', 'content');
const chaptersDir = join(root, 'chapters');

const chapters: ChapterData[] = readdirSync(chaptersDir)
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => ({ id: f.replace(/\.yaml$/, ''), ...parse(readFileSync(join(chaptersDir, f), 'utf8')) }));

const missing = findMissingTranslations(chapters);
console.log(missing.length ? `Missing German translations (${missing.length}):` : 'Missing German translations: none');
for (const m of missing) console.log(`  - ${m}`);

function* yamlFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* yamlFiles(path);
    else if (entry.name.endsWith('.yaml')) yield path;
  }
}

const placeholders: string[] = [];
for (const file of yamlFiles(root)) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (line.includes('PLACEHOLDER')) placeholders.push(`${relative(process.cwd(), file)}:${i + 1}  ${line.trim()}`);
    });
}
console.log(placeholders.length ? `\nPlaceholders left (${placeholders.length}):` : '\nPlaceholders left: none');
for (const p of placeholders) console.log(`  - ${p}`);
