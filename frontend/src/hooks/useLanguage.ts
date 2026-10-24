import { useState, useEffect, useCallback } from 'react'
import { SupportedLanguage } from '../lib/types'
import guStrings from '../i18n/gu.json'
import hiStrings from '../i18n/hi.json'
import enStrings from '../i18n/en.json'

const translations: Record<SupportedLanguage, Record<string, string>> = {
  gu: guStrings,
  hi: hiStrings,
  en: enStrings,
}

const STORAGE_KEY = 'scam_shield_lang'

export function useLanguage() {
  const [language, setLanguageState] = useState<SupportedLanguage>('gu')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null
    if (saved && (saved === 'gu' || saved === 'hi' || saved === 'en')) {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang)
    localStorage.setItem(STORAGE_KEY, lang)
  }, [])

  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations.en[key] || key
    },
    [language]
  )

  return {
    language,
    setLanguage,
    t,
  }
}
