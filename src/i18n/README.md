# Multi-Language Support (i18n)

This application supports multiple languages using `react-i18next`.

## Supported Languages

- 🇺🇸 English (en)
- 🇪🇸 Spanish (es)
- 🇫🇷 French (fr)
- 🇨🇳 Mandarin Chinese (zh)
- 🇮🇳 Hindi (hi)

## Usage in Components

```tsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  
  return (
    <div>
      <h1>{t('home.welcome')}</h1>
      <p>{t('home.subtitle')}</p>
    </div>
  )
}
```

## Voice Narration

The text-to-speech system automatically uses the selected language:
- Voice selection is optimized per language
- Fallback to browser speech synthesis with proper language codes
- Chinese uses specialized voice for better pronunciation
- Hindi uses optimized voice settings

## Adding New Languages

1. Create a new JSON file in `src/i18n/locales/` (e.g., `de.json`)
2. Copy the structure from `en.json`
3. Translate all keys
4. Import and add to `src/i18n/config.ts`
5. Add language option to `src/components/LanguageSelector.tsx`
6. Update voice settings in `supabase/functions/text-to-speech/index.ts` if needed

## Translation Keys Structure

- `app.*` - Application-level strings
- `nav.*` - Navigation items
- `home.*` - Home page content
- `progress.*` - Progress page
- `achievements.*` - Achievement system
- `shapes.*` - Shape recognition activity
- `writing.*` - Writing practice
- `games.*` - Game activities
- `stickers.*` - Sticker collection
- `settings.*` - Settings page
- `personalization.*` - Personalization options
- `parental.*` - Parental controls
- `common.*` - Common UI elements

## Language Detection

The app automatically detects the user's language from:
1. Previously selected language (stored in localStorage)
2. Browser language settings
3. Falls back to English if no match found

## Testing

To test different languages:
1. Go to Settings
2. Select a language from the Language Selector
3. The entire app UI and voice narration will update
