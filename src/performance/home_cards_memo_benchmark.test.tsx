import { render, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useRef, useState, memo } from 'react';

// Unoptimized GameCard
function UnoptimizedGameCard({ title, icon }: { title: string; icon: string }) {
  const renders = useRef(0);
  renders.current++;
  return <div data-testid={`unoptimized-card-${title}`}>{renders.current}</div>;
}

// Optimized GameCard
const OptimizedGameCard = memo(function OptimizedGameCard({ title, icon }: { title: string; icon: string }) {
  const renders = useRef(0);
  renders.current++;
  return <div data-testid={`optimized-card-${title}`}>{renders.current}</div>;
});

function HomeApp({ optimized }: { optimized: boolean }) {
  const [totalTime, setTotalTime] = useState(0);
  const renders = useRef(0);
  renders.current++;

  const Card = optimized ? OptimizedGameCard : UnoptimizedGameCard;

  return (
    <div>
      <div data-testid="home-renders">{renders.current}</div>
      <button data-testid="update-time" onClick={() => setTotalTime(t => t + 10)}>Update Time</button>
      <Card title="Write" icon="✏️" />
      <Card title="Read" icon="📖" />
      <Card title="Play" icon="🎮" />
    </div>
  );
}

describe('Home GameCard Memoization Benchmark', () => {
  it('unoptimized cards re-render with parent', () => {
    const { getByTestId, unmount } = render(<HomeApp optimized={false} />);

    expect(getByTestId('unoptimized-card-Write').textContent).toBe('1');

    act(() => {
      getByTestId('update-time').click();
    });

    expect(getByTestId('home-renders').textContent).toBe('2');
    expect(getByTestId('unoptimized-card-Write').textContent).toBe('2');
    unmount();
  });

  it('optimized cards do not re-render with parent', () => {
    const { getByTestId, unmount } = render(<HomeApp optimized={true} />);

    expect(getByTestId('optimized-card-Write').textContent).toBe('1');

    act(() => {
      getByTestId('update-time').click();
    });

    expect(getByTestId('home-renders').textContent).toBe('2');
    expect(getByTestId('optimized-card-Write').textContent).toBe('1');
    unmount();
  });
});
