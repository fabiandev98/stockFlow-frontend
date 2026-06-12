/**
 * DEFINITIONS
 */
const I18N_STRATEGY = {
  NO_PREFIX: "no_prefix",
  PREFIX_EXCEPT_DEFAULT: "prefix_except_default",
  PREFIX: "prefix",
  PREFIX_AND_DEFAULT: "prefix_and_default",
} as const;

/**
 * Define here all the available locales in the app
 */
export const LOCALES = {
  en: {
    file: "en.json",
    name: "English",
  },
  es: {
    file: "es.json",
    name: "Español",
  },
} as const;

type I18nStrategy = (typeof I18N_STRATEGY)[keyof typeof I18N_STRATEGY];
export type I18nLocaleCode = keyof typeof LOCALES;
export type I18nLocale = {
  code: I18nLocaleCode;
  language: string;
  isCatchAllLocale?: boolean;
  file: (typeof LOCALES)[I18nLocaleCode]["file"];
  name: (typeof LOCALES)[I18nLocaleCode]["name"];
};

export const SET_I18N_STRATEGY: I18nStrategy = I18N_STRATEGY.PREFIX_AND_DEFAULT;
export const DEFAULT_I18N_LOCALE: I18nLocaleCode = "en";

// Lynx does not support locale subregions like 'en-US' or 'es-MX'. Instead, it uses
// a base language without subregions. Therefore, if there is an available locale, it
// is a catchall for the language it represents.
// Read more about catchall locales here: https://i18n.nuxtjs.org/docs/guide/seo#feature-details
export function availableLocales(): I18nLocale[] {
  return Object.entries(LOCALES).map(([code, { file, name }]) => ({
    code: code as I18nLocaleCode,
    language: code,
    isCatchAllLocale: true,
    file,
    name,
  }));
}
