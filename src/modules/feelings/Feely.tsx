/**
 * Feely — animated SVG character that morphs between 8 emotions.
 * Pure SVG + Framer Motion springs. No external assets.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { memo } from 'react';
import type { EmotionKey } from '@/modules/feelings/scenes';

interface FeelyProps {
  emotion: EmotionKey;
  size?: number;
}

// Mouth path per emotion (drawn inside 200x200 viewBox, centered ~y=130)
const MOUTHS: Record<EmotionKey, string> = {
  happy:     'M 70 125 Q 100 160 130 125',
  sad:       'M 70 140 Q 100 110 130 140',
  angry:     'M 70 138 Q 100 120 130 138',
  scared:    'M 85 130 Q 100 150 115 130 Q 100 145 85 130 Z',
  surprised: 'M 100 135 m -14 0 a 14 14 0 1 0 28 0 a 14 14 0 1 0 -28 0',
  excited:   'M 65 122 Q 100 170 135 122 Q 100 150 65 122 Z',
  tired:     'M 75 135 Q 100 130 125 135',
  proud:     'M 75 128 Q 100 145 125 128',
};

// Eye config: ry = vertical scale; "look" = small offset for emotion personality
const EYES: Record<EmotionKey, { ry: number; offsetY: number }> = {
  happy:     { ry: 12, offsetY: 0 },
  sad:       { ry: 10, offsetY: 4 },
  angry:     { ry: 8,  offsetY: 0 },
  scared:    { ry: 16, offsetY: -2 },
  surprised: { ry: 18, offsetY: -2 },
  excited:   { ry: 14, offsetY: -2 },
  tired:     { ry: 3,  offsetY: 2 },
  proud:     { ry: 6,  offsetY: 0 },
};

// Eyebrows: angle in degrees, lifted/lowered
const BROWS: Record<EmotionKey, { angle: number; y: number; show: boolean }> = {
  happy:     { angle: 0,   y: 70, show: false },
  sad:       { angle: 20,  y: 72, show: true },
  angry:     { angle: -25, y: 70, show: true },
  scared:    { angle: 10,  y: 64, show: true },
  surprised: { angle: 0,   y: 62, show: true },
  excited:   { angle: -8,  y: 64, show: true },
  tired:     { angle: 8,   y: 74, show: true },
  proud:     { angle: -6,  y: 70, show: true },
};

const SPRING = { type: 'spring' as const, stiffness: 220, damping: 18 };

export const Feely = memo(function Feely({ emotion, size = 220 }: FeelyProps) {
  const reduce = useReducedMotion();
  const eye = EYES[emotion];
  const brow = BROWS[emotion];

  return (
    <motion.svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label={`Feely the blob feeling ${emotion}`}
      animate={reduce ? {} : { y: [0, -6, 0] }}
      transition={reduce ? {} : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Body — rubbery blob */}
      <motion.ellipse
        cx="100" cy="110"
        animate={{
          rx: emotion === 'surprised' ? 78 : emotion === 'tired' ? 86 : 82,
          ry: emotion === 'tired' ? 70 : emotion === 'surprised' ? 86 : 80,
        }}
        transition={SPRING}
        fill="hsl(var(--accent))"
        stroke="hsl(var(--primary))"
        strokeWidth="4"
      />

      {/* Cheeks (only for warm emotions) */}
      {(emotion === 'happy' || emotion === 'excited' || emotion === 'proud') && (
        <>
          <circle cx="60"  cy="125" r="8" fill="hsl(var(--jubee-cheek))" opacity="0.7" />
          <circle cx="140" cy="125" r="8" fill="hsl(var(--jubee-cheek))" opacity="0.7" />
        </>
      )}

      {/* Eyebrows */}
      {brow.show && (
        <>
          <motion.line
            x1="60" y1={brow.y} x2="84" y2={brow.y}
            stroke="hsl(var(--jubee-stripe))" strokeWidth="5" strokeLinecap="round"
            animate={{ rotate: brow.angle }}
            transition={SPRING}
            style={{ originX: '72px', originY: `${brow.y}px` }}
          />
          <motion.line
            x1="116" y1={brow.y} x2="140" y2={brow.y}
            stroke="hsl(var(--jubee-stripe))" strokeWidth="5" strokeLinecap="round"
            animate={{ rotate: -brow.angle }}
            transition={SPRING}
            style={{ originX: '128px', originY: `${brow.y}px` }}
          />
        </>
      )}

      {/* Eyes */}
      <motion.ellipse
        cx="72" cy={92 + eye.offsetY}
        rx="9"
        animate={{ ry: eye.ry }}
        transition={SPRING}
        fill="hsl(var(--jubee-stripe))"
      />
      <motion.ellipse
        cx="128" cy={92 + eye.offsetY}
        rx="9"
        animate={{ ry: eye.ry }}
        transition={SPRING}
        fill="hsl(var(--jubee-stripe))"
      />

      {/* Tear for sad */}
      {emotion === 'sad' && (
        <motion.path
          d="M 72 108 q 0 14 6 14 q 6 0 6 -14"
          fill="hsl(210 90% 65%)"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        />
      )}

      {/* Mouth */}
      <motion.path
        animate={{ d: MOUTHS[emotion] }}
        transition={SPRING}
        fill={emotion === 'surprised' || emotion === 'scared' || emotion === 'excited' ? 'hsl(var(--jubee-stripe))' : 'none'}
        stroke="hsl(var(--jubee-stripe))"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* "Z" for tired */}
      {emotion === 'tired' && (
        <motion.text
          x="155" y="60" fontSize="28" fontWeight="bold"
          fill="hsl(var(--jubee-stripe))"
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], y: [0, -12, -24] }}
          transition={{ duration: 2, repeat: Infinity }}
        >z</motion.text>
      )}
    </motion.svg>
  );
});
