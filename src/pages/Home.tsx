import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SEO } from '@/components/SEO';
import { useJubeeStore } from '@/store/useJubeeStore';
import { Download } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Check if app is installed or user dismissed banner
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = localStorage.getItem('install-banner-dismissed');
    
    if (!isStandalone && !dismissed) {
      // Show banner after a short delay
      const timer = setTimeout(() => setShowInstallBanner(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('install-banner-dismissed', 'true');
  };

  return (
    <>
      <SEO 
        title="Jubee Love - Home"
        description="Welcome to Jubee's World! Choose from writing practice, shape recognition, and more fun learning activities."
      />
      <div className="home-page">
        {showInstallBanner && (
          <div className="mx-4 mt-4 mb-2 animate-in slide-in-from-top duration-500">
            <Card className="border-2 border-primary bg-gradient-to-r from-primary/10 to-accent/10">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <Download className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm md:text-base">Install Jubee Love for a better experience!</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Works offline, loads faster, and feels like a real app.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => navigate('/install')}
                    size="sm"
                    className="flex-shrink-0"
                  >
                    Install
                  </Button>
                  <Button
                    onClick={dismissBanner}
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0"
                  >
                    ✕
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        <h1 className="text-4xl md:text-5xl font-bold text-center mt-8 text-primary">
          Welcome to Jubee's World!
        </h1>
        <p className="text-center text-primary mt-4 px-4 max-w-2xl mx-auto">
          Learn and play with Jubee the friendly bee! Choose an activity below to start your educational adventure.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 max-w-4xl mx-auto">
          <GameCard
            title="Writing Practice"
            icon="✏️"
            path="/write"
            description="Practice your writing skills with fun drawing activities"
          />
          <GameCard
            title="Shape Recognition"
            icon="⭐"
            path="/shapes"
            description="Learn and identify different shapes"
          />
          <GameCard
            title="Story Time"
            icon="📖"
            path="/stories"
            description="Read interactive stories with Jubee"
          />
          <GameCard
            title="Games"
            icon="🎮"
            path="/games"
            description="Play memory and pattern games"
          />
          <GameCard
            title="My Progress"
            icon="📊"
            path="/progress"
            description="See your scores, achievements, and learning stats"
          />
          <GameCard
            title="Sticker Collection"
            icon="🎁"
            path="/stickers"
            description="Collect and unlock colorful stickers and rewards"
          />
          <GameCard
            title="Music Library"
            icon="🎵"
            path="/music"
            description="Listen to fun songs and lullabies"
          />
          <GameCard
            title="Reading Practice"
            icon="📚"
            path="/reading"
            description="Learn to read with Jubee's pronunciation help"
          />
        </div>
      </div>
    </>
  );
}

interface GameCardProps {
  title: string;
  icon: React.ReactNode | string;
  path: string;
  description: string;
}

function GameCard({ title, icon, path, description }: GameCardProps) {
  const navigate = useNavigate();
  const { triggerAnimation } = useJubeeStore();

  const handleClick = () => {
    triggerAnimation('excited');
    navigate(path);
  };

  return (
    <button
      onClick={handleClick}
      className="game-card group focus:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={`Start ${title} activity`}
    >
      <div className="w-24 h-24 transition-transform group-hover:scale-110 text-primary flex items-center justify-center" aria-hidden="true">
        {typeof icon === 'string' ? <span className="text-6xl">{icon}</span> : icon}
      </div>
      <span className="text-2xl md:text-3xl mt-4 font-bold text-primary">{title}</span>
      <p className="text-sm text-primary mt-2 px-4">{description}</p>
    </button>
  );
}
