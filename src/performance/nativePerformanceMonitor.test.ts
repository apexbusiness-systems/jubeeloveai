import { describe, it, expect, vi } from 'vitest';
import { initNativePerformanceMonitor } from './nativePerformanceMonitor';

describe('nativePerformanceMonitor', () => {
    it('initializes without crashing when PerformanceObserver is unavailable', () => {
        const originalPO = global.PerformanceObserver;
        delete (global as unknown as { PerformanceObserver?: typeof PerformanceObserver }).PerformanceObserver;
        expect(() => initNativePerformanceMonitor()).not.toThrow();
        global.PerformanceObserver = originalPO;
    });
});
