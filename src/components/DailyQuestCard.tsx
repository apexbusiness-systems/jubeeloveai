/**
 * DailyQuestCard — Jubee's adaptive 3-step daily learning path.
 * Idempotent: re-uses today's quest, auto-completes steps on visit,
 * celebrates once when all three are done.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Sparkles, Sun, Moon, Cloud } from 'lucide-react';
import { useDailyQuestStore } from '@/store/useDailyQuestStore';
import { useMasteryStore } from '@/store/useMasteryStore';
import { useActivityStore } from '@/store/useActivityStore';
import { useParentalStore } from '@/store/useParentalStore';
import { useJubeeStore } from '@/store/useJubeeStore';
import { getDayPart, type QuestActivity } from '@/lib/dailyQuest/questPicker';
import { triggerConfetti } from '@/lib/confetti';

const REASON_LABEL: Record<QuestActivity['reason'], string> = {
  favorite: 'Warm-up',
  'warm-up': 'Warm-up',
  review: 'Boost',
  explore: 'Discover',
  'wind-down': 'Wind-down',
};

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
    <Card className="border-0 bg-gradient-to-br from-primary/15 via-card/85 to-accent/15 shadow-xl backdrop-blur-md overflow-hidden">
      <CardContent className="p-5 sm:p-6 lg:p-8">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-muted-foreground font-semibold">
              <PartIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{partLabel}</span>
              <span aria-hidden="true">·</span>
              <span>Jubee's Daily Quest</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Today's 3-step adventure
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              Hand-picked just for you. Finish all three to make Jubee buzz with joy!
            </p>
          </div>
          <div
            className="shrink-0 rounded-full bg-primary/10 border border-primary/30 px-3 py-2 text-center"
            aria-label={`${completedCount} of ${total} steps complete`}
          >
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Progress</div>
            <div className="text-lg font-bold text-primary">{completedCount}/{total}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="h-2 w-full rounded-full bg-muted overflow-hidden mb-5"
          role="progressbar"
          aria-valuenow={completedCount}
          aria-valuemin={0}
          aria-valuemax={total}
        >
          <div
            className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-500 ease-out"
            style={{ width: `${(completedCount / Math.max(total, 1)) * 100}%` }}
          />
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4" role="list">
          {current.steps.map((step, idx) => {
            const done = current.completed.includes(step.path);
            return (
              <li key={step.path}>
                <button
                  onClick={() => { triggerAnimation('excited'); navigate(step.path); }}
                  className={`
                    group relative w-full h-full rounded-2xl border text-left
                    px-4 py-4 sm:px-5 sm:py-5 transition-all duration-300
                    focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2
                    ${done
                      ? 'bg-primary/10 border-primary/40 opacity-80'
                      : 'bg-card/90 border-border/60 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/40'}
                  `}
                  aria-label={`Step ${idx + 1}: ${step.title}. ${done ? 'Completed.' : 'Start now.'}`}
                  aria-current={!done && idx === completedCount ? 'step' : undefined}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-semibold">
                      Step {idx + 1} · {REASON_LABEL[step.reason]}
                    </span>
                    {done
                      ? <CheckCircle2 className="w-5 h-5 text-primary" aria-hidden="true" />
                      : <Sparkles className="w-4 h-4 text-accent opacity-70 group-hover:opacity-100" aria-hidden="true" />}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl sm:text-4xl drop-shadow-sm" aria-hidden="true">{step.icon}</span>
                    <div className="space-y-0.5 min-w-0">
                      <p className={`text-base sm:text-lg font-bold leading-tight ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {step.title}
                      </p>
                      <p className="text-xs sm:text-sm text-foreground/70 truncate">{step.description}</p>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>

        {allDone && (
          <div
            className="mt-5 rounded-xl bg-primary/15 border border-primary/30 px-4 py-3 text-center"
            role="status"
            aria-live="polite"
          >
            <p className="text-sm sm:text-base font-semibold text-primary">
              🎉 Quest complete! Jubee is so proud of you. Come back tomorrow for a new adventure!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
