import { useTranslation } from 'react-i18next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' }
]

export function LanguageSelector() {
  const { i18n, t } = useTranslation()

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode)
  }

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader>
        <CardTitle className="text-primary">{t('settings.language')}</CardTitle>
        <CardDescription className="text-primary">{t('settings.selectLanguage')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={i18n.language} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 border-2 border-yellow-500 text-foreground font-semibold hover:from-yellow-500 hover:to-orange-500 transition-all">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400">
            {languages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code} className="hover:bg-yellow-200/50 cursor-pointer">
                <span className="flex items-center gap-2">
                  <span className="text-2xl">{lang.flag}</span>
                  <span>{lang.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}
