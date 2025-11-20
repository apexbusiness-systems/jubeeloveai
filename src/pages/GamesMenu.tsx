import { useNavigate } from 'react-router-dom';
import { useJubeeStore } from '@/store/useJubeeStore';

export default function GamesMenu() {
  const navigate = useNavigate();
  const { triggerAnimation } = useJubeeStore();

  return (
    <div className="games-menu p-8">
      <h1 className="text-5xl font-bold text-center mb-8 text-game">
        🎮 Choose a Game! 🎮
      </h1>
      <p className="text-2xl text-center mb-12 text-game-neutral">
        Play and learn with Jubee!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <button
          onClick={() => {
            triggerAnimation('excited');
            navigate('/games/memory');
          }}
          className="game-option p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 border-4 border-game-accent"
          style={{
            background: 'var(--gradient-warm)',
            boxShadow: 'var(--shadow-game)'
          }}
        >
          <div className="text-7xl mb-4">🧠</div>
          <h2 className="text-2xl font-bold text-primary-foreground mb-2">Memory Match</h2>
          <p className="text-lg text-primary-foreground opacity-90">Find matching pairs!</p>
        </button>

        <button
          onClick={() => {
            triggerAnimation('excited');
            navigate('/games/pattern');
          }}
          className="game-option p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 border-4 border-game-accent"
          style={{
            background: 'var(--gradient-cool)',
            boxShadow: 'var(--shadow-accent)'
          }}
        >
          <div className="text-7xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold text-primary-foreground mb-2">Pattern Game</h2>
          <p className="text-lg text-primary-foreground opacity-90">Repeat the pattern!</p>
        </button>

        <button
          onClick={() => {
            triggerAnimation('excited');
            navigate('/games/numbers');
          }}
          className="game-option p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 border-4 border-game-accent"
          style={{
            background: 'var(--gradient-game)',
            boxShadow: 'var(--shadow-game)'
          }}
        >
          <div className="text-7xl mb-4">🔢</div>
          <h2 className="text-2xl font-bold text-primary-foreground mb-2">Number Adventure</h2>
          <p className="text-lg text-primary-foreground opacity-90">Learn counting & math!</p>
        </button>

        <button
          onClick={() => {
            triggerAnimation('excited');
            navigate('/games/alphabet');
          }}
          className="game-option p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 border-4 border-game-accent"
          style={{
            background: 'var(--gradient-warm)',
            boxShadow: 'var(--shadow-game)'
          }}
        >
          <div className="text-7xl mb-4">🔤</div>
          <h2 className="text-2xl font-bold text-primary-foreground mb-2">Alphabet Adventure</h2>
          <p className="text-lg text-primary-foreground opacity-90">Master your ABCs!</p>
        </button>

        <button
          onClick={() => {
            triggerAnimation('excited');
            navigate('/games/colors');
          }}
          className="game-option p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 border-4 border-game-accent"
          style={{
            background: 'var(--gradient-cool)',
            boxShadow: 'var(--shadow-accent)'
          }}
        >
          <div className="text-7xl mb-4">🌈</div>
          <h2 className="text-2xl font-bold text-primary-foreground mb-2">Color Splash</h2>
          <p className="text-lg text-primary-foreground opacity-90">Match beautiful colors!</p>
        </button>

        <button
          onClick={() => {
            triggerAnimation('excited');
            navigate('/games/puzzle');
          }}
          className="game-option p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 border-4 border-game-accent"
          style={{
            background: 'var(--gradient-game)',
            boxShadow: 'var(--shadow-game)'
          }}
        >
          <div className="text-7xl mb-4">🧩</div>
          <h2 className="text-2xl font-bold text-primary-foreground mb-2">Puzzle Master</h2>
          <p className="text-lg text-primary-foreground opacity-90">Solve picture puzzles!</p>
        </button>
      </div>

      <div className="text-center mt-12">
        <button
          onClick={() => navigate('/')}
          className="px-8 py-4 text-2xl font-bold rounded-full transform hover:scale-105 transition-all border-3 border-border text-game-neutral"
          style={{
            background: 'var(--gradient-neutral)',
            boxShadow: '0 4px 10px hsl(var(--muted) / 0.3)'
          }}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
