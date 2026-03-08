import { useEffect, useState } from 'react'
import { useJubeeStore } from '@/store/useJubeeStore'
import { Volume1 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * Shows a subtle indicator when browser speech synthesis is being used
 * instead of cloud TTS (ElevenLabs/OpenAI).
 * Persists for a few seconds after speech ends so the user can read it.
 */
export function VoiceFallbackIndicator() {
  const usingFallbackVoice = useJubeeStore((s) => s.usingFallbackVoice)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (usingFallbackVoice) {
      setVisible(true)
    } else {
      // Keep indicator visible briefly after fallback flag clears
      const timer = setTimeout(() => setVisible(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [usingFallbackVoice])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-md"
          style={{
            background: 'hsl(var(--muted))',
            color: 'hsl(var(--muted-foreground))',
            border: '1px solid hsl(var(--border))',
          }}
          role="status"
          aria-live="polite"
        >
          <Volume1 className="h-3.5 w-3.5 animate-pulse" />
          <span>Using device voice</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
