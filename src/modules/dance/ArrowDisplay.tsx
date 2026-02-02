/**
 * Arrow Display Component
 * 
 * Shows directional arrows for the dance game.
 * Visual feedback for upcoming moves and hit results.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import type { Direction } from './types';

interface ArrowDisplayProps {
  direction: Direction;
  isActive: boolean;
  result?: 'perfect' | 'good' | 'miss' | null;
  size?: 'sm' | 'md' | 'lg';
}

const arrowIcons: Record<Direction, typeof ArrowUp> = {
  up: ArrowUp,
  down: ArrowDown,
  left: ArrowLeft,
  right: ArrowRight,
};

const arrowColors: Record<Direction, string> = {
  up: 'bg-green-500',
  down: 'bg-blue-500',
  left: 'bg-purple-500',
  right: 'bg-orange-500',
};

const resultColors = {
  perfect: 'ring-4 ring-yellow-400 bg-yellow-500',
  good: 'ring-4 ring-green-400 bg-green-500',
  miss: 'ring-4 ring-red-400 bg-red-500',
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

function ArrowDisplayComponent({ 
  direction, 
  isActive, 
  result,
  size = 'md' 
}: ArrowDisplayProps) {
  const Icon = arrowIcons[direction];
  const baseColor = arrowColors[direction];
  const resultColor = result ? resultColors[result] : '';

  return (
    <motion.div
      className={`
        ${sizes[size]}
        rounded-xl
        flex items-center justify-center
        ${result ? resultColor : baseColor}
        ${isActive ? 'scale-110' : 'opacity-60'}
        transition-all duration-150
        shadow-lg
      `}
      animate={isActive ? {
        scale: [1, 1.2, 1],
        rotate: direction === 'left' ? [-5, 0] : direction === 'right' ? [5, 0] : 0,
      } : {}}
      transition={{ duration: 0.15 }}
    >
      <Icon className={`${iconSizes[size]} text-white drop-shadow-md`} />
    </motion.div>
  );
}

export const ArrowDisplay = memo(ArrowDisplayComponent);

// Incoming arrow lane component
interface ArrowLaneProps {
  upcomingMoves: Array<{ direction: Direction; timeLeft: number }>;
  targetTime: number; // Time window where moves should be hit
}

function ArrowLaneComponent({ upcomingMoves, targetTime }: ArrowLaneProps) {
  return (
    <div className="relative w-full h-32 bg-black/20 rounded-2xl overflow-hidden">
      {/* Target zone */}
      <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0 w-24 h-24 border-4 border-dashed border-yellow-400 rounded-xl opacity-50" />
      
      <AnimatePresence>
        {upcomingMoves.slice(0, 4).map((move, index) => {
          const progress = 1 - (move.timeLeft / targetTime);
          const yPosition = progress * 80; // 0-80% from top
          
          return (
            <motion.div
              key={`${move.direction}-${index}`}
              className="absolute left-1/2 transform -translate-x-1/2"
              style={{ top: `${yPosition}%` }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
            >
              <ArrowDisplay 
                direction={move.direction} 
                isActive={index === 0 && progress > 0.7}
                size="md"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export const ArrowLane = memo(ArrowLaneComponent);

// Input buttons for touch/mouse control
interface ArrowButtonsProps {
  onInput: (direction: Direction) => void;
  disabled?: boolean;
}

function ArrowButtonsComponent({ onInput, disabled }: ArrowButtonsProps) {
  const handleClick = (direction: Direction) => {
    if (!disabled) {
      onInput(direction);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2 w-fit mx-auto">
      {/* Top row - Up arrow */}
      <div className="col-start-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => handleClick('up')}
          disabled={disabled}
          className={`
            w-16 h-16 sm:w-20 sm:h-20
            rounded-xl
            ${arrowColors.up}
            flex items-center justify-center
            shadow-lg
            active:brightness-110
            disabled:opacity-50
            touch-manipulation
          `}
          aria-label="Move up"
        >
          <ArrowUp className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </motion.button>
      </div>
      
      {/* Middle row - Left, Down, Right */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => handleClick('left')}
        disabled={disabled}
        className={`
          w-16 h-16 sm:w-20 sm:h-20
          rounded-xl
          ${arrowColors.left}
          flex items-center justify-center
          shadow-lg
          active:brightness-110
          disabled:opacity-50
          touch-manipulation
        `}
        aria-label="Move left"
      >
        <ArrowLeft className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
      </motion.button>
      
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => handleClick('down')}
        disabled={disabled}
        className={`
          w-16 h-16 sm:w-20 sm:h-20
          rounded-xl
          ${arrowColors.down}
          flex items-center justify-center
          shadow-lg
          active:brightness-110
          disabled:opacity-50
          touch-manipulation
        `}
        aria-label="Move down"
      >
        <ArrowDown className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
      </motion.button>
      
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => handleClick('right')}
        disabled={disabled}
        className={`
          w-16 h-16 sm:w-20 sm:h-20
          rounded-xl
          ${arrowColors.right}
          flex items-center justify-center
          shadow-lg
          active:brightness-110
          disabled:opacity-50
          touch-manipulation
        `}
        aria-label="Move right"
      >
        <ArrowRight className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
      </motion.button>
    </div>
  );
}

export const ArrowButtons = memo(ArrowButtonsComponent);
