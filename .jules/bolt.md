## 2024-04-13 - [Three.js getObjectByName in Animation Loop]
**Learning:** Using `getObjectByName` in a Three.js animation loop (e.g. running at 60 FPS) is a significant performance bottleneck due to recursive scene graph traversal.
**Action:** Always cache references to Three.js objects (e.g., using `useRef` in React) during scene setup and use these cached references in the render/animation loop to avoid expensive lookups.
