/**
 * ComboCounter - Animated streak display for JubeeDance
 *
 * Shows the current combo with escalating visual intensity.
 * Milestone hits (5, 10, 15, 20, 25, 30, 50) trigger burst animations.
 */

import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Zap, Star, Trophy } from 'lucide-react';
import type { Options as ConfettiOptions } from 'canvas-confetti';

const LEGENDARY_MILESTONES = [30, 50];

const MILESTONES = [5, 10, 15, 20, 25, 30, 50];

function getMilestoneLabel(combo: number): string | null {
  if (combo >= 50) return '🔥 LEGENDARY!';
  if (combo >= 30) return '⚡ UNSTOPPABLE!';
  if (combo >= 20) return '🌟 ON FIRE!';
  if (combo >= 15) return '💫 AMAZING!';
  if (combo >= 10) return '✨ GREAT STREAK!';
  if (combo >= 5) return '🎯 NICE COMBO!';
  return null;
}

function getComboTier(combo: number) {
  if (combo >= 30) return 'legendary';
  if (combo >= 15) return 'fire';
  if (combo >= 5) return 'warm';
  return 'normal';
}

const tierStyles = {
  normal: {
    bg: 'hsl(var(--muted))',
    text: 'hsl(var(--foreground))',
    border: 'hsl(var(--border))',
    glow: 'none',
  },
  warm: {
    bg: 'hsl(var(--dance-hit-good) / 0.15)',
    text: 'hsl(var(--dance-hit-good))',
    border: 'hsl(var(--dance-hit-good) / 0.4)',
    glow: '0 0 12px hsl(var(--dance-hit-good) / 0.3)',
  },
  fire: {
    bg: 'hsl(var(--dance-hit-perfect) / 0.15)',
    text: 'hsl(var(--dance-hit-perfect))',
    border: 'hsl(var(--dance-hit-perfect) / 0.5)',
    glow: '0 0 20px hsl(var(--dance-hit-perfect) / 0.4)',
  },
  legendary: {
    bg: 'linear-gradient(135deg, hsl(var(--dance-hit-perfect) / 0.2), hsl(var(--primary) / 0.2))',
    text: 'hsl(var(--primary))',
    border: 'hsl(var(--primary) / 0.6)',
    glow: '0 0 28px hsl(var(--primary) / 0.5), 0 0 56px hsl(var(--dance-hit-perfect) / 0.2)',
  },
} as const;

const easeSpring: [number, number, number, number] = [0.34, 1.56, 0.64, 1];
const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface ComboCounterProps {
  combo: number;
  reducedMotion: boolean;
  onScreenShake?: () => void;
}

function ComboCounterComponent({ combo, reducedMotion, onScreenShake }: ComboCounterProps) {
  const [milestone, setMilestone] = useState<number | null>(null);
  const [pulse, setPulse] = useState(false);
  const prevComboRef = useRef(0);
  const tier = getComboTier(combo);
  const style = tierStyles[tier];

  const fireConfetti = useCallback(() => {
    if (reducedMotion) return;
    // Left burst
    confetti({
      particleCount: 80,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: ['#FFD700', '#FF6B35', '#FF1493', '#00E5FF', '#76FF03'],
      disableForReducedMotion: true,
    });
    // Right burst
    confetti({
      particleCount: 80,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: ['#FFD700', '#FF6B35', '#FF1493', '#00E5FF', '#76FF03'],
      disableForReducedMotion: true,
    });
  }, [reducedMotion]);

  useEffect(() => {
    // Detect combo increase
    if (combo > prevComboRef.current && combo > 0) {
      if (!reducedMotion) setPulse(true);

      if (MILESTONES.includes(combo)) {
        setMilestone(combo);
        const timer = setTimeout(() => setMilestone(null), 1800);

        // Legendary milestone: confetti + screen shake
        if (LEGENDARY_MILESTONES.includes(combo)) {
          fireConfetti();
          onScreenShake?.();
        }

        prevComboRef.current = combo;
        return () => clearTimeout(timer);
      }
    }
    prevComboRef.current = combo;
  }, [combo, reducedMotion, fireConfetti, onScreenShake]);

  useEffect(() => {
    if (!pulse) return;
    const t = setTimeout(() => setPulse(false), 200);
    return () => clearTimeout(t);
  }, [pulse]);

  const TierIcon = tier === 'legendary' ? Trophy
    : tier === 'fire' ? Flame
    : tier === 'warm' ? Zap
    : Star;

  return (
    <div className="relative flex flex-col items-center">
      {/* Main combo pill */}
      <motion.div
        className="relative flex items-center gap-2 rounded-2xl px-4 py-2 min-w-[120px] justify-center"
        style={{
          background: style.bg,
          border: `1.5px solid ${style.border}`,
          boxShadow: style.glow,
          color: style.text,
        }}
        animate={
          pulse && !reducedMotion
            ? { scale: 1.12, y: -3 }
            : { scale: 1, y: 0 }
        }
        transition={{ duration: 0.2, ease: easeSpring }}
      >
        {/* Tier icon */}
        <motion.div
          animate={
            tier !== 'normal' && !reducedMotion
              ? { rotate: [0, -8, 8, -4, 0] }
              : {}
          }
          transition={{ duration: 0.5, ease: 'easeOut' }}
          key={`icon-${combo}`}
        >
          <TierIcon className="w-5 h-5" />
        </motion.div>

        {/* Counter */}
        <div className="flex flex-col items-start leading-none">
          <span className="text-[10px] uppercase tracking-[0.15em] opacity-70 font-medium">
            Combo
          </span>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={combo}
              className="text-xl font-bold tabular-nums"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.7 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.7 }}
              transition={{ duration: 0.2, ease: easeOutExpo }}
            >
              {combo}x
            </motion.span>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Milestone burst */}
      <AnimatePresence>
        {milestone && (
          <motion.div
            className="absolute -top-10 left-1/2 whitespace-nowrap pointer-events-none z-10"
            initial={
              reducedMotion
                ? { opacity: 0, x: '-50%' }
                : { opacity: 0, y: 8, x: '-50%', scale: 0.6 }
            }
            animate={
              reducedMotion
                ? { opacity: 1, x: '-50%' }
                : { opacity: 1, y: 0, x: '-50%', scale: 1 }
            }
            exit={
              reducedMotion
                ? { opacity: 0, x: '-50%' }
                : { opacity: 0, y: -16, x: '-50%', scale: 0.8 }
            }
            transition={{ duration: 0.35, ease: easeSpring }}
          >
            <span
              className="inline-block rounded-full px-3 py-1 text-sm font-bold shadow-lg"
              style={{
                background: style.bg,
                color: style.text,
                border: `1.5px solid ${style.border}`,
                boxShadow: style.glow,
              }}
            >
              {getMilestoneLabel(milestone)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Particle ring on milestone (decorative) */}
      <AnimatePresence>
        {milestone && !reducedMotion && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 1.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              border: `2px solid ${style.text}`,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export const ComboCounter = memo(ComboCounterComponent);
