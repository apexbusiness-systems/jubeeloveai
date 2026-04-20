import { useRef } from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useParentalStore } from '../store/useParentalStore';

// We create two mock components that consume the store.
// One uses full object destructuring (unoptimized), the other uses selectors (optimized).

function UnoptimizedComponent() {
  const renders = useRef(0);
  renders.current++;

  // Subscribes to the ENTIRE store state
  useParentalStore();

  return <div data-testid="unoptimized-renders">{renders.current}</div>;
}

function OptimizedComponent() {
  const renders = useRef(0);
  renders.current++;

  // Subscribes ONLY to activeChildId
  useParentalStore((state) => state.activeChildId);

  return <div data-testid="optimized-renders">{renders.current}</div>;
}

describe('Zustand Selectors Performance Benchmark', () => {
  beforeEach(() => {
    // Mock localStorage with full Storage interface
    const store: Record<string, string> = {};
    const mockStorage: Storage = {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = String(value);
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        for (const key in store) delete store[key];
      }),
      key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
      get length() {
        return Object.keys(store).length;
      },
    };
    global.localStorage = mockStorage;
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

    expect(getByTestId('unoptimized-renders').textContent).toBe('1');
    expect(getByTestId('optimized-renders').textContent).toBe('1');

    act(() => {
      useParentalStore.setState({ isParentMode: true });
    });

    expect(getByTestId('unoptimized-renders').textContent).toBe('2');
    expect(getByTestId('optimized-renders').textContent).toBe('1');

    act(() => {
      useParentalStore.setState({ activeChildId: 'test-id' });
    });

    expect(getByTestId('unoptimized-renders').textContent).toBe('3');
    expect(getByTestId('optimized-renders').textContent).toBe('2');
  });
});
