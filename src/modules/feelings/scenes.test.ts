import { describe, it, expect } from 'vitest';
import {
  SCENES,
  EMOTIONS,
  EMOTION_KEYS,
  buildEmotionChoices,
  pickNextScene,
} from './scenes';

describe('Feelings Explorer scene library', () => {
  it('every scene declares a known emotion and 2 distinct distractors', () => {
    for (const s of SCENES) {
      expect(EMOTIONS[s.emotion]).toBeTruthy();
      expect(s.distractors).toHaveLength(2);
      expect(s.distractors[0]).not.toBe(s.distractors[1]);
      expect(s.distractors).not.toContain(s.emotion);
      for (const d of s.distractors) expect(EMOTIONS[d]).toBeTruthy();
    }
  });

  it('every scene has 3 storyboard panels and 3 help options', () => {
    for (const s of SCENES) {
      expect(s.panels).toHaveLength(3);
      expect(s.help).toHaveLength(3);
      for (const h of s.help) expect(h.label.length).toBeGreaterThan(0);
    }
  });

  it('covers all 8 emotions at least once', () => {
    const covered = new Set(SCENES.map(s => s.emotion));
    for (const k of EMOTION_KEYS) expect(covered.has(k)).toBe(true);
  });

  it('buildEmotionChoices returns the correct emotion plus 2 distractors', () => {
    const scene = SCENES[0];
    const choices = buildEmotionChoices(scene);
    expect(choices).toHaveLength(3);
    expect(choices.map(c => c.key)).toContain(scene.emotion);
    expect(new Set(choices.map(c => c.key)).size).toBe(3);
  });

  it('pickNextScene prefers unplayed scenes, falls back to any when all played', () => {
    const all = SCENES.map(s => s.id);
    const next = pickNextScene(all.slice(0, all.length - 1));
    // last unplayed scene must be returned
    expect(next.id).toBe(all[all.length - 1]);
    // when everything is played, returns *some* scene (replay allowed)
    const replay = pickNextScene(all);
    expect(SCENES.some(s => s.id === replay.id)).toBe(true);
  });
});
