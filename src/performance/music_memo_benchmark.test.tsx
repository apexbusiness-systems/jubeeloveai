import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { memo, useCallback, useState, useRef } from 'react';
import { render, fireEvent, screen } from '@testing-library/react';

let renderCount = 0;

const Child = memo(({ item, onAction }: { item: number; onAction: (n: number) => void }) => {
  renderCount++;
  return <button onClick={() => onAction(item)}>Item {item}</button>;
});

const UnoptimizedParent = () => {
  const [active, setActive] = useState<number | null>(null);

  const handleAction = useCallback((n: number) => {
    if (active === n) {
      setActive(null);
    } else {
      setActive(n);
    }
  }, [active]);

  return (
    <div>
      {Array.from({ length: 50 }).map((_, i) => (
        <Child key={i} item={i} onAction={handleAction} />
      ))}
    </div>
  );
};

const OptimizedParent = () => {
  const [active, setActive] = useState<number | null>(null);
  const activeRef = useRef(active);

  React.useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const handleAction = useCallback((n: number) => {
    if (activeRef.current === n) {
      setActive(null);
    } else {
      setActive(n);
    }
  }, []);

  return (
    <div>
      {Array.from({ length: 50 }).map((_, i) => (
        <Child key={i} item={i} onAction={handleAction} />
      ))}
    </div>
  );
};

describe('Music Page useCallback Optimization', () => {
  beforeEach(() => {
    renderCount = 0;
  });

  it('unoptimized parent re-renders all children', () => {
    render(<UnoptimizedParent />);
    expect(renderCount).toBe(50); // Initial render

    renderCount = 0;
    fireEvent.click(screen.getByText('Item 1'));

    // In unoptimized, all 50 children re-render
    expect(renderCount).toBe(50);
  });

  it('optimized parent only re-renders changed children (none in this mock since props other than onAction dont change)', () => {
    render(<OptimizedParent />);
    expect(renderCount).toBe(50); // Initial render

    renderCount = 0;
    fireEvent.click(screen.getByText('Item 1'));

    // In optimized, no children re-render because onAction is stable
    // (If we passed isActive prop, only 2 would re-render)
    expect(renderCount).toBe(0);
  });
});
