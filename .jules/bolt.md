## 2025-03-02 - O(n log n) sorting optimization on dynamic UI list categorization
**Learning:** React `useMemo` blocks with arrays often contain multiple successive filters and sorts to display content in tabs. These multiple loops (like what `AchievementList` did with 5 `.filter()` passes + 5 `.sort()` passes dynamically) degrade quickly.
**Action:** Replace multiple map/filter passes with a single `O(n)` category separation block that leverages an initial `O(n log n)` global sort, then iterate the items once. Doing this in `useMemo` avoids redundant iteration and computation per render. If returning functions, use `React.useCallback`.

## 2025-04-24 - O(n) array operations over `.reduce` for simple object mappings
**Learning:** In very hot code paths (e.g. rendering large collections where useMemo recalculates, or iterating over arrays in rendering), using multiple `.filter()` calls to map data is slower than using standard `for` loops. The StickerBook component had 3 `.filter()` passes that we consolidated into a single pass loop.
**Action:** Replace multiple `.filter()` passes with a single `for` loop mapping when iterating data that creates disjoint sets based on a category property. It yields a consistent and noticeable reduction in execution time for the calculation block.
