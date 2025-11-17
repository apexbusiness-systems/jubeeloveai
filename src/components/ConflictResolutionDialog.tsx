import { useState, useEffect } from 'react'
import { AlertCircle, Calendar, Database, Laptop } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { conflictResolver, ConflictGroup, ResolutionChoice } from '@/lib/conflictResolver'
import { jubeeDB } from '@/lib/indexedDB'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

export function ConflictResolutionDialog() {
  const [conflicts, setConflicts] = useState<ConflictGroup[]>([])
  const [currentConflict, setCurrentConflict] = useState<ConflictGroup | null>(null)
  const [isResolving, setIsResolving] = useState(false)
  const [showBatchOptions, setShowBatchOptions] = useState(false)
  const [diagnosis, setDiagnosis] = useState<Record<string, ResolutionChoice>>({})
  const { toast } = useToast()

  useEffect(() => {
    // Load initial conflicts
    const initialConflicts = conflictResolver.getConflicts()
    setConflicts(initialConflicts)
    setDiagnosis(conflictResolver.getDiagnosis())
    
    // Subscribe to changes
    const unsubscribe = conflictResolver.subscribe((newConflicts) => {
      setConflicts(newConflicts)
      setDiagnosis(conflictResolver.getDiagnosis())
      if (newConflicts.length > 0 && !currentConflict) {
        setCurrentConflict(newConflicts[0])
      } else if (newConflicts.length === 0) {
        setCurrentConflict(null)
      }
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (conflicts.length > 0 && !currentConflict) {
      setCurrentConflict(conflicts[0])
    }
  }, [conflicts, currentConflict])

  const handleResolve = async (choice: ResolutionChoice) => {
    if (!currentConflict) return

    setIsResolving(true)
    try {
      const resolvedData = conflictResolver.resolveConflict(currentConflict.id, choice)

      // Update local database
      await jubeeDB.put(currentConflict.storeName as 'gameProgress' | 'achievements' | 'drawings' | 'stickers' | 'childrenProfiles', resolvedData as any)
      
      // If keeping local or merge, sync to server
      if (choice === 'local' || choice === 'merge') {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await syncToServer(currentConflict.storeName, resolvedData, user.id)
        }
      }

      toast({
        title: "Conflict Resolved",
        description: `${choice === 'local' ? 'Kept local version' : choice === 'server' ? 'Kept server version' : 'Merged changes'}`,
      })

      // Move to next conflict
      const remaining = conflictResolver.getConflicts()
      setCurrentConflict(remaining.length > 0 ? remaining[0] : null)
    } catch (error) {
      console.error('Failed to resolve conflict:', error)
      toast({
        title: "Resolution Failed",
        description: "Could not resolve conflict. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsResolving(false)
    }
  }

  const handleBatchResolve = async (choice: ResolutionChoice, scope: 'all' | 'store' = 'all') => {
    if (conflicts.length === 0) return

    setIsResolving(true)
    try {
      let resolvedDataArray: Record<string, unknown>[]

      if (scope === 'all') {
        resolvedDataArray = await conflictResolver.resolveAll(choice)
      } else if (currentConflict) {
        resolvedDataArray = await conflictResolver.resolveByStore(currentConflict.storeName, choice)
      } else {
        return
      }

      // Sync to server in batches
      const { data: { user } } = await supabase.auth.getUser()
      if (user && (choice === 'local' || choice === 'merge')) {
        const syncPromises = resolvedDataArray.map((data, index) => {
          const conflict = conflicts[index]
          if (conflict) {
            return syncToServer(conflict.storeName, data, user.id)
          }
        })
        await Promise.all(syncPromises.filter(Boolean))
      }

      // Update local database in batches
      for (let i = 0; i < resolvedDataArray.length; i++) {
        const data = resolvedDataArray[i]
        const conflict = conflicts[i]
        if (conflict) {
          await jubeeDB.put(conflict.storeName as 'gameProgress' | 'achievements' | 'drawings' | 'stickers' | 'childrenProfiles', data as any)
        }
      }

      toast({
        title: "Conflicts Resolved",
        description: `${resolvedDataArray.length} conflict(s) resolved using ${choice} strategy`,
      })

      setCurrentConflict(null)
      setShowBatchOptions(false)
    } catch (error) {
      console.error('Failed to resolve conflicts:', error)
      toast({
        title: "Batch Resolution Failed",
        description: "Some conflicts could not be resolved. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsResolving(false)
    }
  }

  const handleAutoDiagnose = async () => {
    if (conflicts.length === 0) return

    setIsResolving(true)
    try {
      const diagnosis = conflictResolver.getDiagnosis()
      const resolvedDataArray: Record<string, unknown>[] = []

      // Group conflicts by recommended strategy
      const byStrategy: Record<ResolutionChoice, string[]> = {
        local: [],
        server: [],
        merge: []
      }

      Object.entries(diagnosis).forEach(([id, strategy]) => {
        byStrategy[strategy].push(id)
      })

      // Resolve each group
      for (const [strategy, ids] of Object.entries(byStrategy) as [ResolutionChoice, string[]][]) {
        if (ids.length > 0) {
          const resolved = await conflictResolver.resolveBatch(ids, strategy)
          resolvedDataArray.push(...resolved)
        }
      }

      // Sync to server
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        for (let i = 0; i < resolvedDataArray.length; i++) {
          const data = resolvedDataArray[i]
          const conflict = conflicts[i]
          if (conflict) {
            await jubeeDB.put(conflict.storeName as 'gameProgress' | 'achievements' | 'drawings' | 'stickers' | 'childrenProfiles', data as any)

            if (diagnosis[conflict.id] === 'local' || diagnosis[conflict.id] === 'merge') {
              await syncToServer(conflict.storeName, data, user.id)
            }
          }
        }
      }

      toast({
        title: "Auto-Diagnosis Complete",
        description: `${resolvedDataArray.length} conflict(s) automatically resolved`,
      })

      setCurrentConflict(null)
    } catch (error) {
      console.error('Failed to auto-diagnose:', error)
      toast({
        title: "Auto-Diagnosis Failed",
        description: "Could not automatically resolve conflicts.",
        variant: "destructive",
      })
    } finally {
      setIsResolving(false)
    }
  }

  const syncToServer = async (storeName: string, data: Record<string, unknown>, userId: string) => {
    switch (storeName) {
      case 'gameProgress':
        await supabase.from('game_progress').upsert([{
          child_profile_id: null,
          score: data.score as number,
          activities_completed: data.activitiesCompleted as number,
          current_theme: data.currentTheme as string,
          last_activity: data.lastActivity as string,
          updated_at: data.updatedAt as string,
        }])
        break
      
      case 'drawings':
        await supabase.from('drawings').insert([{
          child_profile_id: null,
          title: data.title as string,
          image_data: data.imageData as string,
          updated_at: data.updatedAt as string,
        }])
        break
    }
  }

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'Not set'
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    return String(value)
  }

  const getStoreName = (storeName: string): string => {
    const names: Record<string, string> = {
      gameProgress: 'Game Progress',
      achievements: 'Achievements',
      drawings: 'Drawings',
      stickers: 'Stickers',
      childrenProfiles: 'Child Profiles'
    }
    return names[storeName] || storeName
  }

  if (conflicts.length === 0 || !currentConflict) return null

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            <DialogTitle>Data Conflict{conflicts.length > 1 ? 's' : ''} Detected</DialogTitle>
          </div>
          <DialogDescription>
            Your local data differs from the server. {conflicts.length > 1 ? 'Review and resolve conflicts individually or use batch options.' : 'Choose which version to keep.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress indicator */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Conflict {conflicts.findIndex(c => c.id === currentConflict.id) + 1} of {conflicts.length}
            </span>
            <Badge variant="outline">{getStoreName(currentConflict.storeName)}</Badge>
          </div>

          {currentConflict.recordName && (
            <div className="text-sm font-medium">{currentConflict.recordName}</div>
          )}

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {currentConflict.conflicts.map((conflict) => (
                <div key={conflict.id} className="border rounded-lg p-4 space-y-3">
                  <div className="font-medium capitalize">
                    {conflict.field.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Local version */}
                    <div className="space-y-2 border rounded p-3 bg-card">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Laptop className="h-4 w-4" />
                        Local Version
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {conflict.localTimestamp && format(new Date(conflict.localTimestamp), 'PPp')}
                      </div>
                      <div className="mt-2 text-sm font-mono bg-muted p-2 rounded break-all">
                        {formatValue(conflict.localValue)}
                      </div>
                    </div>

                    {/* Server version */}
                    <div className="space-y-2 border rounded p-3 bg-card">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Database className="h-4 w-4" />
                        Server Version
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {conflict.serverTimestamp && format(new Date(conflict.serverTimestamp), 'PPp')}
                      </div>
                      <div className="mt-2 text-sm font-mono bg-muted p-2 rounded break-all">
                        {formatValue(conflict.serverValue)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <Separator />

          {/* Batch options */}
          {conflicts.length > 1 && (
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => setShowBatchOptions(!showBatchOptions)}
                disabled={isResolving}
                className="w-full"
              >
                {showBatchOptions ? 'Hide' : 'Show'} Batch Options ({conflicts.length} conflicts)
              </Button>

              {showBatchOptions && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 border rounded-lg bg-muted/50">
                  <Button
                    variant="secondary"
                    onClick={handleAutoDiagnose}
                    disabled={isResolving}
                    className="w-full"
                  >
                    🤖 Auto-Diagnose & Resolve All
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handleBatchResolve('local', 'all')}
                    disabled={isResolving}
                    className="w-full"
                  >
                    <Laptop className="h-4 w-4 mr-2" />
                    All → Local
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handleBatchResolve('server', 'all')}
                    disabled={isResolving}
                    className="w-full"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    All → Server
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handleBatchResolve('merge', 'all')}
                    disabled={isResolving}
                    className="w-full"
                  >
                    All → Merge
                  </Button>

                  {currentConflict && (
                    <>
                      <Separator className="col-span-full" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBatchResolve('local', 'store')}
                        disabled={isResolving}
                        className="w-full"
                      >
                        {getStoreName(currentConflict.storeName)} → Local
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBatchResolve('server', 'store')}
                        disabled={isResolving}
                        className="w-full"
                      >
                        {getStoreName(currentConflict.storeName)} → Server
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => handleResolve('server')}
              disabled={isResolving}
              className="w-full sm:w-auto"
            >
              <Database className="h-4 w-4 mr-2" />
              Keep Server
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleResolve('merge')}
              disabled={isResolving}
              className="w-full sm:w-auto"
            >
              Merge {currentConflict && diagnosis[currentConflict.id] === 'merge' && '(Recommended)'}
            </Button>
            
            <Button
              onClick={() => handleResolve('local')}
              disabled={isResolving}
              className="w-full sm:w-auto"
            >
              <Laptop className="h-4 w-4 mr-2" />
              Keep Local {currentConflict && diagnosis[currentConflict.id] === 'local' && '✓'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
