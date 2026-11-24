import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

export type PlaceholderHit = { file: string; line: number; text: string };

const SCANNED = /\.(ya?ml|astro|md|ts)$/;

function* files(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (SCANNED.test(entry.name)) yield path;
  }
}

/** Every line containing PLACEHOLDER under the given directories (relative to root). */
export function findPlaceholders(root: string, dirs: string[]): PlaceholderHit[] {
  const hits: PlaceholderHit[] = [];
  for (const dir of dirs) {
    for (const file of files(join(root, dir))) {
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((text, i) => {
          if (text.includes('PLACEHOLDER')) hits.push({ file: relative(root, file), line: i + 1, text: text.trim() });
        });
    }
  }
  return hits;
}
