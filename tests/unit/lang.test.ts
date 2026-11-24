import { describe, expect, it } from 'vitest';
import { detectPreferredLang, localizedPath, t } from '../../src/i18n/lang';

describe('detectPreferredLang', () => {
  it('picks German for a Swiss German browser', () => {
    expect(detectPreferredLang(['de-CH', 'en'])).toBe('de');
  });
  it('skips unsupported languages and takes the first supported one', () => {
    expect(detectPreferredLang(['fr-CH', 'en-GB'])).toBe('en');
  });
  it('falls back to English when nothing matches', () => {
    expect(detectPreferredLang(['fr', 'it'])).toBe('en');
    expect(detectPreferredLang([])).toBe('en');
  });
  it('prefers a valid stored choice', () => {
    expect(detectPreferredLang(['de'], 'en')).toBe('en');
  });
  it('ignores an invalid stored choice', () => {
    expect(detectPreferredLang(['de'], 'xx')).toBe('de');
  });
});

describe('localizedPath', () => {
  it('builds a prefixed path with trailing slash', () => {
    expect(localizedPath('de', 'impressum')).toBe('/de/impressum/');
  });
  it('builds the locale root with a hash', () => {
    expect(localizedPath('en', '', 'ch-x')).toBe('/en/#ch-x');
  });
});

describe('t', () => {
  it('returns the string for the language', () => {
    expect(t('de', 'impressum')).toBe('Impressum');
    expect(t('en', 'privacy')).toBe('Privacy');
  });
});
