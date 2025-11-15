import { useEffect, useState } from 'react'
import { syncService } from '@/lib/syncService'
import { useToast } from '@/hooks/use-toast'

/**
 * Hook to manage offline sync functionality
 * Monitors online/offline status and triggers sync
 */
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [queueSize, setQueueSize] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      
      const stats = syncService.getQueueStats()
      const hasQueue = stats.total > 0
      
      toast({
        title: "Back Online",
        description: hasQueue 
          ? `Syncing your data... (${stats.total} pending operations)`
          : "Syncing your data...",
      })

      try {
        setIsSyncing(true)
        
        // Process any queued operations first
        if (hasQueue) {
          const queueResult = await syncService.processQueue()
          console.log('Queue processed:', queueResult)
        }
        
        // Then perform regular sync
        await syncService.syncAll()
        await syncService.pullFromSupabase()
        
        setQueueSize(syncService.getQueueStats().total)
        
        toast({
          title: "Sync Complete",
          description: "Your data is up to date!",
        })
      } catch (error) {
        console.error('Sync error:', error)
        toast({
          title: "Sync Failed",
          description: "Some data couldn't be synced. We'll try again later.",
          variant: "destructive",
        })
      } finally {
        setIsSyncing(false)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast({
        title: "Offline Mode",
        description: "You can still use the app. Data will sync when you're back online.",
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Start auto-sync when online
    if (isOnline) {
      syncService.startAutoSync()
    }

    // Update queue size periodically
    const queueInterval = setInterval(() => {
      setQueueSize(syncService.getQueueStats().total)
    }, 5000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      syncService.stopAutoSync()
      clearInterval(queueInterval)
    }
  }, [toast, isOnline])

  const manualSync = async () => {
    if (!isOnline) {
      toast({
        title: "Offline",
        description: "Can't sync while offline",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSyncing(true)
      
      // Process queue first
      const stats = syncService.getQueueStats()
      if (stats.total > 0) {
        await syncService.processQueue()
      }
      
      await syncService.syncAll()
      await syncService.pullFromSupabase()
      
      setQueueSize(syncService.getQueueStats().total)
      
      toast({
        title: "Sync Complete",
        description: "Your data is up to date!",
      })
    } catch (error) {
      console.error('Manual sync error:', error)
      toast({
        title: "Sync Failed",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return {
    isOnline,
    isSyncing,
    queueSize,
    manualSync,
  }
}
