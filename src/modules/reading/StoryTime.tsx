import { useState } from 'react'
import { useJubeeStore } from '../../store/useJubeeStore'
import { useGameStore } from '../../store/useGameStore'

interface StoryPage {
  id: number
  text: string
  illustration: string
  narration: string
}

const stories = [
  {
    id: 'jubee-adventure',
    title: "Jubee's Big Adventure",
    pages: [
      {
        id: 1,
        text: "Once upon a time, there was a happy little bee named Jubee.",
        illustration: "🐝",
        narration: "Once upon a time, there was a happy little bee named Jubee."
      },
      {
        id: 2,
        text: "Jubee loved to fly through the colorful garden, visiting all the beautiful flowers.",
        illustration: "🌺🌻🌸",
        narration: "Jubee loved to fly through the colorful garden, visiting all the beautiful flowers."
      },
      {
        id: 3,
        text: "One day, Jubee met a friendly butterfly who wanted to play!",
        illustration: "🦋",
        narration: "One day, Jubee met a friendly butterfly who wanted to play!"
      },
      {
        id: 4,
        text: "Together, they danced among the flowers and had so much fun!",
        illustration: "🐝🦋💃",
        narration: "Together, they danced among the flowers and had so much fun!"
      },
      {
        id: 5,
        text: "When the sun began to set, Jubee flew back home, excited for tomorrow's adventures!",
        illustration: "🌅🐝🏡",
        narration: "When the sun began to set, Jubee flew back home, excited for tomorrow's adventures!"
      }
    ]
  },
  {
    id: 'counting-flowers',
    title: "Counting Flowers with Jubee",
    pages: [
      {
        id: 1,
        text: "Jubee woke up and decided to count all the flowers in the garden!",
        illustration: "🐝☀️",
        narration: "Jubee woke up and decided to count all the flowers in the garden!"
      },
      {
        id: 2,
        text: "First, Jubee found ONE beautiful red rose. 'That's one!' said Jubee.",
        illustration: "🌹",
        narration: "First, Jubee found ONE beautiful red rose. That's one! said Jubee."
      },
      {
        id: 3,
        text: "Then, Jubee saw TWO yellow sunflowers. 'One, two!' counted Jubee.",
        illustration: "🌻🌻",
        narration: "Then, Jubee saw TWO yellow sunflowers. One, two! counted Jubee."
      },
      {
        id: 4,
        text: "Next, Jubee spotted THREE pink flowers. 'One, two, three!' Jubee was so proud!",
        illustration: "🌸🌸🌸",
        narration: "Next, Jubee spotted THREE pink flowers. One, two, three! Jubee was so proud!"
      },
      {
        id: 5,
        text: "Jubee learned to count and made lots of nectar! What a wonderful day!",
        illustration: "🐝🍯✨",
        narration: "Jubee learned to count and made lots of nectar! What a wonderful day!"
      }
    ]
  }
]

export default function StoryTime() {
  const [selectedStory, setSelectedStory] = useState<typeof stories[0] | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const { speak, triggerAnimation } = useJubeeStore()
  const { addScore } = useGameStore()

  const handleStorySelect = (story: typeof stories[0]) => {
    setSelectedStory(story)
    setCurrentPage(0)
    triggerAnimation('excited')
    speak("Let's read a story together!")
  }

  const handleNextPage = () => {
    if (!selectedStory) return

    if (currentPage < selectedStory.pages.length - 1) {
      setCurrentPage(currentPage + 1)
      const nextPage = selectedStory.pages[currentPage + 1]
      speak(nextPage.narration)
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

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
      const prevPage = selectedStory!.pages[currentPage - 1]
      speak(prevPage.narration)
    }
  }

  const handleReadAloud = () => {
    if (!selectedStory) return
    const page = selectedStory.pages[currentPage]
    speak(page.narration)
    triggerAnimation('excited')
  }

  if (!selectedStory) {
    return (
      <div className="story-time-menu p-8">
        <h1 className="text-5xl font-bold text-center mb-8" style={{ color: '#FF4757' }}>
          📖 Story Time! 📖
        </h1>
        <p className="text-2xl text-center mb-12 text-gray-700">
          Choose a story to read with Jubee!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {stories.map((story) => (
            <button
              key={story.id}
              onClick={() => handleStorySelect(story)}
              className="story-card p-8 rounded-3xl transform hover:scale-105 transition-all duration-300 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #FFD93D 0%, #FF6348 100%)',
                border: '4px solid #FFD93D',
                boxShadow: '0 8px 20px rgba(255, 71, 87, 0.3)'
              }}
            >
              <div className="text-8xl mb-4">{story.pages[0].illustration}</div>
              <h2 className="text-3xl font-bold text-white mb-2">{story.title}</h2>
              <p className="text-xl text-white opacity-90">{story.pages.length} pages</p>
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
        <h1 className="text-4xl font-bold text-center mb-4" style={{ color: '#FF4757' }}>
          {selectedStory.title}
        </h1>
        <div className="progress-bar mb-4" style={{
          height: '12px',
          background: '#f0f0f0',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '2px solid #FFD93D'
        }}>
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #FFD93D 0%, #FF4757 100%)',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
        <p className="text-center text-xl text-gray-600">
          Page {currentPage + 1} of {selectedStory.pages.length}
        </p>
      </div>

      <div
        className="story-page p-12 rounded-3xl mb-8"
        style={{
          background: 'white',
          border: '4px solid #FFD93D',
          boxShadow: '0 8px 20px rgba(255, 217, 61, 0.3)',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div className="illustration text-9xl mb-8">{page.illustration}</div>
        <p className="text-3xl text-gray-800 text-center leading-relaxed">{page.text}</p>
      </div>

      <div className="controls flex gap-4 justify-center">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 0}
          className="px-8 py-4 text-2xl font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all"
          style={{
            background: currentPage === 0 ? '#ccc' : 'linear-gradient(135deg, #FFD93D 0%, #FF6348 100%)',
            color: 'white',
            border: '3px solid #FFD93D',
            boxShadow: '0 4px 10px rgba(255, 71, 87, 0.3)'
          }}
        >
          ⬅️ Previous
        </button>

        <button
          onClick={handleReadAloud}
          className="px-8 py-4 text-2xl font-bold rounded-full transform hover:scale-105 transition-all"
          style={{
            background: 'linear-gradient(135deg, #FF4757 0%, #FFD93D 100%)',
            color: 'white',
            border: '3px solid #FFD93D',
            boxShadow: '0 4px 10px rgba(255, 217, 61, 0.3)'
          }}
        >
          🔊 Read Aloud
        </button>

        <button
          onClick={handleNextPage}
          className="px-8 py-4 text-2xl font-bold rounded-full transform hover:scale-105 transition-all"
          style={{
            background: 'linear-gradient(135deg, #FF6348 0%, #FFD93D 100%)',
            color: 'white',
            border: '3px solid #FFD93D',
            boxShadow: '0 4px 10px rgba(255, 71, 87, 0.3)'
          }}
        >
          {currentPage === selectedStory.pages.length - 1 ? '✓ Finish' : 'Next ➡️'}
        </button>
      </div>
    </div>
  )
}
