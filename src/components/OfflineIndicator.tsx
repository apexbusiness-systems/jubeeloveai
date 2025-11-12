import { WifiOff, Wifi, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { cn } from '@/lib/utils'

export function OfflineIndicator() {
  const { isOnline, isSyncing, manualSync } = useOfflineSync()

  if (isOnline && !isSyncing) return null

  return (
    <div
      className={cn(
        "fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all",
        !isOnline ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">Offline</span>
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Syncing...</span>
        </>
      ) : null}
      
      {isOnline && !isSyncing && (
        <Button
          size="sm"
          variant="ghost"
          onClick={manualSync}
          className="h-6 px-2 text-xs"
        >
          <Wifi className="h-3 w-3 mr-1" />
          Sync Now
        </Button>
      )}
    </div>
  )
}
