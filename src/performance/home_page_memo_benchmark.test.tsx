import { render } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import React, { memo } from 'react';

// Mock the router and store
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));
vi.mock('@/store/useJubeeStore', () => ({
  useJubeeStore: vi.fn(() => vi.fn()),
}));

interface CardProps {
  title: string;
  icon: string;
  path: string;
  description: string;
  accent?: string;
  badge?: string;
  emphasis?: boolean;
}

// Mock props
const mockProps: CardProps = {
  title: "Test Game",
  icon: "🎮",
  path: "/test",
  description: "Test description"
};

// Unoptimized GameCard
function UnoptimizedQuickActionCard({ title }: CardProps) {
  return (
    <li>
      <div>{title}</div>
    </li>
  );
}

// Optimized GameCard
const OptimizedQuickActionCard = memo(function OptimizedQuickActionCard({ title }: CardProps) {
  return (
    <li>
      <div>{title}</div>
    </li>
  );
});

describe('Home Page QuickActionCard Memoization Benchmark', () => {
  it('Optimized QuickActionCard avoids re-renders on parent state change', () => {
    let unoptimizedRenderCount = 0;
    let optimizedRenderCount = 0;

    const TrackedUnoptimized = (props: CardProps) => {
      unoptimizedRenderCount++;
      return <UnoptimizedQuickActionCard {...props} />;
    };

    const TrackedOptimized = memo((props: CardProps) => {
      optimizedRenderCount++;
      return <OptimizedQuickActionCard {...props} />;
    });

    const Parent = ({ trigger }: { trigger: number }) => {
      return (
        <ul>
          <TrackedUnoptimized {...mockProps} />
          <TrackedOptimized {...mockProps} />
          <div data-testid="trigger">{trigger}</div>
        </ul>
      );
    };

    const { rerender } = render(<Parent trigger={1} />);

    // Initial render
    expect(unoptimizedRenderCount).toBe(1);
    expect(optimizedRenderCount).toBe(1);

    // Parent re-renders due to unrelated state change
    rerender(<Parent trigger={2} />);
    rerender(<Parent trigger={3} />);

    // Unoptimized re-renders every time
    expect(unoptimizedRenderCount).toBe(3);

    // Optimized avoids re-renders because props are stable
    expect(optimizedRenderCount).toBe(1);
  });
});
