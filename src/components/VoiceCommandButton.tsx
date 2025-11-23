import { Mic, MicOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useVoiceCommands } from '@/hooks/useVoiceCommands'
import { cn } from '@/lib/utils'
import { triggerHaptic } from '@/lib/hapticFeedback'

export function VoiceCommandButton() {
  const { isListening, isProcessing, toggleListening } = useVoiceCommands()

  const handleClick = () => {
    triggerHaptic('medium')
    toggleListening()
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isProcessing}
      variant={isListening ? "default" : "outline"}
      size="icon"
      className={cn(
        "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 transition-all",
        isListening && "animate-pulse bg-primary"
      )}
      aria-label={isListening ? "Stop listening" : "Start voice command"}
    >
      {isProcessing ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : isListening ? (
        <MicOff className="h-6 w-6" />
      ) : (
        <Mic className="h-6 w-6" />
      )}
    </Button>
  )
}
