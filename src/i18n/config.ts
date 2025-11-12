import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import zh from './locales/zh.json'
import hi from './locales/hi.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      zh: { translation: zh },
      hi: { translation: hi }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  })

// Expose i18n and current language to window for use in other modules
if (typeof window !== 'undefined') {
  (window as any).i18next = i18n;
  (window as any).i18nextLanguage = i18n.language;
  
  // Update window language when it changes
  i18n.on('languageChanged', (lng) => {
    (window as any).i18nextLanguage = lng;
  });
}

export default i18n
