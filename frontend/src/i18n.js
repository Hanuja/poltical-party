import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './translations/en.json'
import ta from './translations/ta.json'
import si from './translations/si.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ta: { translation: ta },
      si: { translation: si },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ta', 'si'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'pp_lang',
      caches: ['localStorage'],
    },
    returnNull: false,
  })

export default i18n
