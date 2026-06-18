## 2023-06-18 - [Optimization] O(1) Hash Map Lookups

**Learning:** When displaying grouped or mapped lists of objects that need their human-readable name, `Object.values(ObjectDict).find(...)` inside of the React map loop adds an unnecessary performance penalty (O(n) per item rendered) which becomes O(n*m) over large datasets.

**Action:** Whenever iterating over object keys or IDs to resolve a name using a static dictionary map (e.g. `Skills` or enums), define an optimized secondary constant dictionary exported from the same module, e.g. `export const ObjectNamesMap: Record<string, string> = Object.values(ObjectDict).reduce((acc, obj) => { acc[obj.id] = obj.name; return acc; }, {});` which executes eagerly exactly once, then switch the loops to a simple `ObjectNamesMap[id]` for O(1) lookup.
