import { RefreshCw, Check, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  className?: string;
}

export function SyncIndicator({ isSaving, lastSaved, className }: SyncIndicatorProps) {
  if (!lastSaved && !isSaving) return null;

  return (
    <div
      className={cn(
        'fixed bottom-20 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300',
        isSaving
          ? 'bg-primary/10 text-primary'
          : 'bg-muted/80 text-muted-foreground',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {isSaving ? (
        <>
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </>
      ) : (
        <>
          <Check className="h-3 w-3 text-green-500" />
          <Cloud className="h-3 w-3" />
          <span>Saved</span>
        </>
      )}
    </div>
  );
}
