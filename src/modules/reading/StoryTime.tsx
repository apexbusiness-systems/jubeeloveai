import { useState, useEffect } from 'react'
import { useJubeeStore } from '../../store/useJubeeStore'
import { useGameStore } from '../../store/useGameStore'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { triggerHaptic } from '@/lib/hapticFeedback'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { premiumStories } from '@/data/storySeedData'

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
  const { speak, triggerAnimation } = useJubeeStore()
  const { addScore } = useGameStore()
  const { user } = useAuth()

  // Fetch stories from database
  useEffect(() => {
    fetchStories()
  }, [user])

  const fetchStories = async () => {
    try {
      setLoading(true)
      
      // Fetch all stories from database
      const { data: dbStories, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      // If no stories in database, use local stories as fallback
      const storiesToUse = dbStories && dbStories.length > 0 
        ? dbStories.map(s => ({
            id: s.id,
            title: s.title,
            category: s.category,
            age_range: s.age_range,
            description: s.description || '',
            pages: s.pages as StoryPage[]
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
  const [currentPage, setCurrentPage] = useState(0)
  const { speak, triggerAnimation } = useJubeeStore()
  const { addScore } = useGameStore()

  const handleStorySelect = (story: typeof stories[0]) => {
    setSelectedStory(story)
    setCurrentPage(0)
    triggerHaptic('light')
    triggerAnimation('excited')
    speak("Let's read a story together!")
  }

  const handleNextPage = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!selectedStory) return

    if (currentPage < selectedStory.pages.length - 1) {
      setCurrentPage(prev => prev + 1)
      const nextPage = selectedStory.pages[currentPage + 1]
      speak(nextPage.narration)
      triggerAnimation('excited')
    } else {
      // Story completed
      addScore(50)
      triggerAnimation('celebrate')
      speak("Great job reading the story! You earned 50 points!")
      setTimeout(() => {
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
      speak(prevPage.narration)
      triggerAnimation('excited')
    }
  }

  const handleReadAloud = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!selectedStory) return
    const page = selectedStory.pages[currentPage]
    triggerHaptic('light')
    speak(page.narration)
    triggerAnimation('excited')
  }

  if (!selectedStory) {
    return (
      <div className="story-time-menu p-8">
        <h1 className="text-5xl font-bold text-center mb-8 text-game">
          📖 Story Time! 📖
        </h1>
        <p className="text-2xl text-center mb-12 text-game-neutral">
          Choose a story to read with Jubee!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {stories.map((story) => (
            <button
              key={story.id}
              onClick={() => handleStorySelect(story)}
              className="story-card p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 cursor-pointer border-4 border-game-accent active:scale-95"
              style={{
                background: 'var(--gradient-warm)',
                boxShadow: 'var(--shadow-game)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <div className="text-8xl mb-4">{story.pages[0].illustration}</div>
              <h2 className="text-3xl font-bold text-primary-foreground mb-2">{story.title}</h2>
              <p className="text-xl text-primary-foreground opacity-90">{story.pages.length} pages</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const page = selectedStory.pages[currentPage]
  const progress = ((currentPage + 1) / selectedStory.pages.length) * 100

  return (
    <div className="story-reader p-8 max-w-4xl mx-auto">
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
        <p className="text-center text-xl text-game-neutral">
          Page {currentPage + 1} of {selectedStory.pages.length}
        </p>
      </div>

      <div
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
        onKeyDown={(e) => e.key === 'Enter' && handleNextPage(e as any)}
      >
        <div className="illustration text-9xl mb-8">{page.illustration}</div>
        <p className="text-3xl text-card-foreground text-center leading-relaxed">{page.text}</p>
      </div>

      <div className="controls flex gap-4 justify-center">
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
  )
}
