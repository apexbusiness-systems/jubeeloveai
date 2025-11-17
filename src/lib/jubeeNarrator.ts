const synth = typeof window !== 'undefined' ? window.speechSynthesis : null

export type JubeeVoiceConsumer = 'BookReader' | 'StoryRunner'

interface SpeakOptions extends SpeechSynthesisUtteranceInit {
  consumer: JubeeVoiceConsumer
}

class JubeeNarrator {
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private activeConsumer: JubeeVoiceConsumer | null = null

  speakOnce(text: string, options: SpeakOptions) {
    if (!synth || !('SpeechSynthesisUtterance' in window)) {
      console.warn('[JubeeNarrator] Speech synthesis unavailable')
      return
    }

    // Cancel any ongoing narration before starting a new one
    synth.cancel()

    this.currentUtterance = new SpeechSynthesisUtterance(text)
    this.activeConsumer = options.consumer

    this.currentUtterance.lang = options.lang || 'en-US'
    this.currentUtterance.pitch = options.pitch ?? 1
    this.currentUtterance.rate = options.rate ?? 1
    this.currentUtterance.volume = options.volume ?? 1

    const handleComplete = () => {
      this.activeConsumer = null
      this.currentUtterance?.removeEventListener('end', handleComplete)
      this.currentUtterance?.removeEventListener('error', handleComplete)
      this.currentUtterance = null
    }

    this.currentUtterance.addEventListener('end', handleComplete)
    this.currentUtterance.addEventListener('error', handleComplete)

    synth.speak(this.currentUtterance)
  }

  stop() {
    if (synth) {
      synth.cancel()
    }
    this.currentUtterance = null
    this.activeConsumer = null
  }

  isSpeaking() {
    return Boolean(this.currentUtterance) && Boolean(synth?.speaking)
  }
}

export const jubeeNarrator = new JubeeNarrator()
