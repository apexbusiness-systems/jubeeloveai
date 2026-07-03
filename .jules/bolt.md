## 2024-07-03 - [ParentHub Skills Lookup Optimization]
**Learning:** Found an O(N) array lookup (`Object.values(Skills).find()`) inside a `.map()` loop during component rendering in `src/pages/ParentHub.tsx`.
**Action:** Replaced it with an O(1) dictionary lookup by precomputing a `SKILLS_MAP` outside the component. Proved the optimization with a benchmark test showing a >10x speedup. Always look for redundant array iterations inside render loops.
