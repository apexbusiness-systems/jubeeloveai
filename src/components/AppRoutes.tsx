import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

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
const HomePage = lazy(() => import('../pages/Home'));
const GamesMenu = lazy(() => import('../pages/GamesMenu'));

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes - No auth required for toddlers */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/write" element={<WritingCanvas />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/shapes" element={<ShapeSorter />} />
      <Route path="/stories" element={<StoryTime />} />
      <Route path="/reading" element={<ReadingPractice />} />
      <Route path="/games" element={<GamesMenu />} />
      <Route path="/games/memory" element={<MemoryGame />} />
      <Route path="/games/pattern" element={<PatternGame />} />
      <Route path="/games/numbers" element={<NumberGame />} />
      <Route path="/games/alphabet" element={<AlphabetGame />} />
      <Route path="/games/colors" element={<ColorGame />} />
      <Route path="/games/puzzle" element={<PuzzleGame />} />
      <Route path="/progress" element={<ProgressPage />} />
      <Route path="/stickers" element={<StickersPage />} />
      <Route path="/music" element={<MusicPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/install" element={<InstallPage />} />
      <Route path="/parental-controls" element={<ParentalControls />} />
      <Route path="/performance-monitor" element={<PerformanceMonitor />} />
      
      {/* Auth-gated parent routes */}
      <Route path="/parent" element={<ProtectedRoute><ParentHub /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><ConversationAnalytics /></ProtectedRoute>} />
    </Routes>
  );
}
