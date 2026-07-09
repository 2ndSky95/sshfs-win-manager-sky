export const defaultLocale = 'en'

export const supportedLocaleOptions = [
  { value: 'en', labelKey: 'settings.languageEn' },
  { value: 'fr', labelKey: 'settings.languageFr' },
  { value: 'de', labelKey: 'settings.languageDe' },
  { value: 'es', labelKey: 'settings.languageEs' },
  { value: 'it', labelKey: 'settings.languageIt' },
  { value: 'zh', labelKey: 'settings.languageZh' }
]

export const supportedLocales = supportedLocaleOptions.map(locale => locale.value)

export function normalizeLocale (locale) {
  return supportedLocales.includes(locale) ? locale : defaultLocale
}
