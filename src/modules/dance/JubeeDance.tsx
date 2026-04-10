/**
 * JubeeDance - Premium 3D Rhythm Game (Apple-Grade Revamp)
 * 
 * Carousel song selection, frosted glass HUD, animated countdown,
 * song progress bar, premium results screen with spring-animated stars.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Music, Play, Pause, RotateCcw, Home, Lock, Star, Trophy, Sparkles, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { triggerConfetti } from '@/lib/confetti';
import { useDanceGame } from './useDanceGame';
import { DanceCharacter } from './DanceCharacter';
import { ArrowButtons, StepZone } from './ArrowDisplay';
import { ComboCounter } from './ComboCounter';
import { getFreeSongs, getPremiumSongs } from './songLibrary';
import type { DanceSong, Direction } from './types';
import { useParentalStore } from '@/store/useParentalStore';
import { SEO } from '@/components/SEO';

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];
const easeOutQuart: [number, number, number, number] = [0.25, 1, 0.5, 1];
const easeSpring: [number, number, number, number] = [0.34, 1.56, 0.64, 1];

function getComboTier(combo: number): 'normal' | 'warm' | 'fire' | 'legendary' {
  if (combo >= 30) return 'legendary';
  if (combo >= 15) return 'fire';
  if (combo >= 5) return 'warm';
  return 'normal';
}

const difficultyColors: Record<string, string> = {
  easy: 'hsl(var(--game-accent))',
  medium: 'hsl(var(--primary))',
  hard: 'hsl(var(--destructive))',
};

export default function JubeeDancePage() {
  const navigate = useNavigate();
  const isPremium = useParentalStore(state => state.isPremium);
  const [view, setView] = useState<'menu' | 'playing' | 'results'>('menu');
  const [lastResult, setLastResult] = useState<'perfect' | 'good' | 'miss' | null>(null);
  const [partyMode, setPartyMode] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [songProgress, setSongProgress] = useState(0);
  const [scorePulse, setScorePulse] = useState(false);
  const [resultsAnimated, setResultsAnimated] = useState(false);
  const pendingAutoStartRef = useRef(false);
  const prevScoreRef = useRef(0);
  const prefersReducedMotion = useReducedMotion() ?? false;

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

  // Screen shake handler
  const handleScreenShake = useCallback(() => {
    if (prefersReducedMotion) return;
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 500);
  }, [prefersReducedMotion]);

  // Song selection
  const handleSelectSong = useCallback((song: DanceSong) => {
    if (song.tier === 'premium' && !isPremium) {
      toast.info('Ask your parents to unlock Premium songs.');
      return;
    }
    selectSong(song);
  }, [isPremium, selectSong]);

  // Start playing
  const handleStartPlaying = useCallback(() => {
    if (!context.currentSong) { toast.error('Please select a song first!'); return; }
    setView('playing');
    setSongProgress(0);
    startGame();
  }, [context.currentSong, startGame]);

  // Keyboard input
  useEffect(() => {
    if (context.state !== 'playing') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, Direction> = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right',
      };
      const direction = keyMap[e.key];
      if (direction) { e.preventDefault(); handleInput(direction); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [context.state, handleInput]);

  // Score feedback
  useEffect(() => {
    const { perfect, good, missed } = context.score;
    const total = perfect + good + missed;
    if (total === 0) { setLastResult(null); return; }
    if (context.score.missed > 0 && context.state === 'stumbled') setLastResult('miss');
    else if (context.score.perfect > 0 || context.score.good > 0)
      setLastResult(context.score.perfect >= context.score.good ? 'perfect' : 'good');
    const timer = setTimeout(() => setLastResult(null), 500);
    return () => clearTimeout(timer);
  }, [context.score, context.state]);

  // Score pulse animation
  useEffect(() => {
    if (context.score.totalScore !== prevScoreRef.current && context.score.totalScore > 0) {
      setScorePulse(true);
      setTimeout(() => setScorePulse(false), 300);
    }
    prevScoreRef.current = context.score.totalScore;
  }, [context.score.totalScore]);

  // Song progress tracker
  useEffect(() => {
    if (context.state !== 'playing' || !context.currentSong) return;
    const interval = setInterval(() => {
      const ms = getSongTimeMs();
      const duration = context.currentSong!.duration * 1000;
      setSongProgress(Math.min(1, Math.max(0, ms / duration)));
    }, 200);
    return () => clearInterval(interval);
  }, [context.state, context.currentSong, getSongTimeMs]);

  // Game end
  useEffect(() => {
    if (context.state === 'finished' || context.state === 'celebrating') {
      setView('results');
      setResultsAnimated(false);
      setTimeout(() => setResultsAnimated(true), 100);
    }
  }, [context.state]);

  const handleBackToMenu = useCallback(() => { reset(); setView('menu'); }, [reset]);

  const freeSongs = useMemo(() => getFreeSongs(), []);
  const premiumSongs = useMemo(() => getPremiumSongs(), []);
  const availableSongs = useMemo(
    () => (isPremium ? [...freeSongs, ...premiumSongs] : freeSongs),
    [isPremium, freeSongs, premiumSongs]
  );

  const handleNextSong = useCallback(() => {
    if (!context.currentSong || availableSongs.length === 0) return;
    const currentIndex = availableSongs.findIndex((s) => s.id === context.currentSong?.id);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % availableSongs.length;
    selectSong(availableSongs[nextIndex]);
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
    const timer = setTimeout(handleNextSong, 2500);
    return () => clearTimeout(timer);
  }, [view, partyMode, handleNextSong]);

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
  const comboTier = getComboTier(context.score.combo);

  // Confetti on 3-star results
  useEffect(() => {
    if (view === 'results' && starCount === 3 && !prefersReducedMotion) {
      const timer = setTimeout(() => {
        triggerConfetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, disableForReducedMotion: true,
          colors: ['#FFD700', '#FF6B35', '#FF1493', '#00E5FF', '#76FF03'] });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [view, starCount, prefersReducedMotion]);

  // ── Render Song Card (Vinyl Style) ──
  const renderSongCard = (song: DanceSong) => {
    const isLocked = song.tier === 'premium' && !isPremium;
    const isSelected = context.currentSong?.id === song.id;

    return (
      <motion.div
        key={song.id}
        onClick={() => handleSelectSong(song)}
        whileHover={prefersReducedMotion ? {} : { y: -4 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
        className="dance-vinyl-card"
        data-selected={isSelected}
        data-locked={isLocked}
      >
        {isLocked && (
          <div className="absolute top-3 right-3 bg-[hsl(var(--game-accent))] text-[hsl(var(--game-accent-foreground,var(--foreground)))] text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 z-10">
            <Lock className="w-3 h-3" /> Premium
          </div>
        )}
        <div className="text-5xl mb-3">{song.emoji}</div>
        <h3 className="font-bold text-base truncate mb-1">{song.title}</h3>
        <p className="text-xs text-muted-foreground mb-3">{song.artist}</p>
        <div className="flex items-center justify-center gap-1.5">
          {(['easy', 'medium', 'hard'] as const).map((d, i) => (
            <div
              key={d}
              className="dance-diff-dot"
              style={{
                background: i < (['easy', 'medium', 'hard'].indexOf(song.pattern.difficulty) + 1)
                  ? difficultyColors[d]
                  : 'hsl(var(--muted) / 0.4)',
              }}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-2">{song.duration}s</span>
        </div>
        {isSelected && (
          <div className="flex items-center justify-center gap-1 mt-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="dance-eq-bar" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  // ── Carousel scroll helpers ──
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: number) => {
    scrollContainerRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };

  return (
    <>
      <SEO title="JubeeDance - Dance Game" description="A fun 3D dance game for kids! Follow the arrows and dance with Jubee!" />
      
      <div className="jubee-dance max-w-6xl mx-auto p-4 pb-32">
        <AnimatePresence mode="wait">
          {/* ════ MENU VIEW ════ */}
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
                  <Music className="w-10 h-10 text-primary" />
                  <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    JubeeDance
                  </h1>
                  <Sparkles className="w-7 h-7 text-[hsl(var(--game-accent))]" />
                </div>
                <p className="text-muted-foreground text-lg">Follow the arrows and dance with Jubee!</p>
              </header>

              {/* Selected Song Preview */}
              {context.currentSong && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: easeSpring }}
                  className="dance-glass-card rounded-3xl p-6 mb-8 flex flex-col sm:flex-row items-center gap-5 border-2 border-[hsl(var(--primary)/0.3)]"
                >
                  <div className="text-6xl">{context.currentSong.emoji}</div>
                  <div className="text-center sm:text-left flex-1 min-w-0">
                    <h2 className="text-2xl font-bold truncate">{context.currentSong.title}</h2>
                    <p className="text-muted-foreground">{context.currentSong.artist}</p>
                    <div className="flex items-center justify-center sm:justify-start gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="dance-eq-bar" style={{ animationDelay: `${i * 80}ms` }} />
                      ))}
                    </div>
                  </div>
                  <Button size="lg" className="text-lg px-8 py-6 rounded-2xl shadow-lg" onClick={handleStartPlaying}>
                    <Play className="w-6 h-6 mr-2" /> Let's Dance!
                  </Button>
                </motion.div>
              )}

              {/* Free Songs Carousel */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Star className="w-6 h-6 text-[hsl(var(--game-accent))]" />
                  <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Free Songs</span>
                </h2>
                <div className="relative">
                  <button onClick={() => scrollBy(-1)} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur border border-border/50 flex items-center justify-center shadow-md hover:bg-background" aria-label="Scroll left">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div ref={scrollContainerRef} className="flex gap-4 overflow-x-auto pb-4 px-12 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                    {freeSongs.map((song) => (
                      <div key={song.id} className="snap-center shrink-0 w-[180px]">
                        {renderSongCard(song)}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => scrollBy(1)} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur border border-border/50 flex items-center justify-center shadow-md hover:bg-background" aria-label="Scroll right">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </section>

              {/* Premium Songs Carousel */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-[hsl(var(--accent))]" />
                  <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Premium Songs</span>
                  {!isPremium && (
                    <span className="ml-2 text-xs font-semibold px-2 py-1 rounded-full border border-border bg-muted text-muted-foreground flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Upgrade to unlock
                    </span>
                  )}
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-4 px-2 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                  {premiumSongs.map((song) => (
                    <div key={song.id} className="snap-center shrink-0 w-[180px]">
                      {renderSongCard(song)}
                    </div>
                  ))}
                </div>
              </section>

              <div className="mt-8 text-center">
                <Button variant="outline" onClick={() => navigate('/')} className="rounded-xl">
                  <Home className="w-4 h-4 mr-2" /> Back Home
                </Button>
              </div>
            </motion.div>
          )}

          {/* ════ PLAYING VIEW ════ */}
          {view === 'playing' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={screenShake
                ? { opacity: 1, x: [0, -4, 4, -3, 3, -1, 0], y: [0, 2, -2, 1, -1, 0] }
                : { opacity: 1, x: 0, y: 0 }
              }
              exit={{ opacity: 0 }}
              transition={screenShake ? { duration: 0.5, ease: 'easeOut' } : { duration: 0.25, ease: easeOutQuart }}
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
                    className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center"
                  >
                    <div className="relative">
                      {/* Concentric rings */}
                      {!prefersReducedMotion && [1, 2, 3].map((ring) => (
                        <motion.div
                          key={`ring-${ring}-${countdownValue}`}
                          className="dance-countdown-ring"
                          style={{
                            width: 120 + ring * 40,
                            height: 120 + ring * 40,
                            top: '50%',
                            left: '50%',
                            marginTop: -(60 + ring * 20),
                            marginLeft: -(60 + ring * 20),
                          }}
                          initial={{ scale: 0.5, opacity: 0.6 }}
                          animate={{ scale: 2, opacity: 0 }}
                          transition={{ duration: 0.8, delay: ring * 0.1, ease: 'easeOut' }}
                        />
                      ))}
                      <motion.div
                        key={countdownValue}
                        initial={{ scale: 2.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.3, opacity: 0 }}
                        transition={{ duration: 0.4, ease: easeSpring }}
                        className="text-9xl font-black bg-gradient-to-b from-primary to-accent bg-clip-text text-transparent relative z-10"
                      >
                        {countdownValue || 'Go!'}
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Game Header */}
              <div className="flex items-center justify-between mb-3">
                <Button variant="ghost" size="icon" onClick={handleBackToMenu} className="rounded-xl">
                  <Home className="w-5 h-5" />
                </Button>
                
                <div className="flex items-center gap-3">
                  {/* Score pill */}
                  <motion.div
                    className="dance-glass-card px-5 py-2 rounded-2xl"
                    animate={scorePulse && !prefersReducedMotion ? { scale: 1.08 } : { scale: 1 }}
                    transition={{ duration: 0.2, ease: easeSpring }}
                  >
                    <span className="text-2xl font-extrabold text-primary tabular-nums">
                      {context.score.totalScore}
                    </span>
                  </motion.div>
                  <ComboCounter combo={context.score.combo} reducedMotion={prefersReducedMotion} onScreenShake={handleScreenShake} />
                </div>

                {context.state === 'playing' ? (
                  <Button variant="ghost" size="icon" onClick={pause} className="rounded-xl">
                    <Pause className="w-5 h-5" />
                  </Button>
                ) : context.state === 'paused' ? (
                  <Button variant="ghost" size="icon" onClick={resume} className="rounded-xl">
                    <Play className="w-5 h-5" />
                  </Button>
                ) : <div className="w-10" />}
              </div>

              {/* Song Progress Bar */}
              <div className="dance-progress-bar mb-4">
                <div className="dance-progress-fill" style={{ width: `${songProgress * 100}%` }} />
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
                    comboTier={comboTier}
                    bpm={context.currentSong?.bpm ?? 100}
                  />

                  {/* Hit Feedback */}
                  <AnimatePresence>
                    {lastResult && (
                      <motion.div
                        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: 20, rotate: -5 }}
                        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0, rotate: 0 }}
                        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: -20 }}
                        transition={{ duration: 0.25, ease: easeOutExpo }}
                        className={`
                          absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                          text-4xl sm:text-6xl font-black pointer-events-none
                          ${lastResult === 'perfect' ? 'text-[hsl(var(--dance-hit-perfect))]' : 
                            lastResult === 'good' ? 'text-[hsl(var(--dance-hit-good))]' : 'text-[hsl(var(--dance-hit-miss))]'}
                        `}
                        style={{
                          textShadow: lastResult === 'perfect'
                            ? '0 0 30px hsl(var(--dance-hit-perfect) / 0.5)'
                            : lastResult === 'good'
                            ? '0 0 20px hsl(var(--dance-hit-good) / 0.4)'
                            : '0 0 15px hsl(var(--dance-hit-miss) / 0.3)',
                        }}
                      >
                        {lastResult === 'perfect' ? 'PERFECT!' : lastResult === 'good' ? 'GOOD!' : 'Oops!'}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Next Move */}
                  {context.state === 'playing' && getNextMove() && (
                    <div className="dance-next-chip">
                      <span className="text-white text-sm font-semibold">
                        Next: {getNextMove()?.direction.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="dance-glass-card p-3 sm:p-4 rounded-2xl">
                  <StepZone
                    moves={context.currentSong?.pattern.moves ?? []}
                    getSongTimeMs={getSongTimeMs}
                    isPlaying={context.state === 'playing'}
                    lookaheadMs={lookaheadMs}
                    reducedMotion={prefersReducedMotion}
                  />
                </div>
              </div>

              {/* Lyrics Display (frosted) */}
              <div className="text-center mb-4 min-h-[56px] flex items-center justify-center">
                <motion.div
                  key={getCurrentLyric()}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: easeOutQuart }}
                  className="dance-lyric-frosted inline-block"
                >
                  <p className="text-xl sm:text-2xl font-bold text-primary dance-lyric">
                    {getCurrentLyric()}
                  </p>
                </motion.div>
              </div>

              {/* Pause Overlay */}
              <AnimatePresence>
                {context.state === 'paused' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40 bg-background/70 backdrop-blur-lg flex items-center justify-center"
                  >
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.8 }}
                      transition={{ ease: easeSpring }}
                      className="text-center"
                    >
                      <button
                        onClick={resume}
                        className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-2xl mx-auto mb-4 hover:scale-105 transition-transform"
                        aria-label="Resume"
                      >
                        <Play className="w-10 h-10 ml-1" />
                      </button>
                      <p className="text-lg font-semibold text-muted-foreground">Paused</p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Arrow Controls */}
              <div className="flex justify-center pb-4">
                <ArrowButtons 
                  onInput={handleInput}
                  disabled={context.state !== 'playing'}
                  reducedMotion={prefersReducedMotion}
                />
              </div>
            </motion.div>
          )}

          {/* ════ RESULTS VIEW ════ */}
          {view === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: easeOutExpo }}
              className="min-h-[80vh] flex flex-col items-center justify-center"
            >
              <div className="dance-glass-card rounded-3xl max-w-xl w-full p-8 text-center">
                {/* Animated Stars */}
                <div className="flex items-center justify-center gap-3 mb-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <motion.div
                      key={`star-${index}`}
                      initial={prefersReducedMotion ? {} : { scale: 0, rotate: -180, opacity: 0 }}
                      animate={resultsAnimated ? { scale: 1, rotate: 0, opacity: 1 } : {}}
                      transition={{
                        duration: 0.6,
                        delay: 0.2 + index * 0.2,
                        ease: easeSpring,
                      }}
                    >
                      <Star
                        className={`w-10 h-10 ${index < starCount ? 'text-[hsl(var(--dance-hit-perfect))]' : 'text-muted-foreground/20'}`}
                        fill={index < starCount ? 'currentColor' : 'none'}
                      />
                    </motion.div>
                  ))}
                </div>

                <motion.h2
                  className="text-3xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={resultsAnimated ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.8, ease: easeOutQuart }}
                >
                  {gradeLabel}
                </motion.h2>
                <motion.p
                  className="text-muted-foreground mb-6"
                  initial={{ opacity: 0 }}
                  animate={resultsAnimated ? { opacity: 1 } : {}}
                  transition={{ delay: 1, ease: easeOutQuart }}
                >
                  Accuracy {accuracyPercent}% • Score {context.score.totalScore}
                </motion.p>

                {/* Animated Accuracy Bars */}
                <motion.div
                  className="space-y-3 mb-6 text-left"
                  initial={{ opacity: 0 }}
                  animate={resultsAnimated ? { opacity: 1 } : {}}
                  transition={{ delay: 1.1 }}
                >
                  {([
                    { label: 'Perfect', value: perfectPercent, color: 'hsl(var(--dance-hit-perfect))' },
                    { label: 'Good', value: goodPercent, color: 'hsl(var(--dance-hit-good))' },
                    { label: 'Missed', value: missPercent, color: 'hsl(var(--dance-hit-miss))' },
                  ] as const).map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{item.label}</span>
                        <span className="font-bold" style={{ color: item.color }}>{item.value}%</span>
                      </div>
                      <div className="dance-accuracy-bar">
                        <div
                          className="dance-accuracy-fill"
                          style={{
                            width: resultsAnimated ? `${item.value}%` : '0%',
                            background: `linear-gradient(90deg, ${item.color}, ${item.color}88)`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm pt-1">
                    <span className="font-medium">Max Combo</span>
                    <span className="font-bold">{context.score.maxCombo}x</span>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <Button size="lg" onClick={handleStartPlaying} className="w-full rounded-2xl">
                    <RotateCcw className="w-5 h-5 mr-2" /> Play Again
                  </Button>
                  <Button size="lg" variant="outline" onClick={handleNextSong} className="w-full rounded-2xl">
                    <Play className="w-5 h-5 mr-2" /> Next Song
                  </Button>
                  <label className="dance-party-toggle">
                    <input type="checkbox" checked={partyMode} onChange={(e) => setPartyMode(e.target.checked)} />
                    <span className="dance-toggle-track" aria-hidden="true" />
                    <span className="text-sm font-semibold">Party mode</span>
                  </label>
                  {partyMode && <p className="text-xs text-muted-foreground">Next song starts shortly.</p>}
                  <Button size="lg" variant="outline" onClick={handleBackToMenu} className="w-full rounded-2xl">
                    <Music className="w-5 h-5 mr-2" /> Choose Song
                  </Button>
                  <Button variant="ghost" onClick={() => navigate('/')} className="rounded-xl">
                    <Home className="w-4 h-4 mr-2" /> Back Home
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
