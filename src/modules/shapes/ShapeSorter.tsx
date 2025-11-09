import { useState } from 'react'
import { useJubeeStore } from '../../store/useJubeeStore'
import { useGameStore } from '../../store/useGameStore'

type Shape = 'circle' | 'square' | 'triangle' | 'star'

const shapes: Shape[] = ['circle', 'square', 'triangle', 'star']

export default function ShapeSorter() {
  const [targetShape, setTargetShape] = useState<Shape>('circle')
  const [score, setScore] = useState(0)
  const { speak, triggerAnimation } = useJubeeStore()
  const { addScore } = useGameStore()

  const checkShape = (shape: Shape) => {
    if (shape === targetShape) {
      speak('Awesome! You found the right shape!')
      triggerAnimation('excited')
      addScore(15)
      setScore(score + 1)
      // Pick new random shape
      const newShape = shapes[Math.floor(Math.random() * shapes.length)]
      setTargetShape(newShape)
    } else {
      speak('Try again!')
    }
  }

  const getShapeEmoji = (shape: Shape) => {
    const emojis = {
      circle: '🔵',
      square: '🟦',
      triangle: '🔺',
      star: '⭐'
    }
    return emojis[shape]
  }

  return (
    <div className="shape-sorter-container">
      <h2 className="text-3xl font-bold text-center mb-4">Find the {targetShape}!</h2>
      <p className="text-xl text-center mb-8">Score: {score}</p>

      <div className="shapes-grid">
        {shapes.map((shape) => (
          <button
            key={shape}
            onClick={() => checkShape(shape)}
            className="shape-button"
          >
            <span className="text-8xl">{getShapeEmoji(shape)}</span>
            <span className="text-xl mt-2 capitalize">{shape}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-lg text-muted-foreground">Tap the {targetShape} {getShapeEmoji(targetShape)}</p>
      </div>
    </div>
  )
}
