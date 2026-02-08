import { render, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach, type MockInstance } from 'vitest';
import App from '../App';
import { useJubeeStore } from '../store/useJubeeStore';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

vi.mock('../components/auth/DevAuthOverride', () => ({
  DevAuthOverride: () => null,
}));

vi.mock('../hooks/useSystemHealthMonitor', () => ({
  useSystemHealthMonitor: () => undefined,
}));

// Mock the heavy components and those requiring browser APIs not present in jsdom
vi.mock('../components/JubeeCanvas3DDirect', () => ({
  default: () => <div data-testid="jubee-canvas-mock">Jubee Canvas</div>
}));

// Mock other components that might cause noise or errors in full render
vi.mock('../components/SessionMonitor', () => ({ SessionMonitor: () => null }));
vi.mock('../components/VoiceCommandButton', () => ({ VoiceCommandButton: () => null }));
vi.mock('../components/OfflineIndicator', () => ({ OfflineIndicator: () => null }));

describe('App Resize Listener Performance', () => {
  let addEventListenerSpy: MockInstance;
  let removeEventListenerSpy: MockInstance;
  let warnSpy: MockInstance;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    // Reset store state
    act(() => {
      useJubeeStore.setState({
        containerPosition: { bottom: 20, right: 20 }
      });
    });

    // Spy on window event listeners
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('checks resize listener attachment count when store updates', async () => {
    await act(async () => {
      render(<App />);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Initial render should attach resize listener
    // We filter for 'resize' event because other components might attach other listeners
    const initialResizeListeners = addEventListenerSpy.mock.calls.filter((call: unknown[]) => call[0] === 'resize').length;
    expect(initialResizeListeners).toBeGreaterThan(0);

    // Capture the count
    const baselineCount = initialResizeListeners;
    console.log(`Baseline resize listeners attached: ${baselineCount}`);

    // Update the container position in the store
    // This triggers the useEffect in the original code because [containerPosition] is in dependencies
    act(() => {
      useJubeeStore.getState().setContainerPosition({ bottom: 100, right: 100 });
    });

    // Check if new listeners were attached
    const postUpdateResizeListeners = addEventListenerSpy.mock.calls.filter((call: unknown[]) => call[0] === 'resize').length;

    console.log(`Post-update resize listeners attached: ${postUpdateResizeListeners}`);

    // In the optimized version, no new listeners should be added
    expect(postUpdateResizeListeners).toBe(baselineCount);

    // We expect NO removals for 'resize' during this update
    const resizeRemovals = removeEventListenerSpy.mock.calls.filter((call: unknown[]) => call[0] === 'resize').length;
    console.log(`Resize listeners removed: ${resizeRemovals}`);
    expect(resizeRemovals).toBe(0);
  });
});
