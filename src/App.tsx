import { Suspense, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BrowserRouter, useLocation } from 'react-router-dom';
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
import { useSystemHealthMonitor } from './hooks/useSystemHealthMonitor';
import { AppRoutes } from './components/AppRoutes';
import { Navigation } from './components/Navigation';
import { JubeeCanvas } from './components/JubeeCanvas';
import { validatePosition } from './core/jubee/JubeePositionManager';

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

function AppShell() {
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [showStickerBook, setShowStickerBook] = useState(false);
  const [showChildSelector, setShowChildSelector] = useState(false);
  const jubeeContainerRef = useRef<HTMLDivElement>(null);
  const { currentTheme, updateTheme, score } = useGameStore();
  const { hasCompletedOnboarding, startOnboarding } = useOnboardingStore();
  const location = useLocation();
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);

  // Routes where parent auth experience should be clean (no Jubee, nav, or onboarding)
  const isAuthRoute = location.pathname.startsWith('/auth');

  // Monitor all systems for regressions (dev only)
  useSystemHealthMonitor();

  // Start onboarding for first-time users only on main kid-facing routes
  useEffect(() => {
    if (!hasCompletedOnboarding && !isAuthRoute) {
      const timer = setTimeout(() => {
        startOnboarding();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedOnboarding, startOnboarding, isAuthRoute]);

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

  // Track viewport width safely in browser-only effect
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Revalidate position on viewport resize (especially when crossing breakpoints)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let resizeTimeout: ReturnType<typeof setTimeout>;
    let previousBreakpoint = window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const currentBreakpoint = window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';
        
        // If breakpoint changed, revalidate position to prevent clipping
        if (currentBreakpoint !== previousBreakpoint) {
          console.log('[Jubee Resize] Breakpoint changed:', previousBreakpoint, '->', currentBreakpoint);
          const validated = validatePosition(containerPosition);
          
          if (validated.bottom !== containerPosition.bottom || validated.right !== containerPosition.right) {
            console.log('[Jubee Resize] Position adjusted for new breakpoint:', validated);
            useJubeeStore.getState().setContainerPosition(validated);
          }
          
          previousBreakpoint = currentBreakpoint;
        }
      }, 300);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [containerPosition]);

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

  const mainTopPadding = isAuthRoute ? 'pt-6' : 'pt-[76px] sm:pt-[80px]';
  const mainBottomPadding = isAuthRoute ? 'pb-8' : 'pb-[88px]';

  return (
    <>
      <AchievementTracker />
      <SEO />
      <div className="app min-h-screen w-full" data-theme={currentTheme}>
        {/* Header with score and action buttons - hidden on auth route for clean landing */}
        {!isAuthRoute && (
          <header 
            className="
              fixed top-0 left-0 right-0 z-40
              flex flex-col sm:flex-row 
              items-center justify-between 
              gap-2 sm:gap-0 
              p-3 sm:p-4
              bg-gradient-to-r from-accent/20 to-primary/20
              border-b-2 border-primary/30
              backdrop-blur-sm
            "
            style={{
              paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
              paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
              paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
            }}
          >
            {/* Score display - touch friendly */}
            <div className="
              score-display
              px-4 py-2.5 sm:px-6 sm:py-3
              rounded-full
              text-base sm:text-xl md:text-2xl
              font-bold
              text-primary-foreground
              bg-primary/90
              border-2 border-primary-foreground/20
              shadow-lg
            ">
              ⭐ {score} points
            </div>

            {/* Action buttons - touch friendly */}
            <div className="flex gap-2 md:gap-3">
              <button
                onClick={toggleVisibility}
                className="
                  action-button
                  px-4 py-2.5 sm:px-5 sm:py-3
                  rounded-xl
                  text-sm sm:text-base
                  font-bold
                  text-foreground
                  bg-card/90
                  backdrop-blur-sm
                  border-2 border-primary/40
                  shadow-lg
                  transform hover:scale-105 active:scale-95
                  transition-all duration-200
                  min-h-[44px] min-w-[44px]
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                "
                aria-label={isVisible ? "Hide Jubee" : "Show Jubee"}
                title={isVisible ? "Hide Jubee" : "Show Jubee"}
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl">{isVisible ? '👁️' : '👁️‍🗨️'}</span>
                  <span className="font-extrabold hidden sm:inline">{isVisible ? 'Hide' : 'Show'}</span>
                </span>
              </button>
              <button
                onClick={() => setShowPersonalization(true)}
                className="
                  action-button
                  px-4 py-2.5 sm:px-5 sm:py-3
                  rounded-xl
                  text-sm sm:text-base
                  font-bold
                  text-foreground
                  bg-card/90
                  backdrop-blur-sm
                  border-2 border-primary/40
                  shadow-lg
                  transform hover:scale-105 active:scale-95
                  transition-all duration-200
                  min-h-[44px] min-w-[44px]
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                "
                aria-label="Customize Jubee"
                title="Customize Jubee"
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl">🐝</span>
                  <span className="font-extrabold hidden md:inline">Customize</span>
                </span>
              </button>
            </div>
          </header>
        )}

        {/* Jubee rendered via Portal at document.body level for global viewport freedom */}
        {!isAuthRoute && isVisible && viewportWidth !== null && createPortal(
          <motion.div
            ref={jubeeContainerRef}
            className="jubee-container"
            aria-hidden="true"
            style={{
              position: 'fixed',
              bottom: isDragging ? containerPosition.bottom : springBottom,
              right: isDragging ? containerPosition.right : springRight,
              // Responsive dimensions matching JubeePositionManager breakpoints
              width: viewportWidth < 768 ? '300px' : viewportWidth < 1024 ? '350px' : '400px',
              height: viewportWidth < 768 ? '360px' : viewportWidth < 1024 ? '400px' : '450px',
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


        {/* Main content with proper spacing and safe areas; padding adapts when header/nav are hidden */}
        <main 
          className={`
            main-content
            w-full
            min-h-screen
            ${mainTopPadding}
            ${mainBottomPadding}
            px-4 sm:px-6 md:px-8
            overflow-y-auto
            overscroll-behavior-y-contain
          `}
          role="main"
          style={{
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))',
            paddingBottom: isAuthRoute
              ? 'max(2rem, env(safe-area-inset-bottom))'
              : 'max(88px, calc(88px + env(safe-area-inset-bottom)))',
          }}
        >
          <div className="max-w-7xl mx-auto">
            <Suspense fallback={<LoadingScreen message="Loading activity" />}>
              <PageTransition>
                <AppRoutes />
              </PageTransition>
            </Suspense>
          </div>
        </main>

        {/* Navigation with safe area support - hidden on auth route */}
        {!isAuthRoute && <Navigation />}

        {/* Modals and overlays - only relevant on kid-facing routes */}
        {!isAuthRoute && (
          <>
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
          </>
        )}

        {/* Recovery button when Jubee disappears */}
        {!isAuthRoute && needsRecovery && (
          <button
            onClick={forceReset}
            className="
              fixed top-4 right-4 z-[100]
              bg-primary text-primary-foreground
              px-4 py-3
              rounded-lg
              shadow-lg
              hover:opacity-90
              transition-opacity
              flex items-center gap-2
              animate-fade-in
              min-h-[44px]
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            "
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
            <span className="font-bold">Reset Jubee</span>
          </button>
        )}
      </div>
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
