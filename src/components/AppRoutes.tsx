import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { 
  GameSkeleton, 
  StoryTimeSkeleton, 
  ProgressSkeleton,
  GallerySkeleton,
  SettingsSkeleton 
} from './LoadingSkeleton';

const WritingCanvas = lazy(() => import('../modules/writing/WritingCanvas'));
const ShapeSorter = lazy(() => import('../modules/shapes/ShapeSorter'));
const StoryTime = lazy(() => import('../modules/reading/StoryTime'));
const ReadingPractice = lazy(() => import('../modules/reading/ReadingPractice'));
const MemoryGame = lazy(() => import('../modules/games/MemoryGame'));
const PatternGame = lazy(() => import('../modules/games/PatternGame'));
const NumberGame = lazy(() => import('../modules/games/NumberGame'));
const AlphabetGame = lazy(() => import('../modules/games/AlphabetGame'));
const ColorGame = lazy(() => import('../modules/games/ColorGame'));
const PuzzleGame = lazy(() => import('../modules/games/PuzzleGame'));
const ProgressPage = lazy(() => import('../pages/Progress'));
const StickersPage = lazy(() => import('../pages/Stickers'));
const SettingsPage = lazy(() => import('../pages/Settings'));
const MusicPage = lazy(() => import('../pages/Music'));
const Gallery = lazy(() => import('../pages/Gallery'));
const InstallPage = lazy(() => import('../pages/Install'));
const ParentalControls = lazy(() => import('../pages/ParentalControls'));
const PerformanceMonitor = lazy(() => import('../pages/PerformanceMonitor'));
const AuthPage = lazy(() => import('../pages/Auth'));
const ParentHub = lazy(() => import('../pages/ParentHub'));
const ConversationAnalytics = lazy(() => import('../pages/ConversationAnalytics'));
const StyleGuide = lazy(() => import('../pages/StyleGuide'));
const HomePage = lazy(() => import('../pages/Home'));
const OAuthConsent = lazy(() => import('../pages/OAuthConsent'));
const GamesMenu = lazy(() => import('../pages/GamesMenu'));

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes - No auth required for toddlers */}
      <Route path="/auth" element={<Suspense fallback={<SettingsSkeleton />}><AuthPage /></Suspense>} />
      <Route path="/oauth/consent" element={<Suspense fallback={<SettingsSkeleton />}><OAuthConsent /></Suspense>} />
      <Route path="/" element={<Suspense fallback={<GameSkeleton />}><HomePage /></Suspense>} />
      <Route path="/write" element={<Suspense fallback={<GameSkeleton />}><WritingCanvas /></Suspense>} />
      <Route path="/gallery" element={<Suspense fallback={<GallerySkeleton />}><Gallery /></Suspense>} />
      <Route path="/shapes" element={<Suspense fallback={<GameSkeleton />}><ShapeSorter /></Suspense>} />
      <Route path="/stories" element={<Suspense fallback={<StoryTimeSkeleton />}><StoryTime /></Suspense>} />
      <Route path="/reading" element={<Suspense fallback={<GameSkeleton />}><ReadingPractice /></Suspense>} />
      <Route path="/games" element={<Suspense fallback={<GameSkeleton />}><GamesMenu /></Suspense>} />
      <Route path="/games/memory" element={<Suspense fallback={<GameSkeleton />}><MemoryGame /></Suspense>} />
      <Route path="/games/pattern" element={<Suspense fallback={<GameSkeleton />}><PatternGame /></Suspense>} />
      <Route path="/games/numbers" element={<Suspense fallback={<GameSkeleton />}><NumberGame /></Suspense>} />
      <Route path="/games/alphabet" element={<Suspense fallback={<GameSkeleton />}><AlphabetGame /></Suspense>} />
      <Route path="/games/colors" element={<Suspense fallback={<GameSkeleton />}><ColorGame /></Suspense>} />
      <Route path="/games/puzzle" element={<Suspense fallback={<GameSkeleton />}><PuzzleGame /></Suspense>} />
      <Route path="/progress" element={<Suspense fallback={<ProgressSkeleton />}><ProgressPage /></Suspense>} />
      <Route path="/stickers" element={<Suspense fallback={<GameSkeleton />}><StickersPage /></Suspense>} />
      <Route path="/music" element={<Suspense fallback={<GameSkeleton />}><MusicPage /></Suspense>} />
      <Route path="/settings" element={<Suspense fallback={<SettingsSkeleton />}><SettingsPage /></Suspense>} />
      <Route path="/install" element={<InstallPage />} />
      <Route path="/parental-controls" element={<ParentalControls />} />
      <Route path="/performance-monitor" element={<PerformanceMonitor />} />
      <Route path="/style-guide" element={<Suspense fallback={<SettingsSkeleton />}><StyleGuide /></Suspense>} />
      
      {/* Auth-gated parent routes */}
      <Route path="/parent" element={<ProtectedRoute><ParentHub /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><ConversationAnalytics /></ProtectedRoute>} />
    </Routes>
  );
}
