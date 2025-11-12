import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Check, Smartphone, Monitor } from 'lucide-react';
import { SEO } from '@/components/SEO';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  if (isStandalone) {
    return (
      <>
        <SEO 
          title="Install Jubee Love"
          description="Install Jubee Love as an app on your device for the best experience"
        />
        <div className="container max-w-2xl mx-auto p-8 pt-24">
          <Card className="border-4 border-primary">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Check className="w-20 h-20 text-primary" />
              </div>
              <CardTitle className="text-4xl text-primary">Already Installed!</CardTitle>
              <CardDescription className="text-xl mt-4">
                Jubee Love is already installed on your device. You're all set to learn and play!
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={() => navigate('/')}
                size="lg"
                className="text-xl"
              >
                Start Learning
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="Install Jubee Love"
        description="Install Jubee Love as an app on your device for offline access and the best learning experience"
      />
      <div className="container max-w-4xl mx-auto p-8 pt-24">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-primary mb-4">
            📱 Install Jubee Love
          </h1>
          <p className="text-2xl text-muted-foreground">
            Get the full app experience with offline access!
          </p>
        </div>

        {deferredPrompt && (
          <Card className="mb-8 border-4 border-primary bg-gradient-to-br from-primary/10 to-accent/10">
            <CardHeader>
              <CardTitle className="text-3xl text-primary flex items-center gap-3">
                <Download className="w-8 h-8" />
                Quick Install Available
              </CardTitle>
              <CardDescription className="text-lg">
                Install Jubee Love with one click for the best experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleInstallClick}
                size="lg"
                className="w-full text-xl py-6"
              >
                <Download className="mr-2 h-6 w-6" />
                Install Now
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="border-2 border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Smartphone className="w-8 h-8 text-primary" />
                <CardTitle className="text-2xl">On Mobile</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-bold text-lg mb-2">iPhone (Safari)</h3>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Tap the Share button</li>
                  <li>Scroll and tap "Add to Home Screen"</li>
                  <li>Tap "Add"</li>
                </ol>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Android (Chrome)</h3>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Tap the menu (three dots)</li>
                  <li>Tap "Add to Home screen"</li>
                  <li>Tap "Add"</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Monitor className="w-8 h-8 text-primary" />
                <CardTitle className="text-2xl">On Desktop</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-bold text-lg mb-2">Chrome/Edge</h3>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Click the install icon in the address bar</li>
                  <li>Or use the menu → "Install Jubee Love"</li>
                </ol>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Firefox</h3>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Click the menu (three lines)</li>
                  <li>Click "Install"</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 border-accent">
          <CardHeader>
            <CardTitle className="text-2xl text-center">✨ Benefits of Installing</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-lg"><strong>Works Offline:</strong> Access all activities without internet</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-lg"><strong>Faster Loading:</strong> Opens instantly like a native app</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-lg"><strong>Home Screen Icon:</strong> Easy access from your device</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-lg"><strong>Full Screen:</strong> Immersive learning experience</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-lg"><strong>Progress Saved:</strong> All your data stays on your device</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            size="lg"
          >
            Continue in Browser
          </Button>
        </div>
      </div>
    </>
  );
}
