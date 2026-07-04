import React, { useState } from 'react';
import { render, act } from '@testing-library/react';
import { useActivityStore } from '../store/useActivityStore';
import { useShallow } from 'zustand/react/shallow';
import { describe, it, expect, vi, beforeEach } from 'vitest';

function OriginalHookTracker({ onRender }: { onRender: () => void }) {
  const recordPageVisit = useActivityStore((state) => state.recordPageVisit);
  const totalTimeSpent = useActivityStore((state) => state.totalTimeSpent);

  onRender();
  return <div>{totalTimeSpent}</div>;
}

function OptimizedHookTracker({ onRender }: { onRender: () => void }) {
  const { recordPageVisit, totalTimeSpent } = useActivityStore(
    useShallow((state) => ({
      recordPageVisit: state.recordPageVisit,
      totalTimeSpent: state.totalTimeSpent
    }))
  );

  onRender();
  return <div>{totalTimeSpent}</div>;
}

describe('Zustand useShallow Hooks Optimization Benchmark', () => {
  beforeEach(() => {
    useActivityStore.setState({
      sessions: [],
      dailyStats: {},
      favoritePages: [],
      currentSessionStart: null,
      totalTimeSpent: 0,
      pagesVisited: 0,
      activitiesCompleted: 0,
      lastActivityTime: 0
    });
  });

  it('⚡ Bolt: Validates rendering behavior when unrelated state changes', () => {
    let originalRenderCount = 0;
    render(<OriginalHookTracker onRender={() => originalRenderCount++} />);

    // Initial render
    expect(originalRenderCount).toBe(1);

    // Unrelated state change
    act(() => {
      useActivityStore.setState({ pagesVisited: 1 });
    });

    // Primitive selectors correctly ignore unrelated changes (Zustand built-in optimization)
    // The main benefit of useShallow in these hooks is reducing store subscriptions
    // from N (e.g. 5) down to 1 per component/hook usage.
    expect(originalRenderCount).toBe(1);
  });

  it('⚡ Bolt: Verifies optimized approach is functionally equivalent', () => {
    let optimizedRenderCount = 0;
    render(<OptimizedHookTracker onRender={() => optimizedRenderCount++} />);

    // Initial render
    expect(optimizedRenderCount).toBe(1);

    // Unrelated state change
    act(() => {
      useActivityStore.setState({ pagesVisited: 1 });
    });

    expect(optimizedRenderCount).toBe(1);

    // Related state change
    act(() => {
      useActivityStore.setState({ totalTimeSpent: 10 });
    });

    // Should re-render when its specific data changes
    expect(optimizedRenderCount).toBe(2);
  });
});
