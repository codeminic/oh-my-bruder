export const ui = {
  en: {
    skipToStory: 'Skip to the story',
    switchLanguage: 'Deutsch',
    switchLanguageLabel: 'Diese Seite auf Deutsch lesen',
    impressum: 'Impressum',
    privacy: 'Privacy',
    contact: 'Get in touch',
  },
  de: {
    skipToStory: 'Zur Geschichte springen',
    switchLanguage: 'English',
    switchLanguageLabel: 'Read this page in English',
    impressum: 'Impressum',
    privacy: 'Datenschutz',
    contact: 'Kontakt',
  },
} as const;

export type UiKey = keyof (typeof ui)['en'];
