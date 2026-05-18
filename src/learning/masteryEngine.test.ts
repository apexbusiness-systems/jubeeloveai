import { describe, it, expect } from 'vitest';
import { scoreSkillPriority, getNextBestActivity, type SkillState } from './masteryEngine';

describe('masteryEngine', () => {
    it('scores overdue weak skill higher than mastered fresh skill', () => {
        const weakOverdue: SkillState = {
            skillId: 'math_1',
            masteryLevel: 0.1,
            lastPracticedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            practiceCount: 5,
            consecutiveSuccesses: 0
        };
        const freshMastered: SkillState = {
            skillId: 'math_2',
            masteryLevel: 0.9,
            lastPracticedAt: new Date().toISOString(),
            practiceCount: 20,
            consecutiveSuccesses: 5
        };

        const weakScore = scoreSkillPriority(weakOverdue, false);
        const strongScore = scoreSkillPriority(freshMastered, false);
        expect(weakScore).toBeGreaterThan(strongScore);
    });

    it('calm mode increases priority of known skills', () => {
        const knownSkill: SkillState = {
            skillId: 'colors_1',
            masteryLevel: 0.8,
            lastPracticedAt: new Date().toISOString(),
            practiceCount: 10,
            consecutiveSuccesses: 3
        };
        const scoreNormal = scoreSkillPriority(knownSkill, false);
        const scoreCalm = scoreSkillPriority(knownSkill, true);
        expect(scoreCalm).toBeGreaterThan(scoreNormal);
    });

    it('deterministic recommendations', () => {
        const skills: SkillState[] = [
            { skillId: 'a', masteryLevel: 0.1, lastPracticedAt: '2023-01-01', practiceCount: 1, consecutiveSuccesses: 0 },
            { skillId: 'b', masteryLevel: 0.9, lastPracticedAt: '2023-01-01', practiceCount: 1, consecutiveSuccesses: 5 }
        ];
        const rec1 = getNextBestActivity(skills, false);
        const rec2 = getNextBestActivity(skills, false);
        expect(rec1?.primary.skillId).toBe(rec2?.primary.skillId);
    });
});
