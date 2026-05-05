import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useParentalStore } from '../store/useParentalStore';
import { useRef } from 'react';

function UnoptimizedApp() {
  const renders = useRef(0);
  renders.current++;

  // App.tsx does this
  const children = useParentalStore(state => state.children);
  const activeChildId = useParentalStore(state => state.activeChildId);

  const hasChildren = children.length > 0;

  return <div data-testid="renders">{renders.current}</div>;
}

function OptimizedApp() {
  const renders = useRef(0);
  renders.current++;

  const hasChildren = useParentalStore(state => state.children.length > 0);
  const activeChildId = useParentalStore(state => state.activeChildId);

  return <div data-testid="renders">{renders.current}</div>;
}

describe('Zustand children.length optimization', () => {
  beforeEach(() => {
    useParentalStore.setState({
      children: [{ id: 'child-1', name: 'Test', age: 5, avatar: '', createdAt: 0, dailyTimeLimit: 0, sessionStartTime: 0, totalTimeToday: 0, allowedActivities: [], lastResetDate: null }],
      activeChildId: 'child-1',
    });
  });

  it('measures unoptimized behavior', () => {
    const { getByTestId, unmount } = render(<UnoptimizedApp />);
    expect(getByTestId('renders').textContent).toBe('1');

    act(() => {
      useParentalStore.setState(state => {
        state.children[0].totalTimeToday += 10;
        return state;
      });
    });

    expect(getByTestId('renders').textContent).toBe('2');
    unmount();
  });

  it('measures optimized behavior', () => {
    const { getByTestId, unmount } = render(<OptimizedApp />);
    expect(getByTestId('renders').textContent).toBe('1');

    act(() => {
      useParentalStore.setState(state => {
        state.children[0].totalTimeToday += 10;
        return state;
      });
    });

    expect(getByTestId('renders').textContent).toBe('1');
    unmount();
  });
});
