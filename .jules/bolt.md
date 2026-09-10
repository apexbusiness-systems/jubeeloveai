## YYYY-MM-DD - [Optimize ParentHub skill lookups]
**Learning:** Found an O(N) lookup (`Object.values(Skills).find()`) running inside nested map loops during render, degrading performance.
**Action:** Replace `Object.values(Skills).find` inside render loops with a `useMemo` backed `Map` for O(1) lookups to optimize rendering time.
