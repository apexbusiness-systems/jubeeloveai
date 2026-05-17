/**
 * Daily Quest Picker
 *
 * Pure, deterministic algorithm that selects a 3-step personalized learning
 * path for a child for a given calendar day. Pure functions only — no I/O,
 * no side effects, fully testable.
 *
 * Inputs blended:
 *   - Mastery records (needs-review skills get priority)
 *   - Favorite pages (familiarity / engagement signal)
 *   - Time-of-day theme (morning/afternoon/evening)
 *   - Category variety (avoid two of same SkillCategory in a row)
 *   - Daily seed (calendar date) so the quest is stable within a day
 *     and refreshes naturally each new day.
 */

import type { MasteryRecord } from '@/store/useMasteryStore';
import { Skills, type SkillCategoryId, type SkillId } from '@/lib/mastery/taxonomy';

export interface QuestActivity {
  path: string;
  title: string;
  icon: string;
  description: string;
  skillId: SkillId;
  category: SkillCategoryId;
  reason: 'review' | 'favorite' | 'explore' | 'wind-down' | 'warm-up';
}

export type DayPart = 'morning' | 'afternoon' | 'evening';

interface CatalogEntry {
  path: string;
  title: string;
  icon: string;
  description: string;
  skillId: SkillId;
}

/** All quest-eligible activities, mapped to their primary skill. */
const ACTIVITY_CATALOG: readonly CatalogEntry[] = [
  { path: '/write',    title: 'Writing Practice', icon: '✏️', description: 'Trace and write',           skillId: Skills.TRACING.id },
  { path: '/shapes',   title: 'Shape Sorter',     icon: '⭐', description: 'Match the shapes',          skillId: Skills.SHAPE_REC.id },
  { path: '/reading',  title: 'Reading Practice', icon: '📚', description: 'Sound out new words',       skillId: Skills.READING.id },
  { path: '/stories',  title: 'Story Time',       icon: '📖', description: 'A cozy story with Jubee',   skillId: Skills.STORY.id },
  { path: '/games',    title: 'Memory Game',      icon: '🧠', description: 'Train your memory',         skillId: Skills.MEMORY.id },
  { path: '/music',    title: 'Music & Lullabies',icon: '🎵', description: 'Sing and wind down',        skillId: Skills.STORY.id },
  { path: '/dance',    title: 'JubeeDance',       icon: '💃', description: 'Move with the beat',        skillId: Skills.PATTERNING.id },
] as const;

const SKILL_TO_CATEGORY: Record<SkillId, SkillCategoryId> = Object.values(Skills).reduce(
  (acc, s) => { acc[s.id] = s.category; return acc; },
  {} as Record<SkillId, SkillCategoryId>,
);

/** Stable day key — local-time calendar date. */
export function getDayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDayPart(now: Date = new Date()): DayPart {
  const h = now.getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

/** Mulberry32 — tiny deterministic PRNG seeded from the day key + childId. */
function seededRand(seed: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  let state = h >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: readonly T[], rand: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function toActivity(entry: CatalogEntry, reason: QuestActivity['reason']): QuestActivity {
  return {
    ...entry,
    category: SKILL_TO_CATEGORY[entry.skillId],
    reason,
  };
}

export interface PickQuestInput {
  childId: string;
  masteryRecords?: MasteryRecord[];
  favoritePaths?: string[];
  now?: Date;
}

/**
 * Pick a 3-step daily quest. Pure & deterministic for a given (childId, day).
 * Ordering rule: a warm-up first, the harder review step in the middle,
 * and a calming/exploration step last — matches early-childhood
 * attention curves and evening wind-down patterns.
 */
export function pickDailyQuest(input: PickQuestInput): QuestActivity[] {
  const { childId, masteryRecords = [], favoritePaths = [], now = new Date() } = input;
  const dayKey = getDayKey(now);
  const part = getDayPart(now);
  const rand = seededRand(`${dayKey}:${childId}`);

  const catalogBySkill = new Map<SkillId, CatalogEntry>();
  for (const e of ACTIVITY_CATALOG) catalogBySkill.set(e.skillId, e);

  const picked: QuestActivity[] = [];
  const usedPaths = new Set<string>();
  const categoryCount = new Map<SkillCategoryId, number>();

  const tryAdd = (entry: CatalogEntry | undefined, reason: QuestActivity['reason']): boolean => {
    if (!entry || usedPaths.has(entry.path)) return false;
    const cat = SKILL_TO_CATEGORY[entry.skillId];
    if ((categoryCount.get(cat) ?? 0) >= 2) return false; // variety guard
    picked.push(toActivity(entry, reason));
    usedPaths.add(entry.path);
    categoryCount.set(cat, (categoryCount.get(cat) ?? 0) + 1);
    return true;
  };

  // 1) Warm-up: a favorite (familiarity) or shuffled fallback.
  const favoriteEntry = favoritePaths
    .map(p => ACTIVITY_CATALOG.find(e => e.path === p))
    .find((e): e is CatalogEntry => Boolean(e));
  if (!tryAdd(favoriteEntry, 'favorite')) {
    const fallback = shuffle(ACTIVITY_CATALOG, rand)[0];
    tryAdd(fallback, 'warm-up');
  }

  // 2) Core: needs-review skill (spaced repetition) if any.
  const reviewEntry = masteryRecords
    .slice()
    .sort((a, b) => a.score - b.score)
    .map(r => catalogBySkill.get(r.skillId))
    .find((e): e is CatalogEntry => Boolean(e) && !usedPaths.has(e.path));
  if (!tryAdd(reviewEntry, 'review')) {
    const explore = shuffle(ACTIVITY_CATALOG, rand).find(e => !usedPaths.has(e.path));
    tryAdd(explore, 'explore');
  }

  // 3) Closer: time-of-day appropriate.
  const calmingPaths = ['/stories', '/music'];
  const energeticPaths = ['/dance', '/games'];
  const preferred = part === 'evening' ? calmingPaths : part === 'afternoon' ? energeticPaths : ['/reading', '/write', '/shapes'];
  const closerEntry =
    preferred.map(p => ACTIVITY_CATALOG.find(e => e.path === p)).find((e): e is CatalogEntry => Boolean(e) && !usedPaths.has(e.path))
    ?? shuffle(ACTIVITY_CATALOG, rand).find(e => !usedPaths.has(e.path));
  tryAdd(closerEntry, part === 'evening' ? 'wind-down' : 'explore');

  // Safety net: pad to 3 if catalog/variety guards blocked us.
  for (const entry of shuffle(ACTIVITY_CATALOG, rand)) {
    if (picked.length >= 3) break;
    if (!usedPaths.has(entry.path)) {
      picked.push(toActivity(entry, 'explore'));
      usedPaths.add(entry.path);
    }
  }

  return picked.slice(0, 3);
}
