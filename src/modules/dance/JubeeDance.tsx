/**
 * JubeeDance - Premium 3D Rhythm Game
 * 
 * A fun, engaging dance game for toddlers ages 2-5.
 * Features directional arrow patterns, 3D character animations,
 * and 22 kid-friendly lyrical songs.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Music, 
  Play, 
  Pause, 
  RotateCcw, 
  Home, 
  Lock, 
  Star,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useDanceGame } from './useDanceGame';
import { DanceCharacter } from './DanceCharacter';
import { ArrowButtons, StepZone } from './ArrowDisplay';
import { getFreeSongs, getPremiumSongs } from './songLibrary';
import type { DanceSong, Direction } from './types';
import { useParentalStore } from '@/store/useParentalStore';
import { SEO } from '@/components/SEO';

const COMBO_MILESTONES = [5, 10, 15, 20, 25, 30, 50];

export default function JubeeDancePage() {
  const navigate = useNavigate();
  const { isPremium } = useParentalStore();
  const [view, setView] = useState<'menu' | 'playing' | 'results'>('menu');
  const [lastResult, setLastResult] = useState<'perfect' | 'good' | 'miss' | null>(null);
  const [comboMilestone, setComboMilestone] = useState<number | null>(null);
  const [comboPulse, setComboPulse] = useState(false);
  const [partyMode, setPartyMode] = useState(false);
  const pendingAutoStartRef = useRef(false);
  const prefersReducedMotion = useReducedMotion();

  const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];
  const easeOutQuart: [number, number, number, number] = [0.25, 1, 0.5, 1];
  const easeSpring: [number, number, number, number] = [0.34, 1.56, 0.64, 1];

  const {
    context,
    countdownValue,
    selectSong,
    startGame,
    handleInput,
    pause,
    resume,
    reset,
    getCurrentLyric,
    getNextMove,
    getSongTimeMs,
  } = useDanceGame();

  // Handle song selection
  const handleSelectSong = useCallback((song: DanceSong) => {
    const isLocked = song.tier === 'premium' && !isPremium;
    if (isLocked) {
      toast.info('Ask your parents to unlock Premium songs.');
      return;
    }
    selectSong(song);
    toast.success(`${song.title} selected.`);
  }, [isPremium, selectSong]);

  // Start playing selected song
  const handleStartPlaying = useCallback(() => {
    if (!context.currentSong) {
      toast.error('Please select a song first!');
      return;
    }
    setView('playing');
    startGame();
  }, [context.currentSong, startGame]);

  // Handle keyboard input
  useEffect(() => {
    if (context.state !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
      };

      const direction = keyMap[e.key];
      if (direction) {
        e.preventDefault();
        handleInput(direction);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [context.state, handleInput]);

  // Track score changes for feedback
  useEffect(() => {
    const { perfect, good, missed } = context.score;
    const total = perfect + good + missed;
    
    if (total === 0) {
      setLastResult(null);
      return;
    }

    // Determine last result based on what changed
    if (context.score.missed > 0 && context.state === 'stumbled') {
      setLastResult('miss');
    } else if (context.score.perfect > 0 || context.score.good > 0) {
      setLastResult(context.score.perfect >= context.score.good ? 'perfect' : 'good');
    }

    // Clear feedback after delay
    const timer = setTimeout(() => setLastResult(null), 500);
    return () => clearTimeout(timer);
  }, [context.score, context.state]);

  // Check for game end
  useEffect(() => {
    if (context.state === 'finished' || context.state === 'celebrating') {
      setView('results');
    }
  }, [context.state]);

  // Handle back to menu
  const handleBackToMenu = useCallback(() => {
    reset();
    setView('menu');
  }, [reset]);

  // Song list with premium indicators
  const freeSongs = useMemo(() => getFreeSongs(), []);
  const premiumSongs = useMemo(() => getPremiumSongs(), []);
  const availableSongs = useMemo(
    () => (isPremium ? [...freeSongs, ...premiumSongs] : freeSongs),
    [isPremium, freeSongs, premiumSongs]
  );

  const handleNextSong = useCallback(() => {
    if (!context.currentSong || availableSongs.length === 0) return;
    const currentIndex = availableSongs.findIndex((song) => song.id === context.currentSong?.id);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % availableSongs.length;
    const nextSong = availableSongs[nextIndex];
    selectSong(nextSong);
    setView('playing');
    pendingAutoStartRef.current = true;
  }, [availableSongs, context.currentSong, selectSong]);

  useEffect(() => {
    if (pendingAutoStartRef.current && context.currentSong) {
      pendingAutoStartRef.current = false;
      startGame();
    }
  }, [context.currentSong, startGame]);

  useEffect(() => {
    if (view !== 'results' || !partyMode) return;
    const timer = setTimeout(() => {
      handleNextSong();
    }, 2500);
    return () => clearTimeout(timer);
  }, [view, partyMode, handleNextSong]);

  useEffect(() => {
    if (context.score.combo === 0) {
      setComboMilestone(null);
      return;
    }

    if (COMBO_MILESTONES.includes(context.score.combo)) {
      setComboMilestone(context.score.combo);
      if (!prefersReducedMotion) {
        setComboPulse(true);
      }
      const pulseTimer = setTimeout(() => setComboPulse(false), 250);
      const milestoneTimer = setTimeout(() => setComboMilestone(null), 900);
      return () => {
        clearTimeout(pulseTimer);
        clearTimeout(milestoneTimer);
      };
    }
  }, [context.score.combo, prefersReducedMotion]);

  const lookaheadMs = useMemo(() => {
    const difficulty = context.currentSong?.pattern.difficulty ?? 'medium';
    if (difficulty === 'easy') return 3400;
    if (difficulty === 'hard') return 2600;
    return 3000;
  }, [context.currentSong?.pattern.difficulty]);

  const totalMoves = context.score.perfect + context.score.good + context.score.missed;
  const accuracy = totalMoves > 0 ? (context.score.perfect + context.score.good) / totalMoves : 0;
  const starCount = accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : 1;
  const gradeLabel = accuracy >= 0.9 ? 'Amazing Rhythm!' : accuracy >= 0.7 ? 'Great Groove!' : 'Nice Try!';
  const accuracyPercent = Math.round(accuracy * 100);
  const perfectPercent = totalMoves > 0 ? Math.round((context.score.perfect / totalMoves) * 100) : 0;
  const goodPercent = totalMoves > 0 ? Math.round((context.score.good / totalMoves) * 100) : 0;
  const missPercent = totalMoves > 0 ? Math.round((context.score.missed / totalMoves) * 100) : 0;

  // Render song card
  const renderSongCard = (song: DanceSong) => {
    const isLocked = song.tier === 'premium' && !isPremium;
    const isSelected = context.currentSong?.id === song.id;

    return (
      <Card
        key={song.id}
        onClick={() => handleSelectSong(song)}
        className={`
          cursor-pointer transition-all border-2 relative
          ${isLocked ? 'opacity-70 grayscale border-muted' : 'hover:scale-105 border-transparent hover:border-primary'}
          ${isSelected ? 'border-primary bg-primary/10 ring-2 ring-primary' : ''}
        `}
      >
        {isLocked && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 z-10">
            <Lock className="w-3 h-3" /> Premium
          </div>
        )}
        <CardContent className="p-4 flex items-center gap-4">
          <div className="text-4xl">{song.emoji}</div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold truncate">{song.title}</h3>
            <p className="text-sm text-muted-foreground">{song.artist}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs capitalize">
                {song.pattern.difficulty}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {song.duration}s
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <SEO 
        title="JubeeDance - Dance Game" 
        description="A fun 3D dance game for kids! Follow the arrows and dance with Jubee!" 
      />
      
      <div className="jubee-dance max-w-6xl mx-auto p-4 pb-32">
        {/* Menu View */}
        <AnimatePresence mode="wait">
          {view === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: easeOutExpo }}
            >
              {/* Header */}
              <header className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Music className="w-12 h-12 text-primary" />
                  <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    JubeeDance
                  </h1>
                  <Sparkles className="w-8 h-8 text-yellow-400" />
                </div>
                <p className="text-muted-foreground text-lg">
                  Follow the arrows and dance with Jubee!
                </p>
              </header>

              {/* Selected Song Preview */}
              {context.currentSong && (
                <Card className="mb-6 border-2 border-primary bg-primary/5">
                  <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
                    <div className="text-6xl">{context.currentSong.emoji}</div>
                    <div className="text-center sm:text-left flex-1">
                      <h2 className="text-2xl font-bold">{context.currentSong.title}</h2>
                      <p className="text-muted-foreground">{context.currentSong.artist}</p>
                    </div>
                    <Button 
                      size="lg" 
                      className="text-xl px-8 py-6"
                      onClick={handleStartPlaying}
                    >
                      <Play className="w-6 h-6 mr-2" />
                      Let's Dance!
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Free Songs */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-500" />
                  Free Songs
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {freeSongs.map(renderSongCard)}
                </div>
              </section>

              {/* Premium Songs */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-amber-500" />
                  Premium Songs
                  {!isPremium && (
                    <Badge variant="outline" className="ml-2">
                      <Lock className="w-3 h-3 mr-1" /> Upgrade to unlock
                    </Badge>
                  )}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {premiumSongs.map(renderSongCard)}
                </div>
              </section>

              {/* Back button */}
              <div className="mt-8 text-center">
                <Button variant="outline" onClick={() => navigate('/')}>
                  <Home className="w-4 h-4 mr-2" />
                  Back Home
                </Button>
              </div>
            </motion.div>
          )}

          {/* Playing View */}
          {view === 'playing' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: easeOutQuart }}
              className="min-h-[80vh] flex flex-col"
            >
              {/* Countdown Overlay */}
              <AnimatePresence>
                {countdownValue !== null && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: easeOutQuart }}
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
                  >
                    <motion.div
                      key={countdownValue}
                      initial={{ scale: 2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.4, ease: easeSpring }}
                      className="text-9xl font-bold text-white"
                    >
                      {countdownValue || 'Go!'}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Game Header */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" onClick={handleBackToMenu}>
                  <Home className="w-5 h-5" />
                </Button>
                
                {/* Score Display */}
                <div className="flex items-center gap-3">
                  <div className="dance-glass-card px-4 py-2 rounded-xl border border-white/40">
                    <span className="text-2xl font-bold text-primary">
                      Score {context.score.totalScore}
                    </span>
                  </div>
                  <motion.div
                    className="dance-glass-card px-4 py-2 rounded-xl border border-white/40 min-w-[120px]"
                    animate={
                      comboPulse && !prefersReducedMotion
                        ? { scale: 1.08, y: -2 }
                        : { scale: 1, y: 0 }
                    }
                    transition={{ duration: 0.25, ease: easeSpring }}
                  >
                    <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Combo
                    </div>
                    <div className="text-lg font-semibold text-foreground">
                      Combo {context.score.combo}x
                    </div>
                    <AnimatePresence>
                      {comboMilestone && !prefersReducedMotion && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.96 }}
                          transition={{ duration: 0.25, ease: easeOutQuart }}
                          className="text-xs font-semibold text-[hsl(var(--dance-hit-perfect))]"
                        >
                          Milestone x{comboMilestone}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>

                {context.state === 'playing' ? (
                  <Button variant="ghost" onClick={pause}>
                    <Pause className="w-5 h-5" />
                  </Button>
                ) : context.state === 'paused' ? (
                  <Button variant="ghost" onClick={resume}>
                    <Play className="w-5 h-5" />
                  </Button>
                ) : (
                  <div className="w-10" />
                )}
              </div>

              {/* 3D Character + StepZone */}
              <div className="flex-1 grid gap-4 mb-4">
                <div className="dance-stage relative min-h-[300px] sm:min-h-[400px]">
                  <DanceCharacter 
                    animation={context.animation}
                    isStumbling={context.state === 'stumbled'}
                    isPerfect={lastResult === 'perfect'}
                    isPaused={context.state === 'paused'}
                    reducedMotion={prefersReducedMotion}
                  />

                  {/* Hit Feedback */}
                  <AnimatePresence>
                    {lastResult && (
                      <motion.div
                        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: 20 }}
                        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.25, ease: easeOutExpo }}
                        className={`
                          absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                          text-4xl sm:text-6xl font-bold
                          ${lastResult === 'perfect' ? 'text-[hsl(var(--dance-hit-perfect))]' : 
                            lastResult === 'good' ? 'text-[hsl(var(--dance-hit-good))]' : 'text-[hsl(var(--dance-hit-miss))]'}
                        `}
                      >
                        {lastResult === 'perfect' ? 'PERFECT!' : 
                         lastResult === 'good' ? 'GOOD!' : 'Oops!'}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Next Move Indicator */}
                  {context.state === 'playing' && getNextMove() && (
                    <div className="dance-next-chip">
                      <span className="text-white text-sm sm:text-base font-semibold">
                        Next: {getNextMove()?.direction.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="dance-glass-card p-3 sm:p-4">
                  <StepZone
                    moves={context.currentSong?.pattern.moves ?? []}
                    getSongTimeMs={getSongTimeMs}
                    isPlaying={context.state === 'playing'}
                    lookaheadMs={lookaheadMs}
                    reducedMotion={prefersReducedMotion}
                  />
                </div>
              </div>

              {/* Lyrics Display */}
              <div className="text-center mb-4 min-h-[60px] dance-lyric">
                <motion.p 
                  key={getCurrentLyric()}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: easeOutQuart }}
                  className="text-2xl sm:text-3xl font-bold text-primary"
                >
                  {getCurrentLyric()}
                </motion.p>
              </div>

              {/* Arrow Controls */}
              <div className="flex justify-center pb-4">
                <ArrowButtons 
                  onInput={handleInput}
                  disabled={context.state !== 'playing'}
                  reducedMotion={prefersReducedMotion}
                />
              </div>

              {/* Instructions for little ones */}
              <div className="text-center text-muted-foreground text-sm">
                <p>Tap the arrows to dance! Match the moves!</p>
              </div>
            </motion.div>
          )}

          {/* Results View */}
          {view === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: easeOutExpo }}
              className="min-h-[80vh] flex flex-col items-center justify-center"
            >
              <Card className="max-w-xl w-full p-8 text-center dance-glass-card">
                {/* Result Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Star
                        key={`star-${index}`}
                        className={`w-8 h-8 ${index < starCount ? 'text-[hsl(var(--dance-hit-perfect))]' : 'text-muted-foreground/30'}`}
                        fill={index < starCount ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <h2 className="text-3xl font-bold text-primary">{gradeLabel}</h2>
                  <p className="text-muted-foreground">
                    Accuracy {accuracyPercent}% - Total Score {context.score.totalScore}
                  </p>
                </div>

                {/* Accuracy Breakdown */}
                <div className="space-y-3 mb-6 text-left">
                  <div className="flex justify-between items-center">
                    <span>Perfect</span>
                    <span className="font-semibold text-[hsl(var(--dance-hit-perfect))]">
                      {context.score.perfect} ({perfectPercent}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Good</span>
                    <span className="font-semibold text-[hsl(var(--dance-hit-good))]">
                      {context.score.good} ({goodPercent}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Missed</span>
                    <span className="font-semibold text-[hsl(var(--dance-hit-miss))]">
                      {context.score.missed} ({missPercent}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Max Combo</span>
                    <span className="font-semibold">{context.score.maxCombo}x</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <Button size="lg" onClick={handleStartPlaying} className="w-full">
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Play Again
                  </Button>
                  <Button size="lg" variant="outline" onClick={handleNextSong} className="w-full">
                    <Play className="w-5 h-5 mr-2" />
                    Next Song
                  </Button>
                  <label className="dance-party-toggle">
                    <input
                      type="checkbox"
                      checked={partyMode}
                      onChange={(event) => setPartyMode(event.target.checked)}
                    />
                    <span className="dance-toggle-track" aria-hidden="true" />
                    <span className="text-sm font-semibold">Party mode (auto next)</span>
                  </label>
                  {partyMode && (
                    <p className="text-xs text-muted-foreground">
                      Party mode on - next song starts shortly.
                    </p>
                  )}
                  <Button size="lg" variant="outline" onClick={handleBackToMenu} className="w-full">
                    <Music className="w-5 h-5 mr-2" />
                    Choose Song
                  </Button>
                  <Button variant="ghost" onClick={() => navigate('/')}>
                    <Home className="w-4 h-4 mr-2" />
                    Back Home
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
