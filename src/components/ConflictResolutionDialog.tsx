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
  const { toast } = useToast()

  useEffect(() => {
    // Load initial conflicts
    setConflicts(conflictResolver.getConflicts())
    
    // Subscribe to changes
    const unsubscribe = conflictResolver.subscribe((newConflicts) => {
      setConflicts(newConflicts)
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
      await jubeeDB.put(currentConflict.storeName as any, resolvedData)
      
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

  const syncToServer = async (storeName: string, data: any, userId: string) => {
    switch (storeName) {
      case 'gameProgress':
        await supabase.from('game_progress').upsert({
          user_id: userId,
          child_profile_id: null,
          score: data.score,
          activities_completed: data.activitiesCompleted,
          current_theme: data.currentTheme,
          last_activity: data.lastActivity,
          updated_at: data.updatedAt,
        }, { onConflict: 'user_id,child_profile_id' })
        break
      
      case 'drawings':
        await supabase.from('drawings').upsert({
          id: data.id,
          user_id: userId,
          child_profile_id: null,
          title: data.title,
          image_data: data.imageData,
          updated_at: data.updatedAt,
        })
        break
    }
  }

  const formatValue = (value: any): string => {
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
            <DialogTitle>Data Conflict Detected</DialogTitle>
          </div>
          <DialogDescription>
            Your local data differs from the server. Choose which version to keep.
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

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => handleResolve('server')}
              disabled={isResolving}
              className="w-full sm:w-auto"
            >
              <Database className="h-4 w-4 mr-2" />
              Keep Server Version
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleResolve('merge')}
              disabled={isResolving}
              className="w-full sm:w-auto"
            >
              Merge Both (Newer Wins)
            </Button>
            
            <Button
              onClick={() => handleResolve('local')}
              disabled={isResolving}
              className="w-full sm:w-auto"
            >
              <Laptop className="h-4 w-4 mr-2" />
              Keep Local Version
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
