import { useNavigate } from 'react-router-dom';
import { useJubeeStore } from '@/store/useJubeeStore';
import { SEO } from '@/components/SEO';
import { useReducedMotion } from 'framer-motion';

export default function GamesMenu() {
  const navigate = useNavigate();
  const { triggerAnimation } = useJubeeStore();
  const prefersReducedMotion = useReducedMotion();

  const handleGameClick = (path: string, _gameName: string) => {
    triggerAnimation('excited');
    navigate(path);
  };

  const handleKeyDown = (e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  };

  return (
    <>
      <SEO 
        title="Jubee Love - Games"
        description="Play educational games with Jubee! Memory match, pattern games, number adventures, and more."
      />
      <div 
        className="games-menu p-4 sm:p-6 md:p-8"
        role="main"
        aria-label="Games selection"
      >
        <header className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4 text-game">
            🎮 Choose a Game! 🎮
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-game-neutral">
            Play and learn with Jubee!
          </p>
        </header>

        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto"
          role="list"
          aria-label="Available games"
        >
          <button
            onClick={() => handleGameClick('/games/memory', 'Memory Match')}
            onKeyDown={(e) => handleKeyDown(e, () => handleGameClick('/games/memory', 'Memory Match'))}
            className={`game-option p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-3 sm:border-4 border-game-accent min-h-[160px] sm:min-h-[200px]
              focus:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2
              ${prefersReducedMotion ? '' : 'transform hover:scale-105 transition-all duration-300'}`}
            style={{
              background: 'var(--gradient-warm)',
              boxShadow: 'var(--shadow-game)'
            }}
            role="listitem"
            aria-label="Play Memory Match game - Find matching pairs"
          >
            <div className="text-5xl sm:text-6xl md:text-7xl mb-3 sm:mb-4" aria-hidden="true">🧠</div>
            <h2 className="text-xl sm:text-2xl font-bold text-primary-foreground mb-1 sm:mb-2">Memory Match</h2>
            <p className="text-sm sm:text-base md:text-lg text-primary-foreground opacity-90">Find matching pairs!</p>
          </button>

          <button
            onClick={() => handleGameClick('/games/pattern', 'Pattern Game')}
            onKeyDown={(e) => handleKeyDown(e, () => handleGameClick('/games/pattern', 'Pattern Game'))}
            className={`game-option p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-3 sm:border-4 border-game-accent min-h-[160px] sm:min-h-[200px]
              focus:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2
              ${prefersReducedMotion ? '' : 'transform hover:scale-105 transition-all duration-300'}`}
            style={{
              background: 'var(--gradient-cool)',
              boxShadow: 'var(--shadow-accent)'
            }}
            role="listitem"
            aria-label="Play Pattern Game - Repeat the pattern"
          >
            <div className="text-5xl sm:text-6xl md:text-7xl mb-3 sm:mb-4" aria-hidden="true">🎯</div>
            <h2 className="text-xl sm:text-2xl font-bold text-primary-foreground mb-1 sm:mb-2">Pattern Game</h2>
            <p className="text-sm sm:text-base md:text-lg text-primary-foreground opacity-90">Repeat the pattern!</p>
          </button>

          <button
            onClick={() => handleGameClick('/games/numbers', 'Number Adventure')}
            onKeyDown={(e) => handleKeyDown(e, () => handleGameClick('/games/numbers', 'Number Adventure'))}
            className={`game-option p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-3 sm:border-4 border-game-accent min-h-[160px] sm:min-h-[200px]
              focus:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2
              ${prefersReducedMotion ? '' : 'transform hover:scale-105 transition-all duration-300'}`}
            style={{
              background: 'var(--gradient-game)',
              boxShadow: 'var(--shadow-game)'
            }}
            role="listitem"
            aria-label="Play Number Adventure - Learn counting and math"
          >
            <div className="text-5xl sm:text-6xl md:text-7xl mb-3 sm:mb-4" aria-hidden="true">🔢</div>
            <h2 className="text-xl sm:text-2xl font-bold text-primary-foreground mb-1 sm:mb-2">Number Adventure</h2>
            <p className="text-sm sm:text-base md:text-lg text-primary-foreground opacity-90">Learn counting & math!</p>
          </button>

          <button
            onClick={() => handleGameClick('/games/alphabet', 'Alphabet Adventure')}
            onKeyDown={(e) => handleKeyDown(e, () => handleGameClick('/games/alphabet', 'Alphabet Adventure'))}
            className={`game-option p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-3 sm:border-4 border-game-accent min-h-[160px] sm:min-h-[200px]
              focus:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2
              ${prefersReducedMotion ? '' : 'transform hover:scale-105 transition-all duration-300'}`}
            style={{
              background: 'var(--gradient-warm)',
              boxShadow: 'var(--shadow-game)'
            }}
            role="listitem"
            aria-label="Play Alphabet Adventure - Master your ABCs"
          >
            <div className="text-5xl sm:text-6xl md:text-7xl mb-3 sm:mb-4" aria-hidden="true">🔤</div>
            <h2 className="text-xl sm:text-2xl font-bold text-primary-foreground mb-1 sm:mb-2">Alphabet Adventure</h2>
            <p className="text-sm sm:text-base md:text-lg text-primary-foreground opacity-90">Master your ABCs!</p>
          </button>

          <button
            onClick={() => handleGameClick('/games/colors', 'Color Splash')}
            onKeyDown={(e) => handleKeyDown(e, () => handleGameClick('/games/colors', 'Color Splash'))}
            className={`game-option p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-3 sm:border-4 border-game-accent min-h-[160px] sm:min-h-[200px]
              focus:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2
              ${prefersReducedMotion ? '' : 'transform hover:scale-105 transition-all duration-300'}`}
            style={{
              background: 'var(--gradient-cool)',
              boxShadow: 'var(--shadow-accent)'
            }}
            role="listitem"
            aria-label="Play Color Splash - Match beautiful colors"
          >
            <div className="text-5xl sm:text-6xl md:text-7xl mb-3 sm:mb-4" aria-hidden="true">🌈</div>
            <h2 className="text-xl sm:text-2xl font-bold text-primary-foreground mb-1 sm:mb-2">Color Splash</h2>
            <p className="text-sm sm:text-base md:text-lg text-primary-foreground opacity-90">Match beautiful colors!</p>
          </button>

          <button
            onClick={() => handleGameClick('/games/puzzle', 'Puzzle Master')}
            onKeyDown={(e) => handleKeyDown(e, () => handleGameClick('/games/puzzle', 'Puzzle Master'))}
            className={`game-option p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-3 sm:border-4 border-game-accent min-h-[160px] sm:min-h-[200px]
              focus:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2
              ${prefersReducedMotion ? '' : 'transform hover:scale-105 transition-all duration-300'}`}
            style={{
              background: 'var(--gradient-game)',
              boxShadow: 'var(--shadow-game)'
            }}
            role="listitem"
            aria-label="Play Puzzle Master - Solve picture puzzles"
          >
            <div className="text-5xl sm:text-6xl md:text-7xl mb-3 sm:mb-4" aria-hidden="true">🧩</div>
            <h2 className="text-xl sm:text-2xl font-bold text-primary-foreground mb-1 sm:mb-2">Puzzle Master</h2>
            <p className="text-sm sm:text-base md:text-lg text-primary-foreground opacity-90">Solve picture puzzles!</p>
          </button>
        </div>

        <nav className="text-center mt-8 sm:mt-12" aria-label="Navigation">
          <button
            onClick={() => navigate('/')}
            onKeyDown={(e) => handleKeyDown(e, () => navigate('/'))}
            className={`px-6 sm:px-8 py-3 sm:py-4 text-lg sm:text-xl md:text-2xl font-bold rounded-full border-3 border-border text-game-neutral
              min-h-[44px] min-w-[120px]
              focus:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2
              ${prefersReducedMotion ? '' : 'transform hover:scale-105 transition-all'}`}
            style={{
              background: 'var(--gradient-neutral)',
              boxShadow: '0 4px 10px hsl(var(--muted) / 0.3)'
            }}
            aria-label="Return to home page"
          >
            ← Back to Home
          </button>
        </nav>
      </div>
    </>
  );
}
