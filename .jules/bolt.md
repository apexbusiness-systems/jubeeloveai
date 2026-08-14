## YYYY-MM-DD - [Optimize ParentHub Component Renders]
**Learning:** Nested array `.map` calls that re-evaluate `Object.values(Object)` or invoke `.find()` on constants can be severely detrimental to React render performance, causing unneeded allocation and O(N) operations per item.
**Action:** Precompute dictionaries / lookup maps at module scope for `O(1)` constant time access. Also hoist state retrievals like `store.getState()` out of loops when iterating arrays.
