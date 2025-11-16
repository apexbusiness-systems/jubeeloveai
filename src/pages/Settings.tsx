import { SEO } from '@/components/SEO';
import { useGameStore } from '@/store/useGameStore';
import { useJubeeStore, type JubeeVoice } from '@/store/useJubeeStore';
import { useParentalStore } from '@/store/useParentalStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Volume2, VolumeX, Sun, Moon, Sunrise, Sunset, Shield, Download, Play, GraduationCap } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStore } from '@/store/useOnboardingStore';

export default function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentTheme, updateTheme } = useGameStore();
  const { gender, setGender, voice, setVoice, speak } = useJubeeStore();
  const { children } = useParentalStore();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [testingVoice, setTestingVoice] = useState<JubeeVoice | null>(null);
  const { startOnboarding } = useOnboardingStore();

  const themes = [
    { name: 'morning', icon: Sunrise, label: 'Morning' },
    { name: 'evening', icon: Sunset, label: 'Evening' },
  ] as const;

  const voiceOptions = [
    { id: 'shimmer' as const, name: 'Shimmer', emoji: '✨', description: 'Warm & friendly' },
    { id: 'nova' as const, name: 'Nova', emoji: '🌟', description: 'Bright & cheerful' },
    { id: 'alloy' as const, name: 'Alloy', emoji: '🎯', description: 'Clear & balanced' },
    { id: 'echo' as const, name: 'Echo', emoji: '🎵', description: 'Smooth & calm' },
    { id: 'fable' as const, name: 'Fable', emoji: '📖', description: 'Storyteller voice' },
    { id: 'onyx' as const, name: 'Onyx', emoji: '💎', description: 'Deep & strong' },
  ];

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

  const handleVoiceChange = (newVoice: JubeeVoice) => {
    setVoice(newVoice);
    const voiceOption = voiceOptions.find(v => v.id === newVoice);
    speak(`Hi! I'm ${voiceOption?.name}!`);
    toast({
      title: t('common.success'),
      description: `Voice changed to ${voiceOption?.name}!`,
    });
  };

  const handleTestVoice = async (voiceId: JubeeVoice) => {
    setTestingVoice(voiceId);
    const currentVoice = voice;
    setVoice(voiceId);
    const voiceOption = voiceOptions.find(v => v.id === voiceId);
    await speak(`Hi! I'm ${voiceOption?.name}!`);
    if (voice !== voiceId) {
      setVoice(currentVoice);
    }
    setTestingVoice(null);
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

        {/* Tutorial */}
        <Card className="border-4 border-primary/30">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Tutorial
            </CardTitle>
            <CardDescription className="text-primary">
              Learn how to use the app with an interactive guide
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={startOnboarding}
              variant="outline"
              size="lg"
              className="w-full"
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Restart Tutorial
            </Button>
          </CardContent>
        </Card>

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

        {/* Voice Selection */}
        <Card className="border-4 border-primary/30">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Volume2 className="w-6 h-6" />
              Jubee's Voice
            </CardTitle>
            <CardDescription className="text-primary">
              Choose how Jubee sounds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {voiceOptions.map((option) => (
                <div
                  key={option.id}
                  className="relative p-4 rounded-xl border-3 transition-all"
                  style={{
                    borderColor: voice === option.id ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                    backgroundColor: voice === option.id ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted) / 0.3)',
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{option.emoji}</span>
                      <div>
                        <h4 className="font-bold text-primary">{option.name}</h4>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={() => handleVoiceChange(option.id)}
                      variant={voice === option.id ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                    >
                      {voice === option.id ? '✓ Selected' : 'Select'}
                    </Button>
                    <Button
                      onClick={() => handleTestVoice(option.id)}
                      variant="outline"
                      size="sm"
                      disabled={testingVoice === option.id}
                    >
                      <Play className={`h-4 w-4 ${testingVoice === option.id ? 'animate-pulse' : ''}`} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
