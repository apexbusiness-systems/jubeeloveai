/**
 * Arrow Display + StepZone Components
 *
 * Token-based arrow visuals, DDR-style StepZone highway,
 * and ThumbPad input controls for JubeeDance.
 */

import { memo, useEffect, useMemo, useRef } from 'react';
import type { Direction, DanceMove } from './types';

const arrowSurface: Record<Direction, string> = {
  up: 'bg-[hsl(var(--dance-arrow-up))]',
  down: 'bg-[hsl(var(--dance-arrow-down))]',
  left: 'bg-[hsl(var(--dance-arrow-left))]',
  right: 'bg-[hsl(var(--dance-arrow-right))]',
};

const resultSurface: Record<'perfect' | 'good' | 'miss', string> = {
  perfect: 'bg-[hsl(var(--dance-hit-perfect))] ring-2 ring-[hsl(var(--dance-hit-perfect))]',
  good: 'bg-[hsl(var(--dance-hit-good))] ring-2 ring-[hsl(var(--dance-hit-good))]',
  miss: 'bg-[hsl(var(--dance-hit-miss))] ring-2 ring-[hsl(var(--dance-hit-miss))]',
};

const sizes = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
};

const iconSizes = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
};

function getRotation(direction: Direction) {
  switch (direction) {
    case 'up':
      return 'rotate(0deg)';
    case 'right':
      return 'rotate(90deg)';
    case 'down':
      return 'rotate(180deg)';
    case 'left':
      return 'rotate(-90deg)';
    default:
      return 'rotate(0deg)';
  }
}

function ArrowGlyph({ direction, className }: { direction: Direction; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={{ transform: getRotation(direction) }}
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M12 4.25c.48 0 .95.19 1.29.54l5.96 5.96a1.65 1.65 0 0 1-2.33 2.33l-2.76-2.76V19a1.8 1.8 0 1 1-3.6 0v-8.68l-2.76 2.76a1.65 1.65 0 0 1-2.33-2.33l5.96-5.96c.34-.35.8-.54 1.29-.54Z"
      />
    </svg>
  );
}

interface ArrowDisplayProps {
  direction: Direction;
  isActive: boolean;
  result?: 'perfect' | 'good' | 'miss' | null;
  size?: 'sm' | 'md' | 'lg';
}

function ArrowDisplayComponent({
  direction,
  isActive,
  result,
  size = 'md',
}: ArrowDisplayProps) {
  const baseSurface = arrowSurface[direction];
  const resultClass = result ? resultSurface[result] : '';

  return (
    <div
      className={`
        ${sizes[size]}
        rounded-2xl
        flex items-center justify-center
        ${result ? resultClass : baseSurface}
        ${isActive ? 'scale-105' : 'opacity-70'}
        dance-arrow-tile
      `}
    >
      <ArrowGlyph direction={direction} className={`${iconSizes[size]} text-white`} />
    </div>
  );
}

export const ArrowDisplay = memo(ArrowDisplayComponent);

interface StepZoneProps {
  moves: DanceMove[];
  getSongTimeMs: () => number;
  isPlaying: boolean;
  lookaheadMs: number;
  reducedMotion?: boolean;
}

type NoteEntry = DanceMove & { id: number };

function StepZoneComponent({ moves, getSongTimeMs, isPlaying, lookaheadMs, reducedMotion }: StepZoneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const noteRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const noteEntries = useMemo<NoteEntry[]>(() => moves.map((move, id) => ({ ...move, id })), [moves]);
  const noteEntriesRef = useRef<NoteEntry[]>(noteEntries);
  const rafRef = useRef<number | null>(null);
  const travelPxRef = useRef(220);
  const configRef = useRef({ lookaheadMs, reducedMotion: !!reducedMotion });

  useEffect(() => {
    noteEntriesRef.current = noteEntries;
  }, [noteEntries]);

  useEffect(() => {
    configRef.current = { lookaheadMs, reducedMotion: !!reducedMotion };
  }, [lookaheadMs, reducedMotion]);

  useEffect(() => {
    const updateMetrics = () => {
      if (!containerRef.current) return;
      const height = containerRef.current.clientHeight;
      const receptorSize = 56;
      const margin = 18;
      travelPxRef.current = Math.max(140, height - receptorSize - margin);
    };
    updateMetrics();
    window.addEventListener('resize', updateMetrics);
    return () => window.removeEventListener('resize', updateMetrics);
  }, []);

  useEffect(() => {
    const animate = () => {
      if (!isPlaying) {
        rafRef.current = null;
        return;
      }

      const songTimeMs = getSongTimeMs();
      const { lookaheadMs: lookahead, reducedMotion: reduce } = configRef.current;
      const travel = travelPxRef.current * (reduce ? 0.7 : 1);
      const hideAfterMs = 340;

      for (const entry of noteEntriesRef.current) {
        const el = noteRefs.current[entry.id];
        if (!el) continue;

        const timeUntil = entry.time - songTimeMs;

        if (timeUntil < -hideAfterMs || timeUntil > lookahead) {
          el.style.opacity = '0';
          continue;
        }

        const progress = 1 - timeUntil / lookahead;
        const clamped = Math.min(1, Math.max(0, progress));
        const y = clamped * travel;
        const scale = reduce ? 1 : timeUntil < 120 ? 1.06 : 1;

        el.style.opacity = '1';
        el.style.transform = `translate3d(-50%, ${y}px, 0) scale(${scale})`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying && rafRef.current === null) {
      rafRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [getSongTimeMs, isPlaying]);

  const laneOrder: Direction[] = ['left', 'down', 'up', 'right'];
  const laneMoves = useMemo(() => {
    const map = new Map<Direction, NoteEntry[]>();
    laneOrder.forEach((dir) => map.set(dir, []));
    for (const entry of noteEntries) {
      map.get(entry.direction)?.push(entry);
    }
    return map;
  }, [noteEntries]);

  return (
    <div ref={containerRef} className="dance-stepzone">
      {laneOrder.map((dir) => (
        <div key={dir} className="dance-lane">
          <div className="dance-lane-track" />
          <div className="dance-receptor">
            <ArrowGlyph direction={dir} className="w-6 h-6 text-white/90" />
          </div>
          {laneMoves.get(dir)?.map((entry) => (
            <div
              key={entry.id}
              ref={(el) => {
                noteRefs.current[entry.id] = el;
              }}
              className={`dance-note ${arrowSurface[dir]}`}
              aria-hidden="true"
            >
              <ArrowGlyph direction={dir} className="w-5 h-5 text-white" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export const StepZone = memo(StepZoneComponent);

interface ArrowButtonsProps {
  onInput: (direction: Direction) => void;
  disabled?: boolean;
  reducedMotion?: boolean;
}

function ArrowButtonsComponent({ onInput, disabled, reducedMotion }: ArrowButtonsProps) {
  const handleClick = (direction: Direction) => {
    if (!disabled) {
      onInput(direction);
    }
  };

  const buttonStyle = {
    transition:
      'transform var(--duration-fast) var(--ease-out-expo), box-shadow var(--duration-normal) var(--ease-out-quart)',
  } as const;

  return (
    <div className="dance-thumbpad">
      <div className="dance-thumbpad-row">
        <button
          type="button"
          onClick={() => handleClick('up')}
          disabled={disabled}
          className={`dance-thumbpad-button ${arrowSurface.up}`}
          style={buttonStyle}
          aria-label="Move up"
          data-reduced={reducedMotion ? 'true' : 'false'}
        >
          <ArrowGlyph direction="up" className="w-8 h-8 text-white" />
        </button>
      </div>
      <div className="dance-thumbpad-row">
        <button
          type="button"
          onClick={() => handleClick('left')}
          disabled={disabled}
          className={`dance-thumbpad-button ${arrowSurface.left}`}
          style={buttonStyle}
          aria-label="Move left"
          data-reduced={reducedMotion ? 'true' : 'false'}
        >
          <ArrowGlyph direction="left" className="w-8 h-8 text-white" />
        </button>
        <button
          type="button"
          onClick={() => handleClick('down')}
          disabled={disabled}
          className={`dance-thumbpad-button ${arrowSurface.down}`}
          style={buttonStyle}
          aria-label="Move down"
          data-reduced={reducedMotion ? 'true' : 'false'}
        >
          <ArrowGlyph direction="down" className="w-8 h-8 text-white" />
        </button>
        <button
          type="button"
          onClick={() => handleClick('right')}
          disabled={disabled}
          className={`dance-thumbpad-button ${arrowSurface.right}`}
          style={buttonStyle}
          aria-label="Move right"
          data-reduced={reducedMotion ? 'true' : 'false'}
        >
          <ArrowGlyph direction="right" className="w-8 h-8 text-white" />
        </button>
      </div>
    </div>
  );
}

export const ArrowButtons = memo(ArrowButtonsComponent);
