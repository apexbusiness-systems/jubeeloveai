import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useJubeeStore } from '../../store/useJubeeStore'
import { useGameStore } from '../../store/useGameStore'
import { useParentalStore } from '../../store/useParentalStore'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { triggerHaptic } from '@/lib/hapticFeedback'
import { toast } from 'sonner'
import { Loader2, Volume2, Pause, Play, Lock } from 'lucide-react'
import { premiumStories } from '@/data/storySeedData'
import { initializeStories } from '@/lib/initializeStories'
import { audioManager } from '@/lib/audioManager'
import { Slider } from '@/components/ui/slider'
import { useSmartAudioPreloader } from '@/hooks/useSmartAudioPreloader'

interface StoryPage { id: number; text: string; illustration: string; narration: string }
interface Story { id: string; title: string; category: string; tier?: 'free' | 'premium'; age_range: string; description: string; pages: StoryPage[]; completed?: boolean }

const StoryCard = memo(({ story, onSelect, isPremium }: { story: Story; onSelect: (s: Story) => void; isPremium: boolean }) => {
  const isLocked = story.tier === 'premium' && !isPremium;
  return (
    <button
      onClick={() => {
        if (isLocked) { triggerHaptic('error'); toast.info("Ask parents to unlock Premium! 🌟"); }
        else onSelect(story);
      }}
      className={`p-8 rounded-3xl transition-all duration-300 relative text-left w-full border-4 
        ${isLocked ? 'border-muted opacity-80 grayscale-[0.5]' : 'border-game-accent hover:scale-105 active:scale-95'}
      `}
      style={{
        background: isLocked ? 'var(--card)' : 'var(--gradient-warm)',
        boxShadow: 'var(--shadow-game)',
      }}
    >
      {isLocked && (
        <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold flex gap-1 items-center shadow-md z-10">
          <Lock className="w-4 h-4" /> Premium
        </div>
      )}
      <div className="text-8xl mb-4 text-center">{story.pages[0].illustration}</div>
      <h2 className="text-3xl font-bold mb-2 text-foreground">{story.title}</h2>
      <p className="text-xl opacity-90">{story.pages.length} pages</p>
    </button>
  )
})
StoryCard.displayName = 'StoryCard'

// AudioControls component omitted for brevity (reuse existing)
const AudioControls = ({ isNarrating, isPaused, playbackSpeed, onPauseResume, onSpeedChange }: any) => {
    if(!isNarrating) return null;
    return (
        <div className="flex flex-col items-center gap-4 p-4 bg-card border-2 border-game-accent rounded-xl">
             <button onClick={onPauseResume} className="p-3 bg-primary rounded-full text-white">
                {isPaused ? <Play /> : <Pause />}
             </button>
        </div>
    )
}

export default function StoryTime() {
  const [stories, setStories] = useState<Story[]>([])
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isNarrating, setIsNarrating] = useState(false)
  const { speak, triggerAnimation } = useJubeeStore()
  const { isPremium } = useParentalStore()
  const { user } = useAuth()

  useEffect(() => {
    // Simulate fetch or load from seed
    setStories(premiumStories.map((s, i) => ({ ...s, id: `local-${i}`, pages: s.pages as any })));
    setLoading(false);
  }, []);

  const handleStorySelect = (story: Story) => {
    setSelectedStory(story);
    setCurrentPage(0);
    triggerAnimation('excited');
    setTimeout(() => {
        setIsNarrating(true);
        speak(story.pages[0].narration);
    }, 500);
  }

  const handleNextPage = () => {
    if(!selectedStory) return;
    if(currentPage < selectedStory.pages.length - 1) {
        const next = currentPage + 1;
        setCurrentPage(next);
        speak(selectedStory.pages[next].narration);
    } else {
        triggerAnimation('celebrate');
        speak("We finished the story!");
        setTimeout(() => setSelectedStory(null), 3000);
    }
  }

  if (!selectedStory) {
    return (
      <div className="p-8">
        <h1 className="text-5xl font-bold text-center mb-8 text-game">📖 Story Time!</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {stories.map(s => <StoryCard key={s.id} story={s} onSelect={handleStorySelect} isPremium={isPremium} />)}
        </div>
      </div>
    )
  }

  const page = selectedStory.pages[currentPage];
  return (
    <div className="p-8 max-w-4xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">{selectedStory.title}</h1>
        <div onClick={handleNextPage} className="cursor-pointer p-12 bg-card border-4 border-game-accent rounded-3xl mb-8 shadow-xl">
            <div className="text-9xl mb-8">{page.illustration}</div>
            <p className="text-3xl leading-relaxed">{page.text}</p>
        </div>
        <button onClick={handleNextPage} className="px-8 py-4 bg-primary text-white text-2xl rounded-full font-bold shadow-lg">
            {currentPage === selectedStory.pages.length - 1 ? 'Finish!' : 'Next ➡️'}
        </button>
    </div>
  )
}

