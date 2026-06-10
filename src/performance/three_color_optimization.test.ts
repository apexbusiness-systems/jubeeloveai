import { describe, it, expect } from 'vitest';
import * as THREE from 'three';

describe('THREE.Color Allocation Optimization', () => {
  it('should be faster to reuse a THREE.Color instance than allocating a new one in a loop', () => {
    const iterations = 100000;
    const baseColor1 = new THREE.Color(0xffffff);
    const baseColor2 = new THREE.Color(0xffffff);

    // Approach 1: Allocate new in loop (Current)
    const startNew = performance.now();
    for (let i = 0; i < iterations; i++) {
      baseColor1.lerp(new THREE.Color(0xff0000), 0.1);
    }
    const durationNew = performance.now() - startNew;

    // Approach 2: Reuse instance (Proposed)
    const tempColor = new THREE.Color();
    const startReuse = performance.now();
    for (let i = 0; i < iterations; i++) {
      tempColor.setHex(0xff0000);
      baseColor2.lerp(tempColor, 0.1);
    }
    const durationReuse = performance.now() - startReuse;

    console.log(`new THREE.Color(): ${durationNew.toFixed(2)}ms`);
    console.log(`Reused THREE.Color: ${durationReuse.toFixed(2)}ms`);
    console.log(`Speedup: ${(durationNew / durationReuse).toFixed(2)}x`);

    expect(durationReuse).toBeLessThan(durationNew);
  });
});
