import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SEO } from '@/components/SEO';
import { useJubeeStore } from '@/store/useJubeeStore';
import { Download, Wand2, Clock3 } from 'lucide-react';
import { useActivityStore } from '@/store/useActivityStore';
import { useGameStore } from '@/store/useGameStore';

interface ActivityMeta {
  title: string;
  icon: string;
  description: string;
  accent: string;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const { favoritePages, totalTimeSpent, lastActivityTime } = useActivityStore();
  const { currentTheme } = useGameStore();

  const activityCatalog = useMemo<Record<string, ActivityMeta>>(
    () => ({
      '/write': { title: 'Writing Practice', icon: '✏️', description: 'Fine-motor magic', accent: 'from-amber-200 to-orange-400' },
      '/stories': { title: 'Story Time', icon: '📖', description: 'Calm, cozy focus', accent: 'from-sky-200 to-indigo-400' },
      '/games': { title: 'Games', icon: '🎮', description: 'Challenge + play', accent: 'from-pink-200 to-purple-400' },
      '/shapes': { title: 'Shapes', icon: '⭐', description: 'Spatial spark', accent: 'from-lime-200 to-emerald-400' },
      '/reading': { title: 'Reading Practice', icon: '📚', description: 'Phonics boost', accent: 'from-cyan-200 to-teal-400' },
      '/music': { title: 'Music', icon: '🎵', description: 'Wind-down vibes', accent: 'from-rose-200 to-amber-300' },
    }),
    []
  );

  const suggestedPath = useMemo(() => {
    if (favoritePages.length > 0 && activityCatalog[favoritePages[0]]) {
      return favoritePages[0];
    }

    if (currentTheme === 'evening') return '/stories';
    if (currentTheme === 'afternoon') return '/games';
    return '/write';
  }, [activityCatalog, currentTheme, favoritePages]);

  const suggestedActivity = activityCatalog[suggestedPath] || activityCatalog['/write'];

  const timeSpentLabel = useMemo(() => {
    if (!totalTimeSpent || totalTimeSpent <= 0) return 'Just getting started';
    const minutes = Math.max(1, Math.round(totalTimeSpent / 60));
    if (minutes < 60) return `${minutes} min with Jubee`;
    const hours = (minutes / 60).toFixed(1);
    return `${hours} hrs with Jubee`;
  }, [totalTimeSpent]);

  const lastActiveLabel = useMemo(() => {
    if (!lastActivityTime) return 'First adventure awaits';
    const deltaMinutes = Math.max(
      0,
      Math.floor((Date.now() - new Date(lastActivityTime).getTime()) / (60 * 1000))
    );
    if (deltaMinutes < 2) return 'Active now';
    if (deltaMinutes < 60) return `${deltaMinutes} min ago`;
    const hours = Math.floor(deltaMinutes / 60);
    if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }, [lastActivityTime]);

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
      <div 
        className="home-page w-full" 
        role="main"
        aria-label="Home page - Choose an activity"
      >
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
        
        <header className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-primary leading-tight">
            Welcome to Jubee's World!
          </h1>
          <p className="text-foreground/90 px-4 max-w-2xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed">
            Learn and play with Jubee the friendly bee! Choose an activity below to start your educational adventure.
          </p>
        </header>

        <section className="mb-8 sm:mb-10">
          <Card className="border-0 bg-gradient-to-br from-background/80 via-card/80 to-accent/10 shadow-xl backdrop-blur-md">
            <CardContent className="p-5 sm:p-6 lg:p-8 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    Start with what feels right <span className="text-primary">right now</span>
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
                    Jubee remembers where you love to play. Continue instantly or try a fresh activity hand-picked for this moment.
                  </p>
                </div>
                <div className="flex gap-3">
                  <InfoPill icon={<Clock3 className="w-4 h-4" />} label="Last active" value={lastActiveLabel} />
                  <InfoPill icon={<Wand2 className="w-4 h-4" />} label="Time with Jubee" value={timeSpentLabel} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <QuickActionCard
                  title={`Continue ${suggestedActivity.title}`}
                  description={suggestedActivity.description}
                  icon={suggestedActivity.icon}
                  accent={suggestedActivity.accent}
                  path={suggestedPath}
                  badge="Resume"
                  emphasis
                />
                <QuickActionCard
                  title="Discover something new"
                  description="Try a fresh mini-lesson tailored to your mood"
                  icon="🌈"
                  accent="from-amber-200 to-fuchsia-300"
                  path="/reading"
                  badge="New"
                />
                <QuickActionCard
                  title="Calm wind-down"
                  description="Soothing music and gentle stories for quiet time"
                  icon="🌙"
                  accent="from-slate-200 to-indigo-300"
                  path="/music"
                  badge="Calm"
                />
              </div>
            </CardContent>
          </Card>
        </section>
        
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto"
          role="list"
          aria-label="Available learning activities"
        >
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
            title="JubeeDance"
            icon="💃"
            path="/dance"
            description="Dance with Jubee to fun songs!"
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

interface QuickActionProps {
  title: string;
  description: string;
  icon: string;
  accent: string;
  path: string;
  badge?: string;
  emphasis?: boolean;
}

interface InfoPillProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoPill({ icon, label, value }: InfoPillProps) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-card/90 border border-border px-3 py-2 shadow-sm">
      <div className="w-6 h-6 rounded-full bg-foreground/5 text-foreground flex items-center justify-center">
        {icon}
      </div>
      <div className="text-left leading-tight">
        <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">{label}</div>
        <div className="text-sm font-semibold text-foreground">{value}</div>
      </div>
    </div>
  );
}

function QuickActionCard({ title, description, icon, accent, path, badge, emphasis }: QuickActionProps) {
  const navigate = useNavigate();
  const { triggerAnimation } = useJubeeStore();

  const handleClick = () => {
    triggerAnimation('excited');
    navigate(path);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        group relative w-full rounded-2xl border border-border/60 
        bg-gradient-to-br ${accent} px-4 py-5 sm:px-5 sm:py-6 text-left shadow-lg
        transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none 
        focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2
        ${emphasis ? 'md:row-span-2' : ''}
      `}
    >
      {badge && (
        <span className="absolute top-3 right-3 rounded-full bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 shadow-sm">
          {badge}
        </span>
      )}
      <div className="flex items-center gap-3">
        <span className="text-3xl sm:text-4xl drop-shadow-sm">{icon}</span>
        <div className="space-y-1">
          <p className="text-lg sm:text-xl font-bold leading-tight text-foreground">{title}</p>
          <p className="text-sm text-foreground/80">{description}</p>
        </div>
      </div>
    </button>
  );
}

function GameCard({ title, icon, path, description }: GameCardProps) {
  const navigate = useNavigate();
  const { triggerAnimation } = useJubeeStore();

  const handleClick = () => {
    triggerAnimation('excited');
    navigate(path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="
        game-card group
        focus:outline-none 
        focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2
        min-h-[160px] sm:min-h-[180px]
        transition-all duration-300
      "
      aria-label={`Start ${title} - ${description}`}
      role="listitem"
    >
      <div 
        className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 transition-transform duration-300 group-hover:scale-110 group-focus-visible:scale-110 text-primary flex items-center justify-center" 
        aria-hidden="true"
      >
        {typeof icon === 'string' ? <span className="text-5xl sm:text-6xl">{icon}</span> : icon}
      </div>
      <span className="text-xl sm:text-2xl md:text-3xl mt-3 sm:mt-4 font-bold text-primary leading-tight">
        {title}
      </span>
      <p className="text-xs sm:text-sm text-foreground/80 mt-2 px-2 sm:px-4 leading-relaxed">
        {description}
      </p>
    </button>
  );
}
