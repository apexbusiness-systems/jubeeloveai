## 2024-05-19 - Grouped Zustand Selectors with useShallow
**Learning:** Multiple individual store subscriptions in a single component can create unnecessary overhead. Grouping them into an object selector and wrapping with `useShallow` reduces the number of store subscriptions.
**Action:** Use `useShallow` when pulling multiple values from a single Zustand store to optimize component performance.

## 2024-05-19 - THREE.Color Allocation in Render Loops
**Learning:** Instantiating `new THREE.Color()` inside a high-frequency render loop (e.g., `requestAnimationFrame`) causes rapid object churn, triggering garbage collection spikes and reducing framerate stability. Our benchmark showed a ~1.68x speedup simply by reusing the color instance.
**Action:** Always pre-allocate `THREE.Color` (and other THREE.js vector/math objects like `THREE.Vector3`) outside of the render loop and use mutable methods like `.setHex()`, `.setRGB()`, or `.copy()` inside the loop.
