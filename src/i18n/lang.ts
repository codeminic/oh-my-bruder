import { ui, type UiKey } from './ui';

export type Lang = 'en' | 'de';
export const LANGS: readonly Lang[] = ['en', 'de'];
export const DEFAULT_LANG: Lang = 'en';
export const LANG_STORAGE_KEY = 'cv-lang';

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

export function detectPreferredLang(languages: readonly string[], stored?: string | null): Lang {
  if (isLang(stored)) return stored;
  for (const tag of languages) {
    const primary = tag.toLowerCase().split('-')[0];
    if (isLang(primary)) return primary;
  }
  return DEFAULT_LANG;
}

export function localizedPath(lang: Lang, path = '', hash?: string): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  const base = clean ? `/${lang}/${clean}/` : `/${lang}/`;
  return hash ? `${base}#${hash}` : base;
}

export function otherLang(lang: Lang): Lang {
  return lang === 'en' ? 'de' : 'en';
}

export function t(lang: Lang, key: UiKey): string {
  return ui[lang][key];
}
