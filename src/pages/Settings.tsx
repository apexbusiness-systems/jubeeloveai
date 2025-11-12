import { SEO } from '@/components/SEO';
import { useGameStore } from '@/store/useGameStore';
import { useJubeeStore } from '@/store/useJubeeStore';
import { useParentalStore } from '@/store/useParentalStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Volume2, VolumeX, Sun, Moon, Sunrise, Sunset, Shield, Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentTheme, updateTheme } = useGameStore();
  const { gender, setGender, speak } = useJubeeStore();
  const { children } = useParentalStore();
  const [soundEnabled, setSoundEnabled] = useState(true);

  const themes = [
    { name: 'morning', icon: Sunrise, label: 'Morning' },
    { name: 'afternoon', icon: Sun, label: 'Afternoon' },
    { name: 'evening', icon: Sunset, label: 'Evening' },
    { name: 'night', icon: Moon, label: 'Night' },
  ] as const;

  const handleGenderChange = (newGender: 'male' | 'female') => {
    setGender(newGender);
    const message = t('personalization.voiceGender');
    speak(`${message}!`);
    toast({
      title: t('common.success'),
      description: `${t('personalization.voiceGender')} ${newGender === 'female' ? t('personalization.female') : t('personalization.male')}!`,
    });
  };

  const handleThemeChange = (theme: typeof currentTheme) => {
    updateTheme(theme);
    toast({
      title: t('common.success'),
      description: `${t('settings.theme')} ${theme}!`,
    });
  };

  return (
    <>
      <SEO 
        title={`${t('app.title')} - ${t('settings.title')}`}
        description={t('settings.title')}
      />
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <header className="text-center mb-8 pt-4">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2 flex items-center justify-center gap-3">
            <SettingsIcon className="w-10 h-10" />
            {t('settings.title')}
          </h1>
          <p className="text-primary">
            {t('settings.title')}
          </p>
        </header>

        {/* Language Selection */}
        <LanguageSelector />

        <Card className="border-4 border-primary/30">
          <CardHeader>
            <CardTitle className="text-primary">{t('personalization.voiceGender')}</CardTitle>
            <CardDescription className="text-primary">{t('personalization.voiceGender')}</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button
              onClick={() => handleGenderChange('female')}
              variant={gender === 'female' ? 'default' : 'outline'}
              size="lg"
              className="flex-1"
            >
              {t('personalization.girl')} {t('personalization.female')}
            </Button>
            <Button
              onClick={() => handleGenderChange('male')}
              variant={gender === 'male' ? 'default' : 'outline'}
              size="lg"
              className="flex-1"
            >
              {t('personalization.boy')} {t('personalization.male')}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-4 border-primary/30">
          <CardHeader>
            <CardTitle className="text-primary">{t('settings.theme')}</CardTitle>
            <CardDescription className="text-primary">{t('settings.theme')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {themes.map(({ name, icon: Icon, label }) => (
                <Button
                  key={name}
                  onClick={() => handleThemeChange(name)}
                  variant={currentTheme === name ? 'default' : 'outline'}
                  className="h-24 flex-col gap-2"
                >
                  <Icon className="w-8 h-8" />
                  <span>{label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-4 border-primary/30">
          <CardHeader>
            <CardTitle className="text-primary">{t('settings.soundEffects')}</CardTitle>
            <CardDescription className="text-primary">{t('settings.voiceNarration')}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {soundEnabled ? (
                <Volume2 className="w-6 h-6 text-primary" />
              ) : (
                <VolumeX className="w-6 h-6 text-primary" />
              )}
              <Label htmlFor="sound-toggle" className="text-lg text-primary">
                {soundEnabled ? t('settings.soundEffects') : t('settings.soundEffects')}
              </Label>
            </div>
            <Switch
              id="sound-toggle"
              checked={soundEnabled}
              onCheckedChange={(checked) => {
                setSoundEnabled(checked);
                toast({
                  title: checked ? t('common.success') : t('common.success'),
                  description: checked ? t('settings.voiceNarration') : t('settings.voiceNarration'),
                });
              }}
            />
          </CardContent>
        </Card>

        {/* Parental Controls Link */}
        {children.length > 0 && (
          <Card className="border-4 border-primary/30">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Shield className="w-6 h-6" />
                {t('settings.parentalControls')}
              </CardTitle>
              <CardDescription className="text-primary">{t('settings.manageProfiles')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/parental-controls')}
                variant="default"
                size="lg"
                className="w-full"
              >
                {t('settings.manageProfiles')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Install App */}
        <Card className="border-4 border-primary/30">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Download className="w-6 h-6" />
              {t('settings.install')}
            </CardTitle>
            <CardDescription className="text-primary">{t('settings.installDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/install')}
              variant="outline"
              size="lg"
              className="w-full"
            >
              {t('install.instructions')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
