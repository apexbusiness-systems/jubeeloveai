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
      <div className="home-page w-full">
        {showInstallBanner && (
          <div className="mb-4 animate-in slide-in-from-top duration-500">
            <Card className="border-2 border-primary/30 bg-card/95 backdrop-blur-sm">
              <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-start sm:items-center gap-3 flex-1">
                  <Download className="w-5 h-5 text-primary flex-shrink-0 mt-0.5 sm:mt-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm md:text-base text-foreground">Install Jubee Love for a better experience!</p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Works offline, loads faster, and feels like a real app.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    onClick={() => navigate('/install')}
                    size="sm"
                    className="flex-1 sm:flex-initial min-h-[44px] min-w-[80px]"
                  >
                    Install
                  </Button>
                  <Button
                    onClick={dismissBanner}
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0 min-h-[44px] min-w-[44px]"
                  >
                    ✕
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-3 sm:mb-4 text-primary leading-tight">
          Welcome to Jubee's World!
        </h1>
        <p className="text-center text-foreground/90 mb-6 sm:mb-8 px-4 max-w-2xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed">
          Learn and play with Jubee the friendly bee! Choose an activity below to start your educational adventure.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
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
      className="
        game-card group
        focus:outline-none 
        focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2
        min-h-[160px] sm:min-h-[180px]
      "
      aria-label={`Start ${title} activity`}
    >
      <div 
        className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 transition-transform group-hover:scale-110 text-primary flex items-center justify-center" 
        aria-hidden="true"
      >
        {typeof icon === 'string' ? <span className="text-5xl sm:text-6xl">{icon}</span> : icon}
      </div>
      <span className="text-xl sm:text-2xl md:text-3xl mt-3 sm:mt-4 font-bold text-primary leading-tight">{title}</span>
      <p className="text-xs sm:text-sm text-foreground/80 mt-2 px-2 sm:px-4 leading-relaxed">{description}</p>
    </button>
  );
}
