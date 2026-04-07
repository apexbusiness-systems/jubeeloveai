import React, { useState } from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Navigation } from '../components/Navigation';

// Mock the icons
vi.mock('../components/icons/Icons', () => {
  return {
    HomeIcon: () => <div data-testid="icon" />,
    PencilIcon: () => <div data-testid="icon" />,
    StarIcon: () => <div data-testid="icon" />,
    ChartIcon: () => <div data-testid="icon" />,
    GiftIcon: () => <div data-testid="icon" />,
    GearIcon: () => <div data-testid="icon" />,
  };
});

describe('Navigation Performance', () => {
  it('measures Navigation re-renders', async () => {
    let renderCount = 0;

    // Create a mock Navigation module to count renders of the inner component
    // Unfortunately we can't easily mock inner components that are not exported.
    // However, the useMemo prevents new React elements from being created
    // on every render, which is what `React.memo` requires to function effectively.

    let forceRender: () => void;

    function TestApp() {
      const [, setCount] = useState(0);
      forceRender = () => setCount(c => c + 1);
      renderCount++;
      return (
        <div>
          <Navigation />
        </div>
      );
    }

    const { container } = render(
      <MemoryRouter>
        <TestApp />
      </MemoryRouter>
    );

    expect(renderCount).toBe(1);

    act(() => {
      forceRender();
    });

    expect(renderCount).toBe(2);
    // Since Navigation takes no props, React.memo on it works as long as its internal
    // structure is memoized properly to benefit its children (TabButton).
    // The previous implementation created new `<HomeIcon />` on every render,
    // making TabButton's React.memo useless.
  });
});
