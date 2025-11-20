import { Suspense, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { motion, useSpring } from 'framer-motion';
import { useGameStore } from './store/useGameStore';
import { useJubeeStore } from './store/useJubeeStore';
import { useParentalStore } from './store/useParentalStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SEO } from './components/SEO';
import { LoadingScreen } from './components/LoadingScreen';
import { JubeePersonalization } from './components/common/JubeePersonalization';
import { VoiceSelector } from './components/common/VoiceSelector';
import { StickerBook } from './components/rewards/StickerBook';
import { PageTransition } from './components/PageTransition';
import { SessionMonitor } from './components/SessionMonitor';
import { ChildSelector } from './components/ChildSelector';
import { useAchievementTracker } from './hooks/useAchievementTracker';
import { VoiceCommandButton } from './components/VoiceCommandButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ScreenTimeIndicator } from './components/ScreenTimeIndicator';
import { ConflictResolutionDialog } from './components/ConflictResolutionDialog';
import { useJubeeCollision } from './hooks/useJubeeCollision';
import { useJubeeDraggable } from './hooks/useJubeeDraggable';
import { useJubeeVisibilityMonitor } from './hooks/useJubeeVisibilityMonitor';
import { OnboardingTutorial } from './components/OnboardingTutorial';
import { useOnboardingStore } from './store/useOnboardingStore';
import { useSmartAudioPreloader } from './hooks/useSmartAudioPreloader';
import { AppRoutes } from './components/AppRoutes';
import { Navigation } from './components/Navigation';
import { JubeeCanvas } from './components/JubeeCanvas';

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

  // Initialize smart audio preloader inside Router context
  useSmartAudioPreloader();

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
  const jubeeContainerRef = useRef<HTMLDivElement>(null);
  const { currentTheme, updateTheme, score } = useGameStore();
  const { hasCompletedOnboarding, startOnboarding } = useOnboardingStore();
  
  // Run system check and regression guard on mount (dev mode only)
  useEffect(() => {
    if (import.meta.env.DEV) {
      Promise.all([
        import('@/core/jubee/JubeeSystemCheck').then(({ logSystemCheckResults }) => {
          logSystemCheckResults();
        }),
        import('@/core/jubee/JubeeRegressionGuard').then(({ logRegressionCheck }) => {
          logRegressionCheck();
        })
      ]).catch(err => console.error('[Jubee] System checks failed:', err));
    }
  }, []);
  

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

  // Spring physics for container positioning
  const springBottom = useSpring(containerPosition.bottom, {
    stiffness: 300,
    damping: 30,
    mass: 0.8
  });
  const springRight = useSpring(containerPosition.right, {
    stiffness: 300,
    damping: 30,
    mass: 0.8
  });

  // Update spring values when containerPosition changes
  useEffect(() => {
    springBottom.set(containerPosition.bottom);
    springRight.set(containerPosition.right);
  }, [containerPosition.bottom, containerPosition.right, springBottom, springRight]);

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
              </div>
            </header>

            {/* Jubee rendered via Portal at document.body level for global viewport freedom */}
            {isVisible && createPortal(
              <motion.div
                ref={jubeeContainerRef}
                className="jubee-container"
                aria-hidden="true"
                style={{
                  position: 'fixed',
                  bottom: isDragging ? containerPosition.bottom : springBottom,
                  right: isDragging ? containerPosition.right : springRight,
                  width: '400px',
                  height: '450px',
                  zIndex: 10001,
                  touchAction: 'none',
                  pointerEvents: 'auto'
                }}
              >
                <JubeeCanvas 
                  jubeePosition={jubeePosition} 
                  jubeeAnimation={jubeeAnimation} 
                />
              </motion.div>,
              document.body
            )}

            <main className="main-content" role="main" style={{ paddingTop: '80px' }}>
              <Suspense fallback={<LoadingScreen message="Loading activity" />}>
                <PageTransition>
                  <AppRoutes />
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
            <ScreenTimeIndicator />
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

