## 2024-05-18 - [Optimize analyzeSentiment O(N*M) passes]
**Learning:** Sentiment analysis functions operating on strings with repeated `.filter` and `.includes` checks incur significant performance penalties (O(N*M)).
**Action:** Replaced multiple iterations with a single O(N) loop and hoisted word lists into `Set`s for O(1) lookups, yielding a 2x speedup in local benchmarks.
