import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useParentalStore } from '../store/useParentalStore';
import { useRef } from 'react';

function UnoptimizedApp() {
  const renders = useRef(0);
  renders.current++;

  const children = useParentalStore(state => state.children);
  const activeChildId = useParentalStore(state => state.activeChildId);

  return <div data-testid="renders">{renders.current} - {children.length} - {activeChildId}</div>;
}

function OptimizedApp() {
  const renders = useRef(0);
  renders.current++;

  const childrenLength = useParentalStore(state => state.children.length);
  const activeChildId = useParentalStore(state => state.activeChildId);

  return <div data-testid="renders">{renders.current} - {childrenLength} - {activeChildId}</div>;
}

describe('App Selector Benchmark', () => {
  beforeEach(() => {
    useParentalStore.setState({
      children: [{ id: 'child-1', name: 'Test', age: 5, avatar: '', createdAt: 0, dailyTimeLimit: 0, sessionStartTime: 0, totalTimeToday: 0, allowedActivities: [], lastResetDate: null }],
      activeChildId: 'child-1',
    });
  });

  it('measures unnecessary renders in unoptimized component', () => {
    const { getByTestId, unmount } = render(<UnoptimizedApp />);
    expect(getByTestId('renders').textContent).toBe('1 - 1 - child-1');

    act(() => {
      useParentalStore.setState(state => {
        state.children[0].totalTimeToday += 10;
        return state;
      });
    });

    expect(getByTestId('renders').textContent).toBe('2 - 1 - child-1');
    unmount();
  });

  it('prevents unnecessary renders in optimized component', () => {
    const { getByTestId, unmount } = render(<OptimizedApp />);
    expect(getByTestId('renders').textContent).toBe('1 - 1 - child-1');

    act(() => {
      useParentalStore.setState(state => {
        state.children[0].totalTimeToday += 10;
        return state;
      });
    });

    // Should still be 1!
    expect(getByTestId('renders').textContent).toBe('1 - 1 - child-1');
    unmount();
  });
});
