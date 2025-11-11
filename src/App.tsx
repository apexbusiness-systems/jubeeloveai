import { Suspense, lazy, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { JubeeMascot } from './core/jubee/JubeeMascot';
import { useGameStore } from './store/useGameStore';
import { useJubeeStore } from './store/useJubeeStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SEO } from './components/SEO';
import { LoadingScreen } from './components/LoadingScreen';
import { HomeIcon, PencilIcon, StarIcon, ChartIcon, GiftIcon, GearIcon } from '@/components/icons/Icons';
import { JubeePersonalization } from './components/common/JubeePersonalization';
import { StickerBook } from './components/rewards/StickerBook';

const WritingCanvas = lazy(() => import('./modules/writing/WritingCanvas'));
const ShapeSorter = lazy(() => import('./modules/shapes/ShapeSorter'));
const StoryTime = lazy(() => import('./modules/reading/StoryTime'));
const MemoryGame = lazy(() => import('./modules/games/MemoryGame'));
const PatternGame = lazy(() => import('./modules/games/PatternGame'));
const ProgressPage = lazy(() => import('./pages/Progress'));
const StickersPage = lazy(() => import('./pages/Stickers'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const Gallery = lazy(() => import('./pages/Gallery'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [showStickerBook, setShowStickerBook] = useState(false);
  const { currentTheme, updateTheme, score } = useGameStore();
  const { position: jubeePosition, currentAnimation: jubeeAnimation } = useJubeeStore();

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

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SEO />
          <div className="app" data-theme={currentTheme}>
            {/* Header with score and action buttons */}
            <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between p-4 bg-gradient-to-r from-yellow-400 to-red-500">
              {/* Score display */}
              <div
                className="score-display px-6 py-3 rounded-full text-2xl font-bold text-white"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '3px solid white',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)'
                }}
              >
                ⭐ {score} points
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPersonalization(true)}
                  className="action-button px-5 py-3 rounded-full text-lg font-bold text-white transform hover:scale-105 transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.3)',
                    border: '3px solid white',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)'
                  }}
                  aria-label="Customize Jubee"
                >
                  🐝 Customize
                </button>
                <button
                  onClick={() => setShowStickerBook(true)}
                  className="action-button px-5 py-3 rounded-full text-lg font-bold text-white transform hover:scale-105 transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.3)',
                    border: '3px solid white',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)'
                  }}
                  aria-label="View Sticker Collection"
                >
                  📚 Stickers
                </button>
              </div>
            </header>

            <div className="jubee-container" aria-hidden="true">
              <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} />
                <Suspense fallback={null}>
                  <JubeeMascot
                    position={[jubeePosition.x, jubeePosition.y, jubeePosition.z]}
                    animation={jubeeAnimation}
                  />
                </Suspense>
              </Canvas>
            </div>

            <main className="main-content" role="main" style={{ paddingTop: '80px' }}>
              <Suspense fallback={<LoadingScreen message="Loading activity" />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/write" element={<WritingCanvas />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/shapes" element={<ShapeSorter />} />
                  <Route path="/stories" element={<StoryTime />} />
                  <Route path="/games" element={<GamesMenu />} />
                  <Route path="/games/memory" element={<MemoryGame />} />
                  <Route path="/games/pattern" element={<PatternGame />} />
                  <Route path="/progress" element={<ProgressPage />} />
                  <Route path="/stickers" element={<StickersPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </Suspense>
            </main>

            <Navigation />

            {/* Modals */}
            {showPersonalization && (
              <JubeePersonalization onClose={() => setShowPersonalization(false)} />
            )}
            {showStickerBook && (
              <StickerBook onClose={() => setShowStickerBook(false)} />
            )}
          </div>
          <Toaster />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

function HomePage() {
  return (
    <>
      <SEO 
        title="Jubee Love - Home"
        description="Welcome to Jubee's World! Choose from writing practice, shape recognition, and more fun learning activities."
      />
      <div className="home-page">
        <h1 className="text-4xl md:text-5xl font-bold text-center mt-8 text-primary">
          Welcome to Jubee's World!
        </h1>
        <p className="text-center text-primary mt-4 px-4 max-w-2xl mx-auto">
          Learn and play with Jubee the friendly bee! Choose an activity below to start your educational adventure.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 max-w-4xl mx-auto">
          <GameCard
            title="Writing Practice"
            icon={<PencilIcon className="w-24 h-24" />}
            path="/write"
            description="Practice your writing skills with fun drawing activities"
          />
          <GameCard
            title="Shape Recognition"
            icon={<StarIcon className="w-24 h-24" />}
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
            icon={<ChartIcon className="w-24 h-24" />}
            path="/progress"
            description="See your scores, achievements, and learning stats"
          />
          <GameCard
            title="Sticker Collection"
            icon={<GiftIcon className="w-24 h-24" />}
            path="/stickers"
            description="Collect and unlock colorful stickers and rewards"
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
      <h1 className="text-5xl font-bold text-center mb-8" style={{ color: '#FF4757' }}>
        🎮 Choose a Game! 🎮
      </h1>
      <p className="text-2xl text-center mb-12 text-gray-700">
        Play and learn with Jubee!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <button
          onClick={() => {
            triggerAnimation('excited');
            navigate('/games/memory');
          }}
          className="game-option p-8 rounded-3xl transform hover:scale-105 transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, #FFD93D 0%, #FF6348 100%)',
            border: '4px solid #FFD93D',
            boxShadow: '0 8px 20px rgba(255, 71, 87, 0.3)'
          }}
        >
          <div className="text-8xl mb-4">🧠</div>
          <h2 className="text-3xl font-bold text-white mb-2">Memory Match</h2>
          <p className="text-xl text-white opacity-90">Find matching pairs!</p>
        </button>

        <button
          onClick={() => {
            triggerAnimation('excited');
            navigate('/games/pattern');
          }}
          className="game-option p-8 rounded-3xl transform hover:scale-105 transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, #FF6348 0%, #FFD93D 100%)',
            border: '4px solid #FFD93D',
            boxShadow: '0 8px 20px rgba(255, 217, 61, 0.3)'
          }}
        >
          <div className="text-8xl mb-4">🎯</div>
          <h2 className="text-3xl font-bold text-white mb-2">Pattern Game</h2>
          <p className="text-xl text-white opacity-90">Repeat the pattern!</p>
        </button>
      </div>

      <div className="text-center mt-12">
        <button
          onClick={() => navigate('/')}
          className="px-8 py-4 text-2xl font-bold rounded-full transform hover:scale-105 transition-all"
          style={{
            background: 'linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)',
            color: '#4B5563',
            border: '3px solid #9CA3AF',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
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
