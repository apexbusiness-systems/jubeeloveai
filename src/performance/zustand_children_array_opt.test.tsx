import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useParentalStore } from '../store/useParentalStore';
import { useRef } from 'react';

// Example of the unoptimized way it's currently used in SessionMonitor.tsx, App.tsx, NavigationHeader.tsx, etc:
// const children = useParentalStore(state => state.children);

function UnoptimizedApp() {
  const renders = useRef(0);
  renders.current++;

  const children = useParentalStore(state => state.children);
  const activeChildId = useParentalStore(state => state.activeChildId);

  // Usually it just checks if there are any children or finds the active one
  const hasChildren = children.length > 0;
  const activeChild = children.find(c => c.id === activeChildId);

  return <div data-testid="renders">{renders.current} - {hasChildren ? 'Yes' : 'No'} - {activeChild?.name}</div>;
}

// Optimized approaches:
// 1. If you only need length: useParentalStore(state => state.children.length)
// 2. If you only need active child: useParentalStore(state => state.children.find(c => c.id === state.activeChildId))
// Using useShallow is an alternative if returning arrays/objects

import { useShallow } from 'zustand/react/shallow';

function OptimizedApp() {
  const renders = useRef(0);
  renders.current++;

  // Only grab the specific child we care about
  const activeChild = useParentalStore(
    state => state.children.find(c => c.id === state.activeChildId)
  );

  // Or if we just need length:
  const hasChildren = useParentalStore(state => state.children.length > 0);

  return <div data-testid="renders">{renders.current} - {hasChildren ? 'Yes' : 'No'} - {activeChild?.name}</div>;
}

describe('Zustand children array optimization', () => {
  beforeEach(() => {
    useParentalStore.setState({
      children: [{ id: 'child-1', name: 'Test', age: 5, avatar: '', createdAt: 0, dailyTimeLimit: 0, sessionStartTime: 0, totalTimeToday: 0, allowedActivities: [], lastResetDate: null }],
      activeChildId: 'child-1',
    });
  });

  it('measures unoptimized behavior', () => {
    const { getByTestId, unmount } = render(<UnoptimizedApp />);
    expect(getByTestId('renders').textContent).toBe('1 - Yes - Test');

    act(() => {
      // Something updates that changes the array reference but we don't care about the fields that changed
      // E.g. session time update
      useParentalStore.setState(state => {
        state.children[0].totalTimeToday += 10;
        return state;
      });
    });

    // Renders again because the array reference changed (due to immer), even though length and activeChild.name are same
    expect(getByTestId('renders').textContent).toBe('2 - Yes - Test');
    unmount();
  });

  it('measures optimized behavior', () => {
    const { getByTestId, unmount } = render(<OptimizedApp />);
    expect(getByTestId('renders').textContent).toBe('1 - Yes - Test');

    act(() => {
      useParentalStore.setState(state => {
        state.children[0].totalTimeToday += 10;
        return state;
      });
    });

    // The active child object reference still changes because of immer, so it renders
    // Unless we use custom equality function
    expect(getByTestId('renders').textContent).toBe('2 - Yes - Test');
    unmount();
  });
});
