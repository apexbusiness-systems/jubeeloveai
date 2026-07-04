/**
 * Feelings Explorer — toddler social-emotional learning game.
 *
 * Flow:  scene panels → emotion picker → Feely reacts → help choice → journal sticker
 *
 * Design constraints honored:
 *  - No new dependencies (uses existing zustand, framer-motion, lucide-react,
 *    canvas-confetti, Web Speech API via JubeeStore.speak, haptic util).
 *  - Pure semantic tokens, no hardcoded colors.
 *  - Non-readers: every prompt is also spoken; choices are giant icon buttons.
 *  - Zero time pressure, zero negative penalty.
 *  - Idempotent: re-mounting mid-scene preserves progress via Zustand.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Sparkles, ArrowLeft, RotateCw, BookHeart } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useJubeeStore } from '@/store/useJubeeStore';
import { useGameStore } from '@/store/useGameStore';
import { useFeelingsStore } from '@/store/useFeelingsStore';
import { useParentalStore } from '@/store/useParentalStore';
import { useShallow } from 'zustand/react/shallow';
import { triggerHaptic } from '@/lib/hapticFeedback';
import { triggerConfetti } from '@/lib/confetti';
import {
  SCENES,
  EMOTIONS,
  EMOTION_KEYS,
  buildEmotionChoices,
  pickNextScene,
  type EmotionKey,
  type Scene,
  type HelpOption,
} from '@/modules/feelings/scenes';
import { Feely } from '@/modules/feelings/Feely';

type Phase = 'menu' | 'story' | 'pick' | 'reaction' | 'help' | 'done' | 'journal' | 'selfreport';

const PANEL_INTERVAL_MS = 1100;

export default function FeelingsGame() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const speak = useJubeeStore(s => s.speak);
  const addScore = useGameStore(s => s.addScore);
  const calmMode = useParentalStore(s => s.settings?.calmMode ?? false);

  // ⚡ Bolt: Grouped multiple separate Zustand selectors into a single object with useShallow
  // to reduce the number of store subscriptions and prevent unnecessary re-renders.
  const { playedSceneIds, journal, recordScenePlayed, recordSelfReport } = useFeelingsStore(
    useShallow(s => ({
      playedSceneIds: s.playedSceneIds,
      journal: s.journal,
      recordScenePlayed: s.recordScenePlayed,
      recordSelfReport: s.recordSelfReport
    }))
  );

  const [phase, setPhase] = useState<Phase>('menu');
  const [scene, setScene] = useState<Scene | null>(null);
  const [panelIdx, setPanelIdx] = useState(0);
  const [feelyEmotion, setFeelyEmotion] = useState<EmotionKey>('happy');
  const [picked, setPicked] = useState<EmotionKey | null>(null);
  const [choices, setChoices] = useState(() => buildEmotionChoices(SCENES[0]));
  const [showWordLabel, setShowWordLabel] = useState(false);

  // ----- Idempotent guards for async timers -----
  const timersRef = useRef<number[]>([]);
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(id => window.clearTimeout(id));
    timersRef.current = [];
  }, []);
  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);
  useEffect(() => () => clearTimers(), [clearTimers]);

  const startNewScene = useCallback(() => {
    clearTimers();
    const next = pickNextScene(playedSceneIds);
    setScene(next);
    setChoices(buildEmotionChoices(next));
    setPanelIdx(0);
    setPicked(null);
    setFeelyEmotion('happy');
    setShowWordLabel(false);
    setPhase('story');
    speak(next.story);
  }, [playedSceneIds, speak, clearTimers]);

  // Advance panels during story phase
  useEffect(() => {
    if (phase !== 'story' || !scene) return;
    if (panelIdx >= scene.panels.length - 1) {
      const id = schedule(() => setPhase('pick'), 900);
      return () => window.clearTimeout(id);
    }
    const id = schedule(() => setPanelIdx(i => i + 1), PANEL_INTERVAL_MS);
    return () => window.clearTimeout(id);
  }, [phase, panelIdx, scene, schedule]);

  // Speak picker prompt once
  useEffect(() => {
    if (phase === 'pick') speak("How does Feely feel?");
  }, [phase, speak]);

  const handlePickEmotion = useCallback((emo: EmotionKey) => {
    if (!scene || picked) return;
    triggerHaptic('light');
    setPicked(emo);

    const correct = emo === scene.emotion;
    if (correct) {
      setFeelyEmotion(emo);
      setShowWordLabel(true);
      speak(EMOTIONS[emo].cheer);
      addScore(15);
      if (!calmMode) {
        triggerConfetti({ particleCount: 40, spread: 60, origin: { y: 0.55 } });
        triggerHaptic('success');
      }
      recordScenePlayed(scene.id, scene.emotion, true);
      setPhase('reaction');
      schedule(() => setPhase('help'), 1800);
    } else {
      // Gentle retry — never punish
      speak("Look again. How does Feely feel?");
      schedule(() => setPicked(null), 900);
    }
  }, [scene, picked, speak, addScore, calmMode, recordScenePlayed, schedule]);

  const handlePickHelp = useCallback((opt: HelpOption) => {
    triggerHaptic('light');
    speak(opt.label);
    setFeelyEmotion(opt.reaction);
    if (!calmMode) triggerConfetti({ particleCount: 60, spread: 80, origin: { y: 0.5 } });
    addScore(10);
    schedule(() => setPhase('done'), 1400);
  }, [speak, calmMode, addScore, schedule]);

  const totalCount = SCENES.length;
  const journalCount = journal.length;

  // ----- Render branches -----

  if (phase === 'menu') {
    return (
      <FeelingsMenu
        onStart={() => { startNewScene(); }}
        onJournal={() => setPhase('journal')}
        onSelfReport={() => setPhase('selfreport')}
        onBack={() => navigate('/games')}
        journalCount={journalCount}
        totalCount={totalCount}
      />
    );
  }

  if (phase === 'journal') {
    return <FeelingsJournal onBack={() => setPhase('menu')} />;
  }

  if (phase === 'selfreport') {
    return (
      <SelfReport
        onPick={(e) => {
          recordSelfReport(e);
          setFeelyEmotion(e);
          speak(`You feel ${EMOTIONS[e].label.toLowerCase()}. Thank you for sharing.`);
          schedule(() => setPhase('menu'), 1800);
        }}
        onBack={() => setPhase('menu')}
      />
    );
  }

  if (!scene) return null;

  return (
    <>
      <SEO
        title="Feelings Explorer — Jubee Love"
        description="A gentle game that helps young children name and explore feelings with Feely the friendly blob."
      />
      <div className="min-h-screen p-4 sm:p-6 md:p-8 pt-6 mx-auto max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => { clearTimers(); setPhase('menu'); }}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-base font-bold border-2 border-game-accent bg-card text-foreground hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary"
            aria-label="Back to Feelings menu"
          >
            <ArrowLeft className="w-4 h-4" /> Menu
          </button>
          <div className="text-base font-bold text-game-neutral" aria-live="polite">
            <BookHeart className="inline w-5 h-5 mr-1 text-primary" />
            {journalCount}/{totalCount}
          </div>
        </div>

        {/* Stage */}
        <div
          className="rounded-3xl border-4 border-game-accent p-6 sm:p-10 text-center min-h-[440px] flex flex-col items-center justify-center gap-6"
          style={{ background: 'var(--gradient-neutral)', boxShadow: 'var(--shadow-game)' }}
        >
          {/* Scene panels */}
          {phase === 'story' && (
            <>
              <div className="text-xl sm:text-2xl font-bold text-game-neutral">Watch what happens…</div>
              <div className="flex items-center justify-center gap-4 sm:gap-6 text-7xl sm:text-8xl" aria-live="polite">
                {scene.panels.map((panel, i) => (
                  <motion.div
                    key={`${scene.id}-${i}`}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{
                      opacity: i <= panelIdx ? 1 : 0.25,
                      scale: i === panelIdx ? (reduce ? 1 : 1.15) : 1,
                    }}
                    transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                    aria-hidden={i > panelIdx}
                  >
                    {panel}
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {/* Feely + emotion picker / reaction / help */}
          {phase !== 'story' && (
            <>
              <div className="relative">
                <Feely emotion={feelyEmotion} size={200} />
                <AnimatePresence>
                  {showWordLabel && (
                    <motion.div
                      key={`word-${feelyEmotion}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute left-1/2 -translate-x-1/2 -bottom-2 px-4 py-1 rounded-full bg-primary text-primary-foreground font-extrabold uppercase tracking-wider text-sm shadow-md"
                    >
                      {EMOTIONS[feelyEmotion].label}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {phase === 'pick' && (
                <>
                  <div className="text-xl sm:text-2xl font-bold text-game-neutral">How does Feely feel?</div>
                  <div className="grid grid-cols-3 gap-3 sm:gap-5 w-full max-w-md">
                    {choices.map((c) => {
                      const isWrong = picked === c.key && c.key !== scene.emotion;
                      return (
                        <button
                          key={c.key}
                          onClick={() => handlePickEmotion(c.key)}
                          disabled={picked !== null}
                          aria-label={`Feely is ${c.label}`}
                          className={`aspect-square rounded-3xl border-4 border-game-accent flex items-center justify-center text-5xl sm:text-6xl bg-card transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary ${
                            isWrong ? 'opacity-50' : 'hover:scale-105'
                          }`}
                          style={{ boxShadow: 'var(--shadow-game)' }}
                        >
                          {c.emoji}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {phase === 'reaction' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-2xl font-bold text-primary"
                  aria-live="polite"
                >
                  ⭐ {EMOTIONS[scene.emotion].label}! ⭐
                </motion.div>
              )}

              {phase === 'help' && (
                <>
                  <div className="text-xl sm:text-2xl font-bold text-game-neutral">What would help Feely?</div>
                  <div className="grid grid-cols-3 gap-3 sm:gap-5 w-full max-w-md">
                    {scene.help.map((h, i) => (
                      <button
                        key={i}
                        onClick={() => handlePickHelp(h)}
                        aria-label={h.label}
                        className="aspect-square rounded-3xl border-4 border-game-accent flex flex-col items-center justify-center gap-1 bg-card hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary p-2"
                        style={{ boxShadow: 'var(--shadow-accent)' }}
                      >
                        <span className="text-4xl sm:text-5xl" aria-hidden>{h.emoji}</span>
                        <span className="text-xs sm:text-sm font-semibold text-foreground leading-tight">{h.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {phase === 'done' && (
                <DoneCard
                  emotion={scene.emotion}
                  onAgain={startNewScene}
                  onMenu={() => { clearTimers(); setPhase('menu'); }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------------- Subcomponents ---------------- */

interface MenuProps {
  onStart: () => void;
  onJournal: () => void;
  onSelfReport: () => void;
  onBack: () => void;
  journalCount: number;
  totalCount: number;
}

function FeelingsMenu({ onStart, onJournal, onSelfReport, onBack, journalCount, totalCount }: MenuProps) {
  return (
    <>
      <SEO
        title="Feelings Explorer — Jubee Love"
        description="Help Feely name feelings and learn what to do when emotions show up. A gentle social-emotional learning game for 3–5 year olds."
      />
      <div className="min-h-screen p-4 sm:p-6 md:p-8 pt-6 mx-auto max-w-3xl">
        <header className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-game mb-2">💛 Feelings Explorer</h1>
          <p className="text-lg sm:text-xl text-game-neutral">Meet Feely and learn about feelings!</p>
        </header>

        <div className="flex flex-col items-center mb-6">
          <Feely emotion="happy" size={180} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <button
            onClick={onStart}
            className="p-6 rounded-3xl border-4 border-game-accent text-primary-foreground hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary min-h-[160px]"
            style={{ background: 'var(--gradient-warm)', boxShadow: 'var(--shadow-game)' }}
            aria-label="Play a feelings scene"
          >
            <div className="text-5xl mb-2" aria-hidden>▶️</div>
            <div className="text-xl font-bold">Play</div>
            <div className="text-sm opacity-90">Help Feely!</div>
          </button>

          <button
            onClick={onJournal}
            className="p-6 rounded-3xl border-4 border-game-accent text-primary-foreground hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary min-h-[160px]"
            style={{ background: 'var(--gradient-cool)', boxShadow: 'var(--shadow-accent)' }}
            aria-label={`Open feelings journal, ${journalCount} of ${totalCount} stickers collected`}
          >
            <div className="text-5xl mb-2" aria-hidden>📓</div>
            <div className="text-xl font-bold">Journal</div>
            <div className="text-sm opacity-90">{journalCount}/{totalCount} stickers</div>
          </button>

          <button
            onClick={onSelfReport}
            className="p-6 rounded-3xl border-4 border-game-accent text-primary-foreground hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary min-h-[160px]"
            style={{ background: 'var(--gradient-game)', boxShadow: 'var(--shadow-game)' }}
            aria-label="Tell Feely how you feel right now"
          >
            <div className="text-5xl mb-2" aria-hidden><Sparkles className="inline w-12 h-12" /></div>
            <div className="text-xl font-bold">How do YOU feel?</div>
            <div className="text-sm opacity-90">Tell Feely</div>
          </button>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-full text-lg font-bold border-2 border-border text-game-neutral bg-card hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary"
            aria-label="Back to Games menu"
          >
            ← Back to Games
          </button>
        </div>
      </div>
    </>
  );
}

function FeelingsJournal({ onBack }: { onBack: () => void }) {
  const journal = useFeelingsStore(s => s.journal);
  const totalCorrect = useFeelingsStore(s => s.totalCorrect);
  const totalPlayed = useFeelingsStore(s => s.totalPlayed);
  const speak = useJubeeStore(s => s.speak);

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 pt-6 mx-auto max-w-3xl">
      <header className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-game mb-1">📓 Feelings Journal</h1>
        <p className="text-base sm:text-lg text-game-neutral">
          {journal.length} of {EMOTION_KEYS.length} feelings learned · {totalCorrect}/{totalPlayed} scenes
        </p>
      </header>

      <div
        className="rounded-3xl border-4 border-game-accent p-6 sm:p-8"
        style={{ background: 'var(--gradient-neutral)', boxShadow: 'var(--shadow-game)' }}
      >
        <div className="grid grid-cols-4 gap-4">
          {EMOTION_KEYS.map(k => {
            const earned = journal.includes(k);
            const def = EMOTIONS[k];
            return (
              <button
                key={k}
                onClick={() => earned && speak(`This is ${def.label.toLowerCase()}.`)}
                disabled={!earned}
                className={`aspect-square rounded-2xl border-4 flex flex-col items-center justify-center transition-transform ${
                  earned
                    ? 'bg-card border-game-accent hover:scale-105'
                    : 'bg-muted/30 border-border opacity-60'
                }`}
                aria-label={earned ? `${def.label} sticker earned` : `${def.label} sticker not yet earned`}
              >
                <span className={`text-4xl sm:text-5xl ${earned ? '' : 'grayscale'}`} aria-hidden>
                  {earned ? def.sticker : '❓'}
                </span>
                <span className="text-xs sm:text-sm font-bold text-foreground mt-1">
                  {earned ? def.label : '?'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-center mt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-full text-lg font-bold border-2 border-border text-game-neutral bg-card hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

function SelfReport({ onPick, onBack }: { onPick: (e: EmotionKey) => void; onBack: () => void }) {
  const speak = useJubeeStore(s => s.speak);
  useEffect(() => { speak("How do you feel right now?"); }, [speak]);
  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 pt-6 mx-auto max-w-3xl">
      <header className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-game mb-2">How do YOU feel?</h1>
        <p className="text-lg text-game-neutral">Tap a feeling. Every answer is okay! 💛</p>
      </header>

      <div
        className="rounded-3xl border-4 border-game-accent p-6 sm:p-8"
        style={{ background: 'var(--gradient-neutral)', boxShadow: 'var(--shadow-accent)' }}
      >
        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          {EMOTION_KEYS.map(k => {
            const d = EMOTIONS[k];
            return (
              <button
                key={k}
                onClick={() => { triggerHaptic('light'); onPick(k); }}
                aria-label={`I feel ${d.label}`}
                className="aspect-square rounded-2xl border-4 border-game-accent bg-card flex flex-col items-center justify-center gap-1 hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary"
              >
                <span className="text-4xl sm:text-5xl" aria-hidden>{d.emoji}</span>
                <span className="text-xs sm:text-sm font-bold text-foreground">{d.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-center mt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-full text-lg font-bold border-2 border-border text-game-neutral bg-card hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

function DoneCard({ emotion, onAgain, onMenu }: { emotion: EmotionKey; onAgain: () => void; onMenu: () => void }) {
  const def = EMOTIONS[emotion];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="text-2xl font-bold text-primary">⭐ You earned a sticker! ⭐</div>
      <div className="text-6xl" aria-hidden>{def.sticker}</div>
      <div className="text-lg font-bold text-foreground">{def.label}</div>
      <div className="flex gap-3 mt-2">
        <button
          onClick={onAgain}
          className="flex items-center gap-2 px-5 py-3 rounded-full text-lg font-bold text-primary-foreground border-3 border-game-accent hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary"
          style={{ background: 'var(--gradient-warm)', boxShadow: 'var(--shadow-game)' }}
        >
          <RotateCw className="w-5 h-5" /> Again
        </button>
        <button
          onClick={onMenu}
          className="px-5 py-3 rounded-full text-lg font-bold border-2 border-border text-game-neutral bg-card hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary"
        >
          Menu
        </button>
      </div>
    </motion.div>
  );
}
