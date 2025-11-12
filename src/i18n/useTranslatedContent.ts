import { useTranslation } from 'react-i18next'

/**
 * Hook to access translated content with proper typing
 * Provides type-safe access to all translation keys
 */
export function useTranslatedContent() {
  const { t, i18n } = useTranslation()
  
  return {
    t,
    language: i18n.language,
    changeLanguage: i18n.changeLanguage,
    
    // Navigation
    nav: {
      home: t('nav.home'),
      write: t('nav.write'),
      shapes: t('nav.shapes'),
      progress: t('nav.progress'),
      stickers: t('nav.stickers'),
      settings: t('nav.settings')
    },
    
    // Common
    common: {
      loading: t('common.loading'),
      error: t('common.error'),
      success: t('common.success'),
      close: t('common.close'),
      save: t('common.save'),
      cancel: t('common.cancel')
    },
    
    // App
    app: {
      title: t('app.title'),
      tagline: t('app.tagline')
    }
  }
}
