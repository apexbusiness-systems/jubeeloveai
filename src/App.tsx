import { Suspense, lazy, useEffect } from 'react';
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
import { Home, Edit3, Star } from 'lucide-react';

const WritingCanvas = lazy(() => import('./modules/writing/WritingCanvas'));
const ShapeSorter = lazy(() => import('./modules/shapes/ShapeSorter'));

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
  const { currentTheme, updateTheme } = useGameStore();
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

            <main className="main-content" role="main">
              <Suspense fallback={<LoadingScreen message="Loading activity" />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/write" element={<WritingCanvas />} />
                  <Route path="/shapes" element={<ShapeSorter />} />
                </Routes>
              </Suspense>
            </main>

            <Navigation />
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
        <h1 className="text-4xl md:text-5xl font-bold text-center mt-8 text-foreground">
          Welcome to Jubee's World!
        </h1>
        <p className="text-center text-muted-foreground mt-4 px-4 max-w-2xl mx-auto">
          Learn and play with Jubee the friendly bee! Choose an activity below to start your educational adventure.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 max-w-4xl mx-auto">
          <GameCard 
            title="Writing Practice" 
            icon={<Edit3 className="w-16 h-16" />}
            path="/write"
            description="Practice your writing skills with fun drawing activities"
          />
          <GameCard 
            title="Shape Recognition" 
            icon={<Star className="w-16 h-16" />}
            path="/shapes"
            description="Learn and identify different shapes"
          />
        </div>
      </div>
    </>
  );
}

interface GameCardProps {
  title: string;
  icon: React.ReactNode;
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
      <div className="text-primary transition-transform group-hover:scale-110" aria-hidden="true">
        {icon}
      </div>
      <span className="text-2xl md:text-3xl mt-4 font-bold text-foreground">{title}</span>
      <p className="text-sm text-muted-foreground mt-2 px-4">{description}</p>
    </button>
  );
}

function Navigation() {
  return (
    <nav className="tab-bar" role="navigation" aria-label="Main navigation">
      <TabButton path="/" icon={<Home />} label="Home" />
      <TabButton path="/write" icon={<Edit3 />} label="Write" />
      <TabButton path="/shapes" icon={<Star />} label="Shapes" />
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
        isActive ? 'opacity-100 scale-110' : 'opacity-70'
      }`}
      aria-label={`Navigate to ${label}`}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className="w-6 h-6" aria-hidden="true">
        {icon}
      </div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
