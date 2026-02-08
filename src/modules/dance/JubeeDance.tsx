/**
 * JubeeDance - Premium 3D Rhythm Game
 * 
 * A fun, engaging dance game for toddlers ages 2-5.
 * Features directional arrow patterns, 3D character animations,
 * and 22 kid-friendly lyrical songs.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { ArrowButtons } from './ArrowDisplay';
import { getFreeSongs, getPremiumSongs } from './songLibrary';
import type { DanceSong, Direction } from './types';
import { useParentalStore } from '@/store/useParentalStore';
import { SEO } from '@/components/SEO';

export default function JubeeDancePage() {
  const navigate = useNavigate();
  const { isPremium } = useParentalStore();
  const [view, setView] = useState<'menu' | 'playing' | 'results'>('menu');
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<'perfect' | 'good' | 'miss' | null>(null);

  const {
    context,
    selectSong,
    startGame,
    handleInput,
    pause,
    resume,
    reset,
    getCurrentLyric,
    getNextMove,
    playCountdownSound,
  } = useDanceGame();

  // Handle song selection
  const handleSelectSong = useCallback((song: DanceSong) => {
    const isLocked = song.tier === 'premium' && !isPremium;
    if (isLocked) {
      toast.info('🎵 Ask your parents to unlock Premium songs!');
      return;
    }
    selectSong(song);
    toast.success(`🎵 ${song.title} selected!`);
  }, [isPremium, selectSong]);

  // Start playing selected song
  const handleStartPlaying = useCallback(() => {
    if (!context.currentSong) {
      toast.error('Please select a song first!');
      return;
    }
    setView('playing');
    setCountdownValue(3);
  }, [context.currentSong]);

  // Countdown effect with integrated sound
  useEffect(() => {
    if (countdownValue === null) return;
    
    if (countdownValue > 0) {
      // Play countdown sound for each number
      playCountdownSound(countdownValue);
      
      const timer = setTimeout(() => {
        setCountdownValue(countdownValue - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCountdownValue(null);
      startGame();
    }
  }, [countdownValue, startGame, playCountdownSound]);

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
    setCountdownValue(null);
  }, [reset]);

  // Song list with premium indicators
  const freeSongs = getFreeSongs();
  const premiumSongs = getPremiumSongs();

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
      
      <div className="max-w-6xl mx-auto p-4 pb-32">
        {/* Menu View */}
        <AnimatePresence mode="wait">
          {view === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
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
                  Follow the arrows and dance with Jubee! 💃🕺
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
              className="min-h-[80vh] flex flex-col"
            >
              {/* Countdown Overlay */}
              <AnimatePresence>
                {countdownValue !== null && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
                  >
                    <motion.div
                      key={countdownValue}
                      initial={{ scale: 2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="text-9xl font-bold text-white"
                    >
                      {countdownValue || '🎵'}
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
                <div className="flex items-center gap-4">
                  <div className="bg-card px-4 py-2 rounded-xl border-2 border-primary">
                    <span className="text-2xl font-bold text-primary">
                      ⭐ {context.score.totalScore}
                    </span>
                  </div>
                  <div className="bg-card px-4 py-2 rounded-xl border">
                    <span className="text-lg font-semibold">
                      🔥 {context.score.combo}x
                    </span>
                  </div>
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

              {/* 3D Character Area */}
              <div className="flex-1 relative min-h-[300px] sm:min-h-[400px] mb-4">
                <DanceCharacter 
                  animation={context.animation}
                  isStumbling={context.state === 'stumbled'}
                  isPerfect={lastResult === 'perfect'}
                />

                {/* Hit Feedback */}
                <AnimatePresence>
                  {lastResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className={`
                        absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                        text-4xl sm:text-6xl font-bold
                        ${lastResult === 'perfect' ? 'text-yellow-400' : 
                          lastResult === 'good' ? 'text-green-400' : 'text-red-400'}
                      `}
                    >
                      {lastResult === 'perfect' ? '✨ PERFECT!' : 
                       lastResult === 'good' ? '👍 GOOD!' : '😅 Oops!'}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Next Move Indicator */}
                {context.state === 'playing' && getNextMove() && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full">
                    <span className="text-white text-lg font-semibold">
                      Next: {getNextMove()?.direction.toUpperCase()} ⬆️
                    </span>
                  </div>
                )}
              </div>

              {/* Lyrics Display */}
              <div className="text-center mb-4 min-h-[60px]">
                <motion.p 
                  key={getCurrentLyric()}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
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
                />
              </div>

              {/* Instructions for little ones */}
              <div className="text-center text-muted-foreground text-sm">
                <p>👆 Tap the arrows to dance! Match the moves! 👆</p>
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
              className="min-h-[80vh] flex flex-col items-center justify-center"
            >
              <Card className="max-w-md w-full p-8 text-center">
                {/* Result Header */}
                <div className="mb-6">
                  {context.state === 'celebrating' ? (
                    <>
                      <div className="text-6xl mb-4">🎉🏆🎉</div>
                      <h2 className="text-3xl font-bold text-primary">PERFECT!</h2>
                      <p className="text-muted-foreground">No mistakes! Amazing!</p>
                    </>
                  ) : (
                    <>
                      <div className="text-6xl mb-4">⭐</div>
                      <h2 className="text-3xl font-bold">Great Job!</h2>
                      <p className="text-muted-foreground">Keep practicing!</p>
                    </>
                  )}
                </div>

                {/* Score Details */}
                <div className="space-y-3 mb-8">
                  <div className="flex justify-between items-center">
                    <span>Total Score</span>
                    <span className="text-2xl font-bold text-primary">
                      ⭐ {context.score.totalScore}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-green-500">
                    <span>Perfect Hits</span>
                    <span className="font-bold">{context.score.perfect}</span>
                  </div>
                  <div className="flex justify-between items-center text-blue-500">
                    <span>Good Hits</span>
                    <span className="font-bold">{context.score.good}</span>
                  </div>
                  <div className="flex justify-between items-center text-red-500">
                    <span>Missed</span>
                    <span className="font-bold">{context.score.missed}</span>
                  </div>
                  <div className="flex justify-between items-center text-orange-500">
                    <span>Max Combo</span>
                    <span className="font-bold">🔥 {context.score.maxCombo}x</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <Button size="lg" onClick={handleStartPlaying} className="w-full">
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Play Again
                  </Button>
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
