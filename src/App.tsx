import { Suspense, lazy, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { JubeeMascot } from './core/jubee/JubeeMascot';
import { useGameStore } from './store/useGameStore';
import { useJubeeStore } from './store/useJubeeStore';
import { useParentalStore } from './store/useParentalStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { JubeeErrorBoundary } from './components/JubeeErrorBoundary';
import { SEO } from './components/SEO';
import { LoadingScreen } from './components/LoadingScreen';
import { HomeIcon, PencilIcon, StarIcon, ChartIcon, GiftIcon, GearIcon } from '@/components/icons/Icons';
import { JubeePersonalization } from './components/common/JubeePersonalization';
import { VoiceSelector } from './components/common/VoiceSelector';
import { StickerBook } from './components/rewards/StickerBook';
import { PageTransition } from './components/PageTransition';
import { SessionMonitor } from './components/SessionMonitor';
import { ChildSelector } from './components/ChildSelector';
import { useAchievementTracker } from './hooks/useAchievementTracker';
import { VoiceCommandButton } from './components/VoiceCommandButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ConflictResolutionDialog } from './components/ConflictResolutionDialog';
import { useJubeeCollision } from './hooks/useJubeeCollision';
import { useJubeeDraggable } from './hooks/useJubeeDraggable';
import { useJubeeVisibilityMonitor } from './hooks/useJubeeVisibilityMonitor';
import { OnboardingTutorial } from './components/OnboardingTutorial';
import { useOnboardingStore } from './store/useOnboardingStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import { LogOut, LogIn, Download } from 'lucide-react';

const WritingCanvas = lazy(() => import('./modules/writing/WritingCanvas'));
const ShapeSorter = lazy(() => import('./modules/shapes/ShapeSorter'));
const StoryTime = lazy(() => import('./modules/reading/StoryTime'));
const ReadingPractice = lazy(() => import('./modules/reading/ReadingPractice'));
const MemoryGame = lazy(() => import('./modules/games/MemoryGame'));
const PatternGame = lazy(() => import('./modules/games/PatternGame'));
const NumberGame = lazy(() => import('./modules/games/NumberGame'));
const AlphabetGame = lazy(() => import('./modules/games/AlphabetGame'));
const ColorGame = lazy(() => import('./modules/games/ColorGame'));
const PuzzleGame = lazy(() => import('./modules/games/PuzzleGame'));
const ProgressPage = lazy(() => import('./pages/Progress'));
const StickersPage = lazy(() => import('./pages/Stickers'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const MusicPage = lazy(() => import('./pages/Music'));
const Gallery = lazy(() => import('./pages/Gallery'));
const InstallPage = lazy(() => import('./pages/Install'));
const ParentalControls = lazy(() => import('./pages/ParentalControls'));
const PerformanceMonitor = lazy(() => import('./pages/PerformanceMonitor'));
const AuthPage = lazy(() => import('./pages/Auth'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AchievementTracker() {
  const { trackActivity, checkAchievements } = useAchievementTracker();
  const setActivityCompleteCallback = useGameStore(state => state.setActivityCompleteCallback);

  useEffect(() => {
    setActivityCompleteCallback(() => {
      trackActivity();
      checkAchievements();
    });
  }, [setActivityCompleteCallback, trackActivity, checkAchievements]);

  return null;
}

export default function App() {
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [showStickerBook, setShowStickerBook] = useState(false);
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [canvasError, setCanvasError] = useState(false);
  const jubeeContainerRef = useRef<HTMLDivElement>(null);
  const { currentTheme, updateTheme, score } = useGameStore();
  const { hasCompletedOnboarding, startOnboarding } = useOnboardingStore();
  const { user, signOut, isAuthenticated } = useAuth();

  // Start onboarding for first-time users
  useEffect(() => {
    if (!hasCompletedOnboarding) {
      const timer = setTimeout(() => {
        startOnboarding();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedOnboarding, startOnboarding]);
  const { position: jubeePosition, currentAnimation: jubeeAnimation, isVisible, toggleVisibility, containerPosition, isDragging } = useJubeeStore();
  const { children, activeChildId } = useParentalStore();

  // Enable collision detection, dragging, and visibility monitoring
  useJubeeCollision(jubeeContainerRef);
  useJubeeDraggable(jubeeContainerRef);
  const { needsRecovery, forceReset } = useJubeeVisibilityMonitor(jubeeContainerRef);

  useEffect(() => {
    const updateThemeBasedOnTime = () => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 12) updateTheme('morning');
      else if (hour >= 12 && hour < 17) updateTheme('afternoon');
      else if (hour >= 17 && hour < 20) updateTheme('evening');
      else updateTheme('night');
    };

    updateThemeBasedOnTime();
    // Update theme every hour
    const interval = setInterval(updateThemeBasedOnTime, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [updateTheme]);

  // Show child selector if profiles exist but no active child
  useEffect(() => {
    if (children.length > 0 && !activeChildId) {
      setShowChildSelector(true);
    }
  }, [children.length, activeChildId]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AchievementTracker />
          <SEO />
          <div className="app" data-theme={currentTheme}>
            {/* Header with score and action buttons */}
            <header className="fixed top-0 left-0 right-0 z-40 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 p-2 sm:p-4" style={{ background: 'var(--gradient-warm)' }}>
              {/* Score display */}
              <div className="score-display px-3 py-2 sm:px-6 sm:py-3 rounded-full text-base sm:text-xl md:text-2xl font-bold text-primary-foreground bg-primary/20 border-2 sm:border-3 border-primary-foreground shadow-lg">
                ⭐ {score} points
              </div>

              {/* Action buttons */}
              <div className="flex gap-1.5 sm:gap-2 md:gap-3">
                <button
                  onClick={toggleVisibility}
                  className="action-button px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 rounded-xl sm:rounded-2xl text-sm sm:text-base md:text-lg font-bold text-primary-foreground bg-card/40 backdrop-blur-sm border-2 border-primary-foreground/60 shadow-lg transform hover:scale-110 hover:shadow-xl active:scale-95 transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))',
                  }}
                  aria-label={isVisible ? "Hide Jubee" : "Show Jubee"}
                  title={isVisible ? "Hide Jubee" : "Show Jubee"}
                >
                  <span className="flex items-center gap-1 sm:gap-2">
                    <span className="text-base sm:text-lg">{isVisible ? '👁️' : '👁️‍🗨️'}</span>
                    <span className="font-extrabold hidden sm:inline">{isVisible ? 'Hide' : 'Show'}</span>
                  </span>
                </button>
                <button
                  onClick={() => setShowPersonalization(true)}
                  className="action-button px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 rounded-xl sm:rounded-2xl text-sm sm:text-base md:text-lg font-bold text-primary-foreground bg-card/40 backdrop-blur-sm border-2 border-primary-foreground/60 shadow-lg transform hover:scale-110 hover:shadow-xl active:scale-95 transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))',
                  }}
                  aria-label="Customize Jubee"
                  title="Customize Jubee"
                >
                  <span className="flex items-center gap-1 sm:gap-2">
                    <span className="text-base sm:text-lg">🐝</span>
                    <span className="font-extrabold hidden md:inline">Customize</span>
                  </span>
                </button>
                {isAuthenticated ? (
                  <button
                    onClick={signOut}
                    className="action-button px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 rounded-xl sm:rounded-2xl text-sm sm:text-base md:text-lg font-bold text-primary-foreground bg-card/40 backdrop-blur-sm border-2 border-primary-foreground/60 shadow-lg transform hover:scale-110 hover:shadow-xl active:scale-95 transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))',
                    }}
                    aria-label="Logout"
                    title="Logout"
                  >
                    <span className="flex items-center gap-1 sm:gap-2">
                      <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="font-extrabold hidden md:inline">Logout</span>
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => window.location.href = '/auth'}
                    className="action-button px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 rounded-xl sm:rounded-2xl text-sm sm:text-base md:text-lg font-bold text-primary-foreground bg-card/40 backdrop-blur-sm border-2 border-primary-foreground/60 shadow-lg transform hover:scale-110 hover:shadow-xl active:scale-95 transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))',
                    }}
                    aria-label="Login"
                    title="Login"
                  >
                    <span className="flex items-center gap-1 sm:gap-2">
                      <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="font-extrabold hidden md:inline">Login</span>
                    </span>
                  </button>
                )}
              </div>
            </header>

            {/* Jubee rendered via Portal at document.body level for global viewport freedom */}
            {isVisible && createPortal(
              <div
                ref={jubeeContainerRef}
                className="jubee-container"
                aria-hidden="true"
                style={{
                  position: 'fixed',
                  bottom: `${containerPosition.bottom}px`,
                  right: `${containerPosition.right}px`,
                  width: '400px',
                  height: '450px',
                  zIndex: 9999,
                  transition: isDragging ? 'none' : 'bottom 0.4s cubic-bezier(0.4, 0, 0.2, 1), right 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  touchAction: 'none',
                  pointerEvents: 'auto',
                  willChange: isDragging ? 'bottom, right' : 'auto'
                }}
              >
                <JubeeErrorBoundary>
                  <Canvas
                    key={`jubee-canvas-${isVisible}`}
                    camera={{ position: [0, 0, 6], fov: 45 }}
                    shadows
                    style={{ 
                      background: 'transparent',
                      width: '100%',
                      height: '100%',
                      display: 'block'
                    }}
                    gl={{
                      antialias: true,
                      alpha: true,
                      powerPreference: "high-performance"
                    }}
                    onCreated={({ gl }) => {
                      console.log('[Jubee] Canvas created via Portal with dimensions: 400x450');
                      gl.setClearColor('#000000', 0);
                      gl.setSize(400, 450);
                    }}
                  >
                    <ambientLight intensity={1.2} />
                    <directionalLight
                      position={[5, 5, 5]}
                      intensity={1.5}
                      castShadow
                      shadow-mapSize-width={2048}
                      shadow-mapSize-height={2048}
                    />
                    <directionalLight
                      position={[-5, 3, -5]}
                      intensity={0.8}
                      color="#ffd700"
                    />
                    <hemisphereLight
                      color="#87CEEB"
                      groundColor="#FFD700"
                      intensity={0.6}
                    />
                    <Suspense fallback={null}>
                      <JubeeMascot
                        position={[jubeePosition.x, jubeePosition.y, jubeePosition.z]}
                        animation={jubeeAnimation}
                      />
                    </Suspense>
                  </Canvas>
                </JubeeErrorBoundary>
              </div>,
              document.body
            )}

            <main className="main-content" role="main" style={{ paddingTop: '80px' }}>
              <Suspense fallback={<LoadingScreen message="Loading activity" />}>
                <PageTransition>
                  <Routes>
                    {/* Public route */}
                    <Route path="/auth" element={<AuthPage />} />
                    
                    {/* Protected routes */}
                    <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                    <Route path="/write" element={<ProtectedRoute><WritingCanvas /></ProtectedRoute>} />
                    <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
                    <Route path="/shapes" element={<ProtectedRoute><ShapeSorter /></ProtectedRoute>} />
                    <Route path="/stories" element={<ProtectedRoute><StoryTime /></ProtectedRoute>} />
                    <Route path="/reading" element={<ProtectedRoute><ReadingPractice /></ProtectedRoute>} />
                    <Route path="/games" element={<ProtectedRoute><GamesMenu /></ProtectedRoute>} />
                    <Route path="/games/memory" element={<ProtectedRoute><MemoryGame /></ProtectedRoute>} />
                    <Route path="/games/pattern" element={<ProtectedRoute><PatternGame /></ProtectedRoute>} />
                    <Route path="/games/numbers" element={<ProtectedRoute><NumberGame /></ProtectedRoute>} />
                    <Route path="/games/alphabet" element={<ProtectedRoute><AlphabetGame /></ProtectedRoute>} />
                    <Route path="/games/colors" element={<ProtectedRoute><ColorGame /></ProtectedRoute>} />
                    <Route path="/games/puzzle" element={<ProtectedRoute><PuzzleGame /></ProtectedRoute>} />
                    <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
                    <Route path="/stickers" element={<ProtectedRoute><StickersPage /></ProtectedRoute>} />
                    <Route path="/music" element={<ProtectedRoute><MusicPage /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                    <Route path="/install" element={<InstallPage />} />
                    <Route path="/parental-controls" element={<ProtectedRoute><ParentalControls /></ProtectedRoute>} />
                    <Route path="/performance-monitor" element={<ProtectedRoute><PerformanceMonitor /></ProtectedRoute>} />
                  </Routes>
                </PageTransition>
              </Suspense>
            </main>

            <Navigation />

            {/* Modals */}
            {showPersonalization && (
              <JubeePersonalization 
                onClose={() => setShowPersonalization(false)}
                onOpenVoiceSelector={() => setShowVoiceSelector(true)}
              />
            )}
            {showVoiceSelector && (
              <VoiceSelector onClose={() => setShowVoiceSelector(false)} />
            )}
            {showStickerBook && (
              <StickerBook onClose={() => setShowStickerBook(false)} />
            )}
            <ChildSelector open={showChildSelector} onOpenChange={setShowChildSelector} />
            <SessionMonitor />
            <VoiceCommandButton />
            <OfflineIndicator />
            <ConflictResolutionDialog />
            <OnboardingTutorial />
          </div>
          
          {/* Recovery button when Jubee disappears */}
          {needsRecovery && (
            <button
              onClick={forceReset}
              className="fixed top-4 right-4 z-[100] bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2 animate-fade-in"
              aria-label="Reset Jubee position"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
              </svg>
              Reset Jubee
            </button>
          )}
          
          <Toaster />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

function HomePage() {
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

function GamesMenu() {
  const navigate = useNavigate();
  const { triggerAnimation } = useJubeeStore();

  return (
    <div className="games-menu p-8">
      <h1 className="text-5xl font-bold text-center mb-8 text-game">
        🎮 Choose a Game! 🎮
      </h1>
      <p className="text-2xl text-center mb-12 text-game-neutral">
        Play and learn with Jubee!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <button
          onClick={() => {
            triggerAnimation('excited');
            navigate('/games/memory');
          }}
          className="game-option p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 border-4 border-game-accent"
          style={{
            background: 'var(--gradient-warm)',
            boxShadow: 'var(--shadow-game)'
          }}
        >
          <div className="text-7xl mb-4">🧠</div>
          <h2 className="text-2xl font-bold text-primary-foreground mb-2">Memory Match</h2>
          <p className="text-lg text-primary-foreground opacity-90">Find matching pairs!</p>
        </button>

        <button
          onClick={() => {
            triggerAnimation('excited');
            navigate('/games/pattern');
          }}
          className="game-option p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 border-4 border-game-accent"
          style={{
            background: 'var(--gradient-cool)',
            boxShadow: 'var(--shadow-accent)'
          }}
        >
          <div className="text-7xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold text-primary-foreground mb-2">Pattern Game</h2>
          <p className="text-lg text-primary-foreground opacity-90">Repeat the pattern!</p>
        </button>

        <button
          onClick={() => {
            triggerAnimation('excited');
            navigate('/games/numbers');
          }}
          className="game-option p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 border-4 border-game-accent"
          style={{
            background: 'var(--gradient-game)',
            boxShadow: 'var(--shadow-game)'
          }}
        >
          <div className="text-7xl mb-4">🔢</div>
          <h2 className="text-2xl font-bold text-primary-foreground mb-2">Number Adventure</h2>
          <p className="text-lg text-primary-foreground opacity-90">Learn counting & math!</p>
        </button>

        <button
          onClick={() => {
            triggerAnimation('excited');
            navigate('/games/alphabet');
          }}
          className="game-option p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 border-4 border-game-accent"
          style={{
            background: 'var(--gradient-warm)',
            boxShadow: 'var(--shadow-game)'
          }}
        >
          <div className="text-7xl mb-4">🔤</div>
          <h2 className="text-2xl font-bold text-primary-foreground mb-2">Alphabet Adventure</h2>
          <p className="text-lg text-primary-foreground opacity-90">Master your ABCs!</p>
        </button>

        <button
          onClick={() => {
            triggerAnimation('excited');
            navigate('/games/colors');
          }}
          className="game-option p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 border-4 border-game-accent"
          style={{
            background: 'var(--gradient-cool)',
            boxShadow: 'var(--shadow-accent)'
          }}
        >
          <div className="text-7xl mb-4">🌈</div>
          <h2 className="text-2xl font-bold text-primary-foreground mb-2">Color Splash</h2>
          <p className="text-lg text-primary-foreground opacity-90">Match beautiful colors!</p>
        </button>

        <button
          onClick={() => {
            triggerAnimation('excited');
            navigate('/games/puzzle');
          }}
          className="game-option p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 border-4 border-game-accent"
          style={{
            background: 'var(--gradient-game)',
            boxShadow: 'var(--shadow-game)'
          }}
        >
          <div className="text-7xl mb-4">🧩</div>
          <h2 className="text-2xl font-bold text-primary-foreground mb-2">Puzzle Master</h2>
          <p className="text-lg text-primary-foreground opacity-90">Solve picture puzzles!</p>
        </button>
      </div>

      <div className="text-center mt-12">
        <button
          onClick={() => navigate('/')}
          className="px-8 py-4 text-2xl font-bold rounded-full transform hover:scale-105 transition-all border-3 border-border text-game-neutral"
          style={{
            background: 'var(--gradient-neutral)',
            boxShadow: '0 4px 10px hsl(var(--muted) / 0.3)'
          }}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

function Navigation() {
  return (
    <nav className="tab-bar" role="navigation" aria-label="Main navigation">
      <TabButton path="/" icon={<HomeIcon className="w-8 h-8" />} label="Home" />
      <TabButton path="/write" icon={<PencilIcon className="w-8 h-8" />} label="Write" />
      <TabButton path="/shapes" icon={<StarIcon className="w-8 h-8" />} label="Shapes" />
      <TabButton path="/progress" icon={<ChartIcon className="w-8 h-8" />} label="Progress" />
      <TabButton path="/stickers" icon={<GiftIcon className="w-8 h-8" />} label="Stickers" />
      <TabButton path="/settings" icon={<GearIcon className="w-8 h-8" />} label="Settings" />
    </nav>
  );
}

interface TabButtonProps {
  path: string;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ path, icon, label }: TabButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === path;

  return (
    <button
      onClick={() => navigate(path)}
      className={`tab-item min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all ${
        isActive ? 'scale-110' : ''
      }`}
      aria-label={`Navigate to ${label}`}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className="w-8 h-8 text-primary flex items-center justify-center" aria-hidden="true">
        {icon}
      </div>
      <span className="text-xs font-medium text-primary">{label}</span>
    </button>
  );
}
