import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { useParentalStore } from '@/store/useParentalStore';
import { RewardAnimation } from '@/components/rewards/RewardAnimation';

import { vi } from 'vitest';

// Mock secureStorage to avoid localstorage not defined error
vi.mock('@/lib/secureStorage', () => ({
  secureGetItem: vi.fn(),
  secureSetItem: vi.fn(),
  secureRemoveItem: vi.fn()
}));

describe('Calm Mode Behavior', () => {
  beforeEach(() => {
    useParentalStore.setState({ 
      settings: { 
        ...useParentalStore.getState().settings, 
        calmMode: false 
      } 
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders fewer confetti particles when calm mode is on', () => {
    // Regular mode
    const { container: containerRegular, unmount: unmountRegular } = render(<RewardAnimation show={true} message="Test" />);
    
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    const particlesRegular = containerRegular.querySelectorAll('.confetti-piece');
    expect(particlesRegular.length).toBe(50);
    unmountRegular();
    
    // Calm mode
    useParentalStore.setState({ 
      settings: { 
        ...useParentalStore.getState().settings, 
        calmMode: true 
      } 
    });
    
    const { container: containerCalm, unmount: unmountCalm } = render(<RewardAnimation show={true} message="Test" />);
    
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    const particlesCalm = containerCalm.querySelectorAll('.confetti-piece');
    expect(particlesCalm.length).toBe(10);
    unmountCalm();
  });
});
