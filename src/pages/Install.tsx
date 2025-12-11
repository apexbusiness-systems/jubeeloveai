import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Check, Smartphone, Monitor, Share2, MoreVertical, Chrome, Apple } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useToast } from '@/hooks/use-toast';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Platform = 'ios' | 'android' | 'desktop' | 'unknown';
type Browser = 'safari' | 'chrome' | 'firefox' | 'edge' | 'other';

const detectPlatform = (): Platform => {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/windows|mac|linux/.test(ua)) return 'desktop';
  return 'unknown';
};

const detectBrowser = (): Browser => {
  const ua = navigator.userAgent.toLowerCase();
  if (/safari/.test(ua) && !/chrome/.test(ua)) return 'safari';
  if (/chrome/.test(ua) && !/edge/.test(ua)) return 'chrome';
  if (/firefox/.test(ua)) return 'firefox';
  if (/edge/.test(ua)) return 'edge';
  return 'other';
};

export default function Install() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [_isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform] = useState<Platform>(detectPlatform());
  const [browser] = useState<Browser>(detectBrowser());
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

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
      setShowInstructions(true);
      toast({
        title: "Manual Installation Required",
        description: "Please follow the instructions below to install the app.",
      });
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstalled(true);
        toast({
          title: "Installation Started!",
          description: "Jubee Love is being installed on your device.",
        });
      } else {
        setShowInstructions(true);
      }
    } catch (error) {
      console.error('Install prompt error:', error);
      setShowInstructions(true);
    }

    setDeferredPrompt(null);
  };

  const renderPlatformInstructions = () => {
    if (platform === 'ios') {
      return (
        <Card className="border-2 border-primary/50">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Apple className="w-8 h-8 text-primary" />
              <CardTitle className="text-2xl">Install on iPhone/iPad</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-base">
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[1.5rem]">1.</span>
                <span>Tap the <Share2 className="inline w-5 h-5 mx-1" /> <strong>Share</strong> button at the bottom of Safari</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[1.5rem]">2.</span>
                <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[1.5rem]">3.</span>
                <span>Tap <strong>"Add"</strong> in the top right</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[1.5rem]">4.</span>
                <span>Find Jubee Love on your home screen! 🎉</span>
              </li>
            </ol>
            {browser !== 'safari' && (
              <div className="mt-4 p-4 bg-accent/20 rounded-lg">
                <p className="text-sm font-semibold text-accent-foreground">
                  ⚠️ Note: Installation works best in Safari on iOS
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    if (platform === 'android') {
      return (
        <Card className="border-2 border-primary/50">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Chrome className="w-8 h-8 text-primary" />
              <CardTitle className="text-2xl">Install on Android</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-3 text-base">
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[1.5rem]">1.</span>
                <span>Tap the <MoreVertical className="inline w-5 h-5 mx-1" /> <strong>menu</strong> button (three dots) at the top right</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[1.5rem]">2.</span>
                <span>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[1.5rem]">3.</span>
                <span>Tap <strong>"Add"</strong> or <strong>"Install"</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[1.5rem]">4.</span>
                <span>Open Jubee Love from your home screen! 🎉</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      );
    }

    if (platform === 'desktop') {
      return (
        <Card className="border-2 border-primary/50">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Monitor className="w-8 h-8 text-primary" />
              <CardTitle className="text-2xl">Install on Desktop</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(browser === 'chrome' || browser === 'edge') && (
              <div>
                <h3 className="font-bold text-lg mb-2">Chrome/Edge</h3>
                <ol className="list-decimal list-inside space-y-2 text-base">
                  <li>Look for the <Download className="inline w-4 h-4 mx-1" /> install icon in the address bar</li>
                  <li>Click it and select "Install"</li>
                  <li>Or use the menu → "Install Jubee Love"</li>
                </ol>
              </div>
            )}
            {browser === 'firefox' && (
              <div>
                <h3 className="font-bold text-lg mb-2">Firefox</h3>
                <ol className="list-decimal list-inside space-y-2 text-base">
                  <li>Click the menu button (three lines)</li>
                  <li>Select "Install"</li>
                </ol>
              </div>
            )}
            {browser === 'other' && (
              <div>
                <p className="text-base">
                  Look for an install button in your browser's address bar or menu.
                  Most modern browsers support installing web apps!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    return null;
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
      <div className="container max-w-4xl mx-auto p-4 md:p-8 pt-16 md:pt-24">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            📱 Install Jubee Love
          </h1>
          <p className="text-lg md:text-2xl text-muted-foreground">
            Get the full app experience with offline access!
          </p>
        </div>

        {deferredPrompt ? (
          <Card className="mb-8 border-4 border-primary bg-gradient-to-br from-primary/20 to-accent/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl text-primary flex items-center gap-3">
                <Download className="w-6 h-6 md:w-8 md:h-8 animate-bounce" />
                One-Click Install Available!
              </CardTitle>
              <CardDescription className="text-base md:text-lg">
                Your browser supports instant installation. Click below to add Jubee Love to your device now.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleInstallClick}
                size="lg"
                className="w-full text-lg md:text-xl py-6 md:py-8"
              >
                <Download className="mr-2 h-5 w-5 md:h-6 md:w-6" />
                Install Jubee Love Now
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8 border-2 border-primary/50">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl text-primary flex items-center gap-3">
                <Smartphone className="w-6 h-6 md:w-8 md:h-8" />
                Install Manually
              </CardTitle>
              <CardDescription className="text-base md:text-lg">
                Follow the simple steps below to install Jubee Love on your {platform} device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setShowInstructions(true)}
                size="lg"
                className="w-full text-lg md:text-xl py-6"
              >
                Show Installation Instructions
              </Button>
            </CardContent>
          </Card>
        )}

        {(showInstructions || !deferredPrompt) && (
          <div className="mb-8 animate-in slide-in-from-top duration-500">
            {renderPlatformInstructions()}
          </div>
        )}

        <Card className="border-2 border-accent/50 bg-gradient-to-br from-accent/5 to-primary/5">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl text-center">✨ Why Install Jubee Love?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-base md:text-lg"><strong>Works Offline:</strong> Learn anytime, even without internet</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-base md:text-lg"><strong>Lightning Fast:</strong> Opens instantly like a real app</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-base md:text-lg"><strong>Home Screen Access:</strong> Find it easily alongside your favorite apps</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-base md:text-lg"><strong>Full Screen Mode:</strong> Distraction-free learning experience</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-base md:text-lg"><strong>Private & Secure:</strong> All progress saved locally on your device</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="text-center mt-6 md:mt-8 space-y-4">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            size="lg"
            className="text-base md:text-lg"
          >
            Continue in Browser Instead
          </Button>
          <p className="text-sm text-muted-foreground">
            You can always install later from your browser menu
          </p>
        </div>
      </div>
    </>
  );
}
