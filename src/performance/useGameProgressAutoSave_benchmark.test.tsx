import { renderHook, act } from '@testing-library/react';
import { useGameProgressAutoSave } from '../hooks/useGameProgressAutoSave';
import { useGameStore } from '../store/useGameStore';
import { jubeeDB } from '../lib/indexedDB';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/indexedDB', () => ({
  jubeeDB: {
    put: vi.fn(),
  }
}));

describe('useGameProgressAutoSave Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGameStore.setState({
      score: 0,
      currentTheme: 'morning',
      completedActivities: [],
      stickers: []
    });
  });

  it('should not re-render unnecessarily on state updates not tracked by the hook', () => {
    let renderCount = 0;

    const { result } = renderHook(() => {
      renderCount++;
      return useGameProgressAutoSave();
    });

    const initialRenderCount = renderCount;

    // Add a custom property to the store that we can update
    act(() => {
      // Simulate an update to a property NOT used by the hook
      useGameStore.setState(state => ({
        ...state,
        onActivityComplete: () => {}
      }));
    });

    // The hook will re-render if it subcribes to the whole store (or without shallow)
    // Actually, when we select separate properties:
    // const score = useGameStore(state => state.score);
    // const currentTheme = useGameStore(state => state.currentTheme);
    // If they are separate calls, it creates multiple subscriptions. But does it re-render?
    // Let's check.

    expect(renderCount).toBe(initialRenderCount);
  });
});
