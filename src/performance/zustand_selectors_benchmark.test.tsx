import React, { useRef, useEffect } from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useParentalStore } from '../store/useParentalStore';

// We create two mock components that consume the store.
// One uses full object destructuring (unoptimized), the other uses selectors (optimized).

function UnoptimizedComponent() {
  const renders = useRef(0);
  renders.current++;

  // Subscribes to the ENTIRE store state
  const { activeChildId } = useParentalStore();

  return <div data-testid="unoptimized-renders">{renders.current}</div>;
}

function OptimizedComponent() {
  const renders = useRef(0);
  renders.current++;

  // Subscribes ONLY to activeChildId
  const activeChildId = useParentalStore(state => state.activeChildId);

  return <div data-testid="optimized-renders">{renders.current}</div>;
}

describe('Zustand Selectors Performance Benchmark', () => {
  beforeEach(() => {
    // Mock localStorage
    const store = {};
    global.localStorage = {
      getItem: vi.fn(key => store[key] || null),
      setItem: vi.fn((key, value) => { store[key] = value.toString() }),
      removeItem: vi.fn(key => { delete store[key] }),
      clear: vi.fn(() => { for (const key in store) delete store[key] }),
    };
  });

  beforeEach(() => {
    // Reset store state
    useParentalStore.setState({
      children: [],
      activeChildId: null,
      isParentMode: false,
    });
  });

  it('demonstrates that selectors prevent unnecessary renders', () => {
    const { getByTestId } = render(
      <>
        <UnoptimizedComponent />
        <OptimizedComponent />
      </>
    );

    // Initial render count should be 1 for both
    expect(getByTestId('unoptimized-renders').textContent).toBe('1');
    expect(getByTestId('optimized-renders').textContent).toBe('1');

    // Act: Update an unrelated piece of state (e.g., isParentMode)
    act(() => {
      useParentalStore.setState({ isParentMode: true });
    });

    // Unoptimized component re-renders because the store state changed (even though activeChildId didn't)
    expect(getByTestId('unoptimized-renders').textContent).toBe('2');

    // Optimized component does NOT re-render because it only listens to activeChildId, which remained null
    expect(getByTestId('optimized-renders').textContent).toBe('1');

    // Act: Update the related state
    act(() => {
      useParentalStore.setState({ activeChildId: 'test-id' });
    });

    // Both update when the specific state they care about changes
    expect(getByTestId('unoptimized-renders').textContent).toBe('3');
    expect(getByTestId('optimized-renders').textContent).toBe('2');
  });
});
