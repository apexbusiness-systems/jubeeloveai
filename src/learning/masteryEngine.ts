export type LearningEvent = {
  eventId: string;
  childId: string;
  activityId: string;
  activityType: 'reading' | 'writing' | 'game' | 'shape' | 'music' | 'dance' | 'sticker' | 'story';
  skillIds: string[];
  outcome: 'success' | 'partial' | 'retry' | 'skip';
  accuracy?: number;
  responseTimeMs?: number;
  hintsUsed?: number;
  attemptNumber?: number;
  calmMode?: boolean;
  occurredAt: string;
};

export type SkillState = {
  skillId: string;
  masteryLevel: number; // 0.0 to 1.0
  lastPracticedAt: string;
  practiceCount: number;
  consecutiveSuccesses: number;
};

export function scoreSkillPriority(skill: SkillState, calmMode: boolean): number {
  const now = Date.now();
  const lastPracticed = new Date(skill.lastPracticedAt).getTime();
  const daysSincePractice = (now - lastPracticed) / (1000 * 60 * 60 * 24);

  const overdueWeight = Math.min(daysSincePractice / 7, 1); // Caps at 1 after 7 days
  const weaknessWeight = 1 - skill.masteryLevel;
  const confidenceTrendWeight = skill.consecutiveSuccesses > 2 ? 0 : 0.5;
  const calmModeFit = calmMode && skill.masteryLevel > 0.5 ? 1 : 0; // Prefer reviewing known skills in calm mode

  return overdueWeight * 0.35 +
         weaknessWeight * 0.30 +
         confidenceTrendWeight * 0.15 +
         0.10 + // variety weight base
         calmModeFit * 0.10;
}

export function getNextBestActivity(skills: SkillState[], calmMode: boolean) {
    if (!skills || skills.length === 0) return null;

    // Sort skills by priority
    const sorted = [...skills].sort((a, b) => scoreSkillPriority(b, calmMode) - scoreSkillPriority(a, calmMode));

    return {
        primary: sorted[0],
        backups: sorted.slice(1, 3)
    };
}

export function explainRecommendationForParent(skill: SkillState): string {
    if (skill.masteryLevel < 0.3) {
        return `Needs more practice.`;
    } else if (skill.masteryLevel < 0.8) {
        return `Making progress, keep going!`;
    } else {
        return `Mastered! Time for a quick review.`;
    }
}
