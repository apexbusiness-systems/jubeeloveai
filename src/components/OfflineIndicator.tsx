import { WifiOff, Wifi, RefreshCw, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { useConflictMonitor } from '@/hooks/useConflictMonitor'
import { cn } from '@/lib/utils'

export function OfflineIndicator() {
  const { isOnline, isSyncing, queueSize, manualSync } = useOfflineSync()
  const { conflictCount } = useConflictMonitor()

  if (isOnline && !isSyncing && queueSize === 0 && conflictCount === 0) return null

  return (
    <div
      className={cn(
        "fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all",
        !isOnline 
          ? "bg-destructive text-destructive-foreground" 
          : conflictCount > 0
          ? "bg-warning text-warning-foreground"
          : "bg-primary text-primary-foreground"
      )}
      role="status"
      aria-live="polite"
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium">Offline</span>
          {queueSize > 0 && (
            <span className="text-xs opacity-90">({queueSize} pending)</span>
          )}
        </>
      ) : conflictCount > 0 ? (
        <>
          <AlertCircle className="h-4 w-4 animate-pulse" aria-hidden="true" />
          <span className="text-sm font-medium">
            {conflictCount} conflict{conflictCount !== 1 ? 's' : ''}
          </span>
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span className="text-sm font-medium">Syncing...</span>
          {queueSize > 0 && (
            <span className="text-xs opacity-90">({queueSize} in queue)</span>
          )}
        </>
      ) : queueSize > 0 ? (
        <>
          <Clock className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium">{queueSize} pending</span>
        </>
      ) : null}
      
      {isOnline && !isSyncing && conflictCount === 0 && (
        <Button
          size="sm"
          variant="ghost"
          onClick={manualSync}
          className="h-6 px-2 text-xs"
        >
          <Wifi className="h-3 w-3 mr-1" aria-hidden="true" />
          Sync Now
        </Button>
      )}
    </div>
  )
}
