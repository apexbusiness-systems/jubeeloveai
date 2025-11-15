import { useState, useEffect } from 'react'
import { conflictResolver, ConflictGroup } from '@/lib/conflictResolver'

/**
 * Hook to monitor data conflicts
 * Returns conflict count and statistics
 */
export function useConflictMonitor() {
  const [conflicts, setConflicts] = useState<ConflictGroup[]>([])
  const [conflictCount, setConflictCount] = useState(0)

  useEffect(() => {
    // Load initial conflicts
    const initial = conflictResolver.getConflicts()
    setConflicts(initial)
    setConflictCount(initial.length)

    // Subscribe to changes
    const unsubscribe = conflictResolver.subscribe((newConflicts) => {
      setConflicts(newConflicts)
      setConflictCount(newConflicts.length)
    })

    return unsubscribe
  }, [])

  return {
    conflicts,
    conflictCount,
    hasConflicts: conflictCount > 0,
    stats: conflictResolver.getStats()
  }
}
