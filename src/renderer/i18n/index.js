import { createI18n } from 'vue-i18n'

import fr from './fr.js'
import en from './en.js'
import de from './de.js'
import es from './es.js'
import it from './it.js'
import zh from './zh.js'
import { defaultLocale, normalizeLocale, supportedLocales } from './locales.js'

export { defaultLocale, normalizeLocale, supportedLocales }

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: defaultLocale,
  fallbackLocale: defaultLocale,
  messages: {
    fr,
    en,
    de,
    es,
    it,
    zh
  }
})

export function setLocale (locale) {
  i18n.global.locale.value = normalizeLocale(locale)
}

export default i18n
