import { SEO } from '@/components/SEO';
import { useGameStore } from '@/store/useGameStore';
import { useJubeeStore } from '@/store/useJubeeStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Volume2, VolumeX, Sun, Moon, Sunrise, Sunset } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { currentTheme, updateTheme } = useGameStore();
  const { gender, setGender, speak } = useJubeeStore();
  const [soundEnabled, setSoundEnabled] = useState(true);

  const themes = [
    { name: 'morning', icon: Sunrise, label: 'Morning' },
    { name: 'afternoon', icon: Sun, label: 'Afternoon' },
    { name: 'evening', icon: Sunset, label: 'Evening' },
    { name: 'night', icon: Moon, label: 'Night' },
  ] as const;

  const handleGenderChange = (newGender: 'male' | 'female') => {
    setGender(newGender);
    speak(`Hi! I'm Jubee the ${newGender === 'female' ? 'girl' : 'boy'} bee!`);
    toast({
      title: "Voice Changed",
      description: `Jubee is now ${newGender === 'female' ? 'female' : 'male'}!`,
    });
  };

  const handleThemeChange = (theme: typeof currentTheme) => {
    updateTheme(theme);
    toast({
      title: "Theme Changed",
      description: `Theme set to ${theme}!`,
    });
  };

  return (
    <>
      <SEO 
        title="Jubee Love - Settings"
        description="Customize your Jubee learning experience with themes, sounds, and preferences."
      />
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <header className="text-center mb-8 pt-4">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2 flex items-center justify-center gap-3">
            <SettingsIcon className="w-10 h-10" />
            Settings
          </h1>
          <p className="text-primary">
            Customize your Jubee experience
          </p>
        </header>

        <Card className="border-4 border-primary/30">
          <CardHeader>
            <CardTitle className="text-primary">Jubee's Voice</CardTitle>
            <CardDescription className="text-primary">Choose how Jubee sounds</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button
              onClick={() => handleGenderChange('female')}
              variant={gender === 'female' ? 'default' : 'outline'}
              size="lg"
              className="flex-1"
            >
              Girl Bee (Higher Pitch)
            </Button>
            <Button
              onClick={() => handleGenderChange('male')}
              variant={gender === 'male' ? 'default' : 'outline'}
              size="lg"
              className="flex-1"
            >
              Boy Bee (Lower Pitch)
            </Button>
          </CardContent>
        </Card>

        <Card className="border-4 border-primary/30">
          <CardHeader>
            <CardTitle className="text-primary">Theme</CardTitle>
            <CardDescription className="text-primary">Change the look based on time of day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <CardTitle className="text-primary">Sound Effects</CardTitle>
            <CardDescription className="text-primary">Enable or disable sounds</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {soundEnabled ? (
                <Volume2 className="w-6 h-6 text-primary" />
              ) : (
                <VolumeX className="w-6 h-6 text-primary" />
              )}
              <Label htmlFor="sound-toggle" className="text-lg text-primary">
                {soundEnabled ? 'Sounds On' : 'Sounds Off'}
              </Label>
            </div>
            <Switch
              id="sound-toggle"
              checked={soundEnabled}
              onCheckedChange={(checked) => {
                setSoundEnabled(checked);
                toast({
                  title: checked ? "Sounds Enabled" : "Sounds Disabled",
                  description: checked ? "Jubee can speak again!" : "Jubee will be quiet now.",
                });
              }}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
