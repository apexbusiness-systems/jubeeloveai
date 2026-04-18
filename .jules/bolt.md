## 2024-04-13 - [Three.js getObjectByName in Animation Loop]
**Learning:** Using `getObjectByName` in a Three.js animation loop (e.g. running at 60 FPS) is a significant performance bottleneck due to recursive scene graph traversal.
**Action:** Always cache references to Three.js objects (e.g., using `useRef` in React) during scene setup and use these cached references in the render/animation loop to avoid expensive lookups.
## 2024-04-14 - [Optimize syncAll with Promise.allSettled]\n**Learning:** When performing multiple independent asynchronous data sync operations in a single block, sequential `await`s are a significant performance bottleneck and don't cleanly handle partial failures.\n**Action:** Use `Promise.allSettled` to fire off the promises concurrently while safely handling individual rejections without failing the entire batch.
## 2025-04-18 - Memoize mapped components with complex props
**Learning:** When using `React.memo` on list items generated inside a `map` function, passing generic boolean state props (like `isPlaying`) directly to the items will cause all of them to re-render whenever the global playback state changes.
**Action:** Instead of passing the broad `isPlaying` boolean state, pass a combined prop like `isThisCardPlaying={isCurrent && isPlaying}` to ensure only the actually affected component re-renders when the state toggles.
