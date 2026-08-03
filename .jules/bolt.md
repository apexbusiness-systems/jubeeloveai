## 2024-05-19 - [Component Props Equality Testing]
**Learning:** Testing component optimizations like `React.memo` by making a dummy test file only proves that `memo` works in React itself, not that the *actual* components in the application avoid re-renders. A better approach is to test the actual application components and measure render counts.
**Action:** Always import the actual component you are trying to test into the performance benchmark. Do not test dummy components representing the optimized version.
