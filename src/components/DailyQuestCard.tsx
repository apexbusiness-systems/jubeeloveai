/**
 * DailyQuestCard — Jubee's adaptive 3-step daily learning path.
 * Idempotent: re-uses today's quest, auto-completes steps on visit,
 * celebrates once when all three are done.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Sun, Moon, Cloud } from 'lucide-react';
import { useDailyQuestStore } from '@/store/useDailyQuestStore';
import { useMasteryStore } from '@/store/useMasteryStore';
import { useActivityStore } from '@/store/useActivityStore';
import { useParentalStore } from '@/store/useParentalStore';
import { useJubeeStore } from '@/store/useJubeeStore';
import { getDayPart } from '@/lib/dailyQuest/questPicker';
import { triggerConfetti } from '@/lib/confetti';

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

  // Ensure today's quest exists (idempotent, deterministic).
  useEffect(() => {
    const records = masteryRecords ? Object.values(masteryRecords) : [];
    ensureQuest({ childId: activeChildId, masteryRecords: records, favoritePaths });
  }, [activeChildId, masteryRecords, favoritePaths, ensureQuest]);

  // Snapshot visit counts at quest-generation moment so a step is only
  // marked complete when the child visits AFTER seeing the quest.
  const baselineRef = useRef<Record<string, number> | null>(null);
  useEffect(() => {
    if (!current) return;
    if (!baselineRef.current || baselineRef.current.__dayKey !== (current.dayKey as never)) {
      baselineRef.current = { ...pagesVisited, __dayKey: current.dayKey as never } as Record<string, number>;
    }
  }, [current, pagesVisited]);

  // Auto-complete steps on visit.
  useEffect(() => {
    if (!current || !baselineRef.current) return;
    for (const step of current.steps) {
      if (current.completed.includes(step.path)) continue;
      const before = baselineRef.current[step.path] ?? 0;
      const now = pagesVisited[step.path] ?? 0;
      if (now > before) markStepComplete(step.path);
    }
  }, [pagesVisited, current, markStepComplete]);

  // Celebrate once when all three are done.
  useEffect(() => {
    if (!current) return;
    const done = current.completed.length >= current.steps.length && current.steps.length > 0;
    if (done && !current.celebratedAt) {
      triggerConfetti();
      triggerAnimation('excited');
      markCelebrated();
    }
  }, [current, triggerAnimation, markCelebrated]);

  const part = useMemo(() => getDayPart(), []);
  const PartIcon = part === 'morning' ? Sun : part === 'evening' ? Moon : Cloud;
  const partLabel = part === 'morning' ? 'Good morning' : part === 'evening' ? 'Cozy evening' : 'Sunny afternoon';

  if (!current) return null;
  const completedCount = current.completed.length;
  const total = current.steps.length;
  const allDone = completedCount >= total;

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
                <button
                  onClick={() => { triggerAnimation('excited'); navigate(step.path); }}
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
                  {/* Big step number badge */}
                  <span className="text-2xl sm:text-3xl" aria-hidden="true">{stepNumberEmoji}</span>
                  {/* HUGE activity emoji — primary visual */}
                  <span
                    className={`text-5xl sm:text-7xl drop-shadow-md transition-transform ${done ? 'opacity-60' : 'group-hover:scale-110 group-active:scale-95'}`}
                    aria-hidden="true"
                  >
                    {step.icon}
                  </span>
                  {/* One short word, big and bold */}
                  <p className={`text-sm sm:text-lg font-extrabold leading-tight text-center ${done ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {step.title}
                  </p>
                  {/* Done overlay — big star */}
                  {done && (
                    <span
                      className="absolute top-1 right-1 text-3xl sm:text-4xl drop-shadow-md animate-in zoom-in"
                      aria-hidden="true"
                    >
                      ⭐
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>

        {allDone && (
          <div
            className="mt-5 rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 border-2 border-primary/40 px-4 py-4 text-center"
            role="status"
            aria-live="polite"
          >
            <p className="text-2xl sm:text-3xl mb-1" aria-hidden="true">🎉🐝🎉</p>
            <p className="text-base sm:text-lg font-extrabold text-primary">
              You did it! Jubee loves you!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
