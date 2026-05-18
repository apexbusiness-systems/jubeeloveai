/**
 * DailyQuestCard — Jubee's adaptive 3-step daily learning path.
 * Idempotent: re-uses today's quest, auto-completes steps on visit,
 * celebrates once when all three are done.
 *
 * Toddler-friendly features:
 *  - Large caption synced with read-aloud speech
 *  - Calm mode toggle (reduces confetti + animations)
 *  - Repeat read-aloud button on Quest Complete screen
 *  - Progress ring (1/3, 2/3, 3/3) on Complete + step cards
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Sun, Moon, Cloud, Volume2, Sparkles, SparklesIcon } from 'lucide-react';
import { useDailyQuestStore } from '@/store/useDailyQuestStore';
import { useMasteryStore } from '@/store/useMasteryStore';
import { useActivityStore } from '@/store/useActivityStore';
import { useParentalStore } from '@/store/useParentalStore';
import { useJubeeStore } from '@/store/useJubeeStore';
import { getDayPart } from '@/lib/dailyQuest/questPicker';
import { triggerConfetti } from '@/lib/confetti';
import { triggerHaptic } from '@/lib/hapticFeedback';

/**
 * Speak text using the device speech engine. Cancels prior utterance.
 * onWord/onEnd lets us drive a synced caption.
 */
function speakAloud(
  text: string,
  opts?: { onWord?: (spokenSoFar: string) => void; onEnd?: () => void },
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    opts?.onEnd?.();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    u.pitch = 1.2;
    u.volume = 1;
    u.lang = (window as { i18nextLanguage?: string }).i18nextLanguage || 'en-US';
    if (opts?.onWord) {
      u.onboundary = (e: SpeechSynthesisEvent) => {
        if (e.name && e.name !== 'word') return;
        const upto = text.slice(0, e.charIndex + (e.charLength ?? 0));
        opts.onWord!(upto);
      };
    }
    u.onend = () => opts?.onEnd?.();
    u.onerror = () => opts?.onEnd?.();
    window.speechSynthesis.speak(u);
  } catch {
    opts?.onEnd?.();
  }
}

/** Toddler-friendly circular progress ring with "n / total" inside. */
function ProgressRing({
  value,
  total,
  size = 72,
  stroke = 8,
  className = '',
}: {
  value: number;
  total: number;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = total > 0 ? Math.min(value / total, 1) : 0;
  const dash = circ * pct;
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${value} of ${total} steps done`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span
        className="absolute text-sm sm:text-base font-extrabold text-foreground"
        aria-hidden="true"
      >
        {value}/{total}
      </span>
    </div>
  );
}

export function DailyQuestCard() {
  const navigate = useNavigate();
  const activeChildId = useParentalStore(s => s.activeChildId) ?? 'default-child';
  const masteryRecords = useMasteryStore(s => s.records[activeChildId]);
  const favoritePaths = useActivityStore(s => s.favoritePages);
  const pagesVisited = useActivityStore(s => s.pagesVisited);
  const triggerAnimation = useJubeeStore(s => s.triggerAnimation);
  const calmMode = useParentalStore(s => s.settings.calmMode);
  const updateSettings = useParentalStore(s => s.updateSettings);

  const ensureQuest = useDailyQuestStore(s => s.ensureQuest);
  const markStepComplete = useDailyQuestStore(s => s.markStepComplete);
  const markCelebrated = useDailyQuestStore(s => s.markCelebrated);
  const current = useDailyQuestStore(s => s.current);

  const [dismissedCelebration, setDismissedCelebration] = useState(false);
  // Synced caption text spoken so far. Empty = caption hidden.
  const [caption, setCaption] = useState('');

  // Wrapped speak that drives the caption.
  const speakWithCaption = useCallback((text: string) => {
    setCaption(text); // show full caption immediately as a fallback
    speakAloud(text, {
      onWord: (spoken) => setCaption(spoken),
      onEnd: () => {
        // hide caption shortly after speech completes
        window.setTimeout(() => setCaption(prev => (prev === text ? '' : prev)), 1200);
      },
    });
  }, []);

  // Confetti wrapper that respects calm mode.
  const celebrate = useCallback(
    (opts: Parameters<typeof triggerConfetti>[0]) => {
      if (calmMode) return;
      triggerConfetti(opts);
    },
    [calmMode],
  );

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
      celebrate({
        particleCount: 60,
        spread: 70,
        startVelocity: 35,
        origin: { y: 0.7 },
        scalar: 0.9,
      });
      const justDone = current.steps[count - 1];
      if (justDone) speakWithCaption(`Yay! ${justDone.title} done!`);
    }
    prevCompletedRef.current = count;
  }, [current, celebrate, speakWithCaption]);

  // Celebrate once when all three are done.
  useEffect(() => {
    if (!current) return;
    const done = current.completed.length >= current.steps.length && current.steps.length > 0;
    if (done && !current.celebratedAt) {
      triggerHaptic('success');
      celebrate({
        particleCount: 180,
        spread: 100,
        startVelocity: 45,
        origin: { y: 0.6 },
      });
      triggerAnimation('excited');
      speakWithCaption('You did it! Quest complete! Jubee loves you!');
      markCelebrated();
    }
  }, [current, triggerAnimation, markCelebrated, celebrate, speakWithCaption]);

  const part = useMemo(() => getDayPart(), []);
  const PartIcon = part === 'morning' ? Sun : part === 'evening' ? Moon : Cloud;
  const partLabel = part === 'morning' ? 'Good morning' : part === 'evening' ? 'Cozy evening' : 'Sunny afternoon';

  const handleStepTap = useCallback(
    (path: string, title: string) => {
      triggerHaptic('light');
      speakWithCaption(`Let's play ${title}!`);
      triggerAnimation('excited');
      navigate(path);
    },
    [navigate, triggerAnimation, speakWithCaption],
  );

  const handleSpeakStep = useCallback(
    (e: React.MouseEvent, idx: number, title: string) => {
      e.stopPropagation();
      triggerHaptic('light');
      speakWithCaption(`Step ${idx + 1}. ${title}. Tap to play!`);
    },
    [speakWithCaption],
  );

  const handleRepeatAll = useCallback(() => {
    if (!current) return;
    triggerHaptic('light');
    const parts = [
      'You did it!',
      ...current.steps.map((s, i) => `Step ${i + 1}: ${s.title}.`),
      'Great job!',
    ];
    speakWithCaption(parts.join(' '));
  }, [current, speakWithCaption]);

  const toggleCalm = useCallback(() => {
    triggerHaptic('light');
    updateSettings({ calmMode: !calmMode });
  }, [calmMode, updateSettings]);

  if (!current) return null;
  const completedCount = current.completed.length;
  const total = current.steps.length;
  const allDone = completedCount >= total;
  const showCompleteScreen = allDone && !dismissedCelebration;

  // ─────────────────────────────────────────────────────────────
  // Shared: Caption banner
  // ─────────────────────────────────────────────────────────────
  const CaptionBanner = caption ? (
    <div
      className="mt-4 mx-auto max-w-md rounded-2xl bg-foreground/90 text-background px-4 py-3 text-center text-xl sm:text-2xl font-extrabold shadow-lg animate-in fade-in slide-in-from-bottom-2"
      role="status"
      aria-live="polite"
    >
      {caption}
    </div>
  ) : null;

  // ─────────────────────────────────────────────────────────────
  // Calm-mode toggle (shared chip)
  // ─────────────────────────────────────────────────────────────
  const CalmToggle = (
    <button
      type="button"
      onClick={toggleCalm}
      className={`
        inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs sm:text-sm font-bold border-2
        transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
        ${calmMode
          ? 'bg-primary/15 border-primary/50 text-primary'
          : 'bg-card border-border/60 text-muted-foreground hover:border-primary/40'}
      `}
      aria-pressed={calmMode}
      aria-label={calmMode ? 'Calm mode on. Tap to turn off.' : 'Calm mode off. Tap for less animation.'}
    >
      {calmMode ? <SparklesIcon className="w-3.5 h-3.5" aria-hidden="true" /> : <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />}
      Calm {calmMode ? 'On' : 'Off'}
    </button>
  );

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
          {/* Top row: calm toggle */}
          <div className="w-full flex justify-end">{CalmToggle}</div>

          {/* Big badge with progress ring overlay */}
          <div className="relative">
            <div
              className={`relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl ${calmMode ? '' : 'animate-in zoom-in duration-500'}`}
              aria-hidden="true"
            >
              <span className="text-7xl sm:text-8xl drop-shadow-lg">🏆</span>
              {!calmMode && (
                <>
                  <span className="absolute -top-2 -right-2 text-4xl sm:text-5xl animate-bounce">⭐</span>
                  <span className="absolute -bottom-1 -left-2 text-3xl sm:text-4xl animate-pulse">✨</span>
                </>
              )}
            </div>
            {/* Progress ring badge */}
            <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1 shadow-md">
              <ProgressRing value={completedCount} total={total} size={56} stroke={6} />
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-primary leading-tight">
            You did it! 🎉
          </h2>

          {/* Action buttons: Replay + Dismiss */}
          <div className="w-full max-w-xs flex flex-col gap-3 mt-2">
            <button
              type="button"
              onClick={handleRepeatAll}
              className="
                w-full min-h-[56px] rounded-3xl
                bg-card border-4 border-primary/40 text-primary
                text-lg sm:text-xl font-extrabold
                shadow-md active:scale-95 transition-transform duration-150
                focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2
                flex items-center justify-center gap-2
              "
              aria-label="Hear it again: you did it, and all the steps"
            >
              <Volume2 className="w-5 h-5" aria-hidden="true" />
              Hear it again
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                speakWithCaption('See you tomorrow!');
                setDismissedCelebration(true);
              }}
              className="
                w-full min-h-[64px] rounded-3xl
                bg-gradient-to-r from-primary to-accent text-primary-foreground
                text-xl sm:text-2xl font-extrabold
                shadow-lg active:scale-95 transition-transform duration-150
                focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2
              "
              aria-label="Come back tomorrow for a new quest"
            >
              See you tomorrow! 👋
            </button>
          </div>

          {CaptionBanner}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-gradient-to-br from-primary/20 via-card/85 to-accent/20 shadow-xl backdrop-blur-md overflow-hidden rounded-3xl">
      <CardContent className="p-5 sm:p-7">
        {/* Header */}
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
          {/* Progress ring replaces star strip */}
          <ProgressRing value={completedCount} total={total} size={64} stroke={7} className="shrink-0" />
        </div>

        {/* Calm-mode toggle row */}
        <div className="flex justify-end mb-3">{CalmToggle}</div>

        {/* Progress bar — a11y */}
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

        {/* Three GIANT picture buttons */}
        <ol className="grid grid-cols-3 gap-2 sm:gap-4" role="list">
          {current.steps.map((step, idx) => {
            const done = current.completed.includes(step.path);
            const stepNumberEmoji = ['1️⃣', '2️⃣', '3️⃣'][idx] ?? '⭐';
            const stepValue = done ? idx + 1 : idx;
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
                        : `bg-card border-border/60 ${calmMode ? '' : 'hover:-translate-y-1 hover:shadow-xl'} hover:border-primary/60`}
                    `}
                    aria-label={`Step ${idx + 1} of ${total}: ${step.title}. ${done ? 'All done!' : 'Tap to play.'}`}
                    aria-current={!done && idx === completedCount ? 'step' : undefined}
                  >
                    <span className="text-2xl sm:text-3xl" aria-hidden="true">{stepNumberEmoji}</span>
                    <span
                      className={`text-5xl sm:text-7xl drop-shadow-md transition-transform ${done ? 'opacity-60' : calmMode ? '' : 'group-hover:scale-110 group-active:scale-95'}`}
                      aria-hidden="true"
                    >
                      {step.icon}
                    </span>
                    <p className={`text-sm sm:text-lg font-extrabold leading-tight text-center ${done ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {step.title}
                    </p>

                    {/* Mini progress ring per step (1/3, 2/3, 3/3) */}
                    <span className="absolute bottom-1 right-1">
                      <ProgressRing value={stepValue} total={total} size={32} stroke={4} />
                    </span>

                    {done && (
                      <span
                        className={`absolute top-1 right-1 text-2xl sm:text-3xl drop-shadow-md ${calmMode ? '' : 'animate-in zoom-in'}`}
                        aria-hidden="true"
                      >
                        ⭐
                      </span>
                    )}
                  </button>

                  {/* Read-aloud speaker */}
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

        {CaptionBanner}
      </CardContent>
    </Card>
  );
}
