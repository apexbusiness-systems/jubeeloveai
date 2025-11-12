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
  const { toast } = useToast()

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      toast({
        title: "Back Online",
        description: "Syncing your data...",
      })

      try {
        setIsSyncing(true)
        await syncService.syncAll()
        await syncService.pullFromSupabase()
        
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

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      syncService.stopAutoSync()
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
      await syncService.syncAll()
      await syncService.pullFromSupabase()
      
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
    manualSync,
  }
}
