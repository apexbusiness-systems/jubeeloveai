import type React from 'react'
import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useJubeeStore } from '../../store/useJubeeStore'
import { useGameStore } from '../../store/useGameStore'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { triggerHaptic } from '@/lib/hapticFeedback'
import { toast } from 'sonner'
import { Loader2, Volume2, Pause, Play } from 'lucide-react'
import { premiumStories } from '@/data/storySeedData'
import { initializeStories } from '@/lib/initializeStories'
import { audioManager } from '@/lib/audioManager'
import { Slider } from '@/components/ui/slider'
import { useSmartAudioPreloader } from '@/hooks/useSmartAudioPreloader'

// Memoized story card component
const StoryCard = memo(({ 
  story, 
  onSelect 
}: { 
  story: Story; 
  onSelect: (story: Story) => void;
}) => (
  <button
    data-testid="story-card"
    onClick={() => onSelect(story)}
    className="story-card p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 cursor-pointer border-4 border-game-accent active:scale-95 relative"
    style={{
      background: 'var(--gradient-warm)',
      boxShadow: 'var(--shadow-game)',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent'
    }}
  >
    {story.completed && (
      <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
        ✓ Completed
      </div>
    )}
    <div className="text-8xl mb-4">{story.pages[0].illustration}</div>
    <h2 className="text-3xl font-bold text-primary-foreground mb-2">{story.title}</h2>
    <p className="text-xl text-primary-foreground opacity-90">{story.pages.length} pages</p>
  </button>
))
StoryCard.displayName = 'StoryCard'

// Memoized audio controls component with strict typing
const AudioControls = memo(({ 
  isNarrating,
  isPaused,
  playbackSpeed,
  onPauseResume,
  onSpeedChange
}: {
  isNarrating: boolean;
  isPaused: boolean;
  playbackSpeed: number;
  onPauseResume: (e: React.MouseEvent | React.TouchEvent) => void;
  onSpeedChange: (value: number[]) => void;
}) => {
  if (!isNarrating) return null
  
  return (
    <div className="playback-controls flex flex-col items-center gap-4 p-6 rounded-2xl bg-card border-2 border-game-accent">
      <div className="flex items-center gap-6 w-full max-w-md">
        <button
          onClick={onPauseResume}
          className="p-4 rounded-full transform hover:scale-105 active:scale-95 transition-all text-primary-foreground border-2 border-game-accent"
          style={{
            background: 'var(--gradient-game)',
            boxShadow: 'var(--shadow-accent)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          aria-label={isPaused ? 'Resume narration' : 'Pause narration'}
        >
          {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
        </button>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-card-foreground">Speed:</span>
            <span className="text-lg font-bold text-primary">{playbackSpeed.toFixed(1)}x</span>
          </div>
          <Slider
            value={[playbackSpeed]}
            onValueChange={onSpeedChange}
            min={0.5}
            max={2}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>0.5x</span>
            <span>1x</span>
            <span>2x</span>
          </div>
        </div>
      </div>
    </div>
  )
})
AudioControls.displayName = 'AudioControls'

interface StoryPage {
  id: number
  text: string
  illustration: string
  narration: string
}

interface Story {
  id: string
  title: string
  category: string
  age_range: string
  description: string
  pages: StoryPage[]
  completed?: boolean
}

export default function StoryTime() {
  const [stories, setStories] = useState<Story[]>([])
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isNarrating, setIsNarrating] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const { speak, triggerAnimation } = useJubeeStore()
  const { addScore } = useGameStore()
  const { user } = useAuth()
  const { preloadStoryContext } = useSmartAudioPreloader()

  // Fetch stories from database
  useEffect(() => {
    fetchStories()
  }, [user])

  const fetchStories = async () => {
    try {
      setLoading(true)
      
      // Initialize stories if database is empty
      await initializeStories()
      
      // Fetch all stories from database
      const { data: dbStories, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      // If no stories in database, use local stories as fallback
      const storiesToUse: Story[] = dbStories && dbStories.length > 0 
        ? dbStories.map(s => ({
            id: s.id,
            title: s.title,
            category: s.category,
            age_range: s.age_range ?? '3-5',
            description: s.description || '',
            pages: s.pages as unknown as StoryPage[]
          }))
        : premiumStories.map((s, idx) => ({
            id: `local-${idx}`,
            title: s.title,
            category: s.category,
            age_range: s.age_range,
            description: s.description,
            pages: s.pages
          }))

      // Fetch completion status if user is logged in
      if (user) {
        const { data: completions } = await supabase
          .from('story_completions')
          .select('story_id')
          .eq('user_id', user.id)

        const completedIds = new Set(completions?.map(c => c.story_id) || [])
        
        storiesToUse.forEach(story => {
          story.completed = completedIds.has(story.id)
        })
      }

      setStories(storiesToUse)
    } catch (error) {
      console.error('Error fetching stories:', error)
      toast.error('Failed to load stories')
      
      // Fallback to local stories
      setStories(premiumStories.map((s, idx) => ({
        id: `local-${idx}`,
        title: s.title,
        category: s.category,
        age_range: s.age_range,
        description: s.description,
        pages: s.pages
      })))
    } finally {
      setLoading(false)
    }
  }

  const markStoryComplete = async (storyId: string) => {
    if (!user) return

    try {
      const { data: existing } = await supabase
        .from('story_completions')
        .select('id')
        .eq('user_id', user.id)
        .eq('story_id', storyId)
        .maybeSingle()

      if (!existing) {
        await supabase
          .from('story_completions')
          .insert({
            user_id: user.id,
            story_id: storyId
          })

        setStories(prev => prev.map(s => 
          s.id === storyId ? { ...s, completed: true } : s
        ))
      }
    } catch (error) {
      console.error('Error marking story complete:', error)
    }
  }

  const handleStorySelect = (story: Story) => {
    setSelectedStory(story)
    setCurrentPage(0)
    triggerHaptic('light')
    triggerAnimation('excited')
    
    // Preload all story pages for instant playback
    preloadStoryContext(story.pages)
    
    // Auto-play the first page's narration
    setTimeout(() => {
      setIsNarrating(true)
      setIsPaused(false)
      speak(story.pages[0].narration)
      // Set playback speed
      audioManager.setPlaybackSpeed(playbackSpeed)
      // Estimate narration duration
      const words = story.pages[0].narration.split(' ').length
      const duration = (words / 150) * 60 * 1000 / playbackSpeed
      setTimeout(() => setIsNarrating(false), duration)
    }, 1000)
  }

  const handleNextPage = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!selectedStory) return

    if (currentPage < selectedStory.pages.length - 1) {
      setCurrentPage(prev => prev + 1)
      const nextPage = selectedStory.pages[currentPage + 1]
      setIsNarrating(true)
      setIsPaused(false)
      speak(nextPage.narration)
      triggerAnimation('excited')
      // Set playback speed
      audioManager.setPlaybackSpeed(playbackSpeed)
      // Estimate narration duration
      const words = nextPage.narration.split(' ').length
      const duration = (words / 150) * 60 * 1000 / playbackSpeed
      setTimeout(() => setIsNarrating(false), duration)
    } else {
      // Story completed
      markStoryComplete(selectedStory.id)
      addScore(50)
      triggerAnimation('celebrate')
      setIsNarrating(true)
      setIsPaused(false)
      speak("Great job reading the story! You earned 50 points!")
      setTimeout(() => {
        setIsNarrating(false)
        setSelectedStory(null)
        setCurrentPage(0)
      }, 3000)
    }
  }

  const handlePrevPage = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1)
      const prevPage = selectedStory!.pages[currentPage - 1]
      triggerHaptic('light')
      setIsNarrating(true)
      setIsPaused(false)
      speak(prevPage.narration)
      triggerAnimation('excited')
      // Set playback speed
      audioManager.setPlaybackSpeed(playbackSpeed)
      // Estimate narration duration
      const words = prevPage.narration.split(' ').length
      const duration = (words / 150) * 60 * 1000 / playbackSpeed
      setTimeout(() => setIsNarrating(false), duration)
    }
  }

  const handleReadAloud = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!selectedStory) return
    const page = selectedStory.pages[currentPage]
    triggerHaptic('light')
    setIsNarrating(true)
    setIsPaused(false)
    speak(page.narration)
    triggerAnimation('excited')
    // Set playback speed
    audioManager.setPlaybackSpeed(playbackSpeed)
    // Estimate narration duration
    const words = page.narration.split(' ').length
    const duration = (words / 150) * 60 * 1000 / playbackSpeed
    setTimeout(() => setIsNarrating(false), duration)
  }

  const handlePauseResume = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isNarrating) return
    
    triggerHaptic('light')
    if (isPaused) {
      audioManager.resumeAudio()
      setIsPaused(false)
    } else {
      audioManager.pauseAudio()
      setIsPaused(true)
    }
  }

  const handleSpeedChange = useCallback((value: number[]) => {
    const newSpeed = value[0]
    setPlaybackSpeed(newSpeed)
    audioManager.setPlaybackSpeed(newSpeed)
  }, [])

  // Memoize current page data
  const currentPageData = useMemo(() => {
    if (!selectedStory) return null
    const page = selectedStory.pages[currentPage]
    const progress = ((currentPage + 1) / selectedStory.pages.length) * 100
    return { page, progress }
  }, [selectedStory, currentPage])

  if (!selectedStory) {
    return (
      <div className="story-time-menu p-8">
        <h1 className="text-5xl font-bold text-center mb-8 text-game">
          📖 Story Time! 📖
        </h1>
        <p className="text-2xl text-center mb-12 text-game-neutral">
          Choose a story to read with Jubee!
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-game" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} onSelect={handleStorySelect} />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (!currentPageData) return null
  const { page, progress } = currentPageData

  return (
    <div className="story-reader p-8 max-w-4xl mx-auto">
      {/* Audio Narration Indicator */}
      {isNarrating && (
        <div className="fixed top-8 right-8 z-50 flex items-center gap-3 px-6 py-3 rounded-full bg-primary/90 backdrop-blur-sm shadow-lg animate-fade-in">
          <Volume2 className="w-6 h-6 text-primary-foreground animate-pulse" />
          <div className="flex gap-1 items-center">
            <div className="w-1 bg-primary-foreground rounded-full animate-[pulse_0.8s_ease-in-out_infinite]" style={{ height: '12px', animationDelay: '0s' }} />
            <div className="w-1 bg-primary-foreground rounded-full animate-[pulse_0.8s_ease-in-out_infinite]" style={{ height: '18px', animationDelay: '0.1s' }} />
            <div className="w-1 bg-primary-foreground rounded-full animate-[pulse_0.8s_ease-in-out_infinite]" style={{ height: '24px', animationDelay: '0.2s' }} />
            <div className="w-1 bg-primary-foreground rounded-full animate-[pulse_0.8s_ease-in-out_infinite]" style={{ height: '18px', animationDelay: '0.3s' }} />
            <div className="w-1 bg-primary-foreground rounded-full animate-[pulse_0.8s_ease-in-out_infinite]" style={{ height: '12px', animationDelay: '0.4s' }} />
          </div>
          <span className="text-sm font-medium text-primary-foreground">Jubee is reading...</span>
        </div>
      )}

      <div className="story-header mb-8">
        <h1 className="text-4xl font-bold text-center mb-4 text-game">
          {selectedStory.title}
        </h1>
        <div className="progress-bar mb-4 border-2 border-game-accent rounded-xl overflow-hidden bg-muted" style={{ height: '12px' }}>
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: 'var(--gradient-warm)'
            }}
          />
        </div>
        <p data-testid="page-number" className="text-center text-xl text-game-neutral">
          Page {currentPage + 1} of {selectedStory.pages.length}
        </p>
      </div>

      <div
        data-testid="story-text"
        className="story-page p-12 rounded-3xl mb-8 bg-card border-4 border-game-accent flex flex-col items-center justify-center cursor-pointer active:scale-98 transition-transform"
        style={{
          boxShadow: 'var(--shadow-accent)',
          minHeight: '400px',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
        onClick={handleNextPage}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleNextPage(e as unknown as React.MouseEvent)
          }
        }}
      >
        <div className="illustration text-9xl mb-8">{page.illustration}</div>
        <p className="text-3xl text-card-foreground text-center leading-relaxed">{page.text}</p>
      </div>

      <div className="controls-container space-y-6">
        {/* Playback Controls */}
        <AudioControls
          isNarrating={isNarrating}
          isPaused={isPaused}
          playbackSpeed={playbackSpeed}
          onPauseResume={handlePauseResume}
          onSpeedChange={handleSpeedChange}
        />

        {/* Navigation Controls */}
        <div className="navigation-controls flex gap-4 justify-center">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="px-8 py-4 text-2xl font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 transition-all text-primary-foreground border-3 border-game-accent min-h-[60px]"
            style={{
              background: currentPage === 0 ? 'var(--gradient-neutral)' : 'var(--gradient-warm)',
              boxShadow: 'var(--shadow-game)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            ⬅️ Previous
          </button>

          <button
            onClick={handleReadAloud}
            className="px-8 py-4 text-2xl font-bold rounded-full transform hover:scale-105 active:scale-95 transition-all text-primary-foreground border-3 border-game-accent min-h-[60px]"
            style={{
              background: 'var(--gradient-game)',
              boxShadow: 'var(--shadow-accent)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            🔊 Read Aloud
          </button>

          <button
            onClick={handleNextPage}
            className="px-8 py-4 text-2xl font-bold rounded-full transform hover:scale-105 active:scale-95 transition-all text-primary-foreground border-3 border-game-accent min-h-[60px]"
            style={{
              background: 'var(--gradient-cool)',
              boxShadow: 'var(--shadow-game)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {currentPage === selectedStory.pages.length - 1 ? '✓ Finish' : 'Next ➡️'}
          </button>
        </div>
      </div>
    </div>
  )
}
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

