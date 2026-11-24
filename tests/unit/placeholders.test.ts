import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { findPlaceholders } from '../../scripts/placeholders';

const root = join(import.meta.dirname, '..', '..');

describe('findPlaceholders', () => {
  it('finds placeholders in content YAML and in page templates', () => {
    const hits = findPlaceholders(root, ['src/content', 'src/pages']);
    expect(hits.some((h) => h.file.endsWith('lego-technic.yaml'))).toBe(true);
    expect(hits.some((h) => h.file.endsWith('privacy.astro'))).toBe(true);
    expect(hits.every((h) => h.line > 0 && h.text.includes('PLACEHOLDER'))).toBe(true);
  });
});
