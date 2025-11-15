import { useState, useEffect, useMemo } from 'react';

/**
 * Hook for optimized list rendering with pagination/virtual scrolling
 * Reduces initial render time for large lists
 */
export function useOptimizedList<T>(
  items: T[],
  options: {
    initialBatchSize?: number;
    batchIncrement?: number;
    enableVirtualization?: boolean;
  } = {}
) {
  const {
    initialBatchSize = 20,
    batchIncrement = 10,
    enableVirtualization = true
  } = options;

  const [displayCount, setDisplayCount] = useState(initialBatchSize);

  // Reset display count when items change
  useEffect(() => {
    setDisplayCount(initialBatchSize);
  }, [items.length, initialBatchSize]);

  // Memoize visible items
  const visibleItems = useMemo(() => {
    if (!enableVirtualization) return items;
    return items.slice(0, displayCount);
  }, [items, displayCount, enableVirtualization]);

  const hasMore = displayCount < items.length;

  const loadMore = () => {
    if (hasMore) {
      setDisplayCount(prev => Math.min(prev + batchIncrement, items.length));
    }
  };

  return {
    visibleItems,
    hasMore,
    loadMore,
    totalCount: items.length,
    displayCount
  };
}
