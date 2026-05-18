/**
 * DailyQuestCard — Jubee's adaptive 3-step daily learning path.
 * Idempotent: re-uses today's quest, auto-completes steps on visit,
 * celebrates once when all three are done.
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Sun, Moon, Cloud, Volume2 } from 'lucide-react';
import { useDailyQuestStore } from '@/store/useDailyQuestStore';
import { useMasteryStore } from '@/store/useMasteryStore';
import { useActivityStore } from '@/store/useActivityStore';
import { useParentalStore } from '@/store/useParentalStore';
import { useJubeeStore } from '@/store/useJubeeStore';
import { getDayPart } from '@/lib/dailyQuest/questPicker';
import { triggerConfetti } from '@/lib/confetti';
import { triggerHaptic } from '@/lib/hapticFeedback';

/** Speak text using the device speech engine. Cancels any prior utterance. */
function speakAloud(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    u.pitch = 1.2;
    u.volume = 1;
    u.lang = (window as { i18nextLanguage?: string }).i18nextLanguage || 'en-US';
    window.speechSynthesis.speak(u);
  } catch {
    /* fail silently — read-aloud is enhancement only */
  }
}

export function DailyQuestCard() {
  const navigate = useNavigate();
  const activeChildId = useParentalStore(s => s.activeChildId) ?? 'default-child';
  const masteryRecords = useMasteryStore(s => s.records[activeChildId]);
  const favoritePaths = useActivityStore(s => s.favoritePages);
  const pagesVisited = useActivityStore(s => s.pagesVisited);
  const triggerAnimation = useJubeeStore(s => s.triggerAnimation);

  const ensureQuest = useDailyQuestStore(s => s.ensureQuest);
  const markStepComplete = useDailyQuestStore(s => s.markStepComplete);
  const markCelebrated = useDailyQuestStore(s => s.markCelebrated);
  const current = useDailyQuestStore(s => s.current);

  const [dismissedCelebration, setDismissedCelebration] = useState(false);

  // Ensure today's quest exists (idempotent, deterministic).
  useEffect(() => {
    const records = masteryRecords ? Object.values(masteryRecords) : [];
    ensureQuest({ childId: activeChildId, masteryRecords: records, favoritePaths });
  }, [activeChildId, masteryRecords, favoritePaths, ensureQuest]);

  // Reset dismissal when a new quest day rolls.
  useEffect(() => {
    setDismissedCelebration(false);
  }, [current?.dayKey]);

  // Snapshot visit counts at quest-generation moment so a step is only
  // marked complete when the child visits AFTER seeing the quest.
  const baselineRef = useRef<Record<string, number> | null>(null);
  useEffect(() => {
    if (!current) return;
    if (!baselineRef.current || baselineRef.current.__dayKey !== (current.dayKey as never)) {
      baselineRef.current = { ...pagesVisited, __dayKey: current.dayKey as never } as Record<string, number>;
    }
  }, [current, pagesVisited]);

  // Track previously-completed count so we can fire feedback on each new step.
  const prevCompletedRef = useRef(0);

  // Auto-complete steps on visit + per-step haptic & confetti feedback.
  useEffect(() => {
    if (!current || !baselineRef.current) return;
    for (const step of current.steps) {
      if (current.completed.includes(step.path)) continue;
      const before = baselineRef.current[step.path] ?? 0;
      const now = pagesVisited[step.path] ?? 0;
      if (now > before) markStepComplete(step.path);
    }
  }, [pagesVisited, current, markStepComplete]);

  // Fire gentle feedback exactly when completed count grows.
  useEffect(() => {
    if (!current) return;
    const count = current.completed.length;
    const prev = prevCompletedRef.current;
    if (count > prev && count < current.steps.length) {
      triggerHaptic('success');
      triggerConfetti({
        particleCount: 60,
        spread: 70,
        startVelocity: 35,
        origin: { y: 0.7 },
        scalar: 0.9,
      });
      const justDone = current.steps[count - 1];
      if (justDone) speakAloud(`Yay! ${justDone.title} done!`);
    }
    prevCompletedRef.current = count;
  }, [current]);

  // Celebrate once when all three are done.
  useEffect(() => {
    if (!current) return;
    const done = current.completed.length >= current.steps.length && current.steps.length > 0;
    if (done && !current.celebratedAt) {
      triggerHaptic('success');
      triggerConfetti({
        particleCount: 180,
        spread: 100,
        startVelocity: 45,
        origin: { y: 0.6 },
      });
      triggerAnimation('excited');
      speakAloud('You did it! Quest complete! Jubee loves you!');
      markCelebrated();
    }
  }, [current, triggerAnimation, markCelebrated]);

  const part = useMemo(() => getDayPart(), []);
  const PartIcon = part === 'morning' ? Sun : part === 'evening' ? Moon : Cloud;
  const partLabel = part === 'morning' ? 'Good morning' : part === 'evening' ? 'Cozy evening' : 'Sunny afternoon';

  const handleStepTap = useCallback(
    (path: string, title: string) => {
      triggerHaptic('light');
      speakAloud(`Let's play ${title}!`);
      triggerAnimation('excited');
      navigate(path);
    },
    [navigate, triggerAnimation],
  );

  const handleSpeakStep = useCallback(
    (e: React.MouseEvent, idx: number, title: string) => {
      e.stopPropagation();
      triggerHaptic('light');
      speakAloud(`Step ${idx + 1}. ${title}. Tap to play!`);
    },
    [],
  );

  if (!current) return null;
  const completedCount = current.completed.length;
  const total = current.steps.length;
  const allDone = completedCount >= total;
  const showCompleteScreen = allDone && !dismissedCelebration;

  // ─────────────────────────────────────────────────────────────
  // Toddler-friendly "Quest Complete" screen
  // ─────────────────────────────────────────────────────────────
  if (showCompleteScreen) {
    return (
      <Card
        className="border-0 bg-gradient-to-br from-primary/30 via-card/90 to-accent/30 shadow-2xl backdrop-blur-md overflow-hidden rounded-3xl"
        role="status"
        aria-live="polite"
      >
        <CardContent className="p-8 sm:p-10 flex flex-col items-center text-center gap-5">
          {/* Big badge */}
          <div
            className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl animate-in zoom-in duration-500"
            aria-hidden="true"
          >
            <span className="text-7xl sm:text-8xl drop-shadow-lg">🏆</span>
            <span className="absolute -top-2 -right-2 text-4xl sm:text-5xl animate-bounce">⭐</span>
            <span className="absolute -bottom-1 -left-2 text-3xl sm:text-4xl animate-pulse">✨</span>
          </div>

          {/* One short message */}
          <h2 className="text-3xl sm:text-4xl font-extrabold text-primary leading-tight">
            You did it! 🎉
          </h2>

          {/* Single button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              speakAloud('See you tomorrow!');
              setDismissedCelebration(true);
            }}
            className="
              mt-2 w-full max-w-xs min-h-[64px] rounded-3xl
              bg-gradient-to-r from-primary to-accent text-primary-foreground
              text-xl sm:text-2xl font-extrabold
              shadow-lg active:scale-95 transition-transform duration-150
              focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2
            "
            aria-label="Come back tomorrow for a new quest"
          >
            See you tomorrow! 👋
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-gradient-to-br from-primary/20 via-card/85 to-accent/20 shadow-xl backdrop-blur-md overflow-hidden rounded-3xl">
      <CardContent className="p-5 sm:p-7">
        {/* Toddler-friendly header: huge emoji, tiny words */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <span className="text-5xl sm:text-6xl drop-shadow-sm" aria-hidden="true">
              {part === 'morning' ? '☀️' : part === 'evening' ? '🌙' : '⛅'}
            </span>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-none">
                {partLabel}!
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground font-semibold flex items-center gap-1 mt-1">
                <PartIcon className="w-4 h-4" aria-hidden="true" />
                Let's play with Jubee!
              </p>
            </div>
          </div>
          {/* Big star counter — visual, no math required */}
          <div
            className="shrink-0 flex items-center gap-1 rounded-full bg-primary/15 border-2 border-primary/30 px-3 py-2"
            aria-label={`${completedCount} of ${total} stars earned`}
          >
            {current.steps.map((_, i) => (
              <span key={i} className="text-2xl sm:text-3xl" aria-hidden="true">
                {i < completedCount ? '⭐' : '☆'}
              </span>
            ))}
          </div>
        </div>

        {/* Progress bar — kept for a11y but visually chunky */}
        <div
          className="h-3 w-full rounded-full bg-muted overflow-hidden mb-5"
          role="progressbar"
          aria-valuenow={completedCount}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label="Today's progress"
        >
          <div
            className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-500 ease-out"
            style={{ width: `${(completedCount / Math.max(total, 1)) * 100}%` }}
          />
        </div>

        {/* Three GIANT picture buttons — emoji-led, minimal text */}
        <ol className="grid grid-cols-3 gap-2 sm:gap-4" role="list">
          {current.steps.map((step, idx) => {
            const done = current.completed.includes(step.path);
            const stepNumberEmoji = ['1️⃣', '2️⃣', '3️⃣'][idx] ?? '⭐';
            return (
              <li key={step.path}>
                <div className="relative">
                  <button
                    onClick={() => handleStepTap(step.path, step.title)}
                    className={`
                      group relative w-full min-h-[140px] sm:min-h-[170px] rounded-3xl border-4
                      flex flex-col items-center justify-center gap-1 sm:gap-2
                      px-2 py-3 sm:px-3 sm:py-4 transition-all duration-300
                      focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2
                      active:scale-95
                      ${done
                        ? 'bg-primary/15 border-primary/50'
                        : 'bg-card border-border/60 hover:-translate-y-1 hover:shadow-xl hover:border-primary/60'}
                    `}
                    aria-label={`Step ${idx + 1}: ${step.title}. ${done ? 'All done!' : 'Tap to play.'}`}
                    aria-current={!done && idx === completedCount ? 'step' : undefined}
                  >
                    <span className="text-2xl sm:text-3xl" aria-hidden="true">{stepNumberEmoji}</span>
                    <span
                      className={`text-5xl sm:text-7xl drop-shadow-md transition-transform ${done ? 'opacity-60' : 'group-hover:scale-110 group-active:scale-95'}`}
                      aria-hidden="true"
                    >
                      {step.icon}
                    </span>
                    <p className={`text-sm sm:text-lg font-extrabold leading-tight text-center ${done ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {step.title}
                    </p>
                    {done && (
                      <span
                        className="absolute top-1 right-1 text-3xl sm:text-4xl drop-shadow-md animate-in zoom-in"
                        aria-hidden="true"
                      >
                        ⭐
                      </span>
                    )}
                  </button>

                  {/* Read-aloud speaker — small, top-left, doesn't block main tap */}
                  <button
                    type="button"
                    onClick={(e) => handleSpeakStep(e, idx, step.title)}
                    className="
                      absolute top-1 left-1 w-9 h-9 rounded-full
                      bg-background/90 border-2 border-primary/40
                      flex items-center justify-center shadow-md
                      text-primary active:scale-90 transition-transform
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                    "
                    aria-label={`Hear step ${idx + 1}: ${step.title}`}
                  >
                    <Volume2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
