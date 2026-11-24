import { createContext, useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'

const LanguageContext = createContext(null)

export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'si', label: 'Sinhala', native: 'සිංහල' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
]

export function LanguageProvider({ children }) {
  const { i18n: instance, t } = useTranslation()

  const value = useMemo(() => ({
    language: instance.language?.split('-')[0] || 'en',
    languages: LANGUAGES,
    t,
    changeLanguage: (code) => instance.changeLanguage(code),
    dir: (instance.language?.startsWith('ta') || instance.language?.startsWith('si')) ? 'ltr' : 'ltr',
  }), [instance.language, instance, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

// Convenience re-export so i18n init happens even if context isn't used yet
export { i18n }
